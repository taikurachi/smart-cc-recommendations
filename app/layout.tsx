import type { Metadata } from "next";
import { Raleway, Outfit } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Credit Card Recommendations",
  description:
    "Analyze your spending and get personalized credit card recommendations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${raleway.variable} ${outfit.variable} antialiased bg-gray-50`}
      >
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
