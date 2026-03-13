import { AbsoluteFill, useCurrentFrame } from "remotion";

export const DROP_FRAMES = 24; // フェーズ1: 雫の落下（0.8秒）
const EXPAND_FRAMES = 15; // フェーズ2: 円形展開（0.5秒）
export const ENDING_DURATION_FRAMES = DROP_FRAMES + EXPAND_FRAMES; // 合計39フレーム

export const EndingTransition: React.FC<{
  highlightColor: string;
}> = ({ highlightColor }) => {
  const frame = useCurrentFrame();

  // 画面の対角線長（1080x1920）
  const diagonal = Math.sqrt(1080 * 1080 + 1920 * 1920);

  if (frame < DROP_FRAMES) {
    // フェーズ1: 雫の落下
    const progress = frame / DROP_FRAMES;
    const eased = progress * progress; // easeIn
    const startY = -60;
    const endY = 960; // 画面中央
    const y = startY + (endY - startY) * eased;

    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <svg
          width="40"
          height="56"
          viewBox="0 0 40 56"
          style={{
            position: "absolute",
            top: y,
            left: "50%",
            marginLeft: -20,
          }}
        >
          <path
            d="M20 0 C20 0, 0 30, 0 38 C0 48, 9 56, 20 56 C31 56, 40 48, 40 38 C40 30, 20 0, 20 0 Z"
            fill={highlightColor}
          />
        </svg>
      </AbsoluteFill>
    );
  }

  // フェーズ2: 円形展開
  const expandFrame = frame - DROP_FRAMES;
  const expandProgress = Math.min(expandFrame / EXPAND_FRAMES, 1);
  // easeOut for expansion
  const eased = 1 - (1 - expandProgress) * (1 - expandProgress);
  // scale: 1px radius circle → diagonal length
  const scale = eased * diagonal;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: 2,
          height: 2,
          borderRadius: "50%",
          backgroundColor: highlightColor,
          transform: `scale(${scale})`,
        }}
      />
    </AbsoluteFill>
  );
};
