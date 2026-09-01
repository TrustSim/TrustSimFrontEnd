"use client";
import React from "react";

const KPI_CARDS = [
  { icon: "🔨", label: "Phiên đang live", value: "24", change: "+3", trend: "up", color: "#4F46E5", glow: "rgba(79,70,229,0.25)" },
  { icon: "👥", label: "Người dùng hoạt động", value: "1,842", change: "+127", trend: "up", color: "#06B6D4", glow: "rgba(6,182,212,0.25)" },
  { icon: "💰", label: "Doanh thu tháng (VNĐ)", value: "2.4 Tỷ", change: "+18%", trend: "up", color: "#A855F7", glow: "rgba(168,85,247,0.25)" },
  { icon: "🚨", label: "Khiếu nại chờ xử lý", value: "7", change: "-2", trend: "down", color: "#F59E0B", glow: "rgba(245,158,11,0.25)" },
  { icon: "🤖", label: "AI Cảnh báo bất thường", value: "3", change: "+1", trend: "neutral", color: "#EF4444", glow: "rgba(239,68,68,0.25)" },
  { icon: "📄", label: "Hợp đồng chờ ký", value: "12", change: "+4", trend: "neutral", color: "#22C55E", glow: "rgba(34,197,94,0.25)" },
];

const RECENT_AUCTIONS = [
  { id: "1", sim: "0901234567", type: "english", status: "live", price: 15_800_000, bids: 28, seller: "TrustSim", timeLeft: "2h 12m" },
  { id: "2", sim: "0777777777", type: "sealed", status: "live", price: 42_000_000, bids: 8, seller: "NguyenA", timeLeft: "4h 00m" },
  { id: "3", sim: "0888555000", type: "dutch", status: "live", price: 8_500_000, bids: 0, seller: "SimVIP", timeLeft: "45m" },
  { id: "8", sim: "0352468024", type: "english", status: "ended", price: 8_500_000, bids: 19, seller: "TrungPT", timeLeft: "Đã kết thúc" },
  { id: "9", sim: "0987654321", type: "sealed", status: "ended", price: 35_000_000, bids: 12, seller: "LuckyNum", timeLeft: "Đã kết thúc" },
];

const ANOMALY_ALERTS = [
  { id: "a1", severity: "high", type: "Bơm giá", desc: "Tài khoản Nguyen*** đặt giá 23 lần trong 5 phút tại phiên #7", time: "12:45", sim: "0777777777" },
  { id: "a2", severity: "medium", type: "Tài khoản liên kết", desc: "Phát hiện 2 tài khoản có cùng IP đặt giá trong phiên #1", time: "11:30", sim: "0901234567" },
  { id: "a3", severity: "low", type: "Giá bất thường", desc: "Giá khởi điểm sim 0909090909 thấp hơn 60% giá thị trường", time: "09:15", sim: "0909090909" },
];

const RECENT_USERS = [
  { name: "Trần Văn B", email: "tranb@gmail.com", kyc: "verified", joined: "22/08/2026", bids: 5 },
  { name: "Lê Thị C", email: "lethic@gmail.com", kyc: "pending", joined: "22/08/2026", bids: 0 },
  { name: "Phạm Đức D", email: "phamd@gmail.com", kyc: "verified", joined: "21/08/2026", bids: 12 },
];

const formatPrice = (p: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(p);

export default function AdminDashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Dashboard</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary" style={{ fontSize: 13, padding: "8px 16px" }}>📥 Xuất báo cáo</button>
          <button className="btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>⚡ Tác vụ nhanh</button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {KPI_CARDS.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              padding: 20,
              borderRadius: 16,
              background: "var(--bg-card)",
              border: `1px solid rgba(255,255,255,0.07)`,
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s ease",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = `${kpi.color}40`;
              (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${kpi.glow}`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${kpi.glow}, transparent 70%)`, pointerEvents: "none" }} />
            <div style={{ fontSize: 22, marginBottom: 12 }}>{kpi.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{kpi.label}</div>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: kpi.trend === "up" ? "#86efac" : kpi.trend === "down" ? "#f87171" : "#94a3b8",
            }}>
              {kpi.trend === "up" ? "↑" : kpi.trend === "down" ? "↓" : "→"} {kpi.change} so với hôm qua
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        {/* Recent Auctions Table */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>🔨 Phiên Đấu Giá Gần Đây</span>
            <a href="/admin/auctions" style={{ fontSize: 12, color: "var(--indigo-light)", textDecoration: "none" }}>Xem tất cả →</a>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["SIM", "Hình thức", "Trạng thái", "Giá hiện tại", "Lượt đặt", "Thời gian", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_AUCTIONS.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "0.08em" }}>
                    {a.sim.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className={`badge badge-${a.type}`} style={{ fontSize: 10 }}>
                      {a.type === "english" ? "Anh" : a.type === "dutch" ? "Hà Lan" : "Bí mật"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className={`badge ${a.status === "live" ? "badge-live" : "badge-ended"}`} style={{ fontSize: 10 }}>
                      {a.status === "live" ? "Live" : "Kết thúc"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "var(--cyan-light)", fontVariantNumeric: "tabular-nums" }}>
                    {formatPrice(a.price)}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)" }}>{a.bids}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)" }}>{a.timeLeft}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <a href={`/admin/auctions?id=${a.id}`} style={{ fontSize: 12, color: "var(--indigo-light)", textDecoration: "none" }}>→</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* AI Anomaly Alerts */}
          <div style={{ background: "var(--bg-card)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(239,68,68,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                🤖 Cảnh Báo AI
                <span style={{ padding: "1px 7px", background: "rgba(239,68,68,0.2)", color: "#f87171", borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{ANOMALY_ALERTS.length}</span>
              </span>
              <a href="/admin/anomalies" style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "none" }}>Chi tiết →</a>
            </div>
            {ANOMALY_ALERTS.map((alert) => {
              const sev = alert.severity === "high" ? { color: "#f87171", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" }
                : alert.severity === "medium" ? { color: "#fde047", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.2)" }
                : { color: "#94a3b8", bg: "transparent", border: "transparent" };
              return (
                <div key={alert.id} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: sev.bg }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: sev.color }}>{alert.type}</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{alert.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: 6 }}>{alert.desc}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "rgba(79,70,229,0.15)", border: "1px solid rgba(79,70,229,0.3)", color: "var(--text-accent)", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                      Điều tra
                    </button>
                    <button style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                      Bỏ qua
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* New Users */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>👥 Người dùng mới</span>
              <a href="/admin/users" style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "none" }}>Xem tất cả →</a>
            </div>
            {RECENT_USERS.map((u) => (
              <div key={u.email} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #4F46E5, #06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {u.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.email}</div>
                </div>
                <span className={`badge ${u.kyc === "verified" ? "badge-success" : "badge-pending"}`} style={{ fontSize: 9 }}>
                  {u.kyc === "verified" ? "✅ KYC" : "⏳ Chờ"}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>⚡ Tác vụ nhanh</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "🚫", label: "Đình chỉ phiên đấu giá", color: "#f87171" },
                { icon: "✅", label: "Duyệt KYC đang chờ (3)", color: "#86efac" },
                { icon: "📧", label: "Gửi thông báo hàng loạt", color: "#a5b4fc" },
                { icon: "📊", label: "Xuất báo cáo ngày", color: "#67e8f9" },
              ].map(({ icon, label, color }) => (
                <button
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "var(--text-secondary)",
                    fontSize: 12,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                    fontFamily: "Inter, sans-serif",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          div[style*="gridTemplateColumns: 1fr 360px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
