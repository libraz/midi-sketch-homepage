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
config.chord_progression_id = 0;  // コード進行 ID
config.form = StructurePattern::StandardPop;  // フォーム/構成
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
config.vocal_low = 55;            // ボーカル音域の下限 (MIDI ノート番号)
config.vocal_high = 74;           // ボーカル音域の上限 (MIDI ノート番号)
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
config.se_enabled = false;
config.call_setting = CallSetting::Auto;
config.intro_chant = IntroChant::None;
config.mix_pattern = MixPattern::None;
config.call_density = CallDensity::Standard;

sketch.generateFromConfig(config);
```

::: info パラメータの依存関係
多くのパラメータは親オプションが有効になっている場合にのみ効果があります。例えば、`arpeggio_enabled=false` の場合、`arpeggio.pattern` は効果がありません。詳細は[オプション関係](/ja/docs/option-relationships)を参照してください。
:::

### `regenerateVocal(config)`

ボーカルトラック（および Aux トラック）のみを再生成します。BGM トラック（コード、ベース、ドラム、アルペジオ）は変更されません。
BGM 優先ワークフローで `generateFromConfig()` を `skip_vocal=true` で呼び出した後に使用します。

```cpp
// シードのみ指定
sketch.regenerateVocal(12345);

// 完全な設定で指定
VocalConfig vocal_config;
vocal_config.seed = 0;                    // 乱数シード (0=新規ランダム)
vocal_config.vocal_low = 55;              // ボーカル音域の下限
vocal_config.vocal_high = 74;             // ボーカル音域の上限
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

既存のボーカルに対して伴奏トラックを生成します。`generateVocal()` または `setVocalNotes()` の後に呼び出す必要があります。生成順序: Aux -> Bass -> Chord -> Drums（ボーカルに適応）。

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

ボーカル優先でのすべてのトラックを生成します。生成順序: Vocal -> Aux -> Bass -> Chord -> Drums。伴奏はボーカルメロディに適応します。

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
// "0.1.0"
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
vocal_config.vocal_low = 55;
vocal_config.vocal_high = 74;
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
  Key key = Key::C;                 // 音楽キー
  uint16_t bpm = 0;                 // テンポ (0 = スタイルのデフォルトを使用)
  uint32_t seed = 0;                // 乱数シード (0 = ランダム)
  uint8_t chord_progression_id = 0; // コード進行 ID
  StructurePattern form;            // 曲構成
  VocalAttitude vocal_attitude;     // ボーカル表現スタイル
  bool drums_enabled = true;
  bool arpeggio_enabled = false;
  bool skip_vocal = false;          // ボーカルをスキップ (BGM 優先)
  uint8_t vocal_low = 60;           // C4
  uint8_t vocal_high = 79;          // G5
  ArpeggioParams arpeggio;          // アルペジオ設定
  ChordExtensionParams chord_extension;
  CompositionStyle composition_style;
  // ... その他
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
};
```

### AccompanimentConfig

伴奏生成/再生成の設定。

```cpp
struct AccompanimentConfig {
  uint32_t seed = 0;                // 乱数シード (0 = 自動生成)

  // ドラム
  bool drums_enabled = true;

  // アルペジオ
  bool arpeggio_enabled = false;
  uint8_t arpeggio_pattern = 0;     // 0=Up, 1=Down, 2=UpDown, 3=Random
  uint8_t arpeggio_speed = 1;       // 0=Eighth, 1=Sixteenth, 2=Triplet
  uint8_t arpeggio_octave_range = 2;
  uint8_t arpeggio_gate = 80;       // 0-100
  bool arpeggio_sync_chord = true;

  // コード拡張
  bool chord_ext_sus = false;
  bool chord_ext_7th = false;
  bool chord_ext_9th = false;
  uint8_t chord_ext_sus_prob = 20;  // 0-100
  uint8_t chord_ext_7th_prob = 30;
  uint8_t chord_ext_9th_prob = 25;

  // ヒューマナイズ
  bool humanize = false;
  uint8_t humanize_timing = 50;     // 0-100
  uint8_t humanize_velocity = 50;

  // SE/コール
  bool se_enabled = true;
  bool call_enabled = false;
  uint8_t call_density = 2;         // 0-3
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
  PowerfulShout      // パワフルシャウト (激しい)
};
```

### MelodyTemplateId

メロディテンプレートパターン。

```cpp
enum class MelodyTemplateId : uint8_t {
  Auto = 0,          // VocalStylePreset に基づいて自動選択
  PlateauTalk,       // 同音連打多め (NewJeans, Billie Eilish)
  RunUpTarget,       // 目標音への上昇 (YOASOBI, Ado)
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
  Strong       // 強い、キャッチーなフック
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
  Aux          // 補助ボーカルトラック
};
```

### ArpeggioPattern / ArpeggioSpeed

アルペジオ設定。

```cpp
enum class ArpeggioPattern : uint8_t {
  Up,        // 上昇
  Down,      // 下降
  UpDown,    // 上昇後下降
  Random     // ランダム順序
};

enum class ArpeggioSpeed : uint8_t {
  Eighth,      // 8分音符
  Sixteenth,   // 16分音符 (デフォルト)
  Triplet      // 三連符
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
