# C++ API リファレンス

このページでは、ネイティブアプリケーション向けの C++ API と、FFI/WASM バインディング向けの C ABI を説明します。C ABI の設定入力は JSON であり、バイナリ設定構造体はありません。

## MidiSketch クラス

### コンストラクタ

~~~cpp
#include "midisketch.h"

midisketch::MidiSketch sketch;
~~~

::: info ヘッダファイル
- midisketch.h - C++ クラス API
- midisketch_c.h - FFI/WASM バインディング用 C ABI
- core/types.h - C++ API が含むコア型
:::

### generate(params)

低レベルの GeneratorParams 型から曲を生成します。

~~~cpp
midisketch::GeneratorParams params;
params.key = midisketch::Key::C;
params.bpm = 120;
params.seed = 12345;
sketch.generate(params);
~~~

### generateFromConfig(config)

SongConfig から MIDI を生成します。bpm = 0 と seed = 0 は、それぞれスタイル既定テンポと生成シードを選択します。chord_progression_id = 255 は、スタイルの推奨進行から自動選択します。

~~~cpp
using namespace midisketch;

SongConfig config;
config.style_preset_id = 0;
config.key = Key::C;
config.bpm = 120;
config.seed = 12345;
config.chord_progression_id = 255;
config.form = StructurePattern::StandardPop;
config.vocal_attitude = VocalAttitude::Expressive;
config.drums_enabled = true;
config.guitar_enabled = true;

config.arpeggio_enabled = false;
config.arpeggio.pattern = ArpeggioPattern::Up;
config.arpeggio.speed = ArpeggioSpeed::Sixteenth;
config.arpeggio.octave_range = 2;
config.arpeggio.gate = 0.8f;
config.arpeggio.sync_chord = true;

config.chord_extension.enable_7th = false;
config.chord_extension.seventh_probability = 0.15f;
config.humanize = false;
config.call_setting = CallSetting::Auto;
config.call_density = CallDensity::Standard;

sketch.generateFromConfig(config);
~~~

::: info パラメータの依存関係
一部のフィールドは親オプションが有効な場合だけ反映されます。たとえば arpeggio_enabled が false のとき、arpeggio.pattern は無視されます。依存関係は[オプション関係](/ja/docs/option-relationships)を参照してください。
:::

### generateVocal(config)

伴奏なしでボーカルトラックを生成します。

~~~cpp
SongConfig config;
config.style_preset_id = 0;
config.key = Key::C;
config.bpm = 120;
config.vocal_attitude = VocalAttitude::Expressive;
sketch.generateVocal(config);
~~~

### regenerateVocal(config)

現在のコード進行と構成を保持したまま、ボーカルトラックを再生成します。シードを受け取るオーバーロードは新しいシードで再生成します。

~~~cpp
sketch.regenerateVocal(12345);

VocalConfig vocal_config;
vocal_config.seed = 12345;
vocal_config.vocal_low = 60;
vocal_config.vocal_high = 79;
vocal_config.vocal_attitude = VocalAttitude::Expressive;
vocal_config.vocal_style = VocalStylePreset::Auto;
vocal_config.keep_motif = false;
sketch.regenerateVocal(vocal_config);
~~~

C++ で構築した VocalConfig は present_fields = kAllFields であり、すべてのフィールドが対象になります。JSON から読み込む場合は、指定されたフィールドだけが present_fields に記録されます。

### generateAccompanimentForVocal(config?)

既存のボーカルに対して有効な伴奏トラックを生成します。generateVocal()、generateWithVocal()、または setVocalNotes() の後に呼び出します。

~~~cpp
sketch.generateAccompanimentForVocal();

AccompanimentConfig accompaniment;
accompaniment.seed = 12345;
accompaniment.drums_enabled = true;
accompaniment.guitar_enabled = true;
accompaniment.arpeggio_enabled = false;
accompaniment.arpeggio_gate = 80;       // 0-100
accompaniment.humanize_timing = 0.4f;   // 0.0-1.0
accompaniment.humanize_velocity = 0.3f; // 0.0-1.0
sketch.generateAccompanimentForVocal(accompaniment);
~~~

C++ で構築した AccompanimentConfig は present_fields = kAllFields です。確率とヒューマナイズのフィールドは 0.0-1.0 の float を使い、arpeggio_gate は 0-100 を使います。

### regenerateAccompaniment(seedOrConfig)

現在のボーカルを保持し、新しいシードまたは設定で伴奏トラックを再生成します。

~~~cpp
sketch.regenerateAccompaniment(12345);

AccompanimentConfig accompaniment;
accompaniment.seed = 12345;
accompaniment.drums_enabled = true;
accompaniment.arpeggio_enabled = true;
sketch.regenerateAccompaniment(accompaniment);
~~~

### generateWithVocal(config)

ボーカルを優先して全トラックを生成します。

~~~cpp
SongConfig config;
config.style_preset_id = 0;
config.key = Key::C;
config.bpm = 120;
sketch.generateWithVocal(config);
~~~

### setVocalNotes(config, notes)

config から構成とコードを初期化し、指定したノートでボーカルトラックを置き換えてから伴奏を生成します。NoteEvent のコンストラクタは private です。直接生成する場合は NoteEventBuilder::create() を使います。

