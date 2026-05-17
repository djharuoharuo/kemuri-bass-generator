"""Build KemuriBeatPlugin.amxd from KemuriBeatPlugin.maxpat.

The .amxd format is a binary wrapper around the .maxpat JSON:

    [ampf][uint32_LE 4][<TYPE>meta][uint32_LE 4][uint32_LE 0][ptch][uint32_LE json_len][JSON]

TYPE selects the M4L device category:
    'aaaa' = Audio Effect
    'iiii' = Instrument
    'mmmm' = MIDI Effect       <-- KemuriBeat
    'nagg' = MIDI Generator
    'natt' = MIDI Transformation

Run:
    python build_amxd.py
"""
import os
import shutil
import struct
import sys

HERE     = os.path.dirname(os.path.abspath(__file__))
MAXPAT   = os.path.join(HERE, "KemuriBeatPlugin.maxpat")
AMXD_OUT = os.path.join(HERE, "KemuriBeatPlugin.amxd")
DEVICE_TYPE = b"mmmm"  # MIDI Effect

# Copy to Ableton User Library
USER_LIBRARIES = [
    r"D:\program files\ableton live song\User Library\Presets\MIDI Effects\Max MIDI Effect",
]


def build_amxd(maxpat_path: str, amxd_path: str, device_type: bytes = DEVICE_TYPE) -> int:
    with open(maxpat_path, "r", encoding="utf-8") as f:
        json_bytes = f.read().encode("utf-8")

    json_len = len(json_bytes)
    header = (
        b"ampf"
        + struct.pack("<I", 4)
        + device_type + b"meta"
        + struct.pack("<I", 4)
        + struct.pack("<I", 0)
        + b"ptch"
        + struct.pack("<I", json_len)
    )

    with open(amxd_path, "wb") as f:
        f.write(header)
        f.write(json_bytes)

    return len(header) + json_len


def main() -> int:
    if not os.path.isfile(MAXPAT):
        print(f"ERROR: not found: {MAXPAT}", file=sys.stderr)
        return 1

    total = build_amxd(MAXPAT, AMXD_OUT)
    print(f"Built: {AMXD_OUT}  ({total} bytes)")

    copied_any = False
    for lib in USER_LIBRARIES:
        if os.path.isdir(lib):
            for fn in ("KemuriBeatPlugin.amxd", "kemuri_generator.js", "kemuri_reader.js"):
                src = os.path.join(HERE, fn)
                dst = os.path.join(lib, fn)
                if os.path.isfile(src):
                    shutil.copy2(src, dst)
                    print(f"Copied -> {dst}")
            copied_any = True
    if not copied_any:
        print("(User Library not found, skipped copy)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
