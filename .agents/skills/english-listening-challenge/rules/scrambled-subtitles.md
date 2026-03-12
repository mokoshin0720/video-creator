---
name: scrambled-subtitles
description: チャレンジ動画の字幕表示（聞き取れる字幕→スクランブル字幕の2段階表示）
metadata:
  tags: subtitles, scrambled, challenge, hook, highlight
---

# チャレンジ動画の字幕表示

チャレンジ動画では、字幕の表示タイミングを2つに分ける:

1. **聞き取れる区間**: 最初のN単語（`hookRevealWords`）を通常の字幕として表示し、音声に合わせて単語ハイライトする
2. **聞き取れない区間**: 残りの単語をランダムな記号に置き換えた固定文字列で表示する

**重要**: この2つは同時に表示するのではなく、別々の Sequence で時間的に分けて表示する。聞き取れる字幕が終わった後に、スクランブル字幕に切り替わる。

## タイミングの分割

```
フック全体 (hookStartSec ~ hookEndSec)
├── Sequence 1: 聞き取れる字幕（通常表示 + ハイライト）
│   └─ hookStartMs ~ revealCaptions最後のendMs
└── Sequence 2: スクランブル字幕（記号固定表示）
    └─ revealCaptions最後のendMs ~ hookEndMs
```

例: `"I had you looking in the wrong section."` で `hookRevealWords: 3` の場合:
- **Sequence 1** (0s〜0.65s相対): `I had you` を通常字幕で表示、1単語ずつハイライト
- **Sequence 2** (0.65s〜2.2s相対): `#@$%&!? !@ ÷%° ×±§#& $@!?÷¡%#.` を固定表示

## コンポーネント構成

### HookRevealSubtitle（聞き取れる字幕）

アンサー動画の字幕と同じスタイルで、音声タイミングに合わせて単語ハイライトする。

```tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Caption } from "@remotion/captions";

const HookRevealSubtitle: React.FC<{
  captions: Caption[];
  offsetMs: number;
  highlightColor: string;
  subtitleTop: number;
}> = ({ captions, offsetMs, highlightColor, subtitleTop }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const absoluteTimeMs = offsetMs + (frame / fps) * 1000;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        top: subtitleTop,
        padding: "0 40px",
      }}
    >
      <div
        style={{
          fontSize: 60,
          fontWeight: "bold",
          whiteSpace: "pre-wrap",
          textAlign: "center",
          lineHeight: 1.4,
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
        }}
      >
        {captions.map((word, i) => {
          const isActive =
            word.startMs <= absoluteTimeMs && word.endMs > absoluteTimeMs;
          return (
            <span
              key={`${word.startMs}-${i}`}
              style={{ color: isActive ? highlightColor : "#FFFFFF" }}
            >
              {word.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

### ScrambledSubtitle（スクランブル字幕）

記号のみで構成された固定文字列を表示する。

```tsx
import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { random } from "remotion";

const SCRAMBLE_CHARS = "#@$%&!?*+~=^<>{}[]|/\\:;¿¡§†‡•°±×÷";

function scrambleWord(word: string, wordIndex: number): string {
  return word
    .split("")
    .map((char, i) => {
      if (char === " ") return " ";
      const randomIndex = Math.floor(
        random(`scramble-0-${wordIndex}-${i}`) * SCRAMBLE_CHARS.length,
      );
      return SCRAMBLE_CHARS[randomIndex];
    })
    .join("");
}

const ScrambledSubtitle: React.FC<{
  text: string;
  subtitleTop: number;
}> = ({ text, subtitleTop }) => {
  const scrambledText = useMemo(() => {
    return text
      .split(" ")
      .map((word, i) => scrambleWord(word, i))
      .join(" ");
  }, [text]);

  return (
    <AbsoluteFill
      style={{
        top: subtitleTop,
        justifyContent: "flex-start",
        alignItems: "center",
        padding: "0 40px",
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontWeight: "bold",
          textAlign: "center",
          letterSpacing: 2,
          textShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
          whiteSpace: "pre-wrap",
          color: "white",
          fontFamily: "monospace",
        }}
      >
        {scrambledText}
      </div>
    </AbsoluteFill>
  );
};
```

## 親コンポーネント（index.tsx）での Sequence 分割

```tsx
// チャレンジ動画区間のキャプションを取得
const hookStartMs = props.hookStartSec * 1000;
const hookEndMs = props.hookEndSec * 1000;
const hookCaptions = captions.filter(
  (c) => c.startMs >= hookStartMs && c.endMs <= hookEndMs,
);

// 聞き取れる部分と聞き取れない部分に分割
const revealCaptions = hookCaptions.slice(0, props.hookRevealWords);
const scrambleCaptions = hookCaptions.slice(props.hookRevealWords);

// 聞き取れる部分の区間（フックSequence内の相対フレーム）
const revealEndMs = revealCaptions.length > 0
  ? revealCaptions[revealCaptions.length - 1].endMs
  : hookStartMs;
const revealDurationFrames = Math.round(((revealEndMs - hookStartMs) / 1000) * fps);

// スクランブル部分
const scrambleText = scrambleCaptions.map((c) => c.text.trim()).join(" ");
const scrambleDurationFrames = hookDurationFrames - revealDurationFrames;

// チャレンジ動画 Sequence 内に2つの子 Sequence を配置
<Sequence from={0} durationInFrames={hookDurationFrames}>
  {/* 動画は全区間表示 */}
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <OffthreadVideo ... />
  </AbsoluteFill>

  {/* 聞き取れる部分: 通常字幕（ハイライト付き） */}
  <Sequence from={0} durationInFrames={revealDurationFrames}>
    <HookRevealSubtitle
      captions={revealCaptions}
      offsetMs={hookStartMs}
      highlightColor={props.highlightColor}
      subtitleTop={subtitleTop}
    />
  </Sequence>

  {/* 聞き取れない部分: スクランブル記号 */}
  <Sequence from={revealDurationFrames} durationInFrames={scrambleDurationFrames}>
    <ScrambledSubtitle text={scrambleText} subtitleTop={subtitleTop} />
  </Sequence>
</Sequence>
```

## スクランブル文字の重要ルール

- **英数字は使わない。記号のみを使用する**
- **スクランブルは固定表示**。フレームごとに文字を変えない（seed を固定値 `0` にする）
- スペースは保持して単語の区切りを維持する
- スクランブル文字は元の単語と同じ文字数を維持する
- `random()` は Remotion の決定的ランダム関数を使用すること（`Math.random()` は禁止）
