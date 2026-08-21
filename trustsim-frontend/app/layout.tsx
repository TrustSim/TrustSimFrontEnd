import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
