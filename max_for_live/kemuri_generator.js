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

// Chord triad templates (1, 3 or b3, 5 emphasized; non-chord tones lightly weighted)
// Position 0 = root, 4 = maj3, 3 = min3, 7 = 5th.
// Extra: b7 (10) lightly weighted for minor — supports m7 / dominant readings.
var CHORD_TMPL_MAJ = [1.0, 0.05, 0.2, 0.05, 0.8, 0.2, 0.05, 0.8, 0.05, 0.2, 0.05, 0.3];
var CHORD_TMPL_MIN = [1.0, 0.05, 0.2, 0.8,  0.05,0.2, 0.05, 0.8, 0.05, 0.2, 0.4,  0.05];

// Progression / track analysis state (filled by analyzeSource)
var _rawNotes              = [];   // {pitch, start, duration, velocity}
var g_progBar              = [];   // 1-bar chord progression
var g_progHalfBar          = [];   // 2-beat chord progression
var g_clipBars             = 0;
var g_loopBars             = 0;
var g_density              = 0;
var g_suggestedComplexity  = -1;
var g_useProgression       = false;

// ── Style names (kept for status display + legacy menu compat) ─
// Pattern data lives in producer-specific libraries below.
var STYLES = [
    { name: "Boom-Bap Mix" },   // 0: random pick from Premier / Dilla / 9th
    { name: "Premier" },        // 1: DJ Premier style
    { name: "J Dilla" },        // 2: J Dilla style
    { name: "9th Wonder" },     // 3: 9th Wonder style
    { name: "Soul-Jazz" },      // 4: walking bass
    { name: "Funk" },           // 5: 16th groove
    { name: "Lo-Fi" }           // 6: sparse
];

// ── Boom-Bap producer pattern libraries ────────────────────────
// Each pattern = one bar (4 beats). pitch tokens:
//   numbers   = chromatic offset from chord root (0=root, 7=5th, 12=octave)
//   "3rd"     = chord 3rd (maj3 or min3 depending on chord quality)
//   "5th"     = perfect 5th above root
//   "b7"      = minor 7th
//   "octave"  = +12
//   "p2"-"p5" = 2nd-5th note of pentatonic scale of current chord
//   "approach-1" / "approach+1" = chromatic below/above NEXT bar's root
//   "approach-2" = whole step below next root
// Patterns are picked at random; each then goes through applyVariations().
//
// Research sources: transcription-based analysis of producer signature bass lines,
// genre-defining tracks (Mass Appeal/Devil's Pie/Nas Is Like/Donuts/Fall in Love/
// Threads/Lovin' It etc.) and documented production techniques.

// DJ Premier — sparse, kick-locked, chromatic walks, sample-driven
// Tempo feel: 90-95 BPM, 4/4 with strong 2 & 4 backbeat
var PREMIER_PATTERNS = [
    { name: "PRM_basic_pump", notes: [
        { pos: 0,   dur: 0.5,  pitch: 0 },
        { pos: 1.5, dur: 0.5,  pitch: 0 },
        { pos: 3,   dur: 0.75, pitch: 0 } ] },
    { name: "PRM_octave_call", notes: [
        { pos: 0,   dur: 0.5,  pitch: 0 },
        { pos: 2,   dur: 0.5,  pitch: "octave" },
        { pos: 2.5, dur: 0.5,  pitch: 0 } ] },
    { name: "PRM_chromatic_walk", notes: [
        { pos: 0,   dur: 1.5,  pitch: 0 },
        { pos: 2,   dur: 0.5,  pitch: 0 },
        { pos: 2.5, dur: 0.5,  pitch: "p2" },
        { pos: 3,   dur: 0.5,  pitch: "p3" },
        { pos: 3.5, dur: 0.5,  pitch: "5th" } ] },
    { name: "PRM_pedal_sparse", notes: [
        { pos: 0,   dur: 1.0,  pitch: 0 },
        { pos: 2.5, dur: 0.5,  pitch: 0 },
        { pos: 3,   dur: 0.5,  pitch: 0 } ] },
    { name: "PRM_anticipate_3", notes: [
        { pos: 0,   dur: 0.5,  pitch: 0 },
        { pos: 1,   dur: 0.5,  pitch: 0 },
        { pos: 2.75,dur: 0.25, pitch: 0 },
        { pos: 3,   dur: 1.0,  pitch: 0 } ] },
    { name: "PRM_5th_color", notes: [
        { pos: 0,   dur: 0.5,  pitch: 0 },
        { pos: 1.5, dur: 0.5,  pitch: "5th" },
        { pos: 2,   dur: 0.5,  pitch: 0 },
        { pos: 3,   dur: 1.0,  pitch: 0 } ] },
    { name: "PRM_swing_skip", notes: [
        { pos: 0,   dur: 0.5,  pitch: 0 },
        { pos: 2,   dur: 0.5,  pitch: 0 },
        { pos: 2.5, dur: 0.25, pitch: 0 },
        { pos: 3.5, dur: 0.5,  pitch: 0 } ] }
];

