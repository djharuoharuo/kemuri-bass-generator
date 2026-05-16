// kemuri_generator.js
// KemuriBeat Bass Generator
// Inlets: 0=trigger, 1=style, 2=complexity, 3=fill, 4=bars, 5=root, 6=mode, 7=slot,
//         8=analysis from Python, 9=variations, 10=source_track, 11=source_slot, 12=analyze_bang
// Outlets: 0=status, 1=root(for menu), 2=mode(for menu), 3=bpm(display)

inlets  = 15;   // 13=note pitch from reader, 14=done bang from reader
outlets = 6;    // 4=reader trigger [track,slot], 5=live.path set message

var g_style        = 0;
var g_complexity   = 30;
var g_fill         = 20;
var g_bars         = 4;
var g_root         = 0;
var g_mode         = 0;
var g_slot         = 0;
var g_variations   = 1;
var g_source_track = 0;
var g_source_slot  = 0;

// Krumhansl-Schmuckler key profiles
var KS_MAJOR = [6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88];
var KS_MINOR = [6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17];

// ── Style patterns ────────────────────────────────────────────
var STYLES = [
    // 0: Boom-Bap
    { name: "Boom-Bap",
      base:   [{o:0,   d:1.0,  v:1.0 },{o:2,   d:0.75, v:0.9 },{o:3,   d:0.5,  v:0.75},{o:3.5, d:0.5,  v:0.7 }],
      extras: [{o:1.5, d:0.5,  v:0.65},{o:2.5, d:0.25, v:0.6 }],
      fill:   [{o:3,   d:0.25, v:0.85},{o:3.25,d:0.25, v:0.8 },{o:3.5, d:0.25, v:0.75},{o:3.75,d:0.25, v:0.7 }] },
    // 1: Soul-Jazz
    { name: "Soul-Jazz",
      base:   [{o:0,   d:0.5,  v:1.0 },{o:0.5, d:0.5,  v:0.75},{o:1,   d:0.5,  v:0.85},{o:1.5, d:0.5,  v:0.7 },
               {o:2,   d:0.5,  v:0.9 },{o:2.5, d:0.5,  v:0.75},{o:3,   d:0.5,  v:0.8 },{o:3.5, d:0.5,  v:0.7 }],
      extras: [{o:0.75,d:0.25, v:0.6 },{o:1.75,d:0.25, v:0.6 },{o:2.75,d:0.25, v:0.6 }],
      fill:   [{o:2.5, d:0.25, v:0.8 },{o:2.75,d:0.25, v:0.75},{o:3,   d:0.25, v:0.85},{o:3.25,d:0.25, v:0.8 },{o:3.5, d:0.25, v:0.75},{o:3.75,d:0.25, v:0.7 }] },
    // 2: Funk
    { name: "Funk",
      base:   [{o:0,   d:0.25, v:1.0 },{o:0.5, d:0.25, v:0.7 },{o:0.75,d:0.25, v:0.65},{o:1,   d:0.25, v:0.85},
               {o:1.5, d:0.25, v:0.7 },{o:2,   d:0.25, v:0.9 },{o:2.25,d:0.25, v:0.6 },{o:2.75,d:0.25, v:0.65},
               {o:3,   d:0.25, v:0.8 },{o:3.5, d:0.25, v:0.7 },{o:3.75,d:0.25, v:0.6 }],
      extras: [{o:0.25,d:0.25, v:0.55},{o:1.25,d:0.25, v:0.55},{o:2.5, d:0.25, v:0.55}],
      fill:   [{o:3,   d:0.25, v:0.9 },{o:3.25,d:0.25, v:0.8 },{o:3.5, d:0.25, v:0.85},{o:3.75,d:0.25, v:0.75}] },
    // 3: Lo-Fi
    { name: "Lo-Fi",
      base:   [{o:0,   d:1.5,  v:0.85},{o:2,   d:1.0,  v:0.75},{o:3,   d:1.0,  v:0.7 }],
      extras: [{o:1.5, d:0.5,  v:0.6 },{o:3.5, d:0.5,  v:0.55}],
      fill:   [{o:2.5, d:0.5,  v:0.7 },{o:3,   d:0.5,  v:0.65},{o:3.5, d:0.5,  v:0.6 }] }
];

