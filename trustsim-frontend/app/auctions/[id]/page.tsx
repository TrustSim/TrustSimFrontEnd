/* Redesigned AuctionDetailPage · Clean High-Trust Banking & Auction Terminal */
"use client";

import React, { useState, useEffect, useRef, use, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { auctionService, AuctionDto, BidDto, PendingSettlementDto } from "@/services/auctionService";
import { auctionHubService } from "@/services/auctionHubService";
import { authService } from "@/services/authService";
import { AuthResponseDto } from "@/types/auth";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";
import { DepositModal } from "@/components/wallet/DepositModal";
import PostAuctionSettlementTerminal from "@/components/auction/PostAuctionSettlementTerminal";
import { formatPhoneNumber, getCarrierColor } from "@/services/simService";
import {
  Gavel, Clock, Flame, ShieldCheck, CheckCircle2, Lock,
  ArrowLeft, TrendingUp, TrendingDown, RefreshCw, Wallet,
  AlertTriangle, Crown, Copy, Check, Info, BadgeCheck,
  Radio, FileText, X, ChevronDown, ChevronUp, Users, Zap,
  Timer, BookOpen, CircleDollarSign, Scale, HelpCircle,
} from "lucide-react";

/* ─── Currency Formatter ─────────────────────────────────── */
const formatPrice = (amount?: number) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
};

/* ─── Avatar Colors ──────────────────────────────────────── */
const AVATAR_COLORS = [
  { bg: "#DBEAFE", text: "#1D4ED8" }, { bg: "#FEE2E2", text: "#B91C1C" },
  { bg: "#D1FAE5", text: "#065F46" }, { bg: "#FEF3C7", text: "#92400E" },
  { bg: "#EDE9FE", text: "#5B21B6" }, { bg: "#CCFBF1", text: "#0F766E" },
];
const getAvatarStyle = (name: string = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/* ─── Animated Count-Up Hook ─────────────────────────────── */
function useCountUp(target: number, duration: number = 500) {
  const [current, setCurrent] = useState(target);
  const currentRef = useRef(target);
  useEffect(() => {
    const start = currentRef.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    let req: number;
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(start + diff * eased);
      currentRef.current = val;
      setCurrent(val);
      if (progress < 1) { req = requestAnimationFrame(animate); } else { currentRef.current = target; setCurrent(target); }
    };
    req = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(req);
  }, [target, duration]);
  return current;
}

/* ─── SIM Number Display ─────────────────────────────────── */
function SimAssetDisplay({ phone, carrier }: { phone?: string; carrier?: string }) {
  const [copied, setCopied] = useState(false);
  const clean = (phone || "").replace(/\D/g, "");
  let formatted = phone || "---";
  if (clean.length === 10) formatted = `${clean.slice(0, 4)} · ${clean.slice(4, 7)} · ${clean.slice(7)}`;
  else if (clean.length === 11) formatted = `${clean.slice(0, 5)} · ${clean.slice(5, 8)} · ${clean.slice(8)}`;

  const handleCopy = () => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-center gap-3 py-3">
      <span className="font-mono text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white select-all tabular-nums">
        {formatted}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="opacity-50 hover:opacity-100 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition-all text-xs flex items-center gap-1.5 cursor-pointer"
        title="Sao chép số SIM"
      >
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        <span className="text-[11px] font-sans font-medium hidden sm:inline">{copied ? "Đã chép" : "Chép"}</span>
      </button>
    </div>
  );
}

