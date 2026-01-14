# CLI リファレンス

MIDI Sketch には生成、分析、デバッグ用のコマンドラインツールが含まれています。バッチ処理、CI/CDパイプライン、MIDIの品質調査に便利です。

## インストール

ソースからCLIをビルド：

```bash
cd midi-sketch
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make midisketch_cli
```

バイナリは `build/midisketch_cli` に生成されます。

## 基本的な使い方

```bash
# デフォルト設定で生成
./midisketch_cli

# スタイルとムードを指定して生成
./midisketch_cli --style 5 --mood 3 --bpm 128

# 生成して不協和音を分析
./midisketch_cli --style 5 --analyze

# 既存のMIDIファイルを分析
./midisketch_cli --input existing.mid --analyze
```

## コマンドリファレンス

### 生成パラメータ

| フラグ | 説明 | デフォルト |
|--------|------|-----------|
| `--seed N` | ランダムシード（0 = 自動ランダム） | 0 |
| `--style N` | スタイルプリセットID（0-16） | 0 |
| `--mood N` | ムードID（0-19）、スタイルマッピングを上書き | - |
| `--chord N` | コード進行ID（0-19） | - |
| `--bpm N` | BPM（40-240） | スタイルプリセット |
| `--key N` | キー（0-11: C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B） | 0 |
| `--form N` | フォーム/構成パターンID（0-17） | - |
| `--duration N` | 目標再生時間（秒）（0 = パターン使用） | 0 |

### ボーカルパラメータ

| フラグ | 説明 | デフォルト |
|--------|------|-----------|
| `--skip-vocal` | 初期生成でボーカルをスキップ（BGM先行ワークフロー） | - |
| `--regenerate-vocal` | 初期生成後にボーカルを再生成 | - |
| `--vocal-seed N` | ボーカル再生成用シード | - |
| `--vocal-attitude N` | ボーカル態度（0=Clean, 1=Expressive, 2=Raw） | 1 |
| `--vocal-low N` | ボーカル音域下限（MIDIノート） | 57 |
| `--vocal-high N` | ボーカル音域上限（MIDIノート） | 79 |
| `--vocal-style N` | ボーカルスタイルプリセット | 0（自動） |

ボーカルスタイルオプション（13プリセット）：
- 0: Auto（スタイルプリセットに基づいて自動選択）
- 1: Standard
- 2: Vocaloid（高速、広い跳躍）
- 3: UltraVocaloid（超高速、32分音符）
- 4: Idol（キャッチー、フック重視）
- 5: Ballad（スロー、持続音）
- 6: Rock（パワフル、音域シフト）
- 7: CityPop（ジャジー、シンコペーション）
- 8: Anime（ダイナミック、表現豊か）
- 9: BrightKira（高音域、キラキラ）
- 10: CoolSynth（エレクトロニック、正確）
- 11: CuteAffected（プレイフル）
- 12: PowerfulShout（激しい、シャウト系）

### ファイル操作

| フラグ | 説明 |
|--------|------|
| `--input FILE` | 既存のMIDIファイルを分析 |
| `--validate FILE` | MIDIファイル構造を検証 |
| `--regenerate FILE` | 埋め込みメタデータから再生成 |
| `--new-seed N` | 再生成時に新しいシードを使用 |
| `--format FMT` | MIDIフォーマット：`smf1` または `smf2`（デフォルト） |

### 分析＆デバッグ

| フラグ | 説明 |
|--------|------|
| `--analyze` | 生成/入力MIDIの不協和音を分析 |
| `--json` | 分析結果をJSON形式でstdoutに出力 |
| `--bar N` | バーN（1始まり）のノートを検査 |

## 不協和音分析

`--analyze` フラグは音楽理論に基づいた分析を行い、潜在的な問題を検出します。

### 問題タイプ

| タイプ | 説明 | 重大度 |
|--------|------|--------|
| **SimultaneousClash** | 不協和音程（短2度、長7度）の同時発音 | 高 |
| **NonChordTone** | コード構成音以外のノート | 低〜中 |
| **SustainedOverChordChange** | コードチェンジをまたいで保持されたノート | 中 |
| **NonDiatonicNote** | キーのスケール外のノート | 高 |

### 重大度レベル

- **CRITICAL（高）**：確実に問題あり、修正が必要
- **WARNING（中）**：確認を推奨
- **INFO（低）**：通常の音楽的テンション（経過音、刺繍音）

### 出力例

