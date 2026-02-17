import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { TitleScene } from "./scenes/TitleScene";
import { FeaturesScene } from "./scenes/FeaturesScene";
import { EndingScene } from "./scenes/EndingScene";

export const DEMO_FPS = 30;
export const DEMO_SCENE_1 = 3 * DEMO_FPS; // 90 frames
export const DEMO_SCENE_2 = 4 * DEMO_FPS; // 120 frames
export const DEMO_SCENE_3 = 3 * DEMO_FPS; // 90 frames
export const DEMO_TRANSITION = 15; // frames

// Total = 90 + 120 + 90 - 15 - 15 = 270 frames (9 seconds)
export const DEMO_DURATION =
  DEMO_SCENE_1 + DEMO_SCENE_2 + DEMO_SCENE_3 - DEMO_TRANSITION * 2;

export const DemoVideo: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={DEMO_SCENE_1}>
        <TitleScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: DEMO_TRANSITION })}
      />

      <TransitionSeries.Sequence durationInFrames={DEMO_SCENE_2}>
        <FeaturesScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: DEMO_TRANSITION })}
      />

      <TransitionSeries.Sequence durationInFrames={DEMO_SCENE_3}>
        <EndingScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
