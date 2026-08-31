"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface NavbarProps {
  role?: "user" | "admin" | "consultant" | "guest";
}

const Navbar: React.FC<NavbarProps> = ({ role = "guest" }) => {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          transition: "all 0.2s ease",
          background: scrolled ? "rgba(255, 255, 255, 0.96)" : "#FFFFFF",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", height: 60, gap: 32 }}>
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

          {/* Nav Links */}
          <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
            <NavLink href="/auctions">Khám phá SIM</NavLink>
            <NavLink href="/auctions?type=english">Đấu giá kiểu Anh</NavLink>
            <NavLink href="/auctions?type=dutch">Đấu giá kiểu Hà Lan</NavLink>
            <NavLink href="/#how-it-works">Quy trình</NavLink>
            {(role === "admin" || role === "consultant") && (
              <NavLink href="/admin">Quản Trị</NavLink>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {role === "guest" ? (
              <>
                <Link href="/login" className="btn-ghost-nav" style={{ fontWeight: 600, color: "#111827" }}>
                  Đăng nhập
                </Link>
                <Link href="/register" className="btn-red" style={{ padding: "8px 18px", fontSize: 14 }}>
                  Đăng ký
                </Link>
              </>
            ) : (
              <UserMenu role={role} />
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: "none",
              background: "none",
              border: "none",
              color: "#111827",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <MenuIcon />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            padding: "80px 24px 24px",
            gap: 8,
          }}
        >
          <MobileNavLink href="/auctions" onClick={() => setMobileOpen(false)}>Khám phá SIM</MobileNavLink>
          <MobileNavLink href="/auctions?type=english" onClick={() => setMobileOpen(false)}>Đấu giá kiểu Anh</MobileNavLink>
          <MobileNavLink href="/auctions?type=dutch" onClick={() => setMobileOpen(false)}>Đấu giá kiểu Hà Lan</MobileNavLink>
          <MobileNavLink href="/login" onClick={() => setMobileOpen(false)}>Đăng nhập</MobileNavLink>
          <MobileNavLink href="/register" onClick={() => setMobileOpen(false)}>Đăng ký</MobileNavLink>
          <button onClick={() => setMobileOpen(false)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "#111827", cursor: "pointer", fontSize: 24 }}>✕</button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        padding: "6px 12px",
        borderRadius: 4,
        color: "#4B5563",
        fontSize: 14,
        fontWeight: 500,
        textDecoration: "none",
        transition: "color 0.2s, background 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.color = "#111827";
        (e.target as HTMLElement).style.background = "#F3F4F6";
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.color = "#4B5563";
        (e.target as HTMLElement).style.background = "transparent";
      }}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        padding: "12px 16px",
        borderRadius: 6,
        color: "#111827",
        fontSize: 15,
        fontWeight: 600,
        textDecoration: "none",
        background: "#F8F9FA",
        border: "1px solid #E5E7EB",
      }}
    >
      {children}
    </Link>
  );
}

function UserMenu({ role }: { role: string }) {
  const [open, setOpen] = React.useState(false);
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
          color: "#111827",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        <div style={{ width: 26, height: 26, borderRadius: 4, background: "#E4011E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
          U
        </div>
        <span>Tài khoản</span>
        <span style={{ fontSize: 10, opacity: 0.5 }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          width: 200,
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 6,
          padding: 6,
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}>
          {[
            { label: "Hồ sơ", href: "/profile" },
            { label: "Đấu giá của tôi", href: "/profile?tab=auctions" },
            { label: "Lịch sử đặt giá", href: "/profile?tab=bids" },
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
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F3F4F6"; (e.currentTarget as HTMLElement).style.color = "#111827"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "#4B5563"; }}
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
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect y="4" width="22" height="2" rx="1" fill="currentColor" />
      <rect y="10" width="22" height="2" rx="1" fill="currentColor" />
      <rect y="16" width="22" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

export default Navbar;
