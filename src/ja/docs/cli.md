# CLI リファレンス

MIDI Sketch には、生成、MIDI 分析、検証、再生成を行うコマンドラインツールが含まれています。

## インストール

`midi-sketch` のソースツリーから CLI をビルドします。

```bash
cd midi-sketch
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --target midisketch_cli
```

バイナリは `build/bin/midisketch_cli` に生成されます。

## 基本的な使い方

```bash
# デフォルト設定で生成します。output.mid と output.json を作成します。
./build/bin/midisketch_cli

# スタイル、ムード、テンポを指定して生成します。
./build/bin/midisketch_cli --style 5 --mood 3 --bpm 128 -o song.mid

# 生成して不協和音レポートを書き出します。
./build/bin/midisketch_cli --style 5 --analyze

# 既存の SMF1 MIDI ファイルを分析します。
./build/bin/midisketch_cli --input existing.mid --analyze

# MIDI ファイルを検証します。
./build/bin/midisketch_cli --validate existing.mid
```

## コマンドリファレンス

### 生成パラメータ

| フラグ | 説明 | デフォルト |
|--------|------|-----------|
| `--seed N` | ランダムシード（`0` はランダムに選択） | `0` |
| `--style N` | スタイルプリセット ID（`0-16`） | `0` |
| `--blueprint N\|NAME` | Production Blueprint（`0-9`、`255` はランダム、または名前） | `0` |
| `--mood N\|NAME` | ムード ID（`0-23`）または名前。明示したムードはスタイルのマッピングを上書きします | スタイルのマッピング |
| `--chord N\|NAME` | コード進行（`0-21`）または名前 | 自動選択 |
| `--vocal-style N` | ボーカルスタイル（`0-13`。下の一覧を参照） | `0`（Auto） |
| `--bpm N` | BPM（`0` または `40-240`） | スタイルとムードから自動選択 |
| `--duration N` | 目標再生時間（秒）。`0` は選択したフォームを使用します | `0` |
| `--form N\|NAME` | フォーム／構成パターン（`0-17`）または名前 | スタイルに対応するフォーム |
| `--key N` | キー（`0-11`: C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B） | `0`（C） |
| `--config FILE` | snake_case のフィールド名を持つ `SongConfig` JSON から生成します | — |
| `-o`, `--output FILE` | 主出力ファイルのパスを指定します | `output.mid` |
| `--format FMT` | MIDI 出力形式（`smf1` または `smf2`、MIDI 2.0 コンテナ） | `smf1` |
| `--skip-vocal` | BGM 先行ワークフローのためボーカル生成をスキップします | 無効 |
| `--vocal-attitude N` | ボーカルの態度（`0-2`: Clean、Expressive、Raw） | `0` |
| `--vocal-low N` | ボーカル音域の下限（MIDI ノート、`36-96`） | `60` |
| `--vocal-high N` | ボーカル音域の上限（MIDI ノート、`36-96`） | `79` |

`--duration` は 12〜144 小節の曲構成を対象にします。フォームが生成できる長さは解決されたテンポで決まります。生成できない目標値は拒否されるか、生成可能な値に調整され、その結果が表示されます。

モーラリズムとメロディのシンコペーション確率などの設定は、`SongConfig` JSON の `mora_rhythm_mode` と `melody_syncopation_prob` フィールドで指定します。ギターはデフォルトで有効です。無効にする場合は `--no-guitar` を使います。

### ボーカルパラメータ

ボーカルだけの再生成は CLI では行えません。`--regenerate FILE` は入力ファイルに埋め込まれた完全な設定を復元し、生成オプションとの併用を拒否します。新しい `SongConfig` を `--config` で渡すか、ボーカルだけを再生成する場合は native API を使います。

ボーカルスタイル ID は次のとおりです。