var SCALE_MAJOR  = [0,2,4,5,7,9,11];
var SCALE_MINOR  = [0,2,3,5,7,8,10];
var CHORD_MAJOR  = [0,4,7];
var CHORD_MINOR  = [0,3,7];
var BASS_MIN = 28;
var BASS_MAX = 47;
var NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

var NOTE_NAMES_MAP = {"C":0,"C#":1,"Db":1,"D":2,"D#":3,"Eb":3,"E":4,"F":5,
                      "F#":6,"Gb":6,"G":7,"G#":8,"Ab":8,"A":9,"A#":10,"Bb":10,"B":11};

// ── Inlet handlers ────────────────────────────────────────────
function bang() {
    if (inlet == 0)  generate();
    if (inlet == 12) analyzeSource();
    if (inlet == 14) _finishMidiAnalysis();  // "done" from reader
}

function msg_int(v) {
    switch(inlet) {
        case 0:  if (v == 1) generate(); break;
        case 1:  g_style        = v; break;
        case 2:  g_complexity   = v; break;
        case 3:  g_fill         = v; break;
        case 4:
            // menu index 0-2 → 4,8,16 bars (direct connection from menu-bars)
            var barMap = [4, 8, 16];
            g_bars = barMap[Math.max(0, Math.min(2, v))];
            post("KemuriBeat: bars=" + g_bars + "\n");
            break;
        case 5:  g_root         = v; break;
        case 6:  g_mode         = v; break;
        case 7:  g_slot         = v; break;
        case 9:  g_variations   = Math.max(1, Math.min(8, v)); break;
        case 10: g_source_track = v; break;
        case 11: g_source_slot  = v; break;
        case 12: if (v == 1) analyzeSource(); break;
        case 13:
            // Note pitch received from kemuri_reader.js during analysis
            if (v >= 0 && v < 128) _pitchHist[v % 12] += 1;
            break;
    }
}
function msg_float(v) { msg_int(Math.round(v)); }

// Called from Python OSC: "C minor 92.0"
function set_analysis(rootName, modeName, bpm) {
    var r = NOTE_NAMES_MAP[rootName];
    if (r !== undefined) { g_root = r; outlet(1, r); }
    var m = (modeName === "minor") ? 1 : 0;
    g_mode = m;
    outlet(2, m);
    var b = parseFloat(bpm) || 120.0;
    outlet(3, "set", "BPM: " + b.toFixed(1) + " / Key: " + rootName + " " + modeName);
    outlet(0, "set", "解析結果受信: " + rootName + " " + modeName + " BPM:" + b.toFixed(1) + " → 生成ボタンを押してください");
}

// ── Main generation ───────────────────────────────────────────
function generate() {
    try {
        var song = new LiveAPI("live_set");
        var bpm  = parseFloat(song.get("tempo")[0]);
        var keyName = NOTE_NAMES[g_root] + " " + (g_mode == 0 ? "Major" : "Minor");

        for (var v = 0; v < g_variations; v++) {
            var notes = buildNotes(bpm);
            writeToClip(notes, g_slot + v);
        }

        var varLabel = (g_variations > 1)
            ? g_variations + "パターン生成 (Slot" + g_slot + "〜" + (g_slot + g_variations - 1) + ")"
            : STYLES[g_style].name;
        outlet(0, "set", "Done: " + varLabel + " | " + keyName + " | " + g_bars + "bars | BPM " + bpm.toFixed(1));
    } catch(e) {
        outlet(0, "set", "ERROR: " + e);
        post("KemuriBeat ERROR: " + e + "\n");
    }
}

