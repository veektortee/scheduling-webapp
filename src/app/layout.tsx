import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SchedulingProvider } from "@/context/SchedulingContext";
import { SchedulingResultsProvider } from "@/context/SchedulingResultsContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AuthProvider from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Medical Staff Scheduling System",
  description: "Advanced scheduling system for medical staff and shifts",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors overflow-x-hidden`}
      >
        <ThemeProvider>
          <AuthProvider>
            <SchedulingProvider>
              <SchedulingResultsProvider>
                {children}
              </SchedulingResultsProvider>
            </SchedulingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
