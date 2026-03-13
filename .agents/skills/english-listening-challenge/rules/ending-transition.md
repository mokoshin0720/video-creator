---
name: ending-transition
description: エンディングアニメーション（黄色の雫落下 → 円形展開 → CTA音声）の仕様と実装
metadata:
  tags: ending, transition, animation, droplet, cta
---

# エンディングアニメーション

パート4（通常速度リプレイ）の終わりに、黄色の雫が落下→画面全体に広がるトランジション + CTA音声を再生する。

## タイムライン

```
パート4再生中 ──────────┐
                        │← DROP_FRAMES(24f) 前から雫落下開始
                        │  雫が画面上端→中央へ落下
パート4終了 ────────────┤← 雫が中央到達、円形展開開始
                        │  円形に広がり画面全体を覆う (15f)
展開完了 ──────────────┤← 画面全体が黄色
                        │  CTA音声再生 (約2.57秒)
動画終了 ──────────────┘
```

**重要**: 雫の落下はパート4の再生中に重ねて表示する（パート4終了後ではない）。パート4が終わる瞬間に雫が画面中央に到達し、即座に円形展開に移行する。

## フレーム定数

```tsx
export const DROP_FRAMES = 24;    // フェーズ1: 雫の落下（0.8秒）
const EXPAND_FRAMES = 15;         // フェーズ2: 円形展開（0.5秒）
export const ENDING_DURATION_FRAMES = DROP_FRAMES + EXPAND_FRAMES; // 合計39フレーム
```

## フェーズ1: 雫の落下（24フレーム = 0.8秒）

- 画面上端（Y = -60）から画面中央（Y = 960）まで落下
- 雫の形状: 涙型（SVG path、幅40px × 高さ56px）— 上が尖り下が丸い左右対称の水滴
- 色: `highlightColor`（デフォルト: #FFD700）
- イージング: easeIn（`progress * progress`）— 加速しながら落下

```tsx
const progress = frame / DROP_FRAMES;
const eased = progress * progress;
const y = -60 + (960 - (-60)) * eased;
```

## フェーズ2: 円形展開（15フレーム = 0.5秒）

- 雫が中央に到達した瞬間から、中央を起点に円形に広がる
- 2px × 2px の円を `scale` で画面の対角線長まで拡大
- イージング: easeOut（`1 - (1 - progress)^2`）
- 対角線長: `Math.sqrt(1080² + 1920²)` ≈ 2203px

```tsx
const diagonal = Math.sqrt(1080 * 1080 + 1920 * 1920);
const expandProgress = Math.min(expandFrame / EXPAND_FRAMES, 1);
const eased = 1 - (1 - expandProgress) * (1 - expandProgress);
const scale = eased * diagonal;
```

## CTA画面（展開完了後）

円形展開が完了し画面全体が黄色になった後、CTA画面を表示する。

### レイアウト

黄色（`highlightColor`）背景の上に、以下を縦方向中央揃え（`gap: 60`）で配置:

1. **テキスト**（2行、中央揃え、画面幅いっぱいに大きく表示）
   - 1行目: 「推し動画で英語を学ぶなら」（fontSize: 85, fontWeight: 900, fontFamily: Zen Kaku Gothic New, whiteSpace: nowrap）
   - 2行目: 「Favorite」（fontSize: 190, fontWeight: 900）
   - lineHeight: 1.3
   - 1行目は `whiteSpace: "nowrap"` で必ず1行に収める
   - フォントデザインは3層テロップ（後述）を適用
2. **アプリアイコン**: `public/app-icon.png`（width: 300, height: 300, borderRadius: 60）
3. **App Storeバッジ**: `public/app-store-badge.png`（width: 400, height: auto）

### 3層テロップデザイン

CTAテキストは3層の重ね合わせで、メインカラー文字 → 白の境界線 → 外側メインカラーの縁取りを表現する。
`WebkitTextStroke` は文字の内側も侵食するため、同じテキストを3つ重ねて（`position: absolute`）それぞれにストロークを設定する。

