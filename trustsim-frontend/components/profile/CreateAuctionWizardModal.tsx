"use client";
import React, { useState } from "react";
import {
  Gavel,
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Sliders,
  Calendar,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Info,
  Loader2,
} from "lucide-react";
import { OwnedSim } from "./types";
import { auctionService, CreateAuctionPayload, AuctionTypeEnum } from "@/services/auctionService";

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

  // Form State
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

  // English Auction Rules
  const [minimumBidIncrement, setMinimumBidIncrement] = useState<number>(500_000);
  const [enableAntiSniping, setEnableAntiSniping] = useState<boolean>(true);
  const [extensionThresholdSeconds, setExtensionThresholdSeconds] = useState<number>(180); // 3 phút cuối
  const [extensionDurationSeconds, setExtensionDurationSeconds] = useState<number>(300); // gia hạn thêm 5 phút
  const [maximumExtensionCount, setMaximumExtensionCount] = useState<number>(5);

  // Dutch Auction Rules
  const [dutchDecreaseAmount, setDutchDecreaseAmount] = useState<number>(200_000);
  const [dutchDecreaseIntervalSeconds, setDutchDecreaseIntervalSeconds] = useState<number>(300); // 5 phút giảm 1 lần

  // Schedule
  const [startDelayMinutes, setStartDelayMinutes] = useState<number>(15); // Bắt đầu sau 15p
  const [durationHours, setDurationHours] = useState<number>(24); // Kéo dài 24h

  // Formatted Helper
  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(val);

  // ── Guard check: eKYC & SIM Verification ──
  if (!isEkycVerified) {
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-[12px] w-full max-w-[460px] p-6 shadow-2xl border border-rose-200 animate-fade-up">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
              <AlertCircle size={20} />
              <span>Yêu cầu xác thực eKYC</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            Theo quy định sàn TrustSIM, tài khoản cần hoàn tất xác thực danh tính căn cước công dân (eKYC) trước khi có thể mở phiên đấu giá SIM trên hệ thống.
          </p>
          <div className="flex justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-[6px] text-xs font-semibold hover:bg-slate-50"
            >
              Để sau
            </button>
            <button
              onClick={() => {
                onClose();
                if (onNavigateToEkyc) onNavigateToEkyc();
              }}
              className="px-4 py-2 bg-[#001743] hover:bg-[#00266B] text-white rounded-[6px] text-xs font-bold transition-colors"
            >
              Đến trang xác thực eKYC
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          addToast({ type: "error", title: "Bước giảm giá không hợp lệ", message: "Mức giảm mỗi chu kỳ phải lớn hơn 0 ₫." });
          return;
        }
        if (reservePrice >= startingPrice) {
          addToast({ type: "error", title: "Giá sàn không hợp lệ", message: "Trong đấu giá Hà Lan, giá sàn (Reserve Price) phải nhỏ hơn giá khởi điểm." });
          return;
        }
      }
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const startAtDate = new Date(Date.now() + startDelayMinutes * 60 * 1000);
      const endAtDate = new Date(startAtDate.getTime() + durationHours * 3600 * 1000);

      const payload: CreateAuctionPayload = {
        simNumberId: sim.id,
        auctionType: Number(auctionType),
        startingPrice: Number(startingPrice),
        reservePrice: reservePrice > 0 ? Number(reservePrice) : undefined,
        depositAmount: depositAmount > 0 ? Number(depositAmount) : undefined,
        startAt: startAtDate.toISOString(),
        endAt: endAtDate.toISOString(),
        registrationStartAt: new Date().toISOString(),
        registrationEndAt: startAtDate.toISOString(),
        // English Rules
        minimumBidIncrement: auctionType === AuctionTypeEnum.ENGLISH ? Number(minimumBidIncrement) : undefined,
        extensionThresholdSeconds: enableAntiSniping && auctionType === AuctionTypeEnum.ENGLISH ? Number(extensionThresholdSeconds) : 0,
        extensionDurationSeconds: enableAntiSniping && auctionType === AuctionTypeEnum.ENGLISH ? Number(extensionDurationSeconds) : 0,
        maximumExtensionCount: enableAntiSniping && auctionType === AuctionTypeEnum.ENGLISH ? Number(maximumExtensionCount) : 0,
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
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-[14px] w-full max-w-[620px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-fade-up">
        {/* ── Modal Header ── */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E4011E]/20 text-[#E4011E] flex items-center justify-center font-bold">
              <Gavel size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white m-0">Thiết Lập Phiên Đấu Giá SIM</h3>
              <p className="text-[11px] text-slate-300 m-0">SIM: {sim.simNumber} • {sim.carrier}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Stepper Navigation ── */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          {[
            { num: 1, label: "Loại hình" },
            { num: 2, label: "Quy tắc & Giá" },
            { num: 3, label: "Lịch trình" },
            { num: 4, label: "Xác nhận" },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    step === s.num
                      ? "bg-[#001743] text-white"
                      : step > s.num
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {step > s.num ? "✓" : s.num}
                </div>
                <span className={`font-semibold ${step === s.num ? "text-[#001743]" : "text-slate-500"}`}>
                  {s.label}
                </span>
              </div>
              {idx < 3 && <div className="h-0.5 flex-1 bg-slate-200 mx-2" />}
            </React.Fragment>
          ))}
        </div>

        {/* ── Step Body ── */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* STEP 1: CHỌN HÌNH THỨC */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#001743] mb-1">Chọn loại hình đấu giá</h4>
                <p className="text-slate-500 text-xs">
                  Mỗi loại hình có quy chế khớp lệnh và xác định người thắng cuộc khác nhau.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* English Auction Card */}
                <div
                  onClick={() => {
                    setAuctionType(AuctionTypeEnum.ENGLISH);
                    setReservePrice(Math.round(startingPrice * 1.2));
                  }}
                  className={`p-4 rounded-[10px] border-2 cursor-pointer transition-all ${
                    auctionType === AuctionTypeEnum.ENGLISH
                      ? "border-[#001743] bg-blue-50/40 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-md bg-blue-100 text-[#001743] flex items-center justify-center">
                      <TrendingUp size={16} />
                    </div>
                    {auctionType === AuctionTypeEnum.ENGLISH && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#001743]" />
                    )}
                  </div>
                  <div className="font-bold text-sm text-[#001743] mb-1">Đấu giá kiểu Anh (English)</div>
                  <p className="text-slate-600 text-[11px] leading-relaxed mb-2">
                    Giá tăng dần công khai. Người trả giá hợp lệ cao nhất khi hết giờ sẽ trúng đấu giá.
                  </p>
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                    ✓ Hỗ trợ Anti-Sniping gia hạn phút cuối
                  </div>
                </div>

                {/* Dutch Auction Card */}
                <div
                  onClick={() => {
                    setAuctionType(AuctionTypeEnum.DUTCH);
                    setReservePrice(Math.round(startingPrice * 0.5));
                  }}
                  className={`p-4 rounded-[10px] border-2 cursor-pointer transition-all ${
                    auctionType === AuctionTypeEnum.DUTCH
                      ? "border-[#001743] bg-amber-50/40 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center">
                      <TrendingDown size={16} />
                    </div>
                    {auctionType === AuctionTypeEnum.DUTCH && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#001743]" />
                    )}
                  </div>
                  <div className="font-bold text-sm text-[#001743] mb-1">Đấu giá kiểu Hà Lan (Dutch)</div>
                  <p className="text-slate-600 text-[11px] leading-relaxed mb-2">
                    Hệ thống tự động hạ giá dần theo thời gian. Người đầu tiên chấp nhận mức giá hiện tại sẽ thắng ngay.
                  </p>
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                    ⚡ Khớp lệnh tức thì (First-Bid-Wins)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CẤU HÌNH TÀI CHÍNH & QUY TẮC */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Giá khởi điểm */}
                <div>
                  <label className="block font-bold text-[#001743] mb-1">
                    Giá khởi điểm (VNĐ) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min={100_000}
                    step={100_000}
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-[6px] font-mono font-bold text-[#001743] focus:border-[#001743] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">{formatVND(startingPrice)}</span>
                </div>

                {/* Tiền cọc tham gia */}
                <div>
                  <label className="block font-bold text-[#001743] mb-1">
                    Tiền cọc đăng ký tham gia (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100_000}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-[6px] font-mono font-semibold text-[#001743] focus:border-[#001743] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">{formatVND(depositAmount)}</span>
                </div>
              </div>

              {/* RULES DÀNH RIÊNG CHO ENGLISH AUCTION */}
              {auctionType === AuctionTypeEnum.ENGLISH && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-[8px] space-y-3">
                  <div className="font-bold text-[#001743] flex items-center gap-1.5">
                    <Sliders size={14} />
                    <span>Quy tắc Đấu giá kiểu Anh</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Bước giá tối thiểu (VNĐ) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        min={50_000}
                        step={50_000}
                        value={minimumBidIncrement}
                        onChange={(e) => setMinimumBidIncrement(Number(e.target.value))}
                        className="w-full text-xs p-2 border border-slate-300 rounded-[6px] font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-500">{formatVND(minimumBidIncrement)}</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Giá bảo lưu tối thiểu (Tùy chọn)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={500_000}
                        value={reservePrice}
                        onChange={(e) => setReservePrice(Number(e.target.value))}
                        className="w-full text-xs p-2 border border-slate-300 rounded-[6px] font-mono"
                      />
                      <span className="text-[10px] text-slate-500">{formatVND(reservePrice)}</span>
                    </div>
                  </div>

                  {/* Anti-Sniping Toggle */}
                  <div className="pt-2 border-t border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={enableAntiSniping}
                        onChange={(e) => setEnableAntiSniping(e.target.checked)}
                        className="rounded text-[#001743] focus:ring-0"
                      />
                      <span className="font-bold text-slate-800">Kích hoạt cơ chế chống giật giờ chót (Anti-Sniping)</span>
                    </label>

                    {enableAntiSniping && (
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                        <div>
                          <span>Ngưỡng kích hoạt:</span>
                          <select
                            value={extensionThresholdSeconds}
                            onChange={(e) => setExtensionThresholdSeconds(Number(e.target.value))}
                            className="w-full mt-1 p-1 border border-slate-200 rounded text-xs font-semibold"
                          >
                            <option value="120">2 phút cuối</option>
                            <option value="180">3 phút cuối</option>
                            <option value="300">5 phút cuối</option>
                          </select>
                        </div>
                        <div>
                          <span>Thời gian gia hạn:</span>
                          <select
                            value={extensionDurationSeconds}
                            onChange={(e) => setExtensionDurationSeconds(Number(e.target.value))}
                            className="w-full mt-1 p-1 border border-slate-200 rounded text-xs font-semibold"
                          >
                            <option value="180">+3 phút</option>
                            <option value="300">+5 phút</option>
                            <option value="600">+10 phút</option>
                          </select>
                        </div>
                        <div>
                          <span>Gia hạn tối đa:</span>
                          <select
                            value={maximumExtensionCount}
                            onChange={(e) => setMaximumExtensionCount(Number(e.target.value))}
                            className="w-full mt-1 p-1 border border-slate-200 rounded text-xs font-semibold"
                          >
                            <option value="3">3 lần</option>
                            <option value="5">5 lần</option>
                            <option value="10">10 lần</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* RULES DÀNH RIÊNG CHO DUTCH AUCTION */}
              {auctionType === AuctionTypeEnum.DUTCH && (
                <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-[8px] space-y-3">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <TrendingDown size={14} />
                    <span>Quy tắc Đấu giá kiểu Hà Lan (Hạ giá theo thời gian)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Mức giảm mỗi chu kỳ <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        min={50_000}
                        step={50_000}
                        value={dutchDecreaseAmount}
                        onChange={(e) => setDutchDecreaseAmount(Number(e.target.value))}
                        className="w-full text-xs p-2 border border-slate-300 rounded-[6px] font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-500">{formatVND(dutchDecreaseAmount)}</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Chu kỳ giảm giá
                      </label>
                      <select
                        value={dutchDecreaseIntervalSeconds}
                        onChange={(e) => setDutchDecreaseIntervalSeconds(Number(e.target.value))}
                        className="w-full text-xs p-2 border border-slate-300 rounded-[6px] bg-white font-semibold"
                      >
                        <option value="60">Mỗi 1 phút</option>
                        <option value="300">Mỗi 5 phút</option>
                        <option value="600">Mỗi 10 phút</option>
                        <option value="1800">Mỗi 30 phút</option>
                        <option value="3600">Mỗi 1 giờ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Giá sàn (Reserve Price) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        min={100_000}
                        step={100_000}
                        value={reservePrice}
                        onChange={(e) => setReservePrice(Number(e.target.value))}
                        className="w-full text-xs p-2 border border-slate-300 rounded-[6px] font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-500">{formatVND(reservePrice)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: LÊN LỊCH THỜI GIAN */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#001743] mb-1">Thiết lập thời gian diễn ra</h4>
                <p className="text-slate-500 text-xs">
                  Xác định thời điểm mở phiên và thời lượng tiếp nhận trả giá.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-[#001743] mb-1">
                    Thời điểm bắt đầu phiên
                  </label>
                  <select
                    value={startDelayMinutes}
                    onChange={(e) => setStartDelayMinutes(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-[6px] bg-white font-semibold text-[#001743] focus:border-[#001743]"
                  >
                    <option value="0">Bắt đầu ngay sau khi tạo</option>
                    <option value="15">Sau 15 phút</option>
                    <option value="60">Sau 1 giờ</option>
                    <option value="180">Sau 3 giờ</option>
                    <option value="1440">Sau 24 giờ (1 ngày tới)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#001743] mb-1">
                    Thời lượng diễn ra phiên
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-[6px] bg-white font-semibold text-[#001743] focus:border-[#001743]"
                  >
                    <option value="6">6 giờ</option>
                    <option value="12">12 giờ</option>
                    <option value="24">24 giờ (1 ngày)</option>
                    <option value="48">48 giờ (2 ngày)</option>
                    <option value="72">72 giờ (3 ngày)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-[8px] flex items-start gap-2 text-blue-900 text-xs">
                <Info size={16} className="text-blue-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Hệ thống Background Worker sẽ tự động kích hoạt phiên khi đến thời gian bắt đầu và tự động chốt kết quả người thắng khi phiên hết thời gian hoặc khi có người chấp nhận giá Hà Lan.
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: XÁC NHẬN & CAM KẾT */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-[10px] space-y-2.5">
                <div className="font-bold text-sm text-[#001743] pb-2 border-b border-slate-200 flex justify-between items-center">
                  <span>Tóm tắt thông số phiên đấu giá</span>
                  <span className="text-xs px-2 py-0.5 rounded font-bold bg-[#001743] text-white">
                    {auctionType === AuctionTypeEnum.ENGLISH ? "English Auction" : "Dutch Auction"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-500">Số SIM:</span> <strong className="text-[#001743]">{sim.simNumber}</strong></div>
                  <div><span className="text-slate-500">Nhà mạng:</span> <strong className="text-[#001743]">{sim.carrier}</strong></div>
                  <div><span className="text-slate-500">Giá khởi điểm:</span> <strong className="text-[#001743]">{formatVND(startingPrice)}</strong></div>
                  <div><span className="text-slate-500">Tiền cọc:</span> <strong className="text-[#001743]">{formatVND(depositAmount)}</strong></div>

                  {auctionType === AuctionTypeEnum.ENGLISH && (
                    <>
                      <div><span className="text-slate-500">Bước giá:</span> <strong className="text-[#001743]">{formatVND(minimumBidIncrement)}</strong></div>
                      <div><span className="text-slate-500">Anti-Sniping:</span> <strong className="text-emerald-700">{enableAntiSniping ? "Bật" : "Tắt"}</strong></div>
                    </>
                  )}

                  {auctionType === AuctionTypeEnum.DUTCH && (
                    <>
                      <div><span className="text-slate-500">Mức giảm:</span> <strong className="text-[#001743]">{formatVND(dutchDecreaseAmount)} / chu kỳ</strong></div>
                      <div><span className="text-slate-500">Giá sàn:</span> <strong className="text-[#001743]">{formatVND(reservePrice)}</strong></div>
                    </>
                  )}

                  <div><span className="text-slate-500">Thời lượng:</span> <strong className="text-[#001743]">{durationHours} giờ</strong></div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[8px] flex items-start gap-2 text-emerald-900 text-xs">
                <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Cam kết ký quỹ & bảo mật:</strong> Trong suốt thời gian diễn ra phiên đấu giá, SIM sẽ được khóa chuyển nhượng để đảm bảo an toàn giao dịch.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Modal Footer Controls ── */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={step === 1 ? onClose : handlePrev}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-white text-slate-700 rounded-[6px] text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {step === 1 ? "Hủy bỏ" : <><ArrowLeft size={14} /> Quay lại</>}
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#001743] hover:bg-[#00266B] text-white rounded-[6px] text-xs font-bold transition-colors shadow-xs"
            >
              <span>Tiếp tục</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#E4011E] hover:bg-[#C00119] text-white rounded-[6px] text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang khởi tạo...</span>
                </>
              ) : (
                <>
                  <Gavel size={14} />
                  <span>Xác nhận mở phiên</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
