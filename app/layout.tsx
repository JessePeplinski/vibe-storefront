import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Vibe Storefront",
  description: "Generate and share AI-built storefront landing pages."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
