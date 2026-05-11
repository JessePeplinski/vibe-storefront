import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import { demoCapture } from "./generated/demo-capture";

const FPS = 30;
const VIDEO_SECONDS = 40;
const KINETIC_VIDEO = "hyperframes/kinetic-scenes.mp4";

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

const FullBleedVideo = ({
  src,
  trimEndSec,
  trimStartSec
}: {
  src: string;
  trimEndSec: number;
  trimStartSec: number;
}) => {
  return (
    <OffthreadVideo
      muted
      src={staticFile(src)}
      style={{
        height: "100%",
        objectFit: "cover",
        width: "100%"
      }}
      trimAfter={seconds(trimEndSec)}
      trimBefore={seconds(trimStartSec)}
    />
  );
};

const BrowserFrame = ({
  children,
  url = "vibe-storefront.com/dashboard"
}: {
  children: ReactNode;
  url?: string;
}) => (
  <div
    style={{
      background: "#eef3f0",
      border: `1px solid ${colors.border}`,
      borderRadius: 24,
      boxShadow: "0 38px 120px rgba(0, 0, 0, 0.34)",
      height: 876,
      overflow: "hidden",
      width: 1560
    }}
  >
    <div
      style={{
        alignItems: "center",
        background: "#dfe8e4",
        display: "flex",
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

const MockDashboardScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = useFadeSlide(0.08, 0.55);
  const typedCharacters = Math.floor(
    interpolate(frame, [0.45 * fps, 4.8 * fps], [0, demoCapture.prompt.length], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    })
  );
  const prompt = demoCapture.prompt.slice(0, typedCharacters);
  const buttonProgress = interpolate(frame, [5.2 * fps, 6.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background:
          "linear-gradient(135deg, #04110e, #061f18 58%, #0b1724)",
        justifyContent: "center"
      }}
    >
      <div style={enter}>
        <BrowserFrame>
          <div
            style={{
              background: "#f8fff9",
              color: "#061f18",
              height: 818,
              padding: "58px 70px"
            }}
          >
            <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
              <div style={{ alignItems: "center", display: "flex", gap: 16 }}>
                <div
                  style={{
                    alignItems: "center",
                    background: "#061f18",
                    borderRadius: 12,
                    color: colors.accent,
                    display: "flex",
                    fontSize: 24,
                    fontWeight: 950,
                    height: 54,
                    justifyContent: "center",
                    width: 54
                  }}
                >
                  VS
                </div>
                <div style={{ fontSize: 28, fontWeight: 950 }}>Vibe Storefront</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 56, gridTemplateColumns: "0.78fr 1.22fr", marginTop: 72 }}>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ color: "#2a6b5a", fontSize: 24, fontWeight: 900 }}>
                  Input
                </div>
                <h1
                  style={{
                    color: "#061f18",
                    fontSize: 84,
                    fontWeight: 950,
                    letterSpacing: 0,
                    lineHeight: 0.92,
                    margin: "18px 0 0"
                  }}
                >
                  Plain-English product idea.
                </h1>
                <p
                  style={{
                    color: "#52675e",
                    fontSize: 29,
                    fontWeight: 650,
                    lineHeight: 1.24,
                    marginTop: 24
                  }}
                >
                  One prompt is enough to create the first visible artifact.
                </p>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #d9e4df",
                  borderRadius: 20,
                  boxShadow: "0 24px 70px rgba(6,31,24,0.1)",
                  padding: 30
                }}
              >
                <div
                  style={{
                    color: "#061f18",
                    fontSize: 26,
                    fontWeight: 950,
                    marginBottom: 16
                  }}
                >
                  Storefront idea
                </div>
                <div
                  style={{
                    background: "#eef5f2",
                    border: "1px solid #d9e4df",
                    borderRadius: 16,
                    color: "#0d211b",
                    fontSize: 27,
                    fontWeight: 700,
                    height: 310,
                    lineHeight: 1.24,
                    overflow: "hidden",
                    padding: 24
                  }}
                >
                  {prompt}
                  <span style={{ color: colors.accent }}>|</span>
                </div>
                <div
                  style={{
                    alignItems: "center",
                    background: colors.background,
                    borderRadius: 15,
                    color: colors.text,
                    display: "flex",
                    fontSize: 25,
                    fontWeight: 950,
                    justifyContent: "center",
                    marginTop: 24,
                    padding: "20px 28px"
                  }}
                >
                  {buttonProgress > 0.45 ? "Generating storefront" : "Generate storefront"}
                </div>
              </div>
            </div>
          </div>
        </BrowserFrame>
      </div>
    </AbsoluteFill>
  );
};

