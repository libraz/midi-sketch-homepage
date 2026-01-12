# 生成パイプライン

[MIDI Sketch](https://github.com/libraz/midi-sketch)のステップバイステップの音楽生成プロセスを解説します。

## パイプライン概要

MIDI Sketchはコンポジションスタイルとユースケースに応じて複数の生成ワークフローをサポートしています。

### ボーカル先行ワークフロー

反復的なボーカル調整用：

```mermaid
flowchart TD
    subgraph Step1 ["ステップ1: ボーカル生成"]
        V1[generateVocal] --> V2["プレビュー/イテレーション"]
        V2 -->|満足していない| V3[regenerateVocal]
        V3 --> V2
    end

    subgraph Step2 ["ステップ2: 伴奏"]
        A1[generateAccompaniment]
        A1 --> A2["Aux → ベース → コード → ドラム"]
    end

    V2 -->|満足| A1
```

### BGM専用モード

`BackgroundMotif`と`SynthDriven`コンポジションスタイルでは、ボーカル生成がスキップされます：

```mermaid
flowchart LR
    subgraph BGMMode ["BGM専用パイプライン"]
        B1["構造"] --> B2["モチーフ/アルペジオ"]
        B2 --> B3["ベース"]
        B3 --> B4["コード"]
        B4 --> B5["ドラム"]
    end
```

## CompositionStyleによる分岐

| スタイル | 主要トラック | ボーカル | 生成順序 |
|----------|--------------|----------|----------|
| **MelodyLead** | ボーカル | あり | Vocal → Aux → Bass → Chord → Drums |
| **BackgroundMotif** | モチーフ | なし | Motif → Bass → Chord → Drums |
| **SynthDriven** | アルペジオ | なし | Bass → Chord → Arpeggio → Drums |

## フェーズ1: 構造構築

`StructurePattern`に基づいて楽曲構造を作成：

```cpp
void Generator::buildStructure() {
    arrangement_ = StructureBuilder::build(params_.structure);
}
```

### 構造パターン

| パターン | 小節数 | セクション |
|----------|--------|------------|
| StandardPop | 24 | A(8)-B(8)-Chorus(8) |
| BuildUp | 28 | Intro(4)-A(8)-B(8)-Chorus(8) |
| DirectChorus | 16 | A(8)-Chorus(8) |
| RepeatChorus | 32 | A(8)-B(8)-Chorus(8)-Chorus(8) |
| FullPop | 56 | Intro-A-B-Chorus-A-B-Chorus-Outro |
| FullWithBridge | 52 | Intro-A-B-Chorus-Bridge-Chorus-Outro |
| Ballad | 56 | Intro(8)-A-B-Chorus-Interlude-B-Chorus-Outro |
| ExtendedFull | 90 | 拡張セクション付きフル形式 |

### セクションタイプ

各セクションは生成に影響するプロパティを持つ：

```cpp
struct Section {
    SectionType type;         // Intro, A, B, Chorus, Bridge, Interlude, Outro
    uint8_t bars;             // 小節数
    VocalDensity vocal_density;    // Full, Sparse, None
    BackingDensity backing_density; // Normal, Thin, Thick
};
```

## フェーズ2: トラック生成

### ボーカルトラック（MelodyLeadのみ）

フレーズキャッシュとテンプレート駆動設計を持つ最も複雑な生成器：

```mermaid
flowchart TD
    A["セクション取得"] --> B{"フレーズキャッシュあり?"}
    B -->|あり| C["キャッシュからフレーズ取得"]
    B -->|なし| D["メロディテンプレート選択"]
    D --> E["フレーズ輪郭を生成"]
    E --> F["強拍にコードトーン適用"]
    F --> G["装飾を追加"]
    G --> H["キャッシュに保存"]
    C --> I["ボイスリーディング適用"]
    H --> I
    I --> J["アティチュード適用"]
    J --> K["音域クランプ"]
```

**メロディテンプレート:**

| テンプレート | 特徴 |
|--------------|------|
| ArchShape | ピークまで上昇し、下降 |
| DescendingLine | フレーズ全体で緩やかに下降 |
| PhraseEcho | メロディモチーフを繰り返し |
| StepwiseFlow | 滑らかな順次進行 |
| LeapAndStep | 跳躍後に順次進行で埋める |
| PentatonicFlow | ペンタトニックスケール使用 |
| SyncopatedGroove | オフビート強調 |

**ボーカルアティチュード:**

| アティチュード | 特徴 |
|----------------|------|
| Clean | コードトーンのみ、オンビートリズム |
| Expressive | 遅延解決のテンション、微妙なタイミング変動 |
| Raw | 非コードトーン、フレーズ境界の破壊 |

### Auxトラック

ボーカルに適応する副旋律サポートを生成：

```mermaid
flowchart TD
    A["ボーカルフレーズを分析"] --> B{"セクションタイプ?"}
    B -->|Chorus| C["密度を下げ、低音域へ"]
    B -->|Verse| D["通常密度"]
    C --> E["Aux機能を選択"]
    D --> E
    E --> F{"機能タイプ"}
    F -->|PulseLoop| G["リズミックアンカーパルス"]
    F -->|TargetHint| H["メロディターゲットノート"]
    F -->|GrooveAccent| I["シンコペーションアクセント"]
    G --> J["ボーカル衝突を回避"]
    H --> J
    I --> J
```

**Aux機能:**

| 機能 | 目的 | 使用タイミング |
|------|------|----------------|
| PulseLoop | リズミックアンカー | ストレートリズム |
| TargetHint | メロディターゲットの提示 | 複雑なメロディ |
| GrooveAccent | リズミックアクセント | シンコペーショングルーブ |

### ベース生成

ベースは和声の基礎を提供し、ボーカルがある場合は適応：

```mermaid
flowchart TD
    A["小節のコードを取得"] --> B["ルート音を決定"]
    B --> C{"ボーカルあり?"}
    C -->|あり| D["衝突回避を適用"]
    C -->|なし| E["標準生成"]
    D --> F{"セクションタイプ?"}
    E --> F
    F -->|Chorus| G["高いオクターブ"]
    F -->|Intro| H["低いオクターブ"]
    F -->|その他| I["中オクターブ"]
    G --> J["アプローチノートを追加"]
    H --> J
    I --> J
    J --> K["パターンを適用"]
```

**ベースパターン:**

- **Sparse**: 1拍目と3拍目に4分音符（バラード、チル）
- **Standard**: 時々8分音符を含む4分音符リズム
- **Driving**: アプローチノート付き8分音符パターン

### コード生成

コードボイシングはベースとボーカルと協調：

```cpp
void Generator::generateChord() {
    BassAnalysis bassAnalysis = analyzeBass(song_.bass);
    VocalAnalysis vocalAnalysis = analyzeVocal(song_.vocal);

    // ベースがルートを持つ場合はルートレスボイシング
    if (bassAnalysis.hasRootOnBeat1) {
        useRootlessVoicing();
    }

    // ボーカルとの衝突を回避
    if (vocalAnalysis.hasNoteAt(tick)) {
        adjustVoicing(vocalAnalysis.pitchAt(tick));
    }
}
```

**ボイスリーディングアルゴリズム:**

1. 連続するボイシング間の距離を計算
2. 動きを最小化（半音距離の合計）
3. 共通音を最大限保持
4. 遷移を最適化するために転回形を適用

### ドラム生成

ドラムパターンはムードに基づいて選択：

| スタイル | 特徴 | 使用ムード |
|----------|------|-----------|
| Sparse | ハーフタイム、ミニマル | Ballad, Chill |
| Standard | 8分ハイハット、2&4スネア | StraightPop |
| FourOnFloor | 4つ打ちキック | ElectroPop, IdolPop |
| Upbeat | シンコペーション、16分ハイハット | BrightUpbeat |
| Rock | ライドシンバル、クラッシュアクセント | LightRock |
| Synth | タイトな16分ハイハット | Yoasobi, Synthwave |

**フィル生成:**

- タムの下降/上昇パターン
- スネアロール
- セクション遷移でのコンビネーションフィル

### モチーフトラック（BackgroundMotifスタイル）

主要なメロディ要素として繰り返しパターンを生成：

```cpp
MotifParams params {
    .length = MotifLength::TwoBars,    // 2または4小節
    .rhythm_density = RhythmDensity::Medium,
    .motion = MotifMotion::Stepwise,
    .repeat_scope = RepeatScope::FullSong
};
```

### アルペジオトラック（SynthDrivenスタイル）

主要なハーモニック要素としてアルペジオパターンを生成：

```cpp
ArpeggioParams params {
    .pattern = ArpeggioPattern::UpDown,
    .speed = ArpeggioSpeed::Sixteenth,
    .octave_range = 2,
    .gate = 0.5f  // ノート長比率
};
```

### SEトラック

セクションマーカーとサウンドエフェクトキューを生成：
- セクション境界マーカー（テキストイベント）
- コールタイミングヒント（callEnabled時）
- イントロチャントマーカー

## フェーズ3: 仕上げ

### トランジション・ダイナミクス

エネルギー遷移を自動適用：

```mermaid
flowchart LR
    A["Bセクション"] -->|クレシェンド| B["サビ"]
    B -->|ステップアップ| C["サビ2"]
```

**セクションエネルギー倍率:**

| セクション | 倍率 |
|------------|------|
| Intro | 0.75 |
| A | 0.85 |
| B | 1.00 |
| Chorus | 1.20 |
| Bridge | 0.90 |
| Outro | 0.80 |

### ヒューマナイズ

タイミングとベロシティに自然な揺らぎを追加：

```cpp
void applyHumanization(Song& song, float intensity) {
    // タイミング: ランダムオフセット ±ms
    // ベロシティ: ランダム ±値
    // ドラムには適用しない
}
```

## MIDI出力

最後に、SongをSMF Type 1または Type 2に変換：

```mermaid
flowchart TD
    A[Song] --> B[MidiWriter::build]
    B --> C["ヘッダー書き込み"]
    C --> D["生成メタデータを埋め込み"]
    D --> E["各トラックを処理"]
    E --> F["NoteEventをMidiEventに変換"]
    F --> G["目標キーへ移調を適用"]
    G --> H["可変長タイミングを書き込み"]
    H --> I["SMF バイナリ"]
```

**トラックマッピング:**

| トラック | チャンネル | プログラム |
|----------|------------|------------|
| Vocal | 0 | 0（ピアノ） |
| Aux | 1 | 4（エレピ） |
| Chord | 2 | 4（エレピ） |
| Bass | 3 | 33（エレベ） |
| Motif | 4 | 81（シンセリード） |
| Arpeggio | 5 | 81（ソウリード） |
| Drums | 9 | GMドラム |
| SE | 15 | テキストイベント |

## キー移調

全ての生成はCメジャーで行われ、出力時に移調が適用：

```cpp
uint8_t MidiWriter::transposePitch(uint8_t pitch, Key key) {
    return pitch + static_cast<uint8_t>(key);
}
```

## メタデータ埋め込み

生成されたMIDIファイルには再生成用のメタデータが含まれます：

```cpp
struct MidiMetadata {
    uint32_t seed;
    uint8_t style_preset_id;
    uint8_t chord_progression_id;
    uint8_t form_id;
    uint8_t composition_style;
    uint8_t vocal_attitude;
    uint8_t vocal_style;
    uint8_t melody_template;
    // ... 追加パラメータ
};
```

これにより、CLIで正確な再現が可能：`./midisketch_cli --regenerate song.mid`
