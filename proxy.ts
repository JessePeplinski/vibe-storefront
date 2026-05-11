import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isLocalAuthBypassEnabled } from "@/lib/local-auth-bypass";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    if (isLocalAuthBypassEnabled()) {
      return;
    }

    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"]
};
