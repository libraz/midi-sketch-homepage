# C++ API リファレンス

このドキュメントでは、ネイティブアプリケーション向けのC++ APIと、FFI/WASMバインディング向けのC APIについて説明します。

## MidiSketch クラス

### コンストラクタ

```cpp
#include "midisketch.h"

midisketch::MidiSketch sketch;
```

::: info ヘッダファイル
- `midisketch.h` - C++ クラス API
- `midisketch_c.h` - FFI/WASM バインディング用 C API
- `core/types.h` - 型定義（すべてのコア型を含む）
:::

### `generateFromConfig(config)`

SongConfig オブジェクトから MIDI を生成します。

```cpp
SongConfig config;
config.style_preset_id = 0;       // スタイルプリセット ID (0-16)
config.key = Key::C;              // キー (C=0 〜 B=11)
config.bpm = 120;                 // テンポ (0=スタイルのデフォルトを使用)
config.seed = 12345;              // 乱数シード (0=ランダム)
config.chord_progression_id = 0;  // コード進行 ID (0-21)
config.form = StructurePattern::StandardPop;  // フォーム/構成 (0-17)
config.vocal_attitude = VocalAttitude::Clean; // 0=Clean, 1=Expressive, 2=Raw
config.drums_enabled = true;      // ドラムトラックを有効化

// アルペジオ設定
config.arpeggio_enabled = false;
config.arpeggio.pattern = ArpeggioPattern::Up;
config.arpeggio.speed = ArpeggioSpeed::Sixteenth;
config.arpeggio.octave_range = 2;
config.arpeggio.gate = 0.8f;
config.arpeggio.sync_chord = true;

// ボーカル設定
config.vocal_low = 60;            // ボーカル音域の下限 (MIDIノート、デフォルトC4)
config.vocal_high = 79;           // ボーカル音域の上限 (MIDIノート、デフォルトG5)
config.skip_vocal = false;        // ボーカル生成をスキップ (BGM優先ワークフロー用)

// ボーカルスタイル設定
config.vocal_style = VocalStylePreset::Auto;
config.melody_template = MelodyTemplateId::Auto;
config.melodic_complexity = MelodicComplexity::Standard;
config.hook_intensity = HookIntensity::Normal;
config.vocal_groove = VocalGrooveFeel::Straight;

// ヒューマナイズ
config.humanize = true;
config.humanize_timing = 0.5f;    // 0.0-1.0
config.humanize_velocity = 0.5f;  // 0.0-1.0

// コード拡張
config.chord_extension.enable_sus = false;
config.chord_extension.enable_7th = false;
config.chord_extension.enable_9th = false;

// 作曲スタイル
config.composition_style = CompositionStyle::MelodyLead;

// 転調設定
config.modulation_timing = ModulationTiming::None;
config.modulation_semitones = 2;  // +1 〜 +4

// コール/SE 設定 (アイドル系音楽用)
config.se_enabled = true;
config.call_setting = CallSetting::Auto;    // 0=Auto, 1=Enabled, 2=Disabled
config.call_notes_enabled = true;
config.intro_chant = IntroChant::None;
config.mix_pattern = MixPattern::None;
config.call_density = CallDensity::Standard;

// Blueprint
config.blueprint_id = 0;         // 0=Traditional, 1-9=特定, 255=ランダム

// ギター
config.guitar_enabled = true;    // ギタートラックを有効化

// アレンジメント
config.motif_repeat_scope = 0;   // 0=FullSong, 1=Section
config.arrangement_growth = 0;   // 0=LayerAdd, 1=RegisterAdd
config.target_duration_seconds = 0; // 0 = formId に従う

// ムード
config.mood = 0;                  // 0-23 (mood_explicit=true 時に使用)
config.mood_explicit = false;     // 明示的ムードを使用 vs スタイルから導出

// フィール＆表現
config.drive_feel = 50;          // 0=レイドバック, 50=ニュートラル, 100=アグレッシブ
config.enable_syncopation = false;
config.energy_curve = 0;         // 0=GradualBuild, 1=FrontLoaded, 2=WavePattern, 3=SteadyState
config.mora_rhythm_mode = 2;     // 0=Standard, 1=MoraTimed, 2=Auto
config.addictive_mode = false;   // Behavioral Loop モードを有効化

sketch.generateFromConfig(config);
```

::: info パラメータの依存関係
多くのパラメータは親オプションが有効になっている場合にのみ効果があります。例えば、`arpeggio_enabled=false` の場合、`arpeggio.pattern` は効果がありません。詳細は[オプション関係](/ja/docs/option-relationships)を参照してください。
:::

### `regenerateVocal(config)`

ボーカルトラック（および Aux トラック）のみを再生成します。同じコード進行と構成を維持します。
`generateVocal()` 後のボーカル優先の試行錯誤や、`generateFromConfig()` を `skip_vocal=true` で呼び出した後のBGM優先ワークフローで使用します。

