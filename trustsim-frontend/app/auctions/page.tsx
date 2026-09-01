"use client";
import React from "react";
import AuctionCard, { AuctionCardData, AuctionType, AuctionStatus } from "@/components/ui/AuctionCard";

// --- Mock Data ---
const ALL_AUCTIONS: AuctionCardData[] = [
  { id: "1", simNumber: "0901234567", carrier: "Viettel", type: "english", status: "live", currentPrice: 15000000, startPrice: 10000000, bidCount: 24, endTime: new Date(Date.now() + 2 * 3600000), seller: "TrustSim", featuredReason: "Sim tứ quý 7" },
  { id: "2", simNumber: "0777777777", carrier: "Mobifone", type: "sealed", status: "live", currentPrice: 42000000, startPrice: 30000000, bidCount: 8, endTime: new Date(Date.now() + 4 * 3600000), seller: "NguyenA", featuredReason: "Sảnh 7 cực hiếm" },
  { id: "3", simNumber: "0888555000", carrier: "Vinaphone", type: "dutch", status: "live", currentPrice: 8500000, startPrice: 12000000, bidCount: 0, endTime: new Date(Date.now() + 45 * 60000), seller: "SimVIP" },
  { id: "4", simNumber: "0909090909", carrier: "Viettel", type: "english", status: "live", currentPrice: 22000000, startPrice: 15000000, bidCount: 37, endTime: new Date(Date.now() + 1 * 3600000), seller: "MinhTuan", featuredReason: "Sảnh 9 siêu hiếm" },
  { id: "5", simNumber: "0338866688", carrier: "Viettel", type: "english", status: "live", currentPrice: 6800000, startPrice: 5000000, bidCount: 11, endTime: new Date(Date.now() + 3 * 3600000), seller: "HoangLe" },
  { id: "6", simNumber: "0911119999", carrier: "Mobifone", type: "sealed", status: "upcoming", currentPrice: 20000000, startPrice: 20000000, bidCount: 0, endTime: new Date(Date.now() + 24 * 3600000), seller: "KhanhSim" },
  { id: "7", simNumber: "0799888777", carrier: "Vinaphone", type: "dutch", status: "upcoming", currentPrice: 11000000, startPrice: 11000000, bidCount: 0, endTime: new Date(Date.now() + 48 * 3600000), seller: "TrustSim" },
  { id: "8", simNumber: "0352468024", carrier: "Viettel", type: "english", status: "ended", currentPrice: 8500000, startPrice: 5000000, bidCount: 19, endTime: new Date(Date.now() - 2 * 3600000), seller: "TrungPT" },
  { id: "9", simNumber: "0987654321", carrier: "Mobifone", type: "sealed", status: "ended", currentPrice: 35000000, startPrice: 25000000, bidCount: 12, endTime: new Date(Date.now() - 5 * 3600000), seller: "LuckyNum" },
  { id: "10", simNumber: "0666999888", carrier: "Vinaphone", type: "dutch", status: "live", currentPrice: 5200000, startPrice: 9000000, bidCount: 0, endTime: new Date(Date.now() + 20 * 60000), seller: "NamSim" },
  { id: "11", simNumber: "0944488888", carrier: "Vietnamobile", type: "english", status: "live", currentPrice: 16000000, startPrice: 12000000, bidCount: 7, endTime: new Date(Date.now() + 90 * 60000), seller: "HuuLoc", featuredReason: "Sảnh 8 phát tài" },
  { id: "12", simNumber: "0355577799", carrier: "Viettel", type: "sealed", status: "upcoming", currentPrice: 7500000, startPrice: 7500000, bidCount: 0, endTime: new Date(Date.now() + 36 * 3600000), seller: "BaoNguyen" },
];

const CARRIERS = ["Tất cả", "Viettel", "Mobifone", "Vinaphone", "Vietnamobile"];
const TYPES = [
  { key: "all", label: "Tất cả" },
  { key: "english", label: "Kiểu Anh" },
  { key: "dutch", label: "Kiểu Hà Lan" },
  { key: "sealed", label: "Bí Mật" },
];
const STATUSES = [
  { key: "all", label: "Tất cả" },
  { key: "live", label: "🔴 Đang diễn ra" },
  { key: "upcoming", label: "🟡 Sắp diễn ra" },
  { key: "ended", label: "⚫ Đã kết thúc" },
];
const SORT_OPTIONS = [
  { key: "endTime", label: "Sắp kết thúc" },
  { key: "priceAsc", label: "Giá tăng dần" },
  { key: "priceDesc", label: "Giá giảm dần" },
  { key: "bidCount", label: "Nhiều lượt đặt" },
];