| ID | スタイル |
|----|---------|
| 0 | Auto |
| 1 | Standard |
| 2 | Vocaloid |
| 3 | UltraVocaloid |
| 4 | Idol |
| 5 | Ballad |
| 6 | Rock |
| 7 | CityPop |
| 8 | Anime |
| 9 | BrightKira |
| 10 | CoolSynth |
| 11 | CuteAffected |
| 12 | PowerfulShout |
| 13 | KPop |

### メロディオーバーライド

| フラグ | 説明 | デフォルト |
|--------|------|-----------|
| `--melody-max-leap N` | メロディの最大跳躍（半音、`0` はプリセット、`1-12` は上書き） | プリセット |
| `--melody-phrase-length N` | フレーズ長（小節、`0` はプリセット、`1-8` は上書き） | プリセット |
| `--melody-long-note-ratio N` | 長音比率（`0-100`）。省略するとプリセットを使います | プリセット |
| `--melody-chorus-register-shift N` | サビの音域シフト（`-12`〜`12`）。省略するとプリセットを使います | プリセット |
| `--melody-hook-repetition N` | フックの繰り返し（`0` はプリセット、`1` はオフ、`2` はオン） | プリセット |
| `--melody-use-leading-tone N` | 導音（`0` はプリセット、`1` はオフ、`2` はオン） | プリセット |

`melody_syncopation_prob` は `SongConfig` JSON で `0-100` または `255`（プリセット）に設定できます。CLI オプションではありません。

### モチーフオーバーライド

| フラグ | 説明 | デフォルト |
|--------|------|-----------|
| `--motif-length N` | モチーフ長（小節、`0` は自動、`1`、`2`、`4`） | `0`（自動） |
| `--motif-note-count N` | モチーフ音数（`0` は自動、`3-8`） | `0`（自動） |
| `--motif-motion N` | モチーフの動き（`255` はプリセット、`0` Stepwise、`1` GentleLeap、`2` WideLeap、`3` NarrowStep、`4` Disjunct、`5` Ostinato） | プリセット |
| `--motif-register-high N` | モチーフ音域（`0` は自動、`1` は低音域、`2` は高音域） | `0`（自動） |
| `--motif-rhythm-density N` | モチーフのリズム密度（`255` はプリセット、`0` Sparse、`1` Medium、`2` Driving） | プリセット |

### 追加の生成コントロール

| フラグ | 説明 |
|--------|------|
| `--addictive` | Behavioral Loop モードを有効にします |
| `--arpeggio` | アルペジオトラックを有効にします |
| `--modulation N` | 転調タイミング（`0` None、`1` LastChorus、`2` AfterBridge、`3` EachChorus、`4` Random） |
| `--composition N` | 作曲スタイル（`0` MelodyLead、`1` BackgroundMotif、`2` SynthDriven） |
| `--enable-sus` | sus2／sus4 コード置換を有効にします |
| `--enable-9th` | 9th コード拡張を有効にします |
| `--syncopation` | メロディリズムのシンコペーションを有効にします |
| `--drive N` | ドライブ感（`0` レイドバック、`50` ニュートラル、`100` アグレッシブ） |
| `--no-drums` | ドラムトラックを無効にします |
| `--no-guitar` | ギタートラックを無効にします |
| `--vocal-groove N` | ボーカルグルーヴ（`0` Straight、`1` OffBeat、`2` Swing、`3` Syncopated、`4` Driving16th、`5` Bouncy8th） |
| `--melodic-complexity N` | メロディの複雑さ（`0` Simple、`1` Standard、`2` Complex） |
| `--hook-intensity N` | フックの強さ（`0` Off、`1` Light、`2` Normal、`3` Strong、`4` Maximum） |
| `--melody-template N` | メロディテンプレート（`0` Auto、`1-7`） |
| `--arrangement N` | アレンジの成長方法（`0` LayerAdd、`1` RegisterAdd） |
| `--motif-repeat-scope N` | モチーフの繰り返し範囲（`0` FullSong、`1` PerSection） |
| `--energy-curve N` | エネルギーカーブ（`0` GradualBuild、`1` FrontLoaded、`2` WavePattern、`3` SteadyState） |

