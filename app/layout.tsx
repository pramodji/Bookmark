import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { LoadingProvider } from "@/components/loading-provider";
import { VersionBadge } from "@/components/version-badge";
import { AlarmModal } from "@/components/alarm-modal";
import { SpotlightSearch } from "@/components/spotlight-search";
import { QuickAdd } from "@/components/quick-add";
import { UndoToastContainer } from "@/components/undo-toast";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dashboard - Bookmarks, Notes & Tasks",
  description: "Next-gen personal productivity app",
  icons: { icon: '/favicon.svg' },
};;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <LoadingProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
            <AlarmModal />
            <SpotlightSearch />
            <QuickAdd />
            <UndoToastContainer />
            <KeyboardShortcuts />
            <VersionBadge />
          </LoadingProvider>
        </Providers>
      </body>
    </html>
  );
}
