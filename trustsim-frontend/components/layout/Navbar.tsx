"use client";

import React from "react";
import Link from "next/link";

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
          transition: "all 0.3s ease",
          background: scrolled
            ? "rgba(10, 11, 26, 0.85)"
            : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", height: 64, gap: 32 }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #312E81, #4F46E5, #06B6D4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 800,
              color: "#fff",
              boxShadow: "0 4px 14px rgba(79,70,229,0.5)",
            }}>
              TS
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
              Trust<span className="gradient-text">Sim</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
            <NavLink href="/auctions">Đấu Giá</NavLink>
            <NavLink href="/auctions?type=english">Kiểu Anh</NavLink>
            <NavLink href="/auctions?type=dutch">Kiểu Hà Lan</NavLink>
            <NavLink href="/auctions?type=sealed">Bí Mật</NavLink>
            {(role === "admin" || role === "consultant") && (
              <NavLink href="/admin">Quản Trị</NavLink>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {role === "guest" ? (
              <>
                <Link href="/login" className="btn-ghost" style={{ fontSize: 14 }}>
                  Đăng nhập
                </Link>
                <Link href="/register" className="btn-primary" style={{ padding: "8px 20px", fontSize: 13 }}>
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
              color: "var(--text-primary)",
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
            background: "rgba(10,11,26,0.95)",
            backdropFilter: "blur(20px)",
            display: "flex",
            flexDirection: "column",
            padding: "80px 24px 24px",
            gap: 8,
          }}
        >
          <MobileNavLink href="/auctions" onClick={() => setMobileOpen(false)}>Đấu Giá</MobileNavLink>
          <MobileNavLink href="/login" onClick={() => setMobileOpen(false)}>Đăng nhập</MobileNavLink>
          <MobileNavLink href="/register" onClick={() => setMobileOpen(false)}>Đăng ký</MobileNavLink>
          <button onClick={() => setMobileOpen(false)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", fontSize: 24 }}>✕</button>
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
        padding: "6px 14px",
        borderRadius: 8,
        color: "var(--text-secondary)",
        fontSize: 14,
        fontWeight: 500,
        textDecoration: "none",
        transition: "color 0.2s, background 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.color = "var(--text-primary)";
        (e.target as HTMLElement).style.background = "rgba(255,255,255,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.color = "var(--text-secondary)";
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
        padding: "14px 16px",
        borderRadius: 12,
        color: "var(--text-primary)",
        fontSize: 16,
        fontWeight: 600,
        textDecoration: "none",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
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
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10,
          cursor: "pointer",
          color: "var(--text-primary)",
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#4F46E5,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
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
          background: "rgba(15,16,36,0.98)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: 8,
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
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
                borderRadius: 8,
                color: "var(--text-secondary)",
                fontSize: 13,
                textDecoration: "none",
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(79,70,229,0.15)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
            >
              {item.label}
            </Link>
          ))}
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 0" }} />
          <button
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              color: "#f87171",
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
