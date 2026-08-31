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
};

/* ─── Countdown Timer ─────────────────────────────────────── */
function Countdown({ endTime }: { endTime: Date }) {
  const [diff, setDiff] = useState(endTime.getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDiff(endTime.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [endTime]);
  const safe = Math.max(0, diff);
  const h = Math.floor(safe / 3_600_000).toString().padStart(2, "0");
  const m = Math.floor((safe % 3_600_000) / 60_000).toString().padStart(2, "0");
  const s = Math.floor((safe % 60_000) / 1_000).toString().padStart(2, "0");
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

/* ─── English Auction Chart ──────────────────────────────── */
function EnglishChart({ animate }: { animate: boolean }) {
  const data = [{ h: 38, lbl: "10M" }, { h: 52, lbl: "12M" }, { h: 65, lbl: "15M" }, { h: 76, lbl: "17M" }, { h: 90, lbl: "20M" }];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 88 }}>
      {data.map(({ h, lbl }, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: i === data.length - 1 ? "#E4011E" : "#9CA3AF", opacity: animate ? 1 : 0, transition: `opacity 0.4s ease ${i * 0.1 + 0.2}s` }}>{lbl}</span>
          <div style={{ width: "100%", background: i === data.length - 1 ? "#E4011E" : "#E5E7EB", borderRadius: "2px 2px 0 0", height: animate ? `${h}%` : "0%", transition: `height 0.6s ease ${i * 0.1}s` }} />
        </div>
      ))}
    </div>
  );
}

/* ─── Dutch Auction Chart ────────────────────────────────── */
function DutchChart({ animate }: { animate: boolean }) {
  const data = [{ h: 100, lbl: "30M" }, { h: 80, lbl: "25M" }, { h: 62, lbl: "20M" }, { h: 46, lbl: "15M" }, { h: 32, lbl: "10M" }];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 88 }}>
      {data.map(({ h, lbl }, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: i === data.length - 1 ? "#16A34A" : "#9CA3AF", opacity: animate ? 1 : 0, transition: `opacity 0.4s ease ${i * 0.1 + 0.2}s` }}>{lbl}</span>
          <div style={{ width: "100%", background: i === data.length - 1 ? "#16A34A" : "#E5E7EB", borderRadius: "2px 2px 0 0", height: animate ? `${h}%` : "0%", transition: `height 0.6s ease ${i * 0.1}s` }} />
        </div>
      ))}
    </div>
  );
}

/* ─── Hero SIM Card Visual (Clean & Sharp) ───────────────── */
function HeroSimCard() {
  const [price, setPrice] = useState(25_000_000);
  const [bids, setBids] = useState(18);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      setPrice(p => p + Math.floor(Math.random() * 2_000_000) + 500_000);
      setBids(b => b + 1);
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
        <div style={{ background: "#111827", padding: "18px 20px 16px", borderBottom: "2px solid #E4011E" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span className="badge badge-live" style={{ fontSize: 10 }}>Đang diễn ra</span>
            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Tứ quý 8</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.08em", fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>0988 888 888</div>
          <div style={{ fontSize: 12, color: "#9CA3AF" }}>Viettel · SIM VIP</div>
        </div>
        <div style={{ padding: "18px 20px 20px" }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, letterSpacing: "0.04em", marginBottom: 2 }}>GIÁ HIỆN TẠI</div>
            <div style={{ fontSize: 26, fontWeight: 900, fontVariantNumeric: "tabular-nums", color: flash ? "#E4011E" : "#111827", transition: "color 0.3s", letterSpacing: "-0.02em" }}>
              {price.toLocaleString("vi-VN")} ₫
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, marginBottom: 4 }}>LƯỢT ĐẶT</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 4 }}>
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
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.08em", color: "#111827", fontVariantNumeric: "tabular-nums" }}>{data.simNumber}</div>
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
            <Link href="/login" className="btn-ghost-nav" style={{ fontWeight: 600, color: "#111827" }}>Đăng nhập</Link>
            <Link href="/register" className="btn-red" style={{ padding: "8px 18px", fontSize: 14 }}>Đăng ký</Link>
          </div>
          <button className="ts-mobile-btn" onClick={() => setMenuOpen(!menuOpen)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 4, color: "#111827" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect y="4" width="22" height="2" rx="1" fill="currentColor"/><rect y="10" width="22" height="2" rx="1" fill="currentColor"/><rect y="16" width="22" height="2" rx="1" fill="currentColor"/></svg>
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "#FFFFFF", display: "flex", flexDirection: "column", padding: "80px 24px 24px", gap: 8 }}>
          {[["Khám phá SIM", "/auctions"], ["Đấu giá", "/auctions?tab=all"], ["Đăng nhập", "/login"], ["Đăng ký", "/register"]].map(([l, h]) => (
            <a key={l} href={h} onClick={() => setMenuOpen(false)} style={{ padding: "12px 16px", borderRadius: 6, color: "#111827", fontSize: 15, fontWeight: 600, textDecoration: "none", background: "#F8F9FA", border: "1px solid #E5E7EB", display: "block" }}>{l}</a>
          ))}
          <button onClick={() => setMenuOpen(false)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#111827" }}>✕</button>
        </div>
      )}
      <style>{`.ts-desktop-nav { display: flex !important; } .ts-mobile-btn { display: none !important; } @media (max-width: 768px) { .ts-desktop-nav { display: none !important; } .ts-mobile-btn { display: flex !important; } }`}</style>
    </>
  );
}

