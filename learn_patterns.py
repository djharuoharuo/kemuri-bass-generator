"""Batch WAV → Bass Pattern learning script.

Usage:
    python learn_patterns.py                  # uses ./training_data
    python learn_patterns.py <folder>         # custom folder

Folder layout (subfolders are optional):

    training_data/
        premier/        nas_is_like.wav, mass_appeal.wav, ...
        dilla/          fall_in_love.wav, workinonit.wav, ...
        9th/            threads.wav, ...
        (or just flat:) *.wav

If subfolders named premier / dilla / 9th (or ninth) exist, their patterns
are tagged accordingly and merged into the producer-specific libraries in
kemuri_generator.js. All learned patterns also go into the general pool
used by "Boom-Bap Mix" mode.

Pipeline:
    WAV → Demucs (bass stem) → basic-pitch (MIDI) → 1-bar pattern extractor
        → kemuri_generator.js inject → build_amxd.py

Skips already-processed files based on a cache JSON. Pass --no-cache to
re-process everything.
"""
from __future__ import annotations
import argparse
import json
import os
import sys
import tempfile
from pathlib import Path

from learning.bass_separator import separate_bass
from learning.audio_to_midi import audio_to_midi
from learning.pattern_extractor import extract_patterns
from learning.pattern_writer import inject_patterns

PROJECT_ROOT  = Path(__file__).parent.resolve()
GENERATOR_JS  = PROJECT_ROOT / "max_for_live" / "kemuri_generator.js"
BUILD_SCRIPT  = PROJECT_ROOT / "max_for_live" / "build_amxd.py"
CACHE_FILE    = PROJECT_ROOT / "learning" / ".pattern_cache.json"

AUDIO_EXTS = {".wav", ".mp3", ".flac", ".aiff", ".aif", ".m4a"}
PRODUCER_FOLDERS = {
    "premier": "premier",
    "dilla":   "dilla",
    "9th":     "ninth",
    "ninth":   "ninth",
}


def _load_cache() -> dict:
    if CACHE_FILE.is_file():
        try:
            return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def _save_cache(data: dict) -> None:
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    CACHE_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False),
                          encoding="utf-8")


def _walk_audio(root: Path) -> list[tuple[Path, str | None]]:
    """Return [(audio_path, producer_tag_or_None), ...] under `root`."""
    items: list[tuple[Path, str | None]] = []
    if not root.is_dir():
        return items
    # Producer subfolders
    for sub in root.iterdir():
        if sub.is_dir():
            tag = PRODUCER_FOLDERS.get(sub.name.lower())
            for p in sub.rglob("*"):
                if p.is_file() and p.suffix.lower() in AUDIO_EXTS:
                    items.append((p, tag))
    # Top-level loose files
    for p in root.iterdir():
        if p.is_file() and p.suffix.lower() in AUDIO_EXTS:
            items.append((p, None))
    return items


def process_one(audio_path: Path, work_dir: Path) -> list[dict]:
    """Demucs → basic-pitch → pattern extraction. Returns pattern list."""
    print(f"\n=== {audio_path.name} ===")
    print("  · separating bass stem (demucs)…")
    bass_wav = separate_bass(str(audio_path), output_dir=str(work_dir / "demucs"))
    print(f"  · converting to MIDI (basic-pitch)…")
    midi_path = audio_to_midi(bass_wav, output_dir=str(work_dir / "midi"))
    print(f"  · extracting 1-bar patterns…")
    pats = extract_patterns(midi_path, source_tag=audio_path.stem)
    print(f"    -> {len(pats)} patterns")
    return pats


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("folder", nargs="?", default=str(PROJECT_ROOT / "training_data"),
                    help="Folder containing WAVs (default: ./training_data)")
    ap.add_argument("--no-cache", action="store_true",
                    help="Re-process all files even if cached")
    ap.add_argument("--no-build", action="store_true",
                    help="Skip running build_amxd.py at the end")
    args = ap.parse_args()

    folder = Path(args.folder).resolve()
    if not folder.is_dir():
        print(f"ERROR: folder not found: {folder}", file=sys.stderr)
        return 1

    audio_items = _walk_audio(folder)
    if not audio_items:
        print(f"No audio files found under {folder}")
        print("Expected layout: training_data/<producer>/*.wav  or  training_data/*.wav")
        return 1

    print(f"Found {len(audio_items)} audio files under {folder}")
    cache = {} if args.no_cache else _load_cache()

    all_patterns: list[dict] = []
    by_producer: dict[str, list[dict]] = {"premier": [], "dilla": [], "ninth": []}

    with tempfile.TemporaryDirectory(prefix="kemuri_learn_") as tmp_root:
        work_dir = Path(tmp_root)
        for audio_path, tag in audio_items:
            key = str(audio_path.resolve())
            mtime = os.path.getmtime(audio_path)
            cached = cache.get(key)
            if cached and cached.get("mtime") == mtime:
                pats = cached["patterns"]
                print(f"\n=== {audio_path.name} (cached: {len(pats)} patterns) ===")
            else:
                try:
                    pats = process_one(audio_path, work_dir)
                except Exception as e:
                    print(f"  !! failed: {e}", file=sys.stderr)
                    continue
                cache[key] = {"mtime": mtime, "tag": tag, "patterns": pats}

            all_patterns.extend(pats)
            if tag and tag in by_producer:
                by_producer[tag].extend(pats)

    _save_cache(cache)
    print(f"\nTotal: {len(all_patterns)} learned patterns")

    if not all_patterns:
        print("No patterns extracted; nothing to inject.")
        return 0

    inject_patterns(str(GENERATOR_JS), all_patterns, by_producer)

    if not args.no_build:
        print("\nRebuilding .amxd…")
        import subprocess
        subprocess.run([sys.executable, str(BUILD_SCRIPT)], check=True)

    print("\nDone. Ableton 側でプラグインを再ドラッグすると、学習パターンが反映されます。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
