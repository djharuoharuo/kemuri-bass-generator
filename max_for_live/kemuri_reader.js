// kemuri_reader.js — タイムアウト専用ヘルパー
// Inlet 0: any message → 3秒タイマースタート
// Outlet 0: bang (タイムアウト時のみ)

inlets  = 1;
outlets = 1;

var _task = null;

function bang()    { startTimer(); }
function msg_int() { startTimer(); }
function list()    { startTimer(); }
function anything(){ startTimer(); }

function startTimer() {
    if (_task) { _task.cancel(); _task = null; }
    _task = new Task(function() {
        post("KemuriBeat: analyze timeout\n");
        _task = null;
        outlet(0, "bang");
    }, this);
    _task.schedule(3000);
}
