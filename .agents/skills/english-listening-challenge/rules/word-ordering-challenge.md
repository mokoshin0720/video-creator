---
name: word-ordering-challenge
description: パート3の単語並べ替えチャレンジ（0.75倍速×3回リプレイ + 発話タイミング連動）
metadata:
  tags: word-ordering, challenge, replay, animation, slots
---

# 単語並べ替えチャレンジ（パート3）

チャレンジ動画を0.75倍速で3回繰り返し再生しながら、単語が順番に選ばれてセンテンスが完成していくアニメーション。

## 表示構成

### 上段: 下線スロット（`subtitleTop` 位置）

- **フォントサイズ**: 48px
- 未配置の単語は下線（`3px solid rgba(255,255,255,0.6)`）で表示
- 配置済みの単語はテキストで表示
- 下線幅は単語の文字数に比例（`charWidth = 20px`、最小幅 40px）

### 下段: シャッフルされた単語バンク（`subtitleTop + 60px` マージン）

- **フォントサイズ**: 40px
- 背景: `rgba(255,255,255,0.15)` の角丸チップ（`borderRadius: 12`）
- 配置済の単語は `opacity: 0` で非表示化
- シャッフルは Remotion の `random(seed)` で決定的 Fisher-Yates シャッフル

## 単語配置タイミング

### リプレイへの分配

- N個の単語を3回のリプレイに均等分配（12単語なら 4-4-4）
- 1回目のリプレイで最初の約1/3、2回目で約2/3まで、3回目で全単語が埋まる

### 発話タイミングとの連動（重要）

- 各単語は**等間隔ではなく、発話タイミングに合わせて**配置する
- `hookCaptions` の各単語の `startMs` から、0.75倍速を考慮した発話フレームを計算:
  ```tsx
  Math.round(((c.startMs - hookStartMs) / 1000 / replayPlaybackRate) * fps)
  ```
- 単語 i の配置フレーム = `replayIndex * singleReplayFrames + wordStartFrame[i]`

### 配置時のハイライト

- 配置直後の **8フレーム**（約0.27秒）はゴールドでハイライト
- ハイライト中は `textShadow` でグロー効果も付与

## 動画の再生

- チャレンジ動画を `playbackRate: 0.75` で3回リプレイ
- 各リプレイは `<Sequence>` で `singleReplayFrames` ずつ区切る
- `singleReplayFrames = Math.ceil((challengeDurationSec / 0.75) * fps)`

## Props

```tsx
{
  words: string[]              // ["I", "checked", "this", "out", ...]
  wordStartFrames: number[]    // 各単語の1リプレイ内での発話開始フレーム
  totalDurationFrames: number  // 全体のフレーム数（= singleReplayFrames * 3）
  singleReplayFrames: number   // 1回のリプレイのフレーム数
  highlightColor: string
  subtitleTop: number
  seed: string                 // Remotion random() 用
}
```

## 全単語配置完了時のレベルアップSE

全単語が埋まったタイミング（最後の単語の配置フレーム）でレベルアップSEを再生する。

- **SEファイル**: `public/level-up.mp3`（約1.72秒）
- **音量**: `volume={0.8}`
- **再生タイミング**: `wordOrderingStartFrame + lastWordPlacementFrame`
- `lastWordPlacementFrame` は最後の単語が割り当てられたリプレイの開始フレーム + その単語の発話フレーム

```tsx
// 最後の単語の配置フレームの計算
const lastWordPlacementFrame = (() => {
  const totalWords = challengeWords.length;
  const totalReplays = 3;
  const wordsPerReplay = Math.ceil(totalWords / totalReplays);
  const lastIndex = totalWords - 1;
  const replayIndex = Math.min(Math.floor(lastIndex / wordsPerReplay), totalReplays - 1);
  const replayStart = replayIndex * singleReplayFrames;
  const speechFrame = challengeWordStartFrames[lastIndex] ?? 0;
  return replayStart + speechFrame;
})();

<Sequence from={wordOrderingStartFrame + lastWordPlacementFrame} durationInFrames={Math.ceil(1.72 * fps)}>
  <Audio src={staticFile("level-up.mp3")} volume={0.8} />
</Sequence>
```

## アンサー動画の最後のセンテンスでの下線表示

アンサー動画（パート2）の最後のセンテンス（= チャレンジ文）では、通常字幕の代わりに **下線スロットのみ** を表示する（単語バンクは表示しない）。

- `BlankSlots` コンポーネントを使用
- 字幕テキストは一切表示せず、各単語の文字数に応じた幅の下線のみ表示
- これにより「ここが聞き取りチャレンジ部分」であることを視覚的に示す

## 実装ファイル

- `src/EnglishListeningChallenge/WordOrderingChallenge.tsx` - 単語並べ替えチャレンジ本体
- `src/EnglishListeningChallenge/BlankSlots.tsx` - アンサー動画最後のセンテンス用下線表示
