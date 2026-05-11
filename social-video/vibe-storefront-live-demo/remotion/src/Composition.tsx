import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import { demoCapture } from "./generated/demo-capture";

const FPS = 30;
const VIDEO_SECONDS = 36;
const SITE_URL = "vibe-storefront.com";
const MUSIC_VOLUME = 0.25;
const SHARE_FULL_PAGE_WIDTH = 1600;
const SHARE_FULL_PAGE_HEIGHT = 1576;

const colors = {
  accent: "#2be7b8",
  background: "#04110e",
  border: "rgba(248, 255, 249, 0.16)",
  highlight: "#f4d35e",
  muted: "#9fb8ad",
  text: "#f8fff9"
};

function seconds(value: number) {
  return Math.round(value * FPS);
}

function cleanShareUrl(url: string) {
  return url.replace(/^https?:\/\//, "");
}

function useFadeSlide(start = 0.1, end = 0.55) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [start * fps, end * fps], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const translateY = interpolate(frame, [start * fps, end * fps], [22, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return { opacity, transform: `translateY(${translateY}px)` };
}

const sceneBackground =
  "linear-gradient(135deg, #04110e, #061f18 58%, #0b1724)";

const UrlPill = ({ compact = false }: { compact?: boolean }) => (
  <div
    style={{
      background: colors.highlight,
      borderRadius: compact ? 13 : 18,
      color: colors.background,
      display: "inline-flex",
      flexShrink: 0,
      fontSize: compact ? 22 : 38,
      fontWeight: 950,
      lineHeight: 1,
      padding: compact ? "14px 18px" : "22px 34px",
      whiteSpace: "nowrap"
    }}
  >
    {SITE_URL}
  </div>
);

const UrlBadge = () => (
  <div
    style={{
      bottom: 52,
      position: "absolute",
      right: 64
    }}
  >
    <UrlPill compact />
  </div>
);

const TitleScene = () => {
  const enter = useFadeSlide(0.08, 0.55);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #04110e 0%, #0b3328 54%, #0b1724 100%)",
        alignItems: "center",
        justifyContent: "center",
        padding: "118px 150px",
        position: "relative"
      }}
    >
      <div
        style={{
          ...enter,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          maxWidth: 1500,
          textAlign: "center",
          width: "100%"
        }}
      >
        <h1
          style={{
            color: colors.text,
            fontSize: 118,
            fontWeight: 950,
            letterSpacing: 0,
            lineHeight: 0.92,
            margin: 0
          }}
        >
          Validate product ideas with a storefront.
        </h1>
        <div
          style={{
            color: "#c7d9d0",
            fontSize: 42,
            fontWeight: 760,
            lineHeight: 1.12,
            maxWidth: 1040
          }}
        >
          Turn a raw product concept into a basic landing page.
        </div>
      </div>
      <UrlBadge />
    </AbsoluteFill>
  );
};

const FramedVideo = ({
  objectFit = "cover",
  scale = 1,
  src,
  trimEndSec,
  trimStartSec,
  translateX = 0,
  translateY = 0
}: {
  objectFit?: "contain" | "cover";
  scale?: number;
  src: string;
  trimEndSec: number;
  trimStartSec: number;
  translateX?: number;
  translateY?: number;
}) => (
  <OffthreadVideo
    muted
    src={staticFile(src)}
    style={{
      display: "block",
      height: "100%",
      objectFit,
      transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
      width: "100%"
    }}
    trimAfter={seconds(trimEndSec)}
    trimBefore={seconds(trimStartSec)}
  />
);

const BrowserFrame = ({
  children,
  height = 876,
  url = "vibe-storefront.com/dashboard",
  width = 1560
}: {
  children: ReactNode;
  height?: number;
  url?: string;
  width?: number;
}) => (
  <div
    style={{
      background: "#eef3f0",
      border: `1px solid ${colors.border}`,
      borderRadius: 24,
      boxShadow: "0 38px 120px rgba(0, 0, 0, 0.34)",
      display: "flex",
      flexDirection: "column",
      height,
      overflow: "hidden",
      width
    }}
  >
    <div
      style={{
        alignItems: "center",
        background: "#dfe8e4",
        display: "flex",
        flexShrink: 0,
        gap: 10,
        height: 58,
        padding: "0 22px"
      }}
    >
      <div style={{ background: "#ff6257", borderRadius: 999, height: 13, width: 13 }} />
      <div style={{ background: "#f8c945", borderRadius: 999, height: 13, width: 13 }} />
      <div style={{ background: "#38c172", borderRadius: 999, height: 13, width: 13 }} />
      <div
        style={{
          background: "#f8fff9",
          borderRadius: 11,
          color: "#315348",
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: 0,
          marginLeft: 18,
          overflow: "hidden",
          padding: "10px 16px",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: 650
        }}
      >
        {url}
      </div>
    </div>
    {children}
  </div>
);

