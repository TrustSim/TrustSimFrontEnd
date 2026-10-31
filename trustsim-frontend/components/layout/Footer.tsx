"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Mail, Phone, ShieldCheck } from "lucide-react";

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Sàn đấu giá",
    links: [
      { label: "Khám phá SIM số", href: "/auctions" },
      { label: "Đấu giá kiểu Anh", href: "/auctions?type=english" },
      { label: "Đấu giá kiểu Hà Lan", href: "/auctions?type=dutch" },
      { label: "Đăng ký bán SIM", href: "/register" },
    ],
  },
  {
    title: "Quy trình & pháp lý",
    links: [
      { label: "Quy chế hoạt động sàn", href: "/regulations" },
      { label: "Bảo đảm ký quỹ 100%", href: "/regulations#escrow" },
      { label: "Luật đấu giá & Anti-sniping", href: "/regulations#auction-rules" },
      { label: "Chế tài & xử lý Á quân", href: "/regulations#runner-up" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Giải đáp thắc mắc (FAQ)", href: "/regulations#faq" },
      { label: "Quy trình sang tên 5 bước", href: "/regulations#handover" },
      { label: "Điều khoản dịch vụ", href: "/regulations" },
      { label: "Giải quyết tranh chấp", href: "/regulations#faq" },
    ],
  },
];

export const Footer: React.FC = () => {
  return (
    <footer className="relative overflow-hidden bg-[#F4F6FC] px-3 sm:px-6 pt-6 pb-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(122,140,255,0.22),transparent)]"
      />
      <div className="relative mx-auto max-w-[1180px] rounded-[32px] border border-white bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,23,67,0.08)] px-6 sm:px-10 pt-10 pb-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          {/* Brand */}
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/logo/TrustSim-Logo.png"
                alt="TrustSim Logo"
                width={130}
                height={34}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Sàn đấu giá SIM số đẹp minh bạch và an toàn. Mỗi phiên đều có ký quỹ độc lập, hợp đồng
              điện tử và quy trình chuyển nhượng rõ ràng.
            </p>
            <div className="mt-5 flex flex-col gap-2 text-sm text-slate-600">
              <a
                href="tel:19006868"
                className="inline-flex items-center gap-2 hover:text-[#001743] transition-colors"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#001743]/[0.06] text-[#001743]">
                  <Phone size={13} />
                </span>
                1900 6868 <span className="text-slate-400">(8:00 – 21:00)</span>
              </a>
              <a
                href="mailto:support@trustsim.vn"
                className="inline-flex items-center gap-2 hover:text-[#001743] transition-colors"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#001743]/[0.06] text-[#001743]">
                  <Mail size={13} />
                </span>
                support@trustsim.vn
              </a>
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h4 className="text-sm font-bold text-[#001743] mb-4">{column.title}</h4>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {column.links.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="group inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-[#001743]"
                    >
                      {item.label}
                      <ArrowUpRight
                        size={13}
                        className="opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-5 text-[13px] text-slate-500">
          <span>© 2026 TrustSim. Toàn bộ bản quyền thuộc về TrustSim Auction Platform.</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
            <ShieldCheck size={14} />
            Hệ thống bảo vệ giao dịch đa tầng đang hoạt động
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
