import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/ZenKakuGothicNew";

const { fontFamily } = loadFont();

export const TopBanner: React.FC<{
  text?: string;
}> = ({ text = "リアル日常英語\n聞き取れる？" }) => {
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
