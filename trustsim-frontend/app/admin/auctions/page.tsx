"use client";
import React from "react";
import CountdownTimer from "@/components/ui/CountdownTimer";

const MOCK_AUCTIONS = [
  { id: "1", sim: "0901234567", carrier: "Viettel", type: "english", status: "live", currentPrice: 15_800_000, startPrice: 10_000_000, minStep: 500_000, bidCount: 28, seller: "TrustSim", sellerKyc: "verified", endTime: new Date(Date.now() + 2 * 3600000), extensions: 1, maxExtensions: 3 },
  { id: "2", sim: "0777777777", carrier: "Mobifone", type: "sealed", status: "live", currentPrice: 42_000_000, startPrice: 30_000_000, minStep: 1_000_000, bidCount: 8, seller: "NguyenA", sellerKyc: "verified", endTime: new Date(Date.now() + 4 * 3600000), extensions: 0, maxExtensions: 3 },
  { id: "3", sim: "0888555000", carrier: "Vinaphone", type: "dutch", status: "live", currentPrice: 8_500_000, startPrice: 12_000_000, minStep: 100_000, bidCount: 0, seller: "SimVIP", sellerKyc: "verified", endTime: new Date(Date.now() + 45 * 60000), extensions: 0, maxExtensions: 3 },
  { id: "4", sim: "0909090909", carrier: "Viettel", type: "english", status: "live", currentPrice: 22_000_000, startPrice: 15_000_000, minStep: 500_000, bidCount: 37, seller: "MinhTuan", sellerKyc: "verified", endTime: new Date(Date.now() + 1 * 3600000), extensions: 2, maxExtensions: 3 },
  { id: "6", sim: "0911119999", carrier: "Mobifone", type: "sealed", status: "upcoming", currentPrice: 20_000_000, startPrice: 20_000_000, minStep: 500_000, bidCount: 0, seller: "KhanhSim", sellerKyc: "pending", endTime: new Date(Date.now() + 24 * 3600000), extensions: 0, maxExtensions: 3 },
  { id: "8", sim: "0352468024", carrier: "Viettel", type: "english", status: "ended", currentPrice: 8_500_000, startPrice: 5_000_000, minStep: 200_000, bidCount: 19, seller: "TrungPT", sellerKyc: "verified", endTime: new Date(Date.now() - 2 * 3600000), extensions: 0, maxExtensions: 3 },
  { id: "9", sim: "0987654321", carrier: "Mobifone", type: "sealed", status: "ended", currentPrice: 35_000_000, startPrice: 25_000_000, minStep: 500_000, bidCount: 12, seller: "LuckyNum", sellerKyc: "verified", endTime: new Date(Date.now() - 5 * 3600000), extensions: 1, maxExtensions: 3 },
];

const TYPE_LABELS: Record<string, string> = { english: "Anh", dutch: "Hà Lan", sealed: "Bí mật" };
const TYPE_CLASS: Record<string, string> = { english: "badge-english", dutch: "badge-dutch", sealed: "badge-sealed" };

