import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { buildPageMetadata, siteName, siteOrigin } from "@/lib/seo";
import "reveal.js/reveal.css";
import "@/app/globals.css";

export const metadata: Metadata = {
  ...buildPageMetadata({
    description: "Generate and share AI-built storefront landing pages.",
    path: "/",
    title: siteName
  }),
  applicationName: siteName,
  metadataBase: new URL(siteOrigin())
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen antialiased">
          {children}
          <Toaster closeButton position="bottom-center" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
