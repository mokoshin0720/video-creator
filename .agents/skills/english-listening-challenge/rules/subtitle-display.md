---
name: subtitle-display
description: アンサー動画での正しい字幕表示（単語ハイライト付き・日本語翻訳付き）
metadata:
  tags: subtitles, captions, highlight, display, sentence
---

# アンサー動画の字幕表示

アンサー動画では、音声に合わせて正しい英語字幕を表示する。
現在話されている単語をハイライトして、視聴者が追いやすくする。

## 字幕の分割ルール（重要）

- **センテンス単位で分割する**（`.` `?` `!` で区切る）
- `createTikTokStyleCaptions()` は使用しない（時間ベースの分割は字幕が短くなりすぎるため）
- 各センテンスは、最初の単語の `startMs` から最後の単語の `endMs` まで表示し続ける

## センテンス分割の実装

```tsx
import type { Caption } from "@remotion/captions";

type Sentence = {
  text: string;
  startMs: number;
  endMs: number;
  words: Caption[];
};

function groupBySentence(captions: Caption[]): Sentence[] {
  const sentences: Sentence[] = [];
  let currentWords: Caption[] = [];

  for (const caption of captions) {
    currentWords.push(caption);
    const trimmed = caption.text.trim();
    if (trimmed.endsWith(".") || trimmed.endsWith("?") || trimmed.endsWith("!")) {
      sentences.push({
        text: currentWords.map((w) => w.text).join(""),
        startMs: currentWords[0].startMs,
        endMs: caption.endMs,
        words: currentWords,
      });
      currentWords = [];
    }
  }

  if (currentWords.length > 0) {
    sentences.push({
      text: currentWords.map((w) => w.text).join(""),
      startMs: currentWords[0].startMs,
      endMs: currentWords[currentWords.length - 1].endMs,
      words: currentWords,
    });
  }

  return sentences;
}
```

## 字幕の配置ルール（重要）

- **字幕は動画の直下に配置する**（画面中央や画面下部への固定配置はしない）
- 動画の下端位置を計算し、そこから一定のマージン（40px程度）を空けて字幕を表示する
- `subtitleTop` を親コンポーネントから受け取り、`top` スタイルで位置指定する

```tsx
// 動画の下端位置の計算（index.tsx 側で行う）
const videoHeight = Math.round(1080 * (9 / 16)); // 608px
const videoBottom = Math.round((1920 + videoHeight) / 2); // 1264px
const subtitleTop = videoBottom + 40; // 動画下端 + マージン
```

## 単語ハイライト付きセンテンス表示 + 日本語翻訳

アンサー動画では、英語字幕の下に日本語翻訳を同時表示する（チャレンジ動画では表示しない）。

```tsx
import { loadFont } from "@remotion/google-fonts/ZenKakuGothicNew";

const { fontFamily } = loadFont();

const SentencePage: React.FC<{
  sentence: Sentence;
  highlightColor: string;
  subtitleTop: number;
  translation?: string;
}> = ({ sentence, highlightColor, subtitleTop, translation }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTimeMs = (frame / fps) * 1000;
  const absoluteTimeMs = sentence.startMs + currentTimeMs;

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
        {sentence.words.map((word, i) => {
          const isActive =
            word.startMs <= absoluteTimeMs && word.endMs > absoluteTimeMs;

          return (
            <span
              key={`${word.startMs}-${i}`}
              style={{
                color: isActive ? highlightColor : "#FFFFFF",
              }}
            >
              {word.text}
            </span>
          );
        })}
      </div>
      {translation && (
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            fontFamily,
            color: "#FFFFFF",
            textAlign: "center",
            lineHeight: 1.4,
            marginTop: 16,
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          }}
        >
          {translation}
        </div>
      )}
    </AbsoluteFill>
  );
};
```

## Sequence での表示制御

```tsx
const SubtitleDisplay: React.FC<{
  captions: Caption[];
  highlightColor: string;
  subtitleTop: number;
  translations: string[];
  offsetMs?: number;
}> = ({ captions, highlightColor, subtitleTop, translations, offsetMs = 0 }) => {
  const { fps } = useVideoConfig();
  const sentences = useMemo(() => groupBySentence(captions), [captions]);

  return (
    <AbsoluteFill>
      {sentences.map((sentence, index) => {
        const startFrame = Math.round(((sentence.startMs - offsetMs) / 1000) * fps);
        const durationInFrames = Math.round(
          ((sentence.endMs - sentence.startMs) / 1000) * fps,
        );
        if (durationInFrames <= 0) return null;

        return (
          <Sequence key={index} from={startFrame} durationInFrames={durationInFrames}>
            <SentencePage
              sentence={sentence}
              highlightColor={highlightColor}
              subtitleTop={subtitleTop}
              translation={translations[index]}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
```

## 字幕のスタイルガイド

- **位置**: 動画の直下（`subtitleTop` で指定）
- **英語字幕フォントサイズ**: 60px
- **英語字幕フォントウェイト**: Bold (700)
- **日本語翻訳フォントサイズ**: 44px
- **日本語翻訳フォントウェイト**: 700
- **日本語翻訳フォント**: Zen Kaku Gothic New
- **日本語翻訳マージン**: 英語字幕の下に16px
- **テキストシャドウ**: 背景に対する可読性のため必須（英語・日本語両方）
- **whiteSpace**: `"pre-wrap"` でスペースを保持
- **ハイライト色**: ゴールド（#FFD700）やグリーン（#39E508）など目立つ色
- **通常色**: 白（#FFFFFF）

## offsetMs（アンサー動画の開始オフセット）

- アンサー動画は `answerStartSec` から開始するため、キャプションの絶対タイムスタンプとSequence内の相対時間にズレが生じる
- `offsetMs = answerStartSec * 1000` を渡して、`startFrame` の計算時にオフセットを差し引く
- `SentencePage` 内のハイライト計算（`absoluteTimeMs = sentence.startMs + currentTimeMs`）はSequence内の相対時間 + センテンス開始時間で正しく動作する

## 日本語翻訳の表示ルール

- **アンサー動画のみ**で英語字幕の下に日本語翻訳を表示する（チャレンジ動画では表示しない）
- `translations` プロパティでセンテンス順に日本語訳の配列を渡す
- 翻訳はセンテンスのインデックスに対応（`translations[0]` が最初のセンテンスの翻訳）
- 翻訳が空文字列または未定義の場合は表示しない

## 注意点

- `createTikTokStyleCaptions()` は使用しない。センテンス単位の `groupBySentence()` を使う
- CSS transition は使用禁止。ハイライトの切り替えはフレームベースで即座に行う
- `random()` を使う場合は Remotion の `random()` を使用する
- `whiteSpace: "pre"` または `"pre-wrap"` を必ず設定して、キャプションのスペースを保持する