// ── Build note list ───────────────────────────────────────────
// Phrase structure:
//   - Always grouped in 4-bar phrases.
//   - bar 0-2: groove (style-specific pattern on root)
//   - bar 3: turnaround (chromatic / scale approach to next phrase root)
//   - 8 bars: bar 7 = stronger development (climactic turnaround / fill)
//   - 16 bars: bar 15 = main climax; bar 7 = mid-development
//
// Fill (0-100): density of fill activity in last bar of each 4-bar phrase
// Complexity (0-100): probability of extras, octave jumps, passing tones, chromatic approaches
// Velocity: always 127
//
// Music theory references baked into per-style generators:
//   Boom-Bap: sub-bass on root with octave drops, syncopated rests,
//             minor pentatonic flourishes (J Dilla / Premier / Pete Rock).
//   Soul-Jazz: walking bass — quarter notes, beat-1 root, beat-4
//              chromatic/scale approach to next bar's root.
//   Funk: 16th-note groove (Jamerson), root + octave hits, ghost notes,
//         scale-tone passing on weak 16ths.
//   Lo-Fi: half-note / dotted feel; root and 5th, very sparse.
function buildNotes(bpm) {
    var ctx = makeKeyContext();
    var notes = [];

    // Map fill 0-100 → number of fill bars per 4-bar phrase (0..4)
    //   0       = 0 fill bars
    //   1-25    = 1
    //   26-50   = 2
    //   51-75   = 3
    //   76-100  = 4 (all bars get extra activity)
    var fillBars = (g_fill <= 0) ? 0 : Math.min(4, Math.ceil(g_fill / 25.0));

    for (var bar = 0; bar < g_bars; bar++) {
        var barInPhr        = bar % 4;
        var isLastOfPhrase  = (barInPhr === 3);
        var isLastBarTotal  = (bar === g_bars - 1);
        // Development: stronger turnaround in last bar of long sections
        var isDevelopment   = (g_bars >= 8) && isLastBarTotal;
        var midDevelopment  = (g_bars >= 16) && (bar === 7);
        var isFill          = fillBars > 0 && barInPhr >= (4 - fillBars);

        var barNotes = generateBar(g_style, {
            ctx: ctx,
            barIndex: bar,
            barInPhrase: barInPhr,
            isLastOfPhrase: isLastOfPhrase,
            isDevelopment: isDevelopment || midDevelopment,
            isFinalClimax: isDevelopment,
            isFill: isFill,
            compFactor: g_complexity / 100.0
        });

        var barOff = bar * 4.0;
        for (var i = 0; i < barNotes.length; i++) {
            barNotes[i].start += barOff;
            barNotes[i].vel = 127;
            notes.push(barNotes[i]);
        }
    }
    return notes;
}

// ── Key/scale context ──────────────────────────────────────────
function makeKeyContext() {
    var isMinor = (g_mode != 0);
    // For Boom-Bap / Lo-Fi we want a sub-bass anchor (E1-area).
    // For Jazz / Funk we want a mid-bass anchor (one octave up).
    var lowAnchor = 24 + g_root;   // C1+root  (24..35) → sub bass
    var midAnchor = 36 + g_root;   // C2+root  (36..47) → mid bass
    // Diatonic scale intervals
    var scale = isMinor ? SCALE_MINOR : SCALE_MAJOR;
    // Chord tones (1, 3, 5)
    var chord = isMinor ? CHORD_MINOR : CHORD_MAJOR;
    // Pentatonic for boom-bap flourishes
    var penta = isMinor ? [0,3,5,7,10] : [0,2,4,7,9];
    return {
        root: g_root,
        isMinor: isMinor,
        scale: scale,        // diatonic
        chord: chord,        // 1-3-5
        penta: penta,        // pentatonic
        lowAnchor: lowAnchor,
        midAnchor: midAnchor
    };
}

// Snap a pitch into the bass range without changing pitch class
function clampBass(midi) {
    while (midi < BASS_MIN) midi += 12;
    while (midi > BASS_MAX) midi -= 12;
    return midi;
}

// Snap a pitch toward an anchor octave (preferred octave)
function snapNear(midi, anchor) {
    while (midi - anchor > 6)  midi -= 12;
    while (anchor - midi > 6)  midi += 12;
    return clampBass(midi);
}

// ── Per-style bar generators ───────────────────────────────────
function generateBar(style, p) {
    switch (style) {
        case 0: return genBoomBap(p);
        case 1: return genSoulJazz(p);
        case 2: return genFunk(p);
        case 3: return genLoFi(p);
        default: return genBoomBap(p);
    }
}