export default function AuctionsPage() {
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [carrierFilter, setCarrierFilter] = React.useState<string>("Tất cả");
  const [sortBy, setSortBy] = React.useState<string>("endTime");
  const [search, setSearch] = React.useState<string>("");
  const [minPrice, setMinPrice] = React.useState<string>("");
  const [maxPrice, setMaxPrice] = React.useState<string>("");
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const filtered = ALL_AUCTIONS.filter((a) => {
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (carrierFilter !== "Tất cả" && a.carrier !== carrierFilter) return false;
    if (search && !a.simNumber.includes(search.replace(/\s/g, ""))) return false;
    if (minPrice && a.currentPrice < Number(minPrice) * 1e6) return false;
    if (maxPrice && a.currentPrice > Number(maxPrice) * 1e6) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case "endTime": return a.endTime.getTime() - b.endTime.getTime();
      case "priceAsc": return a.currentPrice - b.currentPrice;
      case "priceDesc": return b.currentPrice - a.currentPrice;
      case "bidCount": return b.bidCount - a.bidCount;
      default: return 0;
    }
  });

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="mesh-bg" />

      <main style={{ position: "relative", zIndex: 1, paddingTop: 80 }}>
        {/* Page Header */}
        <div style={{ padding: "40px 0 24px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="container">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, marginBottom: 6 }}>
                  Phiên Đấu Giá{" "}
                  <span className="gradient-text">Sim Số</span>
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                  {filtered.length} phiên{" "}
                  <span style={{ color: "var(--text-muted)" }}>
                    {ALL_AUCTIONS.filter((a) => a.status === "live").length} đang live
                  </span>
                </p>
              </div>

              {/* Sort + Search row */}
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  placeholder="🔍 Tìm số sim..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field"
                  style={{ width: 180 }}
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: 10,
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key} style={{ background: "#0f1024" }}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick type tabs */}
            <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
              {TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTypeFilter(t.key)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 999,
                    border: "1px solid",
                    borderColor: typeFilter === t.key ? "var(--indigo-mid)" : "var(--border-subtle)",
                    background: typeFilter === t.key ? "rgba(79,70,229,0.2)" : "transparent",
                    color: typeFilter === t.key ? "var(--text-accent)" : "var(--text-secondary)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {t.label}
                </button>
              ))}
              <div style={{ width: 1, background: "var(--border-subtle)", margin: "0 4px" }} />
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStatusFilter(s.key)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 999,
                    border: "1px solid",
                    borderColor: statusFilter === s.key ? "rgba(6,182,212,0.5)" : "var(--border-subtle)",
                    background: statusFilter === s.key ? "rgba(6,182,212,0.1)" : "transparent",
                    color: statusFilter === s.key ? "var(--cyan-light)" : "var(--text-secondary)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="container" style={{ padding: "32px 24px", display: "flex", gap: 28, alignItems: "flex-start" }}>
          {/* Sidebar */}
          {sidebarOpen && (
            <aside style={{
              width: 240,
              flexShrink: 0,
              position: "sticky",
              top: 90,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}>
              {/* Carrier filter */}
              <FilterGroup title="Nhà mạng">
                {CARRIERS.map((c) => (
                  <FilterChip
                    key={c}
                    active={carrierFilter === c}
                    onClick={() => setCarrierFilter(c)}
                  >
                    {c}
                  </FilterChip>
                ))}
              </FilterGroup>

              {/* Price filter */}
              <FilterGroup title="Khoảng giá (triệu VNĐ)">
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    placeholder="Từ"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    type="number"
                    className="input-field"
                    style={{ flex: 1, padding: "8px 10px", fontSize: 12 }}
                  />
                  <span style={{ color: "var(--text-muted)", fontSize: 12 }}>–</span>
                  <input
                    placeholder="Đến"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    type="number"
                    className="input-field"
                    style={{ flex: 1, padding: "8px 10px", fontSize: 12 }}
                  />
                </div>
                {(minPrice || maxPrice) && (
                  <button
                    onClick={() => { setMinPrice(""); setMaxPrice(""); }}
                    style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "Inter, sans-serif" }}
                  >
                    × Xóa bộ lọc giá
                  </button>
                )}
              </FilterGroup>

              {/* Reset all */}
              <button
                onClick={() => { setTypeFilter("all"); setStatusFilter("all"); setCarrierFilter("Tất cả"); setMinPrice(""); setMaxPrice(""); setSearch(""); }}
                className="btn-ghost"
                style={{ width: "100%", justifyContent: "center", fontSize: 12 }}
              >
                ↺ Xóa tất cả bộ lọc
              </button>
            </aside>
          )}

          {/* Grid */}
          <div style={{ flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <p style={{ fontSize: 16 }}>Không tìm thấy phiên đấu giá phù hợp</p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(268px, 1fr))",
                gap: 18,
              }}>
                {filtered.map((a) => <AuctionCard key={a.id} data={a} />)}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: 16 }}>
      <h3 style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
        {title}
      </h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px",
        borderRadius: 999,
        border: `1px solid ${active ? "rgba(79,70,229,0.5)" : "rgba(255,255,255,0.08)"}`,
        background: active ? "rgba(79,70,229,0.15)" : "transparent",
        color: active ? "var(--text-accent)" : "var(--text-muted)",
        fontSize: 12,
        cursor: "pointer",
        transition: "all 0.2s",
        fontFamily: "Inter, sans-serif",
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  );
}