```cpp
// シードのみ指定
sketch.regenerateVocal(12345);

// 完全な設定で指定
VocalConfig vocal_config;
vocal_config.seed = 0;                    // 乱数シード (0=新規ランダム)
vocal_config.vocal_low = 60;              // ボーカル音域の下限 (C4)
vocal_config.vocal_high = 79;             // ボーカル音域の上限 (G5)
vocal_config.vocal_attitude = VocalAttitude::Expressive;
vocal_config.vocal_style = VocalStylePreset::Auto;
vocal_config.melody_template = MelodyTemplateId::Auto;
vocal_config.melodic_complexity = MelodicComplexity::Standard;
vocal_config.hook_intensity = HookIntensity::Normal;
vocal_config.vocal_groove = VocalGrooveFeel::Straight;

sketch.regenerateVocal(vocal_config);
```

### `getMidi()`

生成された MIDI データを `std::vector<uint8_t>` として返します。

```cpp
std::vector<uint8_t> midi_data = sketch.getMidi();

// ファイルに保存
std::ofstream out("output.mid", std::ios::binary);
out.write(reinterpret_cast<const char*>(midi_data.data()), midi_data.size());
```

### `getEventsJson()`

可視化/再生用のイベントデータを JSON 文字列として返します。

```cpp
std::string events_json = sketch.getEventsJson();
// { "sections": [...], "tracks": [...], "bpm": 120, "duration_ticks": ... }
```

### `generateVocal(config)`

伴奏なしでボーカルトラックのみを生成します。試行錯誤ワークフロー用: ボーカルを生成、プレビュー、必要に応じて再生成。ボーカルに満足したら `generateAccompanimentForVocal()` を呼び出します。

```cpp
SongConfig config;
config.style_preset_id = 0;
config.key = Key::C;
config.bpm = 120;
config.vocal_attitude = VocalAttitude::Expressive;

sketch.generateVocal(config);
```

### `generateAccompanimentForVocal(config?)`

既存のボーカルに対して伴奏トラックを生成します。`generateVocal()` または `setVocalNotes()` の後に呼び出す必要があります。生成順序: Aux -> Bass -> Chord -> Guitar -> Arpeggio -> Drums -> SE（ボーカルに適応）。

```cpp
// シンプル: デフォルト設定を使用
sketch.generateAccompanimentForVocal();

// 設定付き
AccompanimentConfig acc_config;
acc_config.seed = 12345;
acc_config.drums_enabled = true;
acc_config.arpeggio_enabled = false;
acc_config.humanize = true;
acc_config.humanize_timing = 50;
acc_config.humanize_velocity = 50;

sketch.generateAccompanimentForVocal(acc_config);
```

### `regenerateAccompaniment(seedOrConfig)`

新しいシードまたは設定で伴奏トラックを再生成します。現在のボーカルを保持し、すべての伴奏トラック（Aux、Bass、Chord、Drums など）を再生成します。

```cpp
// シードのみ
sketch.regenerateAccompaniment(12345);

// 完全な設定
AccompanimentConfig acc_config;
acc_config.seed = 12345;
acc_config.drums_enabled = true;
acc_config.arpeggio_enabled = true;

sketch.regenerateAccompaniment(acc_config);
```

### `generateWithVocal(config)`

ボーカル優先でのすべてのトラックを生成します。生成順序: Vocal -> Aux -> Bass -> Chord -> Guitar -> Arpeggio -> Drums -> SE。伴奏はボーカルメロディに適応します。

```cpp
SongConfig config;
config.style_preset_id = 0;
config.key = Key::C;
config.bpm = 120;

sketch.generateWithVocal(config);
```

### `setVocalNotes(config, notes)`

伴奏生成用のカスタムボーカルノートを設定します。config から曲構成とコード進行を初期化し、提供されたノートでボーカルトラックを置き換えます。この後に `generateAccompanimentForVocal()` を呼び出します。

```cpp
SongConfig config;
config.style_preset_id = 0;
config.key = Key::C;
config.bpm = 120;

std::vector<NoteEvent> notes = {
  NoteEvent(0, 480, 60, 100),      // tick 0 で C4、長さ 480
  NoteEvent(480, 480, 62, 100),    // tick 480 で D4
  NoteEvent(960, 960, 64, 100),    // tick 960 で E4、長さ 960
};

sketch.setVocalNotes(config, notes);

// カスタムボーカルに対して伴奏を生成
sketch.generateAccompanimentForVocal();

// MIDI データを取得
auto midi = sketch.getMidi();
```

### `getHarmonyContext()`

ピアノロール安全性 API 用のハーモニーコンテキストを取得します。

```cpp
const IHarmonyContext& harmony = sketch.getHarmonyContext();
```

### `getMelody()` / `setMelody(melody)`

メロディデータの取得/設定（候補の保存/復元用）。

```cpp
// 現在のメロディを保存
MelodyData melody = sketch.getMelody();

// ... 他のメロディを試す ...

// 保存したメロディを復元
sketch.setMelody(melody);
```

### `setMidiFormat(format)` / `getMidiFormat()`

MIDI 出力フォーマットの設定/取得。

```cpp
sketch.setMidiFormat(MidiFormat::SMF1);  // 標準 MIDI ファイル Type 1
// または
sketch.setMidiFormat(MidiFormat::SMF2);  // MIDI 2.0 コンテナファイル (デフォルト)

MidiFormat format = sketch.getMidiFormat();
```