### ヒューマナイズ

| フラグ | 説明 |
|--------|------|
| `--humanize` | タイミングとベロシティのヒューマナイズを有効にします |
| `--humanize-timing N` | タイミングの変動量（`0-100`）。ヒューマナイズも有効になります |
| `--humanize-velocity N` | ベロシティの変動量（`0-100`）。ヒューマナイズも有効になります |

### アルペジオ

これらのオプションは `--arpeggio` と組み合わせます。パターンまたは速度を指定すると、アルペジオトラックも有効になります。

| フラグ | 説明 |
|--------|------|
| `--arpeggio-pattern N` | パターン（`0` Up、`1` Down、`2` UpDown、`3` Random、`4` Pinwheel、`5` PedalRoot、`6` Alberti、`7` BrokenChord） |
| `--arpeggio-speed N` | 速度（`0` Eighth、`1` Sixteenth、`2` Triplet） |
| `--arpeggio-octave N` | オクターブ範囲（`1-3`） |
| `--arpeggio-gate N` | ゲート量（`0-100`） |

### SE、コール、MIX

| フラグ | 説明 |
|--------|------|
| `--no-se` | SE トラックを無効にします |
| `--call N` | コール設定（`0` Auto、`1` Enabled、`2` Disabled） |
| `--no-call-notes` | コールノートの出力を無効にします |
| `--intro-chant N` | イントロチャント（`0` None、`1` Gachikoi、`2` Shouting） |
| `--mix-pattern N` | MIX パターン（`0` None、`1` Standard、`2` Tiger） |
| `--call-density N` | コール密度（`0` None、`1` Minimal、`2` Standard、`3` Intense） |

### コード拡張と転調

| フラグ | 説明 |
|--------|------|
| `--enable-7th` | 7th コード拡張を有効にします |
| `--enable-tritone-sub` | トライトーン代理を有効にします |
| `--modulation-semitones N` | 転調量（`1-4` 半音） |

### ファイル操作

| フラグ | 説明 |
|--------|------|
| `--input FILE` | 既存の MIDI ファイルを分析します。`--analyze` も有効になります |
| `--validate FILE` | MIDI ファイルの構造を検証します |
| `--regenerate FILE` | 埋め込みの midi-sketch メタデータから再生成します |
| `--new-seed N` | `--regenerate` で新しいシードを使います（`0` も有効です） |
| `--format FMT` | `smf1` または `smf2`（MIDI 2.0 コンテナ）を選びます。再生成時に省略すると入力形式を保持します |
| `-o`, `--output FILE` | 生成または再生成する MIDI のパスを指定します |

`--regenerate` で入力パスと組み合わせられるのは `--new-seed`、`--format`、`--output`、`--analyze`、`--json`、`--bar`、`--dump-collisions-at` だけです。生成オプションを指定すると拒否されます。SMF1、SMF2 Clip、対応している SMF2 コンテナ形式を検出し、埋め込み設定を復元します。

デフォルトの出力形式は SMF1 です。`--input` の不協和音分析は現在 SMF1 に対応しています。SMF2 の入力は認識され、メタデータを表示できますが、不協和音分析とノート検査には対応していません。`--validate` は SMF1、SMF2 Clip、対応している ktmidi コンテナに対応しています。`SMF2CON1` の検証には対応していません。

### 分析とデバッグ

| フラグ | 説明 |
|--------|------|
| `--analyze` | 生成または入力 MIDI の不協和音を分析します |
| `--json` | 検証または分析の JSON を stdout に出力します |
| `--bar N` | バー `N`（1 始まり）のノートを検査します。ノート検査は SMF1 で利用できます |
| `--dump-collisions-at N` | ティック `N` のノートと衝突状態を出力します |
| `--help`, `-h` | バイナリが表示するコマンドリファレンスを表示します |

