"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { authService } from "@/services/authService";
import { walletService } from "@/services/walletService";
import { AuthResponseDto } from "@/types/auth";
import { DepositModal } from "@/components/wallet/DepositModal";
import type { WalletDto } from "@/types/wallet";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  getNotificationVisualMeta,
  type NotificationItemDto,
} from "@/services/notificationService";
import { notificationHubService } from "@/services/notificationHubService";
import {
  Bell,
  CheckCheck,
  Check,
  ExternalLink,
  Clock,
  Sparkles as SparklesIcon,
  Gavel,
  Wallet as WalletIcon,
  FileText,
  ShieldCheck,
  ArrowRight,
  Inbox,
  ChevronDown,
  Plus,
  Bot,
  HelpCircle,
  Scale,
  X,
} from "lucide-react";
import QuickAiValuationModal from "@/components/ai/QuickAiValuationModal";

/* ─── 100% Crisp Line SVG Icons ──────────────────────────── */
const Icons = {
  Bell: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Sparkles: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Gavel: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" />
      <path d="m16 16 6-6" />
      <path d="m8 8 6-6" />
      <path d="m9 7 8 8" />
      <path d="m21 11-8-8" />
    </svg>
  ),
  SimCard: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h9l5 5v15H6V2z" />
      <rect x="9" y="9" width="6" height="8" rx="1" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  ),
  Wallet: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  ),
  FileText: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Settings: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  LogOut: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Shield: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

export interface NavbarProps {
  role?: "user" | "admin" | "consultant" | "guest";
}

