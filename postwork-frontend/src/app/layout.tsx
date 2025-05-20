import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import SidebarAuthWrapper from "@/components/sidebar/SidebarAuthWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Postwork",
  description: "Postwork - система управления проектами",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <body
        className={`${inter.className} antialiased bg-gray-50 dark:bg-gray-950 min-h-screen`}
      >
        <Providers>
          <div className="flex">
            <SidebarAuthWrapper />
            <main className="flex-1 ml-64">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
