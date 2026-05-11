export const LOCAL_AUTH_BYPASS_USER_ID = "local-video-capture-user";

export function isLocalAuthBypassEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.VIBE_STOREFRONT_LOCAL_AUTH_BYPASS === "1"
  );
}
