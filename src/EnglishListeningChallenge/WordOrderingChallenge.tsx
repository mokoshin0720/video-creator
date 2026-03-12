import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { random } from "remotion";

function shuffleWithSeed(arr: string[], seed: string): string[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random(`${seed}-shuffle-${i}`) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const SHAKE_DURATION = 20; // フレーム（~0.67秒）
const MISTAKE_GAP = 18; // 最後の正解配置からミスまのフレーム間隔

type MistakeEvent = {
  frame: number;
  slotIndex: number;
  wrongWord: string;
};

export const WordOrderingChallenge: React.FC<{
  words: string[];
  /** 各単語の発話開始フレーム（1回のリプレイ内での相対フレーム） */
  wordStartFrames: number[];
  totalDurationFrames: number;
  singleReplayFrames: number;
  highlightColor: string;
  subtitleTop: number;
  seed: string;
}> = ({
  words,
  wordStartFrames,
  totalDurationFrames,
  singleReplayFrames,
  highlightColor,
  subtitleTop,
  seed,
}) => {
  const frame = useCurrentFrame();
  const highlightDuration = 8; // ~0.27秒

  const totalWords = words.length;
  const totalReplays = Math.max(1, Math.round(totalDurationFrames / singleReplayFrames));
  const wordsPerReplay = Math.ceil(totalWords / totalReplays);

  // 各単語の配置フレームを計算: 発話タイミングに合わせ、1/3ずつリプレイに分配
  const placementFrames = useMemo(() => {
    const frames: number[] = [];

    for (let i = 0; i < totalWords; i++) {
      const replayIndex = Math.min(Math.floor(i / wordsPerReplay), totalReplays - 1);
      const replayStart = replayIndex * singleReplayFrames;
      const speechFrame = i < wordStartFrames.length ? wordStartFrames[i] : 0;
      frames.push(replayStart + speechFrame);
    }
    return frames;
  }, [totalWords, totalReplays, wordsPerReplay, singleReplayFrames, wordStartFrames]);

  // リプレイ1, 2の末尾に間違い選択イベントを生成
  const mistakeEvents = useMemo(() => {
    const events: MistakeEvent[] = [];

    for (let replay = 0; replay < totalReplays - 1; replay++) {
      // このリプレイの最後の正解単語のインデックス
      const lastCorrectIndex = Math.min((replay + 1) * wordsPerReplay - 1, totalWords - 1);
      const lastCorrectFrame = placementFrames[lastCorrectIndex];
      const mistakeFrame = lastCorrectFrame + MISTAKE_GAP;

      // 次のスロット（間違いが表示される場所）
      const nextSlotIndex = lastCorrectIndex + 1;
      if (nextSlotIndex >= totalWords) continue;

      // 正解ではない単語をランダムに選ぶ
      const correctNextWord = words[nextSlotIndex];
      const candidates: string[] = [];
      for (let i = nextSlotIndex + 1; i < totalWords; i++) {
        if (words[i] !== correctNextWord) {
          candidates.push(words[i]);
        }
      }
      const wrongWord =
        candidates.length > 0
          ? candidates[Math.floor(random(`mistake-${replay}-${seed}`) * candidates.length)]
          : words[totalWords - 1];

      events.push({ frame: mistakeFrame, slotIndex: nextSlotIndex, wrongWord });
    }

    return events;
  }, [totalWords, totalReplays, wordsPerReplay, placementFrames, words, seed]);

  // シャッフルされた単語バンクの順序
  const shuffledWords = useMemo(
    () => shuffleWithSeed(words, seed),
    [words, seed],
  );

  // 現在のフレームで配置済みの単語インデックスを計算
  const placedIndices = new Set<number>();
  for (let i = 0; i < totalWords; i++) {
    if (frame >= placementFrames[i]) {
      placedIndices.add(i);
    }
  }

  // 最近配置された単語（ハイライト中）
  const recentlyPlacedIndices = new Set<number>();
  for (let i = 0; i < totalWords; i++) {
    if (
      frame >= placementFrames[i] &&
      frame < placementFrames[i] + highlightDuration
    ) {
      recentlyPlacedIndices.add(i);
    }
  }

  // 現在アクティブな間違いイベントを取得
  const activeMistake = mistakeEvents.find(
    (e) => frame >= e.frame && frame < e.frame + SHAKE_DURATION,
  );

  // シェイクのtranslateX計算（減衰する振動）
  const getShakeX = (mistakeFrame: number): number => {
    const elapsed = frame - mistakeFrame;
    const progress = elapsed / SHAKE_DURATION;
    const decay = 1 - progress;
    return Math.sin(progress * Math.PI * 6) * 10 * decay;
  };

  // 下線の幅を文字数に比例させる
  const charWidth = 20;

  // 間違い選択中に単語バンクで強調する単語を特定
  const mistakeBankWord = activeMistake?.wrongWord ?? null;

  return (
    <AbsoluteFill
      style={{
        top: subtitleTop,
        justifyContent: "flex-start",
        alignItems: "center",
        padding: "0 40px",
      }}
    >
      {/* 上段: 下線スロット */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px 12px",
        }}
      >
        {words.map((word, i) => {
          const isPlaced = placedIndices.has(i);
          const isHighlighted = recentlyPlacedIndices.has(i);
          const slotWidth = Math.max(word.length * charWidth, 40);

          // このスロットで間違いアニメーション中か
          const isMistakeSlot = activeMistake && activeMistake.slotIndex === i;

          return (
            <div
              key={`slot-${i}`}
              style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                minWidth: slotWidth,
                height: 56,
                borderBottom: isPlaced || isMistakeSlot ? "none" : "3px solid rgba(255,255,255,0.6)",
                position: "relative",
                transform: isMistakeSlot ? `translateX(${getShakeX(activeMistake.frame)}px)` : undefined,
              }}
            >
              {isMistakeSlot && (
                <>
                  <span
                    style={{
                      fontSize: 48,
                      fontWeight: "bold",
                      color: "#FF4444",
                      textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                    }}
                  >
                    {activeMistake.wrongWord}
                  </span>
                  {/* バツアイコン */}
                  <div
                    style={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: "#FF0000",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "#FFFFFF",
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </div>
                </>
              )}
              {!isMistakeSlot && isPlaced && (
                <span
                  style={{
                    fontSize: 48,
                    fontWeight: "bold",
                    color: isHighlighted ? highlightColor : "#FFFFFF",
                    textShadow: isHighlighted
                      ? `0 0 12px ${highlightColor}`
                      : "0 2px 8px rgba(0,0,0,0.8)",
                  }}
                >
                  {word}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 下段: シャッフルされた単語バンク */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px",
          marginTop: 60,
        }}
      >
        {shuffledWords.map((word, shuffledIdx) => {
          // 同じ単語が複数ある場合を考慮して元の配列でのインデックスを見つける
          let matchIndex = -1;
          const usedIndices = new Set<number>();
          for (let si = 0; si <= shuffledIdx; si++) {
            for (let oi = 0; oi < words.length; oi++) {
              if (words[oi] === shuffledWords[si] && !usedIndices.has(oi)) {
                if (si === shuffledIdx) {
                  matchIndex = oi;
                }
                usedIndices.add(oi);
                break;
              }
            }
          }
          const isPlaced = matchIndex >= 0 && placedIndices.has(matchIndex);

          // 間違い選択中にバンク内の間違い単語を赤く強調
          const isMistakeHighlight = mistakeBankWord !== null && word === mistakeBankWord && !isPlaced;

          return (
            <div
              key={`bank-${shuffledIdx}`}
              style={{
                fontSize: 40,
                fontWeight: "bold",
                padding: "6px 16px",
                borderRadius: 12,
                background: isMistakeHighlight
                  ? "rgba(255,68,68,0.4)"
                  : "rgba(255,255,255,0.15)",
                color: isMistakeHighlight ? "#FF4444" : "#FFFFFF",
                textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                opacity: isPlaced ? 0 : 1,
                border: isMistakeHighlight ? "2px solid #FF4444" : "2px solid transparent",
              }}
            >
              {word}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
