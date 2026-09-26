"use client";
import React, { useState } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { OwnedSim } from "../../types/types";
import { auctionService, CreateAuctionPayload, AuctionTypeEnum } from "@/services/auctionService";
import { aiValuationService, SimValuationDto } from "@/services/aiValuationService";
import { auctionValidators } from "@/utils/validators";

interface CreateAuctionWizardModalProps {
  sim: OwnedSim;
  isEkycVerified: boolean;
  onClose: () => void;
  onSuccess: (auctionCode: string) => void;
  onNavigateToEkyc?: () => void;
  addToast: (toast: { type: "success" | "error" | "info" | "warning"; title: string; message: string }) => void;
}

export default function CreateAuctionWizardModal({
  sim,
  isEkycVerified,
  onClose,
  onSuccess,
  onNavigateToEkyc,
  addToast,
}: CreateAuctionWizardModalProps) {
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  // AI Valuation State
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiValuation, setAiValuation] = useState<SimValuationDto | null>(null);

  // Form State - Auction Type
  const [auctionType, setAuctionType] = useState<AuctionTypeEnum>(AuctionTypeEnum.ENGLISH);

  // Financials
  const defaultStartingPrice = Math.round((sim.estimatedValue || 10_000_000) * 0.8);
  const [startingPrice, setStartingPrice] = useState<number>(defaultStartingPrice);
  const [reservePrice, setReservePrice] = useState<number>(
    auctionType === AuctionTypeEnum.DUTCH
      ? Math.round(defaultStartingPrice * 0.5)
      : Math.round(defaultStartingPrice * 1.2)
  );
  const [depositAmount, setDepositAmount] = useState<number>(500_000);

  // English Auction Rules (Tăng giá công khai)
  const [minimumBidIncrement, setMinimumBidIncrement] = useState<number>(500_000);
  // Anti-sniping: Mặc định luôn bật bắt buộc
  const [extensionThresholdSeconds, setExtensionThresholdSeconds] = useState<number>(180); // 3 phút cuối
  const [extensionDurationSeconds, setExtensionDurationSeconds] = useState<number>(300); // gia hạn thêm 5 phút
  const [maximumExtensionCount, setMaximumExtensionCount] = useState<number>(5);

  // Dutch Auction Rules (Hạ giá tự động)
  const [dutchDecreaseAmount, setDutchDecreaseAmount] = useState<number>(200_000);
  const [dutchDecreaseIntervalSeconds, setDutchDecreaseIntervalSeconds] = useState<number>(300); // 5 phút giảm 1 lần

  // Schedule
  const [startDelayMinutes, setStartDelayMinutes] = useState<number>(15); // Bắt đầu sau 15p
  const [durationHours, setDurationHours] = useState<number>(24); // Kéo dài 24h

  // Formatted Currency Helper
  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(val);

  // Quick Add Helpers for Starting Price
  const handleQuickAdd = (amount: number) => {
    setStartingPrice((prev) => prev + amount);
  };

  // AI Valuation Handler
  const handleRequestAiValuation = async () => {
    setLoadingAi(true);
    try {
      const cleanPhone = sim.simNumber.replace(/\D/g, "");
      const isGuid = Boolean(sim.id && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(sim.id));
      const res = await aiValuationService.estimatePrice({
        simNumberId: isGuid ? sim.id : undefined,
        phoneNumber: cleanPhone,
      });
      setAiValuation(res);
      if (res.suggestedPrice && res.suggestedPrice > 0) {
        addToast({
          type: "info",
          title: "AI đã hoàn tất định giá",
          message: `Mức giá khuyến nghị: ${formatVND(res.suggestedPrice)} (${res.detectedRhythmName || "SIM số đẹp"}).`,
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Chưa thể định giá bằng AI",
        message: err.message || "Vui lòng thử lại sau.",
      });
    } finally {
      setLoadingAi(false);
    }
  };

  // Apply AI Price
  const handleApplyAiPrice = () => {
    if (!aiValuation?.suggestedPrice) return;
    const base = Math.round(aiValuation.suggestedPrice);
    setStartingPrice(base);
    if (auctionType === AuctionTypeEnum.DUTCH) {
      setReservePrice(Math.round(base * 0.6));
    } else {
      setReservePrice(Math.round(base * 1.1));
    }
    addToast({
      type: "success",
      title: "Đã áp dụng mức giá từ AI",
      message: `Giá khởi điểm được cập nhật thành ${formatVND(base)}.`,
    });
  };

  // ── Guard check: eKYC Requirement ──
  if (!isEkycVerified) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-[20px] w-full max-w-[460px] p-6 shadow-2xl border border-slate-100 animate-fade-up">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <img src="/logo/S-Logo.png" alt="TrustSIM" className="w-6 h-6 object-contain" />
              <h3 className="text-base font-extrabold text-[#001743] m-0">Yêu cầu xác minh tài khoản</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-4 bg-amber-50/60 rounded-[14px] text-xs text-amber-900 leading-relaxed mb-5">
            Theo quy định đảm bảo an toàn giao dịch, tài khoản của bạn cần hoàn tất bước <strong>xác thực danh tính (eKYC)</strong> trước khi tạo phiên đấu giá trên sàn.
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-full text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Để sau
            </button>
            <button
              onClick={() => {
                onClose();
                if (onNavigateToEkyc) onNavigateToEkyc();
              }}
              className="px-5 py-2 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-xs font-bold transition-all shadow-sm"
            >
              Xác thực danh tính ngay
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Next Step Validation
  const handleNext = () => {
    if (step === 2) {
      if (startingPrice <= 0) {
        addToast({ type: "error", title: "Giá không hợp lệ", message: "Giá khởi điểm phải lớn hơn 0 ₫." });
        return;
      }
      if (auctionType === AuctionTypeEnum.ENGLISH && minimumBidIncrement <= 0) {
        addToast({ type: "error", title: "Bước giá không hợp lệ", message: "Bước giá tối thiểu phải lớn hơn 0 ₫." });
        return;
      }
      if (auctionType === AuctionTypeEnum.DUTCH) {
        if (dutchDecreaseAmount <= 0) {
          addToast({ type: "error", title: "Mức giảm giá không hợp lệ", message: "Mức giảm giá mỗi chu kỳ phải lớn hơn 0 ₫." });
          return;
        }
        if (reservePrice >= startingPrice) {
          addToast({ type: "error", title: "Giá sàn không hợp lệ", message: "Trong đấu giá giảm giá, giá sàn phải thấp hơn giá khởi điểm." });
          return;
        }
      }
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit Auction
  const handleSubmit = async () => {
    const regStartDate = new Date(Date.now() + 30 * 1000); // 30s tương lai thỏa mãn GreaterThan(DateTime.UtcNow)
    const startAtDate = new Date(Date.now() + Math.max(startDelayMinutes, 1) * 60 * 1000);
    const endAtDate = new Date(startAtDate.getTime() + durationHours * 3600 * 1000);

    // Validate using auctionValidators mirroring CreateAuctionCommandValidator
    const valRes = auctionValidators.validateCreateAuction({
      simNumberId: sim.id,
      startingPrice: Number(startingPrice),
      reservePrice: reservePrice > 0 ? Number(reservePrice) : undefined,
      registrationStartAt: regStartDate,
      registrationEndAt: startAtDate,
      startAt: startAtDate,
      endAt: endAtDate,
    });

    if (!valRes.isValid) {
      addToast({
        type: "error",
        title: "Thiết lập phiên đấu giá chưa hợp lệ",
        message: valRes.error || "Vui lòng kiểm tra lại thời gian và mức giá.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateAuctionPayload = {
        simNumberId: sim.id,
        auctionType: Number(auctionType),
        startingPrice: Number(startingPrice),
        reservePrice: reservePrice > 0 ? Number(reservePrice) : undefined,
        depositAmount: depositAmount > 0 ? Number(depositAmount) : undefined,
        startAt: startAtDate.toISOString(),
        endAt: endAtDate.toISOString(),
        registrationStartAt: regStartDate.toISOString(),
        registrationEndAt: startAtDate.toISOString(),
        // English Rules
        minimumBidIncrement: auctionType === AuctionTypeEnum.ENGLISH ? Number(minimumBidIncrement) : undefined,
        extensionThresholdSeconds: auctionType === AuctionTypeEnum.ENGLISH ? Number(extensionThresholdSeconds) : 0,
        extensionDurationSeconds: auctionType === AuctionTypeEnum.ENGLISH ? Number(extensionDurationSeconds) : 0,
        maximumExtensionCount: auctionType === AuctionTypeEnum.ENGLISH ? Number(maximumExtensionCount) : 0,
        // Dutch Rules
        dutchDecreaseAmount: auctionType === AuctionTypeEnum.DUTCH ? Number(dutchDecreaseAmount) : undefined,
        dutchDecreaseIntervalSeconds: auctionType === AuctionTypeEnum.DUTCH ? Number(dutchDecreaseIntervalSeconds) : undefined,
      };

      const result = await auctionService.createAuction(payload);
      addToast({
        type: "success",
        title: "Tạo phiên đấu giá thành công",
        message: `Phiên đấu giá ${result?.auctionCode || ""} cho SIM ${sim.simNumber} đã được khởi tạo thành công.`,
      });
      onSuccess(result?.auctionCode || "Mới");
      onClose();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Không thể tạo phiên đấu giá",
        message: err.message || "Đã xảy ra lỗi khi tạo phiên đấu giá. Vui lòng thử lại.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-[20px] w-full max-w-[650px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-fade-up">
        {/* ── 1. Modal Header (Đồng nhất nền trắng, Logo chữ S, Đường phân cách mỏng) ── */}
        <div className="px-6 py-4.5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo/S-Logo.png" alt="TrustSIM" className="w-8 h-8 object-contain shrink-0" />
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#001743] tracking-tight m-0">
                Thiết Lập Phiên Đấu Giá SIM
              </h3>
              <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
                Số SIM: <strong className="font-mono text-[#001743]">{sim.simNumber}</strong> • {sim.carrier}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── 2. Stepper Liền Mạch (Progress Bar Track + Node tròn đè lên) ── */}
        <div className="px-8 pt-4 pb-2 bg-white">
          <div className="relative">
            {/* Thanh Progress Bar nền */}
            <div className="absolute top-4 left-4 right-4 h-1 bg-slate-100 rounded-full" />
            {/* Dải màu Primary chạy theo bước */}
            <div
              className="absolute top-4 left-4 h-1 bg-[#001743] rounded-full transition-all duration-300 ease-out"
              style={{
                width:
                  step === 1
                    ? "0%"
                    : step === 2
                      ? "33.3%"
                      : step === 3
                        ? "66.6%"
                        : "calc(100% - 32px)",
              }}
            />

            {/* 4 Node số đè lên thanh */}
            <div className="relative flex justify-between">
              {[
                { num: 1, label: "Hình thức" },
                { num: 2, label: "Giá & Quy tắc" },
                { num: 3, label: "Lịch mở phiên" },
                { num: 4, label: "Xác nhận" },
              ].map((s) => {
                const isActive = step === s.num;
                const isCompleted = step > s.num;
                return (
                  <div key={s.num} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 z-10 ${isActive
                          ? "bg-[#001743] text-white ring-4 ring-[#001743]/10 shadow-sm"
                          : isCompleted
                            ? "bg-emerald-600 text-white"
                            : "bg-white border-2 border-slate-200 text-slate-400"
                        }`}
                    >
                      {isCompleted ? <Check size={14} strokeWidth={2.5} /> : s.num}
                    </div>
                    <span
                      className={`text-[11px] mt-1.5 transition-colors ${isActive
                          ? "font-bold text-[#001743]"
                          : isCompleted
                            ? "font-semibold text-emerald-700"
                            : "font-medium text-slate-400"
                        }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 3. Nội dung các bước ── */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* =========================================================================
              BƯỚC 1: CHỌN LOẠI HÌNH ĐẤU GIÁ (Visual Charts độc bản, thẻ nổi bật)
          ========================================================================= */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#001743] mb-0.5">Chọn hình thức đấu giá</h4>
                <p className="text-slate-500 text-xs">
                  Chọn quy cách trả giá phù hợp với nhu cầu bán SIM của bạn.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* THẺ 1: ĐẤU GIÁ TĂNG GIÁ CÔNG KHAI */}
                <div
                  onClick={() => {
                    setAuctionType(AuctionTypeEnum.ENGLISH);
                    setReservePrice(Math.round(startingPrice * 1.2));
                  }}
                  className={`relative p-5 rounded-[16px] border-2 cursor-pointer transition-all duration-200 overflow-hidden flex flex-col justify-between ${auctionType === AuctionTypeEnum.ENGLISH
                      ? "border-[#001743] bg-gradient-to-b from-blue-50/30 to-white shadow-md -translate-y-1"
                      : "border-slate-200 hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-sm bg-white"
                    }`}
                >
                  <div>
                    {/* Header Thẻ */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-[#001743] bg-blue-100/70 px-2.5 py-1 rounded-full">
                        Tăng giá công khai
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${auctionType === AuctionTypeEnum.ENGLISH
                            ? "border-[#001743] bg-[#001743]"
                            : "border-slate-300"
                          }`}
                      >
                        {auctionType === AuctionTypeEnum.ENGLISH && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    <h5 className="text-sm font-extrabold text-[#001743] mb-1.5">
                      Đấu giá tăng giá công khai
                    </h5>

                    <p className="text-slate-600 text-xs leading-relaxed mb-3">
                      Người tham gia trả giá tăng dần. Khi hết giờ, người trả mức giá hợp lệ cao nhất sẽ thắng phiên.
                    </p>
                  </div>

                  {/* Minh họa trực quan: Biểu đồ đường cong giá tăng dần */}
                  <div className="pt-2">
                    <div className="h-16 w-full rounded-[10px] bg-slate-50/80 p-2 flex flex-col justify-between border border-slate-100/80">
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Bắt đầu</span>
                        <span className="text-[#001743] font-bold">Cao nhất thắng ↗</span>
                      </div>
                      {/* SVG Line Chart minh họa giá tăng */}
                      <svg viewBox="0 0 200 40" className="w-full h-8 overflow-visible">
                        <defs>
                          <linearGradient id="gradEnglish" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#93C5FD" />
                            <stop offset="100%" stopColor="#001743" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 5 35 Q 60 32, 100 20 T 195 5"
                          fill="none"
                          stroke="url(#gradEnglish)"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <circle cx="195" cy="5" r="4" fill="#001743" />
                      </svg>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-blue-900 font-medium bg-blue-50/60 p-2 rounded-[10px]">
                    ✓ Mặc định tự động gia hạn khi có người trả giá sát phút chót.
                  </div>
                </div>

                {/* THẺ 2: ĐẤU GIÁ GIẢM GIÁ TỰ ĐỘNG */}
                <div
                  onClick={() => {
                    setAuctionType(AuctionTypeEnum.DUTCH);
                    setReservePrice(Math.round(startingPrice * 0.5));
                  }}
                  className={`relative p-5 rounded-[16px] border-2 cursor-pointer transition-all duration-200 overflow-hidden flex flex-col justify-between ${auctionType === AuctionTypeEnum.DUTCH
                      ? "border-[#001743] bg-gradient-to-b from-amber-50/30 to-white shadow-md -translate-y-1"
                      : "border-slate-200 hover:border-slate-300 hover:-translate-y-0.5 hover:shadow-sm bg-white"
                    }`}
                >
                  <div>
                    {/* Header Thẻ */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-amber-900 bg-amber-100/70 px-2.5 py-1 rounded-full">
                        Hạ giá tự động
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${auctionType === AuctionTypeEnum.DUTCH
                            ? "border-[#001743] bg-[#001743]"
                            : "border-slate-300"
                          }`}
                      >
                        {auctionType === AuctionTypeEnum.DUTCH && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    <h5 className="text-sm font-extrabold text-[#001743] mb-1.5">
                      Đấu giá giảm giá tự động
                    </h5>

                    <p className="text-slate-600 text-xs leading-relaxed mb-3">
                      Hệ thống tự động hạ giá dần theo thời gian. Người đầu tiên chấp nhận mức giá hiện tại sẽ thắng ngay.
                    </p>
                  </div>

                  {/* Minh họa trực quan: Biểu đồ đường dốc hạ giá theo thời gian */}
                  <div className="pt-2">
                    <div className="h-16 w-full rounded-[10px] bg-slate-50/80 p-2 flex flex-col justify-between border border-slate-100/80">
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Giá khởi điểm</span>
                        <span className="text-amber-800 font-bold">Chốt giá thắng ngay ⚡</span>
                      </div>
                      {/* SVG Line Chart minh họa giá giảm theo chu kỳ */}
                      <svg viewBox="0 0 200 40" className="w-full h-8 overflow-visible">
                        <defs>
                          <linearGradient id="gradDutch" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#B45309" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 5 5 L 45 5 L 45 15 L 90 15 L 90 25 L 140 25 L 140 35 L 195 35"
                          fill="none"
                          stroke="url(#gradDutch)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle cx="140" cy="25" r="4" fill="#B45309" />
                      </svg>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-amber-900 font-medium bg-amber-50/60 p-2 rounded-[10px]">
                    ⚡ Khớp lệnh tức thì, thanh khoản nhanh chóng khi gặp người mua ưng ý.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              BƯỚC 2: THIẾT LẬP GIÁ & QUY TẮC
          ========================================================================= */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Nút Nhờ AI Định Giá SIM */}
              <div className="p-3.5 bg-gradient-to-r from-slate-50 to-blue-50/40 rounded-[14px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center text-[#E4011E] shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-[#001743]">Bạn chưa rõ nên đặt giá bao nhiêu?</div>
                    <div className="text-[11px] text-slate-500">Nhờ trợ lý AI phân tích số đẹp và đề xuất mức giá thị trường phù hợp.</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRequestAiValuation}
                  disabled={loadingAi}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-[#001743] text-[#001743] rounded-full text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {loadingAi ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Đang thẩm định...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} className="text-[#E4011E]" />
                      <span>Nhờ AI định giá SIM</span>
                    </>
                  )}
                </button>
              </div>

              {/* Hộp kết quả gợi ý từ AI nếu có */}
              {aiValuation && (
                <div className="p-3 bg-blue-50/50 rounded-[14px] flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-slate-600">AI đề xuất: </span>
                    <strong className="text-[#001743] font-mono text-sm">{formatVND(aiValuation.suggestedPrice)}</strong>
                    <span className="text-[11px] text-slate-500 ml-1.5">({aiValuation.detectedRhythmName || "SIM VIP"})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyAiPrice}
                    className="px-3 py-1 bg-[#001743] text-white rounded-full text-[11px] font-bold hover:bg-[#00266B] transition-colors"
                  >
                    Áp dụng mức giá này
                  </button>
                </div>
              )}

              {/* Form nhập giá */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#001743] text-xs">
                      Giá khởi điểm (VNĐ) <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-slate-400 text-[11px]">Định dạng: {formatVND(startingPrice)}</span>
                  </div>
                  <input
                    type="number"
                    min={100_000}
                    step={100_000}
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(Number(e.target.value))}
                    className="w-full text-xs p-3 border border-slate-200 rounded-[12px] font-mono font-bold text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
                  />

                  {/* Nút cộng nhanh dạng Pill mềm mại */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[11px] text-slate-400">Cộng nhanh:</span>
                    {[
                      { label: "+1 triệu", val: 1_000_000 },
                      { label: "+5 triệu", val: 5_000_000 },
                      { label: "+10 triệu", val: 10_000_000 },
                      { label: "+50 triệu", val: 50_000_000 },
                    ].map((pill) => (
                      <button
                        key={pill.val}
                        type="button"
                        onClick={() => handleQuickAdd(pill.val)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-full text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="block font-bold text-[#001743] mb-1 text-xs">
                      Tiền cọc tham gia (VNĐ)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={100_000}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(Number(e.target.value))}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-[12px] font-mono font-semibold text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{formatVND(depositAmount)}</span>
                  </div>

                  <div>
                    <label className="block font-bold text-[#001743] mb-1 text-xs">
                      {auctionType === AuctionTypeEnum.ENGLISH ? "Giá sàn bảo lưu (Tùy chọn)" : "Giá sàn dừng giảm *"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500_000}
                      value={reservePrice}
                      onChange={(e) => setReservePrice(Number(e.target.value))}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-[12px] font-mono font-semibold text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{formatVND(reservePrice)}</span>
                  </div>
                </div>
              </div>

              {/* QUY TẮC ĐẤU GIÁ TĂNG GIÁ (ENGLISH) */}
              {auctionType === AuctionTypeEnum.ENGLISH && (
                <div className="p-4 bg-slate-50/70 rounded-[16px] space-y-3">
                  <div className="font-bold text-[#001743] text-xs">
                    Quy định bước giá & Chống nhảy giá phút chót
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-xs">
                      Bước giá tối thiểu (VNĐ) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      min={50_000}
                      step={50_000}
                      value={minimumBidIncrement}
                      onChange={(e) => setMinimumBidIncrement(Number(e.target.value))}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-[12px] font-mono font-bold focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{formatVND(minimumBidIncrement)}</span>
                  </div>

                  {/* Anti-Sniping Parameters - MẶC ĐỊNH LUÔN BẬT */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <div className="font-bold text-slate-800 text-xs mb-1">
                      Cơ chế tự động gia hạn khi có trả giá phút chót (Mặc định)
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed mb-2.5">
                      Nhằm đảm bảo tính công bằng và minh bạch, hệ thống sẽ tự động kéo dài thêm thời gian nếu có người trả giá mới sát thời điểm kết thúc.
                    </p>

                    <div className="grid grid-cols-3 gap-2.5 text-[11px] text-slate-700">
                      <div>
                        <span className="text-slate-500">Kích hoạt khi còn:</span>
                        <select
                          value={extensionThresholdSeconds}
                          onChange={(e) => setExtensionThresholdSeconds(Number(e.target.value))}
                          className="w-full mt-1 p-2 border border-slate-200 rounded-[10px] bg-white text-xs font-semibold focus:border-[#001743] focus:outline-none"
                        >
                          <option value="120">2 phút cuối</option>
                          <option value="180">3 phút cuối</option>
                          <option value="300">5 phút cuối</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-slate-500">Gia hạn thêm:</span>
                        <select
                          value={extensionDurationSeconds}
                          onChange={(e) => setExtensionDurationSeconds(Number(e.target.value))}
                          className="w-full mt-1 p-2 border border-slate-200 rounded-[10px] bg-white text-xs font-semibold focus:border-[#001743] focus:outline-none"
                        >
                          <option value="180">+3 phút</option>
                          <option value="300">+5 phút</option>
                          <option value="600">+10 phút</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-slate-500">Tối đa:</span>
                        <select
                          value={maximumExtensionCount}
                          onChange={(e) => setMaximumExtensionCount(Number(e.target.value))}
                          className="w-full mt-1 p-2 border border-slate-200 rounded-[10px] bg-white text-xs font-semibold focus:border-[#001743] focus:outline-none"
                        >
                          <option value="3">3 lần</option>
                          <option value="5">5 lần</option>
                          <option value="10">10 lần</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* QUY TẮC ĐẤU GIÁ GIẢM GIÁ (DUTCH) */}
              {auctionType === AuctionTypeEnum.DUTCH && (
                <div className="p-4 bg-amber-50/40 rounded-[16px] space-y-3">
                  <div className="font-bold text-amber-900 text-xs">
                    Quy định chu kỳ hạ giá tự động
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-xs">
                        Mức giảm mỗi chu kỳ (VNĐ) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        min={50_000}
                        step={50_000}
                        value={dutchDecreaseAmount}
                        onChange={(e) => setDutchDecreaseAmount(Number(e.target.value))}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-[12px] font-mono font-bold focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{formatVND(dutchDecreaseAmount)}</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-xs">
                        Chu kỳ giảm giá
                      </label>
                      <select
                        value={dutchDecreaseIntervalSeconds}
                        onChange={(e) => setDutchDecreaseIntervalSeconds(Number(e.target.value))}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-[12px] bg-white font-semibold focus:border-[#001743] focus:outline-none"
                      >
                        <option value="60">Mỗi 1 phút</option>
                        <option value="300">Mỗi 5 phút</option>
                        <option value="600">Mỗi 10 phút</option>
                        <option value="1800">Mỗi 30 phút</option>
                        <option value="3600">Mỗi 1 giờ</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white/70 rounded-[10px] text-[11px] text-amber-900">
                    💡 Khi giá giảm chạm mức sàn ({formatVND(reservePrice)}) mà không có ai chốt, phiên sẽ tự động kết thúc để bảo vệ giá trị SIM.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              BƯỚC 3: THỜI GIAN DIỄN RA
          ========================================================================= */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#001743] mb-0.5">Thiết lập thời gian mở phiên</h4>
                <p className="text-slate-500 text-xs">
                  Chọn thời điểm bắt đầu và thời lượng tiếp nhận trả giá.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#001743] mb-1.5 text-xs">
                    Thời điểm bắt đầu phiên
                  </label>
                  <select
                    value={startDelayMinutes}
                    onChange={(e) => setStartDelayMinutes(Number(e.target.value))}
                    className="w-full text-xs p-3 border border-slate-200 rounded-[12px] bg-white font-semibold text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none"
                  >
                    <option value="0">Mở ngay sau khi tạo</option>
                    <option value="15">Sau 15 phút</option>
                    <option value="60">Sau 1 giờ</option>
                    <option value="180">Sau 3 giờ</option>
                    <option value="1440">Sau 24 giờ (Ngày mai)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#001743] mb-1.5 text-xs">
                    Thời lượng diễn ra phiên
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full text-xs p-3 border border-slate-200 rounded-[12px] bg-white font-semibold text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none"
                  >
                    <option value="6">6 giờ</option>
                    <option value="12">12 giờ</option>
                    <option value="24">24 giờ (1 ngày)</option>
                    <option value="48">48 giờ (2 ngày)</option>
                    <option value="72">72 giờ (3 ngày)</option>
                  </select>
                </div>
              </div>

              {/* Thông báo Soft UI nhẹ nhàng, không viền, bo góc lớn */}
              <div className="p-4 bg-blue-50/50 rounded-[16px] text-xs text-slate-600 leading-relaxed">
                Hệ thống sẽ tự động mở phiên và công bố kết quả minh bạch theo đúng thời gian bạn đã thiết lập. Bạn có thể theo dõi tiến độ trả giá trực tiếp bất kỳ lúc nào.
              </div>
            </div>
          )}

          {/* =========================================================================
              BƯỚC 4: XÁC NHẬN & CAM KẾT
          ========================================================================= */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-5 bg-slate-50/70 rounded-[16px] space-y-3">
                <div className="font-bold text-xs text-[#001743] pb-2 border-b border-slate-200/60 flex justify-between items-center">
                  <span>Tóm tắt thông số phiên đấu giá</span>
                  <span className="text-[11px] px-3 py-0.5 rounded-full font-bold bg-[#001743] text-white">
                    {auctionType === AuctionTypeEnum.ENGLISH ? "Tăng giá công khai" : "Hạ giá tự động"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div><span className="text-slate-500">Số SIM:</span> <strong className="text-[#001743] font-mono">{sim.simNumber}</strong></div>
                  <div><span className="text-slate-500">Nhà mạng:</span> <strong className="text-[#001743]">{sim.carrier}</strong></div>
                  <div><span className="text-slate-500">Giá khởi điểm:</span> <strong className="text-[#001743] font-mono">{formatVND(startingPrice)}</strong></div>
                  <div><span className="text-slate-500">Tiền cọc:</span> <strong className="text-[#001743] font-mono">{formatVND(depositAmount)}</strong></div>

                  {auctionType === AuctionTypeEnum.ENGLISH && (
                    <>
                      <div><span className="text-slate-500">Bước giá tối thiểu:</span> <strong className="text-[#001743] font-mono">{formatVND(minimumBidIncrement)}</strong></div>
                      <div><span className="text-slate-500">Gia hạn phút chót:</span> <strong className="text-emerald-700">Đã bật (Tối đa {maximumExtensionCount} lần)</strong></div>
                    </>
                  )}

                  {auctionType === AuctionTypeEnum.DUTCH && (
                    <>
                      <div><span className="text-slate-500">Mức giảm:</span> <strong className="text-[#001743] font-mono">{formatVND(dutchDecreaseAmount)} / chu kỳ</strong></div>
                      <div><span className="text-slate-500">Giá sàn dừng giảm:</span> <strong className="text-[#001743] font-mono">{formatVND(reservePrice)}</strong></div>
                    </>
                  )}

                  <div><span className="text-slate-500">Thời lượng:</span> <strong className="text-[#001743]">{durationHours} giờ</strong></div>
                </div>
              </div>

              {/* Thông báo Bảo đảm Soft UI */}
              <div className="p-4 bg-emerald-50/50 rounded-[16px] flex items-start gap-3 text-xs text-emerald-900 leading-relaxed">
                <ShieldCheck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Bảo đảm quyền sở hữu & an toàn giao dịch:</strong> Trong suốt thời gian phiên đấu giá diễn ra, SIM sẽ được giữ trạng thái bảo đảm nhằm bảo vệ quyền lợi hợp lệ của cả người bán và người mua.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Modal Footer Controls ── */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={step === 1 ? onClose : handlePrev}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {step === 1 ? "Hủy bỏ" : <><ArrowLeft size={14} /> Quay lại</>}
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-xs font-bold transition-all shadow-sm"
            >
              <span>Tiếp tục</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#E4011E] hover:bg-[#C00119] text-white rounded-full text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang khởi tạo...</span>
                </>
              ) : (
                <>
                  <img src="/logo/S-White-Logo.png" alt="S" className="w-3.5 h-3.5 object-contain" />
                  <span>Xác nhận mở phiên đấu giá</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