### `version()`

ライブラリのバージョン文字列を取得します。

```cpp
const char* version = MidiSketch::version();
// 例: "0.2.1"
```

---

## 生成ワークフロー

MIDI Sketch は3つの生成ワークフローをサポートしており、それぞれ異なるユースケースに適しています：

::: tip ワークフローの選択
| ワークフロー | ユースケース |
|----------|----------|
| **BGM 優先** | ボーカルを追加する前に伴奏をプレビュー |
| **ボーカル優先** | バッキングトラック生成前にメロディを繰り返し調整 |
| **カスタムボーカル** | 独自のメロディをインポートして適した伴奏を生成 |
:::

### BGM 優先ワークフロー

最初にバッキングトラックを生成し、その後ボーカルを追加：

```cpp
MidiSketch sketch;

// ステップ 1: BGM のみ生成
SongConfig config;
config.style_preset_id = 0;
config.skip_vocal = true;
sketch.generateFromConfig(config);

// BGM をプレビュー...

// ステップ 2: ボーカルを追加
VocalConfig vocal_config;
vocal_config.seed = 0;
vocal_config.vocal_low = 60;
vocal_config.vocal_high = 79;
vocal_config.vocal_attitude = VocalAttitude::Expressive;

sketch.regenerateVocal(vocal_config);

auto midi_data = sketch.getMidi();
```

### ボーカル優先ワークフロー

最初にボーカルを生成、プレビュー、繰り返し調整してから伴奏を生成：

```cpp
MidiSketch sketch;

SongConfig config;
config.style_preset_id = 0;

// ステップ 1: ボーカルのみ生成
sketch.generateVocal(config);

// 満足するまでプレビューと繰り返し...
VocalConfig vocal_config;
vocal_config.seed = 12345;
vocal_config.vocal_attitude = VocalAttitude::Raw;
sketch.regenerateVocal(vocal_config);

// ステップ 2: ボーカルに対して伴奏を生成
sketch.generateAccompanimentForVocal();

auto midi_data = sketch.getMidi();
```

### カスタムボーカルインポートワークフロー

独自のメロディをインポートして適した伴奏を生成：

```cpp
MidiSketch sketch;

SongConfig config;
config.style_preset_id = 0;

// ステップ 1: カスタムボーカルノートを設定
std::vector<NoteEvent> notes = {
  NoteEvent(0, 480, 60, 100),
  NoteEvent(480, 480, 62, 100),
  NoteEvent(960, 960, 64, 100),
};

sketch.setVocalNotes(config, notes);

// ステップ 2: 伴奏を生成
sketch.generateAccompanimentForVocal();

auto midi_data = sketch.getMidi();
```

---

## コア型

### SongConfig

MIDI 生成のメイン設定構造体。

