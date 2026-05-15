"""Lo-Fi bass style: simple, repetitive, minimal movement."""


class LoFiStyle:
    name = "Lo-Fi"

    base_pattern = [
        {"offset": 0.0,  "duration": 1.5,  "velocity_mult": 0.85},
        {"offset": 2.0,  "duration": 1.0,  "velocity_mult": 0.75},
        {"offset": 3.0,  "duration": 1.0,  "velocity_mult": 0.7},
    ]

    complexity_extras = [
        {"offset": 1.5,  "duration": 0.5,  "velocity_mult": 0.6},
        {"offset": 3.5,  "duration": 0.5,  "velocity_mult": 0.55},
    ]

    fill_pattern = [
        {"offset": 2.5,  "duration": 0.5,  "velocity_mult": 0.7},
        {"offset": 3.0,  "duration": 0.5,  "velocity_mult": 0.65},
        {"offset": 3.5,  "duration": 0.5,  "velocity_mult": 0.6},
    ]