~~~cpp
SongConfig config;
config.style_preset_id = 0;
config.key = Key::C;
config.bpm = 120;

std::vector<NoteEvent> notes = {
    NoteEventBuilder::create(0, 480, 60, 100),
    NoteEventBuilder::create(480, 480, 62, 100),
    NoteEventBuilder::create(960, 960, 64, 100),
};

sketch.setVocalNotes(config, notes);
sketch.generateAccompanimentForVocal();
auto midi = sketch.getMidi();
~~~

### getMidi()

生成した MIDI ファイルを所有する std::vector<uint8_t> のコピーとして返します。

~~~cpp
std::vector<uint8_t> midi_data = sketch.getMidi();
std::ofstream out("output.mid", std::ios::binary);
out.write(reinterpret_cast<const char*>(midi_data.data()),
          static_cast<std::streamsize>(midi_data.size()));
~~~

### getVocalPreviewMidi()

ボーカルメロディとルートベースのガイドだけを含む最小 MIDI を、所有するバイト列のコピーとして返します。

~~~cpp
auto preview = sketch.getVocalPreviewMidi();
~~~

### getEventsJson()

可視化または再生用のイベントデータを、所有する std::string のコピーとして返します。

~~~cpp
std::string events_json = sketch.getEventsJson();
~~~

### getMelody() / setMelody(melody)

ボーカルメロディの候補を保存・復元します。

~~~cpp
MelodyData candidate = sketch.getMelody();
// ...別の候補を試します...
sketch.setMelody(candidate);
~~~

### getSong() / getParams() / getWarnings()

sketch が所有する状態への読み取り専用参照を返します。参照はオブジェクトが破棄されるまで有効ですが、後続の生成呼び出しで内容が変わります。

~~~cpp
const Song& song = sketch.getSong();
const GeneratorParams& params = sketch.getParams();
const std::vector<std::string>& warnings = sketch.getWarnings();
~~~

getWarnings() は直近の生成処理で発生した非致命的な警告を返します。

### getHarmonyContext()

ピアノロール安全性 API が使う読み取り専用ハーモニーコンテキストを返します。

~~~cpp
const IHarmonyContext& harmony = sketch.getHarmonyContext();
~~~

### setMidiFormat(format) / getMidiFormat()

MIDI 出力形式を設定・取得します。新しい MidiSketch は MidiFormat::SMF1 を既定値として使用します。

~~~cpp
sketch.setMidiFormat(MidiFormat::SMF1); // Standard MIDI File Type 1
sketch.setMidiFormat(MidiFormat::SMF2); // MIDI 2.0 Container File
MidiFormat format = sketch.getMidiFormat();
~~~

### resolvedBlueprintId()

直近の生成で選択された Blueprint を返します。生成後に呼び出してください。

~~~cpp
uint8_t blueprint_id = sketch.resolvedBlueprintId();
~~~

### version()

ライブラリのバージョン文字列を借用ポインタとして返します。

~~~cpp
const char* version = MidiSketch::version();
~~~

---

## 生成ワークフロー

MidiSketch では、BGM 優先、ボーカル優先、カスタムボーカルのワークフローを利用できます。

::: tip ワークフローの選択
| ワークフロー | 用途 |
|----------|----------|
| BGM 優先 | ボーカルを追加する前に伴奏を生成します |
| ボーカル優先 | 伴奏の前に生成メロディを試します |
| カスタムボーカル | ノートを読み込み、合う伴奏を生成します |
:::

### BGM 優先ワークフロー

~~~cpp
MidiSketch sketch;
SongConfig config;
config.style_preset_id = 0;
config.skip_vocal = true;
sketch.generateFromConfig(config);

VocalConfig vocal;
vocal.seed = 0;
vocal.vocal_low = 60;
vocal.vocal_high = 79;
sketch.regenerateVocal(vocal);
auto midi = sketch.getMidi();
~~~

### ボーカル優先ワークフロー

~~~cpp
MidiSketch sketch;
SongConfig config;
config.style_preset_id = 0;
sketch.generateVocal(config);

VocalConfig vocal;
vocal.seed = 12345;
vocal.vocal_attitude = VocalAttitude::Expressive;
sketch.regenerateVocal(vocal);
sketch.generateAccompanimentForVocal();
auto midi = sketch.getMidi();
~~~

### カスタムボーカルのインポート

~~~cpp
MidiSketch sketch;
SongConfig config;
config.style_preset_id = 0;

std::vector<NoteEvent> notes = {
    NoteEventBuilder::create(0, 480, 60, 100),
    NoteEventBuilder::create(480, 480, 62, 100),
    NoteEventBuilder::create(960, 960, 64, 100),
};
sketch.setVocalNotes(config, notes);
sketch.generateAccompanimentForVocal();
auto midi = sketch.getMidi();
~~~

---

## コア型

### SongConfig

generateFromConfig()、generateVocal()、generateWithVocal()、setVocalNotes() に渡す高レベル設定です。

~~~cpp
struct SongConfig {
  uint8_t style_preset_id = 0;
  uint8_t blueprint_id = 0;       // 255 = ランダム
  uint8_t mood = 0;
  bool mood_explicit = false;

  Key key = Key::C;
  uint16_t bpm = 0;                  // 0 = スタイル既定値
  uint32_t seed = 0;                 // 0 = ランダム
  uint8_t chord_progression_id = 255; // 255 = スタイルから自動選択

