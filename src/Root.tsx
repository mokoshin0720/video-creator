import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { WavingCharacter } from "./WavingCharacter";

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
    </>
  );
};
