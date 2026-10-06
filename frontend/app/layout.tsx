import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { StoreProvider } from "@/store/StoreProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clinical Context Engine",
  description:
    "Synthetic prototype: LLM extracts; deterministic software decides state.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
