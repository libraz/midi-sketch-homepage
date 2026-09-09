# アーキテクチャ概要

[MIDI Sketch](https://github.com/libraz/midi-sketch)の内部アーキテクチャを解説します。

## プロジェクト構造

```
midi-sketch/
├── src/
│   ├── core/          # Generator・Coordinator・ハーモニーコンテキスト・プリセット・ブループリント
│   ├── track/         # トラック別の生成器（track/generators/）と、
│   │                  #   melody・vocal・chord・drums の共有ヘルパー（各サブディレクトリ）
│   ├── instrument/    # 楽器の物理モデル（フレット楽器、鍵盤、ドラム）
│   ├── midi/          # MIDI 出力とチャンネル／プログラム割り当て
│   ├── analysis/      # 不協和音分析
│   ├── midisketch.h   # 公開 C++ API
│   └── midisketch_c.h # C API（WASM インターフェース）
├── tests/
├── dist/
└── demo/
```

## コアコンポーネント

### MidiSketchクラス

高レベルAPIを提供するメインエントリーポイント：

::: tip 2つの生成ワークフロー
- **ボーカル先行**: `generateVocal()` → `regenerateVocal()` で反復 → `generateAccompanimentForVocal()` で完成（JS/WASM ラッパーでは `generateAccompaniment()` という名前です）
- **標準**: `generate()` または `generateFromConfig()` でワンショット生成

設定は**SongConfigBuilder**を使って構築できます。カスケード変更検出付きの流暢なAPIで、上流の値が変更されると依存パラメータが自動的に再計算されます。
:::

```cpp
class MidiSketch {
  void generate(const GeneratorParams& params);
  void generateFromConfig(const SongConfig& config);
  void generateWithVocal(const SongConfig& config);   // Vocal-priority full generation
  void generateVocal(const SongConfig& config);
  void regenerateVocal(uint32_t new_seed = 0);
  void regenerateVocal(const VocalConfig& config);
  void generateAccompanimentForVocal();
  void generateAccompanimentForVocal(const AccompanimentConfig& config);
  void regenerateAccompaniment(uint32_t new_seed = 0);
  void regenerateAccompaniment(const AccompanimentConfig& config);
  void setVocalNotes(const SongConfig& config, const std::vector<NoteEvent>& notes);

  std::vector<uint8_t> getMidi() const;
  std::string getEventsJson() const;
  const Song& getSong() const;
};
```

### Generator

生成済みの`Song`を保持し、トラック処理を`Coordinator`へ委譲する状態付きAPI（`src/core/generator.h`）：

```cpp
class Generator {
 public:
  void generate(const GeneratorParams& params);
  void generateFromConfig(const SongConfig& config);
  void generateVocal(const GeneratorParams& params);
  void generateAccompanimentForVocal();
  void regenerateVocal(uint32_t new_seed = 0);
  void generateWithVocal(const GeneratorParams& params);
  const Song& getSong() const;
};
```

`generate()`の戻り値は`void`で、結果は`getSong()`から読み取ります。`Coordinator::generateAllTracks()`がパラダイム別の順序を選び、登録済みの`ITrackBase`生成器（`GuitarGenerator`を含む）を呼び出します。構造構築と後処理は生成呼び出しの内部段階であり、`Generator`の公開メンバーではありません。

### Songコンテナ

生成された全データを保持（9トラック）：

```cpp
// Song は 9 トラックを TrackRole で保持します（src/core/song.h）。チャンネル割り当ては src/midi/track_config.h：
//   Vocal 0 | Chord 1 | Bass 2 | Motif 3 | Arpeggio 4
//   Aux 5   | Guitar 6 | Drums 9 | SE 15
class Song {
  MidiTrack& track(TrackRole role);
  const Arrangement& arrangement() const;
};
```

::: info 専用チャンネル
すべてのトラックは専用のMIDIチャンネルを持ちます（`src/midi/track_config.h`）。Aux（Ch 5）とArpeggio（Ch 4）は別チャンネルなので、コンポジションスタイルや設定によっては同じ曲に両方が現れることがあります。
:::

## データフロー

### 標準生成（Traditionalパラダイム）

<DocFigure name="standard-generation" />

::: details パラダイム別の生成順序
トラック生成順序はBlueprintのパラダイムによって異なります：
- **Traditional / MelodyDriven**: Vocal -> Aux -> Motif -> Bass -> Chord -> Guitar -> Arpeggio -> Drums -> SE
- **RhythmSync**: Motif -> Vocal -> Aux -> Bass -> Chord -> Guitar -> Arpeggio -> Drums -> SE
:::

### ボーカル先行生成

<DocFigure name="vocal-first-generation" />

### トラック横断のボイス制限

セクションは、`max_moving_voices`で小節から次の小節へ変化できるピッチトラック数を制限できます。上限を超えると、Coordinatorは優先度の低い変化中トラックを直前の小節のコピーで凍結します。優先度は高い順に **Vocal → Guitar → Motif → Aux → Chord → Arpeggio → Bass** です。DrumsとSEはこの制限の対象外です。

Coordinatorはコピー・量子化のパス中にトラック固有のフレーズ末尾の休止を保ち、ピッチ解決後にギターのレーキ順を復元します。パスの順序とテールゲートの詳細は[トラック横断のボイス制限と最終修正](/ja/docs/generation-pipeline)を参照してください。

## 時間表現

MIDI Sketchは全体でティックベースのタイミングを使用：

```cpp
using Tick = uint32_t;
constexpr Tick TICKS_PER_BEAT = 480;    // Standard MIDI resolution
constexpr Tick TICKS_PER_BAR = 1920;    // 4/4 time signature
constexpr uint8_t BEATS_PER_BAR = 4;
```

::: tip ティック計算
- 4分音符 = 480 ticks
- 8分音符 = 240 ticks
- 16分音符 = 120 ticks
- 1小節（4/4拍子）= 1920 ticks
:::

## ノート表現

2層のノート表現：

```cpp
// Intermediate musical representation (internal)
struct NoteEvent {
  Tick start_tick;     // Absolute start time
  Tick duration;       // Duration in ticks
  uint8_t note;        // MIDI note (0-127)
  uint8_t velocity;    // MIDI velocity (0-127)
};

// Low-level MIDI bytes (output only)
struct MidiEvent {
  Tick tick;           // Absolute time
  uint8_t status;      // MIDI status byte
  uint8_t data1;       // First data byte
  uint8_t data2;       // Second data byte
};
```

## セクション定義

楽曲はセクションに分割：

```cpp
struct Section {
  SectionType type;              // Intro, A, B, Chorus, Bridge, Interlude, Outro, Chant, MixBreak, Drop
  std::string name;              // Display name
  uint8_t bars;                  // Bar count
  Tick start_bar;                // Start position (bars)
  Tick start_tick;               // Start position (ticks)
  VocalDensity vocal_density;    // Full, Sparse, None
  BackingDensity backing_density; // Normal, Thin, Thick
};
```

## コンポジションスタイル

3つのコンポジションスタイルが生成アプローチに影響：

| スタイル | Vocal | Aux | Motif | Arpeggio | 説明 |
|----------|:-----:|:---:|:-----:|:--------:|------|
| **MelodyLead (0)** | Yes | Yes | Blueprint依存 | Optional | ボーカルメロディが主役の伝統的なアレンジ |
| **BackgroundMotif (1)** | No | Yes | Yes | Optional | Vocal無効、Aux有効、Motifが主要フォーカス |
| **SynthDriven (2)** | No | No | Yes | Optional（手動有効化） | Vocal/Aux無効、シンセ/アルペジオ主体のエレクトロニックスタイル |

::: warning BGM専用モード
BackgroundMotifはVocalを無効にしますが、Auxは有効のままでMotif生成を強制します。SynthDrivenはVocalとAuxの両方を無効にし、Motif も無条件に生成します。Arpeggioは`arpeggioEnabled=true`で手動で有効にする必要があります。ボーカル付きの楽曲にはMelodyLeadを使用してください。
:::

## プロダクションブループリント

ブループリントはトラック生成順序、モチーフの振る舞い、暗黙的なオーバーライドを制御する高レベルのプロダクションテンプレートです。10個のブループリント（ID 0-9）があり、ID 255でランダム選択が可能です。

| ID | Name | Paradigm | RiffPolicy | Drums Required | Weight |
|----|------|----------|------------|:--------------:|--------|
| 0 | Traditional | Traditional | Free | - | 42% |
| 1 | RhythmLock | RhythmSync | LockedContour | **Yes** | 14% |
| 2 | StoryPop | MelodyDriven | Evolving | - | 10% |
| 3 | Ballad | MelodyDriven | Free | - | 4% |
| 4 | IdolStandard | MelodyDriven | Evolving | - | 10% |
| 5 | IdolHyper | RhythmSync | LockedContour | **Yes** | 6% |
| 6 | IdolKawaii | MelodyDriven | LockedContour | - | 5% |
| 7 | IdolCoolPop | RhythmSync | LockedContour | **Yes** | 5% |
| 8 | IdolEmo | MelodyDriven | LockedContour | - | 4% |
| 9 | BehavioralLoop | RhythmSync | LockedPitch | - | 0%* |

\* BehavioralLoop（ID 9）はweight 0%で、明示的に選択する必要があります（ランダム選択されません）。`addictive_mode=true`、`RiffPolicy::LockedPitch`、`HookIntensity::Maximum`を強制します。

::: details パラダイム
- **Traditional**: Vocal -> Aux -> Motif -> Bass -> Chord -> Guitar -> Arpeggio -> Drums -> SE
- **RhythmSync**: Motif -> Vocal -> Aux -> Bass -> Chord -> Guitar -> Arpeggio -> Drums -> SE（Motifを座標軸として使用）
- **MelodyDriven**: Vocal -> Aux -> Motif -> Bass -> Chord -> Guitar -> Arpeggio -> Drums -> SE（Traditionalと同じ順序だがMotifはメロディに追従）
:::

::: details RiffPolicy
公開C++、C、JavaScript APIは5つの`RiffPolicy`値を公開します：
- **Free (0)**: `FullSong`では各セクションに新しいモチーフを生成し、`Section`ではセクションタイプごとにパターンをキャッシュして再利用する
- **LockedContour (1)**: ピッチ輪郭を保ちながら表現を変える。`Locked`は互換エイリアスです
- **LockedPitch (2)**: ピッチを固定し、ベロシティの変更を許可する
- **LockedAll (3)**: キャッシュ済みのリフ全体を固定する
- **Evolving (4)**: キャッシュ済みのリフを各セクションで変化させながら、同一性を保つ

Blueprintは選択したポリシーを生成パラメータへコピーします。`MotifRepeatScope`は`Free`ポリシーの`FullSong`または`Section`の挙動を選びます。
:::

::: details ブループリントオーバーライド
ブループリントはSongConfigの複数のパラメータをオーバーライドできます：
- `section_flow`が`formId`をオーバーライド（存在し、かつ`formExplicit=false`の場合）
- `riff_policy`がセクション間のリフポリシーを選び、生成パラメータへコピーされる
- `drums_required`が`drums_enabled=true`を強制（`drumsEnabledExplicit=true`かつ`drumsEnabled=false`の場合を除く）
- `drums_sync_vocal`がSongConfigの設定をオーバーライド
- `mood_mask`が互換性のあるムードを制限（`isMoodCompatible()`で確認）
:::

## パラメータ適用順序

パラメータは特定のカスケード順序で適用され、後の段階が前の段階をオーバーライドできます：

```
StylePreset → VocalStylePreset → MelodicComplexity → SongConfig Overrides → Master Switch
```

1. **StylePreset**: メロディ設定を含む基本パラメータを設定
2. **VocalStylePreset**: max_leap、syncopation、density、その他のボーカル特性を調整
3. **MelodicComplexity**: density/leap乗数を適用（Simpleは減少、Complexは増幅）
4. **SongConfig Overrides**: ユーザー指定のメロディ/モチーフオーバーライドパラメータが最高優先度
5. **Master Switch**: `enableSyncopation=false`でsyncopation_prob=0.0とallow_bar_crossing=falseを強制

## 乱数生成

メルセンヌ・ツイスターによる決定論的生成：

```cpp
std::mt19937 rng(seed);  // Same seed = same output
```

::: info 再現性
- **seed > 0**: 完全決定論的 - 同じシードと同じパラメータで常に同一の出力
- **seed = 0**: ランダム - 現在時刻を使用、実行ごとに異なる結果
:::

シードが0の場合、現在時刻がランダム化に使用されます。

## WASMコンパイル

Emscripten経由でWebAssemblyにコンパイル：

- **出力**: 約<WasmStat type="size" /> WASM（gzip: 約<WasmStat type="gzip" />）+ 約<WasmStat type="js" /> JS（ラッパー + グルー）
- **外部依存なし**: 純粋なC++17
- **ES6モジュール**: モジュラーJavaScriptラッパー

```bash
# Build flags
-sWASM=1 -sMODULARIZE=1 -sEXPORT_ES6=1
-sALLOW_MEMORY_GROWTH=1 -sSTACK_SIZE=1048576
```

## C APIレイヤー

WASM相互運用のため、C APIがC++クラスをラップ：

```c
// Lifecycle
MidiSketchHandle handle = midisketch_create();
midisketch_generate_from_json(handle, config_json, json_length);
MidiSketchMidiData* midi = midisketch_get_midi(handle);
midisketch_free_midi(midi);
midisketch_destroy(handle);
```

主要関数：
- `midisketch_generate_from_json()` - コア生成
- `midisketch_generate_vocal_from_json()` - ボーカルのみの生成
- `midisketch_regenerate_vocal_from_json()` - ボーカル再生成
- `midisketch_generate_accompaniment_from_json()` - 伴奏生成
- `midisketch_regenerate_accompaniment_from_json()` - 伴奏再生成
- `midisketch_generate_with_vocal_from_json()` - ボーカル優先フル生成
- `midisketch_set_vocal_notes_from_json()` - カスタムボーカル注入
- `midisketch_get_piano_roll_safety()` - ピアノロール安全性分析
- `midisketch_get_midi()` - MIDIバイナリ出力
- `midisketch_get_events()` - JSONイベントデータ
- `midisketch_get_info()` - メタデータ（小節数、ティック、BPM）
- `midisketch_blueprint_count()` / `midisketch_blueprint_name()` - ブループリント情報
