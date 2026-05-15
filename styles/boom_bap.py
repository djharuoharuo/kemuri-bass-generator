"""Boom-Bap bass style: accent on beats 2 & 4, light syncopation."""


class BoomBapStyle:
    name = "Boom-Bap"

    # Beat offsets in quarter notes within a 4/4 bar
    # Strong hits on beat 1 and 3; accents implied on 2 & 4 via velocity
    base_pattern = [
        {"offset": 0.0,  "duration": 1.0,  "velocity_mult": 1.0},
        {"offset": 2.0,  "duration": 0.75, "velocity_mult": 0.9},
        {"offset": 3.0,  "duration": 0.5,  "velocity_mult": 0.75},
        {"offset": 3.5,  "duration": 0.5,  "velocity_mult": 0.7},
    ]

    # Extra syncopation offsets added when complexity is high
    complexity_extras = [
        {"offset": 1.5,  "duration": 0.5,  "velocity_mult": 0.65},
        {"offset": 2.5,  "duration": 0.25, "velocity_mult": 0.6},
    ]

    # Fill pattern replacing last beat of a 4-bar phrase
    fill_pattern = [
        {"offset": 3.0,  "duration": 0.25, "velocity_mult": 0.85},
        {"offset": 3.25, "duration": 0.25, "velocity_mult": 0.8},
        {"offset": 3.5,  "duration": 0.25, "velocity_mult": 0.75},
        {"offset": 3.75, "duration": 0.25, "velocity_mult": 0.7},
    ]
