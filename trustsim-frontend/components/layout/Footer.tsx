"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

const Footer: React.FC = () => {
  return (
    <footer
      style={{
        background: "#111827",
        borderTop: "1px solid #1F2937",
        padding: "56px 0 32px",
        color: "#9CA3AF",
      }}
    >
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ background: "#FFFFFF", padding: "4px 8px", borderRadius: 4, display: "inline-flex", alignItems: "center" }}>
                <Image
                  src="/logo/TrustSim-Logo.png"
                  alt="TrustSim Logo"
                  width={110}
                  height={28}
                  style={{ height: 24, width: "auto", objectFit: "contain" }}
                />
              </div>
            </div>
            <p style={{ color: "#9CA3AF", fontSize: 14, lineHeight: 1.7, maxWidth: 280 }}>
              Sàn đấu giá SIM số đẹp uy tín, minh bạch và an toàn hàng đầu Việt Nam.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Sản Phẩm
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Khám phá SIM", href: "/auctions" },
                { label: "Đấu giá kiểu Anh", href: "/auctions?type=english" },
                { label: "Đấu giá kiểu Hà Lan", href: "/auctions?type=dutch" },
                { label: "Bán SIM của bạn", href: "/register" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    style={{ color: "#9CA3AF", textDecoration: "none", fontSize: 14, transition: "color 0.2s" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#FFFFFF")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#9CA3AF")}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Hỗ Trợ
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Quy trình đấu giá", href: "/#how-it-works" },
                { label: "Chính sách bảo mật", href: "#" },
                { label: "Điều khoản dịch vụ", href: "#" },
                { label: "Liên hệ hỗ trợ", href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    style={{ color: "#9CA3AF", textDecoration: "none", fontSize: 14, transition: "color 0.2s" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#FFFFFF")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#9CA3AF")}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Về TrustSim
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Giới thiệu sàn", href: "#" },
                { label: "Tin tức thị trường", href: "#" },
                { label: "Đối tác nhà mạng", href: "#" },
                { label: "Tuyển dụng", href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    style={{ color: "#9CA3AF", textDecoration: "none", fontSize: 14, transition: "color 0.2s" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#FFFFFF")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#9CA3AF")}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid #1F2937",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            fontSize: 13,
          }}
        >
          <span>© 2026 TrustSim. Bản quyền thuộc về TrustSim Auction Platform.</span>
          <div style={{ display: "flex", gap: 20 }}>
            <span>Hệ thống bảo vệ giao dịch đa tầng</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