```cpp
struct SongConfig {
  uint8_t style_preset_id = 0;      // スタイルプリセット ID (0-16)
  uint8_t blueprint_id = 0;         // Production Blueprint (0-9, 255=ランダム)
  Key key = Key::C;                 // 音楽キー
  uint16_t bpm = 0;                 // テンポ (0 = スタイルのデフォルトを使用)
  uint32_t seed = 0;                // 乱数シード (0 = ランダム)
  uint8_t chord_progression_id = 0; // コード進行 ID
  StructurePattern form;            // 曲構成 (formId 0-17)
  bool form_explicit = false;       // formId をそのまま使用 vs ランダム化を許可
  uint16_t target_duration_seconds = 0; // 目標尺 (0 = formId に従う)
  VocalAttitude vocal_attitude;     // ボーカル表現スタイル (0-2)
  VocalStylePreset vocal_style = VocalStylePreset::Auto; // ボーカルスタイルプリセット (0-13)
  bool drums_enabled = true;
  bool drums_enabled_explicit = false; // ドラム設定がユーザーにより明示的に指定された場合 true
  bool guitar_enabled = true;       // ギタートラックを有効化 (デフォルト: true、C++/JS 共通)
  bool arpeggio_enabled = false;
  bool skip_vocal = false;          // ボーカルをスキップ (BGM 優先)
  uint8_t vocal_low = 60;           // C4
  uint8_t vocal_high = 79;          // G5
  CompositionStyle composition_style; // 0=MelodyLead, 1=BackgroundMotif, 2=SynthDriven
  uint8_t motif_repeat_scope = 0;   // 0=FullSong, 1=Section
  uint8_t arrangement_growth = 0;   // 0=LayerAdd, 1=RegisterAdd

  // アルペジオ設定
  ArpeggioParams arpeggio;          // pattern, speed, octave_range, gate (0.0-1.0, デフォルト 0.8),
                                    //   sync_chord, base_velocity (0-127, デフォルト 90)

  // コード拡張
  ChordExtensionParams chord_extension; // enable_sus/enable_7th/enable_9th/tritone_sub (bool),
                                        //   確率は 0.0-1.0: sus 0.2, 7th 0.15, 9th 0.25, tritone 0.5
  bool chord_ext_prob_explicit = false; // コード拡張確率を明示的に指定

  // ヒューマナイズ
  bool humanize = false;
  float humanize_timing = 0.4f;     // 0.0-1.0
  float humanize_velocity = 0.3f;   // 0.0-1.0

  // 転調
  ModulationTiming modulation_timing = ModulationTiming::None;
  int8_t modulation_semitones = 2;  // +1 〜 +4

  // コール/SE設定
  bool se_enabled = true;
  uint8_t call_setting = 0;         // 0=Auto, 1=Enabled, 2=Disabled
  bool call_notes_enabled = true;   // コールをノートとして出力
  uint8_t intro_chant = 0;          // 0=None, 1=Gachikoi, 2=Shouting
  uint8_t mix_pattern = 0;          // 0=None, 1=Standard, 2=Tiger
  uint8_t call_density = 2;         // 0=None, 1=Minimal, 2=Standard, 3=Intense

  // ボーカルスタイル設定
  MelodyTemplateId melody_template = MelodyTemplateId::Auto; // 0-7
  MelodicComplexity melodic_complexity = MelodicComplexity::Standard; // 0-2
  HookIntensity hook_intensity = HookIntensity::Normal; // 0-4 (4=Maximum、通常は Behavioral Loop が強制設定)
  VocalGrooveFeel vocal_groove = VocalGrooveFeel::Straight; // 0-5

  // ムード
  uint8_t mood = 0;                 // ムードプリセット (0-23、mood_explicit=true 時に使用)
  bool mood_explicit = false;       // 明示的なムードを使用 vs スタイルから導出

  // フィール＆表現
  uint8_t drive_feel = 50;          // ドライブ感 (0=レイドバック, 50=ニュートラル, 100=アグレッシブ)
  bool addictive_mode = false;      // Behavioral Loop モードを有効化
  uint8_t mora_rhythm_mode = 2;     // モーラリズム: 0=Standard, 1=MoraTimed, 2=Auto
  bool enable_syncopation = false;  // シンコペーション効果を有効化
  uint8_t energy_curve = 0;         // エネルギーカーブ: 0=GradualBuild, 1=FrontLoaded,
                                    //   2=WavePattern, 3=SteadyState

  // メロディオーバーライド (センチネル値 = プリセットのデフォルトを使用)
  uint8_t melody_max_leap = 0;           // メロディの最大跳躍: 0=プリセット, 1-12=半音
  uint8_t melody_syncopation_prob = 0xFF; // シンコペーション確率: 0xFF=プリセット, 0-100=%
  uint8_t melody_phrase_length = 0;      // フレーズ長: 0=プリセット, 1-8=小節
  uint8_t melody_long_note_ratio = 0xFF; // ロングノート比率: 0xFF=プリセット, 0-100=%
  int8_t melody_chorus_register_shift = -128; // サビ音域シフト: -128=プリセット, -12〜+12
  uint8_t melody_hook_repetition = 0;    // フック反復 (0=プリセット, 1=オフ, 2=オン)
  uint8_t melody_use_leading_tone = 0;   // 導音 (0=プリセット, 1=オフ, 2=オン)

  // モチーフオーバーライド (センチネル値 = プリセットのデフォルトを使用)
  uint8_t motif_length = 0;         // モチーフ長: 0=自動, 1/2/4=拍
  uint8_t motif_note_count = 0;     // モチーフ音数: 0=自動, 3-8
  uint8_t motif_motion = 0xFF;      // モチーフモーション: 0xFF=プリセット, 0-4=MotifMotion
  uint8_t motif_register_high = 0;  // モチーフ音域: 0=自動, 1=低, 2=高
  uint8_t motif_rhythm_density = 0xFF; // モチーフリズム密度: 0xFF=プリセット, 0-2=MotifRhythmDensity

  // モチーフコード設定
  MotifChordParams motif_chord;     // fixed_progression (デフォルト true), max_chord_count (デフォルト 4)
};
```

