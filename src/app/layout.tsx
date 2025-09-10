import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SchedulingProvider } from "@/context/SchedulingContext";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors`}
      >
        <ThemeProvider>
          <AuthProvider>
            <SchedulingProvider>
              {children}
            </SchedulingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
