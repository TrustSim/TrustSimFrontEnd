"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

/* ─── 100% Crisp Line SVG Icons ──────────────────────────── */
const Icons = {
  Sparkles: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  ),
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Filter: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  ShoppingCart: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  ),
};

export interface MarketSimItem {
  id: string;
  simNumber: string;
  carrier: "Viettel" | "Mobifone" | "Vinaphone" | "Vietnamobile" | "Wintel";
  price: number;
  originalPrice?: number;
  category: string;
  fengShuiTag?: string;
  seller: string;
  isVerified: boolean;
  score?: number;
}

const CARRIERS = ["Tất cả", "Viettel", "Mobifone", "Vinaphone", "Vietnamobile", "Wintel"];

const CATEGORIES = [
  "Tất cả loại SIM",
  "Tứ quý / Ngũ quý",
  "Tam hoa kép",
  "Lộc phát 68 / 86",
  "Thần tài 39 / 79",
  "Tiến lên / Sảnh rồng",
  "Taxi / Lặp đôi",
  "Năm sinh / Kỷ niệm",
  "Sim phong thủy",
];

const PRICE_RANGES = [
  { label: "Tất cả mức giá", min: 0, max: Infinity },
  { label: "Dưới 2 triệu", min: 0, max: 2_000_000 },
  { label: "Từ 2 - 5 triệu", min: 2_000_000, max: 5_000_000 },
  { label: "Từ 5 - 15 triệu", min: 5_000_000, max: 15_000_000 },
  { label: "Từ 15 - 50 triệu", min: 15_000_000, max: 50_000_000 },
  { label: "Trên 50 triệu", min: 50_000_000, max: Infinity },
];

const QUICK_AI_PROMPTS = [
  "Tìm SIM tam hoa 8 mệnh Kim dưới 10tr",
  "SIM Lộc Phát 6868 Viettel",
  "SIM Thần Tài 7979",
  "SIM Tứ Quý 9999",
  "SIM Đầu số cổ 0903",
  "SIM phong thủy mệnh Hỏa",
];

const MOCK_MARKET_SIMS: MarketSimItem[] = [
  { id: "m1", simNumber: "0988668866", carrier: "Viettel", price: 18_500_000, originalPrice: 22_000_000, category: "Lộc phát 68 / 86", fengShuiTag: "Mệnh Thổ · Đại Cát", seller: "Đại lý Viettel VIP", isVerified: true, score: 9.6 },
  { id: "m2", simNumber: "0903777888", carrier: "Mobifone", price: 14_000_000, originalPrice: 16_500_000, category: "Tam hoa kép", fengShuiTag: "Mệnh Kim · Phú Quý", seller: "Trần Bảo Nam", isVerified: true, score: 9.2 },
  { id: "m3", simNumber: "0888397979", carrier: "Vinaphone", price: 9_800_000, category: "Thần tài 39 / 79", fengShuiTag: "Mệnh Thủy · Tài Lộc", seller: "Minh Sim", isVerified: true, score: 8.9 },
  { id: "m4", simNumber: "0934567890", carrier: "Mobifone", price: 65_000_000, originalPrice: 70_000_000, category: "Tiến lên / Sảnh rồng", fengShuiTag: "Mệnh Mộc · Thăng Tiến", seller: "TrustSim Official", isVerified: true, score: 9.8 },
  { id: "m5", simNumber: "0968999999", carrier: "Viettel", price: 150_000_000, category: "Tứ quý / Ngũ quý", fengShuiTag: "Mệnh Hỏa · Độc Bản", seller: "Vũ Hải Đăng", isVerified: true, score: 10 },
  { id: "m6", simNumber: "0355123123", carrier: "Viettel", price: 3_200_000, originalPrice: 4_000_000, category: "Taxi / Lặp đôi", fengShuiTag: "Dễ nhớ · Ấn tượng", seller: "Kho SIM Giá Gốc", isVerified: false, score: 8.2 },
  { id: "m7", simNumber: "0799393939", carrier: "Mobifone", price: 28_000_000, category: "Thần tài 39 / 79", fengShuiTag: "Mệnh Kim · Kinh Doanh", seller: "Hoàng Phát", isVerified: true, score: 9.4 },
  { id: "m8", simNumber: "0912199898", carrier: "Vinaphone", price: 4_500_000, category: "Năm sinh / Kỷ niệm", fengShuiTag: "Năm sinh 1998", seller: "Nguyễn Văn Hùng", isVerified: true, score: 8.0 },
  { id: "m9", simNumber: "0568886688", carrier: "Vietnamobile", price: 2_800_000, originalPrice: 3_500_000, category: "Lộc phát 68 / 86", fengShuiTag: "Mệnh Thổ · Kinh Tế", seller: "Việt SIM", isVerified: false, score: 7.9 },
  { id: "m10", simNumber: "0886555555", carrier: "Vinaphone", price: 95_000_000, category: "Tứ quý / Ngũ quý", fengShuiTag: "Mệnh Thủy · Trường Cửu", seller: "TrustSim VIP", isVerified: true, score: 9.9 },
  { id: "m11", simNumber: "0909123456", carrier: "Mobifone", price: 32_000_000, category: "Tiến lên / Sảnh rồng", fengShuiTag: "Mệnh Mộc · Hanh Thông", seller: "Thành Đạt SIM", isVerified: true, score: 9.3 },
  { id: "m12", simNumber: "0989898989", carrier: "Viettel", price: 88_000_000, category: "Taxi / Lặp đôi", fengShuiTag: "Mệnh Kim · Đẳng Cấp", seller: "Phú Quý SIM", isVerified: true, score: 9.7 },
];

