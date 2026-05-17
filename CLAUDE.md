# CLAUDE.md — AI/開発者向けの地雷集

このファイルは「未来の自分」または「このプロジェクトを引き継ぐAI/人」が
**同じ罠を踏まずに修正・拡張できるように** 残す技術メモです。

---

## プロジェクト概要

KemuriBeat Bass Generator は **Python UI + Max for Live プラグイン** の組み合わせ。

```
[Python UI (main.py)]                 [Ableton Live + Max for Live]
   ↓ ドラッグ&ドロップ                         │
analyzer.py で音声解析 (Key/BPM)              │
   ↓ OSC port 8001                            ↓
osc_sender.py ─────────────────→  KemuriBeatPlugin.amxd
                                       (kemuri_generator.js)
                                            │
                                            └─→ MIDI ノート出力
```

- Python 側はオフライン音声解析（librosa）
- Max for Live 側は Live API で MIDI クリップを読んでベースラインを生成

---

## ファイル構成

| ファイル | 役割 |
|---------|------|
| `main.py` | Python GUI (tkinterdnd2)。曲ファイルD&Dで解析→OSC送信 |
| `analyzer.py` | librosa による Key/BPM 解析 |
| `osc_sender.py` | OSC送信 (port 8001) |
| `generator.py` | （Python側の旧ベース生成。現在はM4L側で生成） |
| `max_for_live/KemuriBeatPlugin.maxpat` | **正本**。M4L パッチャー (JSON) |
| `max_for_live/KemuriBeatPlugin.amxd` | `.maxpat` から生成されたバイナリ |
| `max_for_live/kemuri_generator.js` | ベース生成・MIDI解析の中身 |
| `max_for_live/kemuri_reader.js` | 3秒タイムアウト用ヘルパー |
| `max_for_live/build_amxd.py` | `.maxpat` → `.amxd` ビルドスクリプト |

---

## 地雷一覧

### 🔴 amxd バイナリ形式

`.amxd` は単なるJSONではなく、`ampf` バイナリヘッダ + JSON の構造：

```
[ampf][uint32_LE 4][<TYPE>meta][uint32_LE 4][uint32_LE 0][ptch][uint32_LE json_len][JSON]
```

`<TYPE>` 4バイトでデバイス種別が決まる：

| TYPE   | デバイス種別           |
|--------|----------------------|
| `aaaa` | Audio Effect         |
| `iiii` | Instrument           |
| **`mmmm`** | **MIDI Effect** ← KemuriBeat はこれ |
| `nagg` | MIDI Generator       |
| `natt` | MIDI Transformation  |

**間違えるとブラウザ上の位置が変わる** （MIDI Effect なら Instrument の左に入る）。
ビルド時は必ず `max_for_live/build_amxd.py` を使うこと。

### 🔴 Live 12 のノート取得 API

Ableton Live 12 では古い MIDI ノート取得 API が動かない / 動作が変わった。

| アプローチ | 結果 |
|-----------|------|
| ❌ `call select_all_notes` + `call get_selected_notes` (Live 10 API) | Live 12 で動かず空配列 |
| ❌ patcher 内の `live.path` + `live.object` + `call get_notes_extended` | なぜか response が `live.object` の outlet から出てこない |
| ✅ **JS から直接** `new LiveAPI(clipPath).call("get_notes_extended", 0, 128, 0, 9999)` | これだけが動いた |

**Live 11.1+ では `get_notes_extended` の戻り値は JSON 文字列**:

```json
{"notes": [{"note_id": 71, "pitch": 44, "start_time": 4.0, "duration": 0.06, "velocity": 127.0, "mute": 0, ...}, ...]}
```

配列ではないので `for ... of` ではなく `JSON.parse()` してから `data.notes` を使う。
古いバージョン用に flat list (`["notes", n, "note", p, t, d, v, m, ...]`) パースも
フォールバックとして残してある（`kemuri_generator.js: _parseNotesFlat`）。

### 🔴 Max for Live JS の outlet/inlet

- `outlet(0, "bang")` を JS から送ると Max は**bang 信号として解釈**する（symbol "bang" ではない）
- `outlet(n, "set", ...)` は `live.comment` などのテキスト表示用メッセージ

### 🔴 ファイルの2重管理

開発用と Live 実機用の2か所にファイルがある：

