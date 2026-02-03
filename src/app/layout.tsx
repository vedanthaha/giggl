import type { Metadata } from "next";
import "./globals.css";
import { PresenceHandler } from "@/components/presence-handler";
import { CallProvider } from "@/context/CallContext";

export const metadata: Metadata = {
  title: "Giggl - Laugh together",
  description: "A modern, secure and  private messaging app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#fffcf9] dark:bg-[#121212]">
        <PresenceHandler />
        <CallProvider>
          <main className="min-h-screen relative overflow-x-hidden">
            {children}
          </main>
        </CallProvider>
      </body>
    </html>
  );
}
