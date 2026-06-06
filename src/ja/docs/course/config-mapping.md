# 第7章 — 概念と設定の対応

このコースのすべての概念は、ひとつの構造体上のつまみです。この総仕上げの章では、コース全体をルックアップ表に集約します。左に概念、右に対応する `SongConfig` のフィールドを並べます。読み終える頃には、どんな音楽的意図も設定オブジェクトに翻訳でき、その結果をバイト単位で再現できるようになります。

## 1つのアイデア、多くの設定

このコースの中心的な主張は、曲のアイデアはそれをレンダリングするパラメータから独立している、ということです。メロディの形・コード進行・キーは直交したつまみで、ひとつを変えても他は生き残ります。下の譜例は、同じフックを `I–V` の動きの上で、まずCで、次にDへ移調してレンダリングしたものです。アイデアは同一で、変わったのは `key` だけです。

<ScoreExample example="configKeyTranspose" locale="ja" />

::: info ブループリント
**ブループリント**とは、生成戦略と適切なデフォルト（パラダイム、ドラム方針、フックの挙動、編曲の重み）をひとまとめにした高レベルのレシピです。`blueprintId` を選ぶことが、まとまりのある楽曲を最短で得る方法で、その後に個々のフィールドを上書きします。MidiSketchには10種類のブループリント（`blueprintId` 0〜9）があり、`255` を指定すると重みに従ってランダムに選びます。
:::

::: info 生成パラダイム
**パラダイム**とは、エンジンが楽曲を組み立てる際の軸です。**Traditional** はボーカルを最初に生成し、**RhythmSync** はリズムのモチーフを最初に組み、**MelodyDriven** はすべてをメロディ中心に据えます。各ブループリントはひとつのパラダイムを採用し、それがどのトラックを主導とし、どのトラックが従うかを決めます。
:::

::: info シード
**シード**とは、乱数生成器を初期化する整数です。同じ設定と同じ `seed` は、同じ楽曲をビット単位で再現します。エンジンは決定的です。毎回新しいランダムな楽曲が欲しければ `seed: 0` を、残しておきたい結果を固定したければ任意の非ゼロ値を使ってください。
:::

::: info ヒューマナイズ
**ヒューマナイズ**は、タイミングとベロシティに小さく制御された揺れを加え、出力をクオンタイズされたものではなく演奏されたように聞こえさせます。`humanizeTiming`（デフォルト `0.4`）はノートの発音位置をずらし、`humanizeVelocity`（デフォルト `0.3`）は音量を変化させます。どちらも `0.0`〜`1.0` で、大きいほど緩く、`0.0` は機械的に正確です。
:::

## 章ごとの対応

下の表はコースを章ごとに対応づけたものです。本文を一度読んだ後に立ち返るリファレンスとして扱ってください。

### 第0章 — 基礎（音高・時間・テンポ）

| 概念 | 設定フィールド | 範囲・備考 |
| --- | --- | --- |
| 主音のピッチクラス | `key` | `0`〜`11`（`0` = C、`7` = G） |
| 再生テンポ | `bpm` | `40`〜`240`；`0` = スタイル既定 |
| メロディの最低音 | `vocalLow` | MIDI番号、既定 `60`（C4） |
| メロディの最高音 | `vocalHigh` | MIDI番号、既定 `79`（G5） |

### 第1章 — スケールとキー

| 概念 | 設定フィールド | 範囲・備考 |
| --- | --- | --- |
| キー / 主音 | `key` | `0`〜`11` |
| 全体のムード（スケールの色を選ぶ） | `mood` | `0`〜`23`；正確に適用するには `moodExplicit: true` |

### 第2章 — コードとトライアド

| 概念 | 設定フィールド | 範囲・備考 |
| --- | --- | --- |
| 分散和音の質感 | `arpeggioEnabled` / `arpeggioPattern` | 真偽値；パターン `0`〜`7`（Up 〜 BrokenChord） |
| スタイルプリセット（コード・メロディの既定値をまとめて設定） | `stylePresetId` | `0`〜`16`（例：3 = Idol Standard、12 = Background Motif、14 = Anime Opening） |

### 第3章 — コード進行

| 概念 | 設定フィールド | 範囲・備考 |
| --- | --- | --- |
| コード進行のプリセット | `chordProgressionId` | `0`〜`21`（22種類の進行） |

### 第4章 — ハーモニーと響きの色

