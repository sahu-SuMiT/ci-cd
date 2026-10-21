import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aura Wishes - Radiate Positivity & Daily Blessings",
  description: "Receive inspiring, personalized positive wishes, affirmations, and mindful blessings to elevate your day.",
  keywords: ["positive wishes", "daily affirmations", "mindfulness", "inspiration", "blessings", "positivity generator"],
  openGraph: {
    title: "Aura Wishes - Positive Daily Blessings",
    description: "Receive uplifting positive wishes, daily affirmations, and inspiring thoughts.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#070913] text-gray-100 selection:bg-purple-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
