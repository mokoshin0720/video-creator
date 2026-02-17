import {
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Img,
} from "remotion";

// The hand's pivot point (where it connects to the body)
// In SVG 4096x4096 space: approximately (1100, 1430)
const PIVOT_X_PCT = 26.9;
const PIVOT_Y_PCT = 34.9;

// Hand clip: extends into the body past the junction outline,
// while staying left of the left eye (eye starts at x=33.6%).
// The clip curves inward near the eye to avoid cutting through it.
const HAND_CLIP =
  "polygon(0% 0%, 33% 0%, 33% 33%, 31% 35.5%, 28% 38%, 24% 42%, 18% 48%, 0% 56%)";

export const WavingCharacter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance: bouncy spring scale
  const entranceScale = spring({
    frame,
    fps,
    config: { damping: 8, stiffness: 100 },
  });

  // Waving starts after entrance settles
  const waveDelay = Math.round(fps * 0.5);
  const waveFrame = Math.max(0, frame - waveDelay);
  const waveDuration = fps * 2.5;
  const waveProgress = Math.min(waveFrame / waveDuration, 1);

  // Oscillating rotation with natural ramp-up and decay
  const waveAmplitude = interpolate(
    waveProgress,
    [0, 0.1, 0.4, 1],
    [0, 15, 10, 0],
    { extrapolateRight: "clamp" }
  );
  const waveFrequency = 4.5;
  const handRotation =
    waveAmplitude * Math.sin(waveProgress * waveFrequency * Math.PI * 2);

  // Subtle body reaction - slight counter-tilt
  const bodyTilt =
    interpolate(waveProgress, [0, 0.1, 0.4, 1], [0, -1.5, -1, 0], {
      extrapolateRight: "clamp",
    }) * Math.sin(waveProgress * waveFrequency * Math.PI * 2);

  const containerSize = 700;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "white",
      }}
    >
      <div
        style={{
          width: containerSize,
          height: containerSize,
          position: "relative",
          transform: `scale(${entranceScale}) rotate(${bodyTilt}deg)`,
          transformOrigin: "50% 75%",
        }}
      >
        {/* Body layer - full character as base */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
          }}
        >
          <Img
            src={staticFile("character.svg")}
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        {/* Hand layer - clipped and animated, overlays on top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transformOrigin: `${PIVOT_X_PCT}% ${PIVOT_Y_PCT}%`,
            transform: `rotate(${handRotation}deg)`,
            clipPath: HAND_CLIP,
            zIndex: 1,
          }}
        >
          <Img
            src={staticFile("character.svg")}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>
    </div>
  );
};
