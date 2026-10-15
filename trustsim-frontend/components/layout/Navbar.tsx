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
} from "lucide-react";

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
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: 64,
          transition: "all 0.25s ease",
          background: scrolled ? "rgba(255, 255, 255, 0.98)" : "#FFFFFF",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: "1px solid #E5E7EB",
          boxShadow: scrolled ? "0 2px 12px rgba(0, 23, 67, 0.05)" : "none",
        }}
      >
        {/* 3-column layout: Left | Center (absolute) | Right */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", height: "100%", width: "100%", position: "relative" }}>

          {/* ═══ 1. BÊN TRÁI: LOGO ═══ */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", flexShrink: 0 }}>
            <Image
              src="/logo/TrustSim-Logo.png"
              alt="TrustSim Logo"
              width={130}
              height={34}
              priority
              style={{ height: 32, width: "auto", objectFit: "contain" }}
            />
          </Link>

          {/* ═══ 2. CENTER (ABSOLUTE): NAV LINKS ═══ */}
          <nav className="desktop-nav" style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>
            {/* Sàn Đấu Giá */}
            <Link
              href="/auctions"
              style={{
                padding: "8px 18px",
                borderRadius: 6,
                color: pathname?.startsWith("/auctions") ? "#E4011E" : "#4B5563",
                background: pathname?.startsWith("/auctions") ? "rgba(228,1,30,0.06)" : "transparent",
                fontSize: 14,
                fontWeight: pathname?.startsWith("/auctions") ? 700 : 500,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 7,
                transition: "color 0.15s, background 0.15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#001743"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = pathname?.startsWith("/auctions") ? "#E4011E" : "#4B5563"; }}
            >
              Sàn Đấu Giá
              {/* Solid live dot */}
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E4011E", flexShrink: 0, display: "inline-block" }} />
            </Link>

            {/* Định Giá AI */}
            <Link
              href="/#ai-valuation"
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                color: "#4B5563",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "color 0.15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#001743"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#4B5563"; }}
            >
              <span style={{ color: "#8B5CF6", display: "flex" }}><Icons.Sparkles /></span>
              Định Giá AI
              {/* Tighter pill badge */}
              <span style={{
                fontSize: 9,
                fontWeight: 800,
                color: "#7C3AED",
                background: "#EDE9FE",
                padding: "1px 4px",
                borderRadius: 99,
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                lineHeight: 1.4,
              }}>MỚI</span>
            </Link>

            {/* Trợ Lý AI Chatbot */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("open_ai_chat"));
                }
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                color: "#001743",
                background: "transparent",
                fontSize: 14,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "color 0.15s, background 0.15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#E4011E";
                e.currentTarget.style.background = "rgba(228,1,30,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#001743";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ color: "#E4011E", display: "flex" }}>
                <Icons.Sparkles />
              </span>
              <span>Trợ Lý AI</span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: "#E4011E",
                  background: "#FEE2E2",
                  padding: "1px 5px",
                  borderRadius: 99,
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                  lineHeight: 1.4,
                }}
              >
                CHAT
              </span>
            </button>

            {/* Hỗ Trợ dropdown */}
            <div ref={supportRef} style={{ position: "relative" }}>
              <button
                onClick={() => setSupportOpen(!supportOpen)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  color: supportOpen ? "#001743" : "#4B5563",
                  background: "transparent",
                  fontSize: 14,
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  transition: "color 0.15s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#001743"; }}
                onMouseLeave={(e) => { if (!supportOpen) e.currentTarget.style.color = "#4B5563"; }}
              >
                Hỗ Trợ
                <span style={{ transform: supportOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", display: "flex" }}>
                  <Icons.ChevronDown />
                </span>
              </button>
              {supportOpen && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  width: 220,
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  padding: 6,
                  boxShadow: "0 10px 28px rgba(0,23,67,0.08)",
                  zIndex: 1001,
                }}>
                  {[
                    { label: "Quy trình 5 bước", desc: "Đấu giá & chuyển nhượng", href: "/#how-it-works" },
                    { label: "Quy chế & Bảo mật", desc: "Cơ chế ký quỹ bảo đảm", href: "/#security" },
                    { label: "Câu hỏi thường gặp", desc: "Giải đáp thắc mắc (FAQ)", href: "/#faq" },
                    { label: "Liên hệ hỗ trợ", desc: "Tổng đài & Tư vấn viên", href: "/#contact" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSupportOpen(false)}
                      style={{ display: "block", padding: "8px 12px", borderRadius: 6, textDecoration: "none", transition: "background 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#F8F9FA"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#001743" }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{item.desc}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* ═══ 3. BÊN PHẢI: ACTIONS & ACCOUNT MENU ═══ */}
          <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            {!user ? (
              <>
                <Link
                  href="/login"
                  style={{
                    padding: "7px 14px",
                    borderRadius: 6,
                    color: "#374151",
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#F3F4F6"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="btn-red"
                  style={{ padding: "7px 16px", fontSize: 14, fontWeight: 700, borderRadius: 6 }}
                >
                  Đăng ký
                </Link>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {/* Compact icon-only: Đăng bán SIM */}
                <Link
                  href="/profile?tab=auctions"
                  title="Đăng bán SIM"
                  aria-label="Đăng bán SIM"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "#001743",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    flexShrink: 0,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#002a6b"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#001743"; }}
                >
                  <Icons.Plus />
                </Link>

                {/* Bell notification */}
                <NotificationDropdown />

                {/* User avatar */}
                <UserMenuDropdown user={user} isAdmin={isAdmin} />
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            style={{
              display: "none",
              background: "none",
              border: "none",
              color: "#001743",
              cursor: "pointer",
              padding: 6,
            }}
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      {/* ═══ MOBILE DRAWER ═══ */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            padding: "84px 24px 32px",
            gap: 10,
          }}
        >
          <Link
            href="/auctions"
            onClick={() => setMobileOpen(false)}
            style={{ padding: "12px 16px", borderRadius: 6, color: "#E4011E", fontSize: 15, fontWeight: 700, textDecoration: "none", background: "rgba(228, 1, 30, 0.06)" }}
          >
            Sàn Đấu Giá Trực Tuyến
          </Link>
          <Link
            href="/#ai-valuation"
            onClick={() => setMobileOpen(false)}
            style={{ padding: "12px 16px", borderRadius: 6, color: "#8B5CF6", fontSize: 15, fontWeight: 700, textDecoration: "none", background: "#F5F3FF" }}
          >
            Định Giá SIM bằng AI
          </Link>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("open_ai_chat"));
              }
            }}
            style={{
              padding: "12px 16px",
              borderRadius: 6,
              color: "#E4011E",
              fontSize: 15,
              fontWeight: 700,
              textAlign: "left",
              background: "#FEF2F2",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Trợ Lý AI (Tư Vấn SIM & Phong Thủy)</span>
            <span style={{ fontSize: 10, padding: "2px 6px", background: "#FEE2E2", borderRadius: 99, color: "#E4011E", fontWeight: 800 }}>CHAT</span>
          </button>
          <Link
            href="/#how-it-works"
            onClick={() => setMobileOpen(false)}
            style={{ padding: "12px 16px", borderRadius: 6, color: "#4B5563", fontSize: 15, fontWeight: 600, textDecoration: "none" }}
          >
            Quy trình & Hướng dẫn
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              style={{ padding: "12px 16px", borderRadius: 6, color: "#001743", fontSize: 15, fontWeight: 700, textDecoration: "none", background: "#F3F4F6" }}
            >
              Trang Quản Trị Hệ Thống
            </Link>
          )}

          <div style={{ height: 1, background: "#E5E7EB", margin: "8px 0" }} />

          {!user ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                style={{ padding: "12px 16px", borderRadius: 6, color: "#001743", fontSize: 15, fontWeight: 700, textAlign: "center", textDecoration: "none", background: "#F3F4F6" }}
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="btn-red"
                style={{ padding: "12px 16px", borderRadius: 6, fontSize: 15, fontWeight: 700, textAlign: "center", justifyContent: "center" }}
              >
                Đăng ký tài khoản
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ padding: "10px 14px", background: "#F8F9FA", borderRadius: 6, fontSize: 13, color: "#001743", fontWeight: 700 }}>
                Xin chào, {user.fullName || user.userName}
              </div>
              <Link href="/profile" onClick={() => setMobileOpen(false)} style={{ padding: "10px 14px", color: "#001743", textDecoration: "none", fontSize: 14 }}>
                Hồ sơ cá nhân & Quản lý ví
              </Link>
              <button
                onClick={async () => {
                  await authService.logout();
                  setMobileOpen(false);
                  window.location.href = "/login";
                }}
                style={{ padding: "10px 14px", color: "#E4011E", background: "none", border: "none", textAlign: "left", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Đăng xuất
              </button>
            </div>
          )}

          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            style={{ position: "absolute", top: 18, right: 18, background: "none", border: "none", color: "#001743", cursor: "pointer", fontSize: 26, padding: 4 }}
          >
            ✕
          </button>
        </div>
      )}

      <style>{`
        .desktop-nav { display: flex !important; }
        .mobile-toggle-btn { display: none !important; }
        @media (max-width: 860px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle-btn { display: flex !important; }
        }
      `}</style>
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
  const displayName = user.fullName || user.userName || "User";
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
                    ADMINISTRATOR
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
                + Nạp
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
              ...(isAdmin ? [{ icon: <Icons.Shield />, label: "Trang Quản trị (Admin)", href: "/admin" }] : []),
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
