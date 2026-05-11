import { auth } from "@clerk/nextjs/server";
import { StorefrontStudio } from "@/components/storefront-studio";
import {
  isLocalAuthBypassEnabled,
  LOCAL_AUTH_BYPASS_USER_ID
} from "@/lib/local-auth-bypass";
import { listStorefrontsForOwner } from "@/lib/storefronts";

export default async function DashboardPage() {
  const { userId: clerkUserId } = await auth();
  const userId = clerkUserId ?? (
    isLocalAuthBypassEnabled() ? LOCAL_AUTH_BYPASS_USER_ID : null
  );

  if (!userId) {
    return null;
  }

  const storefronts = await listStorefrontsForOwner(userId);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-background px-4 py-8 sm:px-6 lg:px-8">
      <StorefrontStudio initialStorefronts={storefronts} />
    </main>
  );
}