  StructurePattern form = StructurePattern::StandardPop;
  bool form_explicit = false;
  uint16_t target_duration_seconds = 0; // 0 = form を使用

  VocalAttitude vocal_attitude = VocalAttitude::Clean;
  VocalStylePreset vocal_style = VocalStylePreset::Auto;
  uint8_t drive_feel = 50;           // 0-100

  bool drums_enabled = true;
  bool drums_enabled_explicit = false;
  bool arpeggio_enabled = false;
  bool guitar_enabled = true;
  bool skip_vocal = false;
  uint8_t vocal_low = 60;
  uint8_t vocal_high = 79;

  ArpeggioParams arpeggio;
  ChordExtensionParams chord_extension;
  bool chord_ext_prob_explicit = false;

  CompositionStyle composition_style = CompositionStyle::MelodyLead;
  bool composition_style_explicit = false;
  MotifChordParams motif_chord;
  MotifRepeatScope motif_repeat_scope = MotifRepeatScope::FullSong;
  ArrangementGrowth arrangement_growth = ArrangementGrowth::LayerAdd;

  bool humanize = false;
  float humanize_timing = 0.4f;
  float humanize_velocity = 0.3f;

  ModulationTiming modulation_timing = ModulationTiming::None;
  int8_t modulation_semitones = 2;

  bool se_enabled = true;
  CallSetting call_setting = CallSetting::Auto;
  bool call_notes_enabled = true;
  IntroChant intro_chant = IntroChant::None;
  MixPattern mix_pattern = MixPattern::None;
  CallDensity call_density = CallDensity::Standard;

  MelodyTemplateId melody_template = MelodyTemplateId::Auto;
  MelodicComplexity melodic_complexity = MelodicComplexity::Standard;
  HookIntensity hook_intensity = HookIntensity::Normal;
  VocalGrooveFeel vocal_groove = VocalGrooveFeel::Straight;
  bool enable_syncopation = false;
  EnergyCurve energy_curve = EnergyCurve::GradualBuild;

  uint8_t melody_max_leap = 0;
  uint8_t melody_syncopation_prob = 0xFF;
  uint8_t melody_phrase_length = 0;
  uint8_t melody_long_note_ratio = 0xFF;
  int8_t melody_chorus_register_shift = INT8_MIN;
  uint8_t melody_hook_repetition = 0;
  uint8_t melody_use_leading_tone = 0;

  uint8_t motif_length = 0;
  uint8_t motif_note_count = 0;
  uint8_t motif_motion = 0xFF;
  uint8_t motif_register_high = 0;
  uint8_t motif_rhythm_density = 0xFF;

  bool addictive_mode = false;
  uint8_t mora_rhythm_mode = 2;
  uint8_t syllabic_sub_rate = 0;
};
~~~

JSON のフィールド名は上記の snake_case 名です。ネストするフィールドは arpeggio、chord_extension、motif_chord です。

### ArpeggioParams / ChordExtensionParams

~~~cpp
struct ArpeggioParams {
  ArpeggioPattern pattern = ArpeggioPattern::Auto;
  ArpeggioSpeed speed = ArpeggioSpeed::Auto;
  uint8_t octave_range = 2;
  float gate = -1.0f;       // 0.0-1.0; -1 = スタイル既定値
  bool sync_chord = true;
  uint8_t base_velocity = 90;
};

struct ChordExtensionParams {
  bool enable_sus = false;
  bool enable_7th = false;
  bool enable_9th = false;
  bool tritone_sub = false;
  float sus_probability = 0.2f;
  float seventh_probability = 0.15f;
  float ninth_probability = 0.25f;
  float tritone_sub_probability = 0.5f;
};
~~~

### VocalConfig

C++ で直接構築すると present_fields は kAllFields (~0u) になり、すべてのフィールドが対象になります。JSON から読み込む場合は、JSON に存在するフィールドだけが present_fields に記録され、部分更新に使われます。

~~~cpp
struct VocalConfig {
  static constexpr uint32_t kAllFields = ~0u;
  uint32_t present_fields = kAllFields;
  uint32_t seed = 0;
  uint8_t vocal_low = 60;
  uint8_t vocal_high = 79;
  VocalAttitude vocal_attitude = VocalAttitude::Clean;
  VocalStylePreset vocal_style = VocalStylePreset::Auto;
  MelodyTemplateId melody_template = MelodyTemplateId::Auto;
  MelodicComplexity melodic_complexity = MelodicComplexity::Standard;
  HookIntensity hook_intensity = HookIntensity::Normal;
  VocalGrooveFeel vocal_groove = VocalGrooveFeel::Straight;
  CompositionStyle composition_style = CompositionStyle::MelodyLead;
  bool keep_motif = false;
};
~~~

### AccompanimentConfig

