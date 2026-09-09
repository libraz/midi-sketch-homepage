# プリセットリファレンス

[MIDI Sketch](https://github.com/libraz/midi-sketch)で利用可能な全プリセットを紹介します。

::: tip これらの設定が初めての方へ
各プリセットは、コースで解説した設定フィールドの束です。総仕上げの章[概念と設定の対応](/ja/docs/course/config-mapping)が、すべてのプリセット値が音楽的アイデアにどう対応するかを示します。
:::

## 構造パターン

18の楽曲構造パターン：

| ID | 名前 | 小節 | 再生時間 @120 BPM | セクション |
|----|------|------|-------------------|------------|
| 0 | StandardPop | 24 | 0:48 | A(8)-B(8)-Chorus(8) |
| 1 | BuildUp | 28 | 0:56 | Intro(4)-A(8)-B(8)-Chorus(8) |
| 2 | DirectChorus | 16 | 0:32 | A(8)-Chorus(8) |
| 3 | RepeatChorus | 32 | 1:04 | A(8)-B(8)-Chorus(8)-Chorus(8) |
| 4 | ShortForm | 12 | 0:24 | Intro(4)-Chorus(8) |
| 5 | FullPop | 56 | 1:52 | Intro-A-B-Chorus-A-B-Chorus-Outro |
| 6 | FullWithBridge | 48 | 1:36 | Intro-A-B-Chorus-Bridge-Chorus-Outro |
| 7 | DriveUpbeat | 48 | 1:36 | Intro-Chorus-A-B-Chorus-Chorus-Outro |
| 8 | Ballad | 60 | 2:00 | Intro(8)-A-B-Chorus-Interlude-B-Chorus-Outro |
| 9 | AnthemStyle | 56 | 1:52 | Intro-A-Chorus-A-B-Chorus-Chorus-Outro |
| 10 | ExtendedFull | 88 | 2:56 | 拡張セクション付きフル形式 |
| 11 | ChorusFirst | 32 | 1:04 | Chorus(8)-A(8)-B(8)-Chorus(8) |
| 12 | ChorusFirstShort | 24 | 0:48 | Chorus(8)-A(8)-Chorus(8) |
| 13 | ChorusFirstFull | 56 | 1:52 | Chorus-A-B-Chorus-A-B-Chorus |
| 14 | ImmediateVocal | 24 | 0:48 | A(8)-B(8)-Chorus(8) (イントロなし) |
| 15 | ImmediateVocalFull | 48 | 1:36 | A-B-Chorus-A-B-Chorus (イントロなし) |
| 16 | AChorusB | 32 | 1:04 | A(8)-Chorus(8)-B(8)-Chorus(8) |
| 17 | DoubleVerse | 32 | 1:04 | A(8)-A(8)-B(8)-Chorus(8) |

### セクションタイプ

<DocFigure name="presets-section-flow" />

| タイプ | ボーカル密度 | エネルギー | 目的 |
|--------|-------------|----------|------|
| Intro | None | 低 | ムード確立 |
| A | Sparse | 中低 | バース、物語 |
| B | Full | 中 | プリコーラス、テンション |
| Chorus | Full | 高 | フック、クライマックス |
| Bridge | Sparse | 中 | コントラスト |
| Interlude | None | 低 | インスト休憩 |
| Outro | None | 中低 | 解決 |
| Chant | None | 低 | コール＆レスポンスのチャント |
| MixBreak | None | 高 | ラスサビ前のMIXブレイク |
| Drop | None | 高 | EDMのドロップ：キック＋サブベースのみ、その後再入 |

::: tip 長さの計算
120 BPMの場合: 1小節 ≈ 2秒。`targetDurationSeconds=0`で正確なパターンの長さを使用するか、目標秒数を指定して自動生成された構造を使用します。
:::

## ムードプリセット

24のムードプリセットが全体の雰囲気を定義：

| ID | 名前 | BPM | ドラムスタイル | 特徴 |
|----|------|-----|---------------|------|
| 0 | StraightPop | 120 | Standard | クラシックポップグルーヴ |
| 1 | BrightUpbeat | 130 | Upbeat | シンコペーション、エネルギッシュ |
| 2 | EnergeticDance | 140 | FourOnFloor | ダンス向け |
| 3 | LightRock | 125 | Rock | ギター志向 |
| 4 | MidPop | 110 | Upbeat | バランスの取れたミッドテンポ |
| 5 | EmotionalPop | 105 | Sparse | センチメンタル、ソフト |
| 6 | Sentimental | 100 | Standard | バラード風 |
| 7 | Chill | 85 | Sparse | リラックス、ミニマル |
| 8 | Ballad | 75 | Sparse | スロー、スパースドラム |
| 9 | DarkPop | 115 | FourOnFloor | ダーク、ドラマチック |
| 10 | Dramatic | 100 | Rock | 高表現 |
| 11 | Nostalgic | 105 | Standard | レトロ感 |
| 12 | ModernPop | 125 | Upbeat | コンテンポラリー |
| 13 | ElectroPop | 135 | FourOnFloor | エレクトロニック、ダンス |
| 14 | IdolPop | 145 | Upbeat | J-popアイドルスタイル |
| 15 | Anthem | 130 | Upbeat | 勝利感、壮大 |
| 16 | AnimeHighEnergy | 130 | Synth | アニメ系ハイエナジーポップ |
| 17 | Synthwave | 118 | Synth | レトロシンセ、ネオン |
| 18 | FutureBass | 145 | Synth | モダンエレクトロニック |
| 19 | CityPop | 110 | Standard | 80年代シティポップ |
| 20 | RnBNeoSoul | 92 | Standard | R&B/ネオソウル、強スウィング、テンションコード。実用帯域は 85-100 |
| 21 | LatinPop | 95 | Latin | ラテンポップ、デンボウリズム、トレシージョベース |
| 22 | Trap | 70 | Trap | トラップ、ハーフタイム、808サブベース、ハイハットロール |
| 23 | Lofi | 80 | Sparse | Lo-fi、強スウィング、最大ベロシティ90 |

### ムードカテゴリ

<DocFigure name="presets-mood-tempo-bands" />

## コード進行

22のコード進行があります。うち20が4コード、2が5コードです。

### ダイアトニックな4コードループ

| ID | 名前 | ディグリー | Cメジャーでの表記 |
|----|------|------------|------------------|
| 0 | FourChordPop | I - V - vi - IV | C - G - Am - F |
| 1 | Pop1 | I - vi - IV - V | C - Am - F - G |
| 2 | Axis | vi - IV - I - V | Am - F - C - G |
| 3 | Pop2 | IV - I - V - vi | F - C - G - Am |
| 4 | Classic | I - IV - V - I | C - F - G - C |
| 5 | Pop3 | I - IV - vi - V | C - F - Am - G |
| 6 | Oudou | IV - V - iii - vi | F - G - Em - Am |
| 9 | Pop4 | I - V - iii - IV | C - G - Em - F |
| 10 | Pop5 | I - iii - IV - V | C - Em - F - G |
| 13 | Extended4 | I - V - vi - iii | C - G - Am - Em |

### マイナー寄りの4コードループ

| ID | 名前 | ディグリー | Cメジャーでの表記 |
|----|------|------------|------------------|
| 7 | Minor1 | vi - V - IV - V | Am - G - F - G |
| 8 | Minor2 | vi - IV - V - I | Am - F - G - C |
| 14 | Minor3 | vi - I - V - IV | Am - C - G - F |
| 16 | AnimeHighEnergy1 | vi - iii - IV - I | Am - Em - F - C |
| 18 | AnimeHighEnergy2 | vi - ii - V - I | Am - Dm - G - C |

### 借用和音・ジャズ寄り

| ID | 名前 | ディグリー | Cメジャーでの表記 |
|----|------|------------|------------------|
| 11 | Rock1 | I - bVII - IV - I | C - Bb - F - C |
| 12 | Rock2 | I - IV - bVII - I | C - F - Bb - C |
| 15 | AeolianPop | vi - bVI - bVII - I | Am - Ab - Bb - C |
| 17 | JazzPop | ii - V - I - vi | Dm - G - C - Am |
| 19 | CityPop | I - vi - ii - V | C - Am - Dm - G |

### 5コード

| ID | 名前 | ディグリー | Cメジャーでの表記 |
|----|------|------------|------------------|
| 20 | Extended5 | I - V - vi - iii - IV | C - G - Am - Em - F |
| 21 | NeapolitanPop | vi - iv - bII - V - I | Am - Fm - Db - G - C |

## スタイルプリセット

ムード、構造、コンポジションアプローチを組み合わせた17のスタイルプリセット：

::: tip スタイルプリセットの選び方
スタイルプリセットは、BPM、構造、ボーカルアティチュード、推奨コード進行の適切なデフォルト値を提供します。`createDefaultConfig()` 呼び出し後にこれらの設定を上書きできます。
:::

| ID | 名前 | 説明 | デフォルトBPM |
|----|------|------|--------------|
| 0 | Minimal Groove Pop | 2-4コードループの繰り返し、シンプルなメロディ | 122 |
| 1 | Dance Pop Emotion | クラシック構造、エモーショナルなサビ解放 | 128 |
| 2 | Bright Pop | アップビート、覚えやすいメロディ | 135 |
| 3 | Idol Standard | ユニゾン向き、覚えやすいメロディ | 140 |
| 4 | Idol Emotion | エモーショナルなアイドル曲、盛り上がるBメロ | 130 |
| 5 | Idol Energy | ハイエナジーなアイドル曲、ライブ向け | 150 |
| 6 | Idol Minimal | ショートフォーム向けミニマルアイドル曲 | 135 |
| 7 | Rock Shout | アグレッシブなボーカル、生々しい表現 | 125 |
| 8 | Pop Emotion | 言葉重視のエモーショナルポップ、リリック中心 | 108 |
| 9 | Raw Emotional | 激しい感情表現、境界を越えるフレーズ | 102 |
| 10 | Acoustic Pop | クリアなハーモニー、リズム軽め、ボーカル中心 | 95 |
| 11 | Live Call & Response | コンサート向け、コール＆レスポンス構造 | 140 |
| 12 | Background Motif | モチーフ駆動の既定値と控えめなボーカル。MelodyLeadを使用 | 120 |
| 13 | City Pop | グルーヴィーな80年代シティポップ、ジャジーなコード | 105 |
| 14 | Anime Opening | エピック、ドラマチックなアニメOP風 | 142 |
| 15 | EDM Synth Pop | モダンEDM、シンセリード | 138 |
| 16 | Emotional Ballad | スローエモーショナルバラード、表情豊かなボーカル | 72 |

### スタイルカテゴリ

| カテゴリ | ID | 説明 |
|----------|-----|------|
| Pop/Dance | 0-2 | 一般的なポップ・ダンススタイル |
| Idol | 3-6 | J-popアイドル系スタイル |
| Rock/Emo | 7-9 | ロック・エモーショナル系、生々しい表現 |
| Special/Derived | 10-12 | アコースティック、ライブ、アンビエント系 |
| Genre-Specific | 13-16 | シティポップ、アニメ、EDM、バラード系 |

## コンポジションスタイル

3つのコンポジションアプローチ：

| スタイル | フォーカス | ボーカル | Aux | 主な特徴 |
|----------|-----------|---------|-----|----------|
| MelodyLead (0) | ボーカルメロディ | あり | あり | フルメロディ表現。モチーフはパラダイム、RiffPolicy、addictive mode、Blueprintの条件に従う |
| BackgroundMotif (1) | 繰り返しパターン | なし | あり | モチーフ生成を有効化（セクションマスク/レイヤー設定が適用）、Auxは有効のまま |
| SynthDriven (2) | シンセ/アルペジオ | なし | なし | モチーフ生成を有効化（セクションマスク/レイヤー設定が適用）。アルペジオは手動で`arpeggioEnabled=true`が必要 |

::: warning BGM専用モード
BackgroundMotifとSynthDrivenはボーカルトラックを生成しません。BackgroundMotifではAuxを有効にしたままモチーフ生成を有効にします。SynthDrivenではボーカルとAuxの両方を無効にしてモチーフ生成を有効にします。セクションマスクとレイヤースケジュールによってMotifノートが残る場所が決まります。ボーカル付きの楽曲にはMelodyLeadを使用してください。
:::

## Production Blueprint

10種類の Production Blueprint が、スタイル/ムードとは独立して音楽の**生成方法**（アレンジスタイル）を制御します：

| ID | 名前 | パラダイム | RiffPolicy | ドラム必須 | 重み |
|----|------|-----------|------------|:----------:|:----:|
| 0 | Traditional (定番ポップ) | Traditional | Free | - | 42% |
| 1 | RhythmLock (リズムで刻む) | RhythmSync | Locked | **必須** | 14% |
| 2 | StoryPop (物語のように展開) | MelodyDriven | Evolving | - | 10% |
| 3 | Ballad (静かに始まる) | MelodyDriven | Free | - | 4% |
| 4 | IdolStandard (アイドル王道) | MelodyDriven | Evolving | - | 10% |
| 5 | IdolHyper (サビから攻める) | RhythmSync | Locked | **必須** | 6% |
| 6 | IdolKawaii (かわいく弾む) | MelodyDriven | Locked | - | 5% |
| 7 | IdolCoolPop (踊れるビート) | RhythmSync | Locked | **必須** | 5% |
| 8 | IdolEmo (静→爆発) | MelodyDriven | Locked | - | 4% |
| 9 | BehavioralLoop (中毒ループ) | RhythmSync | LockedPitch | - | 0%* |
| 255 | (ランダム) | - | - | - | - |

\*BehavioralLoop: 明示的な選択のみ（重み0%、ランダム選択されません）。`addictive_mode=true`、`HookIntensity=Maximum`、`RiffPolicy=LockedPitch` を強制します。

`blueprintId: 255` で重み付き自動選択

### 生成パラダイム

| パラダイム | トラック順序 | 説明 |
|-----------|-------------|------|
| Traditional | Vocal → Aux → Motif → Bass → Chord → Guitar → Arpeggio → Drums → SE | クラシックなポップ生成 |
| RhythmSync | Motif → Vocal → Aux → Bass → Chord → Guitar → Arpeggio → Drums → SE | モチーフ先行、リズムロックグルーヴ |
| MelodyDriven | Vocal → Aux → Motif → Bass → Chord → Guitar → Arpeggio → Drums → SE | メロディ中心、伴奏が追従 |

Traditional と MelodyDriven はトラック順序が同じで、違いは衝突回避の優先度にあります。Traditional では Motif が Bass・Chord より上位で、Bass と Chord が Motif を避けます。MelodyDriven では Motif が両者より下位になり、Motif の側が避けます。

### RiffPolicy

| ポリシー | 値 | 説明 |
|---------|:--:|------|
| Free | 0 | セクションごとに独立して変化 |
| LockedContour | 1 | 輪郭固定、リズムは変化 |
| LockedPitch | 2 | ピッチ完全固定、ベロシティは変化 |
| LockedAll | 3 | 全要素固定 |
| Evolving | 4 | キャッシュ済みリフを各セクションで変化させ、個性を保ちながら徐々に変化 |

※ `Locked` は `LockedContour` (1) のエイリアスです。`motifRepeatScope` は `Free` でのみ読み取られ、それ以外のポリシーでは無視されます。

::: tip Blueprint のオーバーライド
Blueprint 1-8 は独自の section_flow を持ち、`formId` 設定を置き換えます。BehavioralLoop（9）は section_flow を持たないため、`formId` の解決結果をそのまま使います。優先順位は `targetDurationSeconds` > `formExplicit=true` > Blueprint の section_flow > `formId` の構造パターン です。フォーム構造を完全に制御したい場合は ID 0（Traditional）を使用してください。
:::

### MelodyLead

<DocFigure name="presets-melody-lead-roles" />

### BackgroundMotif

<DocFigure name="presets-background-motif-roles" />

::: info BackgroundMotifではボーカルなし
BackgroundMotifではボーカルトラックが無効になります。Auxトラックは有効なままで、モチーフと共に副旋律サポートを提供します。
:::

### SynthDriven

<DocFigure name="presets-synth-driven-roles" />

::: info SynthDrivenではボーカル/Auxなし
SynthDrivenではボーカルトラックとAuxトラックの両方が無効になります。アルペジオは手動で有効化が必要です（`arpeggioEnabled=true`）。自動有効化はされません。
:::

## アルペジオパターン

`arpeggioEnabled=true` のとき、どのコンポジションスタイルでも使える8つの具体的なアルペジオパターン：

| ID | 名前 | 説明 |
|----|------|------|
| 0 | Up | 上昇パターン |
| 1 | Down | 下降パターン |
| 2 | UpDown | 上昇→下降パターン |
| 3 | Random | ランダム音順 |
| 4 | Pinwheel | 回転パターン |
| 5 | PedalRoot | ルートペダルトーン＋上声部移動 |
| 6 | Alberti | クラシカルなアルベルティバスパターン |
| 7 | BrokenChord | 分散和音パターン |

`SongConfig`では、`arpeggioPattern: 255` と `arpeggioSpeed: 255` がムードから自動選択します。`arpeggioGate: -1` はスタイル既定値を使い、具体的な値を指定すると上書きします。

## ボーカルアティチュード

3つのメロディ表現レベル：

| アティチュード | 特徴 | 最適な用途 |
|----------------|------|-----------|
| Clean | コードトーンのみ、オンビート | ポップ、バラード |
| Expressive | テンション、タイミング変動 | エモーショナル、ダイナミック |
| Raw | 非コードトーン、境界破壊 | エッジー、モダン |

## メロディテンプレート

`melodyTemplate` は Auto と7つの具体テンプレートの計8値を取り、**テンプレート駆動**アプローチでコアメロディ動作を定義します：

| ID | 名前 | Plateau | 最大ステップ | 用途 |
|----|------|---------|----------|----------|
| 0 | Auto | - | - | VocalStyle基準で選択 |
| 1 | PlateauTalk | 0.70 | 2 | 語りに近い、音域の狭いポップ |
| 2 | RunUpTarget | 0.20 | 3 | アニメ系ハイエナジー、ドラマチックポップ |
| 3 | DownResolve | 0.40 | 2 | Bセクション、プリコーラス |
| 4 | HookRepeat | 0.55 | 2 | ショートフォーム、K-POPフック |
| 5 | SparseAnchor | 0.30 | 4 | 音数を絞った、持続音中心のバラード的フレージング |
| 6 | CallResponse | 0.35 | 3 | デュエットパターン |
| 7 | JumpAccent | 0.25 | 5 | 感情的ピーク |

- **Plateau ratio**: 同じピッチに留まる確率（0.0-1.0）
- **Max step**: 半音単位の最大メロディ音程

## ボーカルスタイルプリセット

14のボーカルスタイルプリセットがあります。スタイルが曲全体で1つのメロディテンプレートを決めるのではなく、テンプレートはセクションごとに解決されます（スタイル×セクションの上書き表を先に見て、なければセクション既定値）。

| ID | 名前 | Aメロ | サビ | 特徴 |
|----|------|-------|------|------|
| 0 | Auto | PlateauTalk | HookRepeat | セクション既定値 |
| 1 | Standard | PlateauTalk | HookRepeat | バランスの取れたポップボーカル |
| 2 | Vocaloid | RunUpTarget | RunUpTarget | 高速、広い跳躍 |
| 3 | UltraVocaloid | RunUpTarget | RunUpTarget | 超高速（32分音符） |
| 4 | Idol | CallResponse | HookRepeat | キャッチーなフック、グループコール |
| 5 | Ballad | SparseAnchor | SparseAnchor | スロー、持続音 |
| 6 | Rock | PlateauTalk | JumpAccent | パワフル、音域シフト |
| 7 | CityPop | PlateauTalk | HookRepeat | ジャジー、グルービー |
| 8 | Anime | PlateauTalk | HookRepeat | ダイナミックなフック |
| 9 | BrightKira | CallResponse | HookRepeat | 高音域 |
| 10 | CoolSynth | PlateauTalk | HookRepeat | エレクトロニック、精緻 |
| 11 | CuteAffected | CallResponse | HookRepeat | プレイフル、キュート |
| 12 | PowerfulShout | PlateauTalk | JumpAccent | 激しい、シャウト系 |
| 13 | KPop | PlateauTalk | HookRepeat | シンコペーション重視、フック駆動 |

Rock・PowerfulShout・アイドル系3スタイルは、ブリッジで CallResponse も使用します。

### ボーカルスタイルカテゴリ

<DocFigure name="presets-vocal-style-bands" />

## メロディック複雑さ

メロディ生成に影響する3つの複雑さレベル：

| レベル | 効果 | 用途 |
|--------|------|------|
| Simple (0) | 密度低下、跳躍小、フック多め | キャッチー、覚えやすい |
| Standard (1) | デフォルト動作 | 一般用途 |
| Complex (2) | 密度増加、跳躍大、バリエーション多 | 洗練された |

## フック強度

5つのフック反復レベル：

| レベル | 効果 | 用途 |
|--------|------|------|
| Off (0) | フック反復なし | プログレッシブ、多様性重視 |
| Light (1) | 控えめなフック | 繊細なコールバック |
| Normal (2) | 標準的な反復 | バランス重視ポップ（デフォルト） |
| Strong (3) | 強いフック強調 | キャッチー、商業的 |
| Maximum (4) | 最大限の反復、単純なパターンのみ | BehavioralLoop。`blueprintId=9` で自動設定 |

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

::: warning シンコペーション依存
VocalGrooveのシンコペーション効果（OffBeat、Swing、Syncopated、Driving16th、Bouncy8th）は`enableSyncopation=true`の場合のみ有効です。`enableSyncopation=false`の場合、シンコペーションウェイトは0.0に強制され、`syncopation_prob`は0.0に設定され、`allow_bar_crossing`は`false`に設定されます。タイミングオフセット（例：OffBeatの+60ティック）は`enableSyncopation`設定に関係なく適用されます。
:::

## エネルギーカーブ

楽曲全体のエネルギー推移を制御する4つのオプション：

| 値 | 名前 | 説明 |
|----|------|------|
| 0 | GradualBuild | 徐々にエネルギーが上昇（デフォルト） |
| 1 | FrontLoaded | 最初からハイエナジー、後半は落ち着く |
| 2 | WavePattern | 波のようなエネルギー推移 |
| 3 | SteadyState | 一定のエネルギーレベルを維持 |

## モーラリズムモード

音節タイミングの3つのリズムモード：

| 値 | 名前 | 説明 |
|----|------|------|
| 0 | Standard | 英語のストレスタイムドリズム |
| 1 | MoraTimed | 日本語のモーラ拍（等間隔音節グループ） |
| 2 | Auto | VocalStylePresetから自動選択（デフォルト） |

`syllabicSubRate` は `moraRhythmMode` に加えて指定する音節分割設定です。`0` はスタイル既定値を使い、分割を無効にはしません。`1`〜`100` はスタイル比率をパーセントで上書きします。

## メロディオーバーライド

VocalStylePresetとMelodicComplexityのデフォルトを上書きする細かいメロディパラメータ。センチネル値（0、0xFF、-128）はプリセットのデフォルトを維持します。

| パラメータ | 範囲 | デフォルト | 説明 |
|-----------|------|-----------|------|
| `melodyMaxLeap` | 0=preset, 1-12 | 0 | 最大メロディ跳躍（半音単位） |
| `melodySyncopationProb` | 0-100, 0xFF=preset | 0xFF | シンコペーション確率（%） |
| `melodyPhraseLength` | 0=preset, 1-8 | 0 | フレーズ長（小節単位） |
| `melodyLongNoteRatio` | 0-100, 0xFF=preset | 0xFF | 長音符比率（%） |
| `melodyChorusRegisterShift` | -12 to +12, -128=preset | -128 | サビの音域シフト（半音単位） |
| `melodyHookRepetition` | 0=preset, 1=off, 2=on | 0 | フック反復（トライステート） |
| `melodyUseLeadingTone` | 0=preset, 1=off, 2=on | 0 | セクション境界でのリーディングトーン挿入（トライステート） |

::: tip パラメータ適用順序
メロディオーバーライドはStylePreset、VocalStylePreset、MelodicComplexityの後に適用されます。ユーザー指定の値は常に最高優先度を持ちます。
:::

## モチーフオーバーライド

スタイルのデフォルトを上書きする細かいモチーフパラメータ：

| パラメータ | 範囲 | デフォルト | 説明 |
|-----------|------|-----------|------|
| `motifLength` | 0=auto, 1/2/4 | 0 | モチーフ長（小節単位） |
| `motifNoteCount` | 0=auto, 3-8 | 0 | モチーフ内の音数 |
| `motifMotion` | 0xFF=preset, 0-5 | 0xFF | モーションタイプ（0=Stepwise, 1=GentleLeap, 2=WideLeap, 3=NarrowStep, 4=Disjunct, 5=Ostinato） |
| `motifRegisterHigh` | 0=auto, 1=low, 2=high | 0 | レジスター範囲 |
| `motifRhythmDensity` | 0xFF=preset, 0-2 | 0xFF | リズム密度（0=Sparse, 1=Medium, 2=Driving） |

## ドライブ感

パフォーマンスの強度を制御する0-100の連続値：

- **0** = レイドバック（リラックスしたタイミング、低ベロシティ）
- **50** = ニュートラル（デフォルト）
- **100** = アグレッシブ（前のめりタイミング、高ベロシティ、`enableSyncopation=true`でシンコペーション強化）

## キーオプション

12のキー（0-11）：

| ID | キー | 備考 |
|----|------|------|
| 0 | C | ナチュラル、#♭なし |
| 1 | C# / Db | 7# / 5♭ |
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

有効テンポ範囲: **40-240 BPM**

::: info BPM設定について
- `0` に設定するとスタイルプリセットのデフォルトBPMを使用
- 各スタイルプリセットには最適なデフォルトBPM設定あり
- 40-240の範囲外のBPMはバリデーションエラーになります
:::

## 設定例

### シンプルなポップソング

```javascript
import { createDefaultConfig } from '@libraz/midi-sketch'

// MinimalGroovePopプリセットを使用
const config = createDefaultConfig(0)
config.key = 0                  // Cメジャー
config.chordProgressionId = 0   // FourChordPop (I-V-vi-IV)
config.formId = 0               // StandardPop
config.bpm = 0                  // デフォルト使用 (122)
config.drumsEnabled = true
```

### エモーショナルバラード

```javascript
// Emotional Balladプリセットを使用
const config = createDefaultConfig(16) // Emotional Ballad
config.key = 7                         // Gメジャー
config.chordProgressionId = 4          // Classic (I-IV-V-I)
config.formId = 8                      // Ballad構造
config.bpm = 0                         // デフォルト使用 (72)
config.drumsEnabled = true
```

::: warning バラードのテンポ
バラードプリセットは通常スローテンポ（72-95 BPM）がデフォルトです。より速いバラードが必要な場合は、`config.bpm` を明示的に設定してください。
:::

### アニメOP風スタイル

```javascript
// Anime Openingプリセットを使用
const config = createDefaultConfig(14) // Anime Opening
config.key = 2                         // Dメジャー
config.chordProgressionId = 2          // Axis (vi-IV-I-V)
config.bpm = 0                         // デフォルト使用 (142)
config.drumsEnabled = true
config.vocalStyle = 2                  // Vocaloidスタイル
config.melodicComplexity = 2           // 複雑なメロディ
config.hookIntensity = 3               // 強いフック
```

::: tip ボカロ風メロディ
ドラマチックポップ風の高密度メロディ（広い音程跳躍）を作るには：
- `vocalStyle: 2` (Vocaloid) または `vocalStyle: 3` (UltraVocaloid)
- `melodicComplexity: 2` (Complex)
- `melodyTemplate: 2` (RunUpTarget)
:::

### チルバックグラウンド

```javascript
// Background Motifの既定値をBGMスタイルで使用
const config = createDefaultConfig(12)  // Background Motif既定値（MelodyLeadマッピング）
config.key = 5                          // Fメジャー
config.chordProgressionId = 5           // Pop3 (I-IV-vi-V)
config.formId = 4                       // ShortForm
config.bpm = 95
config.drumsEnabled = false             // アンビエント用ドラムなし
config.compositionStyle = 1             // BackgroundMotif
config.compositionStyleExplicit = true
```

::: info Background Motifスタイル
Background Motifプリセット（ID 12）は`MelodyLead`を使用し、モチーフ向けの既定値と控えめなボーカル設定を提供します。ボーカルなしのBGMには `compositionStyle=1` と `compositionStyleExplicit=true` を設定してください。このスタイルではVocalが無効になり、Auxは有効のままです。
:::

### アイドルポップ（コール付き）

```javascript
// Idol Standardプリセットを使用
const config = createDefaultConfig(3)  // Idol Standard
config.key = 0                         // Cメジャー
config.callSetting = 1                 // コールトラック有効化 (0=Auto, 1=Enabled, 2=Disabled)
config.introChant = 1                  // ガチ恋イントロ
config.mixPattern = 1                  // スタンダードミックス
config.callDensity = 2                 // 標準密度
config.modulationTiming = 1            // ラスサビで転調
config.modulationSemitones = 2         // 2半音上げ
```

### シンコペーション＆グルーヴ

```javascript
const config = createDefaultConfig(0)
config.enableSyncopation = true        // シンコペーション有効化
config.vocalGroove = 3                 // シンコペーションリズム
```

### エネルギーカーブ

```javascript
const config = createDefaultConfig(0)
config.energyCurve = 1                 // FrontLoadedエネルギー
```

### メロディ詳細制御

```javascript
const config = createDefaultConfig(0)
config.melodyMaxLeap = 5              // 最大メロディ跳躍（半音単位）
config.melodyPhraseLength = 4         // フレーズ長（小節単位）
config.melodyHookRepetition = 2       // フック反復ON（トライステート: 0=preset, 1=off, 2=on）
```

### モチーフ詳細制御

```javascript
const config = createDefaultConfig(12) // Background Motif既定値（MelodyLeadマッピング）
config.motifLength = 4                 // モチーフ長（小節単位）
config.motifNoteCount = 5             // モチーフ内音数
config.motifMotion = 1                // モチーフの動きタイプ
config.motifRhythmDensity = 2         // リズム密度レベル
config.compositionStyle = 1            // BackgroundMotif
config.compositionStyleExplicit = true
```

### ギタートラック

```javascript
const config = createDefaultConfig(0)
config.guitarEnabled = true            // ギタートラック有効化
```

### R&B / ネオソウル

```javascript
const config = createDefaultConfig(0)
config.mood = 20                      // RnBNeoSoulムード
config.moodExplicit = true            // スタイル既定ではなく明示ムードを使用
config.chordExt7th = true             // 7thエクステンション有効化
config.chordExt9th = true             // 9thエクステンション有効化
```

### Lo-fi BGM

```javascript
const config = createDefaultConfig(12) // Background Motif既定値（MelodyLeadマッピング）
config.mood = 23                      // Lofiムード
config.moodExplicit = true            // スタイル既定ではなく明示ムードを使用
config.compositionStyle = 1           // BackgroundMotif
config.compositionStyleExplicit = true
```

### モーラタイミング

```javascript
const config = createDefaultConfig(0)
config.moraRhythmMode = 1             // MoraTimed（日本語モーラ拍）
```

### BehavioralLoop

```javascript
const config = createDefaultConfig(0)
config.blueprintId = 9                // BehavioralLoop（中毒ループ）
```
