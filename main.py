"""KemuriBeat - Audio analysis → Ableton plugin OSC bridge."""

import os
import threading
import tkinter as tk
from tkinterdnd2 import TkinterDnD, DND_FILES

import analyzer
import osc_sender

BG      = "#111118"
FG      = "#e0e0e0"
ACCENT  = "#7f5af0"
DIM     = "#444455"
GREEN   = "#2cb67d"
RED     = "#e06c75"
AUDIO_EXTS = (".wav", ".mp3", ".flac", ".aiff", ".aif", ".ogg", ".m4a")


class App(TkinterDnD.Tk):
    def __init__(self):
        super().__init__()
        self.title("KemuriBeat")
        self.configure(bg=BG)
        self.resizable(False, False)
        self._analysis = None
        self._build_ui()

    def _build_ui(self):
        # タイトル
        tk.Label(self, text="🎵  KemuriBeat", font=("Segoe UI", 13, "bold"),
                 bg=BG, fg=ACCENT).pack(pady=(16, 4))
        tk.Label(self, text="曲をドロップ → Abletonプラグインに自動反映",
                 font=("Segoe UI", 9), bg=BG, fg="#888").pack(pady=(0, 12))

        # ドロップゾーン
        self._drop_btn = tk.Button(
            self,
            text="🎵  曲ファイルをここにドロップ\n\nWAV / MP3 / FLAC / AIFF など",
            font=("Segoe UI", 11),
            bg=DIM, fg="#aaa",
            activebackground=ACCENT, activeforeground="white",
            relief="flat", width=28, height=6,
            command=self._click_open
        )
        self._drop_btn.pack(padx=24, pady=4)
        self._drop_btn.drop_target_register(DND_FILES)
        self._drop_btn.dnd_bind("<<Drop>>", self._on_drop)

        # 解析結果
        self._result_frame = tk.Frame(self, bg=BG)
        self._result_frame.pack(fill="x", padx=24, pady=8)

        self._lbl_key = tk.Label(self._result_frame, text="Key: —",
                                  font=("Segoe UI", 12, "bold"),
                                  bg=BG, fg=FG)
        self._lbl_key.pack(side="left", expand=True)

        self._lbl_bpm = tk.Label(self._result_frame, text="BPM: —",
                                  font=("Segoe UI", 12, "bold"),
                                  bg=BG, fg=FG)
        self._lbl_bpm.pack(side="left", expand=True)

        # クリアボタン
        self._clear_btn = tk.Button(
            self, text="クリア",
            font=("Segoe UI", 9),
            bg=BG, fg="#666",
            activebackground=DIM, activeforeground=FG,
            relief="flat", padx=12, pady=4,
            command=self._clear
        )
        self._clear_btn.pack(pady=(0, 8))

        # ステータス
        self._status_var = tk.StringVar(value="")
        self._lbl_status = tk.Label(
            self, textvariable=self._status_var,
            font=("Segoe UI", 9), bg=BG, fg="#888",
            wraplength=320
        )
        self._lbl_status.pack(padx=24, pady=(0, 16))

    # ── ドロップ・クリック ─────────────────────────────────────
    def _on_drop(self, event):
        path = event.data.strip().strip("{}")
        if not path.lower().endswith(AUDIO_EXTS):
            self._set_status("❌ 音声ファイル（WAV/MP3など）をドロップしてください", RED)
            return
        self._analyze(path)

    def _click_open(self):
        from tkinter import filedialog
        path = filedialog.askopenfilename(
            title="曲ファイルを選択",
            filetypes=[("Audio", "*.wav *.mp3 *.flac *.aiff *.aif *.ogg *.m4a"),
                       ("All files", "*.*")]
        )
        if path:
            self._analyze(path)

    # ── 解析 ──────────────────────────────────────────────────
    def _analyze(self, path):
        name = os.path.basename(path)
        self._drop_btn.config(text=f"解析中...\n{name}", fg="#aaa")
        self._lbl_key.config(text="Key: ...")
        self._lbl_bpm.config(text="BPM: ...")
        self._set_status("解析中（少し時間がかかります）...", "#888")
        self.update()

        def task():
            try:
                result = analyzer.analyze_audio(path)
                self._analysis = result
                bpm      = result.get("bpm", 120.0)
                key_info = result.get("key", {})
                tonic    = key_info.get("tonic", "C")
                mode     = key_info.get("mode", "major")

                # Abletonプラグインに送信
                osc_sender.send_analysis_to_plugin(tonic, mode, bpm)

                self.after(0, lambda: self._drop_btn.config(
                    text=f"✓  {name}", fg=GREEN))
                self.after(0, lambda: self._lbl_key.config(
                    text=f"Key: {tonic} {mode.capitalize()}",
                    fg=GREEN))
                self.after(0, lambda: self._lbl_bpm.config(
                    text=f"BPM: {bpm:.1f}",
                    fg=GREEN))
                self.after(0, lambda: self._set_status(
                    "✓ Abletonプラグインに反映しました", GREEN))
            except Exception as e:
                self.after(0, lambda: self._drop_btn.config(
                    text="🎵  曲ファイルをここにドロップ\n\nWAV / MP3 / FLAC / AIFF など",
                    fg="#aaa"))
                self.after(0, lambda: self._set_status(f"❌ 解析エラー: {e}", RED))

        threading.Thread(target=task, daemon=True).start()

    # ── クリア ────────────────────────────────────────────────
    def _clear(self):
        self._analysis = None
        self._drop_btn.config(
            text="🎵  曲ファイルをここにドロップ\n\nWAV / MP3 / FLAC / AIFF など",
            fg="#aaa")
        self._lbl_key.config(text="Key: —", fg=FG)
        self._lbl_bpm.config(text="BPM: —", fg=FG)
        self._set_status("", "#888")

    def _set_status(self, msg, color="#888"):
        self._status_var.set(msg)
        self._lbl_status.config(fg=color)


if __name__ == "__main__":
    app = App()
    app.mainloop()