```
=== Dissonance Analysis ===

Action Summary:
  CRITICAL: 2 issues require fixing
  WARNING:  5 issues worth reviewing
  INFO:     12 normal musical tensions (no action needed)

Technical Breakdown:
  Simultaneous clashes:      2
  Non-chord tones:           8 (usually acceptable)
  Sustained over chord:      3
  Non-diatonic notes:        1

=== CRITICAL Issues (require fixing) ===

Bar 4, beat 2.0 (tick 7680):
  Clash: minor 2nd between Vocal(E4) vs Chord(F4)
  Chord: Dm7
  Playing: Vocal(E4), Chord(D3,F4,A4,C5), Bass(D2)
```

### JSON出力

機械可読な出力には `--json` を使用：

```bash
./midisketch_cli --input song.mid --analyze --json > analysis.json
```

JSON構造：

```json
{
  "summary": {
    "total_issues": 19,
    "simultaneous_clashes": 2,
    "non_chord_tones": 8,
    "sustained_over_chord_change": 3,
    "non_diatonic_notes": 1,
    "high_severity": 2,
    "medium_severity": 5,
    "low_severity": 12
  },
  "issues": [
    {
      "type": "simultaneous_clash",
      "severity": "high",
      "tick": 7680,
      "bar": 4,
      "beat": 2.0,
      "interval_semitones": 1,
      "interval_name": "minor 2nd",
      "notes": [
        { "track": "Vocal", "pitch": 64, "name": "E4" },
        { "track": "Chord", "pitch": 65, "name": "F4" }
      ]
    }
  ]
}
```

## バー検査

`--bar N` フラグで特定のバーの全ノートをトラック別に表示：

```bash
./midisketch_cli --input song.mid --bar 8
```

出力フォーマット：

```
=== Bar 8 (tick 13440-15360) ===

Vocal:
  beat 1.0: G4 (2 beats)
  beat 3.0: E4 (1 beat)

Chord:
  beat 1.0: C4,E4,G4,B4 (4 beats)

Bass:
  beat 1.0: C2 (2 beats)
  beat 3.0: G2 (2 beats)

Drums:
  beat 1.0: kick
  beat 2.0: snare
  beat 3.0: kick
  beat 4.0: snare
```

前のバーから持続しているノートは `(sustained)` と表示：

```
Vocal:
  → A4 (sustained from bar 7)
  beat 2.5: G4 (1 beat)
```

## MIDI再生成

埋め込みメタデータから曲を再生成：

```bash
# オリジナルシードで再生成
./midisketch_cli --regenerate song.mid

# 新しいシードで再生成
./midisketch_cli --regenerate song.mid --new-seed 54321
```

CLIはMIDIフォーマット（SMF1、SMF2/ktmidi、SMF2/Clip）を自動検出し、ファイルに埋め込まれた生成パラメータを抽出します。

## ワークフロー例

### BGM先行ワークフロー

まず伴奏を生成し、後からボーカルを追加：

```bash
# BGMのみ生成
./midisketch_cli --style 5 --skip-vocal -o bgm.mid

# 試聴してボーカルスタイルを決定、ボーカル付きで再生成
./midisketch_cli --regenerate bgm.mid --regenerate-vocal --vocal-attitude 2
```

### 品質イテレーション

生成、分析、critical issueがなくなるまで反復：

```bash
# 生成して分析
./midisketch_cli --seed 12345 --analyze

# 問題があれば別のシードを試す
./midisketch_cli --seed 12346 --analyze

# またはパラメータを調整
./midisketch_cli --seed 12345 --vocal-attitude 0 --analyze
```

### バッチ分析

複数ファイルを分析：

```bash
for f in *.mid; do
  echo "=== $f ==="
  ./midisketch_cli --input "$f" --json | jq '.summary'
done
```

## 出力ファイル

標準生成で作成されるファイル：

| ファイル | 説明 |
|----------|------|
| `output.mid` | 生成されたMIDI（SMF Type 1 or 2） |
| `output.json` | 生成イベントとメタデータ |

`--analyze` 使用時：

| ファイル | 説明 |
|----------|------|
| `analysis.json` | 不協和音分析レポート |

## 音程リファレンス

衝突分析で検出される音程：

| 半音 | 名称 | リスク |
|------|------|--------|
| 1 | 短2度 (minor 2nd) | 高（衝突） |
| 2 | 長2度 (major 2nd) | 低 |
| 3 | 短3度 (minor 3rd) | 安全 |
| 4 | 長3度 (major 3rd) | 安全 |
| 5 | 完全4度 (perfect 4th) | 安全 |
| 6 | トライトーン (tritone) | 中 |
| 7 | 完全5度 (perfect 5th) | 安全 |
| 8 | 短6度 (minor 6th) | 安全 |
| 9 | 長6度 (major 6th) | 安全 |
| 10 | 短7度 (minor 7th) | 低 |
| 11 | 長7度 (major 7th) | 高（衝突） |
