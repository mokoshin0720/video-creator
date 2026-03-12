---
name: top-banner
description: 上部バナー「リアル日常英語　聞き取れる？」のデザインと実装
metadata:
  tags: banner, header, design, ui
---

# 上部バナー

画面上部に常に表示される固定バナー。動画のジャンルと目的を視聴者に伝える。

## デフォルトテキスト

```
リアル日常英語
聞き取れる？
```

テキストは `\n` で改行し、2行で大きく表示する。

## デザイン仕様

- **位置**: 画面上部（上端から180px）
- **レイアウト**: 2行、中央揃え
- **背景**: なし（背景帯は使わない）
- **フォントサイズ**: 145px（両行とも同じサイズ。1行目の文字数が多いため自然と横幅が長くなる）
- **フォントウェイト**: 900（Black）
- **テキスト縁取り**: `WebkitTextStroke: "6px black"` + `paintOrder: "stroke fill"`
- **1行目の色**: ゴールド（`#FFD700`）
- **2行目以降の色**: 白（`#FFFFFF`）
- **letterSpacing**: 0
- **lineHeight**: 1.15
- **幅**: 1080px（`padding: "0 30px"` で左右余白）

## 実装

```tsx
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/ZenKakuGothicNew";

const { fontFamily } = loadFont();

const TopBanner: React.FC<{ text?: string }> = ({
  text = "リアル日常英語\n聞き取れる？",
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          marginTop: 180,
          opacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {text.split("\n").map((line, i) => {
          const fontSize = 145;
          return (
            <div
              key={i}
              style={{
                fontSize,
                fontWeight: 900,
                fontFamily,
                letterSpacing: 0,
                lineHeight: 1.15,
                color: i === 0 ? "#FFD700" : "white",
                WebkitTextStroke: "6px black",
                paintOrder: "stroke fill",
                textAlign: "center",
                width: 1080,
                padding: "0 30px",
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

## フォントの読み込み

日本語テキストには Zen Kaku Gothic New を使用する（Noto Sans JP は使わない）:

```tsx
import { loadFont } from "@remotion/google-fonts/ZenKakuGothicNew";

const { fontFamily } = loadFont();

// スタイルで使用
style={{ fontFamily }}
```

## 注意点

- バナーは動画全体を通して常に表示する（Sequence で囲まない、または全体の長さで囲む）
- Z-indexを高く設定して、字幕やその他の要素の上に表示する
- YouTube Shorts のUIと被らないよう、上端から180pxの余白を取る
- テキストは props で変更可能にしておくと汎用性が高い
- 1行目はゴールド（#FFD700）、2行目以降は白で表示する
- 背景帯は使わず、テキスト縁取り（黒ストローク）で可読性を確保する
