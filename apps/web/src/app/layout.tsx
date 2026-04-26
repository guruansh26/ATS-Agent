import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATS AI Agent",
  description:
    "AI-powered ATS screening and candidate matching agent for recruiters."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 py-8 text-xs text-slate-500">
          ATS AI Agent · Built for recruiters · {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  );
}