`--analyze --json` を指定すると、stdout には分析ドキュメントだけが出力されます。生成された MIDI とイベントのサイドカーは通常どおり書き出されます。`--validate --json` または `--input --json` では、対応する JSON レポートだけが stdout に出力されます。`--analyze` や `--validate` なしの `--json` は、通常の生成出力を JSON に切り替えません。

## SongConfig JSON

`--config` は `SongConfig` JSON オブジェクトを読み込みます。フィールド名は snake_case で、`arpeggio` と `chord_extension` のネストしたオブジェクトも native の設定型と同じ名前を使います。CLI オプションがない設定項目はこの JSON で指定します。

```json
{
  "style_preset_id": 3,
  "seed": 12345,
  "bpm": 120,
  "guitar_enabled": false,
  "enable_syncopation": true,
  "mora_rhythm_mode": 1,
  "melody_syncopation_prob": 60,
  "arpeggio_enabled": true,
  "arpeggio": {
    "pattern": 0,
    "speed": 1,
    "octave_range": 2,
    "gate": 0.8
  }
}
```

```bash
./build/bin/midisketch_cli --config song-config.json -o configured.mid
```

## 不協和音分析

`--analyze` は次の 4 種類の問題を報告します。

| タイプ | 説明 | 通常の重大度 |
|--------|------|-------------|
| **SimultaneousClash** | 短 2 度や長 7 度など、不協和音程のノートが同時に鳴ります | 高 |
| **NonChordTone** | 現在のコードに含まれないノートです | 低〜中 |
| **SustainedOverChordChange** | コードチェンジをまたいでノートが保持されます | 中 |
| **NonDiatonicNote** | キーのスケール外のノートです | 高 |

テキストレポートは検出結果を `CRITICAL`、`WARNING`、`INFO` に分類します。高い重大度の同時衝突とノンダイアトニックノートは Critical に分類されます。経過音や刺繍音は情報レベルのテンションとして表示される場合があります。

### 出力例

```
=== Dissonance Analysis ===

Action Summary:
  INFO:     47 normal musical tensions (no action needed)

Technical Breakdown:
  Simultaneous clashes:      0
  Non-chord tones:           47 (usually acceptable)
  Sustained over chord:      0
  Non-diatonic notes:        0
```

### JSON 出力

機械可読な出力には `--json` を使用します。

```bash
./build/bin/midisketch_cli --input song.mid --json > analysis.json
```

レポートには `summary` オブジェクトと `issues` 配列が含まれます。`summary` には問題数、キー、転調情報が含まれます。各問題には `type`、`severity`、`tick`、`bar`、`beat` が含まれ、衝突の場合は音程とノートの情報も含まれます。次の例は固定シードで実行した結果の抜粋で、問題は先頭の 1 件だけを示しています。

```json
{
  "summary": {
    "total_issues": 47,
    "simultaneous_clashes": 0,
    "non_chord_tones": 47,
    "sustained_over_chord_change": 0,
    "non_diatonic_notes": 0,
    "high_severity": 0,
    "medium_severity": 2,
    "low_severity": 45,
    "key": 0,
    "key_name": "C major",
    "modulation_tick": 0,
    "modulation_amount": 0,
    "pre_modulation_issues": 47,
    "post_modulation_issues": 0
  },
  "issues": [
    {
      "type": "non_chord_tone",
      "severity": "low",
      "tick": 6720,
      "bar": 4,
      "beat": 3.00,
      "track": "motif",
      "pitch": 62,
      "pitch_name": "D4",
      "chord_degree": 2,
      "chord_name": "Em",
      "chord_tones": ["E", "G", "B"],
      "provenance": {
        "generation_chord_degree": 2,
        "generation_lookup_tick": 6720,
        "generation_source": "motif",
        "original_pitch": 60
      }
    }
  ]
}
```

