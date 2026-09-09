# トラック生成

[MIDI Sketch](https://github.com/libraz/midi-sketch)の各トラック生成器を詳しく解説します。

::: tip 音楽理論が初めての方へ
下のトラックは、メロディ・コード・ベース・モチーフ・アルペジオといった音楽的役割に対応します。これらの用語が初めてなら、まず[コース](/ja/docs/course/primer)へ。各生成器の背景にある概念を、再生できる譜例で解説します。
:::

## トラック概要

MIDI Sketchは9つのトラックを異なるMIDIチャンネルに生成します：

<DocFigure name="tracks-channel-map" />

### チャンネル割り当て

| トラック | チャンネル | デフォルトプログラム | 役割 |
|----------|---------|-------------------|------|
| Vocal | 0 | Piano (0) | 主旋律 |
| Chord | 1 | E.Piano (4) | 和声バッキング |
| Bass | 2 | E.Bass (33) | ベース |
| Motif | 3 | Synth Lead (81) | BackgroundMotifスタイル |
| Arpeggio | 4 | Synth Lead (81) | SynthDrivenスタイル |
| Aux | 5 | Warm Pad (89) | 副旋律サポート |
| Guitar | 6 | E.Guitar clean (27) | 伴奏ギター |
| Drums | 9 | GMドラム | リズム |
| SE | 15 | - | セクションマーカー |

::: info プログラムはムード依存
上記のプログラムは組み込みのフォールバック値です（`src/midi/track_config.h`）。実際の GM プログラムはムードごとに選択される（`getMoodPrograms`）ため、聴こえる楽器はムードプリセットによって変わります。
:::

## ボーカルトラック

**ソース:** `src/track/generators/vocal.cpp`、`src/track/vocal/melody_designer.cpp`

ボーカルシステムは**テンプレート駆動型メロディデザイナー**と**スタイル認識評価**を使用し、予測可能でスタイルに正確なメロディを生成します。

::: tip なぜ「ボーカル」トラック？
ボーカルトラックはメインメロディを生成します。歌ったりリードパートとして演奏されることを想定しているため「ボーカル」と呼ばれています。DAWではMIDIチャンネル0（ピアノ）でプレビューするか、お好みの音源を割り当ててください。
:::

### アーキテクチャ

ボーカル生成は3つの主要コンポーネントで構成されています：

1. **MelodyDesigner**（`melody_designer.cpp`）- 評価付きテンプレート駆動のピッチ選択
2. **Vocal Generator**（`vocal.cpp`）- セクション構造、キャッシング、調整
3. **VocalStyleProfile** - スタイル別の統一されたバイアス・評価設定

<DocFigure name="tracks-vocal-architecture" />

### メロディテンプレート

7つのメロディテンプレートがメロディ特性を定義：

| ID | 名前 | Plateau | 最大ステップ | 用途 |
|----|------|---------|----------|----------|
| 0 | Auto | - | - | VocalStyle 基準で選択 |
| 1 | PlateauTalk | 0.70 | 2 | 語りに近い、音域の狭いポップ |
| 2 | RunUpTarget | 0.20 | 3 | アニメ系ハイエナジー、ドラマチックポップ |
| 3 | DownResolve | 0.40 | 2 | B セクション、プリコーラス |
| 4 | HookRepeat | 0.55 | 2 | ショート尺、K-POP フック |
| 5 | SparseAnchor | 0.30 | 4 | 音数の少ない、伸ばし主体のバラード |
| 6 | CallResponse | 0.35 | 3 | デュエットパターン |
| 7 | JumpAccent | 0.25 | 5 | 感情的ピーク |

- **Plateau ratio**: 同じピッチに留まる確率（高いほど繰り返しが多い）
- **Max step**: 半音単位の最大ステップ幅（小さいほど滑らか）

### 生成フロー

<DocFigure name="tracks-vocal-phrase-flow" />

::: info オクターブフォールド（音域セーフティ）
音域外に出たノートはオクターブ単位（±12半音）で音域内に折り返され、ピッチクラスが保持されます — コードトーンはコードトーンのままです。音域境界への半音クランプは最終手段としてのみ使われます。クランプは安全な音を不協和音に変えてしまうことがあるためです（例: G をオクターブ下げても G のままですが、F# 上限へクランプするとトライトーンが生じます）。
:::

### ピッチ選択（4択のみ）

MelodyDesignerはピッチ選択を4つのオプションに制限：

```cpp
enum class PitchChoice {
    Same,       // 現在のピッチに留まる（plateau_ratio）
    StepUp,     // スケール上を1音上へ（半音より全音を優先）
    StepDown,   // スケール上を1音下へ
    TargetStep  // テンプレートのターゲットピッチへ向かう（max_step で制限）
};
```

この制約されたアプローチにより、より自然で歌いやすいメロディが生成されます。

### ボーカルアティチュード

| アティチュード | 説明 | 実装 |
|----------------|------|------|
| **Clean** | 保守的、歌いやすい | コードトーンのみ、オンビート |
| **Expressive** | 感情的、ダイナミック | テンション許可、タイミング変動 |
| **Raw** | エッジー、型破り | 非コードトーン、境界破壊 |

### フレーズキャッシュ

音楽的な一貫性のため、複合キー（V2キャッシュ）でフレーズをキャッシュ：

```cpp
struct PhraseCacheKey {
    SectionType section_type;  // A、Chorus 等
    uint8_t bars;              // セクション長（小節数）
    int8_t chord_degree;       // 開始コード度数
};
```

キャッシュされたフレーズの最初の再利用は必ず完全一致で、まずフレーズを定着させてから変化させます。その後は、サビの出現回数が増えるほど完全一致の確率が下がります。1回目は 80%、2回目は 60%、3回目以降は 30% となり、最後のサビが最も新鮮になります。また、完全一致が2回続いた時点で、次は必ずバリエーションが入ります。

::: info フレーズバリエーション
完全一致にならなかった場合は、6種類のバリエーションのいずれかが適用されます。いずれもフレーズの旋律的な同一性を保つもので、移調・反転・切り貼りは行いません。

- **LastNoteShift**: 最後の音をスケール上で1〜2度動かす
- **LastNoteLong**: 最後の音を伸ばして終止感を強める
- **BreathRestInsert**: フレーズ終端の手前に短い休符を挿入
- **DynamicAccent**: 最後の音のベロシティを上げる
- **LateOnset**: フレーズの開始を16分音符分遅らせる
- **EchoRepeat**: 最後の音を短く弱くエコーさせる
:::

### 音域制約

```cpp
struct VocalRangeResult {
    uint8_t effective_low;
    uint8_t effective_high;
    float velocity_scale;
};
```

有効音域は歌い手の境界（`vocal_low` と `vocal_high`）から始まり、Blueprintの`max_pitch`上限を適用し、後段の上方向の転調に備えて転調量だけ上限を下げます。下限は維持されます。正の転調が指定された場合は、調整後の上限を上下限の間に最低1オクターブ残すようクランプします。転調なしでBlueprintの`max_pitch`上限だけが適用される場合は、1オクターブ未満になることがあります。コンポジションスタイルが変えるのは`velocity_scale`であり、VocalとMotifを前景・背景に分ける別音域を作るわけではありません。VocalがあるときにMotifの音域をVocalの中央値の周りへ狭める処理は、別の制約として残っています。

### 非和声音による装飾

ボーカルトラックは非和声音（NCT: Non-Chord Tone）を使用して、単純なコードトーンメロディに動きを加えます：

::: info 拍の強さ
エンジンは 4/4 の拍を4段階で扱います。**強拍**（1・3拍目）、**中拍**（2・4拍目）、**弱拍**（8分の裏）、**最弱拍**（16分）です。コードトーンと強調されたアポジャトゥーラは強拍に置かれ、経過音・刺繍音・先取音は 2・4拍目ではなく拍と拍の間の裏拍に置かれます。
:::

| NCTタイプ | 説明 | 配置 |
|----------|------|------|
| **ChordTone** | 現在のコードに含まれる音（基準） | 強拍 |
| **PassingTone** | 2つのコードトーン間を順次進行でつなぐ | 裏拍の細分位置 |
| **NeighborTone** | コードトーンから離れて戻る | 裏拍の細分位置 |
| **Appoggiatura** | 強調された不協和音が順次解決 | 強拍 |
| **Anticipation** | 次のコードトーンを先取り | コードチェンジ前の裏拍 |
| **Suspension** | 前のコードから保留された音が順次下行して解決 | 強拍（続く裏拍で解決） |
| **Tension** | コードの拡張音（9度、11度、13度） | スタイルに依存 |

設定はムードにより変化：
- **Bright**: より多くのコードトーン、少ない不協和音
- **Jazzy**: より多くのテンション、シンコペーション
- **Ballad**: 表現豊かなアポジャトゥーラとのバランス
- **J-POP**: ペンタトニックスケール（ヨナ抜き）音程を好む

### VocalStyleProfile

各ボーカルスタイルには**生成バイアス**と**評価重み**の両方を制御する統一プロファイルがあります。8つのプロファイルを14のボーカルスタイルが共有します（Idol/BrightKira/CuteAffected → Idol、Vocaloid/UltraVocaloid/CoolSynth → Vocaloid、Rock/PowerfulShout → Rock、Auto/Standard → Standard）。

| プロファイル | Plateauバイアス | 高音域 | 歌唱性 | サプライズ |
|--------------|-----------------|--------|--------|------------|
| **Standard** | 1.00 | 0.80 | 0.15 | 0.15 |
| **Idol** | 1.25 | 0.85 | 0.18 | 0.05 |
| **Rock** | 0.80 | 1.20 | 0.15 | 0.20 |
| **Ballad** | 1.00 | 0.50 | 0.30 | 0.05 |
| **Anime** | 1.30 | 1.30 | 0.10 | 0.15 |
| **Vocaloid** | 0.90 | 1.20 | 0.10 | 0.20 |
| **CityPop** | 0.90 | 0.90 | 0.15 | 0.15 |
| **KPop** | 1.40 | 1.10 | 0.12 | 0.18 |

### UltraVocaloidモード

ボカロスタイル生成の強化機能：
- **マシンガンリズム**: ボカロ曲に特徴的な連射的16分音符シーケンス
- **ブレスポイント**: 密度の高いパッセージでもフレージング用のマイクロポーズを自動挿入
- **セクション別リズムロック**: 各セクションが一貫したリズムアイデンティティを維持

::: details プロファイルパラメータ
- **Plateauバイアス**: 同じピッチに留まる好み（高いほど繰り返しが多い）
- **高音域**: 高い音への好み（高いほど明るい）
- **歌唱性**: 人間が歌いやすいメロディの重み（高いほど歌いやすい）
- **サプライズ**: 予想外のメロディ展開の重み（高いほどダイナミック）
:::

### メロディ評価システム

MelodyDesigner は候補メロディをまとめて生成し（サビ 100、B セクション 50、ブリッジとチャント 30、その他 20）、それぞれを採点します：

共有される採点の詳細は[メロディ評価](/ja/docs/melody-evaluation)にまとめ、このページではトラックとの接続と制約だけを扱います。

<DocFigure name="tracks-melody-evaluation" />

**総合スコア:**

| コンポーネント | 重み | 基準 |
|----------------|------|------|
| スタイルスコア | 40% | 下記の7つの重み付き項目 |
| 淘汰スコア | 40% | 減点方式：歌唱の難しさ、単調さ、不自然な間 |
| バイアススコア | 20% | スタイル好みに合った音程分布 |

これにグローバルモチーフのボーナスが加算されます。重みはセクション依存で、サビ 0.35、2回目以降の A セクション 0.25、B セクション 0.22、最初の A セクション 0.15、ブリッジは対比を優先して 0.05 です。

**スタイルスコア**自体が7つの項目からなり、その重みはボーカルスタイルプロファイルに由来し、合計 1.0 になります。以下は Standard プロファイルの値です：

| コンポーネント | Standard の重み | 基準 |
|----------------|----------------|------|
| 歌唱性 | 0.15 | 音程分布：順次進行主体、大跳躍は少なく |
| コードトーン比率 | 0.15 | 強拍に置かれるコードトーン |
| 輪郭 | 0.15 | アーチ／波形／下降といった認識しやすい形 |
| サプライズ | 0.15 | 4度以上の意図的な跳躍を1〜2回 |
| AAABパターン | 0.15 | 3+1 の反復構造 |
| リズムと音程の整合 | 0.15 | 跳躍前は長音、順次進行は短音 |
| キャッチーさ | 0.10 | 短いセルの反復、リズムの一貫性、フック輪郭 |

**淘汰スコア**は 1.0 から減点していきます。高音の連続、高音への跳躍、急な方向転換、強拍上の非和声音、孤立した音、フレーズのまとまりの弱さ、間の多さ、短音の連続によるブレス不足が対象です。

候補は総合スコア順に並べ替えられ、下位半分が捨てられたうえで、残りからスコアに比例した確率で1つが抽選されます。最高得点の候補はフォールバックにすぎないため、同程度に良いフレーズも選ばれ続けます。

### フックシステム

サビセクションでは、**17のリズムパターン**と**25のフックスケルトン**からなる専用のフック生成システムを使用します。代表的なものは以下の通りです。

**代表的なリズムパターン:**

| パターン | リズム | 特徴 |
|----------|--------|------|
| **Buildup** | 8-8-4 | クラシックな段階的解決 |
| **Syncopated** | 4-8-8 | シンコペーション開始 |
| **FourNote** | 8-8-8-4 | ハイエナジー |
| **Powerful** | 4-4 | シンプルで強力 |
| **Dotted** | 8-4-8 | 付点リズム |
| **CallResponse** | 4-8-8-8 | コール&レスポンス |

**代表的なフックスケルトン:**

| スケルトン | 説明 |
|------------|------|
| Repeat | 同じピッチを繰り返す |
| Ascending | 上昇する輪郭 |
| AscendDrop | 上昇してから下降 |
| LeapReturn | ジャンプして戻る |
| RhythmRepeat | ピッチは変わりリズムは一定 |

**フック強度**はフックの目立ち方を制御：
- **Off (0)**: フックの強調なし
- **Light (1)**: サビ冒頭のみ
- **Normal (2)**: サビ冒頭と中間
- **Strong (3)**: 全フックポイント
- **Maximum (4)**: 反復を最大化し、単純なパターンのみを使用

### グローバルモチーフシステム

ボーカルトラックはサビのフックから**グローバルモチーフ**を抽出し、以降のセクションの評価に軽いボーナスとして使います。選択にバイアスをかけるだけで、生成を拘束するものではありません。

```cpp
struct GlobalMotif {
    ContourType contour_type;        // Ascending, Descending, Peak, Valley, Plateau
    int8_t  interval_signature[8];   // 相対的ピッチ変化
    uint8_t interval_count;
    uint8_t rhythm_signature[8];     // 相対的デュレーション比率
    uint8_t rhythm_count;
};
```

各セクションは、そのセクションに合わせて変形したモチーフと候補を比較します。サビは原形、A セクションは縮小形、B セクションは反復進行形、ブリッジは反行形、アウトロは断片化した形です。ボーナスは上記のセクション重みでスケールされるため、サビではフックの同一性が最も強く保たれ、ブリッジは対比のために自由が残されます。

### ピアノロールセーフティAPI

**ソース:** `src/core/piano_roll_safety.cpp`

読み取り専用の[ピアノロールセーフティAPI](/ja/docs/api-cpp#piano-roll-safety-api)は、外部ツール（ピアノロールエディタなど）がピッチ配置の警告を表示するために使います。`checkBgmCollisionDetailed`は6つのBGMトラック（Chord、Bass、Arpeggio、Aux、Motif、Guitar）で鳴っているノートをピッチクラスの音程で調べます。音程クラス1または11は`Severe`、6は`Mild`、それ以外は`None`として報告します。この表示用ヘルパーにはコード、長さ、音域、生成器固有の例外はありません。生成時に使う別の`HarmonyContext`フィルターは[ハーモニー](/ja/docs/harmony#harmonycontext)を参照してください。

```cpp
enum class CollisionType : uint8_t {
    None,    // 表示警告なし
    Mild,    // ピッチクラス音程6: 表示警告
    Severe   // ピッチクラス音程1/11: 表示警告
};
```

**衝突検出:**

| ピッチクラス音程 | タイプ | 表示結果 |
|------|--------|--------|
| 1 または 11 | Severe | Severe表示警告 |
| 6 | Mild | Mild表示警告 |
| その他 | None | 表示警告なし |

::: warning 転調対応
生成されるボーカル音域は歌い手の境界から始まり、Blueprintの`max_pitch`で制限され、上方向の転調に備えて`effective_vocal_high`を下げます。読み取り専用の表示ヘルパーはこの音域計算とは別で、ピッチクラスの衝突を報告するだけであり、Motif用の前景・背景分離音域を作るものではありません。
:::

---

## Auxトラック

**ソース:** `src/track/generators/aux.cpp`

Aux（補助）トラックはメインボーカルがある場合に**副旋律サポート**を提供します。`BackgroundMotif`ではVocalを常にスキップします。Traditional/MelodyDrivenではボーカルを参照せずにAuxをMotifより先に生成し、RhythmSyncではMotifをAuxより先に保ちます。`SynthDriven`ではAuxをスキップします。対旋律そのものではなく、リードがある場合にアレンジを整えるレイヤーです。

### 目的

| 役割 | 説明 |
|------|------|
| 中毒性 | パルスループで繰り返しのキャッチーなパターンを生成 |
| 身体性 | グルーブアクセントで体が動く感覚を追加 |
| 安定感 | フレーズ終端で解決感を提供 |
| 構造認識 | セクション境界の認識を支援 |

### Aux機能

9つの補助機能が利用可能：

| ID | 機能 | 説明 |
|----|----------|------|
| 0 | PulseLoop | 同音または固定音程の繰り返しパターン |
| 1 | TargetHint | コードトーンで主旋律のターゲットを暗示 |
| 2 | GrooveAccent | スタッカートでリズミックなアクセント |
| 3 | PhraseTail | フレーズ終端の下降解決 |
| 4 | EmotionalPad | 長い持続音のコードトーン |
| 5 | Unison | ボーカルユニゾンダブリング |
| 6 | MelodicHook | メロディックフックリフ |
| 7 | MotifCounter | カウンターメロディ（反行） |
| 8 | SustainPad | 全音符コードトーンパッド |

### Aux 機能の選択

主要なセクションでは、Aux 機能はメロディテンプレートではなく Blueprint の aux profile から選ばれます：

| セクション | 参照元 |
|-----------|--------|
| Intro | キャッシュされたサビモチーフのエコー。モチーフがなければ `aux_profile.intro_function` |
| A / B / Bridge | `aux_profile.verse_function` |
| Chorus | `aux_profile.chorus_function` |

したがって Traditional ブループリントはイントロで MelodicHook、A/B で MotifCounter、サビで再び MelodicHook を使い、RhythmLock は曲全体で単一の PulseLoop セルを保ちます。残るセクションタイプ（インタールード・アウトロ・チャント・ミックスブレイク）は、メロディテンプレートが定義する最初の Aux 設定にフォールバックします：

| テンプレート | フォールバック機能 | 音域オフセット | 幅 | ベロシティ比 |
|-------------|------------------|--------------|-----|------------|
| PlateauTalk | PulseLoop | -12 | 5 | 0.6 |
| RunUpTarget | TargetHint | 0 | 7 | 0.5 |
| DownResolve | PhraseTail | 0 | 5 | 0.5 |
| HookRepeat | PulseLoop | -12 | 4 | 0.7 |
| SparseAnchor | EmotionalPad | -5 | 8 | 0.4 |
| CallResponse | MotifCounter | 0 | 6 | 0.7 |
| JumpAccent | PhraseTail | 0 | 5 | 0.5 |

### 生成制約

- Vocalがある場合はリードとの衝突を避けるためVocalの後に生成します。`BackgroundMotif`でTraditional/MelodyDrivenならVocalがないためAuxをMotifより先に生成し、RhythmSyncならMotifをAuxより先に保ちます。`SynthDriven`ではAuxを生成しません
- Vocalがある場合、音域はそのテッシトゥーラを中心に`range_offset`でずらした半音単位の絶対幅（4〜12半音）です。Vocalがない場合は設定またはデフォルトのテッシトゥーラを使います。どちらもG3 (55) - C6 (84) にクランプされます
- ベロシティ比 0.4-0.8 は、ボーカルのベロシティではなく固定のベース値 80 に掛かります。Blueprint の `velocity_scale` はこの比にさらに掛かります
- HarmonyContext でボーカルとの不協和音を回避

### サビでの挙動

サビセクションではAuxトラックの挙動が適応されます：

- **密度低下**: ボーカルを引き立てるためAuxは控えめに
- **低音域化**: ボーカルとの衝突を避けるため低い音域へ移動
- **パターン簡素化**: より持続的なノート、ビジーさの軽減
- **フレーズ終端**: 適切な解決を伴いフレーズ境界を尊重

---

## コードトラック

**ソース:** `src/track/generators/chord.cpp`

ボイスリーディング最適化を伴う和声ボイシングを生成。

### ボイシングタイプ

<DocFigure name="tracks-chord-voicings" />

ボイシングタイプは3種類です。**Close** はコードトーンを1オクターブ内に収めます。**Open** は Drop 2 ボイシングで、上から2番目の声部が1オクターブ下がるため、ルート-3度-5度-7度の積みは 5度-ルート-3度-7度になります。Drop 3 と Spread はその別バリアントで、セクションとムードに応じて選ばれます。**Rootless** はベースがすでに鳴らしているルートを省き、2声しか残らない場合は9度を補います。

### ボイスリーディングアルゴリズム

1. セクションのボイシングタイプから候補を生成（クローズ、オープン/Drop2、Drop3、スプレッド、ルートレス）
2. 直前のボイシングからの移動量で採点。最大5音を対象に、外声（バスとソプラノ）は2倍、内声は1倍で重み付け
3. 共通音の保持を加点
4. 平行5度・平行8度を減点。減点量はムード依存で、クラシック系・洗練系は厳しく、ポップ系・ダンス系は緩やか
5. 同一ボイシングが3回続く場合を減点

### ベースとの協調

コードトラックはベースの後に生成されるため、ベースが実際に何を弾いているかを読み取れます。これを使う仕組みは2つあります。

- `buildBassPitchMask` は小節の1拍目と3拍目でベースが保持しているピッチクラスを集めます。短2度またはトライトーンで衝突する候補ボイシングは除外されます。
- `BassAnalysis::analyzeBar` は1拍目にベースがルートを鳴らしているかを判定します。鳴らしている場合はルートレスボイシングが優先され、ルートの重複を避けます。

### 音域制約

```cpp
constexpr uint8_t CHORD_LOW = 48;   // C3
constexpr uint8_t CHORD_HIGH = 84;  // C6
```

---

## ギタートラック

**ソース:** `src/track/generators/guitar.cpp`

ギタートラックは専用のMIDIチャンネル（Ch 6）に伴奏ギターパターンを生成します。コードトラックを補完するリズミック＆ハーモニックサポートを提供します。

### パラメータ

| パラメータ | デフォルト | 説明 |
|-----------|----------|------|
| `guitarEnabled` | `true` | ギタートラック生成の有効/無効（JS・C++ ともデフォルト有効） |

### Blueprintの制約

ギター生成はBlueprintの制約に影響を受けます：

| 制約 | 説明 |
|------|------|
| `guitar_skill` | スキルレベル（Beginner/Intermediate/Advanced/Virtuoso）がパターンの複雑さやボイシングの洗練度に影響 |
| `guitar_below_vocal` | 有効にすると、メロディのマスキングを避けるためギターボイシングをボーカル音域の下（vocal_low - 2半音）に配置 |
| `guitar_style_hint` | BlueprintのSectionSlotで定義されるセクションごとのスタイルヒント（0-7）。0 = ムードとエネルギーに基づいて自動選択 |

### 生成

- ギターはコードトラックの**後**に生成され、既存の和声ボイシングを補完
- パターンはセクションエネルギーとムードに適応
- セクションごとの`guitar_style_hint`（0-7）でギター伴奏スタイルに影響を与えることが可能
- MIDIチャンネル6に出力。フォールバックのプログラムはElectric Guitar clean（27）で、ムードによって別のギタープログラムが割り当てられることがあります

---

## ベーストラック

**ソース:** `src/track/generators/bass.cpp`

ルート重視のパターンで和声的基盤を生成。

### パターンタイプ

`BassPattern` は17種類です。使用するパターンはムードとセクションに基づいて自動選択されるか、Blueprint の SectionSlot で `bass_style_hint`（0=自動、1-17 は BassPattern+1 にマッピング）を指定してセクションごとに固定できます。代表的なもの：

| パターン | 説明 | リズム |
|----------|------|--------|
| WholeNote | 持続するルートで安定感（バラード、イントロ） | 2分音符、次小節へのアプローチ付き |
| RootFifth | 古典的なポップのルート-5度交替 | 4分音符、3拍目に5度 |
| Syncopated | 裏拍アクセントでグルーブ（プリコーラス） | ルートと裏拍の5度 |
| Driving | エネルギッシュ、前進的（サビ） | 全体で8分音符 |
| Walking | 4分音符のスケールウォーク（ジャズ、シティポップ） | 4分音符4つ、半音アプローチ |

残りはジャンル特化のパターンです：RhythmicDrive、PowerDrive、Aggressive、SidechainPulse、Groove、OctaveJump、PedalTone、Tresillo、SubBass808、RnBNeoSoul、SlapPop、FastRun。

### 生成ロジック

<DocFigure name="tracks-bass-generation" />

セクションタイプが選ぶのはパターンだけで、オクターブは動かしません。ルートがオクターブ移動するのは、ベース音域 E1 (28) - G3 (55) に収めるために必要なときだけです。

ピーク処理はパターン選択の後に行われます。`PeakLevel::Medium`では選ばれたパターンを密度1段階分、`PeakLevel::Max`では2段階分だけ引き上げます。`bass_style_hint`で明示したパターンにも適用され、ヒントはベースパターンを指定するだけでピークによる高密度化を無効にしません。

### アプローチノート

4拍目の後半には、次の小節のルートへ向かうアプローチノートが置かれるのが基本です。常に半音アプローチではなく、コードの機能に応じて選ばれます。トニックとドミナントには次のルートの完全5度下、サブドミナントには全音下が優先され、導音・全音上・完全4度下がフォールバックになります。ターゲットのコードが実際に鳴らす音と衝突する候補は除外されます。これはセカンダリードミナントで重要で、その3度は上がり7度は下がるため、ダイアトニックの三和音とは異なるからです。

半音下からのクロマチックアプローチはウォーキングライン専用で、次のルートが全音または短3度離れている場合に限られます。

---

## ドラムトラック

**ソース:** `src/track/generators/drums.cpp`

フィルとダイナミクスを含むドラムパターンを生成。

### GMドラムマップ

```cpp
constexpr uint8_t KICK = 36;
constexpr uint8_t SNARE = 38;
constexpr uint8_t SIDE_STICK = 37;
constexpr uint8_t CLOSED_HH = 42;
constexpr uint8_t OPEN_HH = 46;
constexpr uint8_t RIDE = 51;
constexpr uint8_t CRASH = 49;
constexpr uint8_t TOM_HIGH = 50;
constexpr uint8_t TOM_MID = 47;
constexpr uint8_t TOM_LOW = 45;
```

### パターンスタイル

<DocFigure name="tracks-drum-style-selection" />

### フィルタイプ

`FillType` は13種類あります。よく使われるのは SnareRoll・TomDescend・TomAscend・SnareTomCombo で、残りはより疎な場面や慣用句的な場面をカバーします（SimpleCrash、LinearFill、GhostToAccent、BDSnareAlternate、HiHatChoke、TomShuffle、BreakdownFill、FlamsAndDrags、HalfTimeFill）。`selectFillType()` がセクションの組み合わせ・ドラムスタイル・次セクションのエネルギーから選択します。

フィルはフィル区間のすべての拍を埋める必要はありません。そのフィルタイプが特に置く音を持たない拍では、無音にせずセクション本来のパターンが維持されます。

フィルの挿入位置：

- セクション遷移
- 4または8小節ごと
- サビ前

`Dramatic`または`DrumHit`のサビドロップでは、最後のドロップ区間でキットも短縮されます。その短縮でエントリークラッシュが失われた場合、後処理が次のセクション境界にクラッシュを復元するため、サビの到着マーカーが残ります。

### ユークリッドドラム

Blueprintにはユークリッド分岐を選ぶ際にドラム生成器がサンプリングする`euclidean_drums_percent`フィールドがあります。ユークリッドリズムは指定されたステップ数に対してヒットをできるだけ均等に分配するパターンです。ただしBlueprintのフィールド計上では現在 **UnprovenLiveness** に分類されており、可聴な効果は保証されません。確実な調整用コントロールではなく予約フィールドとして扱ってください。

### ドラムの役割（Drum Role）

BlueprintのSectionSlotでセクションごとの`drum_role`を指定してドラム挙動を制御：

| ロール | 説明 |
|--------|------|
| Full | 標準フルドラムキット |
| Ambient | 控えめ、アトモスフェリック |
| Minimal | スパース、ミニマルパターン |
| FXOnly | エフェクトのみ、標準キットなし |

### ゴーストノート

グルーブのためのベロシティ軽減スネアアーティキュレーション：

```cpp
// ゴーストのベロシティはセクションベロシティに対する倍率（0.25-0.65）で、絶対値では
// ありません。実際には概ね 25-35 の帯に収まります。
```

密度はセクションとムードカテゴリによるテーブル参照で 0%・15%・30%・45% のいずれかが決まり、その後テンポとバッキング密度に応じて調整されます。
- **エネルギッシュなムード**（EnergeticDance・IdolPop・Anthem・AnimeHighEnergy）: サビで最大 45% の出現確率
- **穏やかなムード**（Ballad・Sentimental・Chill）: A メロではなし、他は控えめ

### スウィングタイミング

スウィングはムードのグルーブフィールが Swing か Shuffle のときだけ適用されます（Sentimental・Chill・Ballad・Nostalgic・CityPop がスウィング、RnBNeoSoul と Lofi がシャッフル）。それ以外のムードはストレートで、オフセットは 0 です。

| セクション | スウィング量 | 挙動 |
|-----------|------------|------|
| Intro | 0.25 | 最も浅い |
| A / Bridge / Interlude / MixBreak | 0.35 | 一定 |
| B | 0.40 | 一定 |
| Chorus | 0.50 | 最も深く、一定 |
| Outro | 0.40 → 0.20 | 終わりに向かって二次関数的に減衰 |

セクション内で量を一定に保つのは意図的です。小節ごとに揺れるとグルーブが不安定に感じられるためです。Blueprint の SectionSlot は `swing_amount`（0.0-0.7）で上書きできます。

スウィングは別グリッドではありません。オフビートの音は `swing_amount` に応じて三連符の位置へ押し出されます。8分グリッドで最大 +80 ティック、16分グリッドで最大 +40 ティックで、`swing_amount = 1.0` でちょうど三連符位置に一致します。Shuffle は量を 1.5 倍してからクランプします。

### ヒューマナイゼーション

微妙なタイミングとベロシティの変化でパターンの機械的さを軽減：
- **タイミングジッター**: グリッドから±5-15ティック
- **ベロシティ変動**: 基本ベロシティから±5-10
- **ハイハットアクセントパターン**: ダウンビートへの自然な強調

### ボーカル同期

`drums_sync_vocal`が有効な場合、キックドラムはボーカルのオンセット位置に揃います：

```cpp
void generateDrumsTrackWithVocal(
    MidiTrack& track,
    const Song& song,
    const GeneratorParams& params,
    std::mt19937& rng,
    const VocalAnalysis& vocal_analysis  // 事前分析されたボーカルデータ
);
```

この「リズムロック」効果により、グルーブがメロディに追従します。現代のポップ制作で一般的な手法です。

---

## モチーフトラック

**ソース:** `src/track/generators/motif.cpp`

`BackgroundMotif`コンポジションスタイル（BGM専用モード）用。Vocalは常にスキップされ、モチーフが主旋律要素になります。SynthDriven、RhythmSyncパラダイム、Blueprintのセクションフローが要求する場合にも生成されます。

### パラメータ

```cpp
struct MotifParams {
    MotifLength length;                 // Bars1, Bars2（デフォルト）, Bars4
    uint8_t note_count;                 // 1サイクル 3-8 音、デフォルト 6
    bool register_high;                 // false = mid, true = high
    MotifRhythmDensity rhythm_density;  // Sparse, Medium（デフォルト）, Driving
    MotifMotion motion;                 // Stepwise, GentleLeap, WideLeap,
                                        // NarrowStep, Disjunct, Ostinato
    MotifRepeatScope repeat_scope;      // FullSong（デフォルト）, Section
};
```

`MotifLength` の単位は拍ではなく**小節**です。レジスターは列挙型ではなく真偽値で、`MotifRegister` という型は存在しません。

### オーバーライドパラメータ

設定でモチーフオーバーライドが指定されている場合、以下のパラメータがスタイルのデフォルトより優先されます：

| パラメータ | 型 | 説明 |
|-----------|------|------|
| `motifLength` | int (0=auto, 1/2/4) | モチーフ長のオーバーライド（小節単位、0 はデフォルトで2小節） |
| `motifNoteCount` | int (0=auto, 3-8) | モチーフの音数をオーバーライド（0はデフォルトで6） |
| `motifMotion` | int (0xFF=preset, 0-5) | モーションタイプのオーバーライド（0=Stepwise, 1=GentleLeap, 2=WideLeap, 3=NarrowStep, 4=Disjunct, 5=Ostinato） |
| `motifRegisterHigh` | int (0=auto, 1=low, 2=high) | モチーフが組み立ての基準にするレジスターのオーバーライド |
| `motifRhythmDensity` | int (0xFF=preset, 0-2) | リズム密度のオーバーライド（0=Sparse, 1=Medium, 2=Driving） |

### パターン生成

<DocFigure name="tracks-motif-pattern" />

**MotifMotionの値**（API: 0-5）:

| 値 | 名前 | 説明 |
|----|------|------|
| 0 | Stepwise | スケールステップのみ（2度） |
| 1 | GentleLeap | 3度まで |
| 2 | WideLeap | 5度まで |
| 3 | NarrowStep | 狭いスケール度数（ジャジー） |
| 4 | Disjunct | 不規則な跳躍（実験的） |
| 5 | Ostinato | 同一ピッチクラスの繰り返し |

### 音域

モチーフトラックは C4 (60) - C8 (108) を占めます。レジスターのフラグは固有の音域ではなく、組み立ての基準音を選ぶものです：

| レジスター | 基準音 |
|-----------|--------|
| Mid（デフォルト） | C4 (60) |
| High | G4 (67) |

ボーカルがある場合、使用できる音域はボーカルの中央値を基準に狭められます。上限は中央値の3半音上まで下がり、下限は15半音下まで上がるため、モチーフが音域の上端に集中しなくなります。

### 反復

`Free`ポリシーでは、`repeat_scope`が`FullSong`なら各セクションに新しいモチーフを生成し、`Section`ならセクションタイプごとにパターンをキャッシュして再利用します。ロック系のポリシー（LockedContour・LockedPitch・LockedAll）は繰り返しのセクションタイプでキャッシュ済みパターンを再生します。`Evolving`はキャッシュ済みのリフを各セクションで変化させながら、同一性を保ちます。`phrase_tail_rest`が有効な場合、モチーフは末尾の最後の小節で半分を過ぎた位置から新しい音を開始しません。Coordinatorが凍結小節をコピーするときも、生成器へこのカットオフを問い合わせます。

---

## アルペジオトラック

**ソース:** `src/track/generators/arpeggio.cpp`

`SynthDriven`コンポジションスタイル（BGM専用モード）用。エレクトロニックスタイルのトラックで主要なハーモニック/メロディック要素として機能するアルペジオパターンを生成します。

### パラメータ

```cpp
struct ArpeggioParams {
    ArpeggioPattern pattern = Auto;  // Up, Down, UpDown, Random, Pinwheel,
                                     // PedalRoot, Alberti, BrokenChord, Auto
    ArpeggioSpeed speed = Auto;      // Eighth, Sixteenth, Triplet, Auto
    uint8_t octave_range = 2;        // 1-3オクターブ
    float gate = -1.0f;              // ノート長比率 (0.0-1.0)、-1 はスタイル既定
    bool sync_chord = true;          // コードチェンジに追従
    uint8_t base_velocity = 90;      // アルペジオノートのベースベロシティ
};
```

### パターンタイプ

<DocFigure name="tracks-arpeggio-patterns" />

| ID | パターン | 説明 |
|----|---------|------|
| 0 | Up | コードトーンを上昇 |
| 1 | Down | コードトーンを下降 |
| 2 | UpDown | 上昇後に下降（端の音は重複しない） |
| 3 | Random | コードトーンをシャッフルした順序 |
| 4 | Pinwheel | ルート - 5度 - 3度 - 5度 |
| 5 | PedalRoot | ルートと各上声を交互に鳴らす |
| 6 | Alberti | 古典的な 低-高-中-高。Pinwheel と同じ音型 |
| 7 | BrokenChord | 上昇して下降。UpDown と同じ音型 |
| 255 | Auto | ムードまたは Blueprint 既定のパターンを使用（JS のデフォルト） |

パターンを適用する前に、コードトーンは `octave_range` オクターブ分だけ積み上げられます。したがってデフォルトの 2 では、C メジャーの Up アルペジオは C E G C ではなく C E G C E G になります。

### スピード変換

```cpp
Tick getNoteDuration(ArpeggioSpeed speed) {
    switch (speed) {
        case Eighth:    return TICKS_PER_BEAT / 2;    // 240
        case Sixteenth: return TICKS_PER_BEAT / 4;    // 120
        case Triplet:   return TICKS_PER_BEAT / 3;    // 160
    }
}
```

---

## SEトラック

**ソース:** `src/track/generators/se.cpp`

SE トラックは各セクションの先頭にテキストマーカーを、転調がある場合は転調位置にもマーカーを書き込みます。ピッチの衝突検出には参加しません。

コールが有効な場合は、コール&レスポンスのチャントも書き込まれます。チャントセクションとミックスブレイクにはそれぞれのプリセットパターン、サビにはコール密度に応じた確率で短いコール、B → サビの遷移直前の小節には PPPH、各イントロにはイントロミックスのパターンが置かれます。コールのノートは任意で、無効にするとテキストマーカーだけが書き込まれます。コールのノートはすべて C3 (48) 固定のため、アレンジ全体に影響を与えずにミュートしたり別の音源へ差し替えたりできます。

---

## ベロシティ計算

全トラック共通のベロシティ計算式：

```cpp
uint8_t calculateVelocity(
    uint8_t baseVelocity,
    int beat,
    SectionType section,
    float trackBalance
) {
    float beatAdjust = getBeatAccent(beat);      // 強拍: +10
    float sectionMult = getSectionEnergy(section); // Chorus: 1.2

    return clamp(
        baseVelocity * beatAdjust * sectionMult * trackBalance,
        1, 127
    );
}
```

### トラックバランス

| トラック | バランス | 備考 |
|----------|----------|------|
| Vocal | 1.00 | リード楽器 |
| Aux | 0.50-0.80 | 副旋律サポート |
| Chord | 0.75 | サポート |
| Bass | 0.85 | ベース |
| Guitar | 0.70 | 伴奏 |
| Drums | 0.90 | タイミングドライバー |
| Motif | 0.70 | バックグラウンド |
| Arpeggio | 0.85 | 中レベル |