export const Navbar: React.FC<NavbarProps> = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [quickValuationOpen, setQuickValuationOpen] = useState(false);
  const [user, setUser] = useState<AuthResponseDto | null>(null);
  const pathname = usePathname();
  const supportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener("scroll", onScroll);

    // Đồng bộ trạng thái user khi component mount
    const initialUser = authService.getUser();
    setUser(initialUser);

    // Đồng bộ thông tin avatar mới nhất từ Profile nếu đã đăng nhập
    if (authService.isAuthenticated()) {
      authService.getProfile().then((prof) => {
        if (prof) {
          const cur = authService.getUser();
          if (cur && (cur.avatarImg !== prof.avatarImg || cur.fullName !== prof.fullName)) {
            const updated = {
              ...cur,
              avatarImg: prof.avatarImg || cur.avatarImg,
              fullName: prof.fullName || cur.fullName,
            };
            authService.saveSession(updated);
            setUser(updated);
          }
        }
      }).catch(() => {});
    }

    // Lắng nghe sự kiện đăng nhập / đăng xuất tức thì
    const syncUser = () => setUser(authService.getUser());
    window.addEventListener("trustsim_auth_change", syncUser);
    window.addEventListener("storage", syncUser);

    // Click outside to close support dropdown
    const handleClickOutside = (e: MouseEvent) => {
      if (supportRef.current && !supportRef.current.contains(e.target as Node)) {
        setSupportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("trustsim_auth_change", syncUser);
      window.removeEventListener("storage", syncUser);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

  return (
    <>
      <QuickAiValuationModal
        isOpen={quickValuationOpen}
        onClose={() => setQuickValuationOpen(false)}
      />

      <header
        className={`fixed top-0 left-0 right-0 z-[1000] h-16 transition-all duration-200 border-b ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-slate-200 shadow-xs"
            : "bg-white border-slate-100"
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          {/* ═══ 1. BÊN TRÁI: LOGO ═══ */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 select-none">
            <Image
              src="/logo/TrustSim-Logo.png"
              alt="TrustSim Logo"
              width={130}
              height={34}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>

          {/* ═══ 2. CENTER: NAV LINKS (FLEXIBLE, NO OVERLAP) ═══ */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            {/* Sàn Đấu Giá */}
            <Link
              href="/auctions"
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center gap-2 ${
                pathname?.startsWith("/auctions")
                  ? "bg-rose-50 text-[#E4011E] font-bold"
                  : "text-slate-600 hover:text-[#001743] hover:bg-slate-50"
              }`}
            >
              <span>Sàn Đấu Giá</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E4011E]" />
              </span>
            </Link>

            {/* Định Giá SIM (Mở Cửa Sổ Thẩm Định Tự Động) */}
            <button
              type="button"
              onClick={() => setQuickValuationOpen(true)}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-purple-700 hover:bg-purple-50/70 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
              title="Thẩm định giá trị thị trường của số SIM"
            >
              <SparklesIcon size={14} className="text-purple-600" />
              <span>Định Giá SIM</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 tracking-wider">
                TỰ ĐỘNG
              </span>
            </button>

            {/* Quy Trình 5 Bước */}
            <Link
              href="/#how-it-works"
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#001743] hover:bg-slate-50 transition-all duration-150 flex items-center gap-1.5"
            >
              <span>Quy Trình 5 Bước</span>
            </Link>

            {/* Hỗ Trợ & Cố Vấn Dropdown */}
            <div ref={supportRef} className="relative">
              <button
                type="button"
                onClick={() => setSupportOpen(!supportOpen)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                  supportOpen
                    ? "bg-slate-100 text-[#001743]"
                    : "text-slate-600 hover:text-[#001743] hover:bg-slate-50"
                }`}
              >
                <span>Hỗ Trợ</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 text-slate-400 ${
                    supportOpen ? "rotate-180 text-[#001743]" : ""
                  }`}
                />
              </button>

              {supportOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-80 bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-2xl z-[1001] animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  {/* Shortcut Cố Vấn Trực Tuyến */}
                  <button
                    type="button"
                    onClick={() => {
                      setSupportOpen(false);
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new CustomEvent("open_ai_chat"));
                      }
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-gradient-to-r from-rose-50/70 via-purple-50/50 to-blue-50/40 hover:from-rose-100/80 hover:to-purple-100/70 border border-rose-100/80 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#001743] flex items-center gap-1.5">
                        <SparklesIcon size={13} className="text-[#E4011E]" />
                        <span>Cố Vấn SIM &amp; Phong Thủy</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Tư vấn chọn số hợp tuổi &amp; phát tài 24/7</div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E4011E] text-white">
                      TƯ VẤN
                    </span>
                  </button>

                  <div className="h-px bg-slate-100 my-1" />

                  {/* Danh sách liên kết Pháp Lý & Hỗ Trợ */}
                  <div className="space-y-0.5">
                    <Link
                      href="/regulations"
                      onClick={() => setSupportOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-100 transition-colors">
                        <FileText size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[#001743] group-hover:text-blue-700 transition-colors flex items-center justify-between">
                          <span>Quy Chế Sàn Đấu Giá</span>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                            NĂM 2026
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Văn bản pháp lý &amp; quy định vận hành sàn
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/regulations#escrow"
                      onClick={() => setSupportOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-100 transition-colors">
                        <ShieldCheck size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[#001743] group-hover:text-emerald-700 transition-colors flex items-center justify-between">
                          <span>Bảo Đảm Ký Quỹ 100%</span>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            AN TOÀN
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Tài khoản phong tỏa độc lập &amp; hoàn cọc tức thì
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/regulations#auction-rules"
                      onClick={() => setSupportOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-100 transition-colors">
                        <Gavel size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[#001743] group-hover:text-amber-700 transition-colors">
                          Luật Đấu Giá &amp; Bù Giờ Phút Chót
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Đấu giá tăng, giảm dần &amp; bù giờ tự động
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/regulations#runner-up"
                      onClick={() => setSupportOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-rose-100 transition-colors">
                        <Scale size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[#001743] group-hover:text-rose-700 transition-colors">
                          Chế Tài Phạt Cọc &amp; Quyền Á Quân
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Phạt bùng cọc 50/50 &amp; quyền nhận mua người về nhì
                        </div>
                      </div>
                    </Link>

                    <Link
                      href="/regulations#faq"
                      onClick={() => setSupportOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-slate-200 transition-colors">
                        <HelpCircle size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-[#001743] group-hover:text-slate-900 transition-colors">
                          Giải Đáp Thắc Mắc &amp; Trợ Giúp
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          10 tình huống thực tế &amp; giải quyết tranh chấp
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* Hotline hỗ trợ nhanh */}
                  <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between px-2 text-[11px] text-slate-500">
                    <span>Tổng đài pháp lý:</span>
                    <a
                      href="tel:19006868"
                      className="font-mono font-bold text-[#001743] hover:text-[#E4011E] transition-colors"
                    >
                      1900 6868
                    </a>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* ═══ 3. BÊN PHẢI: ACTIONS & ACCOUNT MENU ═══ */}
          <div className="hidden md:flex items-center gap-2.5">
            {!user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#001743] hover:bg-slate-100 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#E4011E] hover:bg-[#C00119] active:scale-[0.99] text-white transition-all shadow-xs"
                >
                  Đăng ký
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Nút Đăng SIM nổi bật */}
                <Link
                  href="/profile?tab=auctions"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#001743] hover:bg-[#00266B] active:scale-[0.99] text-white text-xs font-bold transition-all shadow-2xs"
                  title="Đăng bán SIM lên sàn đấu giá"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Đăng SIM</span>
                </Link>

                {/* Bell notification */}
                <NotificationDropdown />

                {/* User avatar */}
                <UserMenuDropdown user={user} isAdmin={isAdmin} />
              </div>
            )}
          </div>

          {/* ═══ 4. MOBILE HAMBURGER BUTTON ═══ */}
          <button
            type="button"
            className="md:hidden flex items-center justify-center p-2 text-[#001743] hover:bg-slate-100 rounded-xl transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      {/* ═══ MOBILE DRAWER ═══ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[1050] bg-white flex flex-col p-6 pt-20 gap-3 md:hidden overflow-y-auto animate-in slide-in-from-right duration-200">
          <Link
            href="/auctions"
            onClick={() => setMobileOpen(false)}
            className="p-3.5 rounded-xl bg-rose-50 text-[#E4011E] font-bold text-sm flex items-center justify-between"
          >
            <span>Sàn Đấu Giá Trực Tuyến</span>
            <span className="w-2 h-2 rounded-full bg-[#E4011E] animate-pulse" />
          </Link>

          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              setQuickValuationOpen(true);
            }}
            className="p-3.5 rounded-xl bg-purple-50 text-purple-800 font-bold text-sm text-left flex items-center justify-between cursor-pointer border border-purple-200/60"
          >
            <span className="flex items-center gap-2">
              <SparklesIcon size={16} className="text-purple-600" />
              <span>Thẩm Định Giá SIM Tự Động</span>
            </span>
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">MIỄN PHÍ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("open_ai_chat"));
              }
            }}
            className="p-3.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-800 font-bold text-sm text-left flex items-center justify-between cursor-pointer border border-slate-200"
          >
            <span className="flex items-center gap-2">
              <Bot size={16} className="text-[#E4011E]" />
              <span>Cố Vấn SIM &amp; Phong Thủy</span>
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-[#E4011E]">TƯ VẤN</span>
          </button>

          <div className="pt-2">
            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
              Pháp Lý &amp; Quy Chế Sàn
            </div>
            <div className="space-y-1">
              <Link
                href="/regulations"
                onClick={() => setMobileOpen(false)}
                className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-800 font-semibold text-xs flex items-center justify-between border border-slate-200/70"
              >
                <span className="flex items-center gap-2 font-bold text-[#001743]">
                  <FileText size={15} className="text-blue-700" />
                  <span>Quy Chế Sàn Đấu Giá</span>
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  NĂM 2026
                </span>
              </Link>

              <Link
                href="/regulations#escrow"
                onClick={() => setMobileOpen(false)}
                className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2"
              >
                <ShieldCheck size={15} className="text-emerald-600" />
                <span>Bảo Đảm Ký Quỹ 100%</span>
              </Link>

              <Link
                href="/regulations#auction-rules"
                onClick={() => setMobileOpen(false)}
                className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2"
              >
                <Gavel size={15} className="text-amber-600" />
                <span>Luật Đấu Giá &amp; Bù Giờ Phút Chót</span>
              </Link>

              <Link
                href="/regulations#runner-up"
                onClick={() => setMobileOpen(false)}
                className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2"
              >
                <Scale size={15} className="text-rose-600" />
                <span>Chế Tài Phạt Cọc &amp; Quyền Á Quân</span>
              </Link>

              <Link
                href="/regulations#faq"
                onClick={() => setMobileOpen(false)}
                className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2"
              >
                <HelpCircle size={15} className="text-slate-600" />
                <span>Giải Đáp Thắc Mắc &amp; Trợ Giúp</span>
              </Link>
            </div>
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="p-3.5 rounded-xl bg-[#001743] text-white font-bold text-sm flex items-center justify-between shadow-xs"
            >
              <span>Trang Quản Trị Hệ Thống</span>
              <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded">QUẢN TRỊ VIÊN</span>
            </Link>
          )}

          <div className="h-px bg-slate-100 my-2" />

          {!user ? (
            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="py-3 px-4 rounded-xl text-center text-sm font-bold text-[#001743] bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="py-3 px-4 rounded-xl text-center text-sm font-bold text-white bg-[#E4011E] hover:bg-[#C00119] shadow-xs transition-colors"
              >
                Đăng ký tài khoản
              </Link>
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                Đăng nhập với tư cách: <strong className="text-[#001743] block mt-0.5">{user.fullName || user.userName}</strong>
              </div>
              <Link
                href="/profile?tab=auctions"
                onClick={() => setMobileOpen(false)}
                className="p-3 rounded-xl bg-[#001743] text-white text-xs font-bold text-center block"
              >
                + Đăng bán SIM của bạn
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="p-3 rounded-xl text-slate-700 text-xs font-semibold block hover:bg-slate-50"
              >
                Hồ sơ cá nhân &amp; Quản lý ví
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await authService.logout();
                  setMobileOpen(false);
                  window.location.href = "/login";
                }}
                className="w-full p-3 rounded-xl text-rose-600 text-xs font-bold text-left hover:bg-rose-50 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-[#001743] rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SUBCOMPONENT: Notification Dropdown (Chuông thông báo Realtime)
═══════════════════════════════════════════════════════════════ */
function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / (60 * 1000));
    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return d.toLocaleDateString("vi-VN");
  } catch {
    return dateStr;
  }
}