// ── Style 0: Boom-Bap ──────────────────────────────────────────
// Root-heavy sub-bass, syncopated, lots of space, occasional octave drops.
// Turnaround uses chromatic approach (b2 below next root) or 5th.
function genBoomBap(p) {
    var ctx   = p.ctx;
    var notes = [];
    var root  = snapNear(ctx.lowAnchor, ctx.lowAnchor);   // sub-bass root
    var oct   = clampBass(root + 12);
    var fifth = clampBass(root + 7);
    var comp  = p.compFactor;

    // Beat 1: root (the foundation)
    notes.push({ pitch: root, start: 0.0, dur: 0.5 });

    // "And of 2" — J Dilla style anticipation hit
    if (Math.random() < 0.45 + comp * 0.35) {
        notes.push({ pitch: root, start: 1.5, dur: 0.5 });
    }

    // Beat 3: either root again, or octave-up call-and-response
    if (Math.random() < 0.5 + comp * 0.3) {
        // octave call
        notes.push({ pitch: oct, start: 2.0, dur: 0.5 });
        if (Math.random() < 0.6) {
            notes.push({ pitch: root, start: 2.5, dur: 0.5 });   // response
        }
    } else {
        notes.push({ pitch: root, start: 2.0, dur: 0.75 });
    }

    // Ghost / extras on weak 16ths driven by complexity
    if (comp > 0.4 && Math.random() < comp * 0.5) {
        var ghostPos = (Math.random() < 0.5) ? 0.75 : 2.75;
        notes.push({ pitch: root, start: ghostPos, dur: 0.25 });
    }

    // Turnaround on last bar of 4-bar phrase
    if (p.isLastOfPhrase) {
        // Chromatic approach (b2 below) at beat 4.5 → leads to next bar's root
        var approach = clampBass(root - 1);                       // half-step below
        notes.push({ pitch: approach, start: 3.5, dur: 0.5 });
    }

    // Development (8/16-bar last bar): bigger climactic move
    if (p.isFinalClimax) {
        // Pentatonic walk-up to top octave then resolve
        var pent = ctx.penta;
        notes.push({ pitch: clampBass(root + pent[1]), start: 3.0,  dur: 0.25 });
        notes.push({ pitch: clampBass(root + pent[2]), start: 3.25, dur: 0.25 });
        notes.push({ pitch: clampBass(root + pent[3]), start: 3.5,  dur: 0.25 });
        notes.push({ pitch: clampBass(root + pent[4]), start: 3.75, dur: 0.25 });
    } else if (p.isFill) {
        // Lighter fill — one extra pentatonic note before turnaround
        var pIdx = 1 + Math.floor(Math.random() * 3);
        notes.push({ pitch: clampBass(root + ctx.penta[pIdx]),
                     start: 3.0, dur: 0.25 });
    }

    return notes;
}

// ── Style 1: Soul-Jazz (walking bass) ─────────────────────────
// Quarter-note walking line: 1=root, 2=chord/scale tone,
// 3=chord tone or approach, 4=chromatic approach to next root.
function genSoulJazz(p) {
    var ctx   = p.ctx;
    var notes = [];
    var root  = snapNear(ctx.midAnchor, ctx.midAnchor);
    var comp  = p.compFactor;

    // Beat 1 — always root (rarely 5th below for variety)
    var beat1 = (Math.random() < 0.85) ? root : snapNear(root - 5, ctx.midAnchor);
    notes.push({ pitch: beat1, start: 0.0, dur: 0.95 });

    // Beat 2 — chord tone (3rd, 5th) or scale tone
    var beat2 = chordOrScale(root, ctx, comp);
    notes.push({ pitch: beat2, start: 1.0, dur: 0.95 });

    // Beat 3 — chord tone, often the 5th
    var beat3;
    if (Math.random() < 0.55) {
        beat3 = snapNear(root + 7, ctx.midAnchor);              // 5th
    } else {
        beat3 = chordOrScale(root, ctx, comp);
    }
    notes.push({ pitch: beat3, start: 2.0, dur: 0.95 });

    // Beat 4 — chromatic / diatonic approach to NEXT bar's root.
    // In a single-chord loop, "next root" = same root,
    // so we approach from a half-step above or below for tension.
    var target = root;
    var approach;
    if (comp > 0.3 && Math.random() < 0.55 + comp * 0.3) {
        // chromatic half-step approach (above/below)
        approach = clampBass(target + (Math.random() < 0.5 ? -1 : 1));
    } else {
        // diatonic step approach
        var dir = (Math.random() < 0.5) ? -1 : 1;
        approach = snapNear(root + (dir * 2), ctx.midAnchor);   // whole step
    }
    notes.push({ pitch: approach, start: 3.0, dur: 0.95 });

    // Fill / development — add an 8th note pickup before beat 1 of next bar
    if (p.isFill || p.isDevelopment) {
        // Eighth-note pickup on the "and of 4"
        var pickupPool = ctx.chord;
        var pickupInt  = pickupPool[1 + Math.floor(Math.random()*(pickupPool.length-1))];
        notes.push({ pitch: snapNear(root + pickupInt, ctx.midAnchor),
                     start: 3.5, dur: 0.45 });
        notes[notes.length-2].dur = 0.45;                         // shorten beat 4
    }

    // Final climax: triplet-feel descending line on bar's last beat
    if (p.isFinalClimax) {
        notes[notes.length-1].dur = 0.3;
        notes.push({ pitch: snapNear(root + 5, ctx.midAnchor), start: 3.33, dur: 0.3 });
        notes.push({ pitch: clampBass(root - 1),               start: 3.66, dur: 0.3 });
    }

    return notes;
}

