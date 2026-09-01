"use client";
import React from "react";
import Link from "next/link";

const MOCK_USER = {
  name: "Nguyễn Văn An",
  email: "nguyenvanan@gmail.com",
  phone: "0901234567",
  avatar: "N",
  kycStatus: "verified",
  walletBalance: 25_000_000,
  memberSince: "01/2025",
  totalBids: 47,
  wonAuctions: 8,
  activeSims: 3,
};

const MOCK_MY_AUCTIONS = [
  { id: "a1", simNumber: "0355577799", status: "active", currentPrice: 12_000_000, bidCount: 5, endTime: "22/08/2026 15:30" },
  { id: "a2", simNumber: "0766889900", status: "completed", currentPrice: 8_500_000, bidCount: 12, endTime: "19/08/2026 10:00" },
  { id: "a3", simNumber: "0944400088", status: "draft", currentPrice: 0, bidCount: 0, endTime: "—" },
];

const MOCK_MY_BIDS = [
  { auctionId: "1", simNumber: "0901234567", myBid: 14_500_000, currentPrice: 15_800_000, status: "losing", endTime: "22/08/2026 14:30" },
  { auctionId: "2", simNumber: "0777777777", myBid: 40_000_000, currentPrice: 42_000_000, status: "losing", endTime: "22/08/2026 16:00" },
  { auctionId: "8", simNumber: "0352468024", myBid: 8_500_000, currentPrice: 8_500_000, status: "won", endTime: "21/08/2026 10:00" },
  { auctionId: "9", simNumber: "0987654321", myBid: 32_000_000, currentPrice: 35_000_000, status: "lost", endTime: "20/08/2026 09:00" },
];

const MOCK_TRANSACTIONS = [
  { id: "tx1", type: "deposit", amount: 5_000_000, status: "completed", date: "21/08/2026", desc: "Nạp tiền ví" },
  { id: "tx2", type: "bid_deposit", amount: -2_000_000, status: "pending", date: "22/08/2026", desc: "Đặt cọc phiên #1" },
  { id: "tx3", type: "payment", amount: -8_500_000, status: "completed", date: "19/08/2026", desc: "Thanh toán sim 0352468024" },
  { id: "tx4", type: "refund", amount: 2_000_000, status: "completed", date: "18/08/2026", desc: "Hoàn cọc phiên #9" },
];

const MOCK_CONTRACTS = [
  { id: "ct1", simNumber: "0352468024", date: "21/08/2026", status: "signed", counterparty: "TrustSim Official" },
  { id: "ct2", simNumber: "0987654321", date: "20/08/2026", status: "expired", counterparty: "LuckyNum" },
];

type ProfileTab = "overview" | "auctions" | "bids" | "transactions" | "contracts" | "settings";

const TABS: { key: ProfileTab; icon: string; label: string }[] = [
  { key: "overview", icon: "👤", label: "Tổng quan" },
  { key: "auctions", icon: "🔨", label: "Sim của tôi" },
  { key: "bids", icon: "📊", label: "Lịch sử đặt" },
  { key: "transactions", icon: "💰", label: "Giao dịch" },
  { key: "contracts", icon: "📄", label: "Hợp đồng" },
  { key: "settings", icon: "⚙️", label: "Cài đặt" },
];

