"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        background: "#001743",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "56px 0 32px",
        color: "#9CA3AF",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 40,
            marginBottom: 48,
          }}
        >
          {/* Brand */}
          <div style={{ maxWidth: 320 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  background: "#FFFFFF",
                  padding: "4px 8px",
                  borderRadius: 4,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <Image
                  src="/logo/TrustSim-Logo.png"
                  alt="TrustSim Logo"
                  width={110}
                  height={28}
                  style={{ height: 24, width: "auto", objectFit: "contain" }}
                />
              </div>
            </div>
            <p style={{ color: "#9CA3AF", fontSize: 14, lineHeight: 1.7, margin: "0 0 16px" }}>
              Sàn đấu giá SIM số đẹp uy tín, minh bạch và an toàn hàng đầu Việt Nam. Cơ chế bảo vệ giao dịch đa tầng và ký quỹ minh bạch.
            </p>
            <div style={{ fontSize: 13, color: "#6B7280" }}>
              Hotline: <span style={{ color: "#FFFFFF", fontWeight: 600 }}>1900 6868</span> (8:00 - 21:00)
            </div>
          </div>

          {/* Column 1: Sản phẩm */}
          <div>
            <h4
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 16,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Sản Phẩm & Đấu Giá
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Khám phá SIM số", href: "/auctions" },
                { label: "Đấu giá kiểu Anh", href: "/auctions?type=english" },
                { label: "Đấu giá kiểu Hà Lan", href: "/auctions?type=dutch" },
                { label: "Đăng ký bán SIM", href: "/register" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    style={{ color: "#9CA3AF", textDecoration: "none", fontSize: 14, transition: "color 0.2s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#FFFFFF")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9CA3AF")}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Quy trình & An toàn */}
          <div>
            <h4
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 16,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Quy Trình & Pháp Lý
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "5 bước đấu giá SIM", href: "/#how-it-works" },
                { label: "Cơ chế bảo vệ ký quỹ", href: "/#how-it-works" },
                { label: "Hợp đồng điện tử", href: "#" },
                { label: "Quy chế hoạt động sàn", href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    style={{ color: "#9CA3AF", textDecoration: "none", fontSize: 14, transition: "color 0.2s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#FFFFFF")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9CA3AF")}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Hỗ trợ & Về TrustSim */}
          <div>
            <h4
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 16,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Hỗ Trợ Khách Hàng
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Trung tâm trợ giúp", href: "#" },
                { label: "Chính sách bảo mật", href: "#" },
                { label: "Điều khoản dịch vụ", href: "#" },
                { label: "Liên hệ & Khiếu nại", href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    style={{ color: "#9CA3AF", textDecoration: "none", fontSize: 14, transition: "color 0.2s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#FFFFFF")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9CA3AF")}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            fontSize: 13,
          }}
        >
          <span>© 2026 TrustSim. Toàn bộ bản quyền thuộc về TrustSim Auction Platform.</span>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <span style={{ color: "#10B981", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
              Hệ thống bảo vệ giao dịch đa tầng kích hoạt
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