const TextBeatScene = ({
  eyebrow,
  headline,
  tone = "dark"
}: {
  eyebrow: string;
  headline: string;
  tone?: "dark" | "green";
}) => {
  const enter = useFadeSlide(0.08, 0.55);
  const background =
    tone === "green"
      ? "linear-gradient(135deg, #04110e 0%, #0b3328 55%, #10251f 100%)"
      : sceneBackground;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background,
        justifyContent: "center",
        position: "relative"
      }}
    >
      <div
        style={{
          ...enter,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
          height: "100%",
          justifyContent: "center",
          padding: "120px 156px",
          position: "relative",
          textAlign: "center",
          width: "100%"
        }}
      >
        <div
          style={{
            color: colors.accent,
            fontSize: 25,
            fontWeight: 950,
            letterSpacing: 0,
            lineHeight: 1,
            textTransform: "uppercase"
          }}
        >
          {eyebrow}
        </div>
        <h2
          style={{
            color: colors.text,
            fontSize: 106,
            fontWeight: 950,
            letterSpacing: 0,
            lineHeight: 0.93,
            margin: 0,
            maxWidth: 1240
          }}
        >
          {headline}
        </h2>
      </div>
      <UrlBadge />
    </AbsoluteFill>
  );
};

const LocalCaptureVideo = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, seconds(1.7), seconds(4.4)], [1, 1, 1.44], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const translateY = interpolate(frame, [0, seconds(1.7), seconds(4.4)], [0, 0, -20], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <FramedVideo
      objectFit="contain"
      scale={scale}
      src={demoCapture.localDemoVideo}
      trimEndSec={11.2}
      trimStartSec={0.6}
      translateY={translateY}
    />
  );
};

const LocalDemoScene = () => {
  const enter = useFadeSlide(0.08, 0.5);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background: sceneBackground,
        justifyContent: "center"
      }}
    >
      <div
        style={{
          ...enter,
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 20
        }}
      >
        <BrowserFrame height={936} url={demoCapture.localCaptureUrl} width={1560}>
          <div
            style={{
              background: "#f8f7f2",
              flex: 1,
              overflow: "hidden"
            }}
          >
            <LocalCaptureVideo />
          </div>
        </BrowserFrame>
        <div
          style={{
            alignItems: "center",
            background: "rgba(4, 17, 14, 0.86)",
            border: "1px solid rgba(248, 255, 249, 0.18)",
            borderRadius: 18,
            color: colors.text,
            display: "flex",
            gap: 22,
            minHeight: 74,
            padding: "14px 18px",
            width: 1560
          }}
        >
          <UrlPill compact />
          <div
            style={{
              color: colors.text,
              fontSize: 30,
              fontWeight: 900,
              lineHeight: 1.05
            }}
          >
            Same prompt, typed live, then generated through the real dashboard UI.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ProofStrip = () => (
  <div
    style={{
      alignItems: "center",
      background: "rgba(4, 17, 14, 0.86)",
      border: "1px solid rgba(248, 255, 249, 0.18)",
      borderRadius: 18,
      color: colors.text,
      display: "flex",
      gap: 22,
      minHeight: 86,
      padding: "16px 18px",
      width: 1500
    }}
  >
    <UrlPill compact />
    <div
      style={{
        color: colors.text,
        fontSize: 30,
        fontWeight: 900,
        letterSpacing: 0,
        lineHeight: 1.08
      }}
    >
      The generated share page includes the hero, product image, copy, price,
      CTA, and feature details.
    </div>
  </div>
);

const BridgeScene = () => {
  const enter = useFadeSlide(0.08, 0.45);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background: "linear-gradient(135deg, #04110e 0%, #071b15 50%, #061f18 100%)",
        justifyContent: "center",
        position: "relative"
      }}
    >
      <div
        style={{
          ...enter,
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          textAlign: "center"
        }}
      >
        <div
          style={{
            color: colors.text,
            fontSize: 104,
            fontWeight: 950,
            letterSpacing: 0,
            lineHeight: 0.92
          }}
        >
          Two minutes later...
        </div>
        <div
          style={{
            color: colors.muted,
            fontSize: 32,
            fontWeight: 760,
            lineHeight: 1.15
          }}
        >
          The generated share page is ready to open.
        </div>
      </div>
      <UrlBadge />
    </AbsoluteFill>
  );
};

