import { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Caption } from "@remotion/captions";
import { loadFont } from "@remotion/google-fonts/ZenKakuGothicNew";

const { fontFamily } = loadFont();

export type Sentence = {
  text: string;
  startMs: number;
  endMs: number;
  words: Caption[];
};

/**
 * キャプションをセンテンス単位（.?!で区切り）にグループ化する
 */
export function groupBySentence(captions: Caption[]): Sentence[] {
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

  // 残りがあればセンテンスとして追加
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

const SentencePage: React.FC<{
  sentence: Sentence;
  highlightColor: string;
  subtitleTop: number;
  translation?: string;
  playbackRate?: number;
}> = ({ sentence, highlightColor, subtitleTop, translation, playbackRate = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTimeMs = (frame / fps) * 1000 * playbackRate;
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

export const SubtitleDisplay: React.FC<{
  captions: Caption[];
  highlightColor: string;
  subtitleTop: number;
  translations: string[];
  offsetMs?: number;
  playbackRate?: number;
}> = ({ captions, highlightColor, subtitleTop, translations, offsetMs = 0, playbackRate = 1 }) => {
  const { fps } = useVideoConfig();

  const sentences = useMemo(() => groupBySentence(captions), [captions]);

  return (
    <AbsoluteFill>
      {sentences.map((sentence, index) => {
        const startFrame = Math.round(((sentence.startMs - offsetMs) / 1000 / playbackRate) * fps);
        const durationInFrames = Math.round(
          ((sentence.endMs - sentence.startMs) / 1000 / playbackRate) * fps,
        );

        if (durationInFrames <= 0) return null;

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={durationInFrames}
          >
            <SentencePage
              sentence={sentence}
              highlightColor={highlightColor}
              subtitleTop={subtitleTop}
              translation={translations[index]}
              playbackRate={playbackRate}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