## バー検査

`--bar N` は、バー内のノートをトラックごとに表示します。SMF1 の入力と SMF1 で生成した出力で利用できます。

```bash
./build/bin/midisketch_cli --input song.mid --bar 4
```

出力形式（固定シードのSMF1実行からの抜粋。値は入力に依存します）：

```
=== Bar 4 (tick 5760-7680) ===

Chord:
  beat 1.0: G3 (240 tick)
  beat 1.0: B3 (240 tick)
  beat 1.0: E4 (240 tick)
  beat 1.5: G3 (240 tick)
  beat 2.0: G3 (240 tick)
  beat 2.5: G3 (240 tick)
  beat 3.0: E3 (240 tick)
  beat 3.0: G3 (240 tick)
  beat 3.0: B3 (240 tick)
  beat 3.5: G3 (240 tick)
  beat 4.0: G3 (240 tick)
  beat 4.5: G3 (240 tick)

Motif:
  beat 1.0: G4 (1 beat)
  beat 3.0: D4 (1 beat)

Aux:
  beat 1.0: B4 (1 beat)
  beat 3.0: B4 (1 beat)

Drums:
  beat 1.0: G#2 (240 tick)
  beat 1.0: D#3 (240 tick)
  beat 2.0: C#2 (240 tick)
  beat 2.0: G#2 (240 tick)
  beat 3.0: G#2 (240 tick)
  beat 4.0: C#2 (240 tick)
  beat 4.0: G#2 (240 tick)
```

前のバーで発音を開始したノートは、ビート番号なしで `(sustained)` と表示されます。

```
Vocal:
  → A4 (sustained)
  beat 2.5: G4 (1 beat)
```

## MIDI 再生成

MIDI ファイルに埋め込まれた `midi-sketch` メタデータから再生成します。

```bash
# 埋め込みシードを使い、regenerated.mid に書き出します。
./build/bin/midisketch_cli --regenerate song.mid

# 新しいシードと出力パスを指定します。
./build/bin/midisketch_cli --regenerate song.mid --new-seed 54321 -o variant.mid
```

CLI は SMF1 と対応する SMF2 形式を検出し、埋め込み `SongConfig` を復元して MIDI を書き出します。`--format` を省略すると、入力の SMF1 または SMF2 系の形式を保持します。出力形式を明示する場合は `--format smf1` または `--format smf2` を指定します。

### Blueprint パラメータ

| ID | Blueprint |
|----|-----------|
| 0 | Traditional |
| 1 | RhythmLock |
| 2 | StoryPop |
| 3 | Ballad |
| 4 | IdolStandard |
| 5 | IdolHyper |
| 6 | IdolKawaii |
| 7 | IdolCoolPop |
| 8 | IdolEmo |
| 9 | BehavioralLoop |
| 255 | ランダム選択 |

Blueprint は名前または ID で指定できます。

```bash
./build/bin/midisketch_cli --blueprint rhythmlock
./build/bin/midisketch_cli --blueprint ballad
```

## ワークフロー例

### BGM のみの生成

