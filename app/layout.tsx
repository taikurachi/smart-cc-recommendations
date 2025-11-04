import type { Metadata } from "next";
import { Raleway, Outfit } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import { Toaster } from "react-hot-toast";

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
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: "#fff",
              color: "#363636",
              padding: "16px",
              borderRadius: "8px",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
            loading: {
              iconTheme: {
                primary: "#3b82f6",
                secondary: "#fff",
              },
            },
          }}
        />
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