const formatPrice = (p: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(p);

export default function AdminAuctionsPage() {
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<(typeof MOCK_AUCTIONS)[0] | null>(null);

  const filtered = MOCK_AUCTIONS.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    if (search && !a.sim.includes(search.replace(/\s/g, "")) && !a.seller.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Quản lý Phiên Đấu Giá</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            {MOCK_AUCTIONS.filter((a) => a.status === "live").length} đang live ·{" "}
            {MOCK_AUCTIONS.filter((a) => a.status === "upcoming").length} sắp diễn ra ·{" "}
            {MOCK_AUCTIONS.filter((a) => a.status === "ended").length} đã kết thúc
          </p>
        </div>
        <button className="btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>+ Tạo phiên mới</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Tìm sim, người bán..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
          style={{ width: 240 }}
        />
        {[
          { value: statusFilter, set: setStatusFilter, options: [{ value: "all", label: "Trạng thái: Tất cả" }, { value: "live", label: "🔴 Live" }, { value: "upcoming", label: "🟡 Sắp diễn ra" }, { value: "ended", label: "⚫ Kết thúc" }] },
          { value: typeFilter, set: setTypeFilter, options: [{ value: "all", label: "Hình thức: Tất cả" }, { value: "english", label: "Kiểu Anh" }, { value: "dutch", label: "Kiểu Hà Lan" }, { value: "sealed", label: "Bí mật" }] },
        ].map((f, fi) => (
          <select
            key={fi}
            value={f.value}
            onChange={(e) => f.set(e.target.value)}
            style={{ padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)", borderRadius: 10, color: "var(--text-primary)", fontSize: 13, outline: "none", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
          >
            {f.options.map((o) => <option key={o.value} value={o.value} style={{ background: "#0f1024" }}>{o.label}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                {["SIM số", "Nhà mạng", "Hình thức", "Trạng thái", "Giá hiện tại", "Lượt đặt", "Người bán", "Thời gian còn lại", "Gia hạn", ""].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={() => setSelected(a)}
                >
                  <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "0.1em" }}>
                    {a.sim.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)" }}>{a.carrier}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className={`badge ${TYPE_CLASS[a.type]}`} style={{ fontSize: 10 }}>{TYPE_LABELS[a.type]}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className={`badge ${a.status === "live" ? "badge-live" : a.status === "upcoming" ? "badge-pending" : "badge-ended"}`} style={{ fontSize: 10 }}>
                      {a.status === "live" ? "Live" : a.status === "upcoming" ? "Sắp diễn ra" : "Kết thúc"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "var(--cyan-light)", fontVariantNumeric: "tabular-nums" }}>
                    {formatPrice(a.currentPrice)}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)" }}>{a.bidCount}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{a.seller}</div>
                    <div style={{ fontSize: 10, color: a.sellerKyc === "verified" ? "#86efac" : "#fde047" }}>
                      {a.sellerKyc === "verified" ? "✅" : "⏳"} KYC
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {a.status === "ended"
                      ? <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Đã kết thúc</span>
                      : <CountdownTimer endTime={a.endTime} compact />
                    }
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12 }}>
                    <span style={{ color: a.extensions >= a.maxExtensions ? "#f87171" : "var(--text-secondary)" }}>
                      {a.extensions}/{a.maxExtensions}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {a.status === "live" && (
                        <button
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                        >
                          Dừng
                        </button>
                      )}
                      {a.status === "upcoming" && (
                        <button
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, background: "rgba(79,70,229,0.15)", border: "1px solid rgba(79,70,229,0.3)", color: "var(--text-accent)", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                        >
                          Chỉnh sửa
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: 14 }}>Không tìm thấy phiên đấu giá phù hợp</div>
        )}
      </div>

      {/* Auction detail panel */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={() => setSelected(null)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 440, background: "var(--bg-surface)", borderLeft: "1px solid var(--border-subtle)", padding: 28, overflowY: "auto" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontWeight: 800, fontSize: 18 }}>Chi tiết phiên #{selected.id}</h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>

            <div style={{ padding: 20, background: "linear-gradient(135deg, rgba(79,70,229,0.15), rgba(6,182,212,0.08))", borderRadius: 16, border: "1px solid rgba(79,70,229,0.3)", marginBottom: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 900, fontVariantNumeric: "tabular-nums", letterSpacing: "0.12em", marginBottom: 8, background: "linear-gradient(135deg,#a5b4fc,#67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {selected.sim.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span className={`badge ${selected.status === "live" ? "badge-live" : selected.status === "upcoming" ? "badge-pending" : "badge-ended"}`}>
                  {selected.status === "live" ? "Live" : selected.status === "upcoming" ? "Sắp diễn ra" : "Kết thúc"}
                </span>
                <span className={`badge ${TYPE_CLASS[selected.type]}`}>{TYPE_LABELS[selected.type]}</span>
              </div>
            </div>

            {[
              { label: "Nhà mạng", value: selected.carrier },
              { label: "Người bán", value: `${selected.seller} (${selected.sellerKyc === "verified" ? "✅ KYC" : "⏳ KYC chờ"})` },
              { label: "Giá khởi điểm", value: formatPrice(selected.startPrice) },
              { label: "Giá hiện tại", value: formatPrice(selected.currentPrice) },
              { label: "Bước giá tối thiểu", value: formatPrice(selected.minStep) },
              { label: "Lượt đặt giá", value: selected.bidCount.toString() },
              { label: "Số lần gia hạn", value: `${selected.extensions}/${selected.maxExtensions}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13 }}>
                <span style={{ color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{value}</span>
              </div>
            ))}

            {selected.status !== "ended" && (
              <div style={{ marginTop: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Thời gian còn lại:</div>
                <CountdownTimer endTime={selected.endTime} />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
              {selected.status === "live" && (
                <button style={{ padding: "10px", fontSize: 13, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 999, color: "#f87171", cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: 600 }}>
                  🚫 Dừng phiên đấu giá
                </button>
              )}
              <button className="btn-secondary" style={{ padding: "10px", fontSize: 13 }}>📊 Xem toàn bộ lịch sử đặt</button>
              <button className="btn-ghost" style={{ fontSize: 13, justifyContent: "center" }}>📧 Thông báo người tham gia</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