export default function MarketPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState("Tất cả");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả loại SIM");
  const [priceRangeIndex, setPriceRangeIndex] = useState(0);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortBy, setSortBy] = useState<"priceAsc" | "priceDesc" | "score">("score");

  // Filtering & Sorting
  const filteredSims = useMemo(() => {
    return MOCK_MARKET_SIMS.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const cleanQuery = searchQuery.toLowerCase().replace(/[\s.-]/g, "");
        const cleanSim = item.simNumber.replace(/\s/g, "");
        const matchNumber = cleanSim.includes(cleanQuery);
        const matchCategory = item.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchTag = item.fengShuiTag?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCarrier = item.carrier.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchNumber && !matchCategory && !matchTag && !matchCarrier) {
          return false;
        }
      }

      // Carrier
      if (selectedCarrier !== "Tất cả" && item.carrier !== selectedCarrier) {
        return false;
      }

      // Category
      if (selectedCategory !== "Tất cả loại SIM" && item.category !== selectedCategory) {
        return false;
      }

      // Price Range
      const range = PRICE_RANGES[priceRangeIndex];
      if (item.price < range.min || item.price > range.max) {
        return false;
      }

      // Only Verified
      if (onlyVerified && !item.isVerified) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "priceAsc") return a.price - b.price;
      if (sortBy === "priceDesc") return b.price - a.price;
      return (b.score || 0) - (a.score || 0);
    });
  }, [searchQuery, selectedCarrier, selectedCategory, priceRangeIndex, onlyVerified, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCarrier("Tất cả");
    setSelectedCategory("Tất cả loại SIM");
    setPriceRangeIndex(0);
    setOnlyVerified(false);
    setSortBy("score");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F9FA", paddingTop: 64 }}>
      {/* ═══════════════════════════════════════════════════════════
          1. HERO SECTION: AI NATURAL LANGUAGE SEARCH BAR (GLASSMORPHISM)
      ═══════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: "linear-gradient(135deg, #001743 0%, #002266 50%, #0B1E40 100%)",
          color: "#FFFFFF",
          padding: "52px 0 44px",
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Ambient Glows */}
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 350,
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, rgba(228, 1, 30, 0.08) 50%, transparent 80%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <div className="container" style={{ maxWidth: 940, margin: "0 auto", padding: "0 20px", textAlign: "center", position: "relative", zIndex: 2 }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 999,
              background: "rgba(139, 92, 246, 0.15)",
              border: "1px solid rgba(139, 92, 246, 0.35)",
              color: "#C4B5FD",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            <Icons.Sparkles />
            <span>Thị Trường Mua Bán SIM Thông Minh AI</span>
          </div>

          <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)", fontWeight: 900, color: "#FFFFFF", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            Khám Phá & Sở Hữu SIM Số Đẹp Theo Ý Muốn
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.75)", fontSize: 14, margin: "0 auto 28px", maxWidth: 640, lineHeight: 1.55 }}>
            Tra cứu hàng nghìn SIM số đẹp được xác thực nguồn gốc chính chủ. Mua ngay hoặc chuyển nhượng nhanh chóng và an toàn qua hợp đồng điện tử.
          </p>

          {/* ═══ Giant AI Search Bar with Glassmorphism ═══ */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(16px)",
              border: "1.5px solid rgba(255, 255, 255, 0.25)",
              borderRadius: 14,
              padding: "6px 8px 6px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 16px 40px rgba(0, 0, 0, 0.24)",
            }}
          >
            <span style={{ color: "#C4B5FD", flexShrink: 0 }}><Icons.Sparkles /></span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập yêu cầu bằng ngôn ngữ tự nhiên: 'Tìm SIM phong thủy mệnh Kim dưới 15 triệu' hoặc số '090...88'..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 500,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 14, padding: "4px 8px" }}
              >
                ✕
              </button>
            )}
            <button
              className="btn-red"
              style={{
                padding: "10px 22px",
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
              }}
            >
              <Icons.Search />
              <span>Tìm Kiếm AI</span>
            </button>
          </div>

          {/* Quick AI Prompts Tags */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <span style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.55)", fontWeight: 600 }}>Gợi ý nhanh:</span>
            {QUICK_AI_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setSearchQuery(prompt)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  borderRadius: 999,
                  padding: "3px 10px",
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: 11.5,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.16)";
                  e.currentTarget.style.color = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. MAIN CONTENT: 2-COLUMN LAYOUT (FILTERS & CLAYMORPHISM SIM GRID)
      ═══════════════════════════════════════════════════════════ */}
      <div className="container" style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 28, alignItems: "flex-start" }}>
          
          {/* ═══ LEFT SIDEBAR FILTERS ═══ */}
          <aside
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "20px 18px",
              boxShadow: "0 2px 6px rgba(0, 23, 67, 0.02)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              position: "sticky",
              top: 80,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F3F4F6", paddingBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 800, color: "#001743" }}>
                <Icons.Filter />
                <span>Bộ Lọc SIM</span>
              </div>
              <button
                onClick={handleResetFilters}
                style={{
                  background: "none",
                  border: "none",
                  color: "#E4011E",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Icons.Refresh /> Đặt lại
              </button>
            </div>

            {/* Filter 1: Nhà Mạng */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#001743", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Nhà mạng viễn thông
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {CARRIERS.map((c) => (
                  <label key={c} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="carrier"
                      checked={selectedCarrier === c}
                      onChange={() => setSelectedCarrier(c)}
                      style={{ accentColor: "#E4011E", width: 15, height: 15 }}
                    />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter 2: Thể Loại SIM */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#001743", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Dòng SIM số đẹp
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #D1D5DB",
                  fontSize: 13,
                  color: "#001743",
                  outline: "none",
                  background: "#FFFFFF",
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Mức Giá */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#001743", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Khoảng giá
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {PRICE_RANGES.map((range, idx) => (
                  <label key={range.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#374151", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="priceRange"
                      checked={priceRangeIndex === idx}
                      onChange={() => setPriceRangeIndex(idx)}
                      style={{ accentColor: "#E4011E", width: 15, height: 15 }}
                    />
                    <span>{range.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter 4: Chỉ SIM đã định danh chính chủ */}
            <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#001743", fontWeight: 700, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  style={{ accentColor: "#16A34A", width: 16, height: 16 }}
                />
                <span>Chỉ SIM Đã Định Danh ✓</span>
              </label>
            </div>
          </aside>

          {/* ═══ RIGHT SIM MARKET GRID ═══ */}
          <main>
            {/* Header Toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
              <div>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#001743" }}>
                  Danh sách SIM ({filteredSims.length} số phù hợp)
                </span>
              </div>

              {/* Sort By */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6B7280" }}>
                <span>Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #D1D5DB",
                    fontSize: 12.5,
                    color: "#001743",
                    fontWeight: 600,
                    outline: "none",
                    background: "#FFFFFF",
                  }}
                >
                  <option value="score">Điểm AI Đánh Giá Cao Nhất</option>
                  <option value="priceAsc">Giá từ thấp đến cao</option>
                  <option value="priceDesc">Giá từ cao đến thấp</option>
                </select>
              </div>
            </div>

            {filteredSims.length === 0 ? (
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  padding: "48px 24px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#001743", marginBottom: 6 }}>
                  Không tìm thấy SIM phù hợp với tiêu chí
                </div>
                <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 16px" }}>
                  Hãy thử điều chỉnh lại mức giá, nhà mạng hoặc nhập từ khóa tìm kiếm AI khác.
                </p>
                <button onClick={handleResetFilters} className="btn-outline" style={{ padding: "8px 18px", fontSize: 13 }}>
                  Xóa bộ lọc tìm kiếm
                </button>
              </div>
            ) : (
              /* ═══ CLAYMORPHISM 3D CHAMFERED SIM CARDS GRID ═══ */
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 16 }}>
                {filteredSims.map((sim) => (
                  <MarketSimCard key={sim.id} sim={sim} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUBCOMPONENT: Chamfered Corner Claymorphism Market SIM Card
═══════════════════════════════════════════════════════════════ */
function MarketSimCard({ sim }: { sim: MarketSimItem }) {
  // Format 0988 66 88 66
  const formattedSim = sim.simNumber.replace(/(\d{4})(\d{2,3})(\d{3,4})/, "$1 $2 $3");

  const carrierColorMap: Record<string, string> = {
    Viettel: "#E4011E",
    Mobifone: "#005BAA",
    Vinaphone: "#00A3E0",
    Vietnamobile: "#FF6600",
    Wintel: "#E60000",
  };

  const carrierColor = carrierColorMap[sim.carrier] || "#001743";

  return (
    <div
      className="market-sim-card"
      style={{
        background: "#FFFFFF",
        borderRadius: "8px 24px 8px 8px", // Chamfered feel
        border: "1px solid #E5E7EB",
        boxShadow: "0 4px 14px rgba(0, 23, 67, 0.05)",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        transition: "all 0.22s ease",
        cursor: "pointer",
      }}
    >
      {/* Top Bar: Carrier & FengShui Tag */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: carrierColor,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {sim.carrier}
          </span>
          {sim.fengShuiTag && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: "#6B7280",
                background: "#F3F4F6",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {sim.fengShuiTag}
            </span>
          )}
        </div>

        {/* Big Crisp SIM Number */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: "#001743",
            letterSpacing: "0.06em",
            fontVariantNumeric: "tabular-nums",
            margin: "4px 0 6px",
          }}
        >
          {formattedSim}
        </div>

        {/* Category & Seller badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#6B7280", marginBottom: 14 }}>
          <span>{sim.category}</span>
          {sim.isVerified && (
            <span style={{ color: "#16A34A", display: "inline-flex", alignItems: "center", gap: 2, fontWeight: 700 }}>
              <Icons.ShieldCheck /> Chính chủ
            </span>
          )}
        </div>
      </div>

      {/* Bottom Bar: Price & CTA */}
      <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase" }}>
              Giá Mua Ngay
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#E4011E", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
              {sim.price.toLocaleString("vi-VN")} <span style={{ fontSize: 12, fontWeight: 700 }}>₫</span>
            </div>
          </div>
          {sim.originalPrice && (
            <div style={{ fontSize: 11.5, color: "#9CA3AF", textDecoration: "line-through" }}>
              {sim.originalPrice.toLocaleString("vi-VN")} ₫
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
          <button
            className="btn-red"
            style={{
              padding: "7px 12px",
              fontSize: 12.5,
              fontWeight: 700,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <Icons.ShoppingCart /> Mua ngay
          </button>
          <Link
            href={`/auctions/${sim.id}`}
            className="btn-outline"
            style={{
              padding: "7px 12px",
              fontSize: 12,
              borderRadius: 6,
              textDecoration: "none",
            }}
          >
            Chi tiết
          </Link>
        </div>
      </div>

      <style>{`
        .market-sim-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(0, 23, 67, 0.1), 0 2px 6px rgba(0, 0, 0, 0.04);
          border-color: #D1D5DB;
        }
      `}</style>
    </div>
  );
}
