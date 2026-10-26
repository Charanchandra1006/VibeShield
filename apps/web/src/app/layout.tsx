import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

import Providers from "./providers";

export const metadata: Metadata = {
  title: "VibeShield | AI Application Security Platform",
  description: "Detect, explain, prioritize, and remediate vulnerabilities in your applications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="min-h-screen bg-shell font-sans antialiased text-ink selection:bg-primary-soft selection:text-primary">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
