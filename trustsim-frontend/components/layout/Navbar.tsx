"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { authService } from "@/services/authService";
import { AuthResponseDto } from "@/types/auth";

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
    setUser(authService.getUser());

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
        <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", height: "100%", justifyContent: "space-between" }}>
          
          {/* ═══ 1. BÊN TRÁI: LOGO BRAND ═══ */}
          <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
            <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <Image
                src="/logo/TrustSim-Logo.png"
                alt="TrustSim Logo"
                width={130}
                height={34}
                priority
                style={{ height: 32, width: "auto", objectFit: "contain" }}
              />
            </Link>

            {/* ═══ 2. Ở GIỮA: MENU CHÍNH (TỐI GIẢN & CHUẨN UX) ═══ */}
            <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {/* Item 1: Thị Trường */}
              <Link
                href="/market"
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  color: pathname === "/market" ? "#E4011E" : "#4B5563",
                  background: pathname === "/market" ? "rgba(228, 1, 30, 0.06)" : "transparent",
                  fontSize: 14,
                  fontWeight: pathname === "/market" ? 700 : 600,
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (pathname !== "/market") e.currentTarget.style.color = "#001743";
                }}
                onMouseLeave={(e) => {
                  if (pathname !== "/market") e.currentTarget.style.color = "#4B5563";
                }}
              >
                Thị Trường
              </Link>

              {/* Item 2: Sàn Đấu Giá */}
              <Link
                href="/auctions"
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  color: pathname?.startsWith("/auctions") ? "#E4011E" : "#4B5563",
                  background: pathname?.startsWith("/auctions") ? "rgba(228, 1, 30, 0.06)" : "transparent",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#001743";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#4B5563";
                }}
              >
                <span>Sàn Đấu Giá</span>
                {/* Live pulse dot */}
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#E4011E",
                    boxShadow: "0 0 6px #E4011E",
                    display: "inline-block",
                  }}
                />
              </Link>

              {/* Item 3: Định Giá AI */}
              <Link
                href="/#ai-valuation"
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  color: "#4B5563",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#001743";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#4B5563";
                }}
              >
                <span style={{ color: "#8B5CF6" }}><Icons.Sparkles /></span>
                <span>Định Giá AI</span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: "#8B5CF6",
                    background: "#F5F3FF",
                    border: "1px solid #DDD6FE",
                    padding: "1px 5px",
                    borderRadius: 4,
                    textTransform: "uppercase",
                  }}
                >
                  Mới
                </span>
              </Link>

              {/* Item 4: Hỗ Trợ (Dropdown) */}
              <div ref={supportRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setSupportOpen(!supportOpen)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 6,
                    color: supportOpen ? "#001743" : "#4B5563",
                    background: supportOpen ? "#F8F9FA" : "transparent",
                    fontSize: 14,
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>Hỗ Trợ</span>
                  <span style={{ transform: supportOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                    <Icons.ChevronDown />
                  </span>
                </button>

                {supportOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      width: 220,
                      background: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      borderRadius: 8,
                      padding: 6,
                      boxShadow: "0 10px 28px rgba(0, 23, 67, 0.08)",
                      zIndex: 1001,
                    }}
                  >
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
                        style={{
                          display: "block",
                          padding: "8px 12px",
                          borderRadius: 6,
                          textDecoration: "none",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#F8F9FA";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#001743" }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{item.desc}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Portal Shortcut (Chỉ hiển thị nếu là Admin) */}
              {isAdmin && (
                <Link
                  href="/admin"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    color: "#001743",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                    background: "#F3F4F6",
                    border: "1px solid #E5E7EB",
                    marginLeft: 6,
                  }}
                >
                  Quản Trị Hệ Thống
                </Link>
              )}
            </nav>
          </div>

          {/* ═══ 3. BÊN PHẢI: ACTIONS & ACCOUNT MENU ═══ */}
          <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {!user ? (
              <>
                <Link
                  href="/login"
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    color: "#001743",
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F8F9FA";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="btn-red"
                  style={{
                    padding: "8px 18px",
                    fontSize: 14,
                    fontWeight: 700,
                    borderRadius: 6,
                  }}
                >
                  Đăng ký
                </Link>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* 1. Nút Đăng bán SIM */}
                <Link
                  href="/profile?tab=auctions"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    background: "rgba(228, 1, 30, 0.08)",
                    border: "1px solid rgba(228, 1, 30, 0.3)",
                    color: "#E4011E",
                    fontSize: 12.5,
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#E4011E";
                    e.currentTarget.style.color = "#FFFFFF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(228, 1, 30, 0.08)";
                    e.currentTarget.style.color = "#E4011E";
                  }}
                >
                  <Icons.Plus /> Đăng bán SIM
                </Link>

                {/* 2. Icon Thông Báo Realtime (Chuông) */}
                <NotificationDropdown />

                {/* 3. User Menu Dropdown Xịn Sò */}
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
            href="/market"
            onClick={() => setMobileOpen(false)}
            style={{ padding: "12px 16px", borderRadius: 6, color: "#001743", fontSize: 15, fontWeight: 700, textDecoration: "none", background: "#F8F9FA" }}
          >
            Thị Trường SIM
          </Link>
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
function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Thông báo"
        style={{
          width: 36,
          height: 36,
          borderRadius: 6,
          background: open ? "#F8F9FA" : "transparent",
          border: "1px solid #E5E7EB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#001743",
          cursor: "pointer",
          position: "relative",
          transition: "all 0.2s ease",
        }}
      >
        <Icons.Bell />
        {/* Red notification dot badge */}
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#E4011E",
            border: "1.5px solid #FFFFFF",
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 300,
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            boxShadow: "0 10px 30px rgba(0, 23, 67, 0.1)",
            zIndex: 1002,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#001743" }}>Thông báo</span>
            <span style={{ fontSize: 11, color: "#E4011E", fontWeight: 600, cursor: "pointer" }}>Đánh dấu đã đọc</span>
          </div>

          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {[
              { title: "Đặt giá thành công 14.500.000 ₫", time: "15 phút trước", unread: true },
              { title: "Phiên đấu giá #1 sắp kết thúc trong 30p", time: "1 giờ trước", unread: true },
              { title: "Nạp tiền ví thành công +5.000.000 ₫", time: "Hôm qua", unread: false },
            ].map((n, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid #F9FAFB",
                  background: n.unread ? "rgba(228, 1, 30, 0.03)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: n.unread ? 700 : 500, color: "#001743", lineHeight: 1.35 }}>
                  {n.title}
                </div>
                <div style={{ fontSize: 10.5, color: "#9CA3AF", marginTop: 2 }}>{n.time}</div>
              </div>
            ))}
          </div>

          <Link
            href="/profile?tab=bids"
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              padding: "9px",
              textAlign: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#001743",
              background: "#F8F9FA",
              textDecoration: "none",
              borderTop: "1px solid #E5E7EB",
            }}
          >
            Xem tất cả thông báo →
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const displayName = user.fullName || user.userName || "User";
  const initialChar = displayName.charAt(0).toUpperCase();

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

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 10px 4px 4px",
          background: "#F8F9FA",
          border: "1px solid #E5E7EB",
          borderRadius: 6,
          cursor: "pointer",
          color: "#001743",
          fontSize: 13.5,
          fontWeight: 600,
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: isAdmin ? "#001743" : "#E4011E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 800,
            color: "#FFFFFF",
          }}
        >
          {initialChar}
        </div>
        <span style={{ maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayName}
        </span>
        <span style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
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
          {/* Header Info */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#001743" }}>{displayName}</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{user.email}</div>
            {isAdmin ? (
              <span style={{ fontSize: 9.5, background: "#001743", color: "#FFFFFF", padding: "1px 6px", borderRadius: 4, fontWeight: 800, marginTop: 4, display: "inline-block" }}>
                ADMINISTRATOR
              </span>
            ) : (
              <span style={{ fontSize: 9.5, background: "#EFF6FF", color: "#2563EB", padding: "1px 6px", borderRadius: 4, fontWeight: 700, marginTop: 4, display: "inline-block" }}>
                THÀNH VIÊN ĐỊNH DANH
              </span>
            )}
          </div>

          {/* Quick Wallet Summary Card inside Dropdown */}
          <div style={{ padding: "10px 14px", margin: "6px 8px", background: "#F8F9FA", borderRadius: 6, border: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, color: "#6B7280", fontWeight: 700, textTransform: "uppercase" }}>Số dư ví</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#E4011E", fontVariantNumeric: "tabular-nums" }}>
                25.000.000 ₫
              </div>
            </div>
            <Link
              href="/profile?tab=transactions"
              onClick={() => setOpen(false)}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#FFFFFF",
                background: "#001743",
                padding: "3px 8px",
                borderRadius: 4,
                textDecoration: "none",
              }}
            >
              + Nạp
            </Link>
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