const ScrollingSharePage = () => {
  const frame = useCurrentFrame();
  const browserWidth = 1500;
  const viewportHeight = 790 - 58;
  const renderedHeight = (browserWidth / SHARE_FULL_PAGE_WIDTH) * SHARE_FULL_PAGE_HEIGHT;
  const maxScroll = Math.max(0, renderedHeight - viewportHeight);
  const translateY = interpolate(frame, [seconds(0.9), seconds(5.9)], [0, -maxScroll], {
    easing: Easing.bezier(0.45, 0, 0.25, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <Img
      src={staticFile(demoCapture.liveShareFullPageAsset)}
      style={{
        display: "block",
        height: renderedHeight,
        transform: `translateY(${translateY}px)`,
        width: browserWidth
      }}
    />
  );
};

const LiveStorefrontScene = () => {
  const enter = useFadeSlide(-0.16, 0.4);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background: sceneBackground,
        justifyContent: "center"
      }}
    >
      <div
        style={{
          ...enter,
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          position: "relative"
        }}
      >
        <BrowserFrame height={790} url={cleanShareUrl(demoCapture.shareUrl)} width={1500}>
          <div
            style={{
              background: "#111827",
              flex: 1,
              overflow: "hidden",
              position: "relative"
            }}
          >
            <ScrollingSharePage />
          </div>
        </BrowserFrame>
        <ProofStrip />
      </div>
    </AbsoluteFill>
  );
};

const CtaScene = () => {
  const enter = useFadeSlide(0.08, 0.5);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background: "linear-gradient(135deg, #04110e 0%, #0b3328 55%, #10251f 100%)",
        justifyContent: "center",
        padding: "110px 150px",
        position: "relative"
      }}
    >
      <div
        style={{
          ...enter,
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 30,
          textAlign: "center"
        }}
      >
        <div
          style={{
            color: colors.accent,
            fontSize: 24,
            fontWeight: 950,
            letterSpacing: 0,
            textTransform: "uppercase"
          }}
        >
          Try it today
        </div>
        <div
          style={{
            color: colors.text,
            fontSize: 118,
            fontWeight: 950,
            letterSpacing: 0,
            lineHeight: 0.92,
            maxWidth: 1180
          }}
        >
          Turn one product idea into a storefront.
        </div>
        <UrlPill />
      </div>
    </AbsoluteFill>
  );
};

const MusicBed = () => (
  <Audio
    src={staticFile("audio/holiznacc0-waiting-around-lofi-calm.mp3")}
    volume={(frame) => {
      const fadeIn = interpolate(frame, [0, seconds(1)], [0, MUSIC_VOLUME], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp"
      });
      const fadeOut = interpolate(
        frame,
        [seconds(VIDEO_SECONDS - 1), seconds(VIDEO_SECONDS)],
        [MUSIC_VOLUME, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        }
      );

      return Math.min(fadeIn, fadeOut);
    }}
  />
);

export const VibeStorefrontSocialDemo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <MusicBed />

      <Sequence durationInFrames={seconds(5)} premountFor={seconds(1)}>
        <TitleScene />
      </Sequence>

      <Sequence
        durationInFrames={seconds(4)}
        from={seconds(5)}
        premountFor={seconds(1)}
      >
        <TextBeatScene
          eyebrow="Problem"
          headline="Raw ideas are hard to judge as text."
        />
      </Sequence>

      <Sequence
        durationInFrames={seconds(4)}
        from={seconds(9)}
        premountFor={seconds(1)}
      >
        <TextBeatScene
          eyebrow="Solution"
          headline="A basic storefront makes the idea easier to react to."
          tone="green"
        />
      </Sequence>

      <Sequence
        durationInFrames={seconds(10)}
        from={seconds(13)}
        premountFor={seconds(1)}
      >
        <LocalDemoScene />
      </Sequence>

      <Sequence
        durationInFrames={seconds(3)}
        from={seconds(23)}
        premountFor={seconds(1)}
      >
        <BridgeScene />
      </Sequence>

      <Sequence
        durationInFrames={seconds(7)}
        from={seconds(26)}
        premountFor={seconds(1)}
      >
        <LiveStorefrontScene />
      </Sequence>

      <Sequence
        durationInFrames={seconds(3)}
        from={seconds(33)}
        premountFor={seconds(1)}
      >
        <CtaScene />
      </Sequence>
    </AbsoluteFill>
  );
};

export const videoConfig = {
  durationInFrames: seconds(VIDEO_SECONDS),
  fps: FPS,
  height: 1080,
  width: 1920
};
