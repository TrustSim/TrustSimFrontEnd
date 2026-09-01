"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export interface NavbarProps {
  role?: "user" | "admin" | "consultant" | "guest";
}

export const Navbar: React.FC<NavbarProps> = ({ role = "guest" }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/auctions", label: "Khám phá SIM" },
    { href: "/auctions?type=english", label: "Đấu giá kiểu Anh" },
    { href: "/auctions?type=dutch", label: "Đấu giá kiểu Hà Lan" },
    { href: "/#how-it-works", label: "Quy trình" },
  ];

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          transition: "all 0.25s ease",
          background: scrolled ? "rgba(255, 255, 255, 0.98)" : "#FFFFFF",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: "1px solid #E5E7EB",
          boxShadow: scrolled ? "0 2px 10px rgba(0, 0, 0, 0.04)" : "none",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", height: 64, gap: 32 }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <Image
              src="/logo/TrustSim-Logo.png"
              alt="TrustSim Logo"
              width={132}
              height={36}
              priority
              style={{ height: 34, width: "auto", objectFit: "contain" }}
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
            {navLinks.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 6,
                    color: isActive ? "#E4011E" : "#4B5563",
                    background: isActive ? "rgba(228, 1, 30, 0.06)" : "transparent",
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 500,
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#001743";
                      e.currentTarget.style.background = "#F8F9FA";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#4B5563";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
            {(role === "admin" || role === "consultant") && (
              <Link
                href="/admin"
                style={{
                  padding: "7px 14px",
                  borderRadius: 6,
                  color: "#001743",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  background: "#F3F4F6",
                }}
              >
                Quản Trị
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {role === "guest" ? (
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
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F3F4F6";
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
              <UserMenu role={role} />
            )}
          </div>

          {/* Mobile menu button */}
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
              borderRadius: 6,
            }}
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      {/* Mobile Drawer / Overlay */}
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
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{
                padding: "12px 16px",
                borderRadius: 6,
                color: "#001743",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
                background: "#F8F9FA",
                border: "1px solid #E5E7EB",
              }}
            >
              {item.label}
            </Link>
          ))}

          <div style={{ height: 1, background: "#E5E7EB", margin: "12px 0" }} />

          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            style={{
              padding: "12px 16px",
              borderRadius: 6,
              color: "#001743",
              fontSize: 15,
              fontWeight: 600,
              textAlign: "center",
              textDecoration: "none",
              background: "#F3F4F6",
            }}
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            onClick={() => setMobileOpen(false)}
            className="btn-red"
            style={{
              padding: "12px 16px",
              borderRadius: 6,
              fontSize: 15,
              fontWeight: 700,
              textAlign: "center",
              justifyContent: "center",
            }}
          >
            Đăng ký tài khoản
          </Link>

          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              background: "none",
              border: "none",
              color: "#001743",
              cursor: "pointer",
              fontSize: 26,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>
      )}

      <style>{`
        .desktop-nav { display: flex !important; }
        .mobile-toggle-btn { display: none !important; }
        @media (max-width: 840px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
};

function UserMenu({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          background: "#F8F9FA",
          border: "1px solid #E5E7EB",
          borderRadius: 6,
          cursor: "pointer",
          color: "#001743",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "#E4011E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#FFFFFF",
          }}
        >
          U
        </div>
        <span>Tài khoản</span>
        <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 210,
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            padding: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            zIndex: 1001,
          }}
        >
          {[
            { label: "Hồ sơ cá nhân", href: "/profile" },
            { label: "Đấu giá của tôi", href: "/profile?tab=auctions" },
            { label: "Lịch sử đặt giá", href: "/profile?tab=bids" },
            { label: "Lịch sử giao dịch", href: "/profile?tab=transactions" },
            ...(role === "admin" ? [{ label: "Trang quản trị", href: "/admin" }] : []),
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                padding: "8px 12px",
                borderRadius: 4,
                color: "#4B5563",
                fontSize: 13,
                textDecoration: "none",
                transition: "all 0.15s ease",
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
              {item.label}
            </Link>
          ))}
          <div style={{ height: 1, background: "#E5E7EB", margin: "6px 0" }} />
          <button
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              width: "100%",
              padding: "8px 12px",
              borderRadius: 4,
              color: "#E4011E",
              fontSize: 13,
              fontWeight: 600,
              textAlign: "left",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Đăng xuất
          </button>
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