| 層 | 役割 | スタイル |
|---|------|---------|
| 最背面 | 外側のメインカラー縁 | `WebkitTextStroke: "14px #333"`, `paintOrder: "stroke fill"`, `color: "#333"` |
| 中間 | 白の境界線 | `WebkitTextStroke: "6px white"`, `paintOrder: "stroke fill"`, `color: "#333"` |
| 最前面 | 文字本体 | `color: "#333"`（ストロークなし） |

- Favorite（fontSize: 190）は外側18px / 白8px に拡大
- 3層とも同じテキスト・同じサイズ。親要素を `position: relative` にし、背面2層は `position: absolute, inset: 0` で重ねる
- 最前面のみ `position: relative` にして要素のサイズを確保する
- 背面2層には `aria-hidden` を付ける

```tsx
{/* 例: 1行テキストの3層テロップ */}
<span style={{ fontSize: 85, fontWeight: 900, position: "relative" }}>
  {/* 外側: メインカラーのストローク */}
  <span aria-hidden style={{ position: "absolute", inset: 0, color: "#333", WebkitTextStroke: "14px #333", paintOrder: "stroke fill" }}>
    推し動画で英語を学ぶなら
  </span>
  {/* 中間: 白のストローク */}
  <span aria-hidden style={{ position: "absolute", inset: 0, color: "#333", WebkitTextStroke: "6px white", paintOrder: "stroke fill" }}>
    推し動画で英語を学ぶなら
  </span>
  {/* 前面: 文字本体 */}
  <span style={{ position: "relative", color: "#333" }}>
    推し動画で英語を学ぶなら
  </span>
</span>
```

**重要**:
- `textShadow` の8方向方式はギザギザになるので使わない
- `WebkitTextStroke` 単体で太くすると文字が潰れるので、必ず3層重ねで実装する
- `paintOrder: "stroke fill"` を必ず指定する（ストロークが文字の背面に描画される）

### CTA音声

- ファイル: `public/ending-cta.mp3`（約2.57秒）
- CTA画面と同時に再生開始

## コンポーネント: EndingTransition

```tsx
import { AbsoluteFill, useCurrentFrame } from "remotion";

export const DROP_FRAMES = 24;
const EXPAND_FRAMES = 15;
export const ENDING_DURATION_FRAMES = DROP_FRAMES + EXPAND_FRAMES;

export const EndingTransition: React.FC<{
  highlightColor: string;
}> = ({ highlightColor }) => {
  const frame = useCurrentFrame();
  const diagonal = Math.sqrt(1080 * 1080 + 1920 * 1920);

  if (frame < DROP_FRAMES) {
    // フェーズ1: 雫の落下
    const progress = frame / DROP_FRAMES;
    const eased = progress * progress;
    const y = -60 + (960 - (-60)) * eased;

    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", pointerEvents: "none" }}>
        <svg
          width="40"
          height="56"
          viewBox="0 0 40 56"
          style={{ position: "absolute", top: y, left: "50%", marginLeft: -20 }}
        >
          <path
            d="M20 0 C20 0, 0 30, 0 38 C0 48, 9 56, 20 56 C31 56, 40 48, 40 38 C40 30, 20 0, 20 0 Z"
            fill={highlightColor}
          />
        </svg>
      </AbsoluteFill>
    );
  }

  // フェーズ2: 円形展開
  const expandFrame = frame - DROP_FRAMES;
  const expandProgress = Math.min(expandFrame / EXPAND_FRAMES, 1);
  const eased = 1 - (1 - expandProgress) * (1 - expandProgress);
  const scale = eased * diagonal;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", pointerEvents: "none" }}>
      <div
        style={{
          width: 2,
          height: 2,
          borderRadius: "50%",
          backgroundColor: highlightColor,
          transform: `scale(${scale})`,
        }}
      />
    </AbsoluteFill>
  );
};
```

## 親コンポーネント（index.tsx）での配置

