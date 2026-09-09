# 生成パイプライン

[MIDI Sketch](https://github.com/libraz/midi-sketch)のステップバイステップの音楽生成プロセスを解説します。

::: tip 音楽理論が初めての方へ
このパイプラインは、Aメロ・Bメロ・サビといったセクションを楽曲フォームへ組み立てます。その語彙が馴染みなければ、コースの[楽曲構成](/ja/docs/course/song-structure)の章が再生できる譜例付きで先に解説します。
:::

## パイプライン概要

MIDI Sketchはコンポジションスタイルとユースケースに応じて複数の生成ワークフローをサポートしています。

### ボーカル先行ワークフロー

反復的なボーカル調整用：

::: tip ボーカル先行を使うタイミング
メロディの品質が重要な場合にこのワークフローを使用します。`regenerateVocal()`で満足するまで何度でもボーカルを反復し、その後に伴奏を確定できます。
:::

<DocFigure name="pipeline-vocal-first-workflow" />

伴奏を確定する段階では、ボーカル以外の全トラック — Aux・Bass・Chord・Drums・Arpeggio・Motif・SE・Guitar — をいったん消去し、ボーカルを固定したままパラダイム順で作り直します。ただし RhythmSync パラダイムでは Motif は消去せずに保持します。ボーカルはその Motif を座標軸として書かれているためです。その後、新しい伴奏との衝突を解消するボーカルのリファインパスが最大 2 回走り、修正すべき点がなくなった時点で打ち切られます。

### BGM専用モード

`BackgroundMotif`と`SynthDriven`コンポジションスタイルでは、ボーカル生成を常にスキップします。`BackgroundMotif`では、Traditional / MelodyDrivenパラダイムならボーカルを参照せずにAuxをMotifより先に動かします。RhythmSyncではVocalがなくてもMotifがAuxより先です。`SynthDriven`はAuxもスキップします：

<DocFigure name="pipeline-bgm-only" />

## CompositionStyleによる分岐

| スタイル | 主要トラック | ボーカル | Aux | 生成順序 |
|----------|--------------|----------|-----|----------|
| **MelodyLead** | ボーカル | あり | あり | Vocal → Aux → Motif（条件付き）→ Bass → Chord → Guitar → Arpeggio → Drums → SE |
| **BackgroundMotif** | モチーフ | なし | あり | Aux → Motif* → Bass → Chord → Guitar → Arpeggio → Drums → SE |
| **SynthDriven** | アルペジオ | なし | なし | Motif → Bass → Chord → Guitar → Arpeggio（`arpeggioEnabled` が必要）→ Drums → SE |

\* `BackgroundMotif`はTraditional/MelodyDrivenではAux → Motif、RhythmSyncではMotif → Auxです。

::: info 生成パラダイム
生成順序を決めるのは Blueprint のパラダイムだけです。コンポジションスタイルは、その順序からどのトラックが脱落するかだけを決めます。

- **Traditional / MelodyDriven**: Vocal → Aux → Motif → Bass → Chord → Guitar → Arpeggio → Drums → SE
- **RhythmSync**: Motif → Vocal → Aux → Bass → Chord → Guitar → Arpeggio → Drums → SE

つまり上の表は、Traditional / MelodyDrivenの並びからスキップされるトラックを取り除いたものです。BackgroundMotifはこれらのパラダイムではVocalが抜けるためAuxが先頭になり、RhythmSyncではMotifがAuxより先に残ります。SynthDrivenはVocalとAuxの両方が抜けます。MotifはBackgroundMotifとSynthDrivenでは必ず生成され、スキップされうるのはMelodyLeadだけです。Arpeggioが自動的に有効になることはなく、コンポジションスタイルを問わず`arpeggioEnabled=true`のときだけ現れます。
:::

## フェーズ1: 構造構築

生成器は、目標再生時間、明示的なフォーム、Blueprintのセクションフロー、または`StructurePattern`から楽曲構造を選びます。その後、コールセクションの挿入、Blueprintのスロット属性の適用、Behavioral Loopの終了パターン、**エナジーカーブ**（GradualBuild、FrontLoaded、WavePattern、SteadyState）の適用を行い、楽曲全体のダイナミクスアークを整えます。

### 構造パターン

| パターン | 小節数 | セクション |
|----------|--------|------------|
| StandardPop | 24 | A(8)-B(8)-Chorus(8) |
| BuildUp | 28 | Intro(4)-A(8)-B(8)-Chorus(8) |
| DirectChorus | 16 | A(8)-Chorus(8) |
| RepeatChorus | 32 | A(8)-B(8)-Chorus(8)-Chorus(8) |
| FullPop | 56 | Intro-A-B-Chorus-A-B-Chorus-Outro |
| FullWithBridge | 48 | Intro-A-B-Chorus-Bridge-Chorus-Outro |
| Ballad | 60 | Intro(8)-A-B-Chorus-Interlude-B-Chorus-Outro |
| ExtendedFull | 88 | 拡張セクション付きフル形式 |

### セクションタイプ

各セクションは生成に影響するプロパティを持つ：

```cpp
struct Section {
    SectionType type;         // Intro, A, B, Chorus, Bridge, Interlude, Outro, Chant, MixBreak, Drop
    uint8_t bars;             // 小節数
    VocalDensity vocal_density;    // Full, Sparse, None
    BackingDensity backing_density; // Normal, Thin, Thick
};
```

## フェーズ2: トラック生成

### ボーカルトラック（MelodyLeadのみ）

フレーズキャッシュとテンプレート駆動設計を持つ最も複雑な生成器。**メロディオーバーライド**が指定されている場合、最大跳躍幅、シンコペーション確率、フレーズ長、長音符比率、サビの音域シフト、フック繰り返し、リーディングトーンの振る舞いなどのパラメータがテンプレートのデフォルトより優先されます：

<DocFigure name="pipeline-vocal-phrase-cache" />

**メロディテンプレート:**

| テンプレート | 特徴 |
|--------------|------|
| Auto | スタイルとセクションに基づいて自動選択 |
| PlateauTalk | トーク的で音域の狭いポップ |
| RunUpTarget | アニメ系ハイエナジー／ドラマチックポップ：ターゲットノートへ駆け上がる |
| DownResolve | Bメロ・プリコーラス：下降解決 |
| HookRepeat | ショート尺・K-POP：短い繰り返しフック |
| SparseAnchor | まばらで音を伸ばすバラード的なフレージング |
| CallResponse | デュエット：コール＆レスポンス |
| JumpAccent | 感情のピーク：ジャンプアクセント |

::: info 自動テンプレート選択
`melodyTemplate=Auto` の場合、テンプレートはスタイル × セクションのオーバーライド表を引き、該当がなければセクション既定へフォールバックする形でセクションごとに解決されます。例えば Anime スタイルにはサビのオーバーライドがないため、セクション既定の HookRepeat が必ず使われます。サビで JumpAccent になるのは Rock と PowerfulShout です。
:::

**ボーカルアティチュード:**

| アティチュード | 特徴 |
|----------------|------|
| Clean | コードトーンのみ、オンビートリズム |
| Expressive | 遅延解決のテンション、微妙なタイミング変動 |
| Raw | 非コードトーン、フレーズ境界の破壊 |

アティチュードは完成したメロディに後からかけるパスではありません。各音のピッチを選ぶ時点で読まれ、そもそも候補になるピッチクラスを決めます。Clean はコードトーンのみに絞り、Expressive はそれを支えられる長さの音に 7th・9th・11th を加え、Raw はスケール全体を開放します。8 分音符より短い音はいずれの場合も Clean として扱われます。後段で適用されるのは表現の深さ — しゃくり、フォール、ビブラート、ポルタメントの量 — だけです。

::: warning アティチュード制限
全てのアティチュードが全てのスタイルプリセットで使用できるわけではありません。`midisketch_style_preset_allowed_attitudes()`で許可されているアティチュードを確認してください。サポートされていないアティチュードを指定するとバリデーションエラーになります。
:::

### Auxトラック

副旋律のサポートを生成します。ボーカルがある場合はボーカルに適応します。`BackgroundMotif`ではTraditional/MelodyDrivenならボーカルを参照せずにAuxをMotifより先に動かし、RhythmSyncならMotifをAuxより先に保ちます。`SynthDriven`ではAuxをスキップします：

<DocFigure name="pipeline-aux-selection" />

**Aux機能:**

| 機能 | 目的 |
|------|------|
| PulseLoop | 中毒性のある反復パターン |
| TargetHint | メロディの目標地点を示唆 |
| GrooveAccent | フィジカルグルーブアクセント |
| PhraseTail | フレーズ終端フィル |
| EmotionalPad | エモーショナルパッド/フロア |
| Unison | ボーカルユニゾンダブリング |
| MelodicHook | メロディックフックリフ |
| MotifCounter | カウンターメロディ（反進行） |
| SustainPad | 全音符コードトーンパッド |

どのセクションでどの機能が動くかは、生成時にメロディから選ばれるのではなく、Blueprint の aux profile があらかじめ指定します — イントロは `intro_function`、A・B・ブリッジは `verse_function`、サビは `chorus_function` です。これを上書きするケースが 3 つあります。イントロはキャッシュされたサビモチーフのエコーを置き、aux 機能自体を走らせない場合があります。サビでは UltraVocaloid かつボーカル密度が Full のとき GrooveAccent が強制されます。そしてサビの Unison は、ボーカルのリズムが安定せずきれいに重ねられない場合に MelodicHook へ格下げされます。

音域と密度はボーカルのテシトゥーラを基準にセクションごとに決まり、詰まるのはサビのほうです：

| セクション | ボーカル中心からのオフセット | 密度 |
|-----------|--------------------------|------|
| Intro | 0（幅 6 半音） | 1.0 倍 |
| A / B / Bridge | -12（1 オクターブ下） | 0.8 倍 |
| Chorus（パッド系機能） | -12 | 0.8 倍 |
| Chorus（リズム系機能） | -6 | 0.95 倍 |

つまり A・B・ブリッジではボーカルの 1 オクターブ下に構えて音数を減らし、リズム系のサビ Aux はボーカル中心から 3 全音（6 半音）以内まで上がって密度も上げます。音域はこの中心から絶対半音幅で取られ、Aux レンジの G3-C6 にクランプされたうえ、profile の `range_ceiling` によってボーカル最高音との関係でさらに抑えられます。ベロシティ比率が掛かる基準値は固定の 80 です。ただし Unison とハーモニーラインだけは、ボーカル音自身のベロシティに掛かります。

### ベース生成

ベースは和声の基礎を提供し、ボーカルがある場合は適応：

<DocFigure name="pipeline-bass-decisions" />

**ベースパターン:**

ベースシステムは 17 種類のパターンタイプ（BassPattern）をサポートしています。使用するパターンはムードとセクションに基づいて自動選択されるか、Blueprint の SectionSlot 設定で `bass_style_hint`（0=自動、1-17 は BassPattern+1 にマッピング）を指定してセクションごとに影響を与えることができます。セクションタイプが決めるのはパターンとベロシティであり、ベースをオクターブ単位で移調することはありません。音域が動くのは、ルートをベースレンジ内に収めるときだけです。

ピーク処理はパターン選択の後に行われます。`PeakLevel::Medium`では選ばれたパターンを密度1段階分、`PeakLevel::Max`では2段階分だけ引き上げます。`bass_style_hint`でベースパターンを明示しても同じ処理が適用され、ヒントはピークによる高密度化を無効にしません。

代表的なパターン：
- **WholeNote**: 持続するルート、2分音符主体（バラード、イントロ）
- **RootFifth**: ルートと5度の交替、定番のポップベースライン
- **Syncopated**: オフビートアクセントでBメロを持ち上げる
- **Driving**: 8分音符のパルス＋次の小節へのアプローチノート（サビ）
- **Walking**: 4分音符のスケールウォーク（ジャズ、シティポップ）
- **Tresillo / SubBass808 / SlapPop**: ジャンル固有（ラテン、トラップ、ファンク）

### コード生成

コードボイシングはベースとボーカルと協調：

```cpp
// ベースが1拍目・3拍目に鳴らすピッチクラスがマスクになり、ボイシング生成器は
// その重複と衝突を避けます（src/track/chord/bass_coordination.h）。
uint16_t bassMask = buildBassPitchMask(song_.bass(), barStart, barEnd);
VoicingType type = selectVoicingType(section, mood, bassHasRoot, rng);
VoicedChord v = selectVoicing(root, chord, prevVoicing, hasPrev, type, bassMask, rng);
```

**ボイスリーディングアルゴリズム:**

1. セクションのボイシングタイプ（クローズ、オープン/Drop2、Drop3、スプレッド、ルートレス）から候補を生成
2. 直前のボイシングからの動きをスコアリング（バスとソプラノは内声の 2 倍の重み）
3. 共通音の保持を加点
4. 平行5度・平行8度にムード依存のペナルティを減点（洗練系のムードは厳格に、エネルギッシュ系は寛容に）

::: info ルートレスボイシング
ルートレスボイシングはベースへの自動応答ではなく、時折の色付けです。3つの条件が同時に必要です — ベースがルートを担当していること、洗練系のムード（CityPop / Nostalgic / Dramatic / ModernPop）であること、そして確率判定（Bセクション20%、サビ30%、ブリッジ25%）を通ること。A・Intro・Interlude・Outro は常にクローズボイシングです。ベースが常に影響するのは重複回避のほうで、コードトラックはベースが1拍目・3拍目に鳴らすピッチクラスを避けます。
:::

### ギタートラック

専用のMIDIチャンネルに伴奏ギターパターンを生成します。`guitarEnabled`で制御（JS・C++ ともデフォルトは `true`）。ギタートラックは Blueprint の `guitar_below_vocal` 制約（マスキングを避けるためギターボイシングをボーカル音域より下に保つ）と、セクションごとの `guitar_style_hint` に影響を受けます。コード生成の後に行われ、既存の和声ボイシングを補完します。

セクションごとのギタースタイルは、BlueprintのSectionSlot設定で`guitar_style_hint`（0-7）を指定して影響を与えることができます。0はムードとエネルギーに基づいて自動選択されます。

一部のムードは意図的にギターを持ちません（EnergeticDance・Sentimental・Chill・DarkPop・Dramatic・ModernPop・ElectroPop・Synthwave・FutureBass・Trap）。これらのムードでは `guitarEnabled: true` でもギタートラックは生成されません。

### ドラム生成

ドラムパターンはムードに基づいて選択：

| スタイル | 特徴 | 使用ムード |
|----------|------|-----------|
| Sparse | ハーフタイム、ミニマル | EmotionalPop, Chill, Ballad, Lofi |
| Standard | 8分ハイハット、2&4スネア | StraightPop, Sentimental, Nostalgic, CityPop, RnBNeoSoul |
| FourOnFloor | 4つ打ちキック | EnergeticDance, DarkPop, ElectroPop |
| Upbeat | シンコペーション、推進力 | BrightUpbeat, MidPop, ModernPop, IdolPop, Anthem |
| Rock | ライドシンバル、クラッシュアクセント | LightRock, Dramatic |
| Synth | タイトな16分ハイハット | AnimeHighEnergy, Synthwave, FutureBass |
| Trap | 3拍目のハーフタイムスネア、ハイハットロール | Trap |
| Latin | デンボウのキック＆スネア | LatinPop |

Blueprintにはユークリッド分岐を選ぶ際にドラム生成器がサンプリングする`euclidean_drums_percent`フィールドがあります。ただしBlueprintのフィールド計上では現在 **UnprovenLiveness** に分類されており、可聴な効果は保証されません。確実な調整用コントロールではなく予約フィールドとして扱ってください。一方、セクションごとの`drum_role`（Full、Ambient、Minimal、FXOnly）はアレンジメント全体のドラム挙動を実際に変えます。

**フィル生成:**

- タムの下降/上昇パターン
- スネアロール
- セクション遷移でのコンビネーションフィル

`Dramatic`または`DrumHit`のサビドロップでは、最後のドロップ区間でキットも短縮されます。その短縮でエントリークラッシュが失われた場合、後処理が次のセクション境界にクラッシュを復元するため、サビの到着マーカーが残ります。

### モチーフトラック

BackgroundMotifでは主旋律要素になりますが、SynthDriven、RhythmSyncパラダイム、Blueprintのsection flowが要求する場合にも生成されます。`BackgroundMotif`でVocalが背景レイヤーになることはなく、Vocal自体がスキップされます。**モチーフオーバーライド**が指定されている場合、モチーフ長（0=自動、1/2/4**小節**）、音数（0=自動、3-8）、モーション（APIでは0-5、Ostinatoを含む）、レジスター（0=自動、1=低、2=高）、リズム密度（0=Sparse、1=Medium、2=Driving）などのパラメータがスタイルのデフォルトより優先されます：

```cpp
MotifParams params {
    .length = MotifLength::Bars2,              // Bars1・Bars2・Bars4
    .rhythm_density = MotifRhythmDensity::Medium,
    .motion = MotifMotion::Stepwise,           // 0=Stepwise .. 5=Ostinato
    .repeat_scope = MotifRepeatScope::FullSong // FullSong または Section
};
```

### アルペジオトラック

コンポジションスタイルを問わず `arpeggioEnabled=true` なら生成されます。SynthDriven ではこれが主役になります。

```cpp
ArpeggioParams params {
    .pattern = ArpeggioPattern::Auto,   // 255 = ムード既定のパターンを使用
    .speed = ArpeggioSpeed::Auto,       // 255 = スタイル既定の速度を使用
    .octave_range = 2,                  // 1-3
    .gate = -1.0f,                      // ノート長比率。-1 はスタイル既定
    .base_velocity = 90
};
```

### SEトラック

セクションマーカーとサウンドエフェクトキューを生成：
- セクション境界マーカー（テキストイベント）
- コールタイミングヒント（`callSetting` でコールがアクティブな時）
- イントロチャントマーカー

## フェーズ3: 仕上げ

### トランジション・ダイナミクス

エネルギー遷移を自動適用：

<DocFigure name="pipeline-transition-dynamics" />

トランジション・ダイナミクスが見ているのはセクションごとの整数のエネルギーレベルです — Intro 1、A 2、B 3、Chorus 4、Bridge 2、Interlude 1、Outro 2、Chant 1、MixBreak 4、Drop 4。隣り合うセクションのレベルが同じ場合は何も起きません。サビの次がまたサビであれば、そこは段上がりせずフラットなままです。特別扱いされるのは B からサビへの遷移だけで、セクション全体を一度抑えてからクレッシェンドします。それ以外の組み合わせでは最終小節だけにランプがかかります。

**セクションエネルギー倍率:**

トランジションのランプとは別に、各セクションは生成時点でノートのベロシティを次の倍率でスケールします：

| セクション | 倍率 |
|------------|------|
| Chant | 0.55 |
| Intro / A / Bridge / Interlude | 0.70 |
| Outro | 0.75 |
| B | 0.85 |
| Chorus / MixBreak / Drop | 1.10 |

### ヒューマナイズ

タイミングとベロシティに自然な揺らぎを追加：

```cpp
void applyHumanization(Song& song, float intensity) {
    // タイミング: ドラムとベースにマイクロオフセット
    // ベロシティ: ピッチトラックにランダム ±値（ドラムは対象外）
}
```

::: tip ヒューマナイズが実際に触れる対象
ベロシティのヒューマナイズはピッチトラック（vocal, chord, bass, motif, arpeggio, aux, guitar）に適用され、ドラムには適用されません。マイクロタイミングは逆で、グルーブの「ポケット」を作るために**ドラムとベース**に適用され、ボーカルは意図的にグリッド上に残されます。マイクロタイミングは `humanize` に連動しません — `driveFeel` が 50 以外ならそれだけで発生します。
:::

### トラック横断のボイス制限と最終修正

トラック生成後、`max_moving_voices`を持つセクションでは、隣り合う小節間で変化できるピッチトラック数を制限します。Coordinatorは優先度の低い変化中トラックから凍結します。優先度は高い順に **Vocal → Guitar → Motif → Aux → Chord → Arpeggio → Bass** で、DrumsとSEは上限の対象外です。凍結した小節は直前の小節をコピーして移動し、新しいコードと他トラックに対して再量子化します。コード境界ポリシーによって音が分割・短縮されることがあります。モチーフのフレーズ末尾のカットオフはこのコピー・量子化パスの中で適用され、ピッチ解決後にはギターのレーキ順が弦順と演奏可能な運指になるよう復元されます。

最終のテールゲートは、短い偶発的な重なりを処理します。不協和な重なりが4分音符以内で、残りが32分音符以上、またはすでに短い音の元の7/8以上を残す場合、後から始まる音の開始位置で先行音を短縮します。それより長い重なりや残りが短すぎる場合は通常の衝突ルールに従います。コードを考慮した共通の衝突ルールは[ハーモニー](/ja/docs/harmony)を参照してください。

RhythmSyncでは、ボーカルを書き換えた後に変更されたVocalとMotifを再登録し、伴奏およびMotifとVocalの不協和を再確認します。この修正がカバーするのは衝突であり、ベースの重複や全音域制約をすべて再検証する第2パスではありません。

## MIDI出力

最後に、Song を SMF Type 1 に変換：

<DocFigure name="pipeline-midi-output" />

**トラックマッピング:**

| トラック | チャンネル | プログラム |
|----------|------------|------------|
| Vocal | 0 | 0（ピアノ） |
| Chord | 1 | 4（エレピ） |
| Bass | 2 | 33（エレベ） |
| Motif | 3 | 81（シンセリード） |
| Arpeggio | 4 | 81（ソウリード） |
| Aux | 5 | 89（ウォームパッド） |
| Guitar | 6 | 27（クリーンギター） |
| Drums | 9 | GMドラム |
| SE | 15 | テキストイベント |

上記はトラックごとのフォールバック値です。実際の GM プログラムはムードごとに選択される（`getMoodPrograms`）ため、聴こえる楽器はムードプリセットによって変わります。

## キー移調

全ての生成はCメジャーで行われ、出力時に移調が適用：

```cpp
uint8_t MidiWriter::transposePitch(uint8_t pitch, Key key) {
    return pitch + static_cast<uint8_t>(key);
}
```

::: info 内部的にCメジャー
全てのメロディロジックはシンプルさのためにCメジャーで動作します。`key`パラメータ（0-11）が最終的な移調を決定します：0=C, 1=C#, 2=D など。これにより、コード進行分析やスケール度数ロジックがキー固有の処理を必要としません。
:::

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

::: tip MIDIからの再生成
MIDI Sketchで生成されたMIDIファイルは、全く同じ出力を再現するために使用できます。埋め込まれたメタデータには全てのパラメータが保存されているため、数週間や数ヶ月後でも簡単に楽曲の作業を再開できます。
:::
