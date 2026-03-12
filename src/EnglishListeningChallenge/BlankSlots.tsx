import { AbsoluteFill } from "remotion";

const CHAR_WIDTH = 20;

export const BlankSlots: React.FC<{
  words: string[];
  subtitleTop: number;
}> = ({ words, subtitleTop }) => {
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
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px 12px",
        }}
      >
        {words.map((word, i) => {
          const slotWidth = Math.max(word.length * CHAR_WIDTH, 40);
          return (
            <div
              key={`blank-${i}`}
              style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                minWidth: slotWidth,
                height: 56,
                borderBottom: "3px solid rgba(255,255,255,0.6)",
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
