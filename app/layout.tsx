import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "SpendSight — Free AI Spend Audit",
  description: "SpendSight helps startups audit AI tool spend and find savings."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

