"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { authService } from "@/services/authService";
import { AuthResponseDto } from "@/types/auth";

export interface NavbarProps {
  role?: "user" | "admin" | "consultant" | "guest";
}

export const Navbar: React.FC<NavbarProps> = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AuthResponseDto | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);

    // Đồng bộ trạng thái user khi component mount
    setUser(authService.getUser());

    // Lắng nghe sự kiện đăng nhập / đăng xuất tức thì
    const syncUser = () => setUser(authService.getUser());
    window.addEventListener("trustsim_auth_change", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("trustsim_auth_change", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

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
            {isAdmin && (
              <Link
                href="/admin"
                style={{
                  padding: "7px 14px",
                  borderRadius: 6,
                  color: "#001743",
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",
                  background: "#F3F4F6",
                  border: "1px solid #E5E7EB",
                }}
              >
                Quản Trị Hệ Thống
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
              <UserMenu user={user} />
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
              marginLeft: "auto",
            }}
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
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

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              style={{
                padding: "12px 16px",
                borderRadius: 6,
                color: "#001743",
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
              }}
            >
              Trang Quản Trị (Admin)
            </Link>
          )}

          <div style={{ height: 1, background: "#E5E7EB", margin: "12px 0" }} />

          {!user ? (
            <>
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
            </>
          ) : (
            <>
              <div style={{ padding: "10px 14px", background: "#F8F9FA", borderRadius: 6, fontSize: 13, color: "#001743", fontWeight: 700 }}>
                Xin chào, {user.fullName || user.userName}
              </div>
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                style={{ padding: "10px 14px", color: "#4B5563", textDecoration: "none", fontSize: 14 }}
              >
                Hồ sơ cá nhân
              </Link>
              <button
                onClick={() => {
                  authService.clearSession();
                  setMobileOpen(false);
                  window.location.href = "/login";
                }}
                style={{
                  padding: "10px 14px",
                  color: "#E4011E",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Đăng xuất
              </button>
            </>
          )}

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

function UserMenu({ user }: { user: AuthResponseDto }) {
  const [open, setOpen] = useState(false);
  const displayName = user.fullName || user.userName || "User";
  const initialChar = displayName.charAt(0).toUpperCase();
  const isAdmin = user.role?.toUpperCase() === "ADMIN";

  const handleLogout = () => {
    authService.clearSession();
    window.location.href = "/login";
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "5px 12px 5px 6px",
          background: "#F8F9FA",
          border: "1px solid #E5E7EB",
          borderRadius: 6,
          cursor: "pointer",
          color: "#001743",
          fontSize: 14,
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
        <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayName}
        </span>
        <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 220,
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            padding: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            zIndex: 1001,
          }}
        >
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #F3F4F6", marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#001743" }}>{displayName}</div>
            <div style={{ fontSize: 11, color: "#6B7280" }}>{user.email}</div>
            {isAdmin && (
              <span style={{ fontSize: 10, background: "#FEF2F2", color: "#E4011E", padding: "1px 6px", borderRadius: 4, fontWeight: 700, marginTop: 4, display: "inline-block" }}>
                ADMIN
              </span>
            )}
          </div>

          {[
            { label: "Hồ sơ cá nhân", href: "/profile" },
            { label: "Đấu giá của tôi", href: "/profile?tab=auctions" },
            { label: "Lịch sử đặt giá", href: "/profile?tab=bids" },
            { label: "Lịch sử giao dịch", href: "/profile?tab=transactions" },
            ...(isAdmin ? [{ label: "Trang quản trị", href: "/admin" }] : []),
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
            onClick={handleLogout}
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
