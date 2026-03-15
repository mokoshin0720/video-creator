import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { WavingCharacter } from "./WavingCharacter";
import {
  EnglishListeningChallenge,
  calculateMetadata,
} from "./EnglishListeningChallenge";
import { englishListeningChallengeSchema } from "./EnglishListeningChallenge/schema";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={60}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="WavingCharacter"
        component={WavingCharacter}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="EnglishListeningChallenge"
        component={EnglishListeningChallenge}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        schema={englishListeningChallengeSchema}
        defaultProps={{
          audioFileName: "trump-ohio-audio.mp3",
          videoFileName: "trump-ohio-video.mp4",
          captionsFileName: "trump-ohio-captions.json",
          hookStartSec: 70.0,
          hookEndSec: 74.96,
          hookText:
            "I figured we'd be hit a little bit, but uh we were hit probably less than I thought",
          hookRevealWords: 3,
          answerStartSec: 57.84,
          bannerText: "リアル日常英語\n聞き取れる？",
          translations: [
            "47年もの間、彼らに苦しめられた。我々だけじゃない、全世界がだ。",
            "そして我々はやるべきことをやっている。",
            "だから、ちょっとした遠征が必要だったんだ。",
            "でも、うまくいっている。",
            "市場も持ちこたえている。",
            "多少の打撃は覚悟していたが、思ったより影響は少なかった。",
          ],
          backgroundColor: "#000000",
          highlightColor: "#FFD700",
        }}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
