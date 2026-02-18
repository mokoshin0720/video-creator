import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";

const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 8, stiffness: 100 },
  });

  const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1
        style={{
          fontSize: 80,
          fontWeight: "bold",
          color: "white",
          transform: `scale(${scale})`,
          opacity,
          textAlign: "center",
          fontFamily: "sans-serif",
        }}
      >
        Hello, Remotion!
      </h1>
    </AbsoluteFill>
  );
};

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const translateY = interpolate(frame, [0, 1 * fps], [30, 0], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [0, 1 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 120,
      }}
    >
      <p
        style={{
          fontSize: 36,
          color: "rgba(255,255,255,0.85)",
          transform: `translateY(${translateY}px)`,
          opacity,
          fontFamily: "sans-serif",
        }}
      >
        Reactで動画を作ろう
      </p>
    </AbsoluteFill>
  );
};

const AnimatedCircle: React.FC<{
  delay: number;
  color: string;
  x: number;
  y: number;
  size: number;
}> = ({ delay, color, x, y, size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    delay,
    config: { damping: 12, stiffness: 80 },
  });

  const rotation = interpolate(frame, [0, 4 * fps], [0, 360]);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        opacity: 0.6,
      }}
    />
  );
};

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const bgHue = interpolate(frame, [0, durationInFrames], [220, 280]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, hsl(${bgHue}, 70%, 25%), hsl(${bgHue + 40}, 80%, 15%))`,
      }}
    >
      <AnimatedCircle delay={0} color="#6366f1" x={100} y={80} size={200} />
      <AnimatedCircle
        delay={Math.round(0.2 * fps)}
        color="#ec4899"
        x={900}
        y={400}
        size={160}
      />
      <AnimatedCircle
        delay={Math.round(0.4 * fps)}
        color="#14b8a6"
        x={200}
        y={500}
        size={120}
      />
      <AnimatedCircle
        delay={Math.round(0.3 * fps)}
        color="#f59e0b"
        x={1000}
        y={100}
        size={140}
      />

      <Sequence from={Math.round(0.3 * fps)} premountFor={Math.round(1 * fps)}>
        <Title />
      </Sequence>

      <Sequence from={Math.round(1.2 * fps)} premountFor={Math.round(1 * fps)}>
        <Subtitle />
      </Sequence>
    </AbsoluteFill>
  );
};