function chordOrScale(root, ctx, comp) {
    // 60% chord tone, 40% scale tone (more chord at low comp, more scale at high)
    var chordProb = 0.7 - comp * 0.3;
    if (Math.random() < chordProb) {
        var c = ctx.chord[1 + Math.floor(Math.random() * (ctx.chord.length - 1))];
        return snapNear(root + c, ctx.midAnchor);
    } else {
        // Scale tones excluding root itself
        var sIdx = 1 + Math.floor(Math.random() * (ctx.scale.length - 1));
        return snapNear(root + ctx.scale[sIdx], ctx.midAnchor);
    }
}

// ── Style 2: Funk (16th-note groove, Jamerson-style) ──────────
function genFunk(p) {
    var ctx   = p.ctx;
    var notes = [];
    var root  = snapNear(ctx.midAnchor, ctx.midAnchor);
    var oct   = clampBass(root + 12);
    var comp  = p.compFactor;

    // Strong root on beat 1
    notes.push({ pitch: root, start: 0.0, dur: 0.25 });

    // 16th syncopation on "e of 1" and/or "a of 1"
    if (Math.random() < 0.35 + comp * 0.4) {
        notes.push({ pitch: root, start: 0.25, dur: 0.25 });
    }
    if (Math.random() < 0.45 + comp * 0.3) {
        notes.push({ pitch: root, start: 0.75, dur: 0.25 });
    }

    // Beat 2: ghost / scale-tone passing
    if (Math.random() < 0.6) {
        notes.push({ pitch: chordOrScale(root, ctx, comp),
                     start: 1.0, dur: 0.25 });
    }
    if (Math.random() < 0.35 + comp * 0.3) {
        notes.push({ pitch: root, start: 1.5, dur: 0.25 });
    }

    // Beat 3: octave jump (classic funk move)
    if (Math.random() < 0.5 + comp * 0.3) {
        notes.push({ pitch: oct, start: 2.0, dur: 0.25 });
        notes.push({ pitch: root, start: 2.25, dur: 0.25 });
    } else {
        notes.push({ pitch: root, start: 2.0, dur: 0.5 });
    }

    // Beat 3.5 / 4: walking up to approach next bar
    if (Math.random() < 0.4 + comp * 0.4) {
        var step = ctx.scale[2 + Math.floor(Math.random() * 2)]; // 3rd/4th
        notes.push({ pitch: snapNear(root + step, ctx.midAnchor),
                     start: 2.75, dur: 0.25 });
    }

    // Turnaround / approach to next bar
    if (p.isLastOfPhrase) {
        // Chromatic approach 16th hits on beat 4
        notes.push({ pitch: clampBass(root - 2), start: 3.0,  dur: 0.25 });
        notes.push({ pitch: clampBass(root - 1), start: 3.5,  dur: 0.25 });
        notes.push({ pitch: clampBass(root - 1), start: 3.75, dur: 0.25 });
    } else {
        notes.push({ pitch: root, start: 3.0, dur: 0.5 });
        if (Math.random() < 0.4 + comp * 0.4) {
            notes.push({ pitch: chordOrScale(root, ctx, comp),
                         start: 3.5, dur: 0.5 });
        }
    }

    // Fill / climax: dense 16ths on beat 4
    if (p.isFill || p.isFinalClimax) {
        var pent = ctx.penta;
        for (var s = 3.0; s < 4.0; s += 0.25) {
            var pIdx = Math.floor(Math.random() * pent.length);
            notes.push({ pitch: snapNear(root + pent[pIdx], ctx.midAnchor),
                         start: s, dur: 0.25 });
        }
    }

    return notes;
}

