import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { random } from "remotion";

const SCRAMBLE_CHARS = "#@$%&!?*+~=^<>{}[]|/\\:;¿¡§†‡•°±×÷";

function scrambleWord(word: string, wordIndex: number): string {
  return word
    .split("")
    .map((char, i) => {
      if (char === " ") return " ";
      const randomIndex = Math.floor(
        random(`scramble-0-${wordIndex}-${i}`) * SCRAMBLE_CHARS.length,
      );
      return SCRAMBLE_CHARS[randomIndex];
    })
    .join("");
}

export const ScrambledSubtitle: React.FC<{
  text: string;
  subtitleTop: number;
}> = ({ text, subtitleTop }) => {
  const scrambledText = useMemo(() => {
    return text
      .split(" ")
      .map((word, i) => scrambleWord(word, i))
      .join(" ");
  }, [text]);

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
          fontSize: 56,
          fontWeight: "bold",
          textAlign: "center",
          letterSpacing: 2,
          textShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
          whiteSpace: "pre-wrap",
          color: "white",
          fontFamily: "monospace",
        }}
      >
        {scrambledText}
      </div>
    </AbsoluteFill>
  );
};
