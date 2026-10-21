import { currentUser } from "@clerk/nextjs/server";

/** Resolve admin access only from the authenticated user's verified primary email. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!adminEmail) {
    return false;
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress;

  return Boolean(
    email?.verification?.status === "verified" &&
      email.emailAddress.trim().toLowerCase() === adminEmail
  );
}
