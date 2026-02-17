import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const EndingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pulsing ring effect
  const ringScale = interpolate(
    frame % Math.round(fps * 1.5),
    [0, fps * 1.5],
    [0.8, 1.5],
  );
  const ringOpacity = interpolate(
    frame % Math.round(fps * 1.5),
    [0, fps * 1.5],
    [0.5, 0],
  );

  // Text entrance
  const textEntrance = spring({
    frame,
    fps,
    config: { damping: 15 },
  });

  const textY = interpolate(textEntrance, [0, 1], [60, 0]);

  // URL fade in
  const urlOpacity = interpolate(frame, [0.8 * fps, 1.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center">
      {/* Pulsing ring */}
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.3)",
          transform: `scale(${ringScale})`,
          opacity: ringOpacity,
        }}
      />

      <div className="flex flex-col items-center gap-8">
        <div
          style={{
            opacity: textEntrance,
            transform: `translateY(${textY}px)`,
          }}
        >
          <h1 className="text-white text-7xl font-bold">
            はじめよう！
          </h1>
        </div>

        <div style={{ opacity: urlOpacity }}>
          <p className="text-white/70 text-2xl font-mono">
            remotion.dev
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