/* ─── Footer Component ────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: "#111827", color: "#FFFFFF", padding: "56px 0 32px" }}>
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
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: "#FFFFFF" }}>{col.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(l => <a key={l} href="#" style={{ color: "#9CA3AF", fontSize: 14, textDecoration: "none" }}>{l}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #1F2937", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ color: "#6B7280", fontSize: 13 }}>© 2026 TrustSim. Bảo lưu mọi quyền.</span>
          <div style={{ display: "flex", gap: 20 }}>
            {["Điều khoản dịch vụ", "Chính sách bảo mật"].map(l => <a key={l} href="#" style={{ color: "#6B7280", fontSize: 13, textDecoration: "none" }}>{l}</a>)}
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
  const auctionTypeRef = useInView();
  const howRef = useInView();
  const secureRef = useInView();
  const ctaRef = useInView();

  const c1 = useCountUp(10000, trustRef.visible);
  const c2 = useCountUp(5200, trustRef.visible);
  const c3 = useCountUp(98, trustRef.visible);

  return (
    <div style={{ background: "#FFFFFF", minHeight: "100vh" }}>
      <Header />

      {/* ═══ HERO ═══════════════════════════════════════════ */}
      <section style={{ paddingTop: 96, paddingBottom: 72, position: "relative", borderBottom: "1px solid #E5E7EB" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 60, alignItems: "center" }}>
            {/* Left Copy */}
            <div style={{ maxWidth: 560 }}>
              <div className="section-tag" style={{ marginBottom: 20 }}>Sàn đấu giá SIM số đẹp #1 Việt Nam</div>
              <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.03em", color: "#111827", margin: "0 0 18px" }}>
                Săn SIM đẹp.<br /><span style={{ color: "#E4011E" }}>Đấu giá minh bạch.</span>
              </h1>
              <p style={{ fontSize: 16, color: "#4B5563", lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
                Tìm kiếm những số SIM phù hợp với bạn và tham gia các phiên đấu giá trực tuyến an toàn, minh bạch. Giao dịch được bảo vệ toàn diện.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/auctions" className="btn-red">Khám phá SIM ngay</Link>
                <Link href="/register" className="btn-outline">Bán SIM của bạn</Link>
              </div>
              {/* Quick stats */}
              <div style={{ display: "flex", gap: 32, marginTop: 40, paddingTop: 28, borderTop: "1px solid #E5E7EB", flexWrap: "wrap" }}>
                {[["10K+", "SIM đã đấu giá"], ["5K+", "Người dùng tin tưởng"], ["98%", "Giao dịch thành công"]].map(([n, l]) => (
                  <div key={l}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#E4011E", letterSpacing: "-0.02em" }}>{n}</div>
                    <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{l}</div>
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
      <section style={{ background: "#F8F9FA", padding: "20px 0", borderBottom: "1px solid #E5E7EB" }}>
        <div className="container">
          <div style={{ display: "flex", gap: 36, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { icon: <Icons.Smartphone />, text: "Xác minh quyền sở hữu SIM" },
              { icon: <Icons.UserCheck />, text: "eKYC định danh người dùng" },
              { icon: <Icons.Lock />, text: "Tiền tạm giữ Escrow an toàn" },
              { icon: <Icons.FileText />, text: "Hợp đồng điện tử pháp lý" },
              { icon: <Icons.ShieldCheck />, text: "AI giám sát gian lận 24/7" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, color: "#374151" }}>
                <span style={{ color: "#E4011E" }}>{icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{text}</span>
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
              <h2 style={{ fontSize: 32, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em", margin: 0 }}>Phiên đấu giá nổi bật</h2>
            </div>
            <Link href="/auctions" className="btn-outline" style={{ padding: "8px 18px", fontSize: 13 }}>Xem tất cả phiên →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {mockAuctions.map(a => <SimAuctionCard key={a.id} data={a} />)}
          </div>
        </div>
      </section>

      {/* ═══ AUCTION TYPES (Sharp Uniform Borders, No Side Lines) ═══ */}
      <section className="section" style={{ background: "#F8F9FA", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }} ref={auctionTypeRef.ref}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="section-tag" style={{ marginBottom: 12 }}>Quy chế đấu giá</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em", margin: "0 0 12px" }}>Hai hình thức đấu giá chuẩn mực</h2>
            <p style={{ fontSize: 15, color: "#4B5563", maxWidth: 520, margin: "0 auto" }}>Hệ thống hỗ trợ 2 cơ chế đấu giá minh bạch, tuân thủ tiêu chuẩn sàn giao dịch.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* English */}
            <div className="card" style={{ padding: "28px", borderRadius: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid #F3F4F6", paddingBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 4, background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icons.TrendingUp />
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.04em" }}>ENGLISH AUCTION</span>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: 0 }}>Đấu giá tăng dần</h3>
                  </div>
                </div>
                <span className="badge badge-english">Phổ biến</span>
              </div>
              <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.6, marginBottom: 20 }}>
                Người tham gia lần lượt đặt giá cao hơn giá hiện tại. Người giữ mức giá cao nhất khi hết giờ là người chiến thắng phiên đấu giá.
              </p>
              <div style={{ background: "#F8F9FA", borderRadius: 4, padding: "14px", border: "1px solid #E5E7EB", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", marginBottom: 8, letterSpacing: "0.04em" }}>MÔ PHỎNG GIÁ TĂNG</div>
                <EnglishChart animate={auctionTypeRef.visible} />
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Đặt giá từng bước", "Người cao nhất thắng", "Gia hạn tự động"].map(t => (
                  <span key={t} style={{ fontSize: 12, fontWeight: 600, color: "#374151", background: "#F3F4F6", padding: "3px 8px", borderRadius: 4 }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Dutch */}
            <div className="card" style={{ padding: "28px", borderRadius: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid #F3F4F6", paddingBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 4, background: "#F0FDF4", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icons.TrendingDown />
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A", textTransform: "uppercase", letterSpacing: "0.04em" }}>DUTCH AUCTION</span>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: 0 }}>Đấu giá giảm dần</h3>
                  </div>
                </div>
                <span className="badge badge-dutch">Nhanh chóng</span>
              </div>
              <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.6, marginBottom: 20 }}>
                Giá khởi điểm từ mức cao và tự động giảm theo từng chu kỳ thời gian. Người đầu tiên chấp nhận mức giá hiện tại sẽ thắng ngay lập tức.
              </p>
              <div style={{ background: "#F8F9FA", borderRadius: 4, padding: "14px", border: "1px solid #E5E7EB", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", marginBottom: 8, letterSpacing: "0.04em" }}>MÔ PHỎNG GIÁ GIẢM</div>
                <DutchChart animate={auctionTypeRef.visible} />
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Giá giảm tự động", "Chốt giá tức thì", "Quyết đoán"].map(t => (
                  <span key={t} style={{ fontSize: 12, fontWeight: 600, color: "#374151", background: "#F3F4F6", padding: "3px 8px", borderRadius: 4 }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══════════════════════════════════ */}
      <section id="how-it-works" className="section" style={{ background: "#FFFFFF" }} ref={howRef.ref}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="section-tag" style={{ marginBottom: 12 }}>Quy trình</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em", margin: "0 0 12px" }}>5 bước đấu giá & chuyển nhượng SIM</h2>
            <p style={{ fontSize: 15, color: "#4B5563", maxWidth: 520, margin: "0 auto" }}>Quy trình khép kín từ đặt giá trực tuyến đến bàn giao chính chủ tại nhà mạng.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 48 }}>
            {[
              { step: "01", icon: <Icons.Search />, title: "Khám phá SIM", desc: "Tìm SIM theo nhà mạng, danh mục và bộ lọc giá" },
              { step: "02", icon: <Icons.Gavel />, title: "Tham gia đấu giá", desc: "Đặt cọc bảo đảm và bắt đầu tham gia đặt giá" },
              { step: "03", icon: <Icons.Award />, title: "Thắng đấu giá", desc: "Trúng đấu giá với mức giá cao nhất hoặc chốt giá" },
              { step: "04", icon: <Icons.FileText />, title: "Ký hợp đồng", desc: "Ký hợp đồng điện tử, tiền được giữ tại Escrow" },
              { step: "05", icon: <Icons.Smartphone />, title: "Bàn giao SIM", desc: "Sang tên chính chủ tại cửa hàng nhà mạng" },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="card" style={{ padding: "20px 16px", borderRadius: 6, textAlign: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 4, background: "#FFF1F2", color: "#E4011E", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  {icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#E4011E", letterSpacing: "0.04em", marginBottom: 4 }}>BƯỚC {step}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>

          {/* Transfer Detail */}
          <div className="card" style={{ padding: "28px 32px", borderRadius: 6, background: "#F8F9FA" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
              <div>
                <div className="section-tag" style={{ marginBottom: 12 }}>Bàn giao thực tế</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "0 0 10px" }}>Hoàn tất chuyển quyền sở hữu</h3>
                <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.7 }}>
                  Sau khi ký hợp đồng, người mua và người bán hẹn gặp tại điểm giao dịch của nhà mạng để làm thủ tục đổi thông tin chính chủ. Tiền chỉ được giải ngân khi TrustSim xác thực giấy tờ chuyển nhượng.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "1. Ký hợp đồng điện tử & Tạm giữ tiền Escrow", tag: "TrustSim" },
                  { label: "2. Gặp mặt tại điểm giao dịch nhà mạng", tag: "Nhà mạng" },
                  { label: "3. Ký giấy chuyển quyền sở hữu chính chủ", tag: "Nhà mạng" },
                  { label: "4. Chụp & upload biên lai xác nhận", tag: "TrustSim" },
                  { label: "5. Hoàn tất & giải ngân tiền cho người bán", tag: "TrustSim" },
                ].map(({ label, tag }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", background: "#F3F4F6", padding: "2px 6px", borderRadius: 3 }}>{tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECURITY SECTION ═══════════════════════════════ */}
      <section className="section" style={{ background: "#F8F9FA", borderTop: "1px solid #E5E7EB" }} ref={secureRef.ref}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="section-tag" style={{ marginBottom: 12 }}>An toàn & Bảo mật</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em", margin: "0 0 12px" }}>Bảo vệ giao dịch đa lớp</h2>
            <p style={{ fontSize: 15, color: "#4B5563", maxWidth: 480, margin: "0 auto" }}>Cơ chế bảo vệ quyền lợi hợp pháp cho cả bên mua và bên bán.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {[
              { icon: <Icons.UserCheck />, title: "Định danh eKYC", desc: "Xác minh danh tính CCCD qua AI, đảm bảo mọi tài khoản đều có trách nhiệm pháp lý." },
              { icon: <Icons.Smartphone />, title: "Kiểm tra SIM chính chủ", desc: "Xác minh thuê bao hợp lệ và quyền định đoạt trước khi duyệt đăng đấu giá." },
              { icon: <Icons.Lock />, title: "Tài khoản Escrow", desc: "Tiền thanh toán được bảo lưu an toàn tại tài khoản trung gian của sàn." },
              { icon: <Icons.FileText />, title: "Hợp đồng điện tử", desc: "Hợp đồng có giá trị pháp lý, được ký số và lưu trữ bất biến trên hệ thống." },
              { icon: <Icons.Cpu />, title: "AI chống gian lận", desc: "Tự động phát hiện shill bidding, bid ảo, thông đồng giá giữa các tài khoản." },
              { icon: <Icons.Scale />, title: "Hội đồng giải quyết", desc: "Hỗ trợ phân xử và hoàn tiền minh bạch nếu phát sinh tranh chấp giao dịch." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="card" style={{ padding: "24px 20px", borderRadius: 6 }}>
                <div style={{ width: 38, height: 38, borderRadius: 4, background: "#FFF1F2", color: "#E4011E", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  {icon}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 6 }}>{title}</div>
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
