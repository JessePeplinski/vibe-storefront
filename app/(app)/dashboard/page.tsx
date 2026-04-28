import { auth } from "@clerk/nextjs/server";
import { StorefrontStudio } from "@/components/storefront-studio";
import { listStorefrontsForOwner } from "@/lib/storefronts";

export default async function DashboardPage() {
  const { userId } = await auth();

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
