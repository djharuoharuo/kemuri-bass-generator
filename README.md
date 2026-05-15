# KemuriBeat Bass Generator

Ableton Live Suite 上で動作するベースライン自動生成ツールです。  
Python UI でMIDIを解析・生成し、OSC経由でMax for Liveデバイスにリアルタイム送信します。

---

## 動作環境

| 項目 | 要件 |
|------|------|
| OS | Windows 10/11 または macOS 12以上 |
| Python | 3.10 以上 |
| Ableton Live | Suite（Max for Live 付き） |
| Max for Live | 8.x |

---

## セットアップ

### Windows

```bat
cd kemuri-bass-generator
setup.bat
```

### macOS / Linux（手動）

```bash
cd kemuri-bass-generator
pip install -r requirements.txt
```

---

## 起動方法

```bash
python main.py
```

---

## 使い方

### モード1：自動解析モード（自分の曲から生成）

1. 「自分の曲をD&D」ボタンをクリックして制作中のMIDIファイルを読み込む
2. スタイル・複雑さ・フィル・小節数を設定
3. 「ベースライン生成」をクリック → Ableton LiveのBassトラックにクリップが作成される

### モード2：参考曲モード（リズムパターンを流用）

1. まず「自分の曲をD&D」で曲のMIDIを読み込む
2. 「参考曲をD&D」で参考にしたいベースラインのMIDIを読み込む
3. 「ベースライン生成」をクリック → 参考曲のリズムに自分のコード進行を当てはめて生成

---

## パラメーター

| パラメーター | 説明 |
|------------|------|
| スタイル | Boom-Bap / Soul-Jazz / Funk / Lo-Fi から選択（テキスト入力でカスタム） |
| シンプル ↔ 動き | 0でルート音中心のシンプル構成、100でアプローチノートや16分音符のフィルを追加 |
| ルート重視 ↔ フィル | 50以上で4小節ごとに最終拍を装飾するフィルが挿入される |
| BPM | 自動検出チェックONで解析したMIDIのBPMを使用、OFFで手動入力 |
| 小節数 | 4 / 8 / 16 小節から選択 |

---

## スタイル別特徴

| スタイル | 特徴 |
|---------|------|
| **Boom-Bap** | 2拍・4拍アクセント、シンコペーション控えめ |
| **Soul-Jazz** | ウォーキングベース風、8分音符多め |
| **Funk** | 16分音符中心、スラップ的なリズム |
| **Lo-Fi** | シンプルで繰り返し多め、動き少なめ |

---

## Max for Liveデバイスの設置方法

1. Ableton Live を開く
2. `max_for_live/KemuriBassReceiver.maxpat` を **Max for Live エディタ** で開く
3. **File → Save As** で `KemuriBassReceiver.amxd` として保存
4. Ableton Live の **Bass トラック**（MIDIトラック）の **MIDIエフェクト**スロットに配置
5. デバイスが起動し、ポート8000でOSCを受信待機状態になる

> **注意**: `.amxd` ファイルはClaude Codeが直接生成できないため、`.maxpat` JSONを手動でMaxエディタに貼り付けて保存してください。

---

## OSC通信仕様

| アドレス | データ | 説明 |
|---------|--------|------|
| `/bass/clear` | なし | 既存クリップをクリア |
| `/bass/start` | `bpm bars` | セッション開始、クリップ初期化 |
| `/bass/note` | `pitch velocity start duration` | ノートを1つ追加 |

すべてのタイミングは**クオーターノート単位**です。

---

## フォルダ構成

```
kemuri-bass-generator/
├── main.py              # UI エントリーポイント
├── analyzer.py          # MIDI解析（コード・BPM抽出）
├── generator.py         # ベースライン生成ロジック
├── osc_sender.py        # Max for LiveへのOSC送信
├── styles/
│   ├── __init__.py
│   ├── boom_bap.py
│   ├── soul_jazz.py
│   ├── funk.py
│   └── lo_fi.py
├── max_for_live/
│   ├── KemuriBassReceiver.maxpat   # Maxパッチ（JSONソース）
│   └── kemuri_note_writer.js       # Max JSヘルパー
├── requirements.txt
├── setup.bat            # Windows用セットアップ
└── README.md
```

---

## トラブルシューティング

**「OSCの送信に失敗する」**  
→ Ableton LiveにM4Lデバイスが配置されているか確認してください。ポート8000が他のアプリと競合している場合は `osc_sender.py` の `OSC_PORT` を変更し、Maxパッチの `udpreceive` の引数も同じ番号に変更してください。

**「解析に時間がかかる」**  
→ music21 の初回起動時はやや重いです。2回目以降は高速になります。

**「ノートが重複して作成される」**  
→ 生成ボタンを押すと自動でクリアメッセージを送信しています。Maxパッチの `/bass/clear` ルートが正しく接続されているか確認してください。

---

## ライセンス

MIT License
