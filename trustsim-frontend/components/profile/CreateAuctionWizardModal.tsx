"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  ShieldCheck,
  Loader2,
  Info,
  AlertTriangle,
  Smartphone,
  ChevronDown,
  CheckCircle2,
  Zap,
  Clock,
  DollarSign,
  RefreshCw,
  Flame,
  Sliders,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { OwnedSim } from "../../types/types";
import {
  auctionService,
  CreateAuctionPayload,
  AuctionTypeEnum,
} from "@/services/auctionService";
import {
  aiValuationService,
  SimValuationDto,
} from "@/services/aiValuationService";
import {
  getMyOwnerships,
  getMySims,
  formatPhoneNumber,
  getCarrierColor,
  SimOwnershipDto,
} from "@/services/simService";
import { auctionValidators } from "@/utils/validators";

interface CreateAuctionWizardModalProps {
  sim?: OwnedSim | null;
  isEkycVerified: boolean;
  onClose: () => void;
  onSuccess: (auctionCode: string) => void;
  onNavigateToEkyc?: () => void;
  onNavigateToVerifySim?: (sim?: OwnedSim) => void;
  addToast: (toast: {
    type: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
  }) => void;
}

/* ─── Gold SIM Microchip (Realistic Vector Asset) ────────────────────────── */
function SimMicrochip() {
  return (
    <svg
      width="38"
      height="30"
      viewBox="0 0 48 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-sm"
    >
      <defs>
        <linearGradient id="wizChipBorder" x1="0" y1="0" x2="48" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="45%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id="wizChipBg" x1="0" y1="0" x2="48" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="50%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>
        <linearGradient id="wizPadGrad" x1="0" y1="0" x2="0" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="35%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <rect x="0.75" y="0.75" width="46.5" height="36.5" rx="5.5" fill="url(#wizChipBg)" stroke="url(#wizChipBorder)" strokeWidth="1.5" />
      <rect x="4.5" y="4.5" width="10" height="7.5" rx="2" fill="url(#wizPadGrad)" />
      <rect x="19" y="4.5" width="10" height="7.5" rx="2" fill="url(#wizPadGrad)" />
      <rect x="33.5" y="4.5" width="10" height="7.5" rx="2" fill="url(#wizPadGrad)" />
      <rect x="4.5" y="15" width="10" height="8" rx="2" fill="url(#wizPadGrad)" />
      <rect x="18" y="15" width="12" height="8" rx="4" fill="url(#wizPadGrad)" />
      <rect x="33.5" y="15" width="10" height="8" rx="2" fill="url(#wizPadGrad)" />
      <rect x="4.5" y="26" width="10" height="7.5" rx="2" fill="url(#wizPadGrad)" />
      <rect x="19" y="26" width="10" height="7.5" rx="2" fill="url(#wizPadGrad)" />
      <rect x="33.5" y="26" width="10" height="7.5" rx="2" fill="url(#wizPadGrad)" />
    </svg>
  );
}

export default function CreateAuctionWizardModal({
  sim: initialSim,
  isEkycVerified,
  onClose,
  onSuccess,
  onNavigateToEkyc,
  onNavigateToVerifySim,
  addToast,
}: CreateAuctionWizardModalProps) {
  // Stepper State (1 -> 4)
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  // SIM Selection State
  const [ownedSimList, setOwnedSimList] = useState<OwnedSim[]>([]);
  const [loadingSims, setLoadingSims] = useState(true);
  const [selectedSim, setSelectedSim] = useState<OwnedSim | null>(initialSim || null);
  const [isSimPickerOpen, setIsSimPickerOpen] = useState(false);

  // AI Valuation State
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiValuation, setAiValuation] = useState<SimValuationDto | null>(null);

  // Form State - Auction Type
  const [auctionType, setAuctionType] = useState<AuctionTypeEnum>(AuctionTypeEnum.ENGLISH);

  // Financials
  const defaultInitialPrice = selectedSim?.estimatedValue
    ? Math.round(selectedSim.estimatedValue * 0.8)
    : 10_000_000;
  const [startingPrice, setStartingPrice] = useState<number>(defaultInitialPrice);
  const [reservePrice, setReservePrice] = useState<number>(
    auctionType === AuctionTypeEnum.DUTCH
      ? Math.round(defaultInitialPrice * 0.6)
      : Math.round(defaultInitialPrice * 1.2)
  );
  const [depositAmount, setDepositAmount] = useState<number>(1_000_000);

  // English Auction Rules (Tăng giá công khai)
  const [minimumBidIncrement, setMinimumBidIncrement] = useState<number>(500_000);
  const [maxStepMultiplier, setMaxStepMultiplier] = useState<number>(10); // Giới hạn bước nhảy N
  // Anti-sniping Engine
  const [extensionThresholdSeconds, setExtensionThresholdSeconds] = useState<number>(120); // 2 phút cuối
  const [extensionDurationSeconds, setExtensionDurationSeconds] = useState<number>(300); // gia hạn thêm 5 phút
  const [maximumExtensionCount, setMaximumExtensionCount] = useState<number>(5);
  const [maxSnipeExtensionsPerParticipant, setMaxSnipeExtensionsPerParticipant] = useState<number>(3);
  // Ký quỹ & Á quân (Runner-up) Anti-Shill Rules
  const [marginPercentage, setMarginPercentage] = useState<number>(0.10);
  const [maxPriceGapRatioForRunnerUp, setMaxPriceGapRatioForRunnerUp] = useState<number>(1.50);
  const [minimumUniqueBiddersForRunnerUp, setMinimumUniqueBiddersForRunnerUp] = useState<number>(2);
  const [requireSellerApprovalForRunnerUp, setRequireSellerApprovalForRunnerUp] = useState<boolean>(true);

  // Dutch Auction Rules (Hạ giá tự động)
  const [dutchDecreaseAmount, setDutchDecreaseAmount] = useState<number>(1_000_000);
  const [dutchDecreaseIntervalSeconds, setDutchDecreaseIntervalSeconds] = useState<number>(60); // 60s giảm 1 lần

  // Schedule & Grace Period
  const [startPreset, setStartPreset] = useState<string>("15"); // '0' (ngay), '15', '60', '180', '1440', 'custom'
  const [customStartAt, setCustomStartAt] = useState<string>("");
  const [durationHours, setDurationHours] = useState<number>(24); // Kéo dài 24h
  const [gracePeriodHours, setGracePeriodHours] = useState<number>(24); // 24h thanh toán

  // Format Helper
  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(val || 0);

  // ── 1. Fetch user's verified owned SIMs from database ──
  useEffect(() => {
    let isMounted = true;
    async function loadUserSims() {
      setLoadingSims(true);
      try {
        // Ưu tiên getMyOwnerships() từ SIM Ownership controller
        const ownerships: SimOwnershipDto[] = await getMyOwnerships().catch(() => []);

        let mapped: OwnedSim[] = [];
        if (ownerships && ownerships.length > 0) {
          mapped = ownerships.map((o) => ({
            id: o.simNumberId || o.id,
            simNumber: formatPhoneNumber(o.phoneNumber),
            carrier: o.carrierName || o.carrierCode || "Viettel",
            carrierLogo: o.carrierLogo,
            carrierCode: o.carrierCode,
            simType: "Trả trước",
            acquiredFrom: "PERSONAL_IMPORT",
            ownershipStatus:
              o.verificationStatus === 2 || o.verificationStatus === "VERIFIED"
                ? "VERIFIED_OWNER"
                : "UNVERIFIED",
            estimatedValue: Number(o.price) || 0,
            createdDate: o.createdDate || new Date().toISOString(),
            hasActiveAuction: o.simStatus === "IN_AUCTION",
            formatRhythmId: o.formatRhythmId,
            formatRhythmName: o.formatRhythmName,
          }));
        } else {
          // Fallback sang getMySims
          const res = await getMySims({ pageIndex: 1, pageSize: 50 });
          mapped = (res.items || []).map((item) => ({
            id: item.id,
            simNumber: formatPhoneNumber(item.phoneNumber),
            carrier: item.carrierName || "Viettel",
            carrierLogo: item.carrierLogo,
            carrierCode: item.carrierCode,
            simType: "Trả trước",
            acquiredFrom: "PERSONAL_IMPORT",
            ownershipStatus:
              item.verificationStatus === 2 || item.verificationStatus === "VERIFIED"
                ? "VERIFIED_OWNER"
                : "UNVERIFIED",
            estimatedValue: Number(item.price) || 0,
            createdDate: item.createdDate || new Date().toISOString(),
            hasActiveAuction: item.simStatus === "IN_AUCTION",
            formatRhythmId: item.formatRhythmId,
            formatRhythmName: item.formatRhythmName,
            categoryNames: item.categoryNames || [],
          }));
        }

        if (isMounted) {
          setOwnedSimList(mapped);
          // Nếu chưa có selectedSim hoặc initialSim không nằm trong list, pre-select cái đầu tiên đã verified
          if (!selectedSim && mapped.length > 0) {
            const firstEligible = mapped.find(
              (s) => s.ownershipStatus === "VERIFIED_OWNER" && !s.hasActiveAuction
            );
            if (firstEligible) {
              setSelectedSim(firstEligible);
              if (firstEligible.estimatedValue > 0) {
                const base = Math.round(firstEligible.estimatedValue * 0.8);
                setStartingPrice(base);
                setReservePrice(Math.round(base * 1.2));
              }
            }
          }
        }
      } catch (err: any) {
        console.error("Failed to load owned SIMs for auction:", err);
      } finally {
        if (isMounted) setLoadingSims(false);
      }
    }

    loadUserSims();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter SIMs eligible for auction (Đã xác thực & chưa lên sàn)
  const verifiedEligibleSims = useMemo(() => {
    return ownedSimList.filter(
      (s) => s.ownershipStatus === "VERIFIED_OWNER" && !s.hasActiveAuction
    );
  }, [ownedSimList]);

  // When selectedSim changes, update default prices if appropriate
  const handleSelectSim = (chosen: OwnedSim) => {
    setSelectedSim(chosen);
    setIsSimPickerOpen(false);
    setAiValuation(null);
    if (chosen.estimatedValue && chosen.estimatedValue > 0) {
      const base = Math.round(chosen.estimatedValue * 0.8);
      setStartingPrice(base);
      setReservePrice(
        auctionType === AuctionTypeEnum.DUTCH
          ? Math.round(base * 0.6)
          : Math.round(base * 1.2)
      );
    }
  };

  // Quick Price Add Helpers
  const handleQuickAdd = (amount: number) => {
    setStartingPrice((prev) => prev + amount);
  };

  // Quick Deposit Presets
  const handleQuickDeposit = (percent: number) => {
    setDepositAmount(Math.max(100_000, Math.round(startingPrice * percent)));
  };

  // Dutch Projection Calculator (Mirror logic test-ui)
  const dutchProjection = useMemo(() => {
    if (auctionType !== AuctionTypeEnum.DUTCH) return null;
    if (
      startingPrice > 0 &&
      reservePrice > 0 &&
      dutchDecreaseAmount > 0 &&
      dutchDecreaseIntervalSeconds > 0 &&
      startingPrice >= reservePrice
    ) {
      const priceGap = startingPrice - reservePrice;
      const steps = Math.ceil(priceGap / dutchDecreaseAmount);
      const totalSeconds = steps * dutchDecreaseIntervalSeconds;
      const totalMinutes = Math.floor(totalSeconds / 60);
      const remSeconds = totalSeconds % 60;
      const timeStr =
        totalMinutes > 0
          ? `${totalMinutes} phút${remSeconds > 0 ? ` ${remSeconds}s` : ""}`
          : `${remSeconds} giây`;
      return {
        steps,
        totalSeconds,
        timeStr,
        priceGap,
      };
    }
    return null;
  }, [auctionType, startingPrice, reservePrice, dutchDecreaseAmount, dutchDecreaseIntervalSeconds]);

  // Request AI Valuation Handler
  const handleRequestAiValuation = async () => {
    if (!selectedSim) return;
    setLoadingAi(true);
    try {
      const cleanPhone = selectedSim.simNumber.replace(/\D/g, "");
      const isGuid = Boolean(
        selectedSim.id &&
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          selectedSim.id
        )
      );
      const res = await aiValuationService.estimatePrice({
        simNumberId: isGuid ? selectedSim.id : undefined,
        phoneNumber: cleanPhone,
      });
      setAiValuation(res);
      if (res.suggestedPrice && res.suggestedPrice > 0) {
        addToast({
          type: "info",
          title: "AI Thẩm Định Hoàn Tất",
          message: `Mức giá khuyến nghị: ${formatVND(
            res.suggestedPrice
          )} (${res.detectedRhythmName || "SIM VIP"}).`,
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
      setReservePrice(Math.round(base * 1.15));
    }
    setDepositAmount(Math.max(500_000, Math.round(base * 0.1)));
    addToast({
      type: "success",
      title: "Đã áp dụng định giá từ AI",
      message: `Giá khởi điểm: ${formatVND(base)} • Tiền cọc: ${formatVND(
        Math.round(base * 0.1)
      )}.`,
    });
  };

  // ── Guard check: eKYC Requirement ──
  if (!isEkycVerified) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
        <div className="bg-white rounded-[24px] w-full max-w-[460px] p-6 shadow-2xl border border-slate-100 animate-fade-up">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <img src="/logo/S-Logo.png" alt="TrustSIM" className="w-6 h-6 object-contain" />
              <h3 className="text-base font-extrabold text-[#001743] m-0">
                Yêu cầu định danh tài khoản
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 bg-amber-50 rounded-[16px] text-xs text-amber-900 leading-relaxed mb-5 border border-amber-200/60">
            <div className="flex items-center gap-2 font-bold mb-1 text-amber-950">
              <ShieldAlert size={16} className="text-amber-600 shrink-0" />
              <span>Chưa hoàn tất eKYC định danh</span>
            </div>
            Theo quy định đảm bảo tính pháp lý và an toàn giao dịch trên sàn TrustSim, chủ tài khoản cần hoàn tất bước <strong>xác thực danh tính (eKYC)</strong> trước khi tạo phiên đấu giá công khai.
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
              className="px-5 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Xác thực danh tính ngay</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Next Step Validation
  const handleNext = () => {
    if (step === 1) {
      if (!selectedSim) {
        addToast({
          type: "warning",
          title: "Chưa chọn số SIM",
          message: "Vui lòng chọn một số SIM đã được xác thực chính chủ để tiếp tục.",
        });
        return;
      }
    }

    if (step === 2) {
      if (startingPrice <= 0) {
        addToast({
          type: "error",
          title: "Giá không hợp lệ",
          message: "Giá khởi điểm phải lớn hơn 0 ₫.",
        });
        return;
      }
      if (auctionType === AuctionTypeEnum.DUTCH) {
        if (!reservePrice || reservePrice <= 0) {
          addToast({
            type: "error",
            title: "Giá sàn chưa hợp lệ",
            message: "Đấu giá Hà Lan bắt buộc phải thiết lập giá sàn lớn hơn 0 ₫.",
          });
          return;
        }
        if (reservePrice > startingPrice) {
          addToast({
            type: "error",
            title: "Giá sàn vượt giá khởi điểm",
            message: "Trong đấu giá hạ giá tự động, giá sàn (Reserve Price) phải nhỏ hơn hoặc bằng giá khởi điểm.",
          });
          return;
        }
      }
      if (auctionType === AuctionTypeEnum.ENGLISH && reservePrice > 0 && reservePrice < startingPrice) {
        addToast({
          type: "error",
          title: "Giá bảo lưu không hợp lệ",
          message: "Giá kỳ vọng bảo lưu (Reserve Price) phải lớn hơn hoặc bằng giá khởi điểm.",
        });
        return;
      }
    }

    if (step === 3) {
      if (auctionType === AuctionTypeEnum.ENGLISH && minimumBidIncrement <= 0) {
        addToast({
          type: "error",
          title: "Bước giá không hợp lệ",
          message: "Bước giá tối thiểu của phiên đấu giá kiểu Anh phải lớn hơn 0 ₫.",
        });
        return;
      }
      if (auctionType === AuctionTypeEnum.DUTCH && dutchDecreaseAmount <= 0) {
        addToast({
          type: "error",
          title: "Mức giảm không hợp lệ",
          message: "Mức giảm giá mỗi chu kỳ phải lớn hơn 0 ₫.",
        });
        return;
      }
    }

    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit Auction to API
  const handleSubmit = async () => {
    if (!selectedSim) {
      addToast({ type: "error", title: "Lỗi", message: "Chưa chọn SIM đấu giá." });
      return;
    }

    // Tính toán thời gian
    const now = Date.now();
    let startAtDate: Date;
    if (startPreset === "0") {
      startAtDate = new Date(now + 60 * 1000); // 1 phút sau để kịp đồng bộ hệ thống
    } else if (startPreset === "custom" && customStartAt) {
      startAtDate = new Date(customStartAt);
    } else {
      const delayMin = Number(startPreset) || 15;
      startAtDate = new Date(now + delayMin * 60 * 1000);
    }

    const regStartDate = new Date(now - 60 * 1000); // Cho phép đăng ký ngay từ thời điểm tạo
    const regEndDate = new Date(startAtDate.getTime()); // Kết thúc đăng ký lúc phiên bắt đầu
    const endAtDate = new Date(startAtDate.getTime() + durationHours * 3600 * 1000);

    // Validate payload against centralized validator
    const valRes = auctionValidators.validateCreateAuction({
      simNumberId: selectedSim.id,
      startingPrice: Number(startingPrice),
      reservePrice: reservePrice > 0 ? Number(reservePrice) : undefined,
      auctionType: Number(auctionType),
      registrationStartAt: regStartDate,
      registrationEndAt: regEndDate,
      startAt: startAtDate,
      endAt: endAtDate,
    });

    if (!valRes.isValid) {
      addToast({
        type: "error",
        title: "Thiết lập chưa hợp lệ",
        message: valRes.error || "Vui lòng kiểm tra lại thời gian và mức giá.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateAuctionPayload = {
        simNumberId: selectedSim.id,
        auctionType: Number(auctionType),
        startingPrice: Number(startingPrice),
        reservePrice: reservePrice > 0 ? Number(reservePrice) : undefined,
        depositAmount: depositAmount > 0 ? Number(depositAmount) : undefined,
        startAt: startAtDate.toISOString(),
        endAt: endAtDate.toISOString(),
        registrationStartAt: regStartDate.toISOString(),
        registrationEndAt: regEndDate.toISOString(),
        // Payment Grace Period
        paymentGracePeriodHours: Math.max(1, gracePeriodHours),
        paymentGracePeriodMinutes: gracePeriodHours * 60,
        // English Auction Specifics
        minimumBidIncrement:
          auctionType === AuctionTypeEnum.ENGLISH ? Number(minimumBidIncrement) : undefined,
        maxStepMultiplier:
          auctionType === AuctionTypeEnum.ENGLISH ? Number(maxStepMultiplier) : undefined,
        extensionThresholdSeconds:
          auctionType === AuctionTypeEnum.ENGLISH ? Number(extensionThresholdSeconds) : 0,
        extensionDurationSeconds:
          auctionType === AuctionTypeEnum.ENGLISH ? Number(extensionDurationSeconds) : 0,
        maximumExtensionCount:
          auctionType === AuctionTypeEnum.ENGLISH ? Number(maximumExtensionCount) : 0,
        maxSnipeExtensionsPerParticipant:
          auctionType === AuctionTypeEnum.ENGLISH ? Number(maxSnipeExtensionsPerParticipant) : 0,
        // Anti-shill & Runner-up
        marginPercentage: Number(marginPercentage),
        maxPriceGapRatioForRunnerUp: Number(maxPriceGapRatioForRunnerUp),
        minimumUniqueBiddersForRunnerUp: Number(minimumUniqueBiddersForRunnerUp),
        requireSellerApprovalForRunnerUp: requireSellerApprovalForRunnerUp,
        // Dutch Auction Specifics
        dutchDecreaseAmount:
          auctionType === AuctionTypeEnum.DUTCH ? Number(dutchDecreaseAmount) : undefined,
        dutchDecreaseIntervalSeconds:
          auctionType === AuctionTypeEnum.DUTCH ? Number(dutchDecreaseIntervalSeconds) : undefined,
      };

      const result = await auctionService.createAuction(payload);
      addToast({
        type: "success",
        title: "Khởi tạo phiên đấu giá thành công",
        message: `Mã phiên: ${result?.auctionCode || "Mới"} cho SIM ${selectedSim.simNumber} đã được đẩy vào hàng đợi tự động.`,
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-[24px] w-full max-w-[700px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[94vh] animate-fade-up">
        {/* ── 1. Header ── */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-[#001743] flex items-center justify-center p-1.5 shadow-sm">
              <img src="/logo/S-White-Logo.png" alt="TrustSIM" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-[#001743] tracking-tight m-0">
                  Khởi Tạo Phiên Đấu Giá SIM
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  Escrow Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
                Thiết lập quy tắc niêm yết, quỹ ký quỹ an toàn & bảo vệ giao dịch 3 bên
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── 2. Stepper Track ── */}
        <div className="px-6 sm:px-10 pt-4 pb-2.5 bg-slate-50/60 border-b border-slate-100 shrink-0">
          <div className="relative">
            <div className="absolute top-4 left-4 right-4 h-1 bg-slate-200/80 rounded-full" />
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

            <div className="relative flex justify-between">
              {[
                { num: 1, label: "Chọn SIM & Mô hình" },
                { num: 2, label: "Định giá & Ký quỹ" },
                { num: 3, label: "Quy tắc & Bù giờ" },
                { num: 4, label: "Lịch & Niêm phong" },
              ].map((s) => {
                const isActive = step === s.num;
                const isCompleted = step > s.num;
                return (
                  <div key={s.num} className="flex flex-col items-center">
                    <button
                      type="button"
                      disabled={s.num > step}
                      onClick={() => setStep(s.num)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 z-10 cursor-pointer ${isActive
                        ? "bg-[#001743] text-white ring-4 ring-[#001743]/15 shadow-md scale-105"
                        : isCompleted
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white border-2 border-slate-300 text-slate-400 cursor-not-allowed"
                        }`}
                    >
                      {isCompleted ? <Check size={14} strokeWidth={2.5} /> : s.num}
                    </button>
                    <span
                      className={`text-[11px] mt-1.5 transition-colors whitespace-nowrap ${isActive
                        ? "font-extrabold text-[#001743]"
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

        {/* ── 3. Step Content Area ── */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* =========================================================================
              BƯỚC 1: CHỌN SIM ĐÃ XÁC THỰC & HÌNH THỨC ĐẤU GIÁ
          ========================================================================= */}
          {step === 1 && (
            <div className="space-y-5">
              {/* PHẦN 1.1: BỘ CHỌN SỐ SIM ĐÃ XÁC THỰC */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-[#001743] text-xs flex items-center gap-1.5">
                    <Smartphone size={15} className="text-[#001743]" />
                    <span>Số SIM đưa lên sàn đấu giá</span>
                    <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Chỉ hỗ trợ SIM đã <strong>xác thực chính chủ</strong>
                  </span>
                </div>

                {loadingSims ? (
                  <div className="p-5 border border-slate-200 rounded-[18px] bg-slate-50 flex items-center justify-center gap-2 text-slate-500">
                    <Loader2 size={16} className="animate-spin text-[#001743]" />
                    <span>Đang kiểm tra kho SIM đã xác thực của bạn...</span>
                  </div>
                ) : verifiedEligibleSims.length === 0 ? (
                  /* EMPTY STATE KHI CHƯA CÓ SIM XÁC THỰC */
                  <div className="p-5 rounded-[18px] border-2 border-dashed border-amber-300 bg-amber-50/60 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#001743] text-sm mb-1">
                        Chưa có SIM nào hoàn tất xác thực chính chủ
                      </h4>
                      <p className="text-slate-600 text-[11px] max-w-[460px] mx-auto leading-relaxed">
                        Theo quy định viễn thông, bạn cần xác thực mã SMS OTP và đối soát quyền sở hữu với nhà mạng trước khi mở phiên đấu giá công khai.
                      </p>
                    </div>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onNavigateToVerifySim) onNavigateToVerifySim();
                        }}
                        className="px-4 py-2 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1.5"
                      >
                        <ShieldCheck size={14} />
                        <span>Xác thực quyền sở hữu SIM ngay</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* SIM HERO CARD PREVIEW & PICKER */
                  <div className="space-y-2">
                    {/* Selected SIM Physical Card Display */}
                    {selectedSim && (
                      <div
                        style={{
                          position: "relative",
                          padding: "1px",
                          borderRadius: "16px",
                          background:
                            "linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(234, 179, 8, 0.5) 100%)",
                          boxShadow: "0 10px 24px -6px rgba(0, 23, 67, 0.25)",
                        }}
                      >
                        <div
                          style={{
                            background:
                              "linear-gradient(145deg, #010A1A 0%, #00122E 60%, #010B1B 100%)",
                            borderRadius: "15px",
                            padding: "16px 20px",
                          }}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white"
                        >
                          <div className="flex items-center gap-3.5">
                            <SimMicrochip />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                  <CheckCircle2 size={11} />
                                  <span>Đã xác thực chính chủ</span>
                                </span>
                                <span className="text-[11px] text-slate-300 font-medium">
                                  {selectedSim.carrier}
                                </span>
                              </div>
                              <div className="font-mono font-black text-xl sm:text-2xl tracking-wider text-yellow-400 leading-none">
                                {selectedSim.simNumber}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1">
                                {selectedSim.formatRhythmName ? (
                                  <span className="text-amber-200">
                                    Thế số: {selectedSim.formatRhythmName} •{" "}
                                  </span>
                                ) : null}
                                <span>Giá gốc: {formatVND(selectedSim.estimatedValue || 0)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Switch Button */}
                          {verifiedEligibleSims.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setIsSimPickerOpen(!isSimPickerOpen)}
                              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all self-start sm:self-center shrink-0 flex items-center gap-1.5"
                            >
                              <span>Đổi SIM ({verifiedEligibleSims.length})</span>
                              <ChevronDown
                                size={14}
                                className={`transition-transform ${isSimPickerOpen ? "rotate-180" : ""}`}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Expandable SIM Listbox Picker */}
                    {isSimPickerOpen && (
                      <div className="p-2 border border-slate-200 rounded-[16px] bg-slate-50 space-y-1.5 max-h-48 overflow-y-auto animate-fade-down">
                        <div className="text-[11px] font-bold text-slate-500 px-2 py-1">
                          Chọn số SIM trong kho đã đối soát:
                        </div>
                        {verifiedEligibleSims.map((s) => {
                          const isSelected = selectedSim?.id === s.id;
                          return (
                            <div
                              key={s.id}
                              onClick={() => handleSelectSim(s)}
                              className={`p-2.5 rounded-[12px] flex items-center justify-between cursor-pointer transition-all ${isSelected
                                ? "bg-[#001743] text-white shadow-sm"
                                : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/80"
                                }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: getCarrierColor(s.carrier) }}
                                />
                                <div>
                                  <span className="font-mono font-bold text-xs">{s.simNumber}</span>
                                  <span className="text-[11px] ml-2 opacity-80">({s.carrier})</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px]">
                                  {formatVND(s.estimatedValue || 0)}
                                </span>
                                {isSelected && <Check size={14} className="text-yellow-400" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PHẦN 1.2: CHỌN MÔ HÌNH ĐẤU GIÁ */}
              <div className="pt-1">
                <div className="mb-2">
                  <h4 className="text-sm font-bold text-[#001743] mb-0.5">
                    Chọn loại hình đấu giá
                  </h4>
                  <p className="text-slate-500 text-xs">
                    Mỗi hình thức sở hữu thuật toán khớp giá và cơ chế phân phối riêng biệt.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* THẺ 1: ĐẤU GIÁ TĂNG GIÁ CÔNG KHAI (ENGLISH) */}
                  <div
                    onClick={() => {
                      setAuctionType(AuctionTypeEnum.ENGLISH);
                      setReservePrice(Math.round(startingPrice * 1.2));
                    }}
                    className={`relative p-4 rounded-[18px] border-2 cursor-pointer transition-all duration-200 overflow-hidden flex flex-col justify-between ${auctionType === AuctionTypeEnum.ENGLISH
                      ? "border-[#001743] bg-gradient-to-b from-blue-50/50 to-white shadow-md -translate-y-0.5"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-extrabold text-[#001743] bg-blue-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Flame size={12} className="text-amber-500" />
                          <span>Đấu giá kiểu Anh (Tăng dần)</span>
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${auctionType === AuctionTypeEnum.ENGLISH
                            ? "border-[#001743] bg-[#001743]"
                            : "border-slate-300"
                            }`}
                        >
                          {auctionType === AuctionTypeEnum.ENGLISH && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>

                      <h5 className="text-sm font-extrabold text-[#001743] mb-1">
                        English Auction (Tăng giá cạnh tranh)
                      </h5>
                      <p className="text-slate-600 text-xs leading-relaxed mb-3">
                        Người tham gia trả giá tăng theo bước. Hết thời gian, người trả giá hợp lệ cao nhất sẽ trở thành người trúng đấu giá.
                      </p>
                    </div>

                    {/* Visual Curve Chart */}
                    <div className="h-14 w-full rounded-[10px] bg-slate-50 p-2 flex flex-col justify-between border border-slate-100">
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Khởi điểm</span>
                        <span className="text-[#001743] font-bold">Cao nhất thắng ↗</span>
                      </div>
                      <svg viewBox="0 0 200 35" className="w-full h-6 overflow-visible">
                        <defs>
                          <linearGradient id="gradEnglishWiz" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#93C5FD" />
                            <stop offset="100%" stopColor="#001743" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 5 30 Q 60 28, 100 15 T 195 4"
                          fill="none"
                          stroke="url(#gradEnglishWiz)"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <circle cx="195" cy="4" r="3.5" fill="#001743" />
                      </svg>
                    </div>

                    <div className="mt-2 text-[10px] text-blue-900 font-medium bg-blue-50/70 p-1.5 rounded-[8px]">
                      ✓ Tích hợp Anti-Sniping bù giờ & cơ chế xét duyệt Á quân.
                    </div>
                  </div>

                  {/* THẺ 2: ĐẤU GIÁ HẠ GIÁ TỰ ĐỘNG (DUTCH) */}
                  <div
                    onClick={() => {
                      setAuctionType(AuctionTypeEnum.DUTCH);
                      setReservePrice(Math.round(startingPrice * 0.6));
                    }}
                    className={`relative p-4 rounded-[18px] border-2 cursor-pointer transition-all duration-200 overflow-hidden flex flex-col justify-between ${auctionType === AuctionTypeEnum.DUTCH
                      ? "border-[#001743] bg-gradient-to-b from-amber-50/50 to-white shadow-md -translate-y-0.5"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Zap size={12} className="text-amber-600" />
                          <span>Đấu giá kiểu Hà Lan (Hạ dần)</span>
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${auctionType === AuctionTypeEnum.DUTCH
                            ? "border-[#001743] bg-[#001743]"
                            : "border-slate-300"
                            }`}
                        >
                          {auctionType === AuctionTypeEnum.DUTCH && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>

                      <h5 className="text-sm font-extrabold text-[#001743] mb-1">
                        Dutch Auction (Hạ giá tức thì)
                      </h5>
                      <p className="text-slate-600 text-xs leading-relaxed mb-3">
                        Giá khởi điểm ở mức cao rồi tự động giảm đều theo từng chu kỳ. Người đầu tiên nhấn chấp nhận mua sẽ chốt giao dịch ngay.
                      </p>
                    </div>

                    {/* Visual Descending Stairs Chart */}
                    <div className="h-14 w-full rounded-[10px] bg-slate-50 p-2 flex flex-col justify-between border border-slate-100">
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>Giá mở bán</span>
                        <span className="text-amber-700 font-bold">Chốt giá khớp ngay ⚡</span>
                      </div>
                      <svg viewBox="0 0 200 35" className="w-full h-6 overflow-visible">
                        <defs>
                          <linearGradient id="gradDutchWiz" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#B45309" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 5 4 L 45 4 L 45 12 L 95 12 L 95 20 L 145 20 L 145 28 L 195 28"
                          fill="none"
                          stroke="url(#gradDutchWiz)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle cx="145" cy="20" r="3.5" fill="#B45309" />
                      </svg>
                    </div>

                    <div className="mt-2 text-[10px] text-amber-900 font-medium bg-amber-50/70 p-1.5 rounded-[8px]">
                      ⚡ Thanh khoản nhanh chóng, người mua không phải chờ đợi hết phiên.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              BƯỚC 2: ĐỊNH GIÁ & QUỸ KÝ QUỸ (TÍCH HỢP AI)
          ========================================================================= */}
          {step === 2 && (
            <div className="space-y-4">
              {/* AI Valuation Assistant Card */}
              <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white rounded-[18px] border border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center text-[#E4011E] shrink-0 border border-slate-100">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-[#001743]">
                      Trợ lý AI Thẩm Định Giá Số Đẹp
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Phân tích nhịp điệu phong thủy, độ hiếm viễn thông và đề xuất mức giá thanh khoản tối ưu.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRequestAiValuation}
                  disabled={loadingAi || !selectedSim}
                  className="px-4 py-2 bg-white border border-slate-200 hover:border-[#001743] text-[#001743] rounded-full text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {loadingAi ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-[#001743]" />
                      <span>Đang phân tích...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} className="text-[#E4011E]" />
                      <span>Thẩm định với AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* AI Recommendation Result Box */}
              {aiValuation && (
                <div className="p-3.5 bg-blue-50 rounded-[16px] border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-fade-in">
                  <div>
                    <span className="text-slate-600 font-medium">AI đề xuất mức giá: </span>
                    <strong className="text-[#001743] font-mono text-sm">
                      {formatVND(aiValuation.suggestedPrice || 0)}
                    </strong>
                    <span className="text-[11px] text-slate-500 ml-2">
                      ({aiValuation.detectedRhythmName || "SIM VIP"})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyAiPrice}
                    className="px-3.5 py-1.5 bg-[#001743] text-white rounded-full text-[11px] font-bold hover:bg-[#00266B] transition-colors self-start sm:self-center shrink-0 shadow-xs"
                  >
                    Áp dụng mức giá AI
                  </button>
                </div>
              )}

              {/* Starting Price Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-[#001743] text-xs">
                    {auctionType === AuctionTypeEnum.ENGLISH
                      ? "Giá khởi điểm (Starting Price)"
                      : "Giá mở bán cao nhất (Peak Price)"}{" "}
                    <span className="text-rose-600">*</span>
                  </label>
                  <span className="font-mono text-xs font-bold text-[#001743]">
                    {formatVND(startingPrice)}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={100_000}
                    step={100_000}
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(Number(e.target.value))}
                    className="w-full text-sm p-3 border border-slate-200 rounded-[14px] font-mono font-bold text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    VNĐ
                  </span>
                </div>

                {/* Quick Add Pills */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[11px] text-slate-400">Cộng nhanh:</span>
                  {[
                    { label: "+1 Triệu", val: 1_000_000 },
                    { label: "+5 Triệu", val: 5_000_000 },
                    { label: "+10 Triệu", val: 10_000_000 },
                    { label: "+50 Triệu", val: 50_000_000 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => handleQuickAdd(p.val)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-full text-[11px] font-semibold transition-all"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reserve Price & Deposit Amount Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Reserve Price */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#001743] text-xs">
                      {auctionType === AuctionTypeEnum.ENGLISH
                        ? "Giá kỳ vọng bảo lưu"
                        : "Giá sàn dừng giảm *"}{" "}
                      {auctionType === AuctionTypeEnum.DUTCH && (
                        <span className="text-rose-600">*</span>
                      )}
                    </label>
                  </div>
                  <input
                    type="number"
                    min={100_000}
                    step={500_000}
                    value={reservePrice}
                    onChange={(e) => setReservePrice(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-[12px] font-mono font-bold text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {formatVND(reservePrice)}
                  </span>
                </div>

                {/* Deposit Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#001743] text-xs">
                      Tiền đặt cọc tham gia <span className="text-rose-600">*</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={100_000}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-[12px] font-mono font-bold text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
                  />
                  <div className="flex items-center justify-between mt-0.5 text-[10px] text-slate-400">
                    <span>{formatVND(depositAmount)}</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickDeposit(0.05)}
                        className="hover:text-[#001743] underline"
                      >
                        5%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDeposit(0.1)}
                        className="hover:text-[#001743] underline"
                      >
                        10%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDeposit(0.2)}
                        className="hover:text-[#001743] underline"
                      >
                        20%
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Escrow Security Banner */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-[14px] flex items-center gap-2.5 text-xs text-emerald-950">
                <ShieldCheck size={18} className="text-emerald-700 shrink-0" />
                <span>
                  Tiền cọc của người tham gia sẽ được khóa an toàn trong <strong>Quỹ ký quỹ</strong> của TrustSim. Sau khi kết thúc phiên, hệ thống sẽ hoàn cọc tự động cho những người không trúng đấu giá.
                </span>
              </div>
            </div>
          )}

          {/* =========================================================================
              BƯỚC 3: QUY TẮC VẬN HÀNH & ANTI-SNIPING
          ========================================================================= */}
          {step === 3 && (
            <div className="space-y-4">
              {/* QUY TẮC DÀNH CHO ĐẤU GIÁ KIỂU ANH */}
              {auctionType === AuctionTypeEnum.ENGLISH && (
                <div className="space-y-4">
                  {/* Minimum Bid Increment & Step Multiplier N */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-[#001743] mb-1 text-xs">
                        Bước giá tối thiểu (Increment) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        min={50_000}
                        step={100_000}
                        value={minimumBidIncrement}
                        onChange={(e) => setMinimumBidIncrement(Number(e.target.value))}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-[12px] font-mono font-bold text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {formatVND(minimumBidIncrement)}
                      </span>
                    </div>

                    <div>
                      <label className="block font-bold text-[#001743] mb-1 text-xs">
                        Giới hạn bước nhảy tối đa ($N$)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={maxStepMultiplier}
                        onChange={(e) => setMaxStepMultiplier(Number(e.target.value))}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-[12px] font-mono font-bold text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Tối đa {maxStepMultiplier} bước / lần trả (Chống troll bid)
                      </span>
                    </div>
                  </div>

                  {/* Anti-Sniping Engine Settings */}
                  <div className="p-4 bg-slate-50 rounded-[18px] border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-amber-500" />
                        <span className="font-extrabold text-[#001743] text-xs">
                          Cơ chế Anti-Sniping (Bảo vệ phút chót)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Luôn kích hoạt
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Ngăn chặn các phần mềm tự động bắn tỉa ở những giây cuối cùng. Khi có lượt trả giá hợp lệ trong ngưỡng kết thúc, phiên sẽ tự động được gia hạn thêm.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-[11px]">
                      <div>
                        <span className="text-slate-500 block mb-1">Ngưỡng kích hoạt:</span>
                        <select
                          value={extensionThresholdSeconds}
                          onChange={(e) => setExtensionThresholdSeconds(Number(e.target.value))}
                          className="w-full p-2 border border-slate-200 rounded-[10px] bg-white font-semibold text-xs text-[#001743]"
                        >
                          <option value="30">30 giây cuối</option>
                          <option value="60">1 phút cuối</option>
                          <option value="120">2 phút cuối</option>
                          <option value="180">3 phút cuối</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-slate-500 block mb-1">Thời gian gia hạn:</span>
                        <select
                          value={extensionDurationSeconds}
                          onChange={(e) => setExtensionDurationSeconds(Number(e.target.value))}
                          className="w-full p-2 border border-slate-200 rounded-[10px] bg-white font-semibold text-xs text-[#001743]"
                        >
                          <option value="30">+30 giây</option>
                          <option value="60">+1 phút</option>
                          <option value="180">+3 phút</option>
                          <option value="300">+5 phút</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-slate-500 block mb-1">Bù giờ tối đa phiên:</span>
                        <select
                          value={maximumExtensionCount}
                          onChange={(e) => setMaximumExtensionCount(Number(e.target.value))}
                          className="w-full p-2 border border-slate-200 rounded-[10px] bg-white font-semibold text-xs text-[#001743]"
                        >
                          <option value="3">3 lần</option>
                          <option value="5">5 lần</option>
                          <option value="10">10 lần</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-slate-500 block mb-1">Bù giờ / Bidder:</span>
                        <select
                          value={maxSnipeExtensionsPerParticipant}
                          onChange={(e) =>
                            setMaxSnipeExtensionsPerParticipant(Number(e.target.value))
                          }
                          className="w-full p-2 border border-slate-200 rounded-[10px] bg-white font-semibold text-xs text-[#001743]"
                        >
                          <option value="2">2 lần</option>
                          <option value="3">3 lần</option>
                          <option value="5">5 lần</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Runner-Up & Anti-Shill Rules */}
                  <div className="p-4 bg-slate-50 rounded-[18px] border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scale size={16} className="text-[#001743]" />
                        <span className="font-extrabold text-[#001743] text-xs">
                          Chính sách Á Quân & Chống Quân Xanh Quân Đỏ (Anti-Shill)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#001743]">
                        Bảo vệ thanh khoản
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Nếu người thắng cuộc từ bỏ hoặc không thanh toán đúng hạn, quyền mua sẽ tự động chuyển cho Người về nhì (Á quân) với mức giá họ đã đặt, tránh việc phiên đấu giá bị hủy vô hiệu.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                      {/* Cấu hình 1: Đấu giá viên tối thiểu */}
                      <div className="p-3 bg-white rounded-[14px] border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-800 text-xs">Đấu giá viên tối thiểu</span>
                            <span className="font-mono text-[11px] font-bold text-[#001743] bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 border border-slate-200/60">
                              ≥ {minimumUniqueBiddersForRunnerUp} Bidders
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-normal">
                            Số người tham gia trả giá độc lập để kích hoạt chuyển nhượng Á quân.
                          </p>
                        </div>
                        <select
                          value={minimumUniqueBiddersForRunnerUp}
                          onChange={(e) => setMinimumUniqueBiddersForRunnerUp(Number(e.target.value))}
                          className="w-full p-2 border border-slate-200 rounded-[10px] bg-slate-50/70 font-semibold text-xs text-[#001743] focus:bg-white focus:border-[#001743] focus:outline-none transition-all cursor-pointer"
                        >
                          <option value="2">2 Bidders (Tiêu chuẩn đề xuất)</option>
                          <option value="3">3 Bidders (An toàn cao)</option>
                          <option value="5">5 Bidders (Chặt chẽ tối đa)</option>
                        </select>
                      </div>

                      {/* Cấu hình 2: Biên độ giá Á quân (Gap Ratio) */}
                      <div className="p-3 bg-white rounded-[14px] border border-slate-200/90 shadow-2xs space-y-2 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-800 text-xs">Biên độ giá Á quân</span>
                            <span className="font-mono text-[11px] font-bold text-[#001743] bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 border border-slate-200/60">
                              ≤ {maxPriceGapRatioForRunnerUp}x
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-normal">
                            Giới hạn chênh lệch tối đa so với giá chốt phiên của người về nhất.
                          </p>
                        </div>
                        <select
                          value={maxPriceGapRatioForRunnerUp}
                          onChange={(e) => setMaxPriceGapRatioForRunnerUp(Number(e.target.value))}
                          className="w-full p-2 border border-slate-200 rounded-[10px] bg-slate-50/70 font-semibold text-xs text-[#001743] focus:bg-white focus:border-[#001743] focus:outline-none transition-all cursor-pointer"
                        >
                          <option value="1.2">≤ 1.2x (Chênh lệch dưới 20%)</option>
                          <option value="1.5">≤ 1.5x giá chốt (Mặc định TrustSim)</option>
                          <option value="2.0">≤ 2.0x giá chốt (Linh hoạt tối đa)</option>
                        </select>
                      </div>
                    </div>

                    {/* Explainer Banner: Minh họa cơ chế chống Quân Xanh / Quân Đỏ */}
                    <div className="p-3 bg-blue-50/70 rounded-[14px] border border-blue-200/60 flex items-start gap-2.5 text-xs text-blue-950">
                      <Info size={16} className="text-blue-700 shrink-0 mt-0.5" />
                      <div className="leading-relaxed text-[11px]">
                        <span className="font-bold text-[#001743]">Nguyên lý bảo vệ thanh khoản:</span>{" "}
                        Nếu người thắng bỏ cọc, hệ thống chỉ xét chuyển nhượng cho Á quân khi có từ{" "}
                        <strong className="text-[#001743] font-mono">{minimumUniqueBiddersForRunnerUp} người trả giá độc lập</strong> và mức giá Á quân đạt{" "}
                        <strong className="text-[#001743] font-mono">≥ Giá chốt ÷ {maxPriceGapRatioForRunnerUp}</strong> (ngăn chặn hành vi tự thổi giá rồi bỏ cọc để mua rẻ).
                      </div>
                    </div>

                    <div className="pt-0.5">
                      <label
                        htmlFor="reqSellerApproval"
                        className="flex items-start gap-2.5 p-3 rounded-[12px] bg-white border border-slate-200/90 hover:border-[#001743]/40 cursor-pointer transition-all shadow-2xs group"
                      >
                        <input
                          type="checkbox"
                          id="reqSellerApproval"
                          checked={requireSellerApprovalForRunnerUp}
                          onChange={(e) => setRequireSellerApprovalForRunnerUp(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded text-[#001743] focus:ring-[#001743] cursor-pointer shrink-0 accent-[#001743]"
                        />
                        <div className="text-xs text-slate-700 leading-snug">
                          <span className="font-bold text-[#001743] group-hover:text-[#00266B] transition-colors block">
                            Yêu cầu Người bán xác nhận đồng ý trước khi chuyển nhượng
                          </span>
                          <span className="text-slate-500 block text-[11px] mt-0.5">
                            Nếu người thắng từ bỏ, bạn sẽ nhận được thông báo để phê duyệt chuyển quyền mua cho Á quân hoặc hủy phiên để nhận bồi thường tiền cọc.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* QUY TẮC DÀNH CHO ĐẤU GIÁ KIỂU HÀ LAN */}
              {auctionType === AuctionTypeEnum.DUTCH && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-[#001743] mb-1 text-xs">
                        Số tiền hạ mỗi nấc (VNĐ) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        min={50_000}
                        step={100_000}
                        value={dutchDecreaseAmount}
                        onChange={(e) => setDutchDecreaseAmount(Number(e.target.value))}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-[12px] font-mono font-bold text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {formatVND(dutchDecreaseAmount)} / chu kỳ
                      </span>
                    </div>

                    <div>
                      <label className="block font-bold text-[#001743] mb-1 text-xs">
                        Chu kỳ giảm giá (Interval) <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={dutchDecreaseIntervalSeconds}
                        onChange={(e) =>
                          setDutchDecreaseIntervalSeconds(Number(e.target.value))
                        }
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-[12px] bg-white font-semibold text-[#001743] focus:border-[#001743] focus:outline-none"
                      >
                        <option value="30">Mỗi 30 giây (Siêu tốc)</option>
                        <option value="60">Mỗi 1 phút</option>
                        <option value="120">Mỗi 2 phút</option>
                        <option value="300">Mỗi 5 phút</option>
                        <option value="600">Mỗi 10 phút</option>
                        <option value="1800">Mỗi 30 phút</option>
                      </select>
                    </div>
                  </div>

                  {/* Dutch Live Simulation Projection Box */}
                  {dutchProjection && (
                    <div className="p-4 bg-amber-50 rounded-[18px] border border-amber-200 space-y-2 animate-fade-in">
                      <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                        <Clock size={16} />
                        <span>Dự phóng thời gian diễn ra phiên đấu giá Hà Lan:</span>
                      </div>
                      <div className="text-xs text-amber-950 leading-relaxed font-medium">
                        💡 Phiên sẽ diễn ra trong tối đa{" "}
                        <strong className="text-amber-900">{dutchProjection.timeStr}</strong> qua{" "}
                        <strong>{dutchProjection.steps} nấc giảm</strong> (từ mức khởi điểm{" "}
                        <strong>{formatVND(startingPrice)}</strong> về sàn bảo lưu{" "}
                        <strong>{formatVND(reservePrice)}</strong>).
                      </div>
                      <div className="text-[11px] text-amber-800">
                        Khi giá chạm mức sàn mà không có ai chốt mua, hệ thống sẽ tự động đóng phiên để bảo toàn giá trị SIM.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Grace Period Setting (Hạn thanh toán) */}
              <div className="p-4 bg-slate-50 rounded-[18px] border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#001743] text-xs">
                    Thời hạn ân hạn thanh toán sau khi thắng phiên (Grace Period)
                  </label>
                  <span className="font-mono font-bold text-xs text-[#001743]">
                    {gracePeriodHours} Giờ
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "1 Giờ (Gấp)", val: 1 },
                    { label: "12 Giờ", val: 12 },
                    { label: "24 Giờ (Chuẩn)", val: 24 },
                    { label: "48 Giờ", val: 48 },
                  ].map((g) => (
                    <button
                      key={g.val}
                      type="button"
                      onClick={() => setGracePeriodHours(g.val)}
                      className={`p-2 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${gracePeriodHours === g.val
                        ? "bg-[#001743] text-white shadow-xs"
                        : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Nếu quá thời hạn này người thắng không thanh toán nốt số tiền, tiền cọc sẽ bị tịch thu bồi thường cho bạn và sàn.
                </p>
              </div>
            </div>
          )}

          {/* =========================================================================
              BƯỚC 4: LỊCH MỞ PHIÊN & TỔNG KẾT NIÊM PHONG
          ========================================================================= */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Lịch mở phiên */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-[#001743] mb-1.5 text-xs">
                    Thời điểm bắt đầu mở phiên
                  </label>
                  <select
                    value={startPreset}
                    onChange={(e) => setStartPreset(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-[12px] bg-white font-semibold text-[#001743] focus:border-[#001743] focus:outline-none"
                  >
                    <option value="0">Bắt đầu ngay sau khi tạo (~1 phút)</option>
                    <option value="15">Sau 15 phút (Chuẩn bị phòng)</option>
                    <option value="60">Sau 1 giờ</option>
                    <option value="180">Sau 3 giờ</option>
                    <option value="1440">Sau 24 giờ (Ngày mai)</option>
                    <option value="custom">Tùy chọn ngày & giờ...</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#001743] mb-1.5 text-xs">
                    Thời lượng mở tiếp nhận trả giá
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-[12px] bg-white font-semibold text-[#001743] focus:border-[#001743] focus:outline-none"
                  >
                    <option value="1">1 giờ (Flash Auction)</option>
                    <option value="6">6 giờ</option>
                    <option value="12">12 giờ</option>
                    <option value="24">24 giờ (1 ngày - Phổ biến)</option>
                    <option value="48">48 giờ (2 ngày)</option>
                    <option value="72">72 giờ (3 ngày)</option>
                  </select>
                </div>
              </div>

              {startPreset === "custom" && (
                <div className="animate-fade-in">
                  <label className="block font-bold text-[#001743] mb-1 text-xs">
                    Chọn chính xác thời điểm mở phiên:
                  </label>
                  <input
                    type="datetime-local"
                    value={customStartAt}
                    onChange={(e) => setCustomStartAt(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-[12px] bg-white font-semibold text-[#001743]"
                  />
                </div>
              )}

              {/* Tóm tắt thông số phiên đấu giá */}
              <div className="p-4 bg-slate-50 rounded-[18px] border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-extrabold text-[#001743] text-xs">
                    Bản đối soát thông số niêm yết
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-[#001743] text-white">
                    {auctionType === AuctionTypeEnum.ENGLISH
                      ? "Đấu giá kiểu Anh"
                      : "Đấu giá kiểu Hà Lan"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="text-slate-500">Số SIM niêm yết:</span>{" "}
                    <strong className="text-[#001743] font-mono">
                      {selectedSim?.simNumber}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Nhà mạng:</span>{" "}
                    <strong className="text-[#001743]">
                      {selectedSim?.carrier}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Giá khởi điểm:</span>{" "}
                    <strong className="text-[#001743] font-mono">
                      {formatVND(startingPrice)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Tiền cọc tham gia:</span>{" "}
                    <strong className="text-[#001743] font-mono">
                      {formatVND(depositAmount)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Giá bảo lưu / sàn:</span>{" "}
                    <strong className="text-[#001743] font-mono">
                      {formatVND(reservePrice)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Hạn thanh toán:</span>{" "}
                    <strong className="text-[#001743]">
                      {gracePeriodHours} giờ
                    </strong>
                  </div>

                  {auctionType === AuctionTypeEnum.ENGLISH ? (
                    <>
                      <div>
                        <span className="text-slate-500">Bước giá tối thiểu:</span>{" "}
                        <strong className="text-[#001743] font-mono">
                          {formatVND(minimumBidIncrement)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Bù giờ Anti-Sniping:</span>{" "}
                        <strong className="text-emerald-700">
                          {extensionThresholdSeconds}s cuối (+{extensionDurationSeconds}s)
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Chính sách Á quân:</span>{" "}
                        <strong className="text-[#001743]">
                          ≥{minimumUniqueBiddersForRunnerUp} Bidders (Gap ≤{maxPriceGapRatioForRunnerUp}x)
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Phê duyệt Á quân:</span>{" "}
                        <strong className="text-[#001743]">
                          {requireSellerApprovalForRunnerUp ? "Người bán duyệt" : "Khớp tự động"}
                        </strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-slate-500">Mức giảm:</span>{" "}
                        <strong className="text-[#001743] font-mono">
                          {formatVND(dutchDecreaseAmount)} / {dutchDecreaseIntervalSeconds}s
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Dự phóng thời gian:</span>{" "}
                        <strong className="text-amber-800">
                          {dutchProjection?.timeStr || "Tự động kết thúc khi chạm sàn"}
                        </strong>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Cam kết pháp lý & Escrow TrustSim */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-[18px] flex items-start gap-3 text-xs text-emerald-950 leading-relaxed">
                <ShieldCheck size={20} className="text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Cam kết bàn giao & Bảo đảm tài sản:</strong> Khi phiên được tạo, số SIM sẽ được đưa vào trạng thái bảo đảm trên sàn TrustSim. Bên Bán cam kết thực hiện thủ tục sang tên chính chủ cho người trúng đấu giá theo đúng quy trình hợp đồng 3 bên sau khi nhận xác nhận thanh toán từ Quỹ ký quỹ Escrow.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Footer Controls ── */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={step === 1 ? onClose : handlePrev}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {step === 1 ? "Hủy bỏ" : <><ArrowLeft size={14} /> Quay lại</>}
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-xs font-bold transition-all shadow-md cursor-pointer hover:shadow-lg"
            >
              <span>Tiếp tục</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !selectedSim}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#E4011E] hover:bg-[#C00119] text-white rounded-full text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang đẩy vào Delay Queue...</span>
                </>
              ) : (
                <>
                  <img
                    src="/logo/S-White-Logo.png"
                    alt="S"
                    className="w-3.5 h-3.5 object-contain"
                  />
                  <span>Xác nhận & Mở phiên đấu giá</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
