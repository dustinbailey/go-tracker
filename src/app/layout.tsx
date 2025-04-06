import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "Go Tracker",
  description: "Track your bowel movements",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicons/manifest-icon-192.maskable.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen flex flex-col bg-white dark:bg-black">
          <header className="bg-blue-600 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
              <h1 className="text-2xl font-bold">Go Tracker</h1>
              <nav className="flex gap-4">
                <Link href="/log" className="hover:underline">New Go</Link>
                <Link href="/stats" className="hover:underline">Stats & Records</Link>
              </nav>
            </div>
          </header>
          <main className="flex-grow container mx-auto p-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