~~~cpp
struct AccompanimentConfig {
  static constexpr uint32_t kAllFields = ~0u;
  uint32_t present_fields = kAllFields;
  uint32_t seed = 0;
  bool drums_enabled = true;
  bool arpeggio_enabled = false;
  bool guitar_enabled = true;
  uint8_t arpeggio_pattern = 0;
  uint8_t arpeggio_speed = 1;
  uint8_t arpeggio_octave_range = 2;
  uint8_t arpeggio_gate = 80;
  bool arpeggio_sync_chord = true;
  bool chord_ext_sus = false;
  bool chord_ext_7th = false;
  bool chord_ext_9th = false;
  bool chord_ext_tritone_sub = false;
  float chord_ext_sus_prob = 0.2f;
  float chord_ext_7th_prob = 0.15f;
  float chord_ext_9th_prob = 0.25f;
  float chord_ext_tritone_sub_prob = 0.5f;
  bool humanize = false;
  float humanize_timing = 0.4f;
  float humanize_velocity = 0.3f;
  bool se_enabled = true;
  bool call_enabled = false;
  uint8_t call_density = 2;
  uint8_t intro_chant = 0;
  uint8_t mix_pattern = 0;
  bool call_notes_enabled = true;
};
~~~

C++ 型の確率とヒューマナイズは正規化した float です。0-100 の整数を使うフィールドは arpeggio_gate だけです。

### NoteEvent

~~~cpp
struct NoteEvent {
  Tick start_tick;
  Tick duration;
  uint8_t note;       // MIDI ノート番号、0-127
  uint8_t velocity;   // MIDI ベロシティ、0-127
  bool is_syllabic_subdivision = false;
};
~~~

既定コンストラクタと 4 引数コンストラクタは private です。直接生成する場合は NoteEventBuilder::create(start, duration, note, velocity) を使います。Tick は uint32_t です。

::: details Tick について
コアの時間定数は、4 分音符が 480 tick、8 分音符が 240 tick、16 分音符が 120 tick、4/4 の 1 小節が 1,920 tick です。MIDI_C4 は 60 です。

~~~cpp
auto note = NoteEventBuilder::create(480, 480, 60, 100);
~~~
:::

### MelodyData

~~~cpp
struct MelodyData {
  uint32_t seed;
  std::vector<NoteEvent> notes;
};
~~~

---

## 列挙型

### Key

~~~cpp
enum class Key : uint8_t {
  C = 0, Cs, D, Eb, E, F, Fs, G, Ab, A, Bb, B
};
~~~

### VocalAttitude

~~~cpp
enum class VocalAttitude : uint8_t { Clean = 0, Expressive, Raw };
~~~

### CompositionStyle

~~~cpp
enum class CompositionStyle : uint8_t {
  MelodyLead = 0, BackgroundMotif, SynthDriven
};
~~~

### VocalStylePreset

~~~cpp
enum class VocalStylePreset : uint8_t {
  Auto = 0, Standard, Vocaloid, UltraVocaloid, Idol, Ballad, Rock,
  CityPop, Anime, BrightKira, CoolSynth, CuteAffected, PowerfulShout, KPop
};
~~~

### MelodyTemplateId

~~~cpp
enum class MelodyTemplateId : uint8_t {
  Auto = 0, PlateauTalk, RunUpTarget, DownResolve,
  HookRepeat, SparseAnchor, CallResponse, JumpAccent
};
~~~

### MelodicComplexity / HookIntensity

~~~cpp
enum class MelodicComplexity : uint8_t { Simple = 0, Standard, Complex };
enum class HookIntensity : uint8_t { Off = 0, Light, Normal, Strong, Maximum };
~~~

### VocalGrooveFeel

~~~cpp
enum class VocalGrooveFeel : uint8_t {
  Straight = 0, OffBeat, Swing, Syncopated, Driving16th, Bouncy8th
};
~~~

### StructurePattern

StructurePattern は宣言順に 0 から 17 までの 18 値を持ちます。

~~~cpp
enum class StructurePattern : uint8_t {
  StandardPop = 0, BuildUp, DirectChorus, RepeatChorus, ShortForm,
  FullPop, FullWithBridge, DriveUpbeat, Ballad, AnthemStyle, ExtendedFull,
  ChorusFirst, ChorusFirstShort, ChorusFirstFull,
  ImmediateVocal, ImmediateVocalFull, AChorusB, DoubleVerse
};
~~~

### ModulationTiming / EnergyCurve

~~~cpp
enum class ModulationTiming : uint8_t {
  None = 0, LastChorus, AfterBridge, EachChorus, Random
};
enum class EnergyCurve : uint8_t {
  GradualBuild = 0, FrontLoaded, WavePattern, SteadyState
};
~~~

### CallSetting / CallDensity / IntroChant / MixPattern

~~~cpp
enum class CallSetting : uint8_t { Auto = 0, Enabled, Disabled };
enum class CallDensity : uint8_t { None = 0, Minimal, Standard, Intense };
enum class IntroChant : uint8_t { None = 0, Gachikoi, Shouting };
enum class MixPattern : uint8_t { None = 0, Standard, Tiger };
~~~

### ArrangementGrowth / MotifRepeatScope

~~~cpp
enum class ArrangementGrowth : uint8_t { LayerAdd = 0, RegisterAdd };
enum class MotifRepeatScope : uint8_t { FullSong = 0, Section };
~~~

### TrackRole

~~~cpp
enum class TrackRole : uint8_t {
  Vocal = 0, Chord, Bass, Drums, SE, Motif, Arpeggio, Aux, Guitar
};
~~~

### ArpeggioPattern / ArpeggioSpeed

両方の enum には、スタイルまたは Blueprint の既定値を使う Auto = 255 があります。