| 概念 | 設定フィールド | 範囲・備考 |
| --- | --- | --- |
| susコード | `chordExtSus` / `chordExtSusProb` | フラグ＋確率 `0.0`〜`1.0`（既定 `0.2`） |
| 7thコード | `chordExt7th` / `chordExt7thProb` | フラグ＋確率 `0.0`〜`1.0`（既定 `0.15`） |
| 9thコード | `chordExt9th` / `chordExt9thProb` | フラグ＋確率 `0.0`〜`1.0`（既定 `0.25`） |
| トライトーン代理 | `chordExtTritoneSub` / `chordExtTritoneSubProb` | フラグ＋確率 `0.0`〜`1.0`（既定 `0.5`） |

### 第5章 — メロディ・モチーフ・フック

| 概念 | 設定フィールド | 範囲・備考 |
| --- | --- | --- |
| フックの強さ | `hookIntensity` | `0`〜`4`（`4` = Maximum、BehavioralLoop で設定） |
| ボーカルの歌い回し | `vocalStyle` | `0`〜`13`（`0` = Auto、`13` = KPop） |
| メロディテンプレート | `melodyTemplate` | `0` = Auto、`1`〜`7` |
| コール＆レスポンス | `callSetting` | `0` = Auto、`1` = 有効、`2` = 無効 |

### 第6章 — 楽曲構成

| 概念 | 設定フィールド | 範囲・備考 |
| --- | --- | --- |
| 楽曲フォームのプリセット | `formId` | `0`〜`17` |
| フォームをそのまま使う | `formExplicit` | `true` / `false` |
| 目標の長さ（自動構築） | `targetDurationSeconds` | 秒；`0` = `formId` を使用 |

## ブループリント一覧

`blueprintId` を選ぶと、パラダイム・ドラム方針・編曲の重みが一手に設定されます。重みの列は `blueprintId: 255`（ランダム）のときの選択確率です。`9` は重みが0で、明示的に指定したときだけ到達できます。

| ID | ブループリント | パラダイム | ドラム必須 | 重み |
| --- | --- | --- | --- | --- |
| 0 | Traditional | Traditional | いいえ | 42% |
| 1 | RhythmLock | RhythmSync | はい | 14% |
| 2 | StoryPop | MelodyDriven | いいえ | 10% |
| 3 | Ballad | MelodyDriven | いいえ | 4% |
| 4 | IdolStandard | MelodyDriven | いいえ | 10% |
| 5 | IdolHyper | RhythmSync | はい | 6% |
| 6 | IdolKawaii | MelodyDriven | いいえ | 5% |
| 7 | IdolCoolPop | RhythmSync | はい | 5% |
| 8 | IdolEmo | MelodyDriven | いいえ | 4% |
| 9 | BehavioralLoop | Traditional | いいえ | 0%（明示指定のみ） |

ドラム必須のブループリント（`1`、`5`、`7`）はドラムトラックを強制します。実行時には `getBlueprintDrumsRequired(id)` で問い合わせられます。BehavioralLoop（`9`）はアディクティブモードを強制し、`hookIntensity` を Maximum にし、リフをロックします。

## 最小レシピ

つまみを組み合わせれば、完全で再現可能な楽曲が数行で書けます。

```javascript
const config = createDefaultConfig(0)
config.key = 7                 // G major (ch1)
config.chordProgressionId = 0  // preset progression (ch3)
config.chordExt7th = true      // mellow color (ch4)
config.hookIntensity = 3       // strong hook (ch5)
config.seed = 42               // reproducible
sketch.generateFromConfig(config)
```

生成の前に `validateConfig(config)` を呼び、すべてのフィールドが範囲内かを確認してください。値が範囲外ならエラーコードを返すので、拒否された生成のデバッグを省けます。

生成される9つのトラック（Vocal ch0、Chord ch1、Bass ch2、Motif ch3、Arpeggio ch4、Aux ch5、Guitar ch6、Drums ch9、SE ch15）のうち、ギタートラックは既定で有効です（`guitarEnabled: true`）。

## MidiSketchとの対応

| 概念 | 設定フィールド | 範囲・備考 |
| --- | --- | --- |
| 生成レシピ | `blueprintId` | `0`〜`9`、または `255` = 重みでランダム |
| 再現性 | `seed` | 整数；`0` = ランダム、非ゼロ = 固定 |
| タイミングの緩さ | `humanizeTiming` | `0.0`〜`1.0`（既定 `0.4`） |
| ベロシティの緩さ | `humanizeVelocity` | `0.0`〜`1.0`（既定 `0.3`） |
| 事前チェック | `validateConfig(config)` | フィールドが範囲外ならエラーコードを返す |

フィールドの全一覧と実行時の挙動については、[オプションの相互関係](/ja/docs/option-relationships)と[プリセットリファレンス](/ja/docs/presets)を参照してください。

[はじめに](/ja/docs/getting-started)と[JavaScript API](/ja/docs/api-js)で実践に移すか、用語は[用語集](/ja/docs/course/glossary)で調べてください。
