import { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import type { Caption } from "@remotion/captions";
import { loadFont } from "@remotion/google-fonts/ZenKakuGothicNew";
import type { EnglishListeningChallengeProps } from "./schema";
import { TopBanner } from "./TopBanner";
import { HookRevealSubtitle } from "./HookRevealSubtitle";
import { ScrambledSubtitle } from "./ScrambledSubtitle";
import { SubtitleDisplay, groupBySentence } from "./SubtitleDisplay";
import { WordOrderingChallenge } from "./WordOrderingChallenge";
import { BlankSlots } from "./BlankSlots";

loadFont();

export const calculateMetadata: CalculateMetadataFunction<
  EnglishListeningChallengeProps
> = async ({ props }) => {
  const response = await fetch(staticFile(props.captionsFileName));
  const captions: Caption[] = await response.json();

  const challengeDurationSec = props.hookEndSec - props.hookStartSec;
  const transitionBufferSec = 0.5;
  const answerDurationSec = props.hookEndSec - props.answerStartSec;
  const replayPlaybackRate = 0.75;
  const wordOrderingDurationSec = (challengeDurationSec / replayPlaybackRate) * 3;
  const finalReplayDurationSec = challengeDurationSec;
  const totalDurationSec = challengeDurationSec + transitionBufferSec + answerDurationSec + transitionBufferSec + wordOrderingDurationSec + finalReplayDurationSec;

  return {
    durationInFrames: Math.ceil(totalDurationSec * 30),
    props: {
      ...props,
      captions,
    },
  };
};

export const EnglishListeningChallenge: React.FC<
  EnglishListeningChallengeProps & { captions?: Caption[] }
> = (props) => {
  const { fps } = useVideoConfig();

  const challengeDurationSec = props.hookEndSec - props.hookStartSec;
  const challengeDurationFrames = Math.ceil(challengeDurationSec * fps);
  const transitionBufferFrames = Math.round(0.5 * fps);
  const answerStartFrame = challengeDurationFrames + transitionBufferFrames;

  const answerDurationSec = props.hookEndSec - props.answerStartSec;
  const answerDurationFrames = Math.ceil(answerDurationSec * fps);

  // パート3: 単語並べ替えチャレンジ（チャレンジ動画を0.75倍速で3回リプレイ）
  const replayPlaybackRate = 0.75;
  const singleReplayFrames = Math.ceil((challengeDurationSec / replayPlaybackRate) * fps);
  const wordOrderingDurationFrames = singleReplayFrames * 3;
  const wordOrderingStartFrame = answerStartFrame + answerDurationFrames + transitionBufferFrames;

  // パート4: 通常速度で再生 + 日本語字幕
  const finalReplayStartFrame = wordOrderingStartFrame + wordOrderingDurationFrames;

  const captions = props.captions ?? [];

  // アンサー動画の範囲内のキャプションのみ使用
  const answerStartMs = props.answerStartSec * 1000;
  const answerEndMs = props.hookEndSec * 1000;
  const answerCaptions = captions.filter(
    (c) => c.startMs >= answerStartMs && c.endMs <= answerEndMs,
  );

  const videoSrc = staticFile(props.videoFileName);

  // 動画は16:9、幅1080pxで表示 → 高さ608px
  // 画面中央に配置 → 動画の下端 = (1920 + 608) / 2 = 1264px
  const videoHeight = Math.round(1080 * (9 / 16));
  const videoBottom = Math.round((1920 + videoHeight) / 2);
  const subtitleTop = videoBottom + 40;

  // チャレンジ区間のキャプションを取得
  const hookStartMs = props.hookStartSec * 1000;
  const hookEndMs = props.hookEndSec * 1000;
  const hookCaptions = captions.filter(
    (c) => c.startMs >= hookStartMs && c.endMs <= hookEndMs,
  );

  // 聞き取れる部分と聞き取れない部分に分割
  const revealCaptions = hookCaptions.slice(0, props.hookRevealWords);
  const scrambleCaptions = hookCaptions.slice(props.hookRevealWords);

  // 聞き取れる部分の区間（チャレンジSequence内の相対フレーム）
  const revealEndMs = revealCaptions.length > 0
    ? revealCaptions[revealCaptions.length - 1].endMs
    : hookStartMs;
  const revealDurationFrames = Math.round(((revealEndMs - hookStartMs) / 1000) * fps);

  // スクランブル部分の区間
  const scrambleText = scrambleCaptions.map((c) => c.text.trim()).join(" ");
  const scrambleDurationFrames = challengeDurationFrames - revealDurationFrames;

  // チャレンジ文の単語リストと発話タイミング
  const challengeWords: string[] = [];
  const challengeWordStartFrames: number[] = [];
  for (const c of hookCaptions) {
    const w = c.text.trim();
    if (w.length > 0) {
      challengeWords.push(w);
      // 1回のリプレイ内での発話開始フレーム（0.75倍速を考慮）
      challengeWordStartFrames.push(
        Math.round(((c.startMs - hookStartMs) / 1000 / replayPlaybackRate) * fps),
      );
    }
  }

  // 最後の単語が配置されるフレーム（パート3 Sequence内の相対フレーム）
  const lastWordPlacementFrame = (() => {
    const totalWords = challengeWords.length;
    const totalReplays = 3;
    const wordsPerReplay = Math.ceil(totalWords / totalReplays);
    const lastIndex = totalWords - 1;
    const replayIndex = Math.min(Math.floor(lastIndex / wordsPerReplay), totalReplays - 1);
    const replayStart = replayIndex * singleReplayFrames;
    const speechFrame = lastIndex < challengeWordStartFrames.length ? challengeWordStartFrames[lastIndex] : 0;
    return replayStart + speechFrame;
  })();

  // アンサーキャプションをセンテンス分割
  const answerSentences = useMemo(() => groupBySentence(answerCaptions), [answerCaptions]);

  // 最後のセンテンス（= チャレンジ文）とそれ以外を分離
  const lastSentence = answerSentences.length > 0 ? answerSentences[answerSentences.length - 1] : null;
  const answerCaptionsExceptLast = lastSentence
    ? answerCaptions.filter((c) => c.endMs <= lastSentence.startMs)
    : answerCaptions;
  const translationsExceptLast = props.translations.slice(0, answerSentences.length - 1);
  const lastSentenceTranslation = answerSentences.length > 0
    ? props.translations[answerSentences.length - 1] ?? ""
    : "";

  // 最後のセンテンスのフレーム情報（アンサーSequence内の相対フレーム）
  const lastSentenceStartFrame = lastSentence
    ? Math.round(((lastSentence.startMs - answerStartMs) / 1000) * fps)
    : 0;
  const lastSentenceDurationFrames = lastSentence
    ? Math.round(((lastSentence.endMs - lastSentence.startMs) / 1000) * fps)
    : 0;
  const lastSentenceWords = lastSentence
    ? lastSentence.words.map((w) => w.text.trim()).filter((w) => w.length > 0)
    : [];

  return (
    <AbsoluteFill style={{ backgroundColor: props.backgroundColor }}>
      {/* 上部バナー: 常に表示 */}
      <TopBanner text={props.bannerText} />

      {/* パート1: チャレンジ動画（+ 0.5秒バッファで再生継続、音量フェードアウト） */}
      <Sequence from={0} durationInFrames={challengeDurationFrames + transitionBufferFrames}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <OffthreadVideo
            src={videoSrc}
            startFrom={Math.round(props.hookStartSec * fps)}
            volume={(f) => {
              if (f < challengeDurationFrames) return 1;
              const fadeProgress = (f - challengeDurationFrames) / transitionBufferFrames;
              return Math.max(0, 1 - fadeProgress);
            }}
            style={{
              width: 1080,
              height: "auto",
            }}
          />
        </AbsoluteFill>

        {/* 聞き取れる部分: 通常字幕（ハイライト付き） */}
        {revealDurationFrames > 0 && (
          <Sequence from={0} durationInFrames={revealDurationFrames}>
            <HookRevealSubtitle
              captions={revealCaptions}
              offsetMs={hookStartMs}
              highlightColor={props.highlightColor}
              subtitleTop={subtitleTop}
            />
          </Sequence>
        )}

        {/* 聞き取れない部分: スクランブル記号 */}
        {scrambleDurationFrames > 0 && scrambleText.length > 0 && (
          <Sequence from={revealDurationFrames} durationInFrames={scrambleDurationFrames}>
            <ScrambledSubtitle
              text={scrambleText}
              subtitleTop={subtitleTop}
            />
          </Sequence>
        )}
      </Sequence>

      {/* チャレンジ→アンサーの切り替わりSE（切り替わりをまたいで再生） */}
      <Sequence from={answerStartFrame - Math.round(0.5 * fps)} durationInFrames={Math.ceil(1.03 * fps)}>
        <Audio src={staticFile("whoosh.mp3")} volume={0.8} />
      </Sequence>

      {/* パート2: アンサー動画（+ 0.5秒バッファで再生継続、音量フェードアウト） */}
      <Sequence from={answerStartFrame} durationInFrames={answerDurationFrames + transitionBufferFrames}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <OffthreadVideo
            src={videoSrc}
            startFrom={Math.round(props.answerStartSec * fps)}
            volume={(f) => {
              if (f < answerDurationFrames) return 1;
              const fadeProgress = (f - answerDurationFrames) / transitionBufferFrames;
              return Math.max(0, 1 - fadeProgress);
            }}
            style={{
              width: 1080,
              height: "auto",
            }}
          />
        </AbsoluteFill>

        {/* 最後のセンテンス以外は通常のSubtitleDisplay */}
        <SubtitleDisplay
          captions={answerCaptionsExceptLast}
          highlightColor={props.highlightColor}
          subtitleTop={subtitleTop}
          translations={translationsExceptLast}
          offsetMs={props.answerStartSec * 1000}
        />

        {/* 最後のセンテンス（= チャレンジ文）は下線スロットのみ表示 */}
        {lastSentence && lastSentenceDurationFrames > 0 && (
          <Sequence from={lastSentenceStartFrame} durationInFrames={lastSentenceDurationFrames}>
            <BlankSlots
              words={lastSentenceWords}
              subtitleTop={subtitleTop}
            />
          </Sequence>
        )}
      </Sequence>

      {/* アンサー→単語並べ替えチャレンジの切り替わりSE */}
      <Sequence from={wordOrderingStartFrame - Math.round(0.5 * fps)} durationInFrames={Math.ceil(1.03 * fps)}>
        <Audio src={staticFile("whoosh.mp3")} volume={0.8} />
      </Sequence>

      {/* パート3: 単語並べ替えチャレンジ（チャレンジ動画を3回リプレイ） */}
      <Sequence from={wordOrderingStartFrame} durationInFrames={wordOrderingDurationFrames}>
        {/* 3回のリプレイ動画（0.75倍速） */}
        {[0, 1, 2].map((replayIndex) => (
          <Sequence
            key={`replay-${replayIndex}`}
            from={replayIndex * singleReplayFrames}
            durationInFrames={singleReplayFrames}
          >
            <AbsoluteFill
              style={{
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <OffthreadVideo
                src={videoSrc}
                startFrom={Math.round(props.hookStartSec * fps)}
                playbackRate={replayPlaybackRate}
                style={{
                  width: 1080,
                  height: "auto",
                }}
              />
            </AbsoluteFill>
          </Sequence>
        ))}

        {/* 単語並べ替えオーバーレイ（3回のリプレイ全体にわたって表示） */}
        <WordOrderingChallenge
          words={challengeWords}
          wordStartFrames={challengeWordStartFrames}
          totalDurationFrames={wordOrderingDurationFrames}
          singleReplayFrames={singleReplayFrames}
          highlightColor={props.highlightColor}
          subtitleTop={subtitleTop}
          seed="part3-word-ordering"
        />
      </Sequence>

      {/* 全単語配置完了のレベルアップSE */}
      <Sequence from={wordOrderingStartFrame + lastWordPlacementFrame} durationInFrames={Math.ceil(1.72 * fps)}>
        <Audio src={staticFile("level-up.mp3")} volume={0.8} />
      </Sequence>

      {/* 並べ替え→通常再生の切り替わりSE */}
      <Sequence from={finalReplayStartFrame - Math.round(0.5 * fps)} durationInFrames={Math.ceil(1.03 * fps)}>
        <Audio src={staticFile("whoosh.mp3")} volume={0.8} />
      </Sequence>

      {/* パート4: チャレンジ部分を通常速度で再生 + 日本語字幕 */}
      <Sequence from={finalReplayStartFrame} durationInFrames={challengeDurationFrames}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <OffthreadVideo
            src={videoSrc}
            startFrom={Math.round(props.hookStartSec * fps)}
            endAt={Math.round(props.hookEndSec * fps)}
            style={{
              width: 1080,
              height: "auto",
            }}
          />
        </AbsoluteFill>
        <SubtitleDisplay
          captions={hookCaptions}
          highlightColor={props.highlightColor}
          subtitleTop={subtitleTop}
          translations={[lastSentenceTranslation]}
          offsetMs={hookStartMs}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
