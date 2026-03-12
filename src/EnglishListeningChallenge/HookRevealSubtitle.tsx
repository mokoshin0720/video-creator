import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Caption } from "@remotion/captions";

export const HookRevealSubtitle: React.FC<{
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
              style={{
                color: isActive ? highlightColor : "#FFFFFF",
              }}
            >
              {word.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