// J Dilla — drunk timing, octave drops, 16th anticipations, deep sub
// Tempo feel: 85-95 BPM with intentional micro-timing pushes/pulls
var DILLA_PATTERNS = [
    { name: "DLA_anticipation", jitter: 0.04, notes: [
        { pos: 0,   dur: 0.5,  pitch: 0 },
        { pos: 1.5, dur: 0.5,  pitch: 0 },
        { pos: 3,   dur: 0.5,  pitch: 0 } ] },
    { name: "DLA_octave_drop", jitter: 0.04, notes: [
        { pos: 0,    dur: 0.25, pitch: "octave" },
        { pos: 0.25, dur: 0.75, pitch: 0 },
        { pos: 2,    dur: 0.5,  pitch: 0 },
        { pos: 3.5,  dur: 0.5,  pitch: 0 } ] },
    { name: "DLA_skip_2", jitter: 0.05, notes: [
        { pos: 0,    dur: 0.75, pitch: 0 },
        { pos: 1.75, dur: 0.25, pitch: 0 },
        { pos: 2,    dur: 0.5,  pitch: 0 },
        { pos: 3,    dur: 0.5,  pitch: 0 } ] },
    { name: "DLA_dotted_pulse", jitter: 0.06, notes: [
        { pos: 0,    dur: 0.75, pitch: 0 },
        { pos: 0.75, dur: 0.75, pitch: 0 },
        { pos: 1.5,  dur: 0.5,  pitch: "octave" },
        { pos: 3,    dur: 1.0,  pitch: 0 } ] },
    { name: "DLA_late_drop", jitter: 0.05, notes: [
        { pos: 0.25, dur: 0.5,  pitch: 0 },
        { pos: 2,    dur: 0.5,  pitch: 0 },
        { pos: 2.5,  dur: 0.5,  pitch: 0 },
        { pos: 3.75, dur: 0.25, pitch: 0 } ] },
    { name: "DLA_dub_octave", jitter: 0.04, notes: [
        { pos: 0,    dur: 0.5,  pitch: 0 },
        { pos: 0.5,  dur: 0.5,  pitch: "octave" },
        { pos: 2,    dur: 0.5,  pitch: 0 },
        { pos: 2.5,  dur: 0.5,  pitch: "octave" } ] },
    { name: "DLA_sub_lean", jitter: 0.06, notes: [
        { pos: 0,    dur: 1.25, pitch: 0 },
        { pos: 1.5,  dur: 0.25, pitch: 0 },
        { pos: 2.25, dur: 0.5,  pitch: 0 },
        { pos: 3,    dur: 1.0,  pitch: 0 } ] }
];

