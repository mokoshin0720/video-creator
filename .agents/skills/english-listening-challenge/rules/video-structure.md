---
name: video-structure
description: 英語リスニングチャレンジ動画の全体構成とタイムライン
metadata:
  tags: structure, timeline, composition, shorts
---

# 動画全体の構成

## フォーマット

- 解像度: 1080x1920（縦型 YouTube Shorts）
- FPS: 30
- 動画の長さは素材に応じて動的に計算する（`calculateMetadata` を使用）

## タイムラインの構成

動画は4つのパート + エンディングで構成される（間にポーズは入れない、パート間でSEを再生）:

```
[上部バナー: 常に表示] ─────────────────────────────────
│                                                       │
│  パート1: チャレンジ動画                                │
│  ├─ ソース動画の途中（hookStartSec〜hookEndSec）を再生  │
│  ├─ 字幕A: 聞き取れる単語（通常字幕 + ハイライト）       │
│  └─ 字幕B: 聞き取れない部分（スクランブル記号）          │
│                         ↓ SE                          │
│  パート2: アンサー動画                                  │
│  ├─ answerStartSecからhookEndSecまで再生                │
│  ├─ 正しい字幕をセンテンス単位で表示（単語ハイライト付き） │
│  ├─ 英語字幕の下に日本語翻訳を同時表示                   │
│  └─ 最後のセンテンス（= チャレンジ文）は下線スロットのみ  │
│                         ↓ SE                          │
│  パート3: 単語並べ替えチャレンジ                          │
│  ├─ チャレンジ動画を0.75倍速で3回リプレイ                │
│  ├─ 3回の再生で全単語が順番に埋まっていく                │
│  └─ 発話タイミングに合わせて単語が選択される              │
│                         ↓ SE                          │
│  パート4: 通常速度リプレイ                               │
│  ├─ チャレンジ動画を通常速度で1回再生                    │
│  ├─ 英語字幕（ハイライト付き）+ 日本語翻訳               │
│  └─ 終了0.8秒前から黄色の雫が落下開始（パート4に重なる）  │
│                                                       │
│  エンディング: 画面展開 + CTA音声                        │
│  ├─ パート4終了と同時に雫が中央到達→円形展開（0.5秒）    │
│  └─ 画面全体が黄色 → CTA音声再生（約2.57秒）            │
│                                                       │
─────────────────────────────────────────────────────────
```

## 長さの計算

```tsx
const challengeDurationSec = hookEndSec - hookStartSec;
const transitionBufferSec = 0.5;
const answerDurationSec = hookEndSec - answerStartSec;
const replayPlaybackRate = 0.75;
const wordOrderingDurationSec = (challengeDurationSec / replayPlaybackRate) * 3;
const finalReplayDurationSec = challengeDurationSec;
const endingDurationSec = (ENDING_DURATION_FRAMES - DROP_FRAMES) / 30; // 展開フェーズのみ（落下はパート4と重なる）
const endingCtaDurationSec = 2.57; // CTA音声
const totalDurationSec = challengeDurationSec + transitionBufferSec + answerDurationSec + transitionBufferSec + wordOrderingDurationSec + finalReplayDurationSec + endingDurationSec + endingCtaDurationSec;
```

## チャレンジ動画とアンサー動画の関係（重要）

- **チャレンジ動画はソース動画の途中から切り出す**（最初の文章をチャレンジにしない）
- **アンサー動画はチャレンジ動画の終了フレーム（hookEndSec）で終わる**
- **アンサー動画の開始地点（answerStartSec）はチャレンジの10〜20秒前を目安に設定する**
- ソース動画が短い場合は0秒（冒頭）から開始してもよい
- つまり流れは: チャレンジ（途中の聞き取りにくい部分）→ アンサー（その前の文脈からチャレンジ部分まで通しで再生）→ 単語並べ替えチャレンジ → 通常速度リプレイ

## チャレンジ動画の切り抜き選定基準（重要）

ターゲット視聴者は**英検2級レベル**（知識はあるが実際の音声では聞き取れない層）。
以下の基準でチャレンジに使う文章を選ぶ:

### 選ぶべき文章
- **日常会話で頻出だが、聞き取りにくい表現**: リンキング・リダクション・フラッピングが多い文（例: "I had you looking in the wrong section." → "had you" が繋がって聞こえる）
- **ニュアンスがつかみづらいスラング・口語表現**: "checked this out", "a bit of light reading" など、知っていても音で拾えないフレーズ
- **句動詞（phrasal verbs）**: "check out", "look into", "figure out" など、個々の単語は簡単だが組み合わせで意味が変わるもの
- **弱形・機能語の脱落**: "would've", "could've", "gonna", "wanna" など、省略形が使われている箇所
- **速いテンポで話される自然な会話**: 教科書的でない、ネイティブの自然なスピードの発話

### 避けるべき文章
- **簡単すぎる文**: ゆっくり・はっきり発音されている箇所、短すぎる単語のみの文
- **難しすぎる文**: 専門用語・固有名詞が多い、英検準1級以上の語彙が中心の文
- **文脈がないと意味不明な文**: 前後の会話がないと理解できない指示語だけの文

**注意**:
- パート間にポーズ（「聞き取れた？」等のテキスト表示）は入れない。パート間はSEのみで繋ぐ
- チャレンジ動画内の字幕は2つの Sequence に分けて時間的に切り替える（同時表示しない）

## 画面レイアウト（重要）

