"use client";
import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuctionCard, { AuctionCardData } from "@/components/ui/AuctionCard";
import Link from "next/link";

// --- Mock Data ---
const liveAuctions: AuctionCardData[] = [
  { id: "1", simNumber: "0901234567", carrier: "Viettel", type: "english", status: "live", currentPrice: 15000000, startPrice: 10000000, bidCount: 24, endTime: new Date(Date.now() + 2 * 3600000 + 35 * 60000), seller: "TrustSim", featuredReason: "Sim tứ quý 7" },
  { id: "2", simNumber: "0777777777", carrier: "Mobifone", type: "sealed", status: "live", currentPrice: 42000000, startPrice: 30000000, bidCount: 8, endTime: new Date(Date.now() + 4 * 3600000), seller: "NguyenA", featuredReason: "Sim lộc phát 7777" },
  { id: "3", simNumber: "0888555000", carrier: "Vinaphone", type: "dutch", status: "live", currentPrice: 8500000, startPrice: 12000000, bidCount: 0, endTime: new Date(Date.now() + 45 * 60000), seller: "SimVIP" },
  { id: "4", simNumber: "0909090909", carrier: "Viettel", type: "english", status: "live", currentPrice: 22000000, startPrice: 15000000, bidCount: 37, endTime: new Date(Date.now() + 1 * 3600000 + 12 * 60000), seller: "MinhTuan", featuredReason: "Sảnh 9 cực hiếm" },
  { id: "5", simNumber: "0338866688", carrier: "Viettel", type: "english", status: "live", currentPrice: 6800000, startPrice: 5000000, bidCount: 11, endTime: new Date(Date.now() + 3 * 3600000), seller: "HoangLe" },
];

const upcomingAuctions: AuctionCardData[] = [
  { id: "6", simNumber: "0911119999", carrier: "Mobifone", type: "sealed", status: "upcoming", currentPrice: 20000000, startPrice: 20000000, bidCount: 0, endTime: new Date(Date.now() + 24 * 3600000), seller: "KhanhSim" },
  { id: "7", simNumber: "0799888777", carrier: "Vinaphone", type: "dutch", status: "upcoming", currentPrice: 11000000, startPrice: 11000000, bidCount: 0, endTime: new Date(Date.now() + 48 * 3600000), seller: "TrustSim" },
];

const AUCTION_TYPES = [
  {
    key: "english",
    name: "Đấu Giá Kiểu Anh",
    icon: "🏆",
    color: "#4F46E5",
    glow: "rgba(79,70,229,0.2)",
    description: "Người tham gia công khai nâng giá. Người trả giá cao nhất khi phiên kết thúc là người chiến thắng.",
    features: ["Giá được nâng liên tục", "Minh bạch & cạnh tranh", "Gia hạn chống chốt phút cuối"],
  },
  {
    key: "dutch",
    name: "Đấu Giá Kiểu Hà Lan",
    icon: "⚡",
    color: "#06B6D4",
    glow: "rgba(6,182,212,0.2)",
    description: "Giá giảm dần theo thời gian. Ai bấm chấp nhận trước, người đó thắng.",
    features: ["Giá hệ thống tự giảm", "Phải quyết định nhanh", "Cơ hội mua giá hời"],
  },
  {
    key: "sealed",
    name: "Đấu Giá Bí Mật",
    icon: "🔒",
    color: "#A855F7",
    glow: "rgba(168,85,247,0.2)",
    description: "Người tham gia gửi mức giá kín. Hệ thống công bố kết quả sau khi phiên đóng.",
    features: ["Giá đặt hoàn toàn bí mật", "Chỉ 1 lần duy nhất", "Kết quả công khai minh bạch"],
  },
];

