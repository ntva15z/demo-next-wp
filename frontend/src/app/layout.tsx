import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

/**
 * Primary font for body text
 * Requirements: 9.3 - Use next/font for optimized font loading
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Monospace font for code blocks
 * Requirements: 9.3 - Use next/font for optimized font loading
 */
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NextJS WordPress Headless",
    template: "%s | NextJS WordPress",
  },
  description: "A modern website powered by NextJS and WordPress Headless CMS",
};

/**
 * Root layout component with Header and Footer
 * Requirements: 5.1, 9.3
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
