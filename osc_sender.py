"""OSC communication: send bass note data to Max for Live via UDP."""

import time
import threading
from pythonosc import udp_client
from pythonosc.osc_message_builder import OscMessageBuilder

OSC_HOST        = "127.0.0.1"
OSC_PORT        = 8000   # KemuriBassReceiver (noteout / recording)
OSC_PORT_PLUGIN = 8001   # KemuriBeatPlugin   (analysis result → Root/Mode auto-set)

# Shared cancel flag for real-time playback
_cancel_event = threading.Event()


def send_bassline(notes: list, bpm: float, bars: int) -> None:
    """Send all notes at once (instant, for MIDI download workflow)."""
    client = udp_client.SimpleUDPClient(OSC_HOST, OSC_PORT)
    _send_clear(client)
    _send_start(client, bpm, bars)
    for n in notes:
        _send_note(client, n["pitch"], n["velocity"], n["start"], n["duration"])


def send_bassline_realtime(notes: list, bpm: float,
                           on_note_cb=None, on_done_cb=None) -> threading.Thread:
    """
    Send notes in real-time tempo, timed by BPM.
    Max for Live's noteout plays each note as it arrives.

    Args:
        on_note_cb: called with (index, total) each time a note is sent
        on_done_cb: called when playback finishes or is cancelled
    Returns:
        The playback thread (already started).
    """
    _cancel_event.clear()
    thread = threading.Thread(
        target=_realtime_worker,
        args=(notes, bpm, on_note_cb, on_done_cb),
        daemon=True,
    )
    thread.start()
    return thread


def stop_realtime() -> None:
    """Cancel an in-progress real-time send."""
    _cancel_event.set()


def _realtime_worker(notes: list, bpm: float, on_note_cb, on_done_cb):
    client = udp_client.SimpleUDPClient(OSC_HOST, OSC_PORT)
    seconds_per_beat = 60.0 / bpm

    # Sort by start time
    sorted_notes = sorted(notes, key=lambda n: n["start"])

    playback_start = time.perf_counter()

    for idx, n in enumerate(sorted_notes):
        if _cancel_event.is_set():
            break

        target_time = playback_start + n["start"] * seconds_per_beat
        now = time.perf_counter()
        wait = target_time - now
        if wait > 0:
            # Sleep in short chunks so cancel_event is checked
            sleep_end = time.perf_counter() + wait
            while time.perf_counter() < sleep_end:
                if _cancel_event.is_set():
                    break
                time.sleep(min(0.005, sleep_end - time.perf_counter()))

        if _cancel_event.is_set():
            break

        _send_note(client, n["pitch"], n["velocity"], n["start"], n["duration"])

        if on_note_cb:
            on_note_cb(idx + 1, len(sorted_notes))

    # Send stop — triggers session_record OFF in Max patch
    if not _cancel_event.is_set():
        _send_stop(client)

    if on_done_cb:
        on_done_cb(not _cancel_event.is_set())


# ── Low-level message builders ────────────────────────────────

def send_analysis_to_plugin(tonic: str, mode: str, bpm: float) -> None:
    """
    Send audio analysis result to KemuriBeatPlugin (port 8001).
    Plugin auto-sets Root menu and Mode menu.
    """
    try:
        client = udp_client.SimpleUDPClient(OSC_HOST, OSC_PORT_PLUGIN)
        msg = OscMessageBuilder(address="/kemuri/analysis")
        msg.add_arg(str(tonic))
        msg.add_arg(str(mode))
        msg.add_arg(float(bpm))
        client.send(msg.build())
    except Exception:
        pass  # Plugin not connected — silent fail


def _send_clear(client) -> None:
    msg = OscMessageBuilder(address="/bass/clear")
    client.send(msg.build())


def _send_start(client, bpm: float, bars: int) -> None:
    msg = OscMessageBuilder(address="/bass/start")
    msg.add_arg(float(bpm))
    msg.add_arg(int(bars))
    client.send(msg.build())


def _send_stop(client) -> None:
    msg = OscMessageBuilder(address="/bass/stop")
    client.send(msg.build())


def _send_note(client, pitch: int, velocity: int, start: float, duration: float) -> None:
    msg = OscMessageBuilder(address="/bass/note")
    msg.add_arg(int(pitch))
    msg.add_arg(int(velocity))
    msg.add_arg(float(start))
    msg.add_arg(float(duration))
    client.send(msg.build())
