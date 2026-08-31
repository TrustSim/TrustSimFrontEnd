"use client";
import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CountdownTimer from "@/components/ui/CountdownTimer";

// --- Mock Data ---
const MOCK_AUCTION = {
  id: "1",
  simNumber: "0901234567",
  carrier: "Viettel",
  type: "english" as const,
  status: "live" as const,
  currentPrice: 15_800_000,
  startPrice: 10_000_000,
  minBidStep: 500_000,
  bidCount: 28,
  endTime: new Date(Date.now() + 2 * 3600000 + 12 * 60000),
  seller: {
    name: "TrustSim Official",
    rating: 4.9,
    sales: 142,
    verified: true,
    joined: "01/2024",
  },
  simInfo: {
    pattern: "Tứ quý 7",
    meaning: "Số 7 tượng trưng cho may mắn trong phong thủy phương Tây, hợp mệnh Kim & Thủy.",
    network: "Viettel 4G/5G",
    type: "Trả trước / Trả sau",
  },
  bidHistory: [
    { user: "Nguyen***A", amount: 15_800_000, time: "12:48:32", isWinning: true },
    { user: "Tran***B", amount: 15_300_000, time: "12:47:10", isWinning: false },
    { user: "Le***C", amount: 14_800_000, time: "12:44:55", isWinning: false },
    { user: "Pham***D", amount: 14_300_000, time: "12:41:02", isWinning: false },
    { user: "Hoang***E", amount: 13_800_000, time: "12:38:19", isWinning: false },
    { user: "Nguyen***F", amount: 13_500_000, time: "12:35:44", isWinning: false },
    { user: "Vo***G", amount: 13_000_000, time: "12:32:00", isWinning: false },
    { user: "Do***H", amount: 12_500_000, time: "12:28:11", isWinning: false },
  ],
};

