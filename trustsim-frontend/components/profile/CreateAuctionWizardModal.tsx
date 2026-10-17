"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Clock,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { OwnedSim } from "../../types/types";
import {
  auctionService,
  CreateAuctionPayload,
  AuctionTypeEnum,
  CalculateSellerDepositResultDto,
} from "@/services/auctionService";
import {
  aiValuationService,
  SimValuationDto,
} from "@/services/aiValuationService";
import {
  getMyOwnerships,
  getMySims,
  formatPhoneNumber,
  SimOwnershipDto,
} from "@/services/simService";
import { walletService } from "@/services/walletService";
import type { WalletDto } from "@/types/wallet";
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

/**
 * Ô nhập tiền tệ chuẩn định dạng Việt Nam (VND)
 * - Tự động định dạng dấu chấm phân cách hàng nghìn (100.000, 1.000.000) ngay khi gõ
 * - Bo góc vừa vặn 8px (rounded-lg), viền sắc sảo, chống AI-slop và pill-shape
 * - Có huy hiệu tiền tệ "VNĐ" bên phải
 */
function FormattedCurrencyInput({
  id,
  value,
  onChange,
  placeholder = "0",
  disabled = false,
  hasError = false,
  suffix = "VNĐ",
}: {
  id?: string;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  suffix?: string;
}) {
  const formatNumber = (num: number) => {
    if (!num || isNaN(num) || num === 0) return "";
    return num.toLocaleString("vi-VN");
  };

  const [displayValue, setDisplayValue] = useState<string>(formatNumber(value));

  useEffect(() => {
    setDisplayValue(formatNumber(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/\D/g, "");
    if (!digitsOnly) {
      setDisplayValue("");
      onChange(0);
      return;
    }
    const num = Number(digitsOnly);
    // Giới hạn an toàn 15 chữ số
    if (num > 999_999_999_999_999) return;
    setDisplayValue(num.toLocaleString("vi-VN"));
    onChange(num);
  };

  return (
    <div
      className={`group relative flex items-center w-full h-11 bg-white rounded-lg border transition-all shadow-xs ${hasError
        ? "border-rose-500 ring-2 ring-rose-500/10"
        : "border-slate-300 hover:border-slate-400 focus-within:border-[#E4011E] focus-within:ring-2 focus-within:ring-[#E4011E]/15"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
    >
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-full pl-3.5 pr-14 bg-transparent font-mono text-[15px] font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden"
      />
      <div className="absolute right-2 flex items-center pointer-events-none">
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80">
          {suffix}
        </span>
      </div>
    </div>
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
  // Tiến trình 4 bước
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  // Danh sách SIM sở hữu & SIM được chọn
  const [ownedSimList, setOwnedSimList] = useState<OwnedSim[]>([]);
  const [loadingSims, setLoadingSims] = useState(true);
  const [selectedSim, setSelectedSim] = useState<OwnedSim | null>(initialSim || null);
  const [isSimPickerOpen, setIsSimPickerOpen] = useState(false);

  // Ví cá nhân của người bán
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);

  // Mô hình đấu giá: 0 = Đấu giá giá lên (Tăng dần), 1 = Đấu giá giá xuống (Hà Lan)
  const [auctionType, setAuctionType] = useState<AuctionTypeEnum>(AuctionTypeEnum.ENGLISH);

  // Định giá & Đặt cọc
  const defaultInitialPrice = selectedSim?.estimatedValue
    ? Math.round(selectedSim.estimatedValue * 0.8)
    : 10_000_000;
  const [startingPrice, setStartingPrice] = useState<number>(defaultInitialPrice);
  const [reservePrice, setReservePrice] = useState<number>(
    auctionType === AuctionTypeEnum.DUTCH
      ? Math.round(defaultInitialPrice * 0.6)
      : Math.round(defaultInitialPrice * 1.15)
  );
  const [depositAmount, setDepositAmount] = useState<number>(1_000_000);

  // Tính toán cọc cam kết bán từ máy chủ
  const [sellerDepositCalc, setSellerDepositCalc] = useState<CalculateSellerDepositResultDto | null>(null);
  const [loadingSellerDeposit, setLoadingSellerDeposit] = useState(false);

  // Gợi ý định giá thông minh
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiValuation, setAiValuation] = useState<SimValuationDto | null>(null);

  // Quy tắc đấu giá giá lên (Tăng dần)
  const [minimumBidIncrement, setMinimumBidIncrement] = useState<number>(500_000);
  const [maxStepMultiplier, setMaxStepMultiplier] = useState<number>(10);
  const [enableAutoExtension, setEnableAutoExtension] = useState<boolean>(true);
  const [extensionThresholdSeconds, setExtensionThresholdSeconds] = useState<number>(120); // 2 phút cuối
  const [extensionDurationSeconds, setExtensionDurationSeconds] = useState<number>(300); // Bù 5 phút
  const [maximumExtensionCount, setMaximumExtensionCount] = useState<number>(5);
  const [maxSnipeExtensionsPerParticipant, setMaxSnipeExtensionsPerParticipant] = useState<number>(3);

  // Cơ chế xét duyệt người về nhì (Á quân)
  const [marginPercentage] = useState<number>(0.10);
  const [maxPriceGapRatioForRunnerUp] = useState<number>(1.50);
  const [minimumUniqueBiddersForRunnerUp] = useState<number>(2);
  const [requireSellerApprovalForRunnerUp, setRequireSellerApprovalForRunnerUp] = useState<boolean>(true);

  // Quy tắc đấu giá giá xuống (Hà Lan)
  const [dutchDecreaseAmount, setDutchDecreaseAmount] = useState<number>(500_000);
  const [dutchDecreaseIntervalSeconds, setDutchDecreaseIntervalSeconds] = useState<number>(60); // 1 phút / nấc

  // Lịch trình thời gian
  const [startPreset, setStartPreset] = useState<string>("15"); // '0' (ngay sau 1 phút), '15', '60', '180', '1440', 'custom'
  const [customStartAt, setCustomStartAt] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<number>(1440); // 24 giờ (1440 phút) mặc định
  const [gracePeriodHours, setGracePeriodHours] = useState<number>(24); // 24 giờ thanh toán

  // Định dạng tiền tệ VND
  const formatVND = (val: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(val || 0);

  // Định dạng hiển thị thời lượng phiên
  const formatDurationText = (min: number) => {
    if (min < 60) return `${min} phút (Thử nghiệm nhanh)`;
    const hours = min / 60;
    if (hours === 24) return "24 giờ (1 ngày - Tiêu chuẩn)";
    if (hours === 48) return "48 giờ (2 ngày)";
    return `${hours} giờ`;
  };

  // 1. Tải danh sách SIM sở hữu đã xác thực
  useEffect(() => {
    let isMounted = true;
    async function loadUserSims() {
      setLoadingSims(true);
      try {
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
          if (!selectedSim && mapped.length > 0) {
            const firstEligible = mapped.find(
              (s) => s.ownershipStatus === "VERIFIED_OWNER" && !s.hasActiveAuction
            );
            if (firstEligible) {
              setSelectedSim(firstEligible);
              if (firstEligible.estimatedValue > 0) {
                const base = Math.round(firstEligible.estimatedValue * 0.8);
                setStartingPrice(base);
                setReservePrice(Math.round(base * 1.15));
              }
            }
          }
        }
      } catch (err: any) {
        console.error("Không thể tải kho SIM:", err);
      } finally {
        if (isMounted) setLoadingSims(false);
      }
    }

    loadUserSims();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Tải số dư ví cá nhân
  useEffect(() => {
    let isMounted = true;
    async function loadWallet() {
      setLoadingWallet(true);
      try {
        const w = await walletService.getMyWallet();
        if (isMounted) setWallet(w);
      } catch (err) {
        console.error("Không thể tải số dư ví:", err);
      } finally {
        if (isMounted) setLoadingWallet(false);
      }
    }
    loadWallet();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Tính toán tiền cọc cam kết bán từ máy chủ
  const fetchSellerDeposit = useCallback(async (price: number) => {
    if (price <= 0) return;
    setLoadingSellerDeposit(true);
    try {
      const calc = await auctionService.calculateSellerDeposit(price);
      setSellerDepositCalc(calc);
    } catch (err) {
      console.warn("Chưa thể tính tiền cọc tự động:", err);
    } finally {
      setLoadingSellerDeposit(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (startingPrice > 0) {
        fetchSellerDeposit(startingPrice);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [startingPrice, fetchSellerDeposit]);

  // Lọc các SIM đủ điều kiện niêm yết
  const verifiedEligibleSims = useMemo(() => {
    return ownedSimList.filter(
      (s) => s.ownershipStatus === "VERIFIED_OWNER" && !s.hasActiveAuction
    );
  }, [ownedSimList]);

  // Cập nhật giá sàn / giá kỳ vọng khi chuyển đổi mô hình
  const handleAuctionTypeChange = (newType: AuctionTypeEnum) => {
    setAuctionType(newType);
    if (newType === AuctionTypeEnum.DUTCH) {
      // Đấu giá giảm dần: giá sàn phải nhỏ hơn giá khởi điểm
      setReservePrice(Math.round(startingPrice * 0.6));
    } else {
      // Đấu giá tăng dần: giá kỳ vọng lớn hơn giá khởi điểm
      setReservePrice(Math.round(startingPrice * 1.15));
    }
  };

  // Mô phỏng số bước và thời gian cho đấu giá giảm dần (Hà Lan)
  const dutchSimulation = useMemo(() => {
    if (auctionType !== AuctionTypeEnum.DUTCH) return null;
    const priceGap = Math.max(0, startingPrice - reservePrice);
    if (dutchDecreaseAmount <= 0 || priceGap <= 0) return null;
    const steps = Math.ceil(priceGap / dutchDecreaseAmount);
    const totalSeconds = steps * dutchDecreaseIntervalSeconds;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const remSeconds = totalSeconds % 60;
    const timeStr =
      totalMinutes > 0
        ? `${totalMinutes} phút${remSeconds > 0 ? ` ${remSeconds} giây` : ""}`
        : `${remSeconds} giây`;
    return { steps, totalSeconds, timeStr, priceGap };
  }, [auctionType, startingPrice, reservePrice, dutchDecreaseAmount, dutchDecreaseIntervalSeconds]);

  // Yêu cầu gợi ý định giá thông minh
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
          title: "Định giá hoàn tất",
          message: `Mức giá khuyến nghị: ${formatVND(res.suggestedPrice)} (${res.detectedRhythmName || "SIM đẹp"}).`,
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Chưa thể định giá tự động",
        message: err.message || "Vui lòng thử lại sau.",
      });
    } finally {
      setLoadingAi(false);
    }
  };

  // Áp dụng mức giá gợi ý
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
      title: "Đã áp dụng mức giá gợi ý",
      message: `Giá khởi điểm: ${formatVND(base)} • Tiền đặt cọc người tham gia: ${formatVND(Math.round(base * 0.1))}`,
    });
  };

  // Kiểm tra điều kiện định danh eKYC
  if (!isEkycVerified) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-amber-600" />
              <h3 className="text-base font-semibold text-slate-900">
                Yêu cầu định danh tài khoản
              </h3>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Theo quy định đảm bảo tính pháp lý và an toàn giao dịch trên sàn TrustSim, chủ tài khoản cần hoàn tất bước <strong>xác thực danh tính điện tử</strong> trước khi mở phiên đấu giá công khai.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Để sau
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNavigateToEkyc) onNavigateToEkyc();
              }}
              className="h-10 px-4 rounded-lg bg-[#E4011E] text-sm font-semibold text-white hover:bg-[#B80018] flex items-center gap-1.5"
            >
              <span>Xác thực danh tính ngay</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chuyển bước kế tiếp kèm kiểm tra tính hợp lệ
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
            message: "Đấu giá giảm dần bắt buộc phải có giá sàn dừng giảm lớn hơn 0 ₫.",
          });
          return;
        }
        if (reservePrice > startingPrice) {
          addToast({
            type: "error",
            title: "Giá sàn vượt giá khởi điểm",
            message: "Trong đấu giá giảm dần, mức giá sàn dừng giảm phải nhỏ hơn hoặc bằng giá khởi điểm.",
          });
          return;
        }
      }
      if (auctionType === AuctionTypeEnum.ENGLISH && reservePrice > 0 && reservePrice < startingPrice) {
        addToast({
          type: "error",
          title: "Mức giá kỳ vọng chưa hợp lệ",
          message: "Mức giá kỳ vọng tối thiểu phải lớn hơn hoặc bằng giá khởi điểm.",
        });
        return;
      }
    }

    if (step === 3) {
      if (auctionType === AuctionTypeEnum.ENGLISH) {
        if (minimumBidIncrement <= 0) {
          addToast({
            type: "error",
            title: "Bước giá không hợp lệ",
            message: "Bước giá tối thiểu mỗi lượt phải lớn hơn 0 ₫.",
          });
          return;
        }
        if (maxStepMultiplier < 1) {
          addToast({
            type: "error",
            title: "Bội số bước giá chưa hợp lệ",
            message: "Mức nhảy giá tối đa mỗi lượt phải lớn hơn hoặc bằng 1.",
          });
          return;
        }
      }
      if (auctionType === AuctionTypeEnum.DUTCH) {
        if (dutchDecreaseAmount <= 0) {
          addToast({
            type: "error",
            title: "Mức giảm chưa hợp lệ",
            message: "Mức giảm giá mỗi chu kỳ phải lớn hơn 0 ₫.",
          });
          return;
        }
        if (dutchDecreaseIntervalSeconds <= 0) {
          addToast({
            type: "error",
            title: "Chu kỳ giảm chưa hợp lệ",
            message: "Chu kỳ giảm giá phải lớn hơn 0 giây.",
          });
          return;
        }
      }
    }

    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Xác nhận tạo phiên đấu giá
  const handleSubmit = async () => {
    if (!selectedSim) {
      addToast({ type: "error", title: "Lỗi", message: "Chưa chọn SIM để đấu giá." });
      return;
    }

    // Thời gian phiên
    const now = Date.now();
    let startAtDate: Date;
    if (startPreset === "0") {
      startAtDate = new Date(now + 60 * 1000); // Mở sau 1 phút
    } else if (startPreset === "custom" && customStartAt) {
      startAtDate = new Date(customStartAt);
    } else {
      const delayMin = Number(startPreset) || 15;
      startAtDate = new Date(now + delayMin * 60 * 1000);
    }

    const regStartDate = new Date(now - 60 * 1000); // Mở đăng ký từ lúc tạo
    const regEndDate = new Date(startAtDate.getTime()); // Kết thúc đăng ký lúc phiên bắt đầu
    const endAtDate = new Date(startAtDate.getTime() + durationMinutes * 60 * 1000);

    // Kiểm tra theo bộ quy tắc máy chủ
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

    // Kiểm tra số dư ví khả dụng của người bán
    const requiredSellerDeposit = sellerDepositCalc?.sellerDepositAmount || 0;
    const currentBalance = wallet?.availableBalance ?? 0;
    if (requiredSellerDeposit > 0 && currentBalance < requiredSellerDeposit) {
      addToast({
        type: "error",
        title: "Số dư ví không đủ",
        message: `Số dư khả dụng (${formatVND(currentBalance)}) chưa đủ để tạm khóa cọc cam kết bán (${formatVND(requiredSellerDeposit)}). Vui lòng nạp thêm tiền vào ví.`,
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
        depositAmount: depositAmount >= 0 ? Number(depositAmount) : 0,
        startAt: startAtDate.toISOString(),
        endAt: endAtDate.toISOString(),
        registrationStartAt: regStartDate.toISOString(),
        registrationEndAt: regEndDate.toISOString(),
        paymentGracePeriodHours: Math.max(1, gracePeriodHours),
        paymentGracePeriodMinutes: gracePeriodHours * 60,
        // Đấu giá giá lên (Anh)
        minimumBidIncrement:
          auctionType === AuctionTypeEnum.ENGLISH ? Number(minimumBidIncrement) : undefined,
        maxStepMultiplier:
          auctionType === AuctionTypeEnum.ENGLISH ? Number(maxStepMultiplier) : undefined,
        extensionThresholdSeconds:
          auctionType === AuctionTypeEnum.ENGLISH && enableAutoExtension
            ? Number(extensionThresholdSeconds)
            : 0,
        extensionDurationSeconds:
          auctionType === AuctionTypeEnum.ENGLISH && enableAutoExtension
            ? Number(extensionDurationSeconds)
            : 0,
        maximumExtensionCount:
          auctionType === AuctionTypeEnum.ENGLISH && enableAutoExtension
            ? Number(maximumExtensionCount)
            : 0,
        maxSnipeExtensionsPerParticipant:
          auctionType === AuctionTypeEnum.ENGLISH && enableAutoExtension
            ? Number(maxSnipeExtensionsPerParticipant)
            : 0,
        // Quy tắc bảo vệ & người về nhì
        marginPercentage: Number(marginPercentage),
        maxPriceGapRatioForRunnerUp: Number(maxPriceGapRatioForRunnerUp),
        minimumUniqueBiddersForRunnerUp: Number(minimumUniqueBiddersForRunnerUp),
        requireSellerApprovalForRunnerUp: requireSellerApprovalForRunnerUp,
        // Đấu giá giá xuống (Hà Lan)
        dutchDecreaseAmount:
          auctionType === AuctionTypeEnum.DUTCH ? Number(dutchDecreaseAmount) : undefined,
        dutchDecreaseIntervalSeconds:
          auctionType === AuctionTypeEnum.DUTCH ? Number(dutchDecreaseIntervalSeconds) : undefined,
      };

      const result = await auctionService.createAuction(payload);
      addToast({
        type: "success",
        title: "Tạo phiên đấu giá thành công",
        message: `Phiên đấu giá cho số SIM ${selectedSim.simNumber} (mã: ${result?.auctionCode || "Mới"}) đã được tạo thành công.`,
      });
      onSuccess(result?.auctionCode || "Mới");
      onClose();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Không thể tạo phiên",
        message: err.message || "Đã xảy ra lỗi khi tạo phiên đấu giá. Vui lòng thử lại.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: "Số SIM & Mô hình" },
    { num: 2, label: "Giá & Đặt cọc" },
    { num: 3, label: "Quy tắc vận hành" },
    { num: 4, label: "Lịch trình & Xác nhận" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6"
    >
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* ── CỐ ĐỊNH: HEADER ── */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                Thiết lập phiên đấu giá số SIM
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#E4011E] border border-red-200">
                Bước {step}/4
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tạo phiên đấu giá minh bạch, tuân thủ quy chế sàn giao dịch TrustSim
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
            title="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* ── CỐ ĐỊNH: THANH TIẾN TRÌNH 4 BƯỚC ── */}
        <div className="px-6 pt-3 pb-2 bg-slate-50/70 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-4 gap-2">
            {stepsList.map((s) => {
              const isPast = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div key={s.num} className="flex flex-col gap-1">
                  <div
                    className={`h-1.5 rounded-full transition-colors ${isPast
                      ? "bg-[#E4011E]"
                      : isCurrent
                        ? "bg-[#E4011E]"
                        : "bg-slate-200"
                      }`}
                  />
                  <span
                    className={`text-[11px] truncate ${isCurrent
                      ? "font-semibold text-slate-900"
                      : isPast
                        ? "text-slate-600"
                        : "text-slate-400"
                      }`}
                  >
                    {s.num}. {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── NỘI DUNG CUỘN ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* ========================================================================= */}
          {/* BƯỚC 1: CHỌN SỐ SIM & MÔ HÌNH ĐẤU GIÁ */}
          {/* ========================================================================= */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Mục 1.1: Chọn số SIM */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                    <Smartphone className="size-4 text-slate-700" />
                    <span>Số SIM đưa lên đấu giá</span>
                    <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <span className="text-xs text-slate-500">
                    Chỉ áp dụng với SIM đã xác thực chính chủ
                  </span>
                </div>

                {loadingSims ? (
                  <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center gap-2 text-slate-500 text-sm">
                    <Loader2 className="size-4 animate-spin text-[#E4011E]" />
                    <span>Đang kiểm tra danh sách SIM chính chủ của bạn...</span>
                  </div>
                ) : verifiedEligibleSims.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 text-center space-y-3">
                    <div className="size-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                      <ShieldAlert className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm mb-1">
                        Chưa có số SIM nào hoàn tất xác thực chính chủ
                      </h4>
                      <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                        Bạn cần xác thực quyền sở hữu với nhà mạng qua mã tin nhắn SMS trước khi mở phiên đấu giá công khai.
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onNavigateToVerifySim) onNavigateToVerifySim();
                        }}
                        className="h-10 px-4 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <ShieldCheck className="size-4" />
                        <span>Xác thực quyền sở hữu SIM ngay</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Thẻ SIM được chọn */}
                    {selectedSim && (
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="size-11 rounded-lg bg-red-50 border border-red-200/80 flex items-center justify-center text-[#E4011E] font-bold text-xs shrink-0">
                            SIM
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xl font-bold text-slate-900">
                                {selectedSim.simNumber}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="size-3" />
                                <span>Chính chủ</span>
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>Nhà mạng: <strong className="text-slate-700">{selectedSim.carrier}</strong></span>
                              {selectedSim.formatRhythmName && (
                                <>
                                  <span>•</span>
                                  <span>Thế số: <strong className="text-slate-700">{selectedSim.formatRhythmName}</strong></span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {verifiedEligibleSims.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setIsSimPickerOpen(!isSimPickerOpen)}
                            className="h-9 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
                          >
                            <span>Đổi SIM khác</span>
                            <ChevronDown className="size-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Danh sách dropdown chọn SIM khác */}
                    {isSimPickerOpen && (
                      <div className="border border-slate-200 rounded-xl bg-white p-2 shadow-lg space-y-1 max-h-56 overflow-y-auto">
                        <div className="px-3 py-1 text-xs font-semibold text-slate-500">
                          Chọn số SIM trong kho ({verifiedEligibleSims.length})
                        </div>
                        {verifiedEligibleSims.map((s) => {
                          const isSelected = selectedSim?.id === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setSelectedSim(s);
                                setIsSimPickerOpen(false);
                                if (s.estimatedValue > 0) {
                                  const base = Math.round(s.estimatedValue * 0.8);
                                  setStartingPrice(base);
                                  setReservePrice(
                                    auctionType === AuctionTypeEnum.DUTCH
                                      ? Math.round(base * 0.6)
                                      : Math.round(base * 1.15)
                                  );
                                }
                              }}
                              className={`w-full px-3 py-2.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${isSelected
                                ? "bg-red-50 text-[#E4011E] font-semibold"
                                : "hover:bg-slate-50 text-slate-700"
                                }`}
                            >
                              <div>
                                <span className="font-mono text-sm font-bold mr-2">
                                  {s.simNumber}
                                </span>
                                <span className="text-slate-500">
                                  {s.carrier} {s.formatRhythmName ? `• ${s.formatRhythmName}` : ""}
                                </span>
                              </div>
                              {isSelected && <Check className="size-4 text-[#E4011E]" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mục 1.2: Chọn mô hình đấu giá */}
              <div>
                <label className="text-sm font-semibold text-slate-900 block mb-2">
                  Chọn mô hình đấu giá
                  <span className="text-rose-600 font-bold ml-1">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mô hình 1: Giá lên (Tăng dần) */}
                  <div
                    onClick={() => handleAuctionTypeChange(AuctionTypeEnum.ENGLISH)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all shadow-xs ${auctionType === AuctionTypeEnum.ENGLISH
                      ? "border-[#E4011E] bg-red-50/30 ring-1 ring-[#E4011E]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-9 rounded-lg bg-red-100/70 text-[#E4011E] flex items-center justify-center">
                          <TrendingUp className="size-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">
                            Đấu giá tăng dần
                          </h4>
                          <span className="text-[11px] text-slate-500">Mô hình giá lên truyền thống</span>
                        </div>
                      </div>
                      <div
                        className={`size-4 rounded-full border flex items-center justify-center ${auctionType === AuctionTypeEnum.ENGLISH
                          ? "border-[#E4011E] bg-[#E4011E]"
                          : "border-slate-300"
                          }`}
                      >
                        {auctionType === AuctionTypeEnum.ENGLISH && (
                          <div className="size-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                      Người mua liên tục trả giá cao hơn theo từng bước giá. Tự động bù giờ khi có lượt đặt giá ở phút cuối. Người trả giá cao nhất sẽ giành quyền mua SIM.
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="text-emerald-600 font-medium">✓ Phù hợp:</span>
                      <span>SIM số đẹp, SIM VIP, tối ưu hóa lợi nhuận</span>
                    </div>
                  </div>

                  {/* Mô hình 2: Giá xuống (Hà Lan - Giảm dần tự động) */}
                  <div
                    onClick={() => handleAuctionTypeChange(AuctionTypeEnum.DUTCH)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all shadow-xs ${auctionType === AuctionTypeEnum.DUTCH
                      ? "border-[#E4011E] bg-red-50/30 ring-1 ring-[#E4011E]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-9 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center">
                          <TrendingDown className="size-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">
                            Đấu giá giảm dần
                          </h4>
                          <span className="text-[11px] text-slate-500">Hạ giá tự động theo chu kỳ</span>
                        </div>
                      </div>
                      <div
                        className={`size-4 rounded-full border flex items-center justify-center ${auctionType === AuctionTypeEnum.DUTCH
                          ? "border-[#E4011E] bg-[#E4011E]"
                          : "border-slate-300"
                          }`}
                      >
                        {auctionType === AuctionTypeEnum.DUTCH && (
                          <div className="size-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                      Mức giá sẽ tự động giảm dần sau mỗi khoảng thời gian định sẵn. Người mua đầu tiên bấm chốt mua sẽ sở hữu ngay số SIM mà không cần đợi hết phiên.
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="text-blue-600 font-medium">✓ Phù hợp:</span>
                      <span>Cần thanh khoản nhanh, bán đúng hạn</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BƯỚC 2: GIÁ KHỞI ĐIỂM & TIỀN ĐẶT CỌC */}
          {/* ========================================================================= */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Thẻ hỗ trợ định giá thông minh */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">
                      Gợi ý định giá thông minh cho SIM {selectedSim?.simNumber}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tham khảo dữ liệu giao dịch thực tế trên thị trường để chọn giá phù hợp
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {aiValuation?.suggestedPrice ? (
                    <button
                      type="button"
                      onClick={handleApplyAiPrice}
                      className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Check className="size-3.5" />
                      <span>Áp dụng {aiValuation.suggestedPrice.toLocaleString("vi-VN")} ₫</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestAiValuation}
                      disabled={loadingAi}
                      className="h-9 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      {loadingAi ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin text-[#E4011E]" />
                          <span>Đang phân tích...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5 text-amber-600" />
                          <span>Xem giá gợi ý</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Ô nhập Giá khởi điểm (Tự động định dạng tiền) */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900 block">
                  Giá khởi điểm mở phiên
                  <span className="text-rose-600 font-bold ml-1">*</span>
                </label>
                <FormattedCurrencyInput
                  value={startingPrice}
                  onChange={(val) => {
                    setStartingPrice(val);
                    if (auctionType === AuctionTypeEnum.DUTCH && reservePrice > val) {
                      setReservePrice(Math.round(val * 0.6));
                    }
                  }}
                  placeholder="Nhập giá khởi điểm..."
                />
                {/* Các nút chọn nhanh mức giá */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[2_000_000, 5_000_000, 10_000_000, 20_000_000, 50_000_000].map((p) => {
                    const isSelected = startingPrice === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setStartingPrice(p);
                          if (auctionType === AuctionTypeEnum.DUTCH) {
                            setReservePrice(Math.round(p * 0.6));
                          } else {
                            setReservePrice(Math.round(p * 1.15));
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${isSelected
                          ? "border-[#E4011E] bg-red-50 text-[#E4011E] ring-1 ring-[#E4011E]/30"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                          }`}
                      >
                        {p.toLocaleString("vi-VN")} ₫
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ô nhập Giá sàn dừng giảm (Hà Lan) hoặc Giá kỳ vọng (Anh) */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900 block">
                  {auctionType === AuctionTypeEnum.DUTCH ? (
                    <>
                      Giá sàn dừng giảm tối thiểu
                      <span className="text-rose-600 font-bold ml-1">*</span>
                    </>
                  ) : (
                    <>Mức giá kỳ vọng tối thiểu (Tùy chọn)</>
                  )}
                </label>
                <FormattedCurrencyInput
                  value={reservePrice}
                  onChange={(val) => setReservePrice(val)}
                  placeholder={
                    auctionType === AuctionTypeEnum.DUTCH
                      ? "Mức giá tối thiểu dừng giảm..."
                      : "Giá bảo lưu không bắt buộc..."
                  }
                />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {auctionType === AuctionTypeEnum.DUTCH
                    ? "Trong đấu giá giảm dần, khi giá tự động hạ tới mức giá sàn này, hệ thống sẽ dừng giảm để bảo vệ tài sản của bạn."
                    : "Nếu lượt trả giá cao nhất khi hết phiên thấp hơn mức giá này, bạn có quyền quyết định có chấp thuận bán SIM hay không."}
                </p>
              </div>

              {/* Ô nhập Tiền đặt cọc của người tham gia */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-900 block">
                  Tiền đặt cọc của người tham gia
                  <span className="text-rose-600 font-bold ml-1">*</span>
                </label>
                <FormattedCurrencyInput
                  value={depositAmount}
                  onChange={(val) => setDepositAmount(val)}
                  placeholder="Nhập số tiền đặt cọc..."
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[500_000, 1_000_000, 2_000_000, 5_000_000].map((c) => {
                    const isSelected = depositAmount === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setDepositAmount(c)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${isSelected
                          ? "border-[#E4011E] bg-red-50 text-[#E4011E] ring-1 ring-[#E4011E]/30"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                          }`}
                      >
                        {c.toLocaleString("vi-VN")} ₫
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Khối minh bạch: Tiền cọc cam kết bán của chủ SIM & Đối chiếu số dư ví */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="size-4 text-slate-700" />
                    <h4 className="text-xs font-semibold text-slate-900">
                      Tiền cọc cam kết bán của chủ SIM
                    </h4>
                  </div>
                  {loadingSellerDeposit ? (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin text-[#E4011E]" />
                      Đang tính toán...
                    </span>
                  ) : (
                    <span className="font-mono text-sm font-bold text-[#E4011E]">
                      {formatVND(sellerDepositCalc?.sellerDepositAmount || 0)}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Để đảm bảo tính nghiêm túc khi mở phiên, hệ thống sẽ tạm khóa khoản tiền cọc cam kết bán trong ví của bạn. Khoản cọc này sẽ được hoàn trả nguyên vẹn 100% ngay khi giao dịch hoàn tất hoặc phiên kết thúc hợp lệ.
                </p>

                {sellerDepositCalc && (
                  <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex justify-between">
                      <span>Tỷ lệ đặt cọc quy định:</span>
                      <strong className="text-slate-700">
                        {(sellerDepositCalc.depositRate * 100).toFixed(0)}% giá khởi điểm
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Khung tiền cọc tối thiểu - tối đa:</span>
                      <strong className="text-slate-700">
                        {formatVND(sellerDepositCalc.minDepositAmount)} – {formatVND(sellerDepositCalc.maxDepositAmount)}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Kiểm tra số dư ví thực tế */}
                <div className="pt-1">
                  {loadingWallet ? (
                    <div className="text-xs text-slate-400">Đang kiểm tra số dư ví...</div>
                  ) : wallet ? (
                    (() => {
                      const reqDeposit = sellerDepositCalc?.sellerDepositAmount || 0;
                      const hasEnough = wallet.availableBalance >= reqDeposit;
                      return (
                        <div
                          className={`p-3 rounded-lg border flex items-start gap-2.5 ${hasEnough
                            ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                            : "bg-amber-50/80 border-amber-200 text-amber-900"
                            }`}
                        >
                          {hasEnough ? (
                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <div className="text-xs leading-relaxed flex-1">
                            <div className="font-semibold flex items-center justify-between">
                              <span>Số dư khả dụng trong ví:</span>
                              <span className="font-mono">{formatVND(wallet.availableBalance)}</span>
                            </div>
                            {hasEnough ? (
                              <span className="text-emerald-700 text-[11px] mt-0.5 block">
                                Số dư hiện tại đủ điều kiện để tạm khóa khoản cọc niêm yết này.
                              </span>
                            ) : (
                              <span className="text-amber-800 text-[11px] mt-0.5 block">
                                Cần nạp thêm tối thiểu{" "}
                                <strong className="font-mono text-rose-700">
                                  {formatVND(reqDeposit - wallet.availableBalance)}
                                </strong>{" "}
                                vào ví để phiên có thể mở thành công.
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-xs text-slate-500">Chưa tải được thông tin ví.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BƯỚC 3: QUY TẮC VẬN HÀNH PHIÊN ĐẤU GIÁ */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="space-y-6">
              {/* QUY TẮC RIÊNG CHO ĐẤU GIÁ GIÁ LÊN (ANH) */}
              {auctionType === AuctionTypeEnum.ENGLISH && (
                <div className="space-y-5">
                  {/* Bước giá tối thiểu */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-900 block">
                      Bước giá tối thiểu mỗi lượt
                      <span className="text-rose-600 font-bold ml-1">*</span>
                    </label>
                    <FormattedCurrencyInput
                      value={minimumBidIncrement}
                      onChange={(val) => setMinimumBidIncrement(val)}
                      placeholder="Nhập bước giá tối thiểu..."
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[100_000, 200_000, 500_000, 1_000_000, 2_000_000].map((inc) => {
                        const isSelected = minimumBidIncrement === inc;
                        return (
                          <button
                            key={inc}
                            type="button"
                            onClick={() => setMinimumBidIncrement(inc)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${isSelected
                              ? "border-[#E4011E] bg-red-50 text-[#E4011E] ring-1 ring-[#E4011E]/30"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                              }`}
                          >
                            {inc.toLocaleString("vi-VN")} ₫
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Mỗi lần đặt giá, người mua phải trả giá cao hơn giá hiện tại ít nhất bằng mức bước giá này.
                    </p>
                  </div>

                  {/* Bội số bước giá tối đa */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-900">
                        Giới hạn mức nhảy giá mỗi lần
                        <span className="text-rose-600 font-bold ml-1">*</span>
                      </label>
                      <span className="text-xs text-slate-500 font-medium">
                        Tối đa: <strong className="font-mono text-slate-900">{formatVND(minimumBidIncrement * maxStepMultiplier)}</strong>
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[5, 10, 20, 50].map((mult) => (
                        <button
                          key={mult}
                          type="button"
                          onClick={() => setMaxStepMultiplier(mult)}
                          className={`h-10 rounded-lg border text-xs font-semibold transition-all ${maxStepMultiplier === mult
                            ? "border-[#E4011E] bg-red-50 text-[#E4011E] ring-1 ring-[#E4011E]/40"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                            }`}
                        >
                          {mult}x bước giá
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Ngăn chặn trường hợp người tham gia đặt bước nhảy giá quá lớn gây phá hoại phiên đấu giá.
                    </p>
                  </div>

                  {/* Tự động bù giờ ở những giây cuối */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-slate-700" />
                        <div>
                          <h4 className="text-xs font-semibold text-slate-900">
                            Tự động bù giờ ở những giây cuối phiên
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            Chống hành vi đặt giá sát nút giây cuối gây bất công
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableAutoExtension}
                        onChange={(e) => setEnableAutoExtension(e.target.checked)}
                        className="size-4 accent-[#E4011E] rounded cursor-pointer"
                      />
                    </div>

                    {enableAutoExtension && (
                      <div className="pt-2 border-t border-slate-200 space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-medium text-slate-700 block mb-1">
                              Ngưỡng kích hoạt bù giờ
                            </label>
                            <select
                              value={extensionThresholdSeconds}
                              onChange={(e) => setExtensionThresholdSeconds(Number(e.target.value))}
                              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs font-medium focus:border-[#E4011E] focus:ring-2 focus:ring-[#E4011E]/15"
                            >
                              <option value={60}>Trong 1 phút cuối (60 giây)</option>
                              <option value={120}>Trong 2 phút cuối (120 giây)</option>
                              <option value={180}>Trong 3 phút cuối (180 giây)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-slate-700 block mb-1">
                              Thời gian gia hạn thêm mỗi lần
                            </label>
                            <select
                              value={extensionDurationSeconds}
                              onChange={(e) => setExtensionDurationSeconds(Number(e.target.value))}
                              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs font-medium focus:border-[#E4011E] focus:ring-2 focus:ring-[#E4011E]/15"
                            >
                              <option value={120}>Kéo dài thêm 2 phút (120 giây)</option>
                              <option value={300}>Kéo dài thêm 5 phút (300 giây)</option>
                              <option value={600}>Kéo dài thêm 10 phút (600 giây)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>Số lần bù giờ tối đa của phiên: <strong className="text-slate-700">{maximumExtensionCount} lần</strong></span>
                          <span>Giới hạn cùng 1 người kích hoạt: <strong className="text-slate-700">{maxSnipeExtensionsPerParticipant} lần</strong></span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cơ chế chuyển nhượng cho người về nhì (Á quân) */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900">
                          Quyền xét duyệt chuyển nhượng cho người về nhì
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Nếu người trả giá cao nhất từ chối thanh toán hoặc bỏ cọc, bạn có quyền xem xét bán lại SIM cho người về nhì.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={requireSellerApprovalForRunnerUp}
                        onChange={(e) => setRequireSellerApprovalForRunnerUp(e.target.checked)}
                        className="size-4 accent-[#E4011E] rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* QUY TẮC RIÊNG CHO ĐẤU GIÁ GIÁ XUỐNG (HÀ LAN) */}
              {auctionType === AuctionTypeEnum.DUTCH && (
                <div className="space-y-5">
                  {/* Mức giảm mỗi chu kỳ */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-900 block">
                      Mức giảm giá sau mỗi chu kỳ
                      <span className="text-rose-600 font-bold ml-1">*</span>
                    </label>
                    <FormattedCurrencyInput
                      value={dutchDecreaseAmount}
                      onChange={(val) => setDutchDecreaseAmount(val)}
                      placeholder="Nhập mức giảm mỗi nấc..."
                      suffix="VNĐ / nấc"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[200_000, 500_000, 1_000_000, 2_000_000].map((amt) => {
                        const isSelected = dutchDecreaseAmount === amt;
                        return (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setDutchDecreaseAmount(amt)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${isSelected
                              ? "border-[#E4011E] bg-red-50 text-[#E4011E] ring-1 ring-[#E4011E]/30"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                              }`}
                          >
                            {amt.toLocaleString("vi-VN")} ₫
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chu kỳ thời gian giảm giá */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-900 block">
                      Chu kỳ giảm giá
                      <span className="text-rose-600 font-bold ml-1">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { sec: 30, text: "Mỗi 30 giây" },
                        { sec: 60, text: "Mỗi 1 phút" },
                        { sec: 120, text: "Mỗi 2 phút" },
                      ].map((item) => (
                        <button
                          key={item.sec}
                          type="button"
                          onClick={() => setDutchDecreaseIntervalSeconds(item.sec)}
                          className={`h-10 rounded-lg border text-xs font-semibold transition-all ${dutchDecreaseIntervalSeconds === item.sec
                            ? "border-[#E4011E] bg-red-50 text-[#E4011E] ring-1 ring-[#E4011E]/40"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                            }`}
                        >
                          {item.text}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bảng mô phỏng tiến trình hạ giá */}
                  {dutchSimulation && (
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2 shadow-xs">
                      <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
                        <Info className="size-4 text-blue-600" />
                        <span>Mô phỏng chu trình hạ giá tự động</span>
                      </div>
                      <div className="text-xs text-slate-700 space-y-1">
                        <div className="flex justify-between">
                          <span>Chênh lệch giữa giá mở và giá sàn:</span>
                          <strong className="font-mono">{formatVND(dutchSimulation.priceGap)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Tổng số lần giảm tối đa:</span>
                          <strong>{dutchSimulation.steps} nấc giảm</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Tổng thời gian dự kiến để chạm giá sàn:</span>
                          <strong className="text-[#E4011E]">{dutchSimulation.timeStr}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* BƯỚC 4: LỊCH TRÌNH MỞ PHIÊN & ĐỐI SOÁT THÔNG SỐ */}
          {/* ========================================================================= */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Thiết lập thời gian mở phiên */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="size-4 text-slate-700" />
                  <span>Thời điểm bắt đầu phiên đấu giá</span>
                  <span className="text-rose-600 font-bold">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: "5", label: "Mở sau 5 phút" },
                    { val: "15", label: "Mở sau 15 phút" },
                    { val: "60", label: "Mở sau 1 giờ" },
                    { val: "1440", label: "Mở vào ngày mai" },
                  ].map((preset) => {
                    const isSelected = startPreset === preset.val;
                    return (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setStartPreset(preset.val)}
                        className={`h-10 px-2 rounded-lg border text-xs font-semibold transition-all ${isSelected
                          ? "border-[#E4011E] bg-red-50 text-[#E4011E] ring-1 ring-[#E4011E]/40"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                          }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Thời lượng diễn ra phiên (áp dụng cho Đấu giá giá lên) */}
              {auctionType === AuctionTypeEnum.ENGLISH && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-900">
                      Thời lượng mở phiên đấu giá
                      <span className="text-rose-600 font-bold ml-1">*</span>
                    </label>
                    <span className="text-xs text-slate-500">
                      Đang chọn: <strong className="text-slate-900">{formatDurationText(durationMinutes)}</strong>
                    </span>
                  </div>

                  {/* Mục 1: Thử nghiệm nhanh (3 - 5 phút) theo yêu cầu người dùng */}
                  <div className="p-3 rounded-lg border border-amber-200/90 bg-amber-50/60 space-y-2 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <Zap className="size-3.5 text-amber-600" />
                      <span>Thử nghiệm nhanh (Dành cho kiểm thử chức năng):</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { min: 2, label: "2 phút", desc: "Phiên kết thúc sau 3 phút" },
                        { min: 5, label: "5 phút", desc: "Phiên kết thúc sau 5 phút" },
                      ].map((item) => {
                        const isSelected = durationMinutes === item.min;
                        return (
                          <button
                            key={item.min}
                            type="button"
                            onClick={() => setDurationMinutes(item.min)}
                            className={`p-2.5 rounded-lg border text-left transition-all ${isSelected
                              ? "border-amber-600 bg-amber-100/90 text-amber-950 ring-1 ring-amber-500 shadow-xs"
                              : "border-amber-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/40 shadow-xs"
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">{item.label}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isSelected
                                  ? "bg-amber-200 text-amber-900"
                                  : "bg-slate-100 text-slate-600"
                                  }`}
                              >
                                Test nhanh
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mục 2: Thời lượng tiêu chuẩn sàn */}
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Thời lượng tiêu chuẩn sàn:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { min: 720, text: "12 giờ" },
                        { min: 1440, text: "24 giờ (1 ngày)" },
                        { min: 2880, text: "48 giờ (2 ngày)" },
                      ].map((item) => {
                        const isSelected = durationMinutes === item.min;
                        return (
                          <button
                            key={item.min}
                            type="button"
                            onClick={() => setDurationMinutes(item.min)}
                            className={`h-10 rounded-lg border text-xs font-semibold transition-all ${isSelected
                              ? "border-[#E4011E] bg-red-50 text-[#E4011E] ring-1 ring-[#E4011E]/40"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                              }`}
                          >
                            {item.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Thời hạn thanh toán sau khi thắng phiên */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900 block">
                  Thời hạn thanh toán sau khi chốt người thắng
                  <span className="text-rose-600 font-bold ml-1">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { h: 24, text: "24 giờ (Tiêu chuẩn sàn)" },
                    { h: 48, text: "48 giờ (Kéo dài tối đa)" },
                  ].map((item) => {
                    const isSelected = gracePeriodHours === item.h;
                    return (
                      <button
                        key={item.h}
                        type="button"
                        onClick={() => setGracePeriodHours(item.h)}
                        className={`h-10 rounded-lg border text-xs font-semibold transition-all ${isSelected
                          ? "border-[#E4011E] bg-red-50 text-[#E4011E] ring-1 ring-[#E4011E]/40"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                          }`}
                      >
                        {item.text}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500">
                  Nếu quá thời hạn này người thắng không thanh toán, người thắng sẽ bị xử phạt cọc theo quy chế sàn.
                </p>
              </div>

              {/* BẢNG ĐỐI SOÁT THÔNG SỐ NIÊM YẾT */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <div className="size-2 rounded-full bg-[#E4011E]" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Biên lai đối soát thông số niêm yết
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Số SIM niêm yết:</span>
                    <strong className="font-mono text-slate-900">{selectedSim?.simNumber}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Nhà mạng:</span>
                    <strong className="text-slate-900">{selectedSim?.carrier}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Mô hình đấu giá:</span>
                    <strong className="text-[#E4011E]">
                      {auctionType === AuctionTypeEnum.ENGLISH
                        ? "Đấu giá tăng dần"
                        : "Đấu giá giảm dần"}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Thời lượng mở phiên:</span>
                    <strong className="text-slate-900">{formatDurationText(durationMinutes)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Giá khởi điểm:</span>
                    <strong className="font-mono text-slate-900">{formatVND(startingPrice)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">
                      {auctionType === AuctionTypeEnum.DUTCH ? "Giá sàn dừng giảm:" : "Mức giá kỳ vọng:"}
                    </span>
                    <strong className="font-mono text-slate-900">
                      {reservePrice > 0 ? formatVND(reservePrice) : "Không áp dụng"}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Tiền cọc người tham gia:</span>
                    <strong className="font-mono text-slate-900">{formatVND(depositAmount)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Tiền cọc cam kết người bán:</span>
                    <strong className="font-mono text-[#E4011E]">
                      {formatVND(sellerDepositCalc?.sellerDepositAmount || 0)}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Thời hạn thanh toán sau phiên:</span>
                    <strong className="text-slate-900">{gracePeriodHours} giờ</strong>
                  </div>
                  {auctionType === AuctionTypeEnum.ENGLISH ? (
                    <>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Bước giá tối thiểu:</span>
                        <strong className="font-mono text-slate-900">{formatVND(minimumBidIncrement)}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Tự động bù giờ:</span>
                        <strong className="text-slate-900">
                          {enableAutoExtension
                            ? `Bù ${extensionDurationSeconds / 60} phút ở ${extensionThresholdSeconds / 60} phút cuối`
                            : "Tắt"}
                        </strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Mức giảm mỗi chu kỳ:</span>
                        <strong className="font-mono text-slate-900">-{formatVND(dutchDecreaseAmount)}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Chu kỳ giảm giá:</span>
                        <strong className="text-slate-900">{dutchDecreaseIntervalSeconds} giây / lần</strong>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-2 text-[11px] text-slate-500 flex items-start gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Bằng việc bấm xác nhận khởi tạo, bạn đồng ý với Quy chế hoạt động sàn đấu giá TrustSim và cam kết bàn giao số SIM đúng hạn khi giao dịch thành công.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── CỐ ĐỊNH: FOOTER ── */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={step === 1 ? onClose : handlePrev}
            className="h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {step === 1 ? (
              <span>Hủy bỏ</span>
            ) : (
              <>
                <ArrowLeft className="size-4" />
                <span>Quay lại</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-3">
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="h-11 px-6 rounded-lg bg-[#E4011E] hover:bg-[#B80018] text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs"
              >
                <span>Tiếp tục</span>
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="h-11 px-6 rounded-lg bg-[#E4011E] hover:bg-[#B80018] text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Đang khởi tạo phiên...</span>
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    <span>Xác nhận & Khởi tạo phiên</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