ボーカルトラックをスキップして伴奏を生成します。後からボーカルトラックを追加または修正する場合は、ライブラリAPI、たとえばJavaScriptの [`regenerateVocal`](./api-js#regeneratevocal-configorseed) メソッドを使います。CLI の `--regenerate` は埋め込み設定を再現するだけで、ボーカルを追加しません。

```bash
# BGM だけを生成します。
./build/bin/midisketch_cli --style 5 --skip-vocal -o bgm.mid

# 埋め込み設定を別のファイルに再生成します。
./build/bin/midisketch_cli --regenerate bgm.mid -o bgm-regenerated.mid
```

### 高度な生成

```bash
# ギターはデフォルトで有効です。ドライブ感とエネルギーを指定します。
./build/bin/midisketch_cli --style 6 --drive 80 --energy-curve 1

# K-Pop ボーカル、シンコペーション、Behavioral Loop モードで生成します。
./build/bin/midisketch_cli --style 0 --vocal-style 13 --syncopation --addictive

# メロディとモチーフを上書きします。
./build/bin/midisketch_cli --style 3 --melody-max-leap 7 --melody-chorus-register-shift 4 \
  --motif-motion 2 --motif-rhythm-density 2

# ギターとドラムを無効にし、タイミングとベロシティをヒューマナイズします。
./build/bin/midisketch_cli --style 0 --no-guitar --no-drums --humanize-timing 25 \
  --humanize-velocity 20
```

### 品質イテレーション

```bash
# 生成して分析します。
./build/bin/midisketch_cli --seed 12345 --analyze

# レポートを改善する場合は別のシードを試します。
./build/bin/midisketch_cli --seed 12346 --analyze

# 対応している生成パラメータを調整します。
./build/bin/midisketch_cli --seed 12345 --vocal-attitude 0 --analyze
```

### バッチ分析

```bash
for f in *.mid; do
  echo "=== $f ==="
  ./build/bin/midisketch_cli --input "$f" --json | jq '.summary'
done
```

## 出力ファイル

生成では MIDI ファイルとイベント JSON のサイドカーを作成します。

| 実行方法 | ファイル |
|----------|---------|
| `--output` なし | `output.mid`、`output.json` |
| `--output song.mid` | `song.mid`、`song.mid.json` |
| 生成時に `--analyze` を指定し、`--json` を指定しない場合 | `analysis.json` を追加。出力を指定した場合は `song.mid.analysis.json` |

再生成ではデフォルトで `regenerated.mid` を作成し、イベントサイドカーは作成しません。`--analyze` と `--json` なしを指定すると、レポートは `analysis.json` に書き出されます。出力を指定した場合は `<output>.analysis.json` になります。`--json --analyze` では、分析レポートをサイドカーの代わりに stdout へ出力します。

`--input` では、`--json` なしで `--output report.json` を指定すると分析レポートのパスになります。`--validate` はテキストまたは JSON のレポートを stdout に出力します。

## 音程リファレンス

分析では、評価対象のノートとコードの関係を考慮し、実際の半音距離で音程を分類します。コードボイシング、準備されたサスペンション、経過音の長さ、メトリック位置によって検出や重大度が変わります。24 半音を超える距離は通常スキップされますが、低音域のベースと長 7 度の組み合わせは例外です。次の表は一般的な音程名を示します。音程名だけで検出結果が決まるわけではありません。

| 半音数 | 名称 | 通常の扱い |
|--------|------|-----------|
| 1 | 短 2 度 (minor 2nd) | 高リスクの衝突候補 |
| 2 | 長 2 度 (major 2nd) | 文脈に依存。近接した音程は高い重大度になる場合があります |
| 3 | 短 3 度 (minor 3rd) | 通常は協和音程 |
| 4 | 長 3 度 (major 3rd) | 通常は協和音程 |
| 5 | 完全 4 度 (perfect 4th) | 文脈に依存 |
| 6 | トライトーン (tritone) | 文脈に依存。近接した音程は中程度の重大度です |
| 7 | 完全 5 度 (perfect 5th) | 通常は協和音程 |
| 8 | 短 6 度 (minor 6th) | 通常は協和音程 |
| 9 | 長 6 度 (major 6th) | 通常は協和音程 |
| 10 | 短 7 度 (minor 7th) | カラートーンとして許容される場合があります |
| 11 | 長 7 度 (major 7th) | 文脈に依存。近接した音程は中〜高の重大度になる場合があります |

複音程は実際の距離で評価されます。たとえば 13 半音は短 9 度、18 または 30 半音はトライトーン、23 または 35 半音は長 7 度です。複音程の長 7 度は、近接した長 7 度より重大度が低くなる場合があります。