~~~cpp
enum class ArpeggioPattern : uint8_t {
  Up = 0, Down, UpDown, Random, Pinwheel, PedalRoot, Alberti, BrokenChord,
  Auto = 255
};
enum class ArpeggioSpeed : uint8_t {
  Eighth = 0, Sixteenth, Triplet, Auto = 255
};
~~~

### MoraRhythmMode

MoraRhythmMode は SongConfig の uint8_t mora_rhythm_mode フィールドで表されます。

~~~cpp
enum class MoraRhythmMode : uint8_t { Standard = 0, MoraTimed, Auto };
~~~

### MotifMotion / MotifRhythmDensity

~~~cpp
enum class MotifMotion : uint8_t {
  Stepwise = 0, GentleLeap, WideLeap, NarrowStep, Disjunct, Ostinato
};
enum class MotifRhythmDensity : uint8_t { Sparse = 0, Medium, Driving };
~~~

### MidiFormat

~~~cpp
enum class MidiFormat : uint8_t {
  SMF1 = 1, // Standard MIDI File Type 1
  SMF2 = 2  // MIDI 2.0 Container File
};
~~~

---

## 定数

~~~cpp
using Tick = uint32_t;
constexpr Tick TICKS_PER_BEAT = 480;
constexpr uint8_t BEATS_PER_BAR = 4;
constexpr Tick TICKS_PER_BAR = 1920;
constexpr uint8_t MIDI_C4 = 60;
constexpr MidiFormat kDefaultMidiFormat = MidiFormat::SMF1;
~~~

---

## C API (midisketch_c.h)

C ABI は FFI と WASM バインディング向けです。設定とメロディの入力は JSON 文字列です。現在のヘッダにはバイナリ設定構造体はありません。

::: warning メモリとスレッド
midisketch_get_midi()、midisketch_get_vocal_preview_midi()、midisketch_get_events()、midisketch_get_dissonance()、midisketch_get_piano_roll_safety() は結果オブジェクトを確保します。対応する midisketch_free_* 関数で解放してください。

名前、エラーメッセージなどの const char* は借用ポインタです。midisketch_free() に渡さないでください。midisketch_get_warnings_json() と midisketch_get_melody_json() はスレッドローカル領域を返し、同じスレッドの次の呼び出しで置き換わります。既定設定 JSON、ポインタを返す候補取得、単一 tick のピアノロール結果、文字列変換ヘルパーは共有 static 領域を使います。同じハンドルを共有する呼び出しと、ポインタを返す問い合わせが並行する場合は外部で同期してください。
:::

### ハンドル管理

~~~c
MidiSketchHandle midisketch_create(void);
void midisketch_destroy(MidiSketchHandle handle);
~~~

### MIDI 形式

~~~c
MidiSketchError midisketch_set_midi_format(
    MidiSketchHandle handle, MidiSketchMidiFormat format);
MidiSketchMidiFormat midisketch_get_midi_format(MidiSketchHandle handle);
~~~

既定値は MIDISKETCH_MIDI_FORMAT_SMF1 です。ネイティブビルドは両形式をサポートします。WASM ビルドで SMF2 を選ぶと MIDISKETCH_ERROR_UNSUPPORTED_FORMAT (7) を返します。

### 生成関数

~~~c
MidiSketchError midisketch_generate_accompaniment(MidiSketchHandle handle);
MidiSketchError midisketch_regenerate_accompaniment(
    MidiSketchHandle handle, uint32_t new_seed);
~~~

設定を受け取らないこれらの関数は、生成済みの曲を持つハンドルが必要です。JSON 関数は後述します。

### 出力関数

~~~c
MidiSketchMidiData* midisketch_get_midi(MidiSketchHandle handle);
MidiSketchMidiData* midisketch_get_vocal_preview_midi(MidiSketchHandle handle);
void midisketch_free_midi(MidiSketchMidiData* data);

MidiSketchEventData* midisketch_get_events(MidiSketchHandle handle);
void midisketch_free_events(MidiSketchEventData* data);

MidiSketchDissonanceData* midisketch_get_dissonance(MidiSketchHandle handle);
void midisketch_free_dissonance(MidiSketchDissonanceData* data);

MidiSketchInfo midisketch_get_info(MidiSketchHandle handle);
~~~

MidiSketchInfo.track_count は、無効または空のロールを含む、エンジンが定義する 9 個のトラックロール数です。シリアライズされた MIDI では空のトラックを省略します。イベント JSON にはノートが空のトラックロールが含まれる場合があります。

### プリセット情報

~~~c
uint8_t midisketch_structure_count(void);
uint8_t midisketch_mood_count(void);
uint8_t midisketch_chord_count(void);
const char* midisketch_structure_name(uint8_t id);
const char* midisketch_mood_name(uint8_t id);
const char* midisketch_chord_name(uint8_t id);
const char* midisketch_chord_display(uint8_t id);
uint16_t midisketch_mood_default_bpm(uint8_t id);

uint8_t midisketch_style_preset_count(void);
const char* midisketch_style_preset_name(uint8_t id);
const char* midisketch_style_preset_display_name(uint8_t id);
const char* midisketch_style_preset_description(uint8_t id);
uint16_t midisketch_style_preset_tempo_default(uint8_t id);
uint8_t midisketch_style_preset_allowed_attitudes(uint8_t id);
MidiSketchStylePresetSummary midisketch_get_style_preset(uint8_t id);