function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItemDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load real notifications from backend DB
  const loadNotifications = async () => {
    if (!authService.isAuthenticated()) return;
    try {
      setLoading(true);
      const [res, count] = await Promise.all([
        getMyNotifications({ pageIndex: 1, pageSize: 20 }),
        getUnreadNotificationCount().catch(() => 0),
      ]);
      setNotifications(res.items || []);
      const computedUnread = (res.items || []).filter((n) => !n.isRead).length;
      setUnreadCount(typeof count === "number" && count > 0 ? count : computedUnread);
    } catch (err) {
      console.error("[NotificationDropdown] Lỗi tải thông báo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Listen for realtime push notifications via SignalR
  useEffect(() => {
    if (!authService.isAuthenticated()) return;

    const unsubNotif = notificationHubService.subscribeNotification((newNotif) => {
      setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
      setUnreadCount((prev) => prev + 1);
    });

    const unsubCount = notificationHubService.subscribeUnreadCount((count) => {
      setUnreadCount(count);
    });

    return () => {
      unsubNotif();
      unsubCount();
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark all unread notifications as read
  const handleMarkAllAsRead = async () => {
    const unreadList = notifications.filter((n) => !n.isRead);
    if (unreadList.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    await Promise.allSettled(unreadList.map((n) => markNotificationAsRead(n.id)));
  };

  // Click individual notification
  const handleItemClick = async (n: NotificationItemDto) => {
    if (!n.isRead) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      markNotificationAsRead(n.id).catch(() => {});
    }
    setOpen(false);
  };

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Thông báo"
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 relative cursor-pointer ${
          open
            ? "bg-[#001743] text-white shadow-xs"
            : "text-slate-700 hover:text-[#001743] hover:bg-slate-100"
        }`}
      >
        <Bell size={18} />
        {/* Realtime Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E4011E] border-2 border-white text-white text-[10px] font-black font-mono flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-200">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 w-[360px] sm:w-[400px] bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#001743]/5 text-[#001743] flex items-center justify-center shrink-0">
                  <Bell size={15} />
                </div>
                <h3 className="font-bold text-sm text-[#001743]">Thông báo</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/80 font-mono">
                    {unreadCount} mới
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-semibold text-[#001743] hover:text-[#E4011E] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <CheckCheck size={13} />
                  <span>Đọc tất cả</span>
                </button>
              )}
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`flex-1 py-1 px-3 rounded-lg text-center transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-white text-[#001743] font-bold shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("unread")}
                className={`flex-1 py-1 px-3 rounded-lg text-center transition-all cursor-pointer ${
                  activeTab === "unread"
                    ? "bg-white text-[#001743] font-bold shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Chưa đọc ({unreadCount})
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-[#001743] rounded-full animate-spin mx-auto" />
                <p className="text-xs font-medium">Đang đồng bộ thông báo...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-14 px-6 text-center text-slate-400 space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Inbox size={20} />
                </div>
                <h4 className="text-xs font-bold text-slate-700">
                  {activeTab === "unread" ? "Không có tin chưa đọc" : "Chưa có thông báo"}
                </h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                  {activeTab === "unread"
                    ? "Bạn đã đọc hết tất cả các thông báo trong hòm thư."
                    : "Các cập nhật về phiên đấu giá, hoàn cọc và ví điện tử sẽ hiển thị tại đây."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const meta = getNotificationVisualMeta(n.notificationType);
                const ItemContent = (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                      !n.isRead
                        ? "bg-rose-50/20 hover:bg-rose-50/40"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Category Icon */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${meta.iconBg}`}
                    >
                      {meta.category === "auction" ? (
                        <Gavel size={14} />
                      ) : meta.category === "wallet" ? (
                        <WalletIcon size={14} />
                      ) : meta.category === "contract" ? (
                        <FileText size={14} />
                      ) : (
                        <SparklesIcon size={14} />
                      )}
                    </div>

                    {/* Text Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <span
                          className={`text-xs leading-snug line-clamp-1 ${
                            !n.isRead
                              ? "font-bold text-[#001743]"
                              : "font-semibold text-slate-800"
                          }`}
                        >
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#E4011E] ring-2 ring-rose-100 shrink-0 mt-1" />
                        )}
                      </div>

                      {n.content && (
                        <p className="text-[11.5px] text-slate-600 line-clamp-2 leading-relaxed">
                          {n.content}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-mono">
                        <Clock size={11} className="text-slate-400 shrink-0" />
                        <span>{formatRelativeTime(n.createdDate)}</span>
                      </div>
                    </div>
                  </div>
                );

                if (n.actionUrl) {
                  return (
                    <Link
                      key={n.id}
                      href={n.actionUrl}
                      onClick={() => handleItemClick(n)}
                      className="block text-inherit no-underline"
                    >
                      {ItemContent}
                    </Link>
                  );
                }

                return ItemContent;
              })
            )}
          </div>

          {/* Footer View All */}
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100/90 text-center font-bold text-xs text-[#001743] border-t border-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Xem tất cả thông báo ({notifications.length})</span>
            <ArrowRight size={13} className="text-[#001743]" />
          </Link>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUBCOMPONENT: User Menu Dropdown (Menu tài khoản sang trọng)
═══════════════════════════════════════════════════════════════ */
function UserMenuDropdown({ user, isAdmin }: { user: AuthResponseDto; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const displayName = user.fullName || user.userName || "Thành viên";
  const initialChar = displayName.charAt(0).toUpperCase();

  const fetchWallet = () => {
    walletService
      .getMyWallet()
      .then((data) => setWallet(data))
      .catch(() => {
        // Fallback gracefully
      });
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = "/login";
  };

  const availableBalance = wallet?.availableBalance ?? 0;

  return (
    <>
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        onSuccess={() => {
          fetchWallet();
        }}
      />
      <div ref={dropdownRef} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "3px 8px 3px 3px",
            background: "transparent",
            border: "none",
            borderRadius: 99,
            cursor: "pointer",
            color: "#001743",
            fontSize: 13,
            fontWeight: 500,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F3F4F6"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          {/* Circle avatar */}
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: isAdmin ? "#001743" : "#E4011E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 800,
              color: "#FFFFFF",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {user.avatarImg && !user.avatarImg.includes("trustsim.vn") ? (
              <img
                src={user.avatarImg}
                alt={displayName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initialChar
            )}
          </div>
          <span style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </span>
          <span style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", display: "flex", color: "#6B7280" }}>
            <Icons.ChevronDown />
          </span>
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: 240,
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "6px 0",
              boxShadow: "0 10px 30px rgba(0, 23, 67, 0.12)",
              zIndex: 1002,
            }}
          >
            {/* Header Info with Avatar */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: isAdmin ? "#001743" : "#E4011E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  flexShrink: 0,
                  overflow: "hidden",
                  border: "1.5px solid #E5E7EB",
                }}
              >
                {user.avatarImg && !user.avatarImg.includes("trustsim.vn") ? (
                  <img
                    src={user.avatarImg}
                    alt={displayName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  initialChar
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#001743", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.email}
                </div>
                {isAdmin ? (
                  <span style={{ fontSize: 9, background: "#001743", color: "#FFFFFF", padding: "1px 5px", borderRadius: 3, fontWeight: 800, marginTop: 3, display: "inline-block" }}>
                    QUẢN TRỊ VIÊN HỆ THỐNG
                  </span>
                ) : (
                  <span style={{ fontSize: 9, background: "#EFF6FF", color: "#2563EB", padding: "1px 5px", borderRadius: 3, fontWeight: 700, marginTop: 3, display: "inline-block" }}>
                    THÀNH VIÊN ĐỊNH DANH
                  </span>
                )}
              </div>
            </div>

            {/* Quick Wallet Summary Card inside Dropdown */}
            <div style={{ padding: "10px 14px", margin: "6px 8px", background: "#F8F9FA", borderRadius: 6, border: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: "#6B7280", fontWeight: 700, textTransform: "uppercase" }}>Số dư ví</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#E4011E", fontVariantNumeric: "tabular-nums" }}>
                  {availableBalance.toLocaleString("vi-VN")} ₫
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setDepositModalOpen(true);
                }}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  background: "#001743",
                  padding: "4px 9px",
                  borderRadius: 4,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                + Nạp tiền
              </button>
            </div>

          {/* Links List */}
          <div style={{ padding: "4px 8px" }}>
            {[
              { icon: <Icons.User />, label: "Hồ sơ cá nhân", href: "/profile" },
              { icon: <Icons.Gavel />, label: "Đấu giá của tôi", href: "/profile?tab=bids" },
              { icon: <Icons.SimCard />, label: "SIM đã sở hữu", href: "/profile?tab=auctions" },
              { icon: <Icons.Wallet />, label: "Lịch sử biến động ví", href: "/profile?tab=transactions" },
              { icon: <Icons.FileText />, label: "Hợp đồng điện tử", href: "/profile?tab=contracts" },
              { icon: <Icons.Settings />, label: "Cài đặt & Bảo mật", href: "/profile?tab=settings" },
              ...(isAdmin ? [{ icon: <Icons.Shield />, label: "Bảng Điều Khiển Quản Trị", href: "/admin" }] : []),
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 10px",
                  borderRadius: 4,
                  color: "#4B5563",
                  fontSize: 12.5,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F8F9FA";
                  e.currentTarget.style.color = "#001743";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#4B5563";
                }}
              >
                <span style={{ color: "#6B7280" }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div style={{ height: 1, background: "#F3F4F6", margin: "4px 0" }} />

          {/* Logout button */}
          <div style={{ padding: "2px 8px" }}>
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "7px 10px",
                borderRadius: 4,
                color: "#E4011E",
                fontSize: 12.5,
                fontWeight: 700,
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#FEF2F2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Icons.LogOut />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  </>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export const Header = Navbar;
export default Navbar;
