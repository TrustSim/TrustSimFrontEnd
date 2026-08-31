"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

/* ─── Helpers ─────────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useCountUp(target: number, visible: boolean, duration = 1600) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const start = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setVal(Math.round(p * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target, duration]);
  return val;
}

/* ─── Clean Line SVG Icons (Lucide / Fintech Style) ───────── */
const Icons = {
  TrendingUp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  TrendingDown: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  UserCheck: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  ),
  Lock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  FileText: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Cpu: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="15" x2="23" y2="15" />
      <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="15" x2="4" y2="15" />
    </svg>
  ),
  Scale: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  ),
  Smartphone: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  Gavel: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" />
      <path d="m16 16 6-6" /><path d="m8 8 6-6" />
      <path d="m9 7 8 8" /><path d="m21 11-8-8" />
    </svg>
  ),
  Award: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  Users: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  RotateCcw: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  ),
  Zap: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  ZapSolid: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Flame: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  Info: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

/* ─── Countdown Timer ─────────────────────────────────────── */
function Countdown({ endTime }: { endTime: Date }) {
  const [mounted, setMounted] = useState(false);
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    setMounted(true);
    setDiff(endTime.getTime() - Date.now());
    const id = setInterval(() => setDiff(endTime.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const safe = Math.max(0, diff);
  const h = mounted ? Math.floor(safe / 3_600_000).toString().padStart(2, "0") : "00";
  const m = mounted ? Math.floor((safe % 3_600_000) / 60_000).toString().padStart(2, "0") : "00";
  const s = mounted ? Math.floor((safe % 60_000) / 1_000).toString().padStart(2, "0") : "00";
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {[h, m, s].map((v, i) => (
        <React.Fragment key={i}>
          <div className="countdown-box">
            <span className="countdown-num">{v}</span>
            <span className="countdown-label">{["GIỜ", "PHÚT", "GIÂY"][i]}</span>
          </div>
          {i < 2 && <span style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", lineHeight: 1, paddingBottom: 10 }}>:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   1. TABBED AUCTION FORMATS SECTION (Isometric 3D & Auto-Story)
   ═══════════════════════════════════════════════════════════ */
function AuctionFormatsSection() {
  const [activeTab, setActiveTab] = useState<"english" | "dutch">("english");

  // English Auto-Storyline State
  const engMilestones = [10, 12, 14, 16, 18];
  const [engStep, setEngStep] = useState(0);

  // Dutch Auto-Storyline State
  const dutchMilestones = [30, 26, 22, 18];
  const [dutchStep, setDutchStep] = useState(0);

  // English 5-second Auto-Story Loop
  useEffect(() => {
    if (activeTab !== "english") return;
    const interval = setInterval(() => {
      setEngStep((prev) => (prev + 1) % (engMilestones.length + 1));
    }, 1200);
    return () => clearInterval(interval);
  }, [activeTab, engMilestones.length]);

  // Dutch 5-second Auto-Story Loop
  useEffect(() => {
    if (activeTab !== "dutch") return;
    const interval = setInterval(() => {
      setDutchStep((prev) => (prev + 1) % (dutchMilestones.length + 1));
    }, 1300);
    return () => clearInterval(interval);
  }, [activeTab, dutchMilestones.length]);

  const activeEngIdx = Math.min(engStep, engMilestones.length - 1);
  const currentEngPrice = engMilestones[activeEngIdx];
  const isEngFinished = engStep >= engMilestones.length - 1;

  const activeDutchIdx = Math.min(dutchStep, dutchMilestones.length - 1);
  const currentDutchPrice = dutchMilestones[activeDutchIdx];
  const isDutchClaimed = dutchStep >= dutchMilestones.length - 1;

  return (
    <section className="section" style={{ background: "#F8F9FA", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}>
      <div className="container">
        {/* Section Header (Flat 2D & Clean) */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div className="section-tag" style={{ marginBottom: 12 }}>Quy chế đấu giá</div>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "#001743", letterSpacing: "-0.02em", margin: "0 0 10px" }}>
            Hai hình thức đấu giá trực quan
          </h2>
          <p style={{ fontSize: 15, color: "#4B5563", maxWidth: 540, margin: "0 auto" }}>
            Khám phá 2 cơ chế đấu giá độc đáo được mô phỏng trực tiếp theo thời gian thực.
          </p>
        </div>

        {/* Tab Navigation (Flat 2D with Smooth Active State) */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "inline-flex",
              background: "#E5E7EB",
              padding: 4,
              borderRadius: 8,
              gap: 4,
            }}
          >
            <button
              onClick={() => { setActiveTab("english"); setEngStep(0); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 24px",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                border: "none",
                transition: "all 0.25s ease",
                background: activeTab === "english" ? "#FFFFFF" : "transparent",
                color: activeTab === "english" ? "#001743" : "#6B7280",
                boxShadow: activeTab === "english" ? "0 4px 12px rgba(0,0,0,0.06)" : "none",
                transform: activeTab === "english" ? "translateY(-1px)" : "none",
              }}
            >
              <span style={{ color: activeTab === "english" ? "#2563EB" : "currentColor" }}><Icons.TrendingUp /></span>
              Đấu giá kiểu Anh (Tăng dần)
            </button>
            <button
              onClick={() => { setActiveTab("dutch"); setDutchStep(0); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 24px",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                border: "none",
                transition: "all 0.25s ease",
                background: activeTab === "dutch" ? "#FFFFFF" : "transparent",
                color: activeTab === "dutch" ? "#001743" : "#6B7280",
                boxShadow: activeTab === "dutch" ? "0 4px 12px rgba(0,0,0,0.06)" : "none",
                transform: activeTab === "dutch" ? "translateY(-1px)" : "none",
              }}
            >
              <span style={{ color: activeTab === "dutch" ? "#16A34A" : "currentColor" }}><Icons.TrendingDown /></span>
              Đấu giá kiểu Hà Lan (Giảm dần)
            </button>
          </div>
        </div>

        {/* Tab Content Card (Flat Left Side + Isometric 3D Right Side) */}
        <div
          className="card"
          style={{
            padding: "36px",
            borderRadius: 8,
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            boxShadow: "0 8px 30px rgba(0, 23, 67, 0.04)",
          }}
        >
          {activeTab === "english" ? (
            /* ─── TAB 1: ENGLISH AUCTION ─── */
            <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1.25fr", gap: 40, alignItems: "center" }}>
              {/* Left Column: Rules & Info (Completely Flat 2D for Best Readability) */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span className="badge badge-english">English Auction</span>
                  <span className="badge" style={{ background: "rgba(0,23,67,0.06)", color: "#001743" }}>Phổ biến nhất</span>
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: "#001743", margin: "0 0 12px" }}>
                  Đấu giá tăng dần từng bước
                </h3>
                <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.7, marginBottom: 20 }}>
                  Người tham gia lần lượt đưa ra mức giá cao hơn mức hiện tại tối thiểu một bước giá quy định. Khi hết thời gian, người trả giá cao nhất sẽ giành quyền sở hữu số SIM.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {[
                    "Bước giá rõ ràng, minh bạch cho mọi lượt đặt giá",
                    "Cơ chế tự động gia hạn khi có người trả giá ở những phút cuối",
                    "Người có mức giá cao nhất khi hết giờ chiến thắng",
                  ].map((rule, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", fontWeight: 500 }}>
                      <Icons.Check /> {rule}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["Đặt giá từng bước", "Người cao nhất thắng", "Gia hạn tự động"].map((t) => (
                    <span key={t} style={{ fontSize: 12, fontWeight: 600, color: "#2563EB", background: "rgba(37,99,235,0.08)", padding: "4px 10px", borderRadius: 4 }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Column: Isometric 3D Floating Chart Card */}
              <div className="chart-container-perspective" style={{ position: "relative" }}>
                {/* Floating 3D Badge Layer (TranslateZ) */}
                <div
                  className="floating-badge-3d"
                  style={{
                    position: "absolute",
                    top: -12,
                    left: 20,
                    background: "#FFFFFF",
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #E5E7EB",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#001743",
                    zIndex: 10,
                  }}
                >
                  <span style={{ color: "#E4011E" }}><Icons.Gavel /></span>
                  <span>SIM VIP 0988.888.888</span>
                </div>

                {/* 3D Tilted Card */}
                <div
                  className="chart-card-3d"
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 8,
                    padding: "24px 20px 18px",
                    border: "1px solid #E5E7EB",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#001743", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        Diễn biến phiên đấu giá
                      </span>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>Tự động mô phỏng theo lượt trả giá</div>
                    </div>
                    {/* Glassmorphism Count-up Price Pill */}
                    <div className="glass-panel" style={{ padding: "6px 12px", borderRadius: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="status-dot status-dot-live" />
                      <span style={{ fontSize: 14, fontWeight: 900, color: isEngFinished ? "#16A34A" : "#E4011E", fontVariantNumeric: "tabular-nums", transition: "color 0.3s" }}>
                        {currentEngPrice}.000.000 ₫
                      </span>
                    </div>
                  </div>

                  {/* SVG Chart (Path Drawing Animation & Pop-up Ripples) */}
                  <div style={{ height: 120, width: "100%", position: "relative", marginBottom: 14, overflow: "hidden", background: "#F8F9FA", borderRadius: 6, border: "1px solid #E5E7EB", padding: "10px 14px" }}>
                    <svg width="100%" height="100" viewBox="0 0 380 100" preserveAspectRatio="none" style={{ overflow: "hidden" }}>
                      <defs>
                        <linearGradient id="engIsoGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid lines */}
                      <line x1="0" y1="20" x2="380" y2="20" stroke="#E5E7EB" strokeDasharray="3 3" />
                      <line x1="0" y1="55" x2="380" y2="55" stroke="#E5E7EB" strokeDasharray="3 3" />
                      <line x1="0" y1="85" x2="380" y2="85" stroke="#E5E7EB" />

                      {/* Connected Animated Path */}
                      {(() => {
                        const total = engMilestones.length;
                        const stepX = 380 / (total - 1);
                        const allPoints = engMilestones.map((val, idx) => {
                          const x = Math.min(Math.max(idx * stepX, 15), 365);
                          const y = 80 - ((val - 10) / 9) * 60;
                          return { x, y: Math.max(y, 16), val };
                        });

                        const drawnPoints = allPoints.slice(0, activeEngIdx + 1);
                        const pathD = drawnPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x},${pt.y}`, "");
                        const areaD = drawnPoints.length > 1 ? `${pathD} L ${drawnPoints[drawnPoints.length - 1].x},85 L ${drawnPoints[0].x},85 Z` : "";

                        return (
                          <>
                            {areaD && <path d={areaD} fill="url(#engIsoGrad)" />}
                            {pathD && <path d={pathD} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" style={{ transition: "all 0.4s ease" }} />}

                            {/* Milestones / Pop-up Nodes */}
                            {allPoints.map((pt, i) => {
                              const isReached = i <= activeEngIdx;
                              const isCurrent = i === activeEngIdx;
                              return (
                                <g key={i} style={{ opacity: isReached ? 1 : 0.25, transition: "opacity 0.3s ease" }}>
                                  {/* Wave ripple on active node */}
                                  {isCurrent && (
                                    <circle cx={pt.x} cy={pt.y} r="8" fill="#2563EB" opacity="0.3">
                                      <animate attributeName="r" values="4;14;4" dur="1.4s" repeatCount="indefinite" />
                                      <animate attributeName="opacity" values="0.6;0;0.6" dur="1.4s" repeatCount="indefinite" />
                                    </circle>
                                  )}
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={isCurrent ? 5.5 : 3.5}
                                    fill={isCurrent ? (isEngFinished ? "#16A34A" : "#E4011E") : "#2563EB"}
                                    stroke="#FFFFFF"
                                    strokeWidth="1.5"
                                    style={{ transition: "all 0.3s ease" }}
                                  />
                                  <text x={pt.x} y={pt.y - 7} textAnchor={i === total - 1 ? "end" : i === 0 ? "start" : "middle"} fontSize="9.5" fontWeight="700" fill={isCurrent ? (isEngFinished ? "#16A34A" : "#E4011E") : "#6B7280"}>
                                    {pt.val}M
                                  </text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* Refined Bottom Controls (Status Banner & Replay Button) */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: isEngFinished ? "#16A34A" : "#4B5563", fontWeight: 600 }}>
                      <span className="status-dot" style={{ background: isEngFinished ? "#16A34A" : "#E4011E" }} />
                      <span>
                        {isEngFinished
                          ? "Hoàn tất: Mức giá 18.000.000 ₫ chiến thắng phiên!"
                          : `Đang trả giá: Lượt trả giá thứ #${activeEngIdx + 1} (+2.000.000 ₫)`}
                      </span>
                    </div>
                    <button
                      onClick={() => setEngStep(0)}
                      style={{
                        padding: "5px 10px",
                        fontSize: 12,
                        borderRadius: 4,
                        background: "#F3F4F6",
                        border: "1px solid #E5E7EB",
                        color: "#001743",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontWeight: 600,
                      }}
                      title="Xem lại mô phỏng từ đầu"
                    >
                      <Icons.RotateCcw /> Phát lại
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ─── TAB 2: DUTCH AUCTION ─── */
            <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1.25fr", gap: 40, alignItems: "center" }}>
              {/* Left Column: Rules & Info */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span className="badge badge-dutch">Dutch Auction</span>
                  <span className="badge" style={{ background: "rgba(0,23,67,0.06)", color: "#001743" }}>Chốt giá tức thì</span>
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: "#001743", margin: "0 0 12px" }}>
                  Đấu giá giảm dần theo chu kỳ
                </h3>
                <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.7, marginBottom: 20 }}>
                  Giá khởi điểm từ mức trần và tự động giảm dần theo từng khoảng thời gian. Người đầu tiên chấp nhận mức giá hiện tại sẽ chiến thắng và sở hữu số SIM ngay lập tức.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {[
                    "Giá tự động giảm từng nấc theo chu kỳ thời gian định sẵn",
                    "Ai bấm chốt giá trước sẽ giành chiến thắng ngay tức thì",
                    "Phù hợp cho người muốn mua nhanh với giá hợp lý kỳ vọng",
                  ].map((rule, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", fontWeight: 500 }}>
                      <Icons.Check /> {rule}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["Giá giảm tự động", "Chốt giá tức thì", "Quyết đoán"].map((t) => (
                    <span key={t} style={{ fontSize: 12, fontWeight: 600, color: "#16A34A", background: "rgba(22,163,74,0.08)", padding: "4px 10px", borderRadius: 4 }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Column: Isometric 3D Floating Chart Card */}
              <div className="chart-container-perspective" style={{ position: "relative" }}>
                {/* Floating 3D Badge Layer (TranslateZ) */}
                <div
                  className="floating-badge-3d"
                  style={{
                    position: "absolute",
                    top: -12,
                    left: 20,
                    background: "#FFFFFF",
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #E5E7EB",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#001743",
                    zIndex: 10,
                  }}
                >
                  <span style={{ color: "#16A34A" }}><Icons.TrendingDown /></span>
                  <span>Khởi điểm: 30.000.000 ₫</span>
                </div>

                {/* 3D Tilted Card */}
                <div
                  className="chart-card-3d"
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 8,
                    padding: "24px 20px 18px",
                    border: "1px solid #E5E7EB",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#001743", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        Diễn biến giá tự động giảm
                      </span>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>Giá giảm tự động theo từng chu kỳ</div>
                    </div>
                    {/* Glassmorphism Price Pill */}
                    <div className="glass-panel" style={{ padding: "6px 12px", borderRadius: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="status-dot" style={{ background: isDutchClaimed ? "#16A34A" : "#F59E0B" }} />
                      <span style={{ fontSize: 14, fontWeight: 900, color: isDutchClaimed ? "#16A34A" : "#001743", fontVariantNumeric: "tabular-nums" }}>
                        {isDutchClaimed ? "Đã chốt: 18M" : `${currentDutchPrice}.000.000 ₫`}
                      </span>
                    </div>
                  </div>

                  {/* SVG Chart (Stepped Curve Drawing) */}
                  <div style={{ height: 120, width: "100%", position: "relative", marginBottom: 14, overflow: "hidden", background: "#F8F9FA", borderRadius: 6, border: "1px solid #E5E7EB", padding: "10px 14px" }}>
                    <svg width="100%" height="100" viewBox="0 0 380 100" preserveAspectRatio="none" style={{ overflow: "hidden" }}>
                      <defs>
                        <linearGradient id="dutchIsoGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#16A34A" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#16A34A" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid lines */}
                      <line x1="0" y1="20" x2="380" y2="20" stroke="#E5E7EB" strokeDasharray="3 3" />
                      <line x1="0" y1="55" x2="380" y2="55" stroke="#E5E7EB" strokeDasharray="3 3" />
                      <line x1="0" y1="85" x2="380" y2="85" stroke="#E5E7EB" />

                      {/* Stepped line */}
                      {(() => {
                        const stepW = 380 / dutchMilestones.length;
                        let pathD = "";
                        dutchMilestones.forEach((val, i) => {
                          if (i > activeDutchIdx) return;
                          const x1 = i * stepW;
                          const x2 = (i + 1) * stepW;
                          const y = 25 + (i / (dutchMilestones.length - 1)) * 55;
                          if (i === 0) pathD += `M ${x1},${y} L ${x2},${y}`;
                          else pathD += ` L ${x1},${y} L ${x2},${y}`;
                        });

                        const activeX = (activeDutchIdx + 0.5) * stepW;
                        const activeY = 25 + (activeDutchIdx / (dutchMilestones.length - 1)) * 55;

                        return (
                          <>
                            {pathD && <path d={`${pathD} L ${(activeDutchIdx + 1) * stepW},85 L 0,85 Z`} fill="url(#dutchIsoGrad)" />}
                            {pathD && <path d={pathD} fill="none" stroke="#16A34A" strokeWidth="2.5" />}

                            {dutchMilestones.map((val, i) => {
                              const x = (i + 0.5) * stepW;
                              const y = 25 + (i / (dutchMilestones.length - 1)) * 55;
                              const isReached = i <= activeDutchIdx;
                              const isCurrent = i === activeDutchIdx;
                              return (
                                <g key={i} style={{ opacity: isReached ? 1 : 0.25, transition: "opacity 0.3s ease" }}>
                                  <circle cx={x} cy={y} r={isCurrent ? 5.5 : 3.5} fill={isCurrent ? (isDutchClaimed ? "#16A34A" : "#E4011E") : "#16A34A"} stroke="#FFFFFF" strokeWidth="1.5" />
                                  <text x={x} y={y - 7} textAnchor="middle" fontSize="9.5" fontWeight={isCurrent ? "800" : "600"} fill={isCurrent ? (isDutchClaimed ? "#16A34A" : "#E4011E") : "#6B7280"}>
                                    {val}M
                                  </text>
                                </g>
                              );
                            })}

                            {/* Pulsing indicator at current step */}
                            {!isDutchClaimed && (
                              <circle cx={activeX} cy={activeY} r="9" fill="#E4011E" opacity="0.25">
                                <animate attributeName="r" values="5;14;5" dur="1.3s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.5;0;0.5" dur="1.3s" repeatCount="indefinite" />
                              </circle>
                            )}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* Refined Bottom Controls */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: isDutchClaimed ? "#16A34A" : "#4B5563", fontWeight: 600 }}>
                      <span className="status-dot" style={{ background: isDutchClaimed ? "#16A34A" : "#F59E0B" }} />
                      <span>
                        {isDutchClaimed
                          ? "Người mua #892 vừa chốt mua thành công tại 18M!"
                          : `Giá đang hạ nấc: ${currentDutchPrice}.000.000 ₫`}
                      </span>
                    </div>
                    <button
                      onClick={() => setDutchStep(0)}
                      style={{
                        padding: "5px 10px",
                        fontSize: 12,
                        borderRadius: 4,
                        background: "#F3F4F6",
                        border: "1px solid #E5E7EB",
                        color: "#001743",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontWeight: 600,
                      }}
                      title="Xem lại mô phỏng từ đầu"
                    >
                      <Icons.RotateCcw /> Phát lại
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   2. INTERACTIVE 5-STEP WORKFLOW WITH LINKED TABS & TIMELINE
   ═══════════════════════════════════════════════════════════ */
interface StepDetail {
  id: number;
  stepNumber: string;
  icon: React.ReactNode;
  title: string;
  shortDesc: string;
  detailHeading: string;
  detailDesc: string;
  platformTag: string;
  checklist: string[];
}

const stepsData: StepDetail[] = [
  {
    id: 1,
    stepNumber: "01",
    icon: <Icons.Search />,
    title: "Khám phá SIM",
    shortDesc: "Tìm SIM theo nhà mạng, danh mục và bộ lọc giá",
    detailHeading: "Tra cứu & Thẩm định SIM minh bạch",
    detailDesc: "Người mua có thể tìm kiếm SIM VIP theo ý thích (Tứ quý, Lộc phát, Thần tài...), xem lịch sử định giá và xác thực tình trạng SIM chính chủ trước khi bước vào phòng đấu giá.",
    platformTag: "Sàn TrustSim",
    checklist: [
      "Bộ lọc nâng cao theo đầu số (090, 098, 088...), nhịp số và phong thủy",
      "Xác minh thông tin thuê bao còn hợp lệ từ kho dữ liệu nhà mạng",
      "Ước tính giá trị thị trường và gợi ý mức giá trúng kỳ vọng",
    ],
  },
  {
    id: 2,
    stepNumber: "02",
    icon: <Icons.Gavel />,
    title: "Tham gia đấu giá",
    shortDesc: "Đặt cọc bảo đảm và bắt đầu đặt giá",
    detailHeading: "Đặt cọc Ký quỹ & Đấu giá trực tiếp",
    detailDesc: "Người tham gia nạp tiền đặt cọc (10% giá khởi điểm) vào tài khoản ký quỹ bảo đảm. Hệ thống cập nhật bảng giá trực tiếp theo thời gian thực không độ trễ, công khai minh bạch từng lượt trả giá.",
    platformTag: "Phòng Đấu Giá Trực Tiếp",
    checklist: [
      "Ký quỹ đặt cọc an toàn (Tự động hoàn trả 100% nếu không trúng đấu giá)",
      "Theo dõi bảng giá trực tiếp theo thời gian thực, không bị chậm trễ",
      "Hỗ trợ tính năng tự động trả giá theo hạn mức ngân sách bạn mong muốn",
    ],
  },
  {
    id: 3,
    stepNumber: "03",
    icon: <Icons.Award />,
    title: "Chiến thắng phiên",
    shortDesc: "Trúng đấu giá với mức giá cao nhất hoặc chốt giá",
    detailHeading: "Xác nhận kết quả & Khóa giao dịch độc quyền",
    detailDesc: "Khi đồng hồ đếm ngược kết thúc, hệ thống tự động khóa phiên, lập biên bản điện tử ghi nhận người thắng cuộc và gửi thông báo xác nhận giao dịch cho cả hai bên.",
    platformTag: "Hệ thống Tự Động",
    checklist: [
      "Biên bản trúng đấu giá được cấp mã số niêm phong điện tử chống giả mạo",
      "Khóa quyền chuyển nhượng của người bán, bảo vệ người mua",
      "Thông báo lịch hẹn ký hợp đồng trong 24 giờ",
    ],
  },
  {
    id: 4,
    stepNumber: "04",
    icon: <Icons.FileText />,
    title: "Ký hợp đồng",
    shortDesc: "Ký hợp đồng điện tử, tiền được giữ tại Ký quỹ",
    detailHeading: "Ký hợp đồng số pháp lý & Khóa tiền Ký quỹ",
    detailDesc: "Hai bên ký hợp đồng chuyển nhượng điện tử có chứng thực pháp lý. Người mua thanh toán toàn bộ số tiền còn lại vào tài khoản Ký quỹ của TrustSim để đảm bảo an toàn tuyệt đối.",
    platformTag: "TrustSim Ký Quỹ An Toàn",
    checklist: [
      "Hợp đồng số có hiệu lực pháp lý theo Luật Giao dịch Điện tử",
      "Tiền thanh toán được bảo lưu tại Ngân hàng liên kết bảo lãnh",
      "Cố vấn viên TrustSim hỗ trợ soạn hồ sơ sang tên chính chủ",
    ],
  },
  {
    id: 5,
    stepNumber: "05",
    icon: <Icons.Smartphone />,
    title: "Bàn giao SIM",
    shortDesc: "Sang tên chính chủ tại cửa hàng nhà mạng",
    detailHeading: "Đổi chủ tại nhà mạng & Giải ngân tiền",
    detailDesc: "Người mua và người bán hẹn gặp tại điểm giao dịch của nhà mạng (Viettel, Mobi, Vina...) để làm thủ tục đổi SIM chính chủ. Sau khi chụp ảnh xác nhận, TrustSim lập tức giải ngân tiền cho người bán.",
    platformTag: "Điểm Giao Dịch Nhà Mạng",
    checklist: [
      "Nhân viên nhà mạng đối chiếu CCCD và cấp SIM vật lý/eSIM mới",
      "Tải ảnh biên lai xác nhận đổi thông tin chính chủ lên hệ thống",
      "TrustSim kiểm tra xác nhận và giải ngân tiền cho người bán trong 15 phút",
    ],
  },
];

function InteractiveHowItWorks() {
  const [activeStepId, setActiveStepId] = useState(1);
  const activeStep = stepsData.find((s) => s.id === activeStepId) || stepsData[0];

  return (
    <div>
      {/* 5 Step Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 32 }}>
        {stepsData.map((step) => {
          const isActive = step.id === activeStepId;
          return (
            <div
              key={step.id}
              onClick={() => setActiveStepId(step.id)}
              className="card"
              style={{
                padding: "18px 14px",
                borderRadius: 6,
                textAlign: "center",
                cursor: "pointer",
                borderColor: isActive ? "#E4011E" : "#E5E7EB",
                background: isActive ? "#FFFFFF" : "#F8F9FA",
                boxShadow: isActive ? "0 6px 20px rgba(228, 1, 30, 0.08)" : "none",
                transform: isActive ? "translateY(-4px)" : "none",
                transition: "all 0.25s ease",
                position: "relative",
              }}
            >
              {isActive && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#E4011E", borderRadius: "6px 6px 0 0" }} />
              )}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 4,
                  background: isActive ? "#FFF1F2" : "#FFFFFF",
                  color: isActive ? "#E4011E" : "#001743",
                  border: `1px solid ${isActive ? "rgba(228,1,30,0.2)" : "#E5E7EB"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 10px",
                  transition: "all 0.2s",
                }}
              >
                {step.icon}
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, color: isActive ? "#E4011E" : "#9CA3AF", letterSpacing: "0.06em", marginBottom: 3 }}>
                BƯỚC {step.stepNumber}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: isActive ? "#001743" : "#4B5563", marginBottom: 4 }}>
                {step.title}
              </div>
              <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {step.shortDesc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Linked Detail Box (Smooth Tab-linking) */}
      <div
        className="card"
        style={{
          padding: "32px",
          borderRadius: 6,
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 36, alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span className="badge" style={{ background: "rgba(0, 23, 67, 0.06)", color: "#001743", border: "1px solid rgba(0, 23, 67, 0.15)" }}>
                Chi tiết Bước {activeStep.stepNumber}
              </span>
              <span className="badge" style={{ background: "rgba(228, 1, 30, 0.08)", color: "#E4011E" }}>
                {activeStep.platformTag}
              </span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: "#001743", margin: "0 0 10px" }}>
              {activeStep.detailHeading}
            </h3>
            <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.7, marginBottom: 20 }}>
              {activeStep.detailDesc}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {activeStep.id > 1 && (
                <button
                  onClick={() => setActiveStepId((prev) => prev - 1)}
                  style={{ padding: "8px 16px", borderRadius: 4, background: "#F3F4F6", border: "1px solid #E5E7EB", color: "#001743", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  ← Bước {activeStep.id - 1}
                </button>
              )}
              {activeStep.id < 5 && (
                <button
                  onClick={() => setActiveStepId((prev) => prev + 1)}
                  className="btn-red"
                  style={{ padding: "8px 18px", fontSize: 13, borderRadius: 4 }}
                >
                  Xem Bước {activeStep.id + 1} →
                </button>
              )}
            </div>
          </div>

          {/* Checklist & Safety Highlights */}
          <div style={{ background: "#F8F9FA", borderRadius: 6, padding: "20px", border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#001743", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#E4011E" }}><Icons.ShieldCheck /></span>
              <span>BIỆN PHÁP BẢO ĐẢM MINH BẠCH</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeStep.checklist.map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ marginTop: 2, flexShrink: 0 }}>
                    <Icons.Check />
                  </div>
                  <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5, fontWeight: 500 }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sim Auction Card (Clean Sharp Border) ──────────────── */
interface AuctionItem { id: string; simNumber: string; carrier: string; type: string; status: string; currentPrice: number; bidCount: number; endTime: Date; category: string; }
const mockAuctions: AuctionItem[] = [
  { id: "1", simNumber: "0901 234 567", carrier: "Viettel", type: "english", status: "live", currentPrice: 15_000_000, bidCount: 24, endTime: new Date(Date.now() + 2.6 * 3_600_000), category: "Sảnh tiến" },
  { id: "2", simNumber: "0777 777 777", carrier: "Mobifone", type: "dutch", status: "live", currentPrice: 42_000_000, bidCount: 8, endTime: new Date(Date.now() + 4 * 3_600_000), category: "Lục quý" },
  { id: "3", simNumber: "0988 123 456", carrier: "Vinaphone", type: "english", status: "live", currentPrice: 8_500_000, bidCount: 15, endTime: new Date(Date.now() + 1.5 * 3_600_000), category: "Lộc phát" },
  { id: "4", simNumber: "0969 696 969", carrier: "Viettel", type: "dutch", status: "upcoming", currentPrice: 25_000_000, bidCount: 0, endTime: new Date(Date.now() + 8 * 3_600_000), category: "Lặp đôi" },
];

function SimAuctionCard({ data }: { data: AuctionItem }) {
  return (
    <Link href={`/auction/${data.id}`} style={{ textDecoration: "none" }}>
      <div className="card" style={{ padding: "18px 20px", cursor: "pointer", borderRadius: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            {data.status === "live" ? <span className="badge badge-live" style={{ marginBottom: 8, display: "inline-flex" }}>Đang diễn ra</span>
              : data.status === "upcoming" ? <span className="badge badge-upcoming" style={{ marginBottom: 8, display: "inline-flex" }}>Sắp diễn ra</span>
                : <span className="badge badge-ended" style={{ marginBottom: 8, display: "inline-flex" }}>Đã kết thúc</span>}
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.08em", color: "#001743", fontVariantNumeric: "tabular-nums" }}>{data.simNumber}</div>
          </div>
          {data.type === "english" ? <span className="badge badge-english">English</span> : <span className="badge badge-dutch">Dutch</span>}
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: "#4B5563", background: "#F3F4F6", padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>{data.carrier}</span>
          <span style={{ fontSize: 12, color: "#4B5563", background: "#F3F4F6", padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>{data.category}</span>
        </div>
        <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, marginBottom: 2 }}>GIÁ HIỆN TẠI</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#E4011E", fontVariantNumeric: "tabular-nums" }}>{data.currentPrice.toLocaleString("vi-VN")} ₫</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{data.bidCount} lượt đặt giá</div>
          </div>
          {data.status !== "ended" && <Countdown endTime={data.endTime} />}
        </div>
      </div>
    </Link>
  );
}

/* ─── Hero SIM Card Visual (Clean & Sharp) ───────────────── */
function HeroSimCard() {
  const [price, setPrice] = useState(25_000_000);
  const [bids, setBids] = useState(18);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      setPrice((p) => p + Math.floor(Math.random() * 2_000_000) + 500_000);
      setBids((b) => b + 1);
      setFlash(true); setTimeout(() => setFlash(false), 500);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="animate-float" style={{ position: "relative" }}>
      {/* Floating notification */}
      <div style={{
        position: "absolute", top: -14, right: -14, background: "#FFFFFF",
        borderRadius: 6, padding: "8px 12px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.06)", border: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", gap: 8, zIndex: 10,
        animation: "fade-in 0.6s ease 0.8s both"
      }}>
        <div style={{ width: 26, height: 26, borderRadius: 4, background: "#FFF1F2", color: "#E4011E", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icons.Gavel />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Vừa đặt giá</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#E4011E" }}>+1.000.000 ₫</div>
        </div>
      </div>

      {/* Main card */}
      <div style={{
        width: 310, background: "#FFFFFF", borderRadius: 6, overflow: "hidden",
        boxShadow: "0 8px 30px rgba(0,0,0,0.06)", border: "1px solid #E5E7EB"
      }}>
        <div style={{ background: "#001743", padding: "18px 20px 16px", borderBottom: "2px solid #E4011E" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="badge badge-live" style={{ fontSize: 10 }}>Đang diễn ra</span>
            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Tứ quý 8</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.08em", fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>0988 888 888</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Viettel · SIM VIP</div>
        </div>
        <div style={{ padding: "18px 20px 20px" }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 2 }}>GIÁ HIỆN TẠI</div>
            <div style={{ fontSize: 26, fontWeight: 900, fontVariantNumeric: "tabular-nums", color: flash ? "#E4011E" : "#001743", transition: "color 0.3s", letterSpacing: "-0.02em" }}>
              {price.toLocaleString("vi-VN")} ₫
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, marginBottom: 4 }}>LƯỢT ĐẶT</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#001743", display: "flex", alignItems: "center", gap: 4 }}>
                <Icons.Users /> {bids} người
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, marginBottom: 4 }}>THỜI GIAN CÒN</div>
              <Countdown endTime={new Date(Date.now() + 2 * 3600000 + 15 * 60000)} />
            </div>
          </div>
          <button className="btn-red" style={{ width: "100%", justifyContent: "center" }}>
            Tham gia đấu giá
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Header with TrustSim-Logo.png ───────────────────────── */
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: scrolled ? "rgba(255,255,255,0.96)" : "#FFFFFF", borderBottom: "1px solid #E5E7EB", transition: "all 0.2s ease" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", height: 60, gap: 32 }}>
          {/* Logo with TrustSim-Logo.png */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <Image
              src="/logo/TrustSim-Logo.png"
              alt="TrustSim Logo"
              width={132}
              height={36}
              priority
              style={{ height: 34, width: "auto", objectFit: "contain" }}
            />
          </Link>
          <div className="ts-desktop-nav" style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
            {[["Khám phá SIM", "/auctions"], ["Đấu giá", "/auctions?tab=all"], ["Quy trình", "#how-it-works"]].map(([l, h]) => (
              <a key={l} href={h} className="btn-ghost-nav">{l}</a>
            ))}
          </div>
          <div className="ts-desktop-nav" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/login" className="btn-ghost-nav" style={{ fontWeight: 600, color: "#001743" }}>Đăng nhập</Link>
            <Link href="/register" className="btn-red" style={{ padding: "8px 18px", fontSize: 14 }}>Đăng ký</Link>
          </div>
          <button className="ts-mobile-btn" onClick={() => setMenuOpen(!menuOpen)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 4, color: "#001743" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect y="4" width="22" height="2" rx="1" fill="currentColor" /><rect y="10" width="22" height="2" rx="1" fill="currentColor" /><rect y="16" width="22" height="2" rx="1" fill="currentColor" /></svg>
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "#FFFFFF", display: "flex", flexDirection: "column", padding: "80px 24px 24px", gap: 8 }}>
          {[["Khám phá SIM", "/auctions"], ["Đấu giá", "/auctions?tab=all"], ["Đăng nhập", "/login"], ["Đăng ký", "/register"]].map(([l, h]) => (
            <a key={l} href={h} onClick={() => setMenuOpen(false)} style={{ padding: "12px 16px", borderRadius: 6, color: "#001743", fontSize: 15, fontWeight: 600, textDecoration: "none", background: "#F8F9FA", border: "1px solid #E5E7EB", display: "block" }}>{l}</a>
          ))}
          <button onClick={() => setMenuOpen(false)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#001743" }}>✕</button>
        </div>
      )}
      <style>{`.ts-desktop-nav { display: flex !important; } .ts-mobile-btn { display: none !important; } @media (max-width: 768px) { .ts-desktop-nav { display: none !important; } .ts-mobile-btn { display: flex !important; } }`}</style>
    </>
  );
}

/* ─── Footer Component ────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: "#001743", color: "#FFFFFF", padding: "56px 0 32px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ background: "#FFFFFF", padding: "4px 8px", borderRadius: 4, display: "inline-flex" }}>
                <Image
                  src="/logo/TrustSim-Logo.png"
                  alt="TrustSim Logo"
                  width={110}
                  height={28}
                  style={{ height: 24, width: "auto", objectFit: "contain" }}
                />
              </div>
            </div>
            <p style={{ color: "#9CA3AF", fontSize: 14, lineHeight: 1.8, maxWidth: 280 }}>Sàn đấu giá SIM số đẹp uy tín, minh bạch và an toàn hàng đầu Việt Nam.</p>
          </div>
          {[
            { title: "Sản phẩm", links: ["Khám phá SIM", "Đấu giá đang diễn ra", "Bán SIM của bạn", "Định giá SIM"] },
            { title: "Hỗ trợ", links: ["Hướng dẫn đấu giá", "Câu hỏi thường gặp", "Liên hệ hỗ trợ", "Chính sách"] },
            { title: "Về chúng tôi", links: ["Giới thiệu", "Tin tức", "Đối tác", "Tuyển dụng"] },
          ].map((col) => (
            <div key={col.title}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "#FFFFFF" }}>{col.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map((l) => <a key={l} href="#" style={{ color: "#9CA3AF", fontSize: 14, textDecoration: "none" }}>{l}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ color: "#6B7280", fontSize: 13 }}>© 2026 TrustSim. Bảo lưu mọi quyền.</span>
          <div style={{ display: "flex", gap: 20 }}>
            {["Điều khoản dịch vụ", "Chính sách bảo mật"].map((l) => <a key={l} href="#" style={{ color: "#6B7280", fontSize: 13, textDecoration: "none" }}>{l}</a>)}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN HOMEPAGE
   ═══════════════════════════════════════════════════════════ */
export default function HomePage() {
  const trustRef = useInView();
  const howRef = useInView();
  const secureRef = useInView();
  const ctaRef = useInView();

  const c1 = useCountUp(10000, trustRef.visible);
  const c2 = useCountUp(5200, trustRef.visible);
  const c3 = useCountUp(98, trustRef.visible);

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh" }}>
      <Header />

      {/* ═══ HERO WITH BANNER BACKGROUND ═══════════════════ */}
      <section
        style={{
          paddingTop: 104,
          paddingBottom: 80,
          position: "relative",
          background: "#001743 url('/banner.png') no-repeat right center / cover",
          borderBottom: "1px solid #E5E7EB",
          overflow: "hidden",
        }}
      >
        {/* Gradient Overlay to guarantee crystal-clear text readability on left while showing glowing SIM art on right */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(0, 23, 67, 0.95) 0%, rgba(0, 23, 67, 0.88) 45%, rgba(0, 23, 67, 0.4) 100%)",
            pointerEvents: "none",
          }}
        />

        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 60, alignItems: "center" }}>
            {/* Left Copy */}
            <div style={{ maxWidth: 560 }}>
              <div
                className="section-tag"
                style={{
                  marginBottom: 20,
                  background: "rgba(228, 1, 30, 0.15)",
                  color: "#FF4D6D",
                  border: "1px solid rgba(228, 1, 30, 0.35)",
                }}
              >
                Sàn đấu giá SIM số đẹp #1 Việt Nam
              </div>
              <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.03em", color: "#FFFFFF", margin: "0 0 18px" }}>
                Săn SIM đẹp.<br /><span style={{ color: "#E4011E" }}>Đấu giá minh bạch.</span>
              </h1>
              <p style={{ fontSize: 16, color: "rgba(255, 255, 255, 0.82)", lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
                Tìm kiếm những số SIM phù hợp với bạn và tham gia các phiên đấu giá trực tuyến an toàn, minh bạch. Giao dịch được bảo vệ toàn diện.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/auctions" className="btn-red">Khám phá SIM ngay</Link>
                <Link
                  href="/register"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "10px 22px",
                    borderRadius: 6,
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  Bán SIM của bạn
                </Link>
              </div>
              {/* Quick stats */}
              <div style={{ display: "flex", gap: 32, marginTop: 40, paddingTop: 28, borderTop: "1px solid rgba(255, 255, 255, 0.15)", flexWrap: "wrap" }}>
                {[["10K+", "SIM đã đấu giá"], ["5K+", "Người dùng tin tưởng"], ["98%", "Giao dịch thành công"]].map(([n, l]) => (
                  <div key={l}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#E4011E", letterSpacing: "-0.02em" }}>{n}</div>
                    <div style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.7)", marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right: Sharp Hero SIM Card */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <HeroSimCard />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST STRIP ════════════════════════════════════ */}
      <section style={{ background: "#F8F9FA", padding: "18px 0", borderBottom: "1px solid #E5E7EB" }}>
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 12,
              alignItems: "center",
            }}
          >
            {[
              { icon: <Icons.Smartphone />, text: "Xác minh quyền sở hữu SIM" },
              { icon: <Icons.UserCheck />, text: "Định danh tài khoản chính chủ" },
              { icon: <Icons.Lock />, text: "Tiền tạm giữ Ký quỹ an toàn" },
              { icon: <Icons.FileText />, text: "Hợp đồng điện tử pháp lý" },
              { icon: <Icons.ShieldCheck />, text: "Giám sát chống gian lận 24/7" },
            ].map(({ icon, text }) => (
              <div
                key={text}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  color: "#001743",
                }}
              >
                <span style={{ color: "#E4011E", flexShrink: 0, display: "flex", alignItems: "center" }}>{icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ LIVE AUCTIONS ══════════════════════════════════ */}
      <section className="section" style={{ background: "#FFFFFF" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36 }}>
            <div>
              <div className="section-tag" style={{ marginBottom: 12 }}>Đang diễn ra</div>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: "#001743", letterSpacing: "-0.02em", margin: 0 }}>Phiên đấu giá nổi bật</h2>
            </div>
            <Link href="/auctions" className="btn-outline" style={{ padding: "8px 18px", fontSize: 13 }}>Xem tất cả phiên →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {mockAuctions.map((a) => <SimAuctionCard key={a.id} data={a} />)}
          </div>
        </div>
      </section>

      {/* ═══ AUCTION TYPES (Refactored to Focused Tabbed Structure) ═══ */}
      <AuctionFormatsSection />

      {/* ═══ HOW IT WORKS (Interactive 5-Step Linked Tabs & Timeline) ═══ */}
      <section id="how-it-works" className="section" style={{ background: "#FFFFFF" }} ref={howRef.ref}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="section-tag" style={{ marginBottom: 12 }}>Quy trình tương tác</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: "#001743", letterSpacing: "-0.02em", margin: "0 0 12px" }}>5 bước đấu giá & chuyển nhượng SIM</h2>
            <p style={{ fontSize: 15, color: "#4B5563", maxWidth: 540, margin: "0 auto" }}>
              Nhấp vào từng bước để khám phá chi tiết quy trình bảo đảm minh bạch và an toàn tại TrustSim.
            </p>
          </div>

          {/* Interactive Linked Workflow */}
          <InteractiveHowItWorks />
        </div>
      </section>

      {/* ═══ SECURITY SECTION ═══════════════════════════════ */}
      <section className="section" style={{ background: "#F8F9FA", borderTop: "1px solid #E5E7EB" }} ref={secureRef.ref}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="section-tag" style={{ marginBottom: 12 }}>An toàn & Bảo mật</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: "#001743", letterSpacing: "-0.02em", margin: "0 0 12px" }}>Bảo vệ giao dịch đa lớp</h2>
            <p style={{ fontSize: 15, color: "#4B5563", maxWidth: 480, margin: "0 auto" }}>Cơ chế bảo vệ quyền lợi hợp pháp cho cả bên mua và bên bán.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {[
              { icon: <Icons.UserCheck />, title: "Định danh chính chủ", desc: "Xác thực danh tính CCCD qua hình ảnh khuôn mặt, bảo đảm mọi tài khoản đều có trách nhiệm pháp lý." },
              { icon: <Icons.Smartphone />, title: "Kiểm tra SIM chính chủ", desc: "Xác minh thuê bao hợp lệ và quyền định đoạt của người bán trước khi mở đấu giá." },
              { icon: <Icons.Lock />, title: "Tài khoản Ký quỹ", desc: "Tiền thanh toán được bảo lưu an toàn tại tài khoản ký quỹ trung gian của sàn." },
              { icon: <Icons.FileText />, title: "Hợp đồng điện tử", desc: "Hợp đồng có đầy đủ giá trị pháp lý, được ký điện tử và lưu trữ an toàn trên hệ thống." },
              { icon: <Icons.Cpu />, title: "Chống gian lận tự động", desc: "Tự động phát hiện và ngăn chặn hành vi thổi giá ảo, tài khoản mạo danh hoặc thông đồng nâng giá." },
              { icon: <Icons.Scale />, title: "Hội đồng phân xử", desc: "Hỗ trợ giải quyết và hoàn tiền minh bạch nếu phát sinh vướng mắc trong giao dịch." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="card" style={{ padding: "24px 20px", borderRadius: 6 }}>
                <div style={{ width: 38, height: 38, borderRadius: 4, background: "#FFF1F2", color: "#E4011E", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  {icon}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#001743", marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COUNTERS ════════════════════════════════════════ */}
      <section style={{ background: "#FFFFFF", padding: "48px 0", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }} ref={trustRef.ref}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[[c1, "+", "SIM số đã giao dịch"], [c2, "+", "Thành viên tin dùng"], [c3, "%", "Tỷ lệ bàn giao thành công"]].map(([count, suffix, label]) => (
              <div key={label} style={{ textAlign: "center", padding: "16px" }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: "#E4011E", letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {(count as number).toLocaleString("vi-VN")}{suffix}
                </div>
                <div style={{ fontSize: 14, color: "#4B5563", marginTop: 8, fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ════════════════════════════════════════════ */}
      <section ref={ctaRef.ref} style={{ background: "#E4011E", padding: "72px 0" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em", margin: "0 0 16px", lineHeight: 1.2 }}>
            Sẵn sàng tìm số SIM mơ ước?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", maxWidth: 460, margin: "0 auto 32px", lineHeight: 1.6 }}>
            Khám phá hàng nghìn SIM số đẹp đang mở phiên đấu giá trên sàn TrustSim ngay hôm nay.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auctions" style={{ display: "inline-flex", alignItems: "center", padding: "12px 28px", background: "#FFFFFF", color: "#E4011E", fontWeight: 700, fontSize: 14, borderRadius: 6, textDecoration: "none" }}>
              Khám phá phiên đấu giá →
            </Link>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", padding: "12px 28px", background: "transparent", color: "#FFFFFF", fontWeight: 600, fontSize: 14, borderRadius: 6, textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.4)" }}>
              Đăng ký tài khoản
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