- 開発用: `D:\program files\ProgramData\kemuri-bass-generator\max_for_live\`
- Live実機用: `D:\program files\ableton live song\User Library\Presets\MIDI Effects\Max MIDI Effect\`

`build_amxd.py` を実行すると両方に同期される。手動コピーは忘れがちなので必ずスクリプト経由で。

---

## ビルド・テスト手順

### Max for Live プラグインを更新したとき

```bash
cd max_for_live
python build_amxd.py
```

これで `.amxd` を再生成し、Ableton User Library にも自動コピーされる。
Ableton 側では **プラグインをトラックから一度削除→再ドラッグ** で読み直し。

---

## 🔴 新しい Max for Live プロジェクトを作るときの必須知識

`.maxpat` の拡張子を `.amxd` に変えるだけでは **Ableton に認識されない**。
`.amxd` はバイナリヘッダ付きの特殊フォーマットのため、変換スクリプトが必要。

### デバイス種別と保存先・`DEVICE_TYPE` の対応

| デバイス種別 | `DEVICE_TYPE` | User Library の保存先 | Ableton での配置場所 |
|------------|--------------|----------------------|-------------------|
| MIDI Effect | `b"mmmm"` | `User Library/Presets/MIDI Effects/Max MIDI Effect/` | MIDI トラックのインストゥルメント左 |
| Audio Effect | `b"aaaa"` | `User Library/Presets/Audio Effects/Max Audio Effect/` | オーディオトラック・マスタートラック含む全トラック |
| Instrument | `b"iiii"` | `User Library/Presets/Instruments/Max Instrument/` | MIDI トラックのインストゥルメントスロット |

**Audio Effect の場合**: `plugin~` / `plugout~` を使っていれば Max Audio Effect として動く。
Ableton ブラウザの「Max Audio Effect」テンプレートから保存した `.amxd` なら
マスタートラックを含むどのオーディオトラックにも配置できる。

⚠️ 種別を間違えて保存した場合（例: MIDI Effect フォルダに Audio Effect を置いた）は
Max エディタで開き直して正しいフォルダに Save As し直す。

### 手順

1. `build_amxd.py` を新プロジェクトにコピー
2. 以下を新しいファイルに合わせて変更：

```python
MAXPAT      = os.path.join(HERE, "新しいパッチ名.maxpat")
AMXD_OUT    = os.path.join(HERE, "新しいパッチ名.amxd")
DEVICE_TYPE = b"aaaa"  # Audio Effect / b"mmmm" MIDI Effect / b"iiii" Instrument

USER_LIBRARIES = [
    r"D:\program files\ableton live song\User Library\Presets\Audio Effects\Max Audio Effect",
]
```

3. `python build_amxd.py` を実行 → `.amxd` 生成 + User Library に自動コピー

Max エディタを一切開かなくても Ableton のブラウザに出てくる。

### Python 側を更新したとき

```bash
python main.py
```

そのまま起動するだけ。

---

## キー検出アルゴリズム

`kemuri_generator.js` の `_finishMidiAnalysis()` は **Krumhansl-Schmuckler key-finding algorithm** を使う：

1. クリップ内の全ノートのピッチクラス（0-11）の出現回数をヒストグラム化
2. 12個の長調プロファイル + 12個の短調プロファイル = 24候補と相関係数を計算
3. 最大スコアの (root, mode) を採用

プロファイル値は定数 `KS_MAJOR`, `KS_MINOR` に格納（音楽理論研究で使われる標準値）。

---

## 拡張のヒント

- **新スタイル追加**: `kemuri_generator.js` の `STYLES` 配列に `{name, base, extras, fill}` を追加
- **音域変更**: `BASS_MIN`, `BASS_MAX` 定数を変える（現在 28-47, E1-B2）
- **OSC ポート変更**: Python `osc_sender.py` と patcher 内の `udpreceive 8001` の両方を変える

---

## 詰まったときに最初に見るところ

1. Max コンソール（Max for Live → 編集モード → Window → Max Console）
   - `KemuriBeat: ...` で始まるメッセージが出る
   - `get_notes_extended type=... val=...` でAPIの戻り値が確認できる
2. Python ターミナル出力（`main.py` を起動したコンソール）
3. `analyzer.py` の例外は GUI の赤いステータスバーに出る
