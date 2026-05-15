"""Bass line generation logic."""

import random
from typing import Optional
from styles import STYLES

BASS_MIN = 28  # E1
BASS_MAX = 47  # B2

# Scale intervals per mode
SCALE_INTERVALS = {
    "major":      [0, 2, 4, 5, 7, 9, 11],
    "minor":      [0, 2, 3, 5, 7, 8, 10],
    "dorian":     [0, 2, 3, 5, 7, 9, 10],
    "mixolydian": [0, 2, 4, 5, 7, 9, 10],
}

# Chord tone intervals per quality (root=0)
CHORD_TONES = {
    "major": [0, 4, 7],
    "minor": [0, 3, 7],
    "dom7":  [0, 4, 7, 10],
    "min7":  [0, 3, 7, 10],
}


def generate_bassline(
    analysis: dict,
    style_name: str,
    complexity: float,
    fill: float,
    bars: int,
    bpm: Optional[float] = None,
) -> list:
    style = STYLES.get(style_name, list(STYLES.values())[0])()
    root_notes = analysis.get("root_notes", [])
    key_info = analysis.get("key", {"tonic": "C", "mode": "major", "midi_root": 0})

    notes = []
    bar_length = 4.0

    for bar_idx in range(bars):
        bar_offset = bar_idx * bar_length
        is_fill_bar = (fill > 50) and ((bar_idx + 1) % 4 == 0)

        root_info = _get_root_info_for_bar(root_notes, bar_offset, bar_length)
        root_midi = root_info["midi"]
        quality = root_info.get("quality", "major")

        scale = _build_scale(root_midi, key_info.get("mode", "major"))
        chord_tones = _build_chord_tones(root_midi, quality)
        pattern = _build_pattern(style, complexity, is_fill_bar)

        for step in pattern:
            step_offset = bar_offset + step["offset"]
            pitch = _choose_pitch(step, root_midi, scale, chord_tones, complexity)
            velocity = _compute_velocity(step["velocity_mult"], complexity)

            notes.append({
                "pitch": pitch,
                "velocity": velocity,
                "start": step_offset,
                "duration": step["duration"],
            })

    return notes


def generate_bassline_from_reference(
    reference: dict,
    analysis: dict,
    style_name: str,
    complexity: float,
    fill: float,
    bars: int,
) -> list:
    rhythm = reference.get("rhythm_pattern", [])
    root_notes = analysis.get("root_notes", [])
    key_info = analysis.get("key", {"tonic": "C", "mode": "major", "midi_root": 0})

    if not rhythm:
        return generate_bassline(analysis, style_name, complexity, fill, bars)

    notes = []
    bar_length = 4.0

    for bar_idx in range(bars):
        bar_offset = bar_idx * bar_length
        root_info = _get_root_info_for_bar(root_notes, bar_offset, bar_length)
        root_midi = root_info["midi"]
        quality = root_info.get("quality", "major")
        scale = _build_scale(root_midi, key_info.get("mode", "major"))
        chord_tones = _build_chord_tones(root_midi, quality)

        for step in rhythm:
            offset = bar_offset + step["offset_normalized"] * bar_length
            duration = max(0.125, step["duration_normalized"] * bar_length)
            pitch = _map_pitch_class_to_bass(step["pitch_class"], root_midi, scale, chord_tones)
            velocity = int(80 * (0.7 + 0.3 * complexity / 100))

            notes.append({
                "pitch": pitch,
                "velocity": min(127, velocity),
                "start": offset,
                "duration": duration,
            })

    return notes


# ── Pitch helpers ─────────────────────────────────────────────

def _build_scale(root_midi: int, mode: str) -> list:
    intervals = SCALE_INTERVALS.get(mode, SCALE_INTERVALS["major"])
    root_class = root_midi % 12
    scale = []
    for octave in range(3):
        for interval in intervals:
            midi = root_class + interval + (octave + 1) * 12
            if BASS_MIN <= midi <= BASS_MAX:
                scale.append(midi)
    return scale or [root_midi]


def _build_chord_tones(root_midi: int, quality: str) -> list:
    intervals = CHORD_TONES.get(quality, CHORD_TONES["major"])
    tones = []
    for interval in intervals:
        midi = _clamp_bass(root_midi + interval)
        tones.append(midi)
    return tones


def _choose_pitch(step: dict, root_midi: int, scale: list,
                  chord_tones: list, complexity: float) -> int:
    offset = step["offset"]

    # Downbeat: always root
    if offset == 0.0:
        return _clamp_bass(root_midi)

    # Strong beats (beat 3): prefer root or 5th
    if offset == 2.0:
        fifth = _clamp_bass(root_midi + 7)
        return fifth if random.random() < 0.5 else _clamp_bass(root_midi)

    # Chromatic approach note: probability scales with complexity
    approach_prob = (complexity / 100.0) * 0.25
    if random.random() < approach_prob:
        target = random.choice(chord_tones)
        approach = target + random.choice([-1, 1])
        if BASS_MIN <= approach <= BASS_MAX:
            return approach

    # High complexity: use chord tones more
    chord_tone_prob = 0.3 + (complexity / 100.0) * 0.4
    if chord_tones and random.random() < chord_tone_prob:
        return random.choice(chord_tones)

    # Default: scale tones (prefer lower half = more bass-like)
    pool = scale[:max(1, len(scale) // 2)]
    return random.choice(pool) if pool else _clamp_bass(root_midi)


def _map_pitch_class_to_bass(pitch_class: int, root_midi: int,
                              scale: list, chord_tones: list) -> int:
    root_class = root_midi % 12
    interval = (pitch_class - root_class) % 12
    candidate = root_midi + interval
    candidate = _clamp_bass(candidate)
    # Snap to nearest scale tone
    if scale and candidate not in scale:
        candidate = min(scale, key=lambda s: abs(s - candidate))
    return candidate


def _compute_velocity(mult: float, complexity: float) -> int:
    base = 72 + int(complexity * 0.12)
    vel = int(base * mult) + random.randint(-4, 4)
    return max(40, min(127, vel))


def _clamp_bass(midi: int) -> int:
    while midi < BASS_MIN:
        midi += 12
    while midi > BASS_MAX:
        midi -= 12
    return midi


# ── Bar context helpers ───────────────────────────────────────

def _get_root_info_for_bar(root_notes: list, bar_offset: float, bar_length: float) -> dict:
    fallback = {"midi": 36, "quality": "major", "name": "C"}
    if not root_notes:
        return fallback

    bar_end = bar_offset + bar_length
    candidates = [r for r in root_notes if r["offset"] < bar_end]
    if not candidates:
        return root_notes[-1]

    in_bar = [r for r in candidates if r["offset"] >= bar_offset]
    return in_bar[0] if in_bar else candidates[-1]


def _build_pattern(style, complexity: float, is_fill_bar: bool) -> list:
    pattern = list(style.base_pattern)
    if is_fill_bar:
        pattern = [s for s in pattern if s["offset"] < 2.5]
        pattern += list(style.fill_pattern)
    elif complexity > 50:
        extra_prob = (complexity - 50) / 50.0
        for extra in style.complexity_extras:
            if random.random() < extra_prob:
                pattern.append(extra)
        pattern.sort(key=lambda x: x["offset"])
    return pattern