// 9th Wonder — clean, melodic, chord-tone-aware, soul-influenced
// Tempo feel: 85-95 BPM, more "on the grid" than Dilla
var NINTH_PATTERNS = [
    { name: "9TH_melodic_5th", notes: [
        { pos: 0,   dur: 0.5, pitch: 0 },
        { pos: 1.5, dur: 0.5, pitch: "5th" },
        { pos: 2,   dur: 0.5, pitch: 0 },
        { pos: 3.5, dur: 0.5, pitch: "octave" } ] },
    { name: "9TH_third_arpeg", notes: [
        { pos: 0,   dur: 0.5, pitch: 0 },
        { pos: 1,   dur: 0.5, pitch: "3rd" },
        { pos: 2,   dur: 0.5, pitch: "5th" },
        { pos: 3,   dur: 1.0, pitch: 0 } ] },
    { name: "9TH_walk_up", notes: [
        { pos: 0,   dur: 0.5, pitch: 0 },
        { pos: 1.5, dur: 0.5, pitch: "p2" },
        { pos: 2,   dur: 0.5, pitch: "3rd" },
        { pos: 3,   dur: 0.5, pitch: "5th" },
        { pos: 3.5, dur: 0.5, pitch: 0 } ] },
    { name: "9TH_soul_pump", notes: [
        { pos: 0,   dur: 0.5, pitch: 0 },
        { pos: 1.5, dur: 0.5, pitch: 0 },
        { pos: 2,   dur: 0.5, pitch: "5th" },
        { pos: 3,   dur: 0.5, pitch: 0 },
        { pos: 3.5, dur: 0.5, pitch: "octave" } ] },
    { name: "9TH_octave_pulse", notes: [
        { pos: 0,   dur: 0.5, pitch: 0 },
        { pos: 1,   dur: 0.5, pitch: "octave" },
        { pos: 2,   dur: 0.5, pitch: 0 },
        { pos: 3,   dur: 0.5, pitch: "octave" } ] },
    { name: "9TH_neighbor_tone", notes: [
        { pos: 0,   dur: 0.5, pitch: 0 },
        { pos: 1,   dur: 0.25, pitch: "p2" },
        { pos: 1.25,dur: 0.75, pitch: 0 },
        { pos: 2.5, dur: 0.5, pitch: "5th" },
        { pos: 3.5, dur: 0.5, pitch: 0 } ] },
    { name: "9TH_root_5_oct", notes: [
        { pos: 0,    dur: 0.5, pitch: 0 },
        { pos: 0.75, dur: 0.5, pitch: "5th" },
        { pos: 2,    dur: 0.5, pitch: "octave" },
        { pos: 2.75, dur: 0.5, pitch: "5th" },
        { pos: 3.5,  dur: 0.5, pitch: 0 } ] }
];

