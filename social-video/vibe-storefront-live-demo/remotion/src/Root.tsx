import "./index.css";
import { Composition } from "remotion";
import {
  videoConfig,
  VibeStorefrontSocialDemo
} from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      component={VibeStorefrontSocialDemo}
      durationInFrames={videoConfig.durationInFrames}
      fps={videoConfig.fps}
      height={videoConfig.height}
      id="VibeStorefrontSocialDemo"
      width={videoConfig.width}
    />
  );
};

