import React from "react";
import { AuthResponseDto, UserProfileDto } from "@/types/auth";
import { ToastMessage } from "@/components/ui/Toast";
import { ProfileIcons as Icons } from "./ProfileIcons";
import { ProfileTab } from "../../types/types";

interface OverviewTabProps {
  user: AuthResponseDto | null;
  profile: UserProfileDto | null;
  walletBalance: number;
  isEkycVerified: boolean;
  onNavigateTab: (tab: ProfileTab) => void;
  addToast: (t: Omit<ToastMessage, "id">) => void;
}

export default function OverviewTab({
  user,
  profile,
  walletBalance,
  isEkycVerified,
  onNavigateTab,
  addToast,
}: OverviewTabProps) {
  const steps = [
    {
      title: "Khởi tạo tài khoản",
      desc: "Đã hoàn thành đăng ký hồ sơ thành viên TrustSim",
      done: true,
      current: false,
    },
    {
      title: "Định danh điện tử CCCD (eKYC)",
      desc: isEkycVerified
        ? "Đã đối soát ảnh CCCD 2 mặt và khuôn mặt thành công"
        : "Chụp ảnh CCCD 2 mặt và khuôn mặt để kích hoạt đầy đủ quyền giao dịch",
      done: isEkycVerified,
      current: !isEkycVerified,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Mini-stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {[
          { icon: <Icons.Gavel size={18} />, label: "Tổng lượt đặt giá", value: "47 lượt", note: "+12 lượt trong tuần", color: "#2563EB" },
          { icon: <Icons.Trophy size={18} />, label: "SIM đấu giá thành công", value: "8 SIM", note: "Đã hoàn tất hợp đồng", color: "#16A34A" },
          { icon: <Icons.TrendingUp size={18} />, label: "Tỷ lệ thắng đấu giá", value: "82.4%", note: "Cao hơn 88% thành viên", color: "#D97706" },
          { icon: <Icons.Wallet size={18} />, label: "Số dư ví hiện tại", value: `${walletBalance.toLocaleString("vi-VN")} ₫`, note: "Bảo hiểm giao dịch 100%", color: "#E4011E" },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "16px 20px",
              boxShadow: "0 2px 6px rgba(0, 23, 67, 0.03)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 19, fontWeight: 900, color: "#001743", fontVariantNumeric: "tabular-nums" }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{stat.note}</div>
            </div>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                background: "#F8F9FA",
                color: stat.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column Grid: eKYC Stepper & Activity Timeline */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 24 }}>
        {/* Left Card: 3-step eKYC progress */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: isEkycVerified ? "#16A34A" : "#D97706" }}>
                {isEkycVerified ? <Icons.CheckCircle size={18} /> : <Icons.ShieldCheck size={18} />}
              </span>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#001743", margin: 0 }}>
                Tiến trình xác thực định danh (eKYC)
              </h3>
            </div>
            <span
              style={{
                fontSize: 11,
                background: isEkycVerified ? "#F0FDF4" : "#FFFBEB",
                color: isEkycVerified ? "#16A34A" : "#B45309",
                border: `1px solid ${isEkycVerified ? "#BBF7D0" : "#FDE68A"}`,
                padding: "2px 8px",
                borderRadius: 4,
                fontWeight: 700,
              }}
            >
              {isEkycVerified ? "Cấp độ 2/2 (Hoàn tất 100%)" : "Cấp độ 1/2 (Chờ eKYC)"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {steps.map((step, idx) => (
              <div key={idx} style={{ display: "flex", gap: 14, alignItems: "flex-start", position: "relative" }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: step.done ? "#16A34A" : step.current ? "#E4011E" : "#E5E7EB",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    flexShrink: 0,
                    zIndex: 2,
                  }}
                >
                  {step.done ? <Icons.Check size={13} /> : idx + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: step.done || step.current ? "#001743" : "#9CA3AF" }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#6B7280", marginTop: 2, lineHeight: 1.4 }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!isEkycVerified ? (
            <button
              onClick={() => onNavigateTab("ekyc")}
              className="btn-red"
              style={{ width: "100%", marginTop: 22, padding: "10px 16px", fontSize: 13, justifyContent: "center", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Icons.ShieldCheck size={16} /> Tiến hành xác thực eKYC ngay →
            </button>
          ) : (
            <div
              style={{
                marginTop: 20,
                padding: "10px 14px",
                borderRadius: 6,
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 12.5, color: "#166534", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <Icons.CheckCircle size={15} /> Tài khoản đã hoàn tất định danh chính chủ
              </span>
              <button
                onClick={() => onNavigateTab("ekyc")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#16A34A",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Chi tiết →
              </button>
            </div>
          )}
        </div>

        {/* Right Card: Activity Timeline */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#001743", margin: 0 }}>Lịch sử hoạt động gần đây</h3>
            <button
              onClick={() => onNavigateTab("bids")}
              style={{ background: "none", border: "none", color: "#E4011E", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              Xem tất cả →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { title: "Đặt giá thành công 14.500.000 ₫", sim: "0901 234 567", time: "15 phút trước", icon: <Icons.Gavel size={15} />, tag: "Đấu giá Anh" },
              { title: "Thắng phiên đấu giá SIM VIP", sim: "0352 468 024", time: "Hôm qua, 14:20", icon: <Icons.Trophy size={15} />, tag: "8.500.000 ₫" },
              { title: "Ký hợp đồng chuyển nhượng số #CT-889", sim: "0352 468 024", time: "Hôm qua, 16:00", icon: <Icons.FileText size={15} />, tag: "Đã ký số" },
              { title: "Nạp tiền ví thành công qua VietQR", sim: "SePay Banking", time: "Hôm nay", icon: <Icons.Wallet size={15} />, tag: "Thành công" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  background: "#F8F9FA",
                  borderRadius: 6,
                  border: "1px solid #F3F4F6",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      background: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      color: "#001743",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#001743" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>{item.sim} · {item.time}</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#4B5563", background: "#FFFFFF", padding: "2px 8px", borderRadius: 4, border: "1px solid #E5E7EB" }}>
                  {item.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