::: details 完全な SongConfig フィールド
完全な構造体定義は [preset_types.h](https://github.com/libraz/midi-sketch/blob/main/src/core/preset_types.h) を参照してください。
:::

### VocalConfig

ボーカル再生成の設定。

```cpp
struct VocalConfig {
  uint32_t seed = 0;                // 乱数シード (0 = 新規ランダム)
  uint8_t vocal_low = 60;           // ボーカル音域の下限
  uint8_t vocal_high = 79;          // ボーカル音域の上限
  VocalAttitude vocal_attitude = VocalAttitude::Clean;
  VocalStylePreset vocal_style = VocalStylePreset::Auto;
  MelodyTemplateId melody_template = MelodyTemplateId::Auto;
  MelodicComplexity melodic_complexity = MelodicComplexity::Standard;
  HookIntensity hook_intensity = HookIntensity::Normal;
  VocalGrooveFeel vocal_groove = VocalGrooveFeel::Straight;
  CompositionStyle composition_style = CompositionStyle::MelodyLead;
  bool keep_motif = false;          // RhythmSync: 既存のMotifをリズムの軸として保持
                                    //   (デフォルト: ボーカルとモチーフの両方を再生成)
};
```

### AccompanimentConfig

伴奏生成/再生成の設定。

```cpp
struct AccompanimentConfig {
  uint32_t seed = 0;                // 乱数シード (0 = 自動生成)

  // ドラム
  bool drums_enabled = true;

  // ギター
  bool guitar_enabled = true;       // ギタートラックを有効化 (デフォルト: true)

  // アルペジオ
  bool arpeggio_enabled = false;
  uint8_t arpeggio_pattern = 0;     // 0=Up, 1=Down, 2=UpDown, 3=Random,
                                    // 4=Pinwheel, 5=PedalRoot, 6=Alberti, 7=BrokenChord
  uint8_t arpeggio_speed = 1;       // 0=Eighth, 1=Sixteenth, 2=Triplet
  uint8_t arpeggio_octave_range = 2;
  uint8_t arpeggio_gate = 80;       // 0-100
  bool arpeggio_sync_chord = true;

  // コード拡張
  bool chord_ext_sus = false;
  bool chord_ext_7th = false;
  bool chord_ext_9th = false;
  bool chord_ext_tritone_sub = false; // トライトーン代理 (V7 -> bII7)
  uint8_t chord_ext_sus_prob = 20;  // 0-100
  uint8_t chord_ext_7th_prob = 30;  // 0-100
  uint8_t chord_ext_9th_prob = 25;  // 0-100
  uint8_t chord_ext_tritone_sub_prob = 50; // 0-100

  // ヒューマナイズ
  bool humanize = false;
  uint8_t humanize_timing = 50;     // 0-100
  uint8_t humanize_velocity = 50;   // 0-100

  // SE/コール
  bool se_enabled = true;
  bool call_enabled = false;
  uint8_t call_density = 2;         // 0-3
  uint8_t intro_chant = 0;          // 0=None, 1=Gachikoi, 2=Shouting
  uint8_t mix_pattern = 0;          // 0=None, 1=Standard, 2=Tiger
  bool call_notes_enabled = true;   // コールをノートとして出力
};
```

### NoteEvent

ノートイベント構造体。

```cpp
struct NoteEvent {
  Tick start_tick;    // 開始時間 (tick)
  Tick duration;      // 長さ (tick)
  uint8_t note;       // MIDI ノート番号 (0-127)
  uint8_t velocity;   // MIDI ベロシティ (0-127)

  NoteEvent(Tick start, Tick dur, uint8_t n, uint8_t vel);
};
```

::: details Tick について
MIDI Sketch は時間単位として **tick** を使用します（四分音符あたり 480 tick）：
- **四分音符**: 480 tick
- **八分音符**: 240 tick
- **十六分音符**: 120 tick
- **全音符**: 1920 tick
- **1小節 (4/4)**: 1920 tick

例: 第2拍（tick 480）で始まり1拍分の長さのノート：
```cpp
NoteEvent(480, 480, 60, 100)  // 第2拍の C4、長さ1拍
```
:::

### MelodyData

メロディデータの保存/復元用。

```cpp
struct MelodyData {
  uint32_t seed;                   // 使用された乱数シード
  std::vector<NoteEvent> notes;    // メロディノート
};
```

---

## 列挙型

### Key

音楽キー (0-11)。

```cpp
enum class Key : uint8_t {
  C = 0, Cs, D, Eb, E, F, Fs, G, Ab, A, Bb, B
};
```

### VocalAttitude

ボーカル表現スタイル。

```cpp
enum class VocalAttitude : uint8_t {
  Clean = 0,      // クリーン、コントロールされた
  Expressive,     // 表現豊か、ダイナミック
  Raw             // 生々しい、感情的
};
```

### CompositionStyle

全体的な音楽アプローチ。

```cpp
enum class CompositionStyle : uint8_t {
  MelodyLead = 0,    // 伝統的: メロディが前面
  BackgroundMotif,   // モチーフが前面
  SynthDriven        // シンセ/アルペジオが前面
};
```

### VocalStylePreset

ボーカルスタイルプリセット。

```cpp
enum class VocalStylePreset : uint8_t {
  Auto = 0,          // スタイルに基づいて自動選択
  Standard,          // 標準的なポップボーカル
  Vocaloid,          // ボカロ風 (速く、広い跳躍)
  UltraVocaloid,     // 超高速ボカロ (32分音符)
  Idol,              // アイドル風 (キャッチー、フック重視)
  Ballad,            // バラード (遅く、長いノート)
  Rock,              // ロック (パワフル、コーラスでレジスターシフト)
  CityPop,           // シティポップ (ジャジー、シンコペーション)
  Anime,             // アニメ風 (ダイナミック、表現豊か)
  BrightKira,        // ブライト/キラキラ (高く、輝く)
  CoolSynth,         // クールシンセ (電子的、正確)
  CuteAffected,      // キュート/あざとい (遊び心)
  PowerfulShout,     // パワフルシャウト (激しい)
  KPop               // K-Pop (タイトなリズム、ダンス志向)
};
```

### MelodyTemplateId

メロディテンプレートパターン。

```cpp
enum class MelodyTemplateId : uint8_t {
  Auto = 0,          // VocalStylePreset に基づいて自動選択
  PlateauTalk,       // 同音連打多め (NewJeans, Billie Eilish)
  RunUpTarget,       // 目標音への上昇 (アニメ系ハイエナジー、ドラマチックポップ)
  DownResolve,       // 下降解決 (Bメロ向け)
  HookRepeat,        // 短い繰り返しフック (TikTok, K-POP)
  SparseAnchor,      // まばらなアンカーノート (バラード)
  CallResponse,      // デュエット風コールアンドレスポンス
  JumpAccent         // 感情的なピークジャンプ
};
```

### MelodicComplexity

メロディ複雑度レベル。

```cpp
enum class MelodicComplexity : uint8_t {
  Simple = 0,    // シンプルなメロディ、最小限の音程
  Standard,      // 標準的なメロディ複雑度
  Complex        // 複雑、大きな音程
};
```

### HookIntensity

フック繰り返しの強度。

```cpp
enum class HookIntensity : uint8_t {
  Off = 0,     // フック繰り返しなし
  Light,       // 軽いフック
  Normal,      // 通常のフック繰り返し (デフォルト)
  Strong,      // 強い、キャッチーなフック
  Maximum      // 最大反復 (Behavioral Loop / addictive_mode が使用)
};
```

### VocalGrooveFeel

ボーカルのグルーブ/リズム感。

```cpp
enum class VocalGrooveFeel : uint8_t {
  Straight = 0,   // ストレートなリズム
  OffBeat,        // オフビート強調
  Swing,          // スウィング感
  Syncopated,     // シンコペーション
  Driving16th,    // ドライブ感のある16分
  Bouncy8th       // バウンシーな8分
};
```

### ModulationTiming

転調タイミング。

```cpp
enum class ModulationTiming : uint8_t {
  None = 0,        // 転調なし
  LastChorus,      // 最後のサビで転調
  AfterBridge,     // ブリッジ後に転調
  EachChorus,      // 各サビで転調
  Random           // ランダムな転調タイミング
};
```

### TrackRole

トラックロール識別子。

```cpp
enum class TrackRole : uint8_t {
  Vocal = 0,   // メインメロディトラック
  Chord,       // コードボイシングトラック
  Bass,        // ベースライントラック
  Drums,       // ドラムパターントラック
  SE,          // 効果音 (コール、チャント)
  Motif,       // バックグラウンドモチーフトラック
  Arpeggio,    // シンセアルペジオトラック
  Aux,         // 補助ボーカルトラック
  Guitar       // ギタートラック
};
```

### ArpeggioPattern / ArpeggioSpeed

アルペジオ設定。

```cpp
enum class ArpeggioPattern : uint8_t {
  Up,           // 上昇
  Down,         // 下降
  UpDown,       // 上昇後下降
  Random,       // ランダム順序
  Pinwheel,     // 高低音を交互に配置
  PedalRoot,    // ルートペダルと上声部の動き
  Alberti,      // クラシックなアルベルティ・バスパターン
  BrokenChord   // 分散和音ボイシング
};

enum class ArpeggioSpeed : uint8_t {
  Eighth,      // 8分音符
  Sixteenth,   // 16分音符 (デフォルト)
  Triplet      // 三連符
};
```

### EnergyCurve

楽曲全体のダイナミクス進行を制御するエネルギーカーブ。

```cpp
enum class EnergyCurve : uint8_t {
  GradualBuild = 0,  // クライマックスに向けて徐々に盛り上がる
  FrontLoaded,       // 冒頭からハイエネルギー
  WavePattern,       // エネルギーが波状に交互する
  SteadyState        // 全体を通じて一定のエネルギー
};
```

### MoraRhythmMode

日本語歌詞のアラインメント用モーラベースリズムモード。

```cpp
enum class MoraRhythmMode : uint8_t {
  Standard = 0,    // 標準リズム（モーラを無視）
  MoraTimed,       // モーラタイミングリズム（1モーラ1音）
  Auto             // スタイルに基づいて自動選択（デフォルト）
};
```

### MotifMotion

バックグラウンドモチーフパターンの動きのスタイル。

```cpp
enum class MotifMotion : uint8_t {
  Stepwise = 0,    // 滑らかな順次進行
  GentleLeap,      // 穏やかな跳躍（3度、4度）
  WideLeap,        // 広い跳躍（5度以上）
  NarrowStep,      // 狭い半音階的進行
  Disjunct          // 非連続的/角ばった動き
  // Ostinato(5) は内部使用のみ
};
```

### MotifRhythmDensity

バックグラウンドモチーフパターンのリズム密度。

```cpp
enum class MotifRhythmDensity : uint8_t {
  Sparse = 0,    // まばらで開放的なリズム
  Medium,        // 中程度の密度（デフォルト）
  Driving        // 密で推進力のあるリズム
};
```

### MidiFormat

MIDI ファイルフォーマット。

```cpp
enum class MidiFormat : uint8_t {
  SMF1 = 1,    // 標準 MIDI ファイル Type 1 (レガシー)
  SMF2 = 2     // MIDI 2.0 コンテナファイル (ktmidi フォーマット)
};
```

---

## 定数

```cpp
constexpr Tick TICKS_PER_BEAT = 480;     // 四分音符あたりの tick
constexpr uint8_t BEATS_PER_BAR = 4;     // 小節あたりの拍数 (4/4)
constexpr Tick TICKS_PER_BAR = 1920;     // 小節あたりの tick
constexpr uint8_t MIDI_C4 = 60;          // 中央 C
constexpr MidiFormat kDefaultMidiFormat = MidiFormat::SMF2;
```

---

## C API (midisketch_c.h)

C API は WASM およびその他の言語統合用の FFI バインディングを提供します。

::: warning メモリ管理
ポインタを返す関数（例: `midisketch_get_midi`）はメモリを確保するため、対応する解放関数（例: `midisketch_free_midi`）で解放する必要があります。
:::

### ハンドル管理

```c
// 新しい MidiSketch インスタンスを作成
MidiSketchHandle midisketch_create(void);

// MidiSketch インスタンスを破棄
void midisketch_destroy(MidiSketchHandle handle);
```

### 生成関数

```c
// 曲設定から生成
MidiSketchError midisketch_generate_from_config(
    MidiSketchHandle handle,
    const MidiSketchSongConfig* config
);

// ボーカルのみ生成
MidiSketchError midisketch_generate_vocal(
    MidiSketchHandle handle,
    const MidiSketchSongConfig* config
);

// 新しい設定でボーカルを再生成
MidiSketchError midisketch_regenerate_vocal(
    MidiSketchHandle handle,
    const MidiSketchVocalConfig* config
);

// 伴奏を生成
MidiSketchError midisketch_generate_accompaniment(MidiSketchHandle handle);

// 新しいシードで伴奏を再生成
MidiSketchError midisketch_regenerate_accompaniment(
    MidiSketchHandle handle,
    uint32_t new_seed
);

// ボーカル優先ですべてのトラックを生成
MidiSketchError midisketch_generate_with_vocal(
    MidiSketchHandle handle,
    const MidiSketchSongConfig* config
);

// カスタムボーカルノートを設定
MidiSketchError midisketch_set_vocal_notes(
    MidiSketchHandle handle,
    const MidiSketchSongConfig* config,
    const MidiSketchNoteInput* notes,
    size_t count
);
```

### 出力関数

```c
// MIDI データを取得 (midisketch_free_midi で解放必須)
MidiSketchMidiData* midisketch_get_midi(MidiSketchHandle handle);

// ボーカルプレビュー MIDI を取得
MidiSketchMidiData* midisketch_get_vocal_preview_midi(MidiSketchHandle handle);

// MIDI データを解放
void midisketch_free_midi(MidiSketchMidiData* data);

// イベントデータを JSON として取得 (midisketch_free_events で解放必須)
MidiSketchEventData* midisketch_get_events(MidiSketchHandle handle);

// イベントデータを解放
void midisketch_free_events(MidiSketchEventData* data);
```

### プリセット情報

```c
// カウントを取得
uint8_t midisketch_style_preset_count(void);
uint8_t midisketch_structure_count(void);
uint8_t midisketch_chord_count(void);

// 名前を取得
const char* midisketch_style_preset_name(uint8_t id);
const char* midisketch_style_preset_display_name(uint8_t id);

// スタイルに互換性のあるプログレッション/フォームを取得 (WASM 向け)
MidiSketchChordCandidates* midisketch_get_progressions_by_style_ptr(uint8_t style_id);
MidiSketchFormCandidates* midisketch_get_forms_by_style_ptr(uint8_t style_id);

// スタイルのデフォルト設定を作成 (WASM 向け)
MidiSketchSongConfig* midisketch_create_default_config_ptr(uint8_t style_id);

// 設定を検証
MidiSketchConfigError midisketch_validate_config(const MidiSketchSongConfig* config);
```

### Blueprint 情報

```c
// 利用可能な Blueprint の数を取得
uint8_t midisketch_blueprint_count(void);

// ID で Blueprint 名を取得
const char* midisketch_blueprint_name(uint8_t id);

// ID で Blueprint パラダイムを取得 (0=Traditional, 1=RhythmSync, 2=MelodyDriven)
uint8_t midisketch_blueprint_paradigm(uint8_t id);

// ID で Blueprint リフポリシーを取得 (0=Free, 1=LockedContour, 2=LockedPitch, 3=LockedAll, 4=Evolving)
uint8_t midisketch_blueprint_riff_policy(uint8_t id);

// ID で Blueprint の重み（自動選択用）を取得
uint8_t midisketch_blueprint_weight(uint8_t id);

// Blueprint がドラムトラックを必須とするか (1, 5, 7 -> 非ゼロ)
int midisketch_blueprint_drums_required(uint8_t id);

// 生成後に解決された Blueprint ID を取得
uint8_t midisketch_get_resolved_blueprint_id(MidiSketchHandle handle);
```

### JSON Config API (WASM)

JSON ベースの API は WASM/JS バインディングでの設定交換に使用されます。

```c
// JSON 設定文字列から生成
MidiSketchError midisketch_generate_from_json(
    MidiSketchHandle handle,
    const char* json,
    size_t json_length
);

// JSON 設定を検証
MidiSketchConfigError midisketch_validate_config_json(
    const char* json,
    size_t json_length
);

// デフォルト設定を JSON 文字列として作成
const char* midisketch_create_default_config_json(uint8_t style_id);

// JSON 設定からボーカルのみ生成
MidiSketchError midisketch_generate_vocal_from_json(
    MidiSketchHandle handle,
    const char* json,
    size_t json_length
);

// JSON 設定からボーカル優先で全トラック生成
MidiSketchError midisketch_generate_with_vocal_from_json(
    MidiSketchHandle handle,
    const char* json,
    size_t json_length
);

// JSON 設定からボーカルを再生成
MidiSketchError midisketch_regenerate_vocal_from_json(
    MidiSketchHandle handle,
    const char* json,
    size_t json_length
);

// JSON 設定から伴奏を生成
MidiSketchError midisketch_generate_accompaniment_from_json(
    MidiSketchHandle handle,
    const char* json,
    size_t json_length
);

// JSON 設定から伴奏を再生成
MidiSketchError midisketch_regenerate_accompaniment_from_json(
    MidiSketchHandle handle,
    const char* json,
    size_t json_length
);

// JSON からカスタムボーカルノートを設定
MidiSketchError midisketch_set_vocal_notes_from_json(
    MidiSketchHandle handle,
    const char* json,
    size_t json_length
);
```

### Piano Roll Safety API

```c
// ティック範囲のピアノロール安全性を取得
MidiSketchPianoRollData* midisketch_get_piano_roll_safety(
    MidiSketchHandle handle,
    uint32_t start_tick,
    uint32_t end_tick,
    uint32_t step
);

// 単一ティックのピアノロール安全性を取得
MidiSketchPianoRollInfo* midisketch_get_piano_roll_safety_at(
    MidiSketchHandle handle,
    uint32_t tick
);

// 前のピッチコンテキスト付きでピアノロール安全性を取得（跳躍検出用）
MidiSketchPianoRollInfo* midisketch_get_piano_roll_safety_with_context(
    MidiSketchHandle handle,
    uint32_t tick,
    uint8_t prev_pitch
);

// ピアノロールデータを解放
void midisketch_free_piano_roll_data(MidiSketchPianoRollData* data);

// 理由フラグを人間が読める文字列に変換
const char* midisketch_reason_to_string(uint16_t reason);

// 設定エラーメッセージ文字列を取得
const char* midisketch_config_error_string(uint8_t error_code);
```

### エラーコード

```c
typedef enum {
  MIDISKETCH_OK = 0,
  MIDISKETCH_ERROR_INVALID_PARAM = 1,
  MIDISKETCH_ERROR_INVALID_STRUCTURE = 2,
  MIDISKETCH_ERROR_INVALID_MOOD = 3,
  MIDISKETCH_ERROR_INVALID_CHORD = 4,
  MIDISKETCH_ERROR_GENERATION_FAILED = 5,
  MIDISKETCH_ERROR_OUT_OF_MEMORY = 6,
} MidiSketchError;
```

### C API 構造体

```c
// MIDI バイナリ出力
typedef struct {
  uint8_t* data;
  size_t size;
} MidiSketchMidiData;

// イベント JSON 出力
typedef struct {
  char* json;
  size_t length;
} MidiSketchEventData;

// カスタムボーカル用ノート入力
typedef struct {
  uint32_t start_tick;
  uint32_t duration;
  uint8_t pitch;
  uint8_t velocity;
} MidiSketchNoteInput;
```

---

## 完全なサンプル

### C++ サンプル

```cpp
#include "midisketch.h"
#include <fstream>

int main() {
    using namespace midisketch;

    // インスタンスを作成
    MidiSketch sketch;

    // 設定
    SongConfig config;
    config.style_preset_id = 0;  // J-Pop
    config.key = Key::C;
    config.bpm = 120;
    config.seed = 12345;
    config.drums_enabled = true;
    config.vocal_attitude = VocalAttitude::Expressive;

    // 生成
    sketch.generateFromConfig(config);

    // MIDI データを取得
    auto midi = sketch.getMidi();

    // ファイルに保存
    std::ofstream out("output.mid", std::ios::binary);
    out.write(reinterpret_cast<const char*>(midi.data()), midi.size());

    return 0;
}
```

### C サンプル

```c
#include "midisketch_c.h"
#include <stdio.h>

int main() {
    // インスタンスを作成
    MidiSketchHandle handle = midisketch_create();

    // J-Pop スタイルのデフォルト設定を取得
    MidiSketchSongConfig* config = midisketch_create_default_config_ptr(0);
    config->key = 0;  // C
    config->bpm = 120;
    config->seed = 12345;

    // 生成
    MidiSketchError err = midisketch_generate_from_config(handle, config);
    if (err != MIDISKETCH_OK) {
        printf("生成失敗: %d\n", err);
        midisketch_destroy(handle);
        return 1;
    }

    // MIDI データを取得
    MidiSketchMidiData* midi = midisketch_get_midi(handle);

    // ファイルに保存
    FILE* f = fopen("output.mid", "wb");
    fwrite(midi->data, 1, midi->size, f);
    fclose(f);

    // クリーンアップ
    midisketch_free_midi(midi);
    midisketch_destroy(handle);

    return 0;
}
```
