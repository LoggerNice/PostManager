import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import SidebarAuthWrapper from "@/components/sidebar/SidebarAuthWrapper";
import MainContent from "@/components/layout/MainContent";

const inter = Inter({ 
  subsets: ["latin", "cyrillic"],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: {
    default: "PostManager",
    template: "%s | PostManager"
  },
  description: "PostManager - современная система управления проектами и задачами",
  keywords: ["проекты", "задачи", "управление", "планирование"],
  authors: [{ name: "PostManager Team" }],
  creator: "PostManager Team",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml', sizes: 'any' }
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "PostManager",
    description: "Современная система управления проектами и задачами",
    type: "website",
    locale: "ru_RU",
  },
  robots: {
    index: true,
    follow: true,
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-gray-50 dark:bg-gray-950 transition-colors duration-200`}
        suppressHydrationWarning
      >
        <Providers>
          <div className="flex">
            <SidebarAuthWrapper />
            <MainContent>
              {children}
            </MainContent>
          </div>
        </Providers>
      </body>
    </html>
  );
}
