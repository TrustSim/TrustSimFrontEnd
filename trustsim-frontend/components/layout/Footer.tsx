"use client";
import React from "react";
import Link from "next/link";

const Footer: React.FC = () => {
  return (
    <footer
      style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-subtle)",
        padding: "64px 0 32px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle glow */}
      <div style={{
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: 600,
        height: 1,
        background: "linear-gradient(90deg, transparent, #4F46E5, #06B6D4, transparent)",
      }} />

      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #312E81, #4F46E5, #06B6D4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                color: "#fff",
                fontSize: 14,
              }}>TS</div>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#f1f5f9" }}>
                Trust<span className="gradient-text">Sim</span>
              </span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.7, maxWidth: 280 }}>
              Nền tảng đấu giá sim số đẹp hàng đầu Việt Nam. Minh bạch, an toàn, thời gian thực.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              {["fb", "tw", "tg"].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    textDecoration: "none",
                    fontSize: 12,
                    fontWeight: 600,
                    transition: "all 0.2s",
                  }}
                >
                  {icon.toUpperCase()}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <FooterCol title="Nền tảng" links={[
            { label: "Trang chủ", href: "/" },
            { label: "Đấu giá", href: "/auctions" },
            { label: "Đăng sim", href: "/profile?tab=sell" },
            { label: "Hướng dẫn", href: "/guide" },
          ]} />
          <FooterCol title="Hình thức" links={[
            { label: "Đấu giá kiểu Anh", href: "/auctions?type=english" },
            { label: "Đấu giá kiểu Hà Lan", href: "/auctions?type=dutch" },
            { label: "Đấu giá bí mật", href: "/auctions?type=sealed" },
            { label: "So sánh hình thức", href: "/compare" },
          ]} />
          <FooterCol title="Hỗ trợ" links={[
            { label: "Điều khoản dịch vụ", href: "/terms" },
            { label: "Chính sách bảo mật", href: "/privacy" },
            { label: "Liên hệ", href: "/contact" },
            { label: "FAQ", href: "/faq" },
          ]} />
        </div>

        {/* Bottom bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 24,
          borderTop: "1px solid var(--border-subtle)",
        }}>
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
            © 2026 TrustSim. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              Hệ thống hoạt động bình thường
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          footer > div > div:first-child > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
};

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
        {title}
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Footer;