/* ─── Collapsible Section ────────────────────────────────── */
function CollapsibleSection({ title, icon, defaultOpen = true, children, badge }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode; badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">{icon}</div>
          <span className="font-bold text-sm text-[#001743]">{title}</span>
          {badge}
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="border-t border-slate-100">{children}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = typeof (params as any)?.then === "function" ? use(params as Promise<{ id: string }>) : (params as { id: string });
  const auctionId = resolvedParams.id;

  const [auction, setAuction] = useState<AuctionDto | null>(null);
  const [bids, setBids] = useState<BidDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [acceptingDutchBuy, setAcceptingDutchBuy] = useState(false);
  const [bidAmountInput, setBidAmountInput] = useState<string>("");
  const [inputError, setInputError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"rules" | "sim_info" | "seller">("rules");

  const isDutch = useMemo(() => {
    if (!auction) return false;
    return auction.auctionType === "DUTCH" || String(auction.auctionType) === "1" || (auction as any).auctionType === 1;
  }, [auction?.auctionType]);

  const [currentUser, setCurrentUser] = useState<AuthResponseDto | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const syncAuth = () => {
      const user = authService.getUser();
      setCurrentUser(user);
      setIsLoggedIn(Boolean(user && user.userId));
    };
    syncAuth();
    window.addEventListener("trustsim_auth_change", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("trustsim_auth_change", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const [priceFlash, setPriceFlash] = useState(false);
  const [antiSnipingFlash, setAntiSnipingFlash] = useState(false);
  const [newestBidId, setNewestBidId] = useState<string | null>(null);
  const previousEndAtRef = useRef<string | null>(null);

  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; isEnded: boolean }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: false });

  const [mySettlement, setMySettlement] = useState<PendingSettlementDto | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositInitialAmount, setDepositInitialAmount] = useState<number | null>(null);
  const [dutchConfirmModalOpen, setDutchConfirmModalOpen] = useState(false);
  const [showBidsExpanded, setShowBidsExpanded] = useState(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  /* ─── Data Loading ─────────────────────────────────────── */
  const fetchAuctionData = async (isBackground: boolean = false) => {
    try {
      if (!isBackground) setLoading(true);
      const [auctionData, bidsData] = await Promise.all([
        auctionService.getAuctionById(auctionId),
        auctionService.getAuctionBids(auctionId, 40),
      ]);

      setAuction((prev) => {
        if (prev && prev.currentPrice !== auctionData.currentPrice) {
          setPriceFlash(true);
          setTimeout(() => setPriceFlash(false), 1200);
        }
        return auctionData;
      });

      if (previousEndAtRef.current && previousEndAtRef.current !== auctionData.endAt) {
        setAntiSnipingFlash(true);
        setTimeout(() => setAntiSnipingFlash(false), 4500);
      }
      previousEndAtRef.current = auctionData.endAt;

      if (bidsData.length > 0) {
        setBids((prev) => {
          if (prev.length > 0 && bidsData[0].id !== prev[0]?.id) {
            setNewestBidId(bidsData[0].id);
            setTimeout(() => setNewestBidId(null), 3000);
          }
          return bidsData;
        });
      } else {
        setBids([]);
      }

      // Tải trạng thái quyết toán nếu đã đăng nhập
      if (authService.isAuthenticated()) {
        try {
          const settlements = await auctionService.getPendingSettlements();
          const match = settlements.find(
            (s) => s.auctionId.toLowerCase() === auctionId.toLowerCase()
          );
          setMySettlement(match || null);
        } catch {
          // Bỏ qua lỗi ngầm
        }
      } else {
        setMySettlement(null);
      }

      if (!isBackground) {
        const isDutchAuction = auctionData.auctionType === "DUTCH" || String(auctionData.auctionType) === "1" || (auctionData as any).auctionType === 1;
        if (!isDutchAuction) {
          const nextPrice = auctionData.currentPrice + (auctionData.minBidStep || 500_000);
          setBidAmountInput(nextPrice.toLocaleString("vi-VN"));
        } else {
          setBidAmountInput(auctionData.currentPrice.toLocaleString("vi-VN"));
        }
      }
    } catch (err: any) {
      if (!isBackground) addToast({ type: "error", title: "Không thể tải phiên đấu giá", message: err.message || "Vui lòng kiểm tra đường truyền." });
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => { fetchAuctionData(false); }, [auctionId]);

  /* ─── SignalR Real-time ────────────────────────────────── */
  useEffect(() => {
    let isSubscribed = true;
    const setupRealtime = async () => {
      try {
        await auctionHubService.joinAuction(auctionId);
        if (!isSubscribed) return;

        auctionHubService.onNewBid((newBid, newCurrentPrice, totalBidsCount) => {
          if (!isSubscribed) return;
          setPriceFlash(true);
          setTimeout(() => setPriceFlash(false), 1200);
          setAuction((prev) => prev ? { ...prev, currentPrice: newCurrentPrice, totalBids: totalBidsCount } : null);
          setBids((prev) => [newBid, ...prev.filter((b) => b.id !== newBid.id).map((b) => ({ ...b, status: "OUTBID" }))]);
          setNewestBidId(newBid.id);
          setTimeout(() => setNewestBidId(null), 3000);

          if (!isDutch) {
            const minStep = auction?.minBidStep || 500_000;
            setBidAmountInput((newCurrentPrice + minStep).toLocaleString("vi-VN"));
          } else {
            setBidAmountInput(newCurrentPrice.toLocaleString("vi-VN"));
          }
        });

        auctionHubService.onAuctionExtended((newEndAtStr) => {
          if (!isSubscribed) return;
          setAuction((prev) => (prev ? { ...prev, endAt: newEndAtStr } : null));
          setAntiSnipingFlash(true);
          setTimeout(() => setAntiSnipingFlash(false), 5000);
        });

        auctionHubService.onAuctionStatusChanged((aId, newStatus) => {
          if (!isSubscribed || aId !== auctionId) return;
          setAuction((prev) => (prev ? { ...prev, auctionStatus: newStatus as any } : null));
          fetchAuctionData(true);
        });

        auctionHubService.onAuctionEnded(() => {
          if (!isSubscribed) return;
          fetchAuctionData(true);
        });

        auctionHubService.onAuctionFailed(() => {
          if (!isSubscribed) return;
          fetchAuctionData(true);
        });

        auctionHubService.onAuctionNotification(() => {
          if (!isSubscribed) return;
          fetchAuctionData(true);
        });
      } catch (err) { console.warn("[SignalR] Không thể kết nối:", err); }
    };

    setupRealtime();
    return () => { isSubscribed = false; auctionHubService.leaveAuction(auctionId); auctionHubService.removeAuctionListeners(); };
  }, [auctionId, auction?.minBidStep, isDutch]);

  /* ─── Countdown Timer ──────────────────────────────────── */
  useEffect(() => {
    if (!auction?.endAt) return;
    const target = new Date(auction.endAt).getTime();
    const updateTimer = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true }); return; }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        isEnded: false,
      });
    };
    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [auction?.endAt]);

  const animatedPrice = useCountUp(auction?.currentPrice || 0, 500);

  /* ─── Quick Add Steps ──────────────────────────────────── */
  const quickAddSteps = useMemo(() => {
    if (!auction || isDutch) return [];
    const step = auction.minBidStep || 500_000;
    const maxMul = auction.maxStepMultiplier && auction.maxStepMultiplier > 0 ? auction.maxStepMultiplier : 10;
    const multipliers: number[] = [1];
    if (maxMul >= 2) multipliers.push(2);
    if (maxMul >= 5 && !multipliers.includes(5)) multipliers.push(5);
    if (!multipliers.includes(maxMul) && maxMul > 1) multipliers.push(maxMul);
    return multipliers.map((mul) => ({
      label: mul === maxMul && mul > 1 ? "Trần tối đa" : `+${mul} bước`,
      amountText: `+${formatPrice(step * mul)}`,
      val: step * mul,
    }));
  }, [auction?.minBidStep, auction?.maxStepMultiplier, isDutch]);

  /* ─── Handlers ─────────────────────────────────────────── */
  const handleQuickAdd = (increment: number) => {
    if (!auction) return;
    setBidAmountInput((auction.currentPrice + increment).toLocaleString("vi-VN"));
    setInputError("");
  };

  const handleInputChange = (val: string) => {
    const raw = val.replace(/\D/g, "");
    if (!raw) { setBidAmountInput(""); setInputError(""); return; }
    const num = parseInt(raw, 10);
    setBidAmountInput(num.toLocaleString("vi-VN"));
    if (auction && !isDutch) {
      const minStep = auction.minBidStep || 500_000;
      const minAllowed = auction.currentPrice + minStep;
      const maxMultiplier = auction.maxStepMultiplier && auction.maxStepMultiplier > 0 ? auction.maxStepMultiplier : 10;
      const maxAllowed = auction.currentPrice + maxMultiplier * minStep;
      if (num < minAllowed) setInputError(`Tối thiểu: ${formatPrice(minAllowed)}`);
      else if (num > maxAllowed) setInputError(`Tối đa: ${formatPrice(maxAllowed)} (${maxMultiplier}× bước giá)`);
      else setInputError("");
    }
  };

  const handleRegisterParticipant = async () => {
    if (!isLoggedIn) { window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`; return; }
    setRegistering(true);
    try {
      await auctionService.registerParticipant(auctionId);
      addToast({ type: "success", title: "Đăng ký thành công", message: "Bạn đã được cấp quyền tham gia trả giá!", duration: 4000 });
      setAuction((prev) => (prev ? { ...prev, isUserRegistered: true } : null));
    } catch (err: any) {
      const msg = err.message || "Vui lòng kiểm tra số dư ví.";
      addToast({ type: "error", title: "Đăng ký không thành công", message: msg, duration: 5000 });
      if (msg.includes("Số dư") || msg.includes("không đủ") || msg.includes("nạp thêm")) setTimeout(() => setDepositModalOpen(true), 1200);
    } finally { setRegistering(false); }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auction) return;
    if (!isLoggedIn) { window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`; return; }
    const raw = bidAmountInput.replace(/\D/g, "");
    if (!raw) { setInputError("Vui lòng nhập số tiền."); return; }
    const amount = parseInt(raw, 10);
    const minStep = auction.minBidStep || 500_000;
    const minAllowed = auction.currentPrice + minStep;
    const maxMultiplier = auction.maxStepMultiplier && auction.maxStepMultiplier > 0 ? auction.maxStepMultiplier : 10;
    const maxAllowed = auction.currentPrice + maxMultiplier * minStep;
    if (amount < minAllowed) { setInputError(`Tối thiểu: ${formatPrice(minAllowed)}`); return; }
    if (amount > maxAllowed) { setInputError(`Tối đa: ${formatPrice(maxAllowed)}`); return; }

    setBidding(true); setInputError("");
    try {
      const newBid = await auctionService.placeBid(auctionId, amount);
      addToast({ type: "success", title: "Đặt giá thành công!", message: `Bạn đang dẫn đầu với ${formatPrice(amount)}.`, duration: 4000 });
      setAuction((prev) => (prev ? { ...prev, currentPrice: newBid.bidAmount, totalBids: prev.totalBids + 1 } : null));
      setBids((prev) => [newBid, ...prev.map((b) => ({ ...b, status: "OUTBID" }))]);
      setNewestBidId(newBid.id);
      setBidAmountInput((newBid.bidAmount + (auction.minBidStep || 500_000)).toLocaleString("vi-VN"));
      fetchAuctionData(true);
    } catch (err: any) {
      addToast({ type: "error", title: "Đặt giá thất bại", message: err.message || "Không thể gửi lượt trả giá.", duration: 5000 });
    } finally { setBidding(false); }
  };

  const handleOpenDutchConfirm = () => {
    if (!auction) return;
    if (!isLoggedIn) { window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`; return; }
    setDutchConfirmModalOpen(true);
  };

  const handleExecuteDutchBuy = async () => {
    if (!auction) return;
    setAcceptingDutchBuy(true);
    try {
      await auctionService.acceptDutchBuy(auctionId);
      setDutchConfirmModalOpen(false);
      addToast({ type: "success", title: "Mua SIM thành công!", message: `Chúc mừng! Bạn đã sở hữu ${auction.simPhoneNumber} với giá ${formatPrice(auction.currentPrice)}.`, duration: 6000 });
      fetchAuctionData(false);
    } catch (err: any) {
      addToast({ type: "error", title: "Không thể mua SIM", message: err.message || "Đã có người mua trước.", duration: 5000 });
    } finally { setAcceptingDutchBuy(false); }
  };

  /* ─── Derived State ────────────────────────────────────── */
  const isUrgentAmber = !timeLeft.isEnded && timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes < 5 && timeLeft.minutes >= 1;
  const isUrgentRed = !timeLeft.isEnded && timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0;
  const carrierColor = getCarrierColor(auction?.carrierName || "");

  const timerBg = isUrgentRed ? "bg-rose-50 text-rose-700 border-rose-200" : isUrgentAmber ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-[#001743] border-slate-200";

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        initialAmount={depositInitialAmount || auction?.depositAmount || 500_000}
        onSuccess={() => {
          addToast({
            type: "success",
            title: "Nạp tiền thành công",
            message: "Số dư ví đã được cập nhật!",
          });
          fetchAuctionData(true);
        }}
      />

      {/* ─── Dutch Buy Confirmation Modal ─── */}
      {dutchConfirmModalOpen && auction && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#001743]">Xác nhận mua số SIM</h3>
                  <p className="text-xs text-slate-500">Khớp lệnh tức thì · Đấu giá Hà Lan</p>
                </div>
              </div>
              <button type="button" onClick={() => setDutchConfirmModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5 text-xs">
              {[
                { label: "Số thuê bao", value: auction.simPhoneNumber, bold: true, mono: true },
                { label: "Nhà mạng", value: auction.carrierName },
                { label: "Giá chốt mua", value: formatPrice(auction.currentPrice), bold: true, color: "text-rose-600" },
                { label: "Tiền cọc đã giữ", value: auction.depositAmount > 0 ? `-${formatPrice(auction.depositAmount)}` : "0 ₫" },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-slate-200/60 last:border-0">
                  <span className="text-slate-500">{row.label}</span>
                  <span className={`${row.bold ? "font-bold" : "font-semibold"} ${row.mono ? "font-mono" : ""} ${row.color || "text-slate-800"} tabular-nums`}>{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 font-bold text-sm border-t border-slate-200">
                <span className="text-[#001743]">Số tiền cần tất toán</span>
                <span className="font-mono text-[#001743] tabular-nums">{formatPrice(Math.max(0, auction.currentPrice - (auction.depositAmount || 0)))}</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-[11px] text-blue-900 leading-relaxed flex items-start gap-2">
              <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
              <span>Sau khi bấm xác nhận, bạn có <strong>{auction.paymentGracePeriodHours || 24} giờ</strong> để hoàn tất thanh toán và sang tên SIM chính chủ.</span>
            </div>

            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setDutchConfirmModalOpen(false)} disabled={acceptingDutchBuy} className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition-colors">Xem lại</button>
              <button type="button" onClick={handleExecuteDutchBuy} disabled={acceptingDutchBuy} className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold shadow-md cursor-pointer transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {acceptingDutchBuy ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>{acceptingDutchBuy ? "Đang xử lý…" : "Xác nhận mua ngay"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar />

      <main className="flex-1 pt-20 pb-16">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 space-y-5">

          {/* ─── Breadcrumb ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/" className="hover:text-[#001743] transition-colors">Trang chủ</Link>
              <span className="text-slate-300">/</span>
              <Link href="/auctions" className="hover:text-[#001743] transition-colors">Sàn Đấu Giá</Link>
              <span className="text-slate-300">/</span>
              <span className="text-[#001743] font-mono font-bold">{auction ? auction.auctionCode : "..."}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Trực tiếp</span>
              </div>
              <button onClick={() => fetchAuctionData(false)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all shadow-xs cursor-pointer">
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                <span>Đồng bộ</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5">
              <div className="space-y-5">
                <div className="h-72 bg-slate-200/70 rounded-2xl animate-pulse" />
                <div className="h-80 bg-slate-200/70 rounded-2xl animate-pulse" />
              </div>
              <div className="h-[600px] bg-slate-200/70 rounded-2xl animate-pulse" />
            </div>
          ) : !auction ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center max-w-lg mx-auto">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200"><AlertTriangle size={24} /></div>
              <h2 className="text-lg font-bold text-[#001743] mb-2">Không tìm thấy phiên đấu giá</h2>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">Phiên này không tồn tại hoặc đã bị gỡ.</p>
              <Link href="/auctions" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-xl shadow-xs transition-colors">
                <ArrowLeft size={14} /><span>Quay lại sàn đấu giá</span>
              </Link>
            </div>
          ) : (
            /* ═══ 2-COLUMN LAYOUT ═══ */
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5 items-start">

              {/* ═══ LEFT COLUMN ═══ */}
              <div className="space-y-5">

                {/* ── 1. SIM ASSET SHOWCASE ── */}
                <div className="bg-[#001743] rounded-2xl border border-[#0D2847] p-6 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
                  <div className="absolute -right-16 -top-16 w-[300px] h-[300px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, #E4011E, transparent 70%)" }} />

                  {/* Header Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-xs font-bold text-white">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: carrierColor }} />
                        {auction.carrierName || "Nhà mạng"}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${isDutch ? "bg-blue-500/15 border-blue-400/25 text-blue-300" : "bg-amber-400/15 border-amber-400/25 text-amber-300"}`}>
                        {isDutch ? (
                          <span className="flex items-center gap-1"><TrendingDown size={12} />Đấu giá Hà Lan (Giảm dần)</span>
                        ) : (
                          <span className="flex items-center gap-1"><TrendingUp size={12} />Đấu giá Kiểu Anh (Tăng dần)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-300 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">{auction.auctionCode}</span>
                      {auction.auctionStatus === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/25">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Đang diễn ra
                        </span>
                      ) : auction.auctionStatus === "SCHEDULE" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/25">
                          <Clock size={12} />Sắp mở
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/10 text-slate-300 border border-white/10">Đã chốt</span>
                      )}
                    </div>
                  </div>

                  {/* SIM Number */}
                  <div className="relative z-10">
                    <div className="text-[11px] font-semibold text-slate-400 text-center mb-1">Số SIM đang đấu giá</div>
                    <SimAssetDisplay phone={auction.simPhoneNumber} carrier={auction.carrierName} />
                    {auction.formatRhythmName && (
                      <div className="text-center mt-1">
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-slate-300 border border-white/10">
                          Thế số: {auction.formatRhythmName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price Bar */}
                  <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-10 mt-4">
                    <div>
                      <div className="text-[11px] font-medium text-slate-400">Giá khởi điểm</div>
                      <div className="text-base font-bold text-slate-200 font-mono tabular-nums mt-0.5">{formatPrice(auction.startingPrice)}</div>
                    </div>
                    <div className="sm:text-right">
                      <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 sm:justify-end">
                        {isDutch ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                        <span>Giá hiện tại</span>
                      </div>
                      <div className={`text-2xl sm:text-3xl font-black text-amber-300 font-mono tabular-nums mt-0.5 transition-transform duration-200 ${priceFlash ? "scale-105" : "scale-100"}`}>
                        {formatPrice(animatedPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Trust Strip */}
                  <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 relative z-10 font-medium mt-2">
                    <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-400" />Sang tên chính chủ</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-blue-400" />Hợp đồng điện tử</span>
                    <span className="flex items-center gap-1.5"><Lock size={13} className="text-amber-400" />Ký quỹ 100%</span>
                  </div>
                </div>

                {/* ── 2. BIDDING CONSOLE ── */}
                <div className={`bg-white border rounded-2xl shadow-xs overflow-hidden transition-colors duration-200 ${antiSnipingFlash ? "border-emerald-400 ring-2 ring-emerald-200" : "border-slate-200"}`}>
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gavel size={17} className="text-[#001743]" />
                      <h2 className="font-bold text-sm text-[#001743]">{isDutch ? "Mua Ngay" : "Đặt Giá"}</h2>
                    </div>
                    {auction.auctionStatus === "ACTIVE" && !timeLeft.isEnded && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {isDutch ? "Đang mở bán" : "Đang nhận lượt trả"}
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Anti-sniping Alert */}
                    {!isDutch && antiSnipingFlash && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold">
                        <Flame size={16} className="text-emerald-600 shrink-0" />
                        <span><strong>Gia hạn giờ chót:</strong> +{auction.extensionDurationSeconds || 30}s để bảo đảm công bằng.</span>
                      </div>
                    )}

                    {/* Countdown */}
                    <div className="bg-slate-50/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-xs shrink-0">
                          <Clock size={15} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">{timeLeft.isEnded ? "Đã kết thúc" : "Còn lại"}</span>
                          <span className="text-[11px] text-slate-400 font-mono block">{new Date(auction.endAt).toLocaleTimeString("vi-VN")} · {new Date(auction.endAt).toLocaleDateString("vi-VN")}</span>
                        </div>
                      </div>
                      {timeLeft.isEnded ? (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 text-slate-700">Phiên đã kết thúc</span>
                      ) : (
                        <div className="flex items-center gap-1.5 font-mono self-start sm:self-auto">
                          {timeLeft.days > 0 && (<><div className={`px-2.5 py-1 rounded-lg border text-center ${timerBg}`}><span className="text-base font-black tabular-nums block leading-tight">{timeLeft.days}</span><span className="text-[9px] uppercase tracking-wider opacity-75 block font-sans">ngày</span></div><span className="text-slate-300 font-bold">:</span></>)}
                          <div className={`px-2.5 py-1 rounded-lg border text-center ${timerBg}`}><span className="text-base font-black tabular-nums block leading-tight">{String(timeLeft.hours).padStart(2, "0")}</span><span className="text-[9px] uppercase tracking-wider opacity-75 block font-sans">giờ</span></div>
                          <span className="text-slate-300 font-bold">:</span>
                          <div className={`px-2.5 py-1 rounded-lg border text-center ${timerBg}`}><span className="text-base font-black tabular-nums block leading-tight">{String(timeLeft.minutes).padStart(2, "0")}</span><span className="text-[9px] uppercase tracking-wider opacity-75 block font-sans">phút</span></div>
                          <span className="text-slate-300 font-bold">:</span>
                          <div className={`px-2.5 py-1 rounded-lg border text-center ${timerBg} ${isUrgentRed ? "animate-pulse" : ""}`}><span className="text-base font-black tabular-nums block leading-tight">{String(timeLeft.seconds).padStart(2, "0")}</span><span className="text-[9px] uppercase tracking-wider opacity-75 block font-sans">giây</span></div>
                        </div>
                      )}
                    </div>

                    {/* Quick Rules Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      {!isDutch ? (
                        <>
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-medium">Bước giá tối thiểu</span>
                            <span className="font-mono font-bold text-[#001743] tabular-nums mt-0.5 block">+{formatPrice(auction.minBidStep || 500_000)}</span>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-medium">Tăng tối đa 1 lượt</span>
                            <span className="font-mono font-bold text-[#001743] tabular-nums mt-0.5 block">+{formatPrice((auction.maxStepMultiplier || 10) * (auction.minBidStep || 500_000))}</span>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-medium">Tiền đặt cọc</span>
                            <span className="font-mono font-bold text-[#001743] tabular-nums mt-0.5 block">{auction.depositAmount > 0 ? formatPrice(auction.depositAmount) : "Miễn cọc"}</span>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-medium">Gia hạn phút chót</span>
                            <span className="font-mono font-bold text-[#001743] tabular-nums mt-0.5 block">+{auction.extensionDurationSeconds || 30}s / lần</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-medium">Mức giảm định kỳ</span>
                            <span className="font-mono font-bold text-rose-600 tabular-nums mt-0.5 block">-{formatPrice(auction.dutchDecreaseAmount || 0)}</span>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-medium">Chu kỳ hạ giá</span>
                            <span className="font-mono font-bold text-[#001743] tabular-nums mt-0.5 block">Mỗi {auction.dutchDecreaseIntervalSeconds || 60}s</span>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-medium">Giá sàn bảo lưu</span>
                            <span className="font-mono font-bold text-[#001743] tabular-nums mt-0.5 block">{formatPrice(auction.reservePrice)}</span>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-medium">Tiền đặt cọc</span>
                            <span className="font-mono font-bold text-[#001743] tabular-nums mt-0.5 block">{auction.depositAmount > 0 ? formatPrice(auction.depositAmount) : "Miễn cọc"}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Bidding / Dutch Buy Form */}
                    {auction.auctionStatus === "ACTIVE" && !timeLeft.isEnded ? (
                      !isDutch ? (
                        <form onSubmit={handlePlaceBid} className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold text-[#001743]">Mức giá bạn muốn trả (VNĐ) <span className="text-rose-500">*</span></label>
                              <span className="text-[11px] text-slate-400 font-mono">Min: <strong className="text-slate-600">{formatPrice(auction.currentPrice + (auction.minBidStep || 500_000))}</strong></span>
                            </div>
                            <div className="relative">
                              <input
                                type="text"
                                value={bidAmountInput}
                                onChange={(e) => handleInputChange(e.target.value)}
                                placeholder="Nhập mức giá"
                                className={`w-full py-3 pl-4 pr-12 text-xl font-black font-mono text-[#001743] bg-white border rounded-xl outline-none transition-colors duration-150 ${inputError ? "border-rose-400 ring-2 ring-rose-100" : "border-slate-300 focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10"}`}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₫</span>
                            </div>
                            {inputError && <p className="text-xs text-rose-600 mt-1.5 font-medium">{inputError}</p>}
                          </div>

                          <div>
                            <span className="text-[11px] font-semibold text-slate-500 mb-2 block">Cộng nhanh:</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {quickAddSteps.map((chip, idx) => (
                                <button key={idx} type="button" onClick={() => handleQuickAdd(chip.val)} className="py-2 px-2 text-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#001743] hover:text-white hover:border-[#001743] transition-colors duration-150 cursor-pointer shadow-xs select-none">
                                  <span className="text-xs font-bold block">{chip.label}</span>
                                  <span className="text-[10px] font-mono opacity-80 block">{chip.amountText}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {!isLoggedIn ? (
                            <Link href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`} className="w-full py-3.5 px-6 bg-[#001743] hover:bg-[#00266B] text-white font-bold text-sm rounded-xl text-center block shadow-md transition-colors active:scale-[0.99]">Đăng nhập để trả giá</Link>
                          ) : !auction.isUserRegistered && auction.depositAmount > 0 ? (
                            <div className="space-y-3">
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-center gap-2">
                                <Lock size={15} className="text-amber-700 shrink-0" />
                                <span>Yêu cầu đặt cọc <strong>{formatPrice(auction.depositAmount)}</strong>. Hoàn 100% nếu không trúng.</span>
                              </div>
                              <button type="button" onClick={handleRegisterParticipant} disabled={registering} className="w-full py-3.5 px-6 bg-[#001743] hover:bg-[#00266B] active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-50">
                                {registering ? <RefreshCw size={15} className="animate-spin" /> : <Wallet size={15} />}
                                <span>{registering ? "Đang xác nhận…" : `Đặt cọc (${formatPrice(auction.depositAmount)})`}</span>
                              </button>
                            </div>
                          ) : (
                            <button type="submit" disabled={bidding} className="w-full py-3.5 px-6 bg-[#E4011E] hover:bg-[#C00119] active:scale-[0.99] text-white font-black text-base rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2.5 uppercase tracking-wide shadow-md disabled:opacity-50 select-none">
                              {bidding ? <RefreshCw size={18} className="animate-spin" /> : <Gavel size={18} />}
                              <span>{bidding ? "Đang gửi…" : `Đặt giá — ${bidAmountInput || "0"} ₫`}</span>
                            </button>
                          )}
                        </form>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                              <TrendingDown size={14} className="text-amber-700" />
                              <span>Người đầu tiên bấm mua sẽ thắng</span>
                            </div>
                            <p className="text-slate-600 text-xs leading-relaxed">
                              Giá đang giảm dần. Nếu <strong className="text-[#001743] font-mono">{formatPrice(auction.currentPrice)}</strong> phù hợp, bấm <strong>Mua ngay</strong> để sở hữu.
                            </p>
                          </div>

                          {!isLoggedIn ? (
                            <Link href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`} className="w-full py-3.5 px-6 bg-[#001743] hover:bg-[#00266B] text-white font-bold text-sm rounded-xl text-center block shadow-md transition-colors active:scale-[0.99]">Đăng nhập để mua</Link>
                          ) : !auction.isUserRegistered && auction.depositAmount > 0 ? (
                            <div className="space-y-3">
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                                <Lock size={15} className="text-amber-700 shrink-0" />
                                <span>Yêu cầu đặt cọc <strong>{formatPrice(auction.depositAmount)}</strong> trước khi mua.</span>
                              </div>
                              <button type="button" onClick={handleRegisterParticipant} disabled={registering} className="w-full py-3.5 px-6 bg-[#001743] hover:bg-[#00266B] active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-50">
                                {registering ? <RefreshCw size={15} className="animate-spin" /> : <Wallet size={15} />}
                                <span>{registering ? "Đang xác nhận…" : `Đặt cọc (${formatPrice(auction.depositAmount)})`}</span>
                              </button>
                            </div>
                          ) : (
                            <button type="button" onClick={handleOpenDutchConfirm} disabled={acceptingDutchBuy} className="w-full py-3.5 px-6 bg-[#E4011E] hover:bg-[#C00119] active:scale-[0.99] text-white font-black text-base rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2.5 shadow-md disabled:opacity-50 select-none">
                              {acceptingDutchBuy ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                              <span>{acceptingDutchBuy ? "Đang xác nhận…" : `Mua ngay — ${formatPrice(auction.currentPrice)}`}</span>
                            </button>
                          )}
                        </div>
                      )
                    ) : (
                      <PostAuctionSettlementTerminal
                        auction={auction}
                        currentUser={currentUser}
                        isLoggedIn={isLoggedIn}
                        mySettlement={mySettlement}
                        onRefresh={() => fetchAuctionData(true)}
                        onOpenDeposit={(amt) => {
                          if (amt && amt > 0) setDepositInitialAmount(amt);
                          setDepositModalOpen(true);
                        }}
                        addToast={addToast}
                      />
                    )}
                  </div>
                </div>

                {/* ── 3. AUCTION RULES & MECHANISM EXPLANATION ── */}
                <CollapsibleSection
                  title={isDutch ? "Quy Chế Đấu Giá Hà Lan (Giảm Dần)" : "Quy Chế Đấu Giá Kiểu Anh (Tăng Dần)"}
                  icon={isDutch ? <TrendingDown size={16} /> : <Scale size={16} />}
                  badge={<span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">Quy định phiên</span>}
                >
                  <div className="p-5 space-y-5">
                    {/* Mechanism Explanation */}
                    <div className="p-4 bg-blue-50/70 border border-blue-200/70 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5"><BookOpen size={16} /></div>
                        <div>
                          <h4 className="font-bold text-xs text-blue-900 mb-1">
                            {isDutch ? "Cơ chế Đấu giá Hà Lan hoạt động như thế nào?" : "Cơ chế Đấu giá Kiểu Anh hoạt động như thế nào?"}
                          </h4>
                          <p className="text-[12px] text-blue-800 leading-relaxed">
                            {isDutch
                              ? "Giá niêm yết bắt đầu từ mức cao nhất (giá khởi điểm) và tự động giảm đều đặn theo từng chu kỳ thời gian. Người tham gia đầu tiên bấm \"Mua ngay\" tại mức giá đang hiển thị sẽ lập tức giành quyền sở hữu số SIM và phiên kết thúc ngay. Nếu không ai bấm mua và giá giảm chạm giá sàn bảo lưu, phiên tự động đóng."
                              : "Giá khởi điểm bắt đầu từ mức thấp nhất. Người tham gia lần lượt trả giá cao hơn, mỗi lượt phải tăng ít nhất bằng bước giá tối thiểu. Khi hết thời gian, người đang giữ mức giá cao nhất sẽ giành quyền sở hữu SIM. Nếu có lượt trả giá ở những giây cuối phiên, hệ thống tự động gia hạn thêm thời gian để đảm bảo công bằng (Anti-Sniping)."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Rules Grid */}
                    {isDutch ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Giá khởi điểm (Trần)</span>
                          <div className="font-mono text-lg font-bold text-[#001743] tabular-nums">{formatPrice(auction.startingPrice)}</div>
                          <span className="text-[11px] text-slate-400 mt-1 block">Mức giá cao nhất khi mở phiên</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Tốc độ giảm giá</span>
                          <div className="font-mono text-lg font-bold text-rose-600 tabular-nums">-{formatPrice(auction.dutchDecreaseAmount || 0)}</div>
                          <span className="text-[11px] text-slate-500 mt-1 block">Mỗi <strong>{auction.dutchDecreaseIntervalSeconds || 60} giây</strong> hạ 1 lần</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Giá sàn bảo lưu</span>
                          <div className="font-mono text-lg font-bold text-[#001743] tabular-nums">{formatPrice(auction.reservePrice)}</div>
                          <span className="text-[11px] text-slate-400 mt-1 block">Mức giá tối thiểu người bán chấp nhận</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bước giá tối thiểu</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">Mỗi lượt</span>
                          </div>
                          <div className="font-mono text-lg font-bold text-[#001743] tabular-nums">+{formatPrice(auction.minBidStep || 0)}</div>
                          <p className="text-[11px] text-slate-400 mt-1">Mức tăng tối thiểu mỗi lần trả giá</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Giới hạn 1 lượt</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70">Chống nhầm</span>
                          </div>
                          <div className="font-mono text-lg font-bold text-[#001743] tabular-nums">Tối đa {auction.maxStepMultiplier || 10}× bước</div>
                          <p className="text-[11px] text-slate-400 mt-1">= Tối đa +{formatPrice((auction.maxStepMultiplier || 10) * (auction.minBidStep || 0))} / lượt</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Anti-Sniping</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">Công bằng</span>
                          </div>
                          <div className="font-mono text-lg font-bold text-[#001743] tabular-nums">+{auction.extensionDurationSeconds || 30}s</div>
                          <p className="text-[11px] text-slate-400 mt-1">Gia hạn khi có bid ở 60s cuối (tối đa {auction.maxSnipeExtensionsPerParticipant || 3} lần/người)</p>
                        </div>
                      </div>
                    )}

                    {/* Financial Obligations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-slate-700">Tiền đặt cọc</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">Hoàn 100%</span>
                        </div>
                        <div className="font-mono text-xl font-black text-[#001743] tabular-nums">{auction.depositAmount > 0 ? formatPrice(auction.depositAmount) : "Miễn cọc"}</div>
                        <p className="text-[11px] text-slate-500 leading-relaxed mt-2 pt-2 border-t border-slate-100">Tạm khóa trong ví TrustSim. Tự động hoàn lại 100% nếu bạn không trúng phiên.</p>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-slate-700">Thời hạn thanh toán</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Tất toán</span>
                        </div>
                        <div className="font-mono text-xl font-black text-[#001743] tabular-nums">{auction.paymentGracePeriodHours || 24} giờ</div>
                        <p className="text-[11px] text-slate-500 leading-relaxed mt-2 pt-2 border-t border-slate-100">Thời hạn hoàn tất thanh toán phần còn lại và sang tên SIM chính chủ.</p>
                      </div>
                    </div>

                    {/* Trust Guarantees */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { icon: <ShieldCheck size={15} />, color: "text-emerald-600 bg-emerald-50 border-emerald-200/60", title: "Hoàn cọc 100%", desc: "Tự động mở khóa ngay sau phiên nếu không trúng." },
                        { icon: <CheckCircle2 size={15} />, color: "text-blue-600 bg-blue-50 border-blue-200/60", title: "Ký quỹ an toàn", desc: "Tiền ký quỹ tại sàn, chỉ giải ngân sau sang tên." },
                        { icon: <Lock size={15} />, color: "text-slate-700 bg-slate-100 border-slate-200", title: "Minh bạch", desc: "Ghi nhận mọi lượt vào lệnh, chống gian lận." },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`w-7 h-7 rounded-lg ${item.color} flex items-center justify-center shrink-0 border mt-0.5`}>{item.icon}</div>
                          <div>
                            <span className="font-bold text-xs text-[#001743] block">{item.title}</span>
                            <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleSection>

                {/* ── 4. SIM INFO ── */}
                <CollapsibleSection title="Thông Tin Số SIM" icon={<FileText size={16} />} defaultOpen={false}>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { label: "Số thuê bao", value: auction.simPhoneNumber, mono: true },
                        { label: "Nhà mạng", value: auction.carrierName },
                        { label: "Loại hình", value: "SIM vật lý & eSIM" },
                        ...(auction.formatRhythmName ? [{ label: "Thế số", value: auction.formatRhythmName }] : []),
                      ].map((item, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[11px] text-slate-400 font-medium block">{item.label}</span>
                          <span className={`font-bold text-[#001743] text-xs mt-0.5 block ${(item as any).mono ? "font-mono" : ""}`}>{item.value}</span>
                        </div>
                      ))}
                      {auction.categories && auction.categories.length > 0 && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                          <span className="text-[11px] text-slate-400 font-medium block">Phân loại</span>
                          <span className="font-bold text-[#001743] text-xs mt-0.5 block">{auction.categories.join(", ")}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5">
                      <ShieldCheck size={15} className="text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-blue-900 block text-xs">Cam kết pháp lý</span>
                        <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">Số SIM đã qua kiểm tra đối soát, nguyên phôi sạch, không nợ cước, hỗ trợ sang tên chính chủ.</p>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* ── 5. SELLER INFO ── */}
                <CollapsibleSection title="Thông Tin Người Bán" icon={<BadgeCheck size={16} />} defaultOpen={false}>
                  <div className="p-5 space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-full bg-[#001743] text-white flex items-center justify-center font-bold text-sm">{auction.authorName?.charAt(0) || "T"}</div>
                        <div>
                          <div className="font-bold text-xs text-[#001743] flex items-center gap-1.5">
                            <span>{auction.authorName || "Đối tác TrustSim"}</span>
                            <BadgeCheck size={14} className="text-blue-600" />
                          </div>
                          <span className="text-[11px] text-slate-500">Đã xác minh căn cước chính chủ</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Đã xác minh</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 text-[11px] leading-relaxed">
                      Người bán đã ký cam kết bảo đảm chuyển nhượng và tuân thủ quy chế giao dịch của TrustSim.
                    </div>
                  </div>
                </CollapsibleSection>
              </div>

              {/* ═══ RIGHT COLUMN: BID HISTORY ═══ */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden sticky top-24">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    {auction.auctionStatus === "ACTIVE" && !timeLeft.isEnded ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ) : (
                      <Radio size={14} className="text-slate-400" />
                    )}
                    <h3 className="font-bold text-xs text-[#001743]">{isDutch ? "Diễn biến phiên" : "Lịch sử trả giá"}</h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">{bids.length} lượt</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-[calc(100vh-220px)] min-h-[380px] overflow-y-auto">
                  {bids.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 space-y-2">
                      <Gavel size={24} className="mx-auto text-slate-300" />
                      <p className="text-xs font-semibold text-slate-600">{isDutch ? "Chưa có người mua" : "Chưa có lượt trả giá"}</p>
                      <p className="text-[11px] text-blue-600 font-semibold">
                        {isDutch ? `Giá hiện tại: ${formatPrice(auction.currentPrice)} — bấm Mua ngay!` : "Hãy là người đầu tiên!"}
                      </p>
                    </div>
                  ) : (
                    bids.map((bid, index) => {
                      const isTop = index === 0;
                      const isNewlyAdded = bid.id === newestBidId;
                      const avatar = getAvatarStyle(bid.userNameMasked);
                      return (
                        <div key={bid.id} className={`flex items-center justify-between px-5 py-3.5 transition-colors ${isNewlyAdded ? "bg-amber-50/80" : isTop ? "bg-amber-50/40" : "hover:bg-slate-50/80"}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-slate-200" style={{ backgroundColor: avatar.bg, color: avatar.text }}>
                              {bid.userNameMasked.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-xs text-[#001743] truncate">{bid.userNameMasked}</span>
                                {isTop && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    <Crown size={10} className="text-amber-700" />Dẫn đầu
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {new Date(bid.placedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <div className={`font-mono text-sm font-black tabular-nums ${isTop ? "text-amber-600" : "text-slate-800"}`}>{formatPrice(bid.bidAmount)}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{isTop ? "Đang dẫn đầu" : "Đã bị vượt"}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-start gap-2">
                  <Lock size={13} className="shrink-0 mt-0.5 text-slate-500" />
                  <span>Mọi lệnh giao dịch đều được ghi nhận tự động theo giờ Việt Nam.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