const formatPrice = (p: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(p);

export default function ProfilePage() {
  const [activeTab, setActiveTab] = React.useState<ProfileTab>("overview");
  const user = MOCK_USER;

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="mesh-bg" />

      <main style={{ position: "relative", zIndex: 1, paddingTop: 80 }}>
        {/* Profile Header Banner */}
        <div style={{
          padding: "40px 0",
          background: "linear-gradient(180deg, rgba(49,46,129,0.3), transparent)",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          <div className="container">
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              {/* Avatar */}
              <div style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #312E81, #4F46E5, #06B6D4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                fontWeight: 900,
                border: "3px solid rgba(79,70,229,0.5)",
                boxShadow: "0 0 30px rgba(79,70,229,0.3)",
                flexShrink: 0,
              }}>
                {user.avatar}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800 }}>{user.name}</h1>
                  {user.kycStatus === "verified" && (
                    <span className="badge badge-success">✅ Đã xác minh</span>
                  )}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 12 }}>
                  {user.email} · {user.phone}
                </div>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  {[
                    { label: "Tham gia", value: user.memberSince },
                    { label: "Lượt đặt giá", value: user.totalBids },
                    { label: "Đấu giá thắng", value: user.wonAuctions },
                    { label: "Sim đang bán", value: user.activeSims },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{value}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wallet */}
              <div style={{
                padding: "16px 24px",
                background: "rgba(6,182,212,0.1)",
                border: "1px solid rgba(6,182,212,0.3)",
                borderRadius: 16,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>SỐ DƯ VÍ</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--cyan-light)", fontVariantNumeric: "tabular-nums" }}>
                  {formatPrice(user.walletBalance)}
                </div>
                <button className="btn-primary" style={{ marginTop: 10, padding: "6px 16px", fontSize: 12 }}>+ Nạp tiền</button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ borderBottom: "1px solid var(--border-subtle)", background: "rgba(15,16,36,0.6)", backdropFilter: "blur(10px)", position: "sticky", top: 64, zIndex: 10 }}>
          <div className="container" style={{ display: "flex", gap: 2, overflowX: "auto", padding: "0 24px" }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "14px 18px",
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${activeTab === tab.key ? "var(--indigo-mid)" : "transparent"}`,
                  color: activeTab === tab.key ? "var(--text-primary)" : "var(--text-muted)",
                  fontSize: 13,
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="container" style={{ padding: "32px 24px" }}>
          {activeTab === "overview" && <OverviewTab user={user} />}
          {activeTab === "auctions" && <AuctionsTab auctions={MOCK_MY_AUCTIONS} />}
          {activeTab === "bids" && <BidsTab bids={MOCK_MY_BIDS} />}
          {activeTab === "transactions" && <TransactionsTab transactions={MOCK_TRANSACTIONS} />}
          {activeTab === "contracts" && <ContractsTab contracts={MOCK_CONTRACTS} />}
          {activeTab === "settings" && <SettingsTab user={user} />}
        </div>
      </main>
    </div>
  );
}

// ─── Sub-tabs ───

function OverviewTab({ user }: { user: typeof MOCK_USER }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
      {/* KYC Status */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>🪪 Xác minh danh tính</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { step: "Tạo tài khoản", done: true },
            { step: "Xác minh email", done: true },
            { step: "Xác minh số điện thoại (OTP)", done: true },
            { step: "Xác minh CCCD (eKYC)", done: true },
            { step: "Xác minh quyền kiểm soát SIM", done: false },
          ].map(({ step, done }) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <span style={{ fontSize: 16 }}>{done ? "✅" : "⭕"}</span>
              <span style={{ color: done ? "var(--text-primary)" : "var(--text-muted)" }}>{step}</span>
            </div>
          ))}
        </div>
        <button className="btn-secondary" style={{ marginTop: 16, width: "100%", fontSize: 13 }}>
          Xác minh SIM ngay
        </button>
      </div>

      {/* Activity */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>📈 Hoạt động gần đây</h3>
        {[
          { icon: "🔨", text: "Đặt giá sim 0777777777", time: "2 giờ trước", color: "#a5b4fc" },
          { icon: "🏆", text: "Thắng phiên sim 0352468024", time: "Hôm qua", color: "#86efac" },
          { icon: "📄", text: "Ký hợp đồng CT-001", time: "Hôm qua", color: "#67e8f9" },
          { icon: "💰", text: "Nạp tiền 5.000.000đ", time: "21/08", color: "#fde047" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "var(--text-primary)" }}>{item.text}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick stats */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>📊 Thống kê</h3>
        {[
          { label: "Tỷ lệ thắng", value: `${Math.round((user.wonAuctions / user.totalBids) * 100)}%`, color: "#86efac" },
          { label: "Tổng chi tiêu", value: formatPrice(8_500_000), color: "#67e8f9" },
          { label: "Phiên đang tham gia", value: "2", color: "#a5b4fc" },
          { label: "Sim đang đấu giá", value: user.activeSims.toString(), color: "#fde047" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuctionsTab({ auctions }: { auctions: typeof MOCK_MY_AUCTIONS }) {
  const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
    active: { color: "#86efac", bg: "rgba(34,197,94,0.12)", label: "Đang diễn ra" },
    completed: { color: "#67e8f9", bg: "rgba(6,182,212,0.12)", label: "Hoàn thành" },
    draft: { color: "#fde047", bg: "rgba(234,179,8,0.12)", label: "Nháp" },
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button className="btn-primary">+ Đăng sim mới</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {auctions.map((a) => {
          const s = STATUS_STYLE[a.status];
          return (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 20, padding: 20, background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "0.1em", marginBottom: 4 }}>
                  {a.simNumber.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Kết thúc: {a.endTime} · {a.bidCount} lượt đặt
                </div>
              </div>
              {a.currentPrice > 0 && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--cyan-light)" }}>{formatPrice(a.currentPrice)}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Giá hiện tại</div>
                </div>
              )}
              <span style={{ padding: "4px 12px", borderRadius: 999, background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                {s.label}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <Link href={`/auctions/${a.id}`} className="btn-ghost" style={{ fontSize: 12 }}>Xem</Link>
                {a.status === "draft" && <button className="btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}>Đăng</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BidsTab({ bids }: { bids: typeof MOCK_MY_BIDS }) {
  const BID_STATUS: Record<string, { color: string; label: string; icon: string }> = {
    winning: { color: "#86efac", label: "Đang dẫn", icon: "👑" },
    losing: { color: "#f87171", label: "Đang thua", icon: "📉" },
    won: { color: "#67e8f9", label: "Đã thắng", icon: "🏆" },
    lost: { color: "#94a3b8", label: "Đã thua", icon: "❌" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {bids.map((b) => {
        const s = BID_STATUS[b.status];
        return (
          <div key={b.auctionId} style={{ display: "flex", alignItems: "center", gap: 20, padding: 20, background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 14 }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "0.1em" }}>
                {b.simNumber.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Kết thúc: {b.endTime}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Giá bạn đặt</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{formatPrice(b.myBid)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Giá hiện tại</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--cyan-light)" }}>{formatPrice(b.currentPrice)}</div>
            </div>
            <span style={{ color: s.color, fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{s.label}</span>
            <Link href={`/auctions/${b.auctionId}`} className="btn-ghost" style={{ fontSize: 12 }}>→</Link>
          </div>
        );
      })}
    </div>
  );
}

function TransactionsTab({ transactions }: { transactions: typeof MOCK_TRANSACTIONS }) {
  const TX_ICONS: Record<string, string> = {
    deposit: "💳",
    bid_deposit: "🔒",
    payment: "💸",
    refund: "↩️",
  };

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700 }}>Lịch sử giao dịch</span>
        <button className="btn-ghost" style={{ fontSize: 12 }}>Xuất CSV</button>
      </div>
      {transactions.map((tx) => (
        <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span style={{ fontSize: 20 }}>{TX_ICONS[tx.type]}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.desc}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{tx.date}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: tx.amount > 0 ? "#86efac" : "#f87171", fontVariantNumeric: "tabular-nums" }}>
              {tx.amount > 0 ? "+" : ""}{formatPrice(tx.amount)}
            </div>
            <span style={{ fontSize: 10, color: tx.status === "completed" ? "#86efac" : "#fde047", fontWeight: 600 }}>
              {tx.status === "completed" ? "Hoàn thành" : "Đang xử lý"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ContractsTab({ contracts }: { contracts: typeof MOCK_CONTRACTS }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {contracts.map((c) => (
        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 20, padding: 20, background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 14 }}>
          <span style={{ fontSize: 28 }}>📄</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Hợp đồng #{c.id} – Sim {c.simNumber}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.date} · Đối tác: {c.counterparty}</div>
          </div>
          <span className={`badge ${c.status === "signed" ? "badge-success" : "badge-ended"}`}>
            {c.status === "signed" ? "✅ Đã ký" : "⛔ Đã hết hạn"}
          </span>
          {c.status === "signed" && (
            <button className="btn-secondary" style={{ fontSize: 12, padding: "6px 14px" }}>⬇ Tải PDF</button>
          )}
        </div>
      ))}
    </div>
  );
}

function SettingsTab({ user }: { user: typeof MOCK_USER }) {
  return (
    <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 24 }}>
      <SettingsSection title="Thông tin cá nhân">
        {[
          { label: "Họ và tên", value: user.name, type: "text" },
          { label: "Email", value: user.email, type: "email" },
          { label: "Số điện thoại", value: user.phone, type: "tel" },
        ].map(({ label, value, type }) => (
          <div key={label}>
            <label className="label">{label}</label>
            <input defaultValue={value} type={type} className="input-field" />
          </div>
        ))}
        <button className="btn-primary" style={{ padding: "10px 24px", alignSelf: "flex-start" }}>Lưu thay đổi</button>
      </SettingsSection>

      <SettingsSection title="Bảo mật">
        <div>
          <label className="label">Mật khẩu hiện tại</label>
          <input type="password" className="input-field" placeholder="••••••••" />
        </div>
        <div>
          <label className="label">Mật khẩu mới</label>
          <input type="password" className="input-field" placeholder="••••••••" />
        </div>
        <div>
          <label className="label">Xác nhận mật khẩu mới</label>
          <input type="password" className="input-field" placeholder="••••••••" />
        </div>
        <button className="btn-secondary" style={{ padding: "10px 24px", alignSelf: "flex-start" }}>Đổi mật khẩu</button>
      </SettingsSection>

      <SettingsSection title="Thông báo">
        {[
          { label: "Email khi có lượt đặt giá mới", defaultChecked: true },
          { label: "Email khi bị vượt giá", defaultChecked: true },
          { label: "Email kết quả phiên đấu giá", defaultChecked: true },
          { label: "Thông báo đẩy (trình duyệt)", defaultChecked: false },
        ].map(({ label, defaultChecked }) => (
          <label key={label} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
            <input type="checkbox" defaultChecked={defaultChecked} style={{ accentColor: "var(--indigo-mid)", width: 16, height: 16 }} />
            {label}
          </label>
        ))}
      </SettingsSection>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)", fontWeight: 700, fontSize: 15 }}>
        {title}
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}
