/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
"use client";
import React, { useState } from "react";
import {
  DollarSign,
  Gavel,
  Bell,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
} from "lucide-react";

interface SettingSection {
  id: string;
  name: string;
  desc: string;
  icon: any;
}

const SECTIONS: SettingSection[] = [
  { id: "finance", name: "Tài chính & Phí", desc: "Tỷ lệ hoa hồng sàn, thời gian tạm giữ ký quỹ", icon: DollarSign },
  { id: "auction", name: "Đấu giá & Quy chuẩn", desc: "Thời gian bước giá, gia hạn tự động chống bùng", icon: Gavel },
  { id: "notification", name: "Thông báo & Tích hợp", desc: "Cổng SpeedSMS, Email và VietQR SePay", icon: Bell },
  { id: "security", name: "Bảo mật & Phiên", desc: "Giới hạn đăng nhập sai, thời hạn hiệu lực OTP", icon: Shield },
];

export default function AdminSettingsTab() {
  const [activeSection, setActiveSection] = useState("finance");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form States
  const [financeConfig, setFinanceConfig] = useState({
    commissionRate: 3.0,
    escrowHoldingHours: 48,
    minDepositRate: 10,
    maxWithdrawDaily: 500000000,
  });

  const [auctionConfig, setAuctionConfig] = useState({
    autoExtendMinutes: 3,
    maxExtensions: 5,
    defaultAuctionDurationHours: 24,
    minBidStepVnd: 100000,
  });

  const [securityConfig, setSecurityConfig] = useState({
    otpExpirySeconds: 120,
    maxOtpRetries: 5,
    sessionTimeoutMinutes: 60,
    requireEkycForBidAbove: 50000000,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveSection = (name: string) => {
    showToast(`Đã lưu cấu hình nhóm "${name}" thành công.`);
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#001743] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 animate-fade-in flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Header Card ── */}
      <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-[#001743]">Cấu Hình &amp; Tham Số Hệ Thống</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
              Live Config
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Thiết lập tỷ lệ phí hoa hồng, hạn mức ký quỹ, quy tắc phòng đấu giá và bảo mật vận hành sàn.
          </p>
        </div>
      </div>

      {/* ── 2. Two-Column Layout (Navigation + Form) ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Nav Menu */}
        <div className="md:col-span-4 lg:col-span-3 bg-white border border-[#e4e7ec] rounded-xl p-2 shadow-2xs space-y-1">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors duration-150 flex items-start gap-2.5 ${
                  isActive
                    ? "bg-[#001743] text-white font-bold shadow-2xs"
                    : "text-slate-700 hover:bg-slate-50 font-medium"
                }`}
              >
                <Icon size={16} className={`shrink-0 mt-0.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                <div>
                  <div className="leading-snug">{sec.name}</div>
                  <div className={`text-[10px] line-clamp-1 mt-0.5 ${isActive ? "text-slate-300" : "text-slate-400"}`}>
                    {sec.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Form Card */}
        <div className="md:col-span-8 lg:col-span-9">
          {/* Section: Finance */}
          {activeSection === "finance" && (
            <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-2xs space-y-5">
              <div className="border-b border-[#e4e7ec] pb-3">
                <h2 className="text-sm font-bold text-[#001743]">Cấu hình Tài chính &amp; Ký Quỹ (Escrow)</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm soát dòng tiền giao dịch giữa bên mua và bên bán, các loại phí dịch vụ sàn.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">
                    Tỷ lệ phí sàn ký quỹ (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={financeConfig.commissionRate}
                    onChange={(e) =>
                      setFinanceConfig({ ...financeConfig, commissionRate: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full text-xs p-2.5 border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none font-mono font-bold transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Mặc định 3.0% trừ khi giải ngân bên bán</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">
                    Thời gian giữ ký quỹ tối đa (giờ)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={financeConfig.escrowHoldingHours}
                    onChange={(e) =>
                      setFinanceConfig({ ...financeConfig, escrowHoldingHours: parseInt(e.target.value) || 0 })
                    }
                    className="w-full text-xs p-2.5 border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none font-mono font-bold transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Tự động kích hoạt khiếu nại nếu quá 48h</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">
                    Tỷ lệ cọc đấu giá bắt buộc (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={financeConfig.minDepositRate}
                    onChange={(e) =>
                      setFinanceConfig({ ...financeConfig, minDepositRate: parseInt(e.target.value) || 0 })
                    }
                    className="w-full text-xs p-2.5 border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none font-mono font-bold transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Số tiền tạm khóa trên giá khởi điểm</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">
                    Hạn mức rút tiền tối đa/ngày (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="1000000"
                    value={financeConfig.maxWithdrawDaily}
                    onChange={(e) =>
                      setFinanceConfig({ ...financeConfig, maxWithdrawDaily: parseInt(e.target.value) || 0 })
                    }
                    className="w-full text-xs p-2.5 border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none font-mono font-bold transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">500.000.000 đ mỗi ngày / tài khoản</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#e4e7ec] flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveSection("Tài chính & Phí")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
                >
                  <Save size={14} />
                  <span>Lưu cấu hình tài chính</span>
                </button>
              </div>
            </div>
          )}

          {/* Section: Auction */}
          {activeSection === "auction" && (
            <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-2xs space-y-5">
              <div className="border-b border-[#e4e7ec] pb-3">
                <h2 className="text-sm font-bold text-[#001743]">Quy Chuẩn &amp; Cơ Chế Phòng Đấu Giá</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quy tắc chống bắn tỉa (Anti-Snipe), gia hạn tự động và bước giá chuẩn.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">
                    Thời gian gia hạn tự động (phút)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={auctionConfig.autoExtendMinutes}
                    onChange={(e) =>
                      setAuctionConfig({ ...auctionConfig, autoExtendMinutes: parseInt(e.target.value) || 0 })
                    }
                    className="w-full text-xs p-2.5 border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none font-mono font-bold transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Cộng thêm thời gian nếu có lượt trả giá dưới 3 phút</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">
                    Số lần gia hạn tối đa
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={auctionConfig.maxExtensions}
                    onChange={(e) =>
                      setAuctionConfig({ ...auctionConfig, maxExtensions: parseInt(e.target.value) || 0 })
                    }
                    className="w-full text-xs p-2.5 border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none font-mono font-bold transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Giới hạn tránh phiên đấu giá kéo dài vô tận</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">
                    Thời lượng phiên đấu giá mặc định (giờ)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={auctionConfig.defaultAuctionDurationHours}
                    onChange={(e) =>
                      setAuctionConfig({
                        ...auctionConfig,
                        defaultAuctionDurationHours: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full text-xs p-2.5 border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none font-mono font-bold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">
                    Bước giá tối thiểu sàn (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    value={auctionConfig.minBidStepVnd}
                    onChange={(e) =>
                      setAuctionConfig({ ...auctionConfig, minBidStepVnd: parseInt(e.target.value) || 0 })
                    }
                    className="w-full text-xs p-2.5 border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none font-mono font-bold transition-colors"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#e4e7ec] flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveSection("Đấu giá & Quy chuẩn")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
                >
                  <Save size={14} />
                  <span>Lưu cấu hình đấu giá</span>
                </button>
              </div>
            </div>
          )}

          {/* Section: Notification */}
          {activeSection === "notification" && (
            <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-2xs space-y-5">
              <div className="border-b border-[#e4e7ec] pb-3">
                <h2 className="text-sm font-bold text-[#001743]">Tích Hợp Cổng Dịch Vụ &amp; Thông Báo</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Trạng thái kết nối dịch vụ SMS Gateway (SpeedSMS) và Cổng thanh toán VietQR SePay.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 border border-[#e4e7ec] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      SMS
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#001743]">SpeedSMS Brandname Gateway</div>
                      <div className="text-[11px] text-slate-500">Gửi OTP định danh, thông báo thắng phiên đấu giá</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Đang hoạt động
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-[#e4e7ec] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      QR
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#001743]">VietQR SePay Webhook Auto Bank</div>
                      <div className="text-[11px] text-slate-500">Tự động cộng tiền ví sau 3 giây quét mã QR Vietcombank/MB</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Đang hoạt động
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-[#e4e7ec] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                      PKI
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#001743]">Hệ Thống Ký Số Điện Tử (PKI Certificate)</div>
                      <div className="text-[11px] text-slate-500">Tạo chữ ký số biên bản hợp đồng chuyển giao SIM</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Sẵn sàng
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section: Security */}
          {activeSection === "security" && (
            <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-2xs space-y-5">
              <div className="border-b border-[#e4e7ec] pb-3">
                <h2 className="text-sm font-bold text-[#001743]">Bảo Mật &amp; Phiên Đăng Nhập</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ràng buộc thời hạn token xác thực và quy tắc bảo vệ phiên làm việc.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">
                    Thời gian hiệu lực mã OTP (giây)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="600"
                    value={securityConfig.otpExpirySeconds}
                    onChange={(e) =>
                      setSecurityConfig({ ...securityConfig, otpExpirySeconds: parseInt(e.target.value) || 0 })
                    }
                    className="w-full text-xs p-2.5 border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none font-mono font-bold transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Mặc định 120 giây (2 phút)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">
                    Số lần nhập sai OTP tối đa
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={securityConfig.maxOtpRetries}
                    onChange={(e) =>
                      setSecurityConfig({ ...securityConfig, maxOtpRetries: parseInt(e.target.value) || 0 })
                    }
                    className="w-full text-xs p-2.5 border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none font-mono font-bold transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Khóa tạm thời 15 phút nếu nhập sai quá giới hạn</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">
                    Thời hạn phiên đăng nhập (phút)
                  </label>
                  <input
                    type="number"
                    min="15"
                    value={securityConfig.sessionTimeoutMinutes}
                    onChange={(e) =>
                      setSecurityConfig({
                        ...securityConfig,
                        sessionTimeoutMinutes: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full text-xs p-2.5 border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none font-mono font-bold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#001743] mb-1">
                    Yêu cầu eKYC trước khi đấu giá từ (VNĐ)
                  </label>
                  <input
                    type="number"
                    step="10000000"
                    value={securityConfig.requireEkycForBidAbove}
                    onChange={(e) =>
                      setSecurityConfig({
                        ...securityConfig,
                        requireEkycForBidAbove: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full text-xs p-2.5 border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none font-mono font-bold transition-colors"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#e4e7ec] flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveSection("Bảo mật & Phiên")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
                >
                  <Save size={14} />
                  <span>Lưu cấu hình bảo mật</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
