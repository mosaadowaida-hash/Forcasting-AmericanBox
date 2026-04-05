export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Internal login URL — no external OAuth provider.
// All authentication is handled by the app's own email/password system.
export const getLoginUrl = (returnPath?: string) => {
  if (returnPath) {
    return `/login?returnTo=${encodeURIComponent(returnPath)}`;
  }
  return "/login";
};
