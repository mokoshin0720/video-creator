import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title entrance with spring
  const titleScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const titleY = interpolate(titleScale, [0, 1], [80, 0]);

  // Subtitle fade in with delay
  const subtitleOpacity = interpolate(
    frame,
    [0.5 * fps, 1.2 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const subtitleY = interpolate(frame, [0.5 * fps, 1.2 * fps], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Decorative line width animation
  const lineWidth = interpolate(frame, [0.3 * fps, 1 * fps], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div
          style={{
            transform: `scale(${titleScale}) translateY(${titleY}px)`,
          }}
        >
          <h1 className="text-white text-8xl font-bold tracking-tight">
            Remotion
          </h1>
        </div>

        <div
          style={{
            width: lineWidth,
            height: 4,
            backgroundColor: "rgba(255,255,255,0.6)",
            borderRadius: 2,
          }}
        />

        <div
          style={{
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          <p className="text-white/80 text-3xl font-light">
            Reactで動画をつくろう
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
