"""Audio file analysis: BPM, key, chord estimation using librosa."""

import numpy as np
import librosa

AUDIO_EXTENSIONS = (".wav", ".mp3", ".aiff", ".aif", ".flac", ".ogg", ".m4a")

NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F",
              "F#", "G", "G#", "A", "A#", "B"]

# Krumhansl-Schmuckler profiles
_MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09,
                            2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
_MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53,
                            2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

# Chord templates (12 semitones): major, minor, dominant7, minor7
_CHORD_TEMPLATES = {
    "major":  np.array([1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0], dtype=float),
    "minor":  np.array([1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0], dtype=float),
    "dom7":   np.array([1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], dtype=float),
    "min7":   np.array([1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0], dtype=float),
}


def analyze_audio(filepath: str) -> dict:
    """
    Analyze an audio file and return BPM, key, and per-bar chord info.
    """
    y, sr = _load_audio(filepath)

    # Separate harmonic content — much cleaner chord detection
    y_harm = librosa.effects.harmonic(y, margin=4)

    bpm, beat_frames = _detect_bpm(y, sr)
    key_info = _detect_key(y_harm, sr)
    chords = _detect_chords_beat_sync(y_harm, sr, beat_frames, bpm)

    return {
        "bpm": bpm,
        "key": key_info,
        "chords": chords,
        "root_notes": _to_bass_root_notes(chords),
        "filepath": filepath,
    }


def analyze_reference_midi(filepath: str) -> dict:
    """Extract rhythm pattern from a reference MIDI bass file."""
    from music21 import converter, note as m21note, tempo as m21tempo

    score = converter.parse(filepath)
    notes_data = []
    for element in score.flat.notesAndRests:
        if isinstance(element, m21note.Note):
            notes_data.append({
                "pitch": element.pitch.midi,
                "offset": float(element.offset),
                "duration": float(element.duration.quarterLength),
                "velocity": element.volume.velocity or 80,
            })
        elif isinstance(element, m21note.Rest):
            notes_data.append({
                "pitch": None,
                "offset": float(element.offset),
                "duration": float(element.duration.quarterLength),
                "velocity": 0,
            })

    tempos = score.flat.getElementsByClass(m21tempo.MetronomeMark)
    bpm = float(tempos[0].number) if tempos else 120.0

    return {
        "bpm": bpm,
        "notes": notes_data,
        "rhythm_pattern": _extract_rhythm_pattern(notes_data),
    }


# ── Internal helpers ─────────────────────────────────────────

def _load_audio(filepath: str):
    try:
        y, sr = librosa.load(filepath, sr=22050, mono=True, duration=120.0)
    except Exception as e:
        raise RuntimeError(
            f"音声ファイルの読み込みに失敗しました。\n"
            f"対応フォーマット: WAV, MP3, FLAC, AIFF, OGG\n詳細: {e}"
        )
    return y, sr


def _detect_bpm(y, sr):
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, units="frames")
    bpm = float(np.atleast_1d(tempo)[0])
    bpm = round(bpm * 2) / 2  # round to nearest 0.5
    return bpm, beat_frames


def _detect_key(y_harm, sr) -> dict:
    chroma = librosa.feature.chroma_cqt(y=y_harm, sr=sr)
    mean_chroma = chroma.mean(axis=1)

    best_score = -np.inf
    best_root, best_mode = 0, "major"

    for root in range(12):
        shifted = np.roll(mean_chroma, -root)
        for mode, profile in [("major", _MAJOR_PROFILE), ("minor", _MINOR_PROFILE)]:
            score = float(np.corrcoef(shifted, profile)[0, 1])
            if score > best_score:
                best_score = score
                best_root = root
                best_mode = mode

    return {"tonic": NOTE_NAMES[best_root], "mode": best_mode, "midi_root": best_root}


def _detect_chords_beat_sync(y_harm, sr, beat_frames, bpm: float) -> list:
    """
    Beat-synchronous chroma → chord template matching per bar.
    Returns one chord dict per bar with quality (major/minor/dom7/min7).
    """
    hop_length = 512
    chroma = librosa.feature.chroma_cqt(y=y_harm, sr=sr, hop_length=hop_length)

    # Sync chroma to beats
    if len(beat_frames) > 1:
        chroma_sync = librosa.util.sync(chroma, beat_frames, aggregate=np.median)
    else:
        chroma_sync = chroma

    # Apply median filter per chroma bin to smooth noise
    from scipy.ndimage import median_filter
    chroma_smooth = median_filter(chroma_sync, size=(1, 3))

    beats_per_bar = 4
    chords = []
    num_beats = chroma_smooth.shape[1]
    bar_idx = 0

    while bar_idx * beats_per_bar < num_beats:
        start_b = bar_idx * beats_per_bar
        end_b = min(start_b + beats_per_bar, num_beats)
        bar_chroma = chroma_smooth[:, start_b:end_b].mean(axis=1)

        root, quality = _match_chord_template(bar_chroma)
        offset_qn = bar_idx * 4.0

        chords.append({
            "offset": offset_qn,
            "duration": 4.0,
            "root_midi": root + 36,
            "root_name": NOTE_NAMES[root],
            "quality": quality,
        })
        bar_idx += 1

    return chords


def _match_chord_template(chroma_vec: np.ndarray):
    """Return (root_semitone, quality_str) via template matching."""
    best_score = -np.inf
    best_root, best_quality = 0, "major"

    norm = np.linalg.norm(chroma_vec)
    if norm < 1e-6:
        return 0, "major"
    chroma_norm = chroma_vec / norm

    for quality, template in _CHORD_TEMPLATES.items():
        t_norm = template / np.linalg.norm(template)
        for root in range(12):
            rolled = np.roll(t_norm, root)
            score = float(np.dot(chroma_norm, rolled))
            if score > best_score:
                best_score = score
                best_root = root
                best_quality = quality

    return best_root, best_quality


def _to_bass_root_notes(chords: list) -> list:
    BASS_MIN, BASS_MAX = 28, 47
    roots = []
    for c in chords:
        midi = c["root_midi"]
        while midi < BASS_MIN:
            midi += 12
        while midi > BASS_MAX:
            midi -= 12
        roots.append({
            "offset": c["offset"],
            "duration": c["duration"],
            "midi": midi,
            "name": c["root_name"],
            "quality": c.get("quality", "major"),
        })
    return roots


def _extract_rhythm_pattern(notes_data: list) -> list:
    if not notes_data:
        return []
    bar_length = 4.0
    return [
        {
            "offset_normalized": (n["offset"] % bar_length) / bar_length,
            "duration_normalized": min(n["duration"] / bar_length, 1.0),
            "pitch_class": n["pitch"] % 12,
        }
        for n in notes_data if n["pitch"] is not None
    ]