素材動画を画面の縦方向中央に配置し、字幕は動画の直下に表示する。

```
┌──────────────────┐
│   上部バナー       │ ← zIndex: 100
│                    │
│  ┌──────────────┐ │
│  │              │ │
│  │   動画(16:9)  │ │ ← 画面中央、幅いっぱい
│  │              │ │
│  └──────────────┘ │
│   字幕テキスト     │ ← 動画の直下（動画下端 + 40px）
│                    │
│                    │
└──────────────────┘
```

### 動画と字幕の位置計算

```tsx
// 動画は幅1080pxで表示、16:9のアスペクト比
const videoHeight = Math.round(1080 * (9 / 16)); // 608px
const videoBottom = Math.round((1920 + videoHeight) / 2); // 1264px
const subtitleTop = videoBottom + 40; // 字幕開始位置
```

- 動画は `<OffthreadVideo>` で `width: 1080, height: "auto"` に設定
- 動画のコンテナは `justifyContent: "center", alignItems: "center"` で中央配置
- 字幕コンポーネントには `subtitleTop` を渡して位置を揃える

## レイヤー構成（Z-index順）

1. **背景**（最背面）: 黒背景
2. **動画**（中央）: 素材動画を画面中央に横幅いっぱいで配置
3. **字幕エリア**（動画直下）: チャレンジ字幕 / アンサー字幕 / 下線スロット / 単語並べ替え
4. **上部バナー**（最前面）: 「リアル日常英語　聞き取れる？」

## SE音量の管理（重要）

SEの音量は**コード上の `volume` propではなく、音声ファイル自体の音量で調整する**。
新しいSEファイルを追加する際や音量調整を依頼された際は、ffmpegで音声ファイルの音量を直接変更する。

```bash
# 音量を0.8倍にする例
ffmpeg -y -i input.mp3 -filter:a "volume=0.8" output.mp3
```

コード上の `volume` prop はトランジションのフェードアウト等、動的な音量制御にのみ使用する。

## パート間の切り替わりSE

各パート間でウーシュSEを再生する。

- **SEファイル**: `public/whoosh.mp3`（約1.03秒）
- **音量**: `volume={0.8}`
- **再生タイミング**: 切り替わりポイントの0.5秒前から開始し、SEファイルの全長分（1.03秒）再生する
- **Sequenceの `durationInFrames`**: SEファイルの全長に合わせる（途中で途切れないようにする）

```tsx
import { Audio } from "remotion";

// SEの長さ: 約1.03秒、切り替わりの0.5秒前から開始
<Sequence
  from={transitionFrame - Math.round(0.5 * fps)}
  durationInFrames={Math.ceil(1.03 * fps)}
>
  <Audio src={staticFile("whoosh.mp3")} volume={0.8} />
</Sequence>
```

**重要**:
- SEはパート切り替わりの前後にまたがって再生する（切り替わり後に再生するのではない）
- Sequence の `durationInFrames` はSEファイルの実際の長さ以上にする。短くすると音が途切れる

## トランジションバッファ（重要）

パート1→パート2、パート2→パート3の切り替わりでは、**0.5秒のトランジションバッファ**を設ける。

- 前のパートの動画はバッファ中も再生し続ける（`endAt` を指定しない）
- バッファ中は動画の音量を**リニアフェードアウト**（1→0）する
- Sequence の `durationInFrames` を本来の長さ + バッファ分に延長する

```tsx
const transitionBufferFrames = Math.round(0.5 * fps);

// パート1: チャレンジ動画（バッファ付き）
<Sequence from={0} durationInFrames={challengeDurationFrames + transitionBufferFrames}>
  <OffthreadVideo
    src={videoSrc}
    startFrom={Math.round(props.hookStartSec * fps)}
    volume={(f) => {
      if (f < challengeDurationFrames) return 1;
      const fadeProgress = (f - challengeDurationFrames) / transitionBufferFrames;
      return Math.max(0, 1 - fadeProgress);
    }}
    style={{ width: 1080, height: "auto" }}
  />
</Sequence>

// パート2: アンサー動画（バッファ付き）
<Sequence from={answerStartFrame} durationInFrames={answerDurationFrames + transitionBufferFrames}>
  <OffthreadVideo
    src={videoSrc}
    startFrom={Math.round(props.answerStartSec * fps)}
    volume={(f) => {
      if (f < answerDurationFrames) return 1;
      const fadeProgress = (f - answerDurationFrames) / transitionBufferFrames;
      return Math.max(0, 1 - fadeProgress);
    }}
    style={{ width: 1080, height: "auto" }}
  />
</Sequence>
```

**重要**:
- バッファ中に画面が真っ黒になってはいけない。動画は常に表示し続ける
- フェードアウトは音量のみ。映像はそのまま再生する
- `endAt` を指定すると動画がそこで止まるため、バッファ付きのパートでは `endAt` を使わない
- パート3→パート4、パート4の終了にはバッファを入れない（即座に切り替わる）

## 動画・音声の扱い

- `<OffthreadVideo>` を使用する（音声も含まれるため別途 `<Audio>` は不要）
- チャレンジ動画（パート1）: `startFrom` で開始位置指定、`endAt` なし（バッファで再生継続）
- アンサー動画（パート2）: `startFrom` で開始位置指定、`endAt` なし（バッファで再生継続）
- パート3: `playbackRate: 0.75` で3回リプレイ
- パート4: 通常速度（`playbackRate` 指定なし）で1回再生
- 切り替わりSE: `<Audio>` で別途再生