// User-supplied MIDI-derived patterns can be appended to this array
// in future (Phase B of the hybrid plan).
var USER_PATTERNS = [];

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
        var progLabel = g_useProgression
            ? " | Prog-follow(" + g_progBar.length + "ch, loop=" + g_loopBars + ")"
            : "";
        outlet(0, "set", "Done: " + varLabel + " | " + keyName + " | " + g_bars + "bars | BPM " + bpm.toFixed(1) + progLabel);
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
    var notes = [];
    var fillBars = (g_fill <= 0) ? 0 : Math.min(4, Math.ceil(g_fill / 25.0));
    // Soul-Jazz uses half-bar resolution (ii-V etc.); other styles use 1-bar
    var useHalfBar = (g_style === 4);

    for (var bar = 0; bar < g_bars; bar++) {
        var chordsThis = _chordAtBar(bar, useHalfBar);
        var chordsNext = _chordAtBar(bar + 1, useHalfBar);

        var ctx     = makeKeyContext(chordsThis[0].root, chordsThis[0].quality);
        var ctxMid  = useHalfBar ? makeKeyContext(chordsThis[1].root, chordsThis[1].quality) : null;
        var nextCtx = makeKeyContext(chordsNext[0].root, chordsNext[0].quality);

        var barInPhr        = bar % 4;
        var isLastOfPhrase  = (barInPhr === 3);
        var isLastBarTotal  = (bar === g_bars - 1);
        var isDevelopment   = (g_bars >= 8) && isLastBarTotal;
        var midDevelopment  = (g_bars >= 16) && (bar === 7);
        var isFill          = fillBars > 0 && barInPhr >= (4 - fillBars);

        var barNotes = generateBar(g_style, {
            ctx: ctx,
            ctxMid: ctxMid,            // half-bar chord (Soul-Jazz only)
            nextCtx: nextCtx,          // next bar's first chord (for approach notes)
            useHalfBar: useHalfBar,
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
// Builds a context for a specific chord (root pitch class + quality "maj"/"min").
// When no args, falls back to global key (g_root + g_mode).
function makeKeyContext(rootPc, quality) {
    if (rootPc === undefined) rootPc = g_root;
    if (quality === undefined) quality = (g_mode == 0 ? "maj" : "min");
    var isMinor = (quality === "min");
    // For Boom-Bap / Lo-Fi we want a sub-bass anchor (E1-area).
    // For Jazz / Funk we want a mid-bass anchor (one octave up).
    var lowAnchor = 24 + rootPc;   // C1+root  (24..35) → sub bass
    var midAnchor = 36 + rootPc;   // C2+root  (36..47) → mid bass
    var scale = isMinor ? SCALE_MINOR : SCALE_MAJOR;
    var chord = isMinor ? CHORD_MINOR : CHORD_MAJOR;
    var penta = isMinor ? [0,3,5,7,10] : [0,2,4,7,9];
    return {
        root: rootPc,
        isMinor: isMinor,
        scale: scale, chord: chord, penta: penta,
        lowAnchor: lowAnchor, midAnchor: midAnchor
    };
}

// Returns the chord(s) playing in `barIdx`, wrapping by detected loop length.
// `useHalfBar` returns 2 chords per bar (beats 0-1 and 2-3), otherwise 1.
function _chordAtBar(barIdx, useHalfBar) {
    var prog = useHalfBar ? g_progHalfBar : g_progBar;
    if (!g_useProgression || !prog || !prog.length) {
        var def = { root: g_root, quality: (g_mode === 0 ? "maj" : "min") };
        return useHalfBar ? [def, def] : [def];
    }
    var segsPerBar  = useHalfBar ? 2 : 1;
    var totalBars   = prog.length / segsPerBar;
    var loop        = g_loopBars > 0 ? Math.min(g_loopBars, totalBars) : totalBars;
    var loopBarIdx  = barIdx % Math.max(1, loop);
    var startSeg    = loopBarIdx * segsPerBar;

    var out = [];
    for (var i = 0; i < segsPerBar; i++) {
        var s = prog[(startSeg + i) % prog.length];
        out.push({ root: s.root, quality: s.quality });
    }
    return out;
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
        case 0: return genBoomBap(p);    // Boom-Bap Mix
        case 1: return genPremier(p);
        case 2: return genDilla(p);
        case 3: return genNinth(p);
        case 4: return genSoulJazz(p);
        case 5: return genFunk(p);
        case 6: return genLoFi(p);
        default: return genBoomBap(p);
    }
}

// ── Pattern resolution & variation helpers ─────────────────────
// Resolve a pattern-pitch token to an absolute MIDI note in the bass range.
function _resolvePitch(token, ctx, nextCtx) {
    var anchor = ctx.lowAnchor;
    if (typeof token === "number") {
        return clampBass(anchor + token);
    }
    if (typeof token === "string") {
        switch (token) {
            case "3rd":    return clampBass(anchor + (ctx.isMinor ? 3 : 4));
            case "5th":    return clampBass(anchor + 7);
            case "b7":     return clampBass(anchor + 10);
            case "octave": return clampBass(anchor + 12);
            case "p2":     return clampBass(anchor + ctx.penta[1]);
            case "p3":     return clampBass(anchor + ctx.penta[2]);
            case "p4":     return clampBass(anchor + ctx.penta[3]);
            case "p5":     return clampBass(anchor + ctx.penta[4]);
            case "approach-1":  return clampBass(nextCtx.lowAnchor - 1);
            case "approach+1":  return clampBass(nextCtx.lowAnchor + 1);
            case "approach-2":  return clampBass(nextCtx.lowAnchor - 2);
        }
    }
    return clampBass(anchor);   // fallback
}

// Pick one pattern from a producer library (could weight in future).
function _pickPattern(lib) {
    return lib[Math.floor(Math.random() * lib.length)];
}

// Apply micro-variations: octave swap, ghost notes, drop notes, timing jitter.
// Then attach turnaround / fill / climax based on phrase position.
function _applyVariations(pat, p, producer) {
    var notes = [];
    var c     = p.compFactor;
    var ctx   = p.ctx;
    var nctx  = p.nextCtx;

    for (var i = 0; i < pat.notes.length; i++) {
        var orig = pat.notes[i];

        // Drop off-beat notes occasionally (low complexity = sparser)
        if (orig.pos !== 0 && Math.random() < (0.18 - c * 0.12)) continue;

        var pitch = _resolvePitch(orig.pitch, ctx, nctx);

        // Octave swap (complexity scales chance)
        if (Math.random() < (0.04 + c * 0.18)) {
            var swap = clampBass(pitch + (Math.random() < 0.5 ? 12 : -12));
            pitch = swap;
        }

        var pos = orig.pos;
        // Dilla micro-timing
        if (producer === "dilla" && pat.jitter) {
            pos += (Math.random() - 0.5) * 2 * pat.jitter;
            if (pos < 0) pos = 0;
            if (pos > 3.9) pos = 3.9;
        }

        notes.push({ pos: pos, dur: orig.dur, pitch: pitch });
    }

    // Add a ghost / extra note (complexity-driven)
    if (Math.random() < c * 0.45) {
        var ghostSlots = [0.75, 1.25, 1.75, 2.25, 2.75];
        var gp = ghostSlots[Math.floor(Math.random() * ghostSlots.length)];
        // Avoid overlapping existing note within 0.2 beats
        var clash = false;
        for (var j = 0; j < notes.length; j++) {
            if (Math.abs(notes[j].pos - gp) < 0.2) { clash = true; break; }
        }
        if (!clash) {
            var ghostPitch = (Math.random() < 0.75)
                ? clampBass(ctx.lowAnchor)
                : clampBass(ctx.lowAnchor + 12);
            notes.push({ pos: gp, dur: 0.25, pitch: ghostPitch });
        }
    }

    // ── Turnaround / fill / climax ──────────────────────────────
    var nRoot = clampBass(nctx.lowAnchor);
    if (p.isFinalClimax) {
        // Strip anything past beat 2.75, then pentatonic walk into next root
        notes = notes.filter(function(n) { return n.pos < 2.75; });
        var pent = ctx.penta;
        notes.push({ pos: 3.0,  dur: 0.25, pitch: clampBass(ctx.lowAnchor + pent[1]) });
        notes.push({ pos: 3.25, dur: 0.25, pitch: clampBass(ctx.lowAnchor + pent[2]) });
        notes.push({ pos: 3.5,  dur: 0.25, pitch: clampBass(nRoot - 2) });
        notes.push({ pos: 3.75, dur: 0.25, pitch: clampBass(nRoot - 1) });
    } else if (p.isLastOfPhrase) {
        // Replace anything at/after 3.5 with chromatic approach to nRoot
        notes = notes.filter(function(n) { return n.pos < 3.4; });
        var dir = (Math.random() < 0.5) ? -1 : 1;
        notes.push({ pos: 3.5, dur: 0.5, pitch: clampBass(nRoot + dir) });
    } else if (p.isFill) {
        // Lighter fill — pentatonic flourish at beat 3
        var pIdx = 1 + Math.floor(Math.random() * 3);
        notes.push({ pos: 3.0, dur: 0.25,
                     pitch: clampBass(ctx.lowAnchor + ctx.penta[pIdx]) });
    }

    // Sort by position and convert to {pitch,start,dur}
    notes.sort(function(a, b) { return a.pos - b.pos; });
    var out = [];
    for (var k = 0; k < notes.length; k++) {
        out.push({ pitch: notes[k].pitch, start: notes[k].pos, dur: notes[k].dur });
    }
    return out;
}

// ── Style 1: Premier ───────────────────────────────────────────
function genPremier(p) {
    return _applyVariations(_pickPattern(PREMIER_PATTERNS), p, "premier");
}

// ── Style 2: J Dilla ───────────────────────────────────────────
function genDilla(p) {
    return _applyVariations(_pickPattern(DILLA_PATTERNS), p, "dilla");
}

// ── Style 3: 9th Wonder ────────────────────────────────────────
function genNinth(p) {
    return _applyVariations(_pickPattern(NINTH_PATTERNS), p, "ninth");
}

// ── Style 0: Boom-Bap Mix ──────────────────────────────────────
// Each bar randomly draws from one of the three producer libraries,
// giving the long-form clip a varied "all-producer mixtape" feel.
function genBoomBap(p) {
    var libs = [
        { lib: PREMIER_PATTERNS, tag: "premier" },
        { lib: DILLA_PATTERNS,   tag: "dilla"   },
        { lib: NINTH_PATTERNS,   tag: "ninth"   }
    ];
    // Also pull from USER_PATTERNS if populated (Phase B)
    if (USER_PATTERNS.length > 0) libs.push({ lib: USER_PATTERNS, tag: "user" });
    var pick = libs[Math.floor(Math.random() * libs.length)];
    return _applyVariations(_pickPattern(pick.lib), p, pick.tag);
}

// ── Style 1: Soul-Jazz (walking bass, half-bar harmony) ───────
// Beats 1-2 use ctx (current chord), beats 3-4 use ctxMid (second half).
// Beat-4 approaches the NEXT bar's first chord root by half-step (chromatic)
// or whole-step (diatonic) — the cornerstone of walking bass.
function genSoulJazz(p) {
    var notes = [];
    var ctxA  = p.ctx;
    var ctxB  = p.ctxMid || p.ctx;          // half-bar chord (or same)
    var nctx  = p.nextCtx;                  // next bar's first chord
    var comp  = p.compFactor;

    var rootA = snapNear(ctxA.midAnchor, ctxA.midAnchor);
    var rootB = snapNear(ctxB.midAnchor, ctxA.midAnchor);   // anchor to bar context for smoothness
    var rootN = snapNear(nctx.midAnchor, ctxA.midAnchor);

    // Beat 1 — root of chord A (rarely 5th below)
    var beat1 = (Math.random() < 0.85) ? rootA : snapNear(rootA - 5, ctxA.midAnchor);
    notes.push({ pitch: beat1, start: 0.0, dur: 0.95 });

    // Beat 2 — chord tone / scale tone of chord A.
    // If chord changes on beat 3 (ctxB != ctxA), prefer chord A's 5th
    // or a diatonic approach to chord B's root (classic walking move).
    var beat2;
    if (ctxB.root !== ctxA.root) {
        // Approach to rootB
        if (comp > 0.4 && Math.random() < 0.5) {
            beat2 = clampBass(rootB + (Math.random() < 0.5 ? -1 : 1));   // chromatic
        } else {
            beat2 = snapNear(rootA + 7, ctxA.midAnchor);                 // 5th of A
        }
    } else {
        beat2 = chordOrScale(rootA, ctxA, comp);
    }
    notes.push({ pitch: beat2, start: 1.0, dur: 0.95 });

    // Beat 3 — root of chord B (the chord change), or 5th if same chord
    var beat3 = (ctxB.root !== ctxA.root)
        ? rootB
        : (Math.random() < 0.55 ? snapNear(rootA + 7, ctxA.midAnchor)
                                : chordOrScale(rootA, ctxA, comp));
    notes.push({ pitch: beat3, start: 2.0, dur: 0.95 });

    // Beat 4 — approach to NEXT bar's root rootN
    var approach;
    if (comp > 0.3 && Math.random() < 0.6 + comp * 0.25) {
        // Chromatic approach
        approach = clampBass(rootN + (Math.random() < 0.5 ? -1 : 1));
    } else {
        // Diatonic step (a 5th or whole-step away)
        var diatonicPool = [rootN - 2, rootN + 2, rootN - 5, rootN + 5];
        approach = clampBass(diatonicPool[Math.floor(Math.random() * diatonicPool.length)]);
    }
    notes.push({ pitch: approach, start: 3.0, dur: 0.95 });

    // Fill / development — 8th-note pickup on "and of 4" leading to rootN
    if (p.isFill || p.isDevelopment) {
        // Pickup = chromatic neighbor of next root (different from beat-4 approach)
        var pickup = clampBass(rootN + (notes[notes.length-1].pitch < rootN ? 1 : -1));
        notes.push({ pitch: pickup, start: 3.5, dur: 0.45 });
        notes[notes.length-2].dur = 0.45;
    }

    // Final climax: triplet descent to next root
    if (p.isFinalClimax) {
        notes[notes.length-1].dur = 0.3;
        notes.push({ pitch: snapNear(rootA + 5, ctxA.midAnchor), start: 3.33, dur: 0.3 });
        notes.push({ pitch: clampBass(rootN - 1),                start: 3.66, dur: 0.3 });
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

    // Turnaround / approach to next bar's actual root
    if (p.isLastOfPhrase) {
        var nRootF = snapNear(p.nextCtx.midAnchor, ctx.midAnchor);
        notes.push({ pitch: clampBass(nRootF - 2), start: 3.0,  dur: 0.25 });
        notes.push({ pitch: clampBass(nRootF - 1), start: 3.5,  dur: 0.25 });
        notes.push({ pitch: clampBass(nRootF - 1), start: 3.75, dur: 0.25 });
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

    // Turnaround / development — approach NEXT bar's root
    if (p.isLastOfPhrase) {
        var nRoot = snapNear(p.nextCtx.lowAnchor, ctx.lowAnchor);
        notes[notes.length-1] = { pitch: clampBass(nRoot - 1), start: 3.5, dur: 0.45 };
        notes[1].dur = 1.45;
    }
    if (p.isFinalClimax) {
        var nRoot2 = snapNear(p.nextCtx.lowAnchor, ctx.lowAnchor);
        notes.push({ pitch: fifth, start: 3.0, dur: 0.45 });
        notes.push({ pitch: clampBass(nRoot2 - 1), start: 3.5, dur: 0.45 });
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
        _rawNotes     = [];
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
            var st = parseFloat(arr[i].start_time);
            var du = parseFloat(arr[i].duration);
            if (!isNaN(p) && p >= 0 && p < 128) {
                _pitchHist[p % 12] += 1;
                _rawNotes.push({
                    pitch: p,
                    start: isNaN(st) ? 0 : st,
                    duration: (isNaN(du) || du <= 0) ? 0.25 : du
                });
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
        if (arr[i] === "note" && i + 5 < arr.length) {
            var p  = parseInt(arr[i + 1]);
            var st = parseFloat(arr[i + 2]);
            var du = parseFloat(arr[i + 3]);
            if (!isNaN(p) && p >= 0 && p < 128) {
                _pitchHist[p % 12] += 1;
                _rawNotes.push({
                    pitch: p,
                    start: isNaN(st) ? 0 : st,
                    duration: (isNaN(du) || du <= 0) ? 0.25 : du
                });
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

    // ── Clip length ─────────────────────────────────────────────
    var clipLenBeats = 0;
    try {
        if (_clipApi) clipLenBeats = parseFloat(_clipApi.get("length")[0]);
    } catch (e) { clipLenBeats = 0; }
    if (isNaN(clipLenBeats) || clipLenBeats <= 0) {
        // Fallback: derive from last note end
        var lastEnd = 0;
        for (i = 0; i < _rawNotes.length; i++) {
            var e = _rawNotes[i].start + _rawNotes[i].duration;
            if (e > lastEnd) lastEnd = e;
        }
        clipLenBeats = Math.max(4, Math.ceil(lastEnd / 4) * 4);
    }
    g_clipBars = Math.max(1, Math.round(clipLenBeats / 4));

    // ── Chord progression detection (both granularities) ───────
    g_progBar     = _detectProgression(_rawNotes, clipLenBeats, 4);
    g_progHalfBar = _detectProgression(_rawNotes, clipLenBeats, 2);
    g_loopBars    = _detectLoopBars(g_progBar);
    g_useProgression = g_progBar.length > 0;

    // ── Density ─────────────────────────────────────────────────
    var notesPerBar = _rawNotes.length / Math.max(1, g_clipBars);
    g_density = notesPerBar;
    // 1.5 n/bar → 0, 8 n/bar → 100
    g_suggestedComplexity = Math.max(0, Math.min(100,
        Math.round((notesPerBar - 1.5) / 6.5 * 100)));

    var progSummary = _summarizeProgression(g_progBar);
    outlet(0, "set",
        "解析完了: Key=" + NOTE_NAMES[bestRoot] + " " +
        (bestMode === 0 ? "Maj" : "Min") +
        " | Loop=" + g_loopBars + "bars" +
        " | " + notesPerBar.toFixed(1) + "n/bar(推奨Comp=" + g_suggestedComplexity + ")" +
        " | " + progSummary);

    post("KemuriBeat: progression(1bar)= " + _progDebug(g_progBar) + "\n");
    post("KemuriBeat: progression(half)= " + _progDebug(g_progHalfBar) + "\n");
}

// ── Per-segment chord detection ────────────────────────────────
// Score = Σ (duration-weighted pitch-class strength × chord template).
// Returns [{startBeat, durationBeats, root, quality}, ...]
function _detectProgression(notes, clipLenBeats, segBeats) {
    if (!notes || !notes.length) return [];
    var numSeg = Math.max(1, Math.round(clipLenBeats / segBeats));
    var result = [];

    for (var s = 0; s < numSeg; s++) {
        var sStart = s * segBeats;
        var sEnd   = sStart + segBeats;
        var pch    = [0,0,0,0,0,0,0,0,0,0,0,0];
        var anyHit = false;

        for (var i = 0; i < notes.length; i++) {
            var n     = notes[i];
            var nStart = Math.max(n.start, sStart);
            var nEnd   = Math.min(n.start + n.duration, sEnd);
            if (nEnd > nStart) {
                pch[n.pitch % 12] += (nEnd - nStart);
                anyHit = true;
            }
        }

        if (!anyHit) {
            // Empty segment — inherit previous chord (sustained)
            if (result.length > 0) {
                var prev = result[result.length - 1];
                result.push({ startBeat: sStart, durationBeats: segBeats,
                              root: prev.root, quality: prev.quality });
            } else {
                result.push({ startBeat: sStart, durationBeats: segBeats,
                              root: g_root, quality: (g_mode === 0 ? "maj" : "min") });
            }
            continue;
        }

        var bestScore = -Infinity, bestRoot = 0, bestQ = "maj";
        for (var r = 0; r < 12; r++) {
            for (var qi = 0; qi < 2; qi++) {
                var tmpl = (qi === 0) ? CHORD_TMPL_MAJ : CHORD_TMPL_MIN;
                var sc = 0;
                for (var j = 0; j < 12; j++) {
                    sc += pch[j] * tmpl[(j - r + 12) % 12];
                }
                if (sc > bestScore) {
                    bestScore = sc; bestRoot = r;
                    bestQ = (qi === 0) ? "maj" : "min";
                }
            }
        }
        result.push({ startBeat: sStart, durationBeats: segBeats,
                      root: bestRoot, quality: bestQ });
    }
    return result;
}

// Detect smallest period among {4, 8, 16} where progression repeats.
function _detectLoopBars(prog) {
    if (!prog || !prog.length) return 0;
    var candidates = [4, 8, 16];
    for (var ci = 0; ci < candidates.length; ci++) {
        var p = candidates[ci];
        if (p > prog.length) continue;
        var match = true;
        for (var i = p; i < prog.length; i++) {
            if (prog[i].root !== prog[i - p].root ||
                prog[i].quality !== prog[i - p].quality) {
                match = false; break;
            }
        }
        if (match) return p;
    }
    return prog.length;   // not periodic within candidates
}

function _summarizeProgression(prog) {
    if (!prog || !prog.length) return "Prog: (none)";
    var s = "Prog:";
    var len = Math.min(prog.length, 8);
    for (var i = 0; i < len; i++) {
        if (i > 0) s += "-";
        s += NOTE_NAMES[prog[i].root] + (prog[i].quality === "min" ? "m" : "");
    }
    if (prog.length > 8) s += "...";
    return s;
}

function _progDebug(prog) {
    var s = "";
    for (var i = 0; i < prog.length; i++) {
        if (i > 0) s += " ";
        s += NOTE_NAMES[prog[i].root] + (prog[i].quality === "min" ? "m" : "");
    }
    return s;
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