MidiSketchChordCandidates* midisketch_get_progressions_by_style_ptr(uint8_t style_id);
MidiSketchFormCandidates* midisketch_get_forms_by_style_ptr(uint8_t style_id);
MidiSketchChordCandidates midisketch_get_progressions_by_style(uint8_t style_id);
MidiSketchFormCandidates midisketch_get_forms_by_style(uint8_t style_id);
~~~

_ptr 付きの候補取得は共有 static バッファを返すため、スレッドセーフではありません。値を返す関数はコピーを返します。MidiSketchStylePresetSummary 内のポインタはライブラリ所有の文字列を指します。

### Blueprint 情報

~~~c
typedef enum {
  MIDISKETCH_PARADIGM_TRADITIONAL = 0,
  MIDISKETCH_PARADIGM_RHYTHM_SYNC = 1,
  MIDISKETCH_PARADIGM_MELODY_DRIVEN = 2
} MidiSketchParadigm;

typedef enum {
  MIDISKETCH_RIFF_FREE = 0,
  MIDISKETCH_RIFF_LOCKED_CONTOUR = 1,
  MIDISKETCH_RIFF_LOCKED_PITCH = 2,
  MIDISKETCH_RIFF_LOCKED_ALL = 3,
  MIDISKETCH_RIFF_EVOLVING = 4,
  MIDISKETCH_RIFF_LOCKED = MIDISKETCH_RIFF_LOCKED_CONTOUR
} MidiSketchRiffPolicy;

uint8_t midisketch_blueprint_count(void);
const char* midisketch_blueprint_name(uint8_t id);
MidiSketchParadigm midisketch_blueprint_paradigm(uint8_t id);
MidiSketchRiffPolicy midisketch_blueprint_riff_policy(uint8_t id);
uint8_t midisketch_blueprint_weight(uint8_t id);
uint8_t midisketch_blueprint_drums_required(uint8_t id);
uint8_t midisketch_vocal_style_call_enabled(uint8_t style);
uint16_t midisketch_blueprint_tempo_min(uint8_t id);
uint16_t midisketch_blueprint_tempo_max(uint8_t id);
uint8_t midisketch_get_resolved_blueprint_id(MidiSketchHandle handle);
const char* midisketch_get_warnings_json(MidiSketchHandle handle);
~~~

Blueprint のテンポ範囲取得は無効な ID に対して 0 を返します。生成前の resolved ID は 255 です。警告 JSON は [] のような配列文字列であり、スレッドローカルの借用ポインタです。

### JSON Config API (WASM)

~~~c
MidiSketchError midisketch_generate_from_json(
    MidiSketchHandle handle, const char* config_json, size_t json_length);
MidiSketchError midisketch_generate_vocal_from_json(
    MidiSketchHandle handle, const char* config_json, size_t json_length);
MidiSketchError midisketch_generate_with_vocal_from_json(
    MidiSketchHandle handle, const char* config_json, size_t json_length);

const char* midisketch_create_default_config_json(uint8_t style_id);
MidiSketchConfigError midisketch_validate_config_json(
    const char* config_json, size_t json_length);
MidiSketchConfigError midisketch_get_last_config_error(MidiSketchHandle handle);

MidiSketchError midisketch_regenerate_vocal_from_json(
    MidiSketchHandle handle, const char* config_json, size_t json_length);
MidiSketchError midisketch_generate_accompaniment_from_json(
    MidiSketchHandle handle, const char* config_json, size_t json_length);
MidiSketchError midisketch_regenerate_accompaniment_from_json(
    MidiSketchHandle handle, const char* config_json, size_t json_length);
MidiSketchError midisketch_set_vocal_notes_from_json(
    MidiSketchHandle handle, const char* json, size_t json_length);
const char* midisketch_get_melody_json(MidiSketchHandle handle);
MidiSketchError midisketch_set_melody_from_json(
    MidiSketchHandle handle, const char* json, size_t json_length);
~~~

config_json は SongConfig の snake_case フィールドを使います。midisketch_create_default_config_json() は次の呼び出しで置き換わる static 文字列を返します。midisketch_regenerate_vocal_from_json() に NULL または空文字列を渡すと、シードだけのオーバーロードを選びます。伴奏 JSON は AccompanimentConfig のフィールドを使い、確率とヒューマナイズは 0.0-1.0 の float、arpeggio_gate は 0-100 です。C 実装は JSON に指定された VocalConfig と AccompanimentConfig のフィールドを記録し、部分更新に使います。

midisketch_set_vocal_notes_from_json() の形式は次のとおりです。

~~~json
{
  "config": {"style_preset_id": 0, "key": 0, "bpm": 120},
  "notes": [
    {"start_tick": 0, "duration": 480, "pitch": 60, "velocity": 100}
  ]
}
~~~

midisketch_get_melody_json() は {"seed":N,"notes":[...]} を返します。ポインタはスレッドローカルで、同じスレッドの次の呼び出しで置き換わります。

### Piano Roll Safety API

~~~c
MidiSketchPianoRollData* midisketch_get_piano_roll_safety(
    MidiSketchHandle handle, uint32_t start_tick, uint32_t end_tick, uint32_t step);