```tsx
import { EndingTransition, ENDING_DURATION_FRAMES, DROP_FRAMES } from "./EndingTransition";

// calculateMetadata 内の長さ計算
// 落下フェーズはパート4と重なるため、展開フェーズ + CTA音声分のみ加算
const endingDurationSec = (ENDING_DURATION_FRAMES - DROP_FRAMES) / 30;
const endingCtaDurationSec = 2.57;
const totalDurationSec = ... + finalReplayDurationSec + endingDurationSec + endingCtaDurationSec;

// コンポーネント内のフレーム計算
const endingStartFrame = finalReplayStartFrame + challengeDurationFrames - DROP_FRAMES;
const endingCtaStartFrame = endingStartFrame + ENDING_DURATION_FRAMES;
const endingCtaDurationFrames = Math.ceil(2.57 * fps);

// エンディング: 黄色の雫が落下 → 画面全体に展開
<Sequence from={endingStartFrame} durationInFrames={ENDING_DURATION_FRAMES}>
  <EndingTransition highlightColor={props.highlightColor} />
</Sequence>

// エンディングCTA: 黄色背景 + テキスト + アイコン + バッジ + 音声
<Sequence from={endingCtaStartFrame} durationInFrames={endingCtaDurationFrames}>
  <AbsoluteFill
    style={{
      backgroundColor: props.highlightColor,
      justifyContent: "center",
      alignItems: "center",
      gap: 60,
    }}
  >
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.3 }}>
      {/* 3層テロップ: 外側メインカラー → 白 → 文字本体 */}
      <span style={{ fontSize: 85, fontWeight: 900, fontFamily, whiteSpace: "nowrap", position: "relative" }}>
        <span aria-hidden style={{ position: "absolute", inset: 0, color: "#333", WebkitTextStroke: "14px #333", paintOrder: "stroke fill" }}>推し動画で英語を学ぶなら</span>
        <span aria-hidden style={{ position: "absolute", inset: 0, color: "#333", WebkitTextStroke: "6px white", paintOrder: "stroke fill" }}>推し動画で英語を学ぶなら</span>
        <span style={{ position: "relative", color: "#333" }}>推し動画で英語を学ぶなら</span>
      </span>
      <span style={{ fontSize: 190, fontWeight: 900, position: "relative" }}>
        <span aria-hidden style={{ position: "absolute", inset: 0, color: "#333", WebkitTextStroke: "18px #333", paintOrder: "stroke fill" }}>Favorite</span>
        <span aria-hidden style={{ position: "absolute", inset: 0, color: "#333", WebkitTextStroke: "8px white", paintOrder: "stroke fill" }}>Favorite</span>
        <span style={{ position: "relative", color: "#333" }}>Favorite</span>
      </span>
    </div>
    <Img src={staticFile("app-icon.png")} style={{ width: 300, height: 300, borderRadius: 60 }} />
    <Img src={staticFile("app-store-badge.png")} style={{ width: 400, height: "auto" }} />
  </AbsoluteFill>
  <Audio src={staticFile("ending-cta.mp3")} />
</Sequence>
```

## 上部バナーの非表示

エンディング（雫の落下開始）以降、上部バナー（「リアル日常英語 聞き取れる？」）は非表示にする。

```tsx
// TopBanner を Sequence で囲み、エンディング開始フレームまでに制限
<Sequence from={0} durationInFrames={endingStartFrame}>
  <TopBanner text={props.bannerText} />
</Sequence>
```

## 注意点

- 雫の落下はパート4の再生中にオーバーレイとして表示する。パート4終了を待ってから開始しない
- エンディング開始（雫の落下開始）以降は上部バナーを非表示にする
- `pointerEvents: "none"` で下のレイヤーの操作を妨げない
- CSS animation は使わない。すべて `useCurrentFrame()` によるフレームベースのアニメーション
- CTA音声の長さ（2.57秒）は全体の動画長に加算する
- 展開フェーズのみが動画長に追加される（落下フェーズはパート4と重なるため加算しない）
