"use client";
import React from "react";

const MOCK_USERS = [
  { id: "u1", name: "Nguyễn Văn An", email: "nguyenvanan@gmail.com", phone: "0901234567", kyc: "verified", role: "user", status: "active", bids: 47, joined: "01/01/2025", walletBalance: 25_000_000 },
  { id: "u2", name: "Trần Thị Bình", email: "tranbinh@gmail.com", phone: "0912345678", kyc: "pending", role: "user", status: "active", bids: 0, joined: "22/08/2026", walletBalance: 0 },
  { id: "u3", name: "Lê Văn Cường", email: "lecuong@gmail.com", phone: "0933456789", kyc: "verified", role: "consultant", status: "active", bids: 12, joined: "15/03/2025", walletBalance: 5_000_000 },
  { id: "u4", name: "Phạm Hải Đăng", email: "phamdang@gmail.com", phone: "0944567890", kyc: "rejected", role: "user", status: "suspended", bids: 3, joined: "10/06/2025", walletBalance: 500_000 },
  { id: "u5", name: "Hoàng Minh Em", email: "hoanem@gmail.com", phone: "0955678901", kyc: "verified", role: "user", status: "active", bids: 28, joined: "20/07/2025", walletBalance: 12_000_000 },
  { id: "u6", name: "Vũ Thị Phương", email: "vuPhuong@gmail.com", phone: "0966789012", kyc: "pending", role: "user", status: "active", bids: 1, joined: "20/08/2026", walletBalance: 2_000_000 },
  { id: "u7", name: "Admin TrustSim", email: "admin@trustsim.vn", phone: "0999000001", kyc: "verified", role: "admin", status: "active", bids: 0, joined: "01/01/2024", walletBalance: 0 },
];

const KYC_STYLE: Record<string, { color: string; label: string; cls: string }> = {
  verified: { color: "#86efac", label: "✅ Verified", cls: "badge-success" },
  pending: { color: "#fde047", label: "⏳ Chờ duyệt", cls: "badge-pending" },
  rejected: { color: "#f87171", label: "❌ Từ chối", cls: "badge-live" },
};

const ROLE_STYLE: Record<string, { color: string; label: string }> = {
  admin: { color: "#a855f7", label: "Admin" },
  consultant: { color: "#06B6D4", label: "Consultant" },
  user: { color: "#94a3b8", label: "User" },
};

const formatPrice = (p: number) =>
  p === 0 ? "—" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(p);

export default function AdminUsersPage() {
  const [search, setSearch] = React.useState("");
  const [kycFilter, setKycFilter] = React.useState("all");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [selectedUser, setSelectedUser] = React.useState<(typeof MOCK_USERS)[0] | null>(null);

  const filtered = MOCK_USERS.filter((u) => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.includes(search) && !u.phone.includes(search)) return false;
    if (kycFilter !== "all" && u.kyc !== kycFilter) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Quản lý Người Dùng</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{MOCK_USERS.length} tổng · {MOCK_USERS.filter((u) => u.kyc === "pending").length} chờ duyệt KYC</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary" style={{ fontSize: 13, padding: "8px 16px" }}>📥 Xuất CSV</button>
          <button className="btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>+ Tạo tài khoản</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Tìm theo tên, email, SĐT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
          style={{ width: 260 }}
        />
        <FilterSelect value={kycFilter} onChange={setKycFilter} options={[
          { value: "all", label: "KYC: Tất cả" },
          { value: "verified", label: "✅ Verified" },
          { value: "pending", label: "⏳ Chờ duyệt" },
          { value: "rejected", label: "❌ Từ chối" },
        ]} />
        <FilterSelect value={roleFilter} onChange={setRoleFilter} options={[
          { value: "all", label: "Role: Tất cả" },
          { value: "user", label: "User" },
          { value: "consultant", label: "Consultant" },
          { value: "admin", label: "Admin" },
        ]} />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={[
          { value: "all", label: "Trạng thái: Tất cả" },
          { value: "active", label: "✅ Hoạt động" },
          { value: "suspended", label: "🚫 Đình chỉ" },
        ]} />
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                {["Người dùng", "Liên hệ", "KYC", "Role", "Trạng thái", "Số dư ví", "Lượt đặt", "Ngày tham gia", ""].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={() => setSelectedUser(u)}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #4F46E5, #06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {u.name[0]}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{u.email}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.phone}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className={`badge ${KYC_STYLE[u.kyc].cls}`} style={{ fontSize: 10 }}>
                      {KYC_STYLE[u.kyc].label}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: ROLE_STYLE[u.role].color }}>
                      {ROLE_STYLE[u.role].label}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: u.status === "active" ? "#86efac" : "#f87171" }}>
                      {u.status === "active" ? "✅ Hoạt động" : "🚫 Đình chỉ"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontVariantNumeric: "tabular-nums", color: u.walletBalance > 0 ? "var(--cyan-light)" : "var(--text-muted)" }}>
                    {formatPrice(u.walletBalance)}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)" }}>{u.bids}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)" }}>{u.joined}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {u.kyc === "pending" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                        >
                          Duyệt KYC
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, background: u.status === "active" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", border: `1px solid ${u.status === "active" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`, color: u.status === "active" ? "#f87171" : "#86efac", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                      >
                        {u.status === "active" ? "Đình chỉ" : "Mở khóa"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: 14 }}>
            Không tìm thấy người dùng phù hợp
          </div>
        )}
      </div>

      {/* User detail drawer */}
      {selectedUser && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={() => setSelectedUser(null)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 420,
              background: "var(--bg-surface)",
              borderLeft: "1px solid var(--border-subtle)",
              padding: 28,
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontWeight: 800, fontSize: 18 }}>Chi tiết người dùng</h2>
              <button onClick={() => setSelectedUser(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, padding: 16, background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border-subtle)" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #4F46E5, #06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900 }}>
                {selectedUser.name[0]}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedUser.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedUser.email}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <span className={`badge ${KYC_STYLE[selectedUser.kyc].cls}`} style={{ fontSize: 9 }}>{KYC_STYLE[selectedUser.kyc].label}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: ROLE_STYLE[selectedUser.role].color }}>{ROLE_STYLE[selectedUser.role].label}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Số điện thoại", value: selectedUser.phone },
                { label: "Ngày tham gia", value: selectedUser.joined },
                { label: "Số dư ví", value: formatPrice(selectedUser.walletBalance) },
                { label: "Lượt đặt giá", value: selectedUser.bids.toString() },
                { label: "Trạng thái", value: selectedUser.status === "active" ? "✅ Hoạt động" : "🚫 Đình chỉ" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
              {selectedUser.kyc === "pending" && (
                <>
                  <button className="btn-primary" style={{ padding: "10px", fontSize: 13 }}>✅ Duyệt KYC</button>
                  <button style={{ padding: "10px", fontSize: 13, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 999, color: "#f87171", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 600 }}>
                    ❌ Từ chối KYC
                  </button>
                </>
              )}
              <button className="btn-secondary" style={{ padding: "10px", fontSize: 13 }}>
                {selectedUser.status === "active" ? "🚫 Đình chỉ tài khoản" : "🔓 Mở khóa tài khoản"}
              </button>
              <button className="btn-ghost" style={{ fontSize: 13, justifyContent: "center" }}>📧 Gửi email</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: 10, color: "var(--text-primary)", fontSize: 13, outline: "none", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: "#0f1024" }}>{o.label}</option>
      ))}
    </select>
  );
}
