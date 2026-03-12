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
          audioFileName: "hp-library.mp3",
          videoFileName: "hp-library-video.mp4",
          captionsFileName: "hp-library-captions.json",
          hookStartSec: 6.3,
          hookEndSec: 9.1,
          hookText: "I checked this out weeks ago for a bit of light reading.",
          hookRevealWords: 3,
          answerStartSec: 0,
          bannerText: "リアル日常英語\n聞き取れる？",
          translations: [
            "間違った場所を探させてたわ。",
            "なんて馬鹿だったの？",
            "何週間も前にちょっとした軽い読み物として借りたのよ。",
          ],
          backgroundColor: "#000000",
          highlightColor: "#FFD700",
        }}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