const ProductImageMock = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0.35 * FPS, 1.1 * FPS], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(43,231,184,0.24), rgba(244,211,94,0.14)), #0a2b22",
        border: "1px solid rgba(248,255,249,0.14)",
        borderRadius: 26,
        height: 500,
        opacity: reveal,
        overflow: "hidden",
        position: "relative",
        transform: `scale(${interpolate(reveal, [0, 1], [0.96, 1])})`,
        width: 590
      }}
    >
      <div
        style={{
          background: "#0d211b",
          border: "3px solid rgba(248,255,249,0.18)",
          borderRadius: 28,
          bottom: 88,
          height: 138,
          left: 104,
          position: "absolute",
          width: 382
        }}
      />
      <div
        style={{
          background: "#f4d35e",
          borderRadius: 18,
          bottom: 224,
          height: 170,
          left: 140,
          position: "absolute",
          transform: "rotate(-7deg)",
          width: 96
        }}
      />
      <div
        style={{
          background: colors.accent,
          borderRadius: 18,
          bottom: 224,
          height: 170,
          left: 248,
          position: "absolute",
          transform: "rotate(3deg)",
          width: 96
        }}
      />
      <div
        style={{
          background: "#f8fff9",
          borderRadius: 18,
          bottom: 224,
          height: 170,
          left: 356,
          opacity: 0.94,
          position: "absolute",
          transform: "rotate(8deg)",
          width: 96
        }}
      />
      <div
        style={{
          border: "7px solid rgba(248,255,249,0.82)",
          borderLeftColor: "transparent",
          borderRadius: 999,
          bottom: 72,
          height: 128,
          left: 178,
          position: "absolute",
          transform: "rotate(-12deg)",
          width: 220
        }}
      />
      <div
        style={{
          background: "rgba(4,17,14,0.58)",
          borderRadius: 999,
          bottom: 52,
          filter: "blur(12px)",
          height: 30,
          left: 112,
          position: "absolute",
          width: 366
        }}
      />
    </div>
  );
};

const MockRevealScene = () => {
  const enter = useFadeSlide(0.08, 0.55);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        background:
          "linear-gradient(135deg, #04110e, #061f18 58%, #0b1724)",
        justifyContent: "center"
      }}
    >
      <div style={enter}>
        <BrowserFrame url={cleanShareUrl(demoCapture.shareUrl)}>
          <div
            style={{
              background: "#061f18",
              color: colors.text,
              display: "grid",
              gap: 48,
              gridTemplateColumns: "1fr 0.74fr",
              height: 818,
              padding: "66px 72px"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ color: colors.accent, fontSize: 24, fontWeight: 950 }}>
                Output
              </div>
              <h1
                style={{
                  fontSize: 104,
                  fontWeight: 950,
                  letterSpacing: 0,
                  lineHeight: 0.9,
                  margin: "20px 0 0"
                }}
              >
                Goblin Dock
              </h1>
              <p
                style={{
                  color: "#b7cbc2",
                  fontSize: 35,
                  fontWeight: 720,
                  lineHeight: 1.16,
                  marginTop: 26,
                  maxWidth: 760
                }}
              >
                A premium desk organizer for cables, adapters, sticky notes,
                and half-finished ideas.
              </p>
              <div
                style={{
                  alignItems: "center",
                  display: "flex",
                  gap: 22,
                  marginTop: 44
                }}
              >
                <div
                  style={{
                    background: colors.highlight,
                    borderRadius: 15,
                    color: colors.background,
                    fontSize: 25,
                    fontWeight: 950,
                    padding: "20px 25px"
                  }}
                >
                  Build my dock
                </div>
                <div style={{ color: colors.muted, fontSize: 23, fontWeight: 760 }}>
                  Public URL ready to share.
                </div>
              </div>
            </div>
            <div style={{ alignItems: "center", display: "flex", justifyContent: "center" }}>
              <ProductImageMock />
            </div>
          </div>
        </BrowserFrame>
      </div>
    </AbsoluteFill>
  );
};

export const VibeStorefrontSocialDemo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <Sequence durationInFrames={seconds(5)} premountFor={seconds(1)}>
        <FullBleedVideo src={KINETIC_VIDEO} trimEndSec={5} trimStartSec={0} />
      </Sequence>

      <Sequence
        durationInFrames={seconds(7)}
        from={seconds(5)}
        premountFor={seconds(1)}
      >
        <MockDashboardScene />
      </Sequence>

      <Sequence
        durationInFrames={seconds(11)}
        from={seconds(12)}
        premountFor={seconds(1)}
      >
        <FullBleedVideo src={KINETIC_VIDEO} trimEndSec={23} trimStartSec={12} />
      </Sequence>

      <Sequence
        durationInFrames={seconds(11)}
        from={seconds(23)}
        premountFor={seconds(1)}
      >
        <MockRevealScene />
      </Sequence>

      <Sequence
        durationInFrames={seconds(6)}
        from={seconds(34)}
        premountFor={seconds(1)}
      >
        <FullBleedVideo src={KINETIC_VIDEO} trimEndSec={40} trimStartSec={34} />
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
