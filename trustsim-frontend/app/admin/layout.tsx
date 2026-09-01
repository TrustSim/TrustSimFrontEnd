"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { icon: "📊", label: "Dashboard", href: "/admin" },
  { icon: "👥", label: "Người dùng", href: "/admin/users" },
  { icon: "🔨", label: "Phiên đấu giá", href: "/admin/auctions" },
  { icon: "📱", label: "SIM số", href: "/admin/sims" },
  { icon: "💰", label: "Giao dịch", href: "/admin/transactions" },
  { icon: "📄", label: "Hợp đồng", href: "/admin/contracts" },
  { icon: "🚨", label: "Khiếu nại", href: "/admin/disputes" },
  { icon: "🤖", label: "AI Phát hiện", href: "/admin/anomalies" },
  { icon: "⚙️", label: "Cài đặt hệ thống", href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg-base)" }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 240,
        flexShrink: 0,
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s ease",
        overflow: "hidden",
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          padding: "20px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          whiteSpace: "nowrap",
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, #312E81, #4F46E5, #06B6D4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            color: "#fff",
            fontSize: 14,
            flexShrink: 0,
          }}>TS</div>
          {!collapsed && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>TrustSim</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Admin Panel</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  marginBottom: 2,
                  textDecoration: "none",
                  background: active ? "rgba(79,70,229,0.2)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                  borderLeft: `2px solid ${active ? "var(--indigo-mid)" : "transparent"}`,
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border-subtle)" }}>
          {!collapsed && (
            <div style={{ padding: "10px 12px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#4F46E5,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>A</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Admin</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Superadmin</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 6,
            }}
          >
            {collapsed ? "→" : "← Thu gọn"}
          </button>
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginTop: 4, borderRadius: 10, color: "var(--text-muted)", fontSize: 12, textDecoration: "none" }}
          >
            <span>🏠</span>{!collapsed && "Về trang chủ"}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: collapsed ? 64 : 240, transition: "margin-left 0.3s ease", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Top header */}
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: 56,
          background: "rgba(10,11,26,0.9)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 12,
          justifyContent: "space-between",
        }}>
          <Breadcrumb pathname={pathname} />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 8px rgba(34,197,94,0.6)",
            }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Hệ thống bình thường</span>
            <button style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 6, color: "var(--text-secondary)" }}>
              🔔
              <span style={{ position: "absolute", top: 2, right: 2, width: 8, height: 8, borderRadius: "50%", background: "#ef4444", border: "2px solid var(--bg-base)" }} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function Breadcrumb({ pathname }: { pathname: string }) {
  const parts = pathname.split("/").filter(Boolean);
  const LABELS: Record<string, string> = {
    admin: "Dashboard",
    users: "Người dùng",
    auctions: "Phiên đấu giá",
    sims: "SIM số",
    transactions: "Giao dịch",
    contracts: "Hợp đồng",
    disputes: "Khiếu nại",
    anomalies: "AI Phát hiện",
    settings: "Cài đặt",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
      {parts.map((part, i) => (
        <React.Fragment key={part}>
          {i > 0 && <span style={{ color: "var(--text-muted)" }}>/</span>}
          <span style={{ color: i === parts.length - 1 ? "var(--text-primary)" : "var(--text-muted)", fontWeight: i === parts.length - 1 ? 600 : 400 }}>
            {LABELS[part] ?? part}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}
