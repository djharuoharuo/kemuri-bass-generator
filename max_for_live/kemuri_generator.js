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
            // menu index 0-4 → 1,2,4,8,16 bars (direct connection from menu-bars)
            var barMap = [1, 2, 4, 8, 16];
            g_bars = barMap[Math.max(0, Math.min(4, v))];
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
// Fill stages (g_fill 0-100):
//   0      = never fill
//   1-25   = last 1 bar of every 4-bar phrase gets fill
//   26-50  = last 2 bars
//   51-75  = last 3 bars
//   76-100 = all bars (constant fill)
//
// Complexity (g_complexity 0-100): continuous probability control
//   0   = sparse, chord tones only, quiet scale pool (3 notes)
//   100 = dense extras, chromatic approaches, full scale (7 notes)
//
// Velocity: always 127
function buildNotes(bpm) {
    var st     = STYLES[g_style];
    var scale  = (g_mode == 0) ? SCALE_MAJOR : SCALE_MINOR;
    var ctones = (g_mode == 0) ? CHORD_MAJOR : CHORD_MINOR;
    var notes  = [];

    // How many bars per 4-bar phrase receive fill pattern (0-4)
    var fillBars = Math.round(g_fill / 100.0 * 4);

    for (var bar = 0; bar < g_bars; bar++) {
        var barOff    = bar * 4.0;
        var barInPhr  = bar % 4;                               // 0,1,2,3
        var isFill    = fillBars > 0 && barInPhr >= (4 - fillBars);
        var pat       = buildPattern(st, isFill);

        for (var i = 0; i < pat.length; i++) {
            var step  = pat[i];
            var pitch = choosePitch(step.o, scale, ctones);
            notes.push({ pitch: pitch, start: barOff + step.o, dur: step.d, vel: 127 });
        }
    }
    return notes;
}

function buildPattern(st, isFill) {
    var pat        = [];
    var compFactor = g_complexity / 100.0;
    var i;

    if (isFill) {
        for (i = 0; i < st.base.length; i++) {
            if (st.base[i].o < 2.5) pat.push(st.base[i]);
        }
        for (i = 0; i < st.fill.length; i++) pat.push(st.fill[i]);
    } else {
        for (i = 0; i < st.base.length; i++) {
            // Downbeat always kept; off-beats drop 15% of the time for variety
            if (st.base[i].o === 0 || Math.random() > 0.15) {
                pat.push(st.base[i]);
            }
        }
        // Extras: probability scales linearly 0%→100% with complexity
        for (i = 0; i < st.extras.length; i++) {
            if (Math.random() < compFactor) pat.push(st.extras[i]);
        }
        pat.sort(function(a, b) { return a.o - b.o; });
    }
    return pat;
}

function choosePitch(offset, scale, ctones) {
    var rootMidi   = clampBass(g_root + 36);
    var compFactor = g_complexity / 100.0;

    // Scale note pool grows with complexity: 3 notes at 0, full scale at 100
    var poolSize = Math.max(3, Math.round(3 + compFactor * (scale.length - 3)));

    // ── Beat 1 (downbeat): musical anchor ──────────────────────
    // Mostly root, but some variety so each press sounds different
    if (offset === 0.0) {
        var r = Math.random();
        if (r < 0.65) return clampBass(rootMidi);                        // 65% root
        if (r < 0.85) return clampBass(rootMidi + 7);                    // 20% 5th
        return clampBass(rootMidi + ctones[Math.min(1, ctones.length - 1)]); // 15% 3rd
    }

    // ── Chromatic approach (0%→30% with comp) ──────────────────
    if (Math.random() < compFactor * 0.3) {
        var chrom = clampBass(rootMidi + ctones[Math.floor(Math.random() * ctones.length)]);
        return clampBass(chrom + (Math.random() < 0.5 ? -1 : 1));
    }

    // ── Chord tone (30% at comp=0, 80% at comp=100) ────────────
    if (Math.random() < 0.3 + compFactor * 0.5) {
        return clampBass(rootMidi + ctones[Math.floor(Math.random() * ctones.length)]);
    }

    // ── Scale tone from growing pool ───────────────────────────
    return clampBass(rootMidi + scale[Math.floor(Math.random() * poolSize)]);
}

function clampBass(midi) {
    while (midi < BASS_MIN) midi += 12;
    while (midi > BASS_MAX) midi -= 12;
    return midi;
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