// ── Style 3: Lo-Fi ─────────────────────────────────────────────
// Sparse, root and 5th, long durations. Half-note feel.
function genLoFi(p) {
    var ctx   = p.ctx;
    var notes = [];
    var root  = snapNear(ctx.lowAnchor, ctx.lowAnchor);
    var fifth = clampBass(root + 7);
    var comp  = p.compFactor;

    // Bar 1 root, long
    notes.push({ pitch: root, start: 0.0, dur: 1.75 });

    // Beat 3: usually root again, sometimes 5th for color (comp-dependent)
    var beat3 = (Math.random() < 0.3 + comp * 0.4) ? fifth : root;
    notes.push({ pitch: beat3, start: 2.0, dur: 1.75 });

    // Soft pickup on "and of 4" with complexity
    if (comp > 0.35 && Math.random() < comp * 0.7) {
        var pent = ctx.penta;
        notes.push({ pitch: snapNear(root + pent[1+Math.floor(Math.random()*3)], ctx.lowAnchor),
                     start: 3.5, dur: 0.45 });
        notes[1].dur = 1.45;
    }

    // Turnaround / development
    if (p.isLastOfPhrase) {
        notes[notes.length-1] = { pitch: clampBass(root - 1), start: 3.5, dur: 0.45 };
        notes[1].dur = 1.45;
    }
    if (p.isFinalClimax) {
        // Final bar: add an extra pickup at beat 4 leading back to the loop start
        notes.push({ pitch: fifth, start: 3.0, dur: 0.45 });
        notes.push({ pitch: clampBass(root - 1), start: 3.5, dur: 0.45 });
        notes[1].dur = 0.95;
    }
    return notes;
}

// ── Write to clip via Live API ────────────────────────────────
function writeToClip(notes, slotIdx) {
    var track = new LiveAPI("this_device canonical_parent");
    var tPath = track.unquotedpath;
    var sPath = tPath + " clip_slots " + slotIdx;
    var slot  = new LiveAPI(sPath);

    // Delete and recreate every time → ensures correct length for Bars changes
    if (parseInt(slot.get("has_clip")[0]) == 1) {
        slot.call("delete_clip");
    }
    slot.call("create_clip", g_bars * 4.0);

    var clip = new LiveAPI(sPath + " clip");
    clip.set("loop_end",   g_bars * 4.0);
    clip.set("loop_start", 0.0);
    clip.set("looping",    1);

    // Old API (Live 10/11/12 compatible)
    clip.call("select_all_notes");
    clip.call("replace_selected_notes");
    clip.call("notes", notes.length);
    for (var i = 0; i < notes.length; i++) {
        var n = notes[i];
        clip.call("note", n.pitch, n.start, n.dur, n.vel, 0);
    }
    clip.call("done");

    post("KemuriBeat: wrote " + notes.length + " notes to slot " + slotIdx + " (" + g_bars + " bars)\n");
}

// ── MIDI Source Analysis (Krumhansl-Schmuckler) ───────────────
// Direct JS LiveAPI approach: call get_notes_extended and parse the return value.
// kemuri_reader.js (outlet 4 → inlet 14) provides a 3-sec timeout safety net.
var _pitchHist    = [0,0,0,0,0,0,0,0,0,0,0,0];
var _analysisDone = false;
var _clipApi      = null;

function analyzeSource() {
    try {
        var sPath = "live_set tracks " + g_source_track +
                    " clip_slots " + g_source_slot;
        var slot  = new LiveAPI(sPath);

        if (parseInt(slot.get("has_clip")[0]) == 0) {
            outlet(0, "set", "Analyze ERROR: Track" + g_source_track +
                             " Slot" + g_source_slot + " にクリップなし");
            return;
        }

        _pitchHist    = [0,0,0,0,0,0,0,0,0,0,0,0];
        _analysisDone = false;

        // outlet 4: [track, slot] → reader (3-sec timeout safety net)
        outlet(4, g_source_track, g_source_slot);

        outlet(0, "set", "MIDI解析中... Track" + g_source_track + " Slot" + g_source_slot);

        var clipPath = "live_set tracks " + g_source_track +
                       " clip_slots " + g_source_slot + " clip";
        _clipApi = new LiveAPI(clipPath);

        // Try get_notes_extended (Live 11+) — returns JSON string in Live 11.1+
        var raw = null, apiUsed = "";
        try {
            raw = _clipApi.call("get_notes_extended", 0, 128, 0, 9999);
            apiUsed = "get_notes_extended";
        } catch(e1) {
            post("KemuriBeat: get_notes_extended threw: " + e1 + "\n");
        }

        // Fallback: get_notes (Live 10 legacy)
        if (raw == null || raw === "" || (raw.length === 0)) {
            try {
                var lenProp = parseInt(_clipApi.get("length"));
                if (isNaN(lenProp) || lenProp <= 0) lenProp = 9999;
                _clipApi.call("select_all_notes");
                raw = _clipApi.call("get_selected_notes");
                apiUsed = "get_selected_notes";
            } catch(e2) {
                post("KemuriBeat: get_selected_notes threw: " + e2 + "\n");
            }
        }

        post("KemuriBeat: " + apiUsed + " type=" + typeof raw +
             " len=" + (raw && raw.length !== undefined ? raw.length : "?") +
             " val=" + (raw === null ? "null" : ("" + raw).substring(0, 300)) + "\n");

        var ok = false;
        if (typeof raw === "string" && raw.length > 2) {
            ok = _parseNotesJson(raw);
        }
        if (!ok && raw && raw.length !== undefined && raw.length > 0) {
            ok = _parseNotesFlat(raw);
        }

        if (ok) {
            _finishMidiAnalysis();
        } else {
            post("KemuriBeat: no notes parsed; waiting for timeout\n");
        }

    } catch(e) {
        outlet(0, "set", "Analyze ERROR: " + e);
        post("Analyze error: " + e + "\n");
    }
}