const TRUST_FEATURES = [
  { icon: "🔐", title: "Bảo mật đa lớp", desc: "Xác thực OTP, eKYC, mã hóa end-to-end cho mọi giao dịch" },
  { icon: "⚡", title: "Thời gian thực", desc: "WebSocket cập nhật giá, trạng thái phiên & thông báo tức thì" },
  { icon: "📄", title: "Hợp đồng điện tử", desc: "Hợp đồng PDF số hóa, chữ ký số, lưu hash SHA-256 pháp lý" },
  { icon: "🤖", title: "AI Hỗ Trợ", desc: "Tìm sim bằng ngôn ngữ tự nhiên, gợi ý giá, phát hiện bất thường" },
  { icon: "⚖️", title: "Đấu giá công bằng", desc: "3 hình thức đấu giá chuẩn quốc tế, chống thao túng giá" },
  { icon: "💰", title: "Thanh toán an toàn", desc: "Ký quỹ tạm giữ tiền, giải ngân sau xác nhận chuyển nhượng" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Đăng ký & Xác minh", desc: "Tạo tài khoản, xác minh CCCD và số điện thoại qua OTP" },
  { step: "02", title: "Duyệt đấu giá", desc: "Tìm kiếm sim bằng AI hoặc lọc theo đặc điểm số, giá, nhà mạng" },
  { step: "03", title: "Tham gia đặt giá", desc: "Đặt cọc & tham gia phiên đấu giá theo hình thức bạn chọn" },
  { step: "04", title: "Chiến thắng & Ký hợp đồng", desc: "Hệ thống xác định người thắng, tạo hợp đồng điện tử để ký số" },
  { step: "05", title: "Thanh toán & Nhận sim", desc: "Thanh toán qua ví/ngân hàng, xác nhận chuyển nhượng số" },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Mesh background */}
      <div className="mesh-bg" />

      <Navbar />

      <main style={{ position: "relative", zIndex: 1 }}>
        {/* ─── HERO ─── */}
        <section style={{ padding: "160px 0 100px", minHeight: "90vh", display: "flex", alignItems: "center" }}>
          <div className="container">
            <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
              {/* Tag */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 16px",
                borderRadius: 999,
                background: "rgba(79,70,229,0.12)",
                border: "1px solid rgba(79,70,229,0.3)",
                marginBottom: 24,
                fontSize: 13,
                color: "var(--text-accent)",
                fontWeight: 500,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse-dot 1.5s ease infinite", display: "inline-block" }} />
                Hơn 1.200 phiên đấu giá đang diễn ra
              </div>

              {/* Headline */}
              <h1 style={{
                fontSize: "clamp(2.4rem, 5vw, 4rem)",
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                marginBottom: 20,
                color: "var(--text-primary)",
              }}>
                Sàn Đấu Giá{" "}
                <span style={{
                  background: "linear-gradient(135deg, #a5b4fc, #4F46E5, #06B6D4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Sim Số Đẹp
                </span>{" "}
                <br />Minh Bạch & An Toàn
              </h1>

              <p style={{ fontSize: 17, color: "var(--text-secondary)", marginBottom: 40, lineHeight: 1.7, maxWidth: 580, margin: "0 auto 40px" }}>
                Đấu giá sim số phong thủy, sim VIP theo 3 hình thức quốc tế. Hợp đồng điện tử, chữ ký số, thời gian thực.
              </p>

              {/* AI Search Bar */}
              <div style={{
                display: "flex",
                gap: 0,
                maxWidth: 600,
                margin: "0 auto 32px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(79,70,229,0.35)",
                borderRadius: 14,
                padding: 6,
                boxShadow: "0 0 40px rgba(79,70,229,0.15)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, padding: "8px 14px" }}>
                  <span style={{ fontSize: 16 }}>🤖</span>
                  <input
                    placeholder='Tìm sim bằng AI: "sim tứ quý 8 giá dưới 20 triệu"…'
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      outline: "none",
                      color: "var(--text-primary)",
                      fontSize: 14,
                      fontFamily: "Inter, sans-serif",
                    }}
                  />
                </div>
                <button className="btn-primary" style={{ borderRadius: 10, padding: "10px 22px" }}>
                  Tìm ngay
                </button>
              </div>

              {/* Popular tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 48 }}>
                {["Tứ quý 7", "Sảnh 9", "Tam hoa", "Sim 08", "Sim đuôi 000", "Phong thủy"].map((tag) => (
                  <button
                    key={tag}
                    style={{
                      padding: "5px 14px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "var(--text-secondary)",
                      fontSize: 12,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontFamily: "Inter, sans-serif",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(79,70,229,0.5)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-accent)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap" }}>
                {[
                  { value: "12.500+", label: "Sim đã giao dịch" },
                  { value: "98.6%", label: "Tỷ lệ thành công" },
                  { value: "8.200+", label: "Người dùng" },
                ].map((stat) => (
                  <div key={stat.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, background: "linear-gradient(135deg,#a5b4fc,#06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── LIVE AUCTIONS ─── */}
        <section style={{ padding: "80px 0" }}>
          <div className="container">
            <SectionHeader
              badge="🔴 Đang Diễn Ra"
              title="Phiên Đấu Giá Live"
              subtitle="Tham gia ngay các phiên đang diễn ra – giá cập nhật theo thời gian thực"
              action={{ label: "Xem tất cả →", href: "/auctions?status=live" }}
            />
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
              marginBottom: 40,
            }}>
              {liveAuctions.map((a) => <AuctionCard key={a.id} data={a} />)}
            </div>
          </div>
        </section>

        {/* ─── GLOW DIVIDER ─── */}
        <div className="glow-line" style={{ margin: "0 24px" }} />

        {/* ─── AUCTION TYPES ─── */}
        <section style={{ padding: "80px 0" }}>
          <div className="container">
            <SectionHeader
              badge="🏛️ Hình Thức Đấu Giá"
              title="3 Hình Thức Đấu Giá Quốc Tế"
              subtitle="Chọn hình thức phù hợp với chiến lược của bạn"
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
              {AUCTION_TYPES.map((type) => (
                <Link key={type.key} href={`/auctions?type=${type.key}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      padding: 28,
                      borderRadius: 20,
                      background: "var(--bg-card)",
                      border: `1px solid rgba(255,255,255,0.08)`,
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      height: "100%",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.border = `1px solid ${type.color}50`;
                      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px ${type.glow}`;
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.08)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                      (e.currentTarget as HTMLDivElement).style.transform = "none";
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 16 }}>{type.icon}</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: type.color }}>{type.name}</h3>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>{type.description}</p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                      {type.features.map((f) => (
                        <li key={f} style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 16, height: 16, borderRadius: 4, background: `${type.color}20`, border: `1px solid ${type.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: type.color }}>✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── UPCOMING ─── */}
        <section style={{ padding: "60px 0" }}>
          <div className="container">
            <SectionHeader
              badge="🗓️ Sắp Diễn Ra"
              title="Phiên Sắp Mở"
              subtitle="Đặt lịch nhắc nhở để không bỏ lỡ"
              action={{ label: "Xem lịch →", href: "/auctions?status=upcoming" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {upcomingAuctions.map((a) => <AuctionCard key={a.id} data={a} />)}
            </div>
          </div>
        </section>

        {/* ─── TRUST FEATURES ─── */}
        <section style={{ padding: "80px 0", background: "rgba(15,16,36,0.5)" }}>
          <div className="container">
            <SectionHeader
              badge="🛡️ Vì Sao Chọn TrustSim"
              title="Nền Tảng Đáng Tin Cậy"
              subtitle="Được xây dựng với các tiêu chuẩn bảo mật và minh bạch cao nhất"
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              {TRUST_FEATURES.map((feat) => (
                <div key={feat.title} className="glass-card" style={{ padding: 24 }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{feat.icon}</div>
                  <h4 style={{ fontWeight: 700, marginBottom: 8, fontSize: 15 }}>{feat.title}</h4>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section style={{ padding: "80px 0" }}>
          <div className="container">
            <SectionHeader
              badge="📋 Quy Trình"
              title="Cách Thức Hoạt Động"
              subtitle="5 bước đơn giản từ đăng ký đến nhận sim"
            />
            <div style={{ position: "relative" }}>
              {/* Connection line */}
              <div style={{
                position: "absolute",
                top: 28,
                left: "10%",
                right: "10%",
                height: 1,
                background: "linear-gradient(90deg, transparent, #4F46E5, #06B6D4, transparent)",
                zIndex: 0,
              }} />
              <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8, position: "relative", zIndex: 1 }}>
                {HOW_IT_WORKS.map((step, i) => (
                  <div key={step.step} style={{
                    flex: "0 0 180px",
                    textAlign: "center",
                    padding: "20px 16px",
                    background: "var(--bg-card)",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, #312E81, #4F46E5)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 14px",
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#fff",
                      border: "3px solid var(--bg-base)",
                      boxShadow: "0 0 0 2px rgba(79,70,229,0.4)",
                    }}>
                      {step.step}
                    </div>
                    <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>{step.title}</h4>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA BANNER ─── */}
        <section style={{ padding: "80px 0" }}>
          <div className="container">
            <div style={{
              borderRadius: 24,
              padding: "60px 40px",
              background: "linear-gradient(135deg, rgba(49,46,129,0.6), rgba(79,70,229,0.4), rgba(6,182,212,0.3))",
              border: "1px solid rgba(79,70,229,0.4)",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(79,70,229,0.2), transparent 70%)", pointerEvents: "none" }} />
              <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, marginBottom: 16, position: "relative" }}>
                Bắt Đầu Đấu Giá{" "}
                <span className="gradient-text">Hôm Nay</span>
              </h2>
              <p style={{ fontSize: 16, color: "var(--text-secondary)", marginBottom: 32, position: "relative" }}>
                Đăng ký miễn phí, xác minh danh tính và tham gia ngay các phiên đấu giá đang diễn ra
              </p>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", position: "relative" }}>
                <Link href="/register" className="btn-primary" style={{ padding: "14px 32px", fontSize: 15 }}>
                  🚀 Đăng ký ngay – Miễn phí
                </Link>
                <Link href="/auctions" className="btn-secondary" style={{ padding: "14px 32px", fontSize: 15 }}>
                  Xem phiên đấu giá
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// ─── Section Header Helper ───
function SectionHeader({
  badge, title, subtitle, action
}: {
  badge: string;
  title: string;
  subtitle: string;
  action?: { label: string; href: string };
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
      <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--text-accent)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {badge}
        </div>
        <h2 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>{title}</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{subtitle}</p>
      </div>
      {action && (
        <Link href={action.href} style={{ color: "var(--indigo-light)", fontSize: 14, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
