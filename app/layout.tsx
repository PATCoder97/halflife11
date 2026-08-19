import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: "HalfLife Water Ledger",
  description: "Bảng điểm và sổ nợ nước cho các buổi đấu HalfLife",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">{children}</main>
      </body>
    </html>
  );
}
