"""Funk bass style: 16th-note driven, slap-style rhythmic feel."""


class FunkStyle:
    name = "Funk"

    base_pattern = [
        {"offset": 0.0,   "duration": 0.25, "velocity_mult": 1.0},
        {"offset": 0.5,   "duration": 0.25, "velocity_mult": 0.7},
        {"offset": 0.75,  "duration": 0.25, "velocity_mult": 0.65},
        {"offset": 1.0,   "duration": 0.25, "velocity_mult": 0.85},
        {"offset": 1.5,   "duration": 0.25, "velocity_mult": 0.7},
        {"offset": 2.0,   "duration": 0.25, "velocity_mult": 0.9},
        {"offset": 2.25,  "duration": 0.25, "velocity_mult": 0.6},
        {"offset": 2.75,  "duration": 0.25, "velocity_mult": 0.65},
        {"offset": 3.0,   "duration": 0.25, "velocity_mult": 0.8},
        {"offset": 3.5,   "duration": 0.25, "velocity_mult": 0.7},
        {"offset": 3.75,  "duration": 0.25, "velocity_mult": 0.6},
    ]

    complexity_extras = [
        {"offset": 0.25,  "duration": 0.25, "velocity_mult": 0.55},
        {"offset": 1.25,  "duration": 0.25, "velocity_mult": 0.55},
        {"offset": 2.5,   "duration": 0.25, "velocity_mult": 0.55},
    ]

    fill_pattern = [
        {"offset": 3.0,   "duration": 0.25, "velocity_mult": 0.9},
        {"offset": 3.25,  "duration": 0.25, "velocity_mult": 0.8},
        {"offset": 3.5,   "duration": 0.25, "velocity_mult": 0.85},
        {"offset": 3.75,  "duration": 0.25, "velocity_mult": 0.75},
    ]