function _parseNotesJson(jsonStr) {
    try {
        var data = JSON.parse(jsonStr);
        var arr = data.notes || data;
        if (!arr || !arr.length) return false;
        var c = 0;
        for (var i = 0; i < arr.length; i++) {
            var p = parseInt(arr[i].pitch);
            if (!isNaN(p) && p >= 0 && p < 128) {
                _pitchHist[p % 12] += 1;
                c++;
            }
        }
        post("KemuriBeat: parsed " + c + " notes (JSON)\n");
        return c > 0;
    } catch(e) {
        post("KemuriBeat: JSON parse error: " + e + "\n");
        return false;
    }
}

function _parseNotesFlat(arr) {
    // Format: ["notes", count, "note", p, t, d, v, m, "note", p, ..., "done"]
    var count = 0;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] === "note" && i + 1 < arr.length) {
            var p = parseInt(arr[i + 1]);
            if (!isNaN(p) && p >= 0 && p < 128) {
                _pitchHist[p % 12] += 1;
                count++;
            }
            i += 5;
        }
    }
    post("KemuriBeat: parsed " + count + " notes (flat)\n");
    return count > 0;
}

function _finishMidiAnalysis() {
    if (_analysisDone) return;   // prevent double execution (timeout + real done)
    _analysisDone = true;

    var i, total = 0;
    for (i = 0; i < 12; i++) total += _pitchHist[i];

    if (total === 0) {
        outlet(0, "set", "MIDI解析: ノートなし (Live API未対応の可能性あり)");
        return;
    }

    // Normalize
    var norm = [];
    for (i = 0; i < 12; i++) norm.push(_pitchHist[i] / total);

    // Find best matching key (24 candidates: 12 roots × 2 modes)
    var bestScore = -Infinity, bestRoot = 0, bestMode = 0;
    for (var root = 0; root < 12; root++) {
        var mj = _ksCorr(norm, KS_MAJOR, root);
        var mn = _ksCorr(norm, KS_MINOR, root);
        if (mj > bestScore) { bestScore = mj; bestRoot = root; bestMode = 0; }
        if (mn > bestScore) { bestScore = mn; bestRoot = root; bestMode = 1; }
    }

    g_root = bestRoot;
    g_mode = bestMode;
    outlet(1, bestRoot);
    outlet(2, bestMode);
    outlet(0, "set", "MIDI解析完了: " + NOTE_NAMES[bestRoot] +
                     " " + (bestMode === 0 ? "Major" : "Minor") +
                     " → 生成ボタンを押してください");
}

function _ksCorr(vec, profile, root) {
    var n = 12, sX = 0, sY = 0, sXY = 0, sX2 = 0, sY2 = 0;
    for (var i = 0; i < n; i++) {
        var x = vec[i];
        var y = profile[(i - root + 12) % 12];
        sX += x; sY += y; sXY += x*y; sX2 += x*x; sY2 += y*y;
    }
    var d = Math.sqrt((n*sX2 - sX*sX) * (n*sY2 - sY*sY));
    return d < 1e-10 ? 0 : (n*sXY - sX*sY) / d;
}
