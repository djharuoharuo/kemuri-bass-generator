"""Inject learned patterns into kemuri_generator.js.

We replace blocks that look like:

    var USER_PATTERNS = [];

with the serialised learned patterns. For producer-tagged learning, we also
append USER_PATTERNS_PREMIER / _DILLA / _NINTH arrays that the JS code can
merge into the corresponding hard-coded library.

Markers in the JS file are used so we can safely re-run this without
duplicating data:

    // ─ LEARNED-PATTERNS-START ─
    var USER_PATTERNS = [...]
    var USER_PATTERNS_PREMIER = [...]
    var USER_PATTERNS_DILLA   = [...]
    var USER_PATTERNS_NINTH   = [...]
    // ─ LEARNED-PATTERNS-END ─
"""
from __future__ import annotations
from typing import Any
import json
import os
import re

START_MARK = "// ─ LEARNED-PATTERNS-START ─"
END_MARK   = "// ─ LEARNED-PATTERNS-END ─"

# Anchor we will append the learned-patterns block right after, if no markers
# exist yet. This is the original `var USER_PATTERNS = [];` line.
ANCHOR_RE = re.compile(r"^var USER_PATTERNS\s*=\s*\[\];\s*$", re.MULTILINE)


def _to_js_array(patterns: list[dict[str, Any]], indent: str = "    ") -> str:
    """Serialise a list of pattern dicts to a JS array literal."""
    if not patterns:
        return "[]"
    parts = ["["]
    for p in patterns:
        notes_str = ", ".join(
            "{ pos: %s, dur: %s, pitch: %s }" % (
                _num(n["pos"]), _num(n["dur"]), _pitch(n["pitch"])
            )
            for n in p["notes"]
        )
        # Wrap long notes lines
        parts.append(f'{indent}{{ name: {json.dumps(p["name"])}, notes: [ {notes_str} ] }},')
    parts.append("]")
    return "\n".join(parts)


def _num(x) -> str:
    if isinstance(x, int):
        return str(x)
    return str(round(float(x), 3))


def _pitch(p) -> str:
    if isinstance(p, str):
        return json.dumps(p)
    return str(int(p))


def inject_patterns(generator_js_path: str,
                    pool: list[dict[str, Any]],
                    by_producer: dict[str, list[dict[str, Any]]] | None = None) -> None:
    """Write the patterns block into kemuri_generator.js (idempotent)."""
    by_producer = by_producer or {}

    with open(generator_js_path, "r", encoding="utf-8") as f:
        src = f.read()

    block_lines = [
        START_MARK,
        "var USER_PATTERNS = " + _to_js_array(pool) + ";",
    ]
    # Per-producer extension arrays (any tag we got, but we promise to define
    # the three canonical ones for genPremier/genDilla/genNinth to merge).
    canonical = ["premier", "dilla", "ninth"]
    for tag in canonical:
        prods = by_producer.get(tag, [])
        var_name = "USER_PATTERNS_" + tag.upper()
        block_lines.append(f"var {var_name} = " + _to_js_array(prods) + ";")
    block_lines.append(END_MARK)
    block_str = "\n".join(block_lines)

    if START_MARK in src and END_MARK in src:
        # Replace existing block
        pre  = src.split(START_MARK)[0]
        post = src.split(END_MARK, 1)[1]
        out  = pre + block_str + post
    else:
        # Find the anchor `var USER_PATTERNS = [];` and replace it
        m = ANCHOR_RE.search(src)
        if not m:
            raise RuntimeError(
                "Could not find `var USER_PATTERNS = [];` anchor in "
                + generator_js_path
            )
        out = src[:m.start()] + block_str + src[m.end():]

    with open(generator_js_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(out)

    total = len(pool) + sum(len(v) for v in by_producer.values())
    print(f"Injected {total} learned patterns into {generator_js_path}")
    for tag, prods in by_producer.items():
        if prods:
            print(f"  · {tag}: {len(prods)}")
    if pool:
        print(f"  · general pool (Boom-Bap Mix): {len(pool)}")