MidiSketchPianoRollInfo* midisketch_get_piano_roll_safety_at(
    MidiSketchHandle handle, uint32_t tick);
MidiSketchPianoRollInfo* midisketch_get_piano_roll_safety_with_context(
    MidiSketchHandle handle, uint32_t tick, uint8_t prev_pitch);
void midisketch_free_piano_roll_data(MidiSketchPianoRollData* data);
size_t midisketch_piano_roll_data_count(const MidiSketchPianoRollData* data);
uint8_t midisketch_piano_roll_data_was_truncated(const MidiSketchPianoRollData* data);
const char* midisketch_reason_to_string(uint16_t reason);
const char* midisketch_collision_to_string(const MidiSketchCollisionInfo* collision);
~~~

バッチ結果は配列を所有し、最大 100,000 サンプルです。エンコードされた count フィールドを直接読まず、件数と切り詰めフラグの関数を使います。単一 tick の結果と文字列変換関数は共有 static 領域を使うため、次の呼び出し前に読み取ってください。

安全性の値と理由フラグはヘッダと同じ値です。

~~~c
typedef enum {
  MIDISKETCH_NOTE_SAFE = 0,
  MIDISKETCH_NOTE_WARNING = 1,
  MIDISKETCH_NOTE_DISSONANT = 2
} MidiSketchNoteSafety;

typedef enum {
  MIDISKETCH_REASON_NONE = 0,
  MIDISKETCH_REASON_CHORD_TONE = 1,
  MIDISKETCH_REASON_TENSION = 2,
  MIDISKETCH_REASON_SCALE_TONE = 4,
  MIDISKETCH_REASON_LOW_REGISTER = 8,
  MIDISKETCH_REASON_TRITONE = 16,
  MIDISKETCH_REASON_LARGE_LEAP = 32,
  MIDISKETCH_REASON_MINOR_2ND = 64,
  MIDISKETCH_REASON_MAJOR_7TH = 128,
  MIDISKETCH_REASON_NON_SCALE = 256,
  MIDISKETCH_REASON_PASSING_TONE = 512,
  MIDISKETCH_REASON_OUT_OF_RANGE = 1024,
  MIDISKETCH_REASON_TOO_HIGH = 2048,
  MIDISKETCH_REASON_TOO_LOW = 4096
} MidiSketchNoteReason;

typedef struct {
  uint8_t track_role;
  uint8_t colliding_pitch;
  uint8_t interval_semitones;
} MidiSketchCollisionInfo;

typedef struct {
  uint32_t tick;
  int8_t chord_degree;
  uint8_t current_key;
  uint8_t safety[128];
  uint16_t reason[128];
  MidiSketchCollisionInfo collision[128];
  uint8_t recommended[8];
  uint8_t recommended_count;
} MidiSketchPianoRollInfo;

typedef struct {
  MidiSketchPianoRollInfo* data;
  size_t count;
} MidiSketchPianoRollData;
~~~

### エラーコード

~~~c
typedef enum {
  MIDISKETCH_OK = 0,
  MIDISKETCH_ERROR_INVALID_PARAM = 1,
  MIDISKETCH_ERROR_INVALID_STRUCTURE = 2, /* deprecated, ABI compatibility */
  MIDISKETCH_ERROR_INVALID_MOOD = 3,      /* deprecated, ABI compatibility */
  MIDISKETCH_ERROR_INVALID_CHORD = 4,     /* deprecated, ABI compatibility */
  MIDISKETCH_ERROR_GENERATION_FAILED = 5, /* deprecated, ABI compatibility */
  MIDISKETCH_ERROR_OUT_OF_MEMORY = 6,     /* deprecated, ABI compatibility */
  MIDISKETCH_ERROR_UNSUPPORTED_FORMAT = 7
} MidiSketchError;

const char* midisketch_error_string(MidiSketchError error);
const char* midisketch_config_error_string(MidiSketchConfigError error);
~~~

エラー文字列関数は static メッセージを借用ポインタで返します。MidiSketchConfigError は MIDISKETCH_CONFIG_OK = 0 から MIDISKETCH_CONFIG_INVALID_TARGET_DURATION = 35 までです。列挙値は midisketch_c.h を参照してください。

