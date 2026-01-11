# プリセットリファレンス

[MIDI Sketch](https://github.com/libraz/midi-sketch)で利用可能な全プリセットを紹介します。

## 構造パターン

11の楽曲構造パターン：

| ID | 名前 | 小節 | 再生時間 @120 BPM | セクション |
|----|------|------|-------------------|------------|
| 0 | StandardPop | 24 | 2:00 | A(8)-B(8)-Chorus(8) |
| 1 | BuildUp | 28 | 2:20 | Intro(4)-A(8)-B(8)-Chorus(8) |
| 2 | DirectChorus | 16 | 1:20 | A(8)-Chorus(8) |
| 3 | RepeatChorus | 32 | 2:40 | A(8)-B(8)-Chorus(8)-Chorus(8) |
| 4 | ShortForm | 12 | 1:00 | Intro(4)-Chorus(8) |
| 5 | FullPop | 56 | 4:40 | Intro-A-B-Chorus-A-B-Chorus-Outro |
| 6 | FullWithBridge | 52 | 4:20 | Intro-A-B-Chorus-Bridge-Chorus-Outro |
| 7 | DriveUpbeat | 52 | 4:20 | Intro-Chorus-A-B-Chorus-Chorus-Outro |
| 8 | Ballad | 56 | 4:40 | Intro(8)-A-B-Chorus-Interlude-B-Chorus-Outro |
| 9 | AnthemStyle | 52 | 4:20 | Intro-A-Chorus-A-B-Chorus-Chorus-Outro |
| 10 | ExtendedFull | 90 | 7:30 | 拡張セクション付きフル形式 |

### セクションタイプ

```mermaid
flowchart LR
    I[Intro] --> A[Aセクション]
    A --> B[Bセクション]
    B --> C[サビ]
    C --> BR[ブリッジ]
    BR --> C2[サビ]
    C2 --> O[アウトロ]
```

| タイプ | ボーカル密度 | エネルギー | 目的 |
|--------|-------------|----------|------|
| Intro | None/Sparse | 低 | ムード確立 |
| A | Full | 中低 | バース、物語 |
| B | Full | 中 | プリコーラス、テンション |
| Chorus | Full | 高 | フック、クライマックス |
| Bridge | Sparse | 中 | コントラスト |
| Interlude | None | 中低 | インスト休憩 |
| Outro | Sparse | 中低 | 解決 |

## ムードプリセット

20のムードプリセットが全体の雰囲気を定義：

| ID | 名前 | BPM | ドラムスタイル | 特徴 |
|----|------|-----|---------------|------|
| 0 | StraightPop | 120 | Standard | クラシックポップグルーヴ |
| 1 | BrightUpbeat | 128 | Upbeat | シンコペーション、エネルギッシュ |
| 2 | EnergeticDance | 130 | FourOnFloor | ダンス向け |
| 3 | LightRock | 125 | Rock | ギター志向 |
| 4 | MidPop | 115 | Standard | バランスの取れたミッドテンポ |
| 5 | EmotionalPop | 110 | Standard | センチメンタル、ソフト |
| 6 | Sentimental | 95 | Sparse | バラード風 |
| 7 | Chill | 100 | Sparse | リラックス、ミニマル |
| 8 | Ballad | 80 | Sparse | スロー、スパースドラム |
| 9 | DarkPop | 118 | Synth | ダーク、ドラマチック |
| 10 | Dramatic | 115 | Standard | 高表現 |
| 11 | Nostalgic | 105 | Standard | レトロ感 |
| 12 | ModernPop | 125 | Synth | コンテンポラリー |
| 13 | ElectroPop | 135 | FourOnFloor | エレクトロニック、ダンス |
| 14 | IdolPop | 138 | FourOnFloor | J-popアイドルスタイル |
| 15 | Anthem | 120 | Standard | 勝利感、壮大 |
| 16 | Yoasobi | 148 | Synth | アニメスタイル、ハイエナジー |
| 17 | Synthwave | 118 | Synth | レトロシンセ、ネオン |
| 18 | FutureBass | 145 | Synth | モダンエレクトロニック |
| 19 | CityPop | 110 | Standard | 80年代シティポップ |

### ムードカテゴリ

```mermaid
flowchart TD
    subgraph Slow ["スロー (80-100 BPM)"]
        S1[Ballad]
        S2[Sentimental]
        S3[Chill]
    end

    subgraph Mid ["ミッド (100-125 BPM)"]
        M1[StraightPop]
        M2[MidPop]
        M3[CityPop]
        M4[Synthwave]
    end

    subgraph Fast ["ファスト (125-150 BPM)"]
        F1[BrightUpbeat]
        F2[ElectroPop]
        F3[IdolPop]
        F4[Yoasobi]
        F5[FutureBass]
    end
```

## コード進行

シンプルから複雑まで22のコード進行：

### ベーシック（2-3コード）

| ID | 名前 | ディグリー | 用途 |
|----|------|------------|------|
| 5 | Minimal | I-IV | シンプル、フォーク |
| 6 | AltMinimal | I-V | パワーポップ |
| 7 | Progression3 | I-vi-IV | 3コードポップ |

### スタンダード（4コード）

| ID | 名前 | ディグリー | 用途 |
|----|------|------------|------|
| 0 | Pop4 | I-V-vi-IV | 万能ポップ |
| 1 | Axis | vi-IV-I-V | メランコリック |
| 2 | Komuro | vi-IV-V-I | ブライトJ-pop |
| 4 | Emotional4 | vi-V-IV-V | テンションビルド |
| 8 | Rock4 | I-bVII-IV-I | ロック感 |

### 拡張（5コード以上）

| ID | 名前 | ディグリー | 用途 |
|----|------|------------|------|
| 3 | Canon | I-V-vi-iii-IV | クラシック |
| 9 | Extended5 | I-V-vi-iii-IV | フル進行 |
| 10 | Emotional5 | vi-IV-I-V-ii | 複雑エモーショナル |

## スタイルプリセット

ムードとコンポジションアプローチを組み合わせた13のスタイルプリセット：

| ID | 名前 | スタイル | ベースムード | 特徴 |
|----|------|----------|-------------|------|
| 0 | MinimalGroovePop | MelodyLead | MidPop | クリーン、シンプル |
| 1 | DancePopStandard | MelodyLead | EnergeticDance | ダンスフロア |
| 2 | IdolStandard | MelodyLead | IdolPop | J-popアイドル |
| 3 | RockStandard | MelodyLead | LightRock | ロックバンド |
| 4 | BalladStandard | MelodyLead | Ballad | スローバラード |
| 5 | YoasobiStyle | SynthDriven | Yoasobi | アニメスタイル |
| 6 | SynthwaveStyle | SynthDriven | Synthwave | レトロシンセ |
| 7 | FutureBassStyle | SynthDriven | FutureBass | モダンEDM |
| 8 | CityPopStyle | MelodyLead | CityPop | 80年代 |
| 9 | MotifDriven | BackgroundMotif | MidPop | パターンベース |
| 10 | ChillMotif | BackgroundMotif | Chill | リラックスパターン |
| 11 | ElectroMotif | BackgroundMotif | ElectroPop | エレクトロパターン |
| 12 | AnthemStyle | MelodyLead | Anthem | 勝利感 |

## コンポジションスタイル

3つのコンポジションアプローチ：

| スタイル | フォーカス | ボーカルの役割 | 主な特徴 |
|----------|-----------|---------------|----------|
| MelodyLead | ボーカルメロディ | プライマリ | フルメロディ表現 |
| BackgroundMotif | 繰り返しパターン | セカンダリ | モチーフがメイン要素 |
| SynthDriven | シンセ/アルペジオ | セカンダリ | エレクトロニック、アルペジオ |

### MelodyLead

```mermaid
flowchart LR
    V[ボーカル] -->|リード| M[ミックス]
    C[コード] -->|サポート| M
    B[ベース] -->|基盤| M
    D[ドラム] -->|リズム| M
```

### BackgroundMotif

```mermaid
flowchart LR
    MT[モチーフ] -->|リード| M[ミックス]
    V[ボーカル] -->|バックグラウンド| M
    C[コード] -->|サポート| M
    B[ベース] -->|基盤| M
```

### SynthDriven

```mermaid
flowchart LR
    A[アルペジオ] -->|リード| M[ミックス]
    V[ボーカル] -->|バックグラウンド| M
    C[コード] -->|パッド| M
    B[ベース] -->|基盤| M
```

## ボーカルアティチュード

3つのメロディ表現レベル：

| アティチュード | 特徴 | 最適な用途 |
|----------------|------|-----------|
| Clean | コードトーンのみ、オンビート | ポップ、バラード |
| Expressive | テンション、タイミング変動 | エモーショナル、ダイナミック |
| Raw | 非コードトーン、境界破壊 | エッジー、モダン |

## メロディテンプレート

**テンプレート駆動**アプローチでコアメロディ動作を定義する7つのメロディテンプレート：

| ID | 名前 | Plateau | 最大ステップ | 用途 |
|----|------|---------|----------|----------|
| 0 | Auto | - | - | VocalStylePreset基準で選択 |
| 1 | PlateauTalk | 0.65 | 2 | NewJeans、Billie Eilish（トークシング） |
| 2 | RunUpTarget | 0.20 | 4 | YOASOBI、Ado（上昇ラン） |
| 3 | DownResolve | 0.30 | 3 | Bセクション、プリコーラス |
| 4 | HookRepeat | 0.40 | 3 | TikTok、K-POPフック |
| 5 | SparseAnchor | 0.50 | 2 | バラード、Official髭男dism |
| 6 | CallResponse | - | - | デュエットパターン |
| 7 | JumpAccent | - | - | 感情的ピーク |

- **Plateau ratio**: 同じピッチに留まる確率（0.0-1.0）
- **Max step**: 半音単位の最大メロディ音程

## ボーカルスタイルプリセット

メロディテンプレートを自動選択する13のボーカルスタイルプリセット：

| ID | 名前 | テンプレート | 特徴 |
|----|------|----------|-----------|
| 0 | Auto | セクション依存 | Verse=PlateauTalk、Chorus=RunUpTarget |
| 1 | Standard | PlateauTalk | バランスの取れたポップボーカル |
| 2 | Vocaloid | RunUpTarget | 高速、広い跳躍 |
| 3 | UltraVocaloid | RunUpTarget | 超高速（32分音符） |
| 4 | Idol | PlateauTalk | キャッチーなフック、高16分率 |
| 5 | Ballad | SparseAnchor | スロー、持続音 |
| 6 | Rock | RunUpTarget | パワフル、音域シフト |
| 7 | CityPop | PlateauTalk | ジャジー、グルービー |
| 8 | Anime | HookRepeat | フック重視 |
| 9 | BrightKira | HookRepeat | 高音域 |
| 10 | CoolSynth | PlateauTalk | エレクトロニック |
| 11 | CuteAffected | HookRepeat | プレイフル、キュート |
| 12 | PowerfulShout | RunUpTarget | 激しい、シャウト系 |

### ボーカルスタイルカテゴリ

```mermaid
flowchart TD
    subgraph Fast ["高速/高密度"]
        V2[Vocaloid]
        V3[UltraVocaloid]
        V10[CoolSynth]
    end

    subgraph Standard ["標準"]
        V1[Standard]
        V4[Idol]
        V8[Anime]
        V9[BrightKira]
    end

    subgraph Slow ["低速/低密度"]
        V5[Ballad]
        V6[Rock]
        V7[CityPop]
        V11[CuteAffected]
        V12[PowerfulShout]
    end
```

## メロディック複雑さ

メロディ生成に影響する3つの複雑さレベル：

| レベル | 効果 | 用途 |
|--------|------|------|
| Simple (0) | 密度低下、跳躍小、フック多め | キャッチー、覚えやすい |
| Standard (1) | デフォルト動作 | 一般用途 |
| Complex (2) | 密度増加、跳躍大、バリエーション多 | 洗練された |

## フック強度

4つのフック反復レベル：

| レベル | 効果 | 用途 |
|--------|------|------|
| Off (0) | フック反復なし | プログレッシブ、多様性重視 |
| Light (1) | 控えめなフック | 繊細なコールバック |
| Normal (2) | 標準的な反復 | バランス重視ポップ（デフォルト） |
| Strong (3) | 強いフック強調 | キャッチー、商業的 |

## ボーカルグルーブ感

6つのリズム感オプション：

| グルーブ | 効果 | 最適な用途 |
|----------|------|-----------|
| Straight (0) | オンビート、スウィングなし | ポップ、ロック |
| OffBeat (1) | オフビート強調 | レゲエ影響 |
| Swing (2) | スウィングタイミング | ジャズ、R&B |
| Syncopated (3) | シンコペーションリズム | ラテン、ファンク |
| Driving16th (4) | 16分音符ドライブ | エレクトロニック、高速ポップ |
| Bouncy8th (5) | バウンス8分音符 | アップビートポップ |

## キーオプション

12のキー（0-11）：

| ID | キー | 備考 |
|----|------|------|
| 0 | C | ナチュラル、#♭なし |
| 1 | C# / Db | 5# / 7♭ |
| 2 | D | 2# |
| 3 | D# / Eb | 3♭ |
| 4 | E | 4# |
| 5 | F | 1♭ |
| 6 | F# / Gb | 6# / 6♭ |
| 7 | G | 1# |
| 8 | G# / Ab | 4♭ |
| 9 | A | 3# |
| 10 | A# / Bb | 2♭ |
| 11 | B | 5# |

## BPMレンジ

有効テンポ範囲: 60-180 BPM

- 0に設定するとムードのデフォルトBPMを使用
- 各ムードには最適なBPM設定あり

## 設定例

### シンプルなポップソング

```javascript
import { createDefaultConfig } from 'midi-sketch'

// MinimalGroovePopプリセットを使用
const config = createDefaultConfig(0)
config.key = 0                  // Cメジャー
config.chordProgressionId = 0   // Pop4 (I-V-vi-IV)
config.formId = 0               // StandardPop
config.bpm = 0                  // デフォルト使用 (120)
config.drumsEnabled = true
```

### エモーショナルバラード

```javascript
// BalladStandardプリセットを使用
const config = createDefaultConfig(4)  // BalladStandard
config.key = 7                         // Gメジャー
config.chordProgressionId = 4          // Emotional4
config.formId = 8                      // Ballad構造
config.bpm = 75                        // より遅く
config.drumsEnabled = true
```

### YOASOBIスタイル

```javascript
// YoasobiStyleプリセットを使用
const config = createDefaultConfig(5)  // YoasobiStyle
config.key = 2                         // Dメジャー
config.chordProgressionId = 2          // Komuro
config.bpm = 0                         // デフォルト使用 (148)
config.drumsEnabled = true
config.arpeggioEnabled = true
config.vocalNoteDensity = 150          // ボカロスタイルの高密度メロディ
config.vocalAllowExtremLeap = true     // 広い音程跳躍を許可
```

### チルバックグラウンド

```javascript
// ChillMotifプリセットを使用
const config = createDefaultConfig(10)  // ChillMotif
config.key = 5                          // Fメジャー
config.chordProgressionId = 5           // Minimal
config.formId = 4                       // ShortForm
config.bpm = 95
config.drumsEnabled = false             // アンビエント用ドラムなし
```

### アイドルポップ（コール付き）

```javascript
// IdolStandardプリセットを使用
const config = createDefaultConfig(2)  // IdolStandard
config.key = 0                         // Cメジャー
config.callEnabled = true              // コールトラック有効化
config.introChant = 1                  // ガチ恋イントロ
config.mixPattern = 1                  // スタンダードミックス
config.callDensity = 2                 // 標準密度
config.modulationTiming = 1            // ラスサビで転調
config.modulationSemitones = 2         // 2半音上げ
```