const formatPrice = (p: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(p);

export default function AuctionDetailPage({ params }: { params: { id: string } }) {
  const auction = MOCK_AUCTION;
  const [bidAmount, setBidAmount] = React.useState(
    (auction.currentPrice + auction.minBidStep).toLocaleString("vi-VN")
  );
  const [currentPrice, setCurrentPrice] = React.useState(auction.currentPrice);
  const [bidHistory, setBidHistory] = React.useState(auction.bidHistory);
  const [bidding, setBidding] = React.useState(false);
  const [bidSuccess, setBidSuccess] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"bid" | "info" | "contract">("bid");

  const handleBid = () => {
    const amount = Number(bidAmount.replace(/\D/g, ""));
    if (amount < currentPrice + auction.minBidStep) return;
    setBidding(true);
    setTimeout(() => {
      const newPrice = amount;
      setCurrentPrice(newPrice);
      setBidHistory([
        { user: "Bạn***", amount: newPrice, time: new Date().toLocaleTimeString("vi-VN"), isWinning: true },
        ...bidHistory.map((b) => ({ ...b, isWinning: false })),
      ]);
      setBidding(false);
      setBidSuccess(true);
      setTimeout(() => setBidSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="mesh-bg" />
      <Navbar />

      <main style={{ position: "relative", zIndex: 1, paddingTop: 80 }}>
        <div className="container" style={{ padding: "32px 24px" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontSize: 13, color: "var(--text-muted)" }}>
            <a href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Trang chủ</a>
            <span>/</span>
            <a href="/auctions" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Đấu giá</a>
            <span>/</span>
            <span style={{ color: "var(--text-secondary)" }}>Phiên #{params.id}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 28, alignItems: "flex-start" }}>
            {/* ─── LEFT COLUMN ─── */}
            <div>
              {/* SIM Display Card */}
              <div style={{
                borderRadius: 24,
                padding: "40px",
                background: "linear-gradient(135deg, rgba(49,46,129,0.5), rgba(79,70,229,0.3), rgba(6,182,212,0.15))",
                border: "1px solid rgba(79,70,229,0.4)",
                marginBottom: 24,
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Glow circle */}
                <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.3), transparent 70%)", pointerEvents: "none" }} />

                <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                  <span className="badge badge-live">🔴 Live</span>
                  <span className="badge badge-english">Kiểu Anh</span>
                  <span style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(255,255,255,0.08)", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
                    {auction.carrier}
                  </span>
                </div>

                <div style={{ marginBottom: 8, fontSize: 12, color: "var(--text-accent)", fontWeight: 600 }}>SIM SỐ ĐẸP – {auction.simInfo.pattern.toUpperCase()}</div>
                <div style={{
                  fontSize: "clamp(2rem, 5vw, 3.5rem)",
                  fontWeight: 900,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "0.14em",
                  background: "linear-gradient(135deg, #fff, #a5b4fc, #67e8f9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  marginBottom: 8,
                }}>
                  {auction.simNumber.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {auction.simInfo.meaning}
                </p>

                {/* Price + Countdown */}
                <div style={{ display: "flex", gap: 32, marginTop: 28, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>GIÁ HIỆN TẠI</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "var(--cyan-light)", fontVariantNumeric: "tabular-nums" }}>
                      {formatPrice(currentPrice)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      Khởi điểm: {formatPrice(auction.startPrice)} · {bidHistory.length} lượt đặt
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>THỜI GIAN CÒN LẠI</div>
                    <CountdownTimer endTime={auction.endTime} />
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 4, border: "1px solid var(--border-subtle)" }}>
                {[
                  { key: "bid", label: "📊 Lịch sử đặt giá" },
                  { key: "info", label: "ℹ️ Thông tin sim" },
                  { key: "contract", label: "📄 Điều khoản" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    style={{
                      flex: 1,
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: activeTab === tab.key ? "rgba(79,70,229,0.2)" : "transparent",
                      color: activeTab === tab.key ? "var(--text-accent)" : "var(--text-muted)",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "bid" && (
                <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Lịch sử đặt giá</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{bidHistory.length} lượt</span>
                  </div>
                  {bidHistory.map((bid, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 20px",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: bid.isWinning ? "rgba(6,182,212,0.06)" : undefined,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {bid.isWinning && <span style={{ fontSize: 12 }}>👑</span>}
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #4F46E5, #06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                          {bid.user[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: bid.isWinning ? "var(--cyan-light)" : "var(--text-primary)" }}>
                            {bid.user}
                            {bid.isWinning && <span style={{ fontSize: 10, marginLeft: 6, color: "var(--cyan-light)" }}>Đang dẫn đầu</span>}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{bid.time}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: bid.isWinning ? "var(--cyan-light)" : "var(--text-primary)" }}>
                        {formatPrice(bid.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "info" && (
                <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-subtle)", padding: 24 }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Thông tin chi tiết</h3>
                  {[
                    { label: "Đặc điểm số", value: auction.simInfo.pattern },
                    { label: "Ý nghĩa phong thủy", value: auction.simInfo.meaning },
                    { label: "Mạng", value: auction.simInfo.network },
                    { label: "Loại SIM", value: auction.simInfo.type },
                    { label: "Nhà mạng", value: auction.carrier },
                    { label: "Giá khởi điểm", value: formatPrice(auction.startPrice) },
                    { label: "Bước giá tối thiểu", value: formatPrice(auction.minBidStep) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "contract" && (
                <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-subtle)", padding: 24 }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Điều khoản đấu giá</h3>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>
                    <p>• Người tham gia cần xác minh danh tính (CCCD + OTP) trước khi đặt giá.</p>
                    <p>• Mỗi lần đặt giá phải cao hơn giá hiện tại ít nhất <strong style={{ color: "var(--text-primary)" }}>{formatPrice(auction.minBidStep)}</strong>.</p>
                    <p>• Hệ thống tự động gia hạn 5 phút nếu có lượt đặt trong 2 phút cuối (tối đa 3 lần).</p>
                    <p>• Người thắng cuộc có 24 giờ để hoàn tất thanh toán và ký hợp đồng điện tử.</p>
                    <p>• Hợp đồng điện tử có chữ ký số, mã hash SHA-256, hiệu lực pháp lý đầy đủ.</p>
                    <p>• Tiền được giữ tại tài khoản ký quỹ, giải ngân sau khi xác nhận chuyển nhượng số thành công.</p>
                  </div>
                </div>
              )}
            </div>

            {/* ─── RIGHT COLUMN: Bid Panel ─── */}
            <div style={{ position: "sticky", top: 90 }}>
              {/* Bid Form */}
              <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-accent)",
                borderRadius: 20,
                padding: 24,
                marginBottom: 16,
              }}>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Đặt Giá</h3>

                {bidSuccess && (
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: "rgba(34,197,94,0.12)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    color: "#86efac",
                    fontSize: 13,
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    ✅ Đặt giá thành công! Bạn đang dẫn đầu.
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label className="label">Mức giá đặt (VNĐ)</label>
                  <input
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="input-field"
                    style={{ fontSize: 18, fontWeight: 700 }}
                    placeholder="Nhập mức giá..."
                  />
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                    Tối thiểu: {formatPrice(currentPrice + auction.minBidStep)}
                  </div>
                </div>

                {/* Quick bid buttons */}
                <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                  {[1, 2, 5, 10].map((mult) => (
                    <button
                      key={mult}
                      onClick={() => setBidAmount((currentPrice + auction.minBidStep * mult).toLocaleString("vi-VN"))}
                      style={{
                        flex: "1 0 auto",
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                        fontSize: 11,
                        cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(79,70,229,0.4)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
                    >
                      +{mult} bước
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleBid}
                  disabled={bidding}
                  className="btn-primary"
                  style={{ width: "100%", padding: "14px", fontSize: 15, opacity: bidding ? 0.7 : 1, position: "relative" }}
                >
                  {bidding ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                      <span style={{ width: 14, height: 14, border: "2px solid #fff4", borderTopColor: "#fff", borderRadius: "50%", animation: "spin-slow 0.8s linear infinite", display: "inline-block" }} />
                      Đang xử lý...
                    </span>
                  ) : "🔨 Đặt giá ngay"}
                </button>

                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10, textAlign: "center", lineHeight: 1.5 }}>
                  Bạn cần đăng nhập & xác minh danh tính để đặt giá
                </p>
              </div>

              {/* Seller Card */}
              <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 16,
                padding: 20,
              }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14, fontWeight: 600 }}>Người bán</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #4F46E5, #06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 }}>
                    T
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                      {auction.seller.name}
                      {auction.seller.verified && <span style={{ fontSize: 13 }}>✅</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      ⭐ {auction.seller.rating} · {auction.seller.sales} giao dịch
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                  {[
                    { label: "Tham gia", value: auction.seller.joined },
                    { label: "Đã bán", value: `${auction.seller.sales} sim` },
                    { label: "Đánh giá", value: `⭐ ${auction.seller.rating}/5` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "var(--text-muted)" }}>{label}</span>
                      <span style={{ fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 900px) {
          main > div > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