~~~c
typedef enum {
  MIDISKETCH_CONFIG_OK = 0,
  MIDISKETCH_CONFIG_INVALID_STYLE = 1,
  MIDISKETCH_CONFIG_INVALID_CHORD = 2,
  MIDISKETCH_CONFIG_INVALID_FORM = 3,
  MIDISKETCH_CONFIG_INVALID_ATTITUDE = 4,
  MIDISKETCH_CONFIG_INVALID_VOCAL_RANGE = 5,
  MIDISKETCH_CONFIG_INVALID_BPM = 6,
  MIDISKETCH_CONFIG_DURATION_TOO_SHORT = 7,
  MIDISKETCH_CONFIG_INVALID_MODULATION = 8,
  MIDISKETCH_CONFIG_INVALID_KEY = 9,
  MIDISKETCH_CONFIG_INVALID_COMPOSITION_STYLE = 10,
  MIDISKETCH_CONFIG_INVALID_ARPEGGIO_PATTERN = 11,
  MIDISKETCH_CONFIG_INVALID_ARPEGGIO_SPEED = 12,
  MIDISKETCH_CONFIG_INVALID_VOCAL_STYLE = 13,
  MIDISKETCH_CONFIG_INVALID_MELODY_TEMPLATE = 14,
  MIDISKETCH_CONFIG_INVALID_MELODIC_COMPLEXITY = 15,
  MIDISKETCH_CONFIG_INVALID_HOOK_INTENSITY = 16,
  MIDISKETCH_CONFIG_INVALID_VOCAL_GROOVE = 17,
  MIDISKETCH_CONFIG_INVALID_CALL_DENSITY = 18,
  MIDISKETCH_CONFIG_INVALID_INTRO_CHANT = 19,
  MIDISKETCH_CONFIG_INVALID_MIX_PATTERN = 20,
  MIDISKETCH_CONFIG_INVALID_MOTIF_REPEAT_SCOPE = 21,
  MIDISKETCH_CONFIG_INVALID_ARRANGEMENT_GROWTH = 22,
  MIDISKETCH_CONFIG_INVALID_MODULATION_TIMING = 23,
  MIDISKETCH_CONFIG_INVALID_BLUEPRINT = 24,
  MIDISKETCH_CONFIG_INVALID_CALL_SETTING = 25,
  MIDISKETCH_CONFIG_INVALID_ENERGY_CURVE = 26,
  MIDISKETCH_CONFIG_INVALID_DRIVE_FEEL = 27,
  MIDISKETCH_CONFIG_INVALID_MORA_RHYTHM_MODE = 28,
  MIDISKETCH_CONFIG_INVALID_PROBABILITY = 29,
  MIDISKETCH_CONFIG_INVALID_ARPEGGIO_RANGE = 30,
  MIDISKETCH_CONFIG_INVALID_MELODY_OVERRIDE = 31,
  MIDISKETCH_CONFIG_INVALID_MOTIF_OVERRIDE = 32,
  MIDISKETCH_CONFIG_INVALID_JSON = 33,
  MIDISKETCH_CONFIG_INVALID_MOOD = 34,
  MIDISKETCH_CONFIG_INVALID_TARGET_DURATION = 35
} MidiSketchConfigError;
~~~

### C API 構造体

~~~c
typedef struct {
  uint8_t* data;
  size_t size;
} MidiSketchMidiData;

typedef struct {
  char* json;
  size_t length;
} MidiSketchEventData;

typedef struct {
  char* json;
  size_t length;
} MidiSketchDissonanceData;

typedef struct {
  uint16_t total_bars;
  uint32_t total_ticks;
  uint16_t bpm;
  uint8_t track_count;
} MidiSketchInfo;

typedef struct {
  uint8_t id;
  const char* name;
  const char* display_name;
  const char* description;
  uint16_t tempo_default;
  uint8_t allowed_attitudes;
} MidiSketchStylePresetSummary;

typedef struct { uint8_t count; uint8_t ids[20]; } MidiSketchChordCandidates;
typedef struct { uint8_t count; uint8_t ids[10]; } MidiSketchFormCandidates;
~~~

ピアノロール安全性用の構造体と MidiSketchNoteSafety、MidiSketchNoteReason、MidiSketchCollisionInfo の宣言も midisketch_c.h にあります。配列は 128 個の MIDI ピッチを持ちます。

### ユーティリティ

~~~c
const char* midisketch_version(void);
void* midisketch_malloc(size_t size);
void midisketch_free(void* ptr);
~~~

midisketch_version() は static 文字列を返します。midisketch_malloc() と midisketch_free() は C ABI が明示的に確保する FFI メモリの組み合わせです。

---

## 完全なサンプル

### C++ サンプル

~~~cpp
#include "midisketch.h"
#include <fstream>

int main() {
  using namespace midisketch;

  MidiSketch sketch;
  SongConfig config;
  config.style_preset_id = 0;
  config.key = Key::C;
  config.bpm = 120;
  config.seed = 12345;
  config.vocal_attitude = VocalAttitude::Expressive;

  sketch.generateFromConfig(config);
  const auto midi = sketch.getMidi();

  std::ofstream out("output.mid", std::ios::binary);
  out.write(reinterpret_cast<const char*>(midi.data()),
            static_cast<std::streamsize>(midi.size()));
  return 0;
}
~~~

### C サンプル

~~~c
#include "midisketch_c.h"
#include <stdio.h>
#include <string.h>

int main(void) {
  MidiSketchHandle handle = midisketch_create();
  if (!handle) return 1;

  const char config[] =
      "{\"style_preset_id\":0,\"key\":0,\"bpm\":120,\"seed\":12345}";
  const size_t config_length = sizeof(config) - 1;
  MidiSketchError error = midisketch_generate_from_json(
      handle, config, config_length);
  if (error != MIDISKETCH_OK) {
    fprintf(stderr, "%s\n", midisketch_error_string(error));
    midisketch_destroy(handle);
    return 1;
  }

  MidiSketchMidiData* midi = midisketch_get_midi(handle);
  if (!midi) {
    midisketch_destroy(handle);
    return 1;
  }

  FILE* file = fopen("output.mid", "wb");
  if (file) {
    fwrite(midi->data, 1, midi->size, file);
    fclose(file);
  }
  midisketch_free_midi(midi);
  midisketch_destroy(handle);
  return file ? 0 : 1;
}
~~~
