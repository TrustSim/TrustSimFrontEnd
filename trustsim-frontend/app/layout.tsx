import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { SessionRefreshManager } from "@/components/auth/SessionRefreshManager";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrustSim – Sàn Đấu Giá Sim Số Hàng Đầu",
  description:
    "TrustSim là nền tảng đấu giá sim số đẹp uy tín, minh bạch và an toàn. Tham gia đấu giá sim số phong thủy, sim VIP với nhiều hình thức đấu giá hiện đại.",
  keywords: ["đấu giá sim", "sim số đẹp", "sim vip", "mua bán sim", "trustsim"],
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased text-gray-900 bg-white">
        <SessionRefreshManager />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
