"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { auctionService, AuctionDto, BidDto } from "@/services/auctionService";
import { auctionHubService } from "@/services/auctionHubService";
import { authService } from "@/services/authService";
import { AuthResponseDto } from "@/types/auth";
import { ToastContainer, ToastMessage } from "@/components/ui/Toast";
import { DepositModal } from "@/components/wallet/DepositModal";

/* ─── Flat & Line SVG Icons (Strictly Line / Solid Monochrome, NO 3D) ───── */
const Icons = {
  LiveDot: () => (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-50 scale-150" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E4011E] shadow-[0_0_8px_#E4011E]" />
    </span>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Flame: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  Gavel: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" />
      <path d="m16 16 6-6" />
      <path d="m8 8 6-6" />
      <path d="m9 7 8 8" />
      <path d="m21 11-8-8" />
    </svg>
  ),
  Crown: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  Award: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Lock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  TrendingUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Info: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  Tag: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  ),
};

/* ─── Format Currency Helper ─────────────────────────────────────────────── */
const formatPrice = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

/* ─── Carrier Color Config ────────────────────────────────────────────────── */
const CARRIER_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  Viettel: { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA", dot: "#EF4444", label: "Viettel Telecom" },
  Mobifone: { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE", dot: "#3B82F6", label: "MobiFone" },
  Mobi: { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE", dot: "#3B82F6", label: "MobiFone" },
  Vinaphone: { bg: "#F0F9FF", text: "#0369A1", border: "#BAE6FD", dot: "#0EA5E9", label: "VinaPhone" },
  Vina: { bg: "#F0F9FF", text: "#0369A1", border: "#BAE6FD", dot: "#0EA5E9", label: "VinaPhone" },
  Vietnamobile: { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA", dot: "#F97316", label: "Vietnamobile" },
};

const getCarrierConfig = (name: string = "") => {
  const found = Object.keys(CARRIER_CONFIG).find((k) => name.toLowerCase().includes(k.toLowerCase()));
  return found ? CARRIER_CONFIG[found] : { bg: "#F9FAFB", text: "#374151", border: "#E5E7EB", dot: "#9CA3AF", label: name || "Di động" };
};

/* ─── Deterministic Avatar Color Generator for Light Theme ─────────────────── */
const AVATAR_COLORS = [
  { bg: "#DBEAFE", text: "#1D4ED8" },
  { bg: "#FEE2E2", text: "#B91C1C" },
  { bg: "#D1FAE5", text: "#065F46" },
  { bg: "#FEF3C7", text: "#92400E" },
  { bg: "#EDE9FE", text: "#5B21B6" },
  { bg: "#CCFBF1", text: "#0F766E" },
];

const getAvatarStyle = (name: string = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

/* ─── Count-Up Price Hook (500ms Smooth Easing) ──────────────────────────── */
function useCountUp(target: number, duration: number = 500) {
  const [current, setCurrent] = useState(target);

  useEffect(() => {
    let start = current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(start + diff * eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrent(target);
      }
    };
    const req = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(req);
  }, [target]);

  return current;
}

/* ─── SIM Number Renderer (Clean Monospace, Light Theme) ─────────────── */
function renderDigitalAssetSim(phone: string) {
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 10) {
    const prefix = clean.slice(0, 4);
    const part1 = clean.slice(4, 7);
    const part2 = clean.slice(7);

    return (
      <span className="inline-flex items-baseline gap-2.5 font-mono select-all tracking-wider">
        <span className="text-slate-400 font-semibold text-[0.75em]">{prefix}</span>
        <span className="font-black text-gray-900 tracking-widest">
          {part1} {part2}
        </span>
      </span>
    );
  }

  return (
    <span className="font-mono font-extrabold text-gray-900 tracking-widest">
      {phone}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT: AuctionDetailPage (Fintech Trading Terminal - #001644)
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function AuctionDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Unwrap Next.js 15 params Promise
  const resolvedParams = typeof (params as any)?.then === "function" ? use(params as Promise<{ id: string }>) : (params as { id: string });
  const auctionId = resolvedParams.id;

  // State
  const [auction, setAuction] = useState<AuctionDto | null>(null);
  const [bids, setBids] = useState<BidDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [bidAmountInput, setBidAmountInput] = useState<string>("");
  const [inputError, setInputError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"rules" | "sim_info" | "seller">("rules");

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<AuthResponseDto | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Sync Auth State with localStorage & custom events
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

  // Visual feedback states
  const [priceFlash, setPriceFlash] = useState(false);
  const [antiSnipingFlash, setAntiSnipingFlash] = useState(false);
  const [newestBidId, setNewestBidId] = useState<string | null>(null);
  const previousEndAtRef = useRef<string | null>(null);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isEnded: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: false });

  // Deposit modal
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ─── 1. Load Data ──────────────────────────────────────────────────────────
  const fetchAuctionData = async (isBackground: boolean = false) => {
    try {
      if (!isBackground) setLoading(true);

      const [auctionData, bidsData] = await Promise.all([
        auctionService.getAuctionById(auctionId),
        auctionService.getAuctionBids(auctionId, 40),
      ]);

      // Check if price changed
      setAuction((prev) => {
        if (prev && prev.currentPrice !== auctionData.currentPrice) {
          setPriceFlash(true);
          setTimeout(() => setPriceFlash(false), 1200);
        }
        return auctionData;
      });

      // Check if anti-sniping extension occurred
      if (previousEndAtRef.current && previousEndAtRef.current !== auctionData.endAt) {
        setAntiSnipingFlash(true);
        setTimeout(() => setAntiSnipingFlash(false), 4500);
      }
      previousEndAtRef.current = auctionData.endAt;

      // Check newest bid
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

      if (!isBackground) {
        const nextPrice = auctionData.currentPrice + (auctionData.minBidStep || 500_000);
        setBidAmountInput(nextPrice.toLocaleString("vi-VN"));
      }
    } catch (err: any) {
      if (!isBackground) {
        addToast({
          type: "error",
          title: "Không thể tải phiên đấu giá",
          message: err.message || "Vui lòng kiểm tra lại đường truyền mạng.",
        });
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctionData(false);
  }, [auctionId]);

  // ─── 1.1. SignalR WebSockets Real-time Stream (Thay thế hoàn toàn Polling) ──
  useEffect(() => {
    let isSubscribed = true;

    const setupRealtime = async () => {
      try {
        await auctionHubService.joinAuction(auctionId);
        if (!isSubscribed) return;

        // 1. Lắng nghe lượt trả giá mới theo thời gian thực
        auctionHubService.onNewBid((newBid, newCurrentPrice, totalBidsCount) => {
          if (!isSubscribed) return;

          // Kích hoạt hiệu ứng phát sáng giá nhảy
          setPriceFlash(true);
          setTimeout(() => setPriceFlash(false), 1200);

          // Cập nhật giá hiện tại và tổng số lượt trả
          setAuction((prev) =>
            prev
              ? {
                  ...prev,
                  currentPrice: newCurrentPrice,
                  totalBids: totalBidsCount,
                }
              : null
          );

          // Chèn lượt trả giá mới lên đầu Orderbook (đánh dấu OUTBID cho các lượt cũ)
          setBids((prev) => [
            newBid,
            ...prev
              .filter((b) => b.id !== newBid.id)
              .map((b) => ({ ...b, status: "OUTBID" })),
          ]);
          setNewestBidId(newBid.id);
          setTimeout(() => setNewestBidId(null), 3000);

          // Tự động cập nhật gợi ý mức giá tiếp theo trên ô input
          setBidAmountInput((prevVal) => {
            const minStep = auction?.minBidStep || 500_000;
            return (newCurrentPrice + minStep).toLocaleString("vi-VN");
          });
        });

        // 2. Lắng nghe gia hạn Anti-Sniping giờ chót
        auctionHubService.onAuctionExtended((newEndAtStr, extensionSecs) => {
          if (!isSubscribed) return;
          setAuction((prev) => (prev ? { ...prev, endAt: newEndAtStr } : null));
          setAntiSnipingFlash(true);
          setTimeout(() => setAntiSnipingFlash(false), 5000);
        });

        // 3. Lắng nghe thay đổi trạng thái phiên
        auctionHubService.onAuctionStatusChanged((aId, newStatus) => {
          if (!isSubscribed || aId !== auctionId) return;
          setAuction((prev) => (prev ? { ...prev, auctionStatus: newStatus as any } : null));
        });
      } catch (err) {
        console.warn("[SignalR] Không thể kết nối Socket:", err);
      }
    };

    setupRealtime();

    return () => {
      isSubscribed = false;
      auctionHubService.leaveAuction(auctionId);
      auctionHubService.removeAuctionListeners();
    };
  }, [auctionId, auction?.minBidStep]);

  // ─── 2. Real-time Countdown Timer ────────────────────────────────────────
  useEffect(() => {
    if (!auction?.endAt) return;
    const target = new Date(auction.endAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isEnded: false });
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [auction?.endAt]);

  // Smooth Count-Up for current price (500ms)
  const animatedPrice = useCountUp(auction?.currentPrice || 0, 500);

  // ─── 3. Handlers ────────────────────────────────────────────────────────
  const handleQuickAdd = (increment: number) => {
    if (!auction) return;
    const current = auction.currentPrice;
    const newBid = current + increment;
    setBidAmountInput(newBid.toLocaleString("vi-VN"));
    setInputError("");
  };

  const handleInputChange = (val: string) => {
    const raw = val.replace(/\D/g, "");
    if (!raw) {
      setBidAmountInput("");
      return;
    }
    const num = parseInt(raw, 10);
    setBidAmountInput(num.toLocaleString("vi-VN"));

    if (auction) {
      const minAllowed = auction.currentPrice + (auction.minBidStep || 500_000);
      if (num < minAllowed) {
        setInputError(`Giá đặt tối thiểu phải là ${formatPrice(minAllowed)}`);
      } else {
        setInputError("");
      }
    }
  };

  const handleRegisterParticipant = async () => {
    if (!isLoggedIn) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setRegistering(true);
    try {
      await auctionService.registerParticipant(auctionId);
      addToast({
        type: "success",
        title: "Đăng ký thành công",
        message: "Bạn đã được cấp quyền tham gia trả giá trong phiên đấu giá này!",
        duration: 4000,
      });
      setAuction((prev) => (prev ? { ...prev, isUserRegistered: true } : null));
    } catch (err: any) {
      const msg = err.message || "Vui lòng kiểm tra lại số dư ví hoặc liên hệ hỗ trợ.";
      addToast({
        type: "error",
        title: "Đăng ký không thành công",
        message: msg,
        duration: 5000,
      });
      if (msg.includes("Số dư") || msg.includes("không đủ") || msg.includes("nạp thêm")) {
        setTimeout(() => {
          setDepositModalOpen(true);
        }, 1200);
      }
    } finally {
      setRegistering(false);
    }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auction) return;

    if (!isLoggedIn) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    const raw = bidAmountInput.replace(/\D/g, "");
    if (!raw) {
      setInputError("Vui lòng nhập số tiền hợp lệ.");
      return;
    }

    const amount = parseInt(raw, 10);
    const minAllowed = auction.currentPrice + (auction.minBidStep || 500_000);

    if (amount < minAllowed) {
      setInputError(`Mức giá tối thiểu hợp lệ là ${formatPrice(minAllowed)}`);
      return;
    }

    setBidding(true);
    setInputError("");

    try {
      const newBid = await auctionService.placeBid(auctionId, amount);
      addToast({
        type: "success",
        title: "Đặt giá thành công!",
        message: `Bạn đang tạm dẫn đầu phiên đấu giá với mức giá ${formatPrice(amount)}.`,
        duration: 4000,
      });

      // Update state locally
      setAuction((prev) => (prev ? { ...prev, currentPrice: newBid.bidAmount, totalBids: prev.totalBids + 1 } : null));
      setBids((prev) => [newBid, ...prev.map((b) => ({ ...b, status: "OUTBIB" }))]);
      setNewestBidId(newBid.id);

      // Prepare next bid suggestion
      const nextSuggested = newBid.bidAmount + (auction.minBidStep || 500_000);
      setBidAmountInput(nextSuggested.toLocaleString("vi-VN"));
      setInputError("");

      // Re-fetch to ensure sync
      fetchAuctionData(true);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Đặt giá thất bại",
        message: err.message || "Không thể gửi lượt trả giá. Vui lòng kiểm tra lại số dư hoặc thử lại.",
        duration: 5000,
      });
    } finally {
      setBidding(false);
    }
  };

  // ─── Urgency Level Calculation ──────────────────────────────────────────
  const isUrgentAmber = !timeLeft.isEnded && timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes < 5 && timeLeft.minutes >= 1;
  const isUrgentRed = !timeLeft.isEnded && timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0;

  const carrierConfig = getCarrierConfig(auction?.carrierName);

  /* ─── STATUS HELPERS ───────────────────────────────────────────────────── */
  const statusBadge = () => {
    if (auction?.auctionStatus === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <Icons.LiveDot /> Đang diễn ra
        </span>
      );
    }
    if (auction?.auctionStatus === "SCHEDULE") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Icons.Clock /> Sắp diễn ra
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
        Đã kết thúc
      </span>
    );
  };

  const countdownColor = isUrgentRed
    ? { num: "text-red-600", bg: "bg-red-50 border-red-200", label: "text-red-400" }
    : isUrgentAmber
    ? { num: "text-amber-600", bg: "bg-amber-50 border-amber-200", label: "text-amber-400" }
    : { num: "text-gray-900", bg: "bg-gray-50 border-gray-200", label: "text-gray-400" };

  return (
    <div className="min-h-screen bg-[#F9FAFB]" style={{ color: "#111827" }}>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        initialAmount={auction?.depositAmount || 500_000}
        onSuccess={() => {
          addToast({
            type: "success",
            title: "Nạp tiền thành công",
            message: "Số dư ví đã được cập nhật, bạn có thể tiến hành đặt cọc ngay!",
          });
        }}
      />
      <Navbar />

      <main className="pt-20 pb-20">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">

          {/* ─── Breadcrumb ─── */}
          <div className="flex items-center justify-between py-4 mb-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Link href="/" className="hover:text-gray-900 transition-colors">Trang chủ</Link>
              <span className="text-gray-300">/</span>
              <Link href="/auctions" className="hover:text-gray-900 transition-colors">Sàn Đấu Giá</Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-800 font-medium">
                {auction ? auction.auctionCode : "Chi tiết phiên"}
              </span>
            </div>

            <button
              onClick={() => fetchAuctionData(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded transition-all cursor-pointer"
            >
              <Icons.Refresh /> Làm mới
            </button>
          </div>

          {loading ? (
            /* Skeleton */
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
              <div className="space-y-5">
                <div className="h-56 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-72 bg-gray-100 rounded-lg animate-pulse" />
              </div>
              <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ) : !auction ? (
            /* Not Found */
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center max-w-lg mx-auto mt-12">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl border border-red-200">!</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy phiên đấu giá</h2>
              <p className="text-sm text-gray-500 mb-6">Phiên đấu giá này không tồn tại hoặc đã bị gỡ khỏi sàn giao dịch.</p>
              <Link href="/auctions" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-md transition-colors">
                <Icons.ArrowLeft /> Quay lại danh sách
              </Link>
            </div>
          ) : (
            /* ════ 2-COLUMN LAYOUT (65% / 35%) ════ */
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">

              {/* ════ LEFT COLUMN ════ */}
              <div className="space-y-5">

                {/* ── 1. HERO: SIM INFO ── */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Top accent line — carrier color */}
                  <div className="h-1" style={{ backgroundColor: carrierConfig.dot }} />

                  <div className="p-6 sm:p-8">
                    {/* Status + badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                      {statusBadge()}

                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border"
                        style={{ backgroundColor: carrierConfig.bg, color: carrierConfig.text, borderColor: carrierConfig.border }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: carrierConfig.dot }} />
                        {carrierConfig.label}
                      </span>

                      <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                        {auction.auctionType === "DUTCH" ? "Đấu giá Hà Lan" : "Đấu giá Kiểu Anh"}
                      </span>

                      {auction.formatRhythmName && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                          {auction.formatRhythmName}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-gray-50 text-gray-500 border border-gray-200 font-mono">
                        <Icons.Tag /> {auction.auctionCode}
                      </span>
                    </div>

                    {/* Label */}
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                      Số SIM Đấu Giá
                    </p>

                    {/* SIM Number — headline */}
                    <div className="text-4xl sm:text-5xl font-extrabold leading-tight mb-3">
                      {renderDigitalAssetSim(auction.simPhoneNumber)}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-500 leading-relaxed max-w-2xl mb-6">
                      Số SIM VIP thuộc hạ tầng mạng {carrierConfig.label}, niêm yết đấu giá công khai trên hệ thống TrustSim.
                      Toàn bộ quy trình đấu giá được kiểm toán tự động và minh bạch theo thời gian thực.
                    </p>

                    {/* Trust anchors */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-5 border-t border-gray-100 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5"><Icons.ShieldCheck /> Sang tên chính chủ tại điểm GD</span>
                      <span className="flex items-center gap-1.5"><Icons.CheckCircle /> Xác minh danh tính eKYC</span>
                      <span className="flex items-center gap-1.5"><Icons.Lock /> Ký quỹ qua hợp đồng TrustSim</span>
                    </div>
                  </div>
                </div>

                {/* ── 2. BIDDING PANEL ── */}
                <div className={`bg-white border rounded-lg overflow-hidden transition-all duration-300 ${
                  antiSnipingFlash ? "border-emerald-300 ring-2 ring-emerald-200" : "border-gray-200"
                }`}>
                  {/* Panel header bar */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide flex items-center gap-2">
                      <Icons.TrendingUp /> Trả Giá Trực Tiếp
                    </h2>
                    {auction.auctionStatus === "ACTIVE" && !timeLeft.isEnded && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        Đang mở nhận giá
                      </span>
                    )}
                  </div>

                  <div className="p-6 sm:p-8 space-y-6">

                    {/* Anti-Sniping Alert */}
                    {antiSnipingFlash && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-2.5 text-emerald-700 text-sm font-medium">
                        <Icons.Flame />
                        <span>
                          Hệ thống tự động kích hoạt <strong>Anti-Sniping</strong>: Đã gia hạn thêm
                          +{auction.extensionDurationSeconds || 30}s để bảo đảm công bằng.
                        </span>
                      </div>
                    )}

                    {/* Key Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                      {/* Current Price */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                          <Icons.TrendingUp /> Giá Hiện Tại
                        </p>
                        <div
                          className={`text-3xl sm:text-4xl font-black font-mono tabular-nums tracking-tight transition-transform duration-300 ${
                            priceFlash ? "scale-[1.03]" : "scale-100"
                          }`}
                          style={{ color: "#DC2626" }}
                        >
                          {formatPrice(animatedPrice)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1.5">
                          Khởi điểm: <span className="text-gray-600 font-medium">{formatPrice(auction.startingPrice)}</span>
                          &nbsp;·&nbsp;
                          <span className="text-gray-600 font-medium">{bids.length}</span> lượt trả
                        </div>
                      </div>

                      {/* Countdown */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                            <Icons.Clock /> Thời Gian Còn Lại
                          </p>
                          {isUrgentRed && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded animate-pulse">
                              Giây cuối!
                            </span>
                          )}
                          {isUrgentAmber && !isUrgentRed && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              Dưới 5 phút
                            </span>
                          )}
                        </div>
                        {timeLeft.isEnded ? (
                          <div className="text-sm font-semibold text-gray-500 py-2">
                            Phiên đấu giá đã kết thúc
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            {timeLeft.days > 0 && (
                              <>
                                <div className={`px-3 py-2 rounded text-center border font-mono font-black min-w-[48px] ${countdownColor.bg} ${countdownColor.num}`}>
                                  <div className="text-2xl tabular-nums leading-none">{timeLeft.days}</div>
                                  <div className={`text-[9px] font-semibold mt-0.5 uppercase ${countdownColor.label}`}>Ngày</div>
                                </div>
                                <span className="text-gray-300 font-bold text-lg">:</span>
                              </>
                            )}
                            <div className={`px-3 py-2 rounded text-center border font-mono font-black min-w-[48px] ${countdownColor.bg} ${countdownColor.num}`}>
                              <div className={`text-2xl tabular-nums leading-none ${isUrgentRed ? "animate-pulse" : ""}`}>{String(timeLeft.hours).padStart(2, "0")}</div>
                              <div className={`text-[9px] font-semibold mt-0.5 uppercase ${countdownColor.label}`}>Giờ</div>
                            </div>
                            <span className="text-gray-300 font-bold text-lg">:</span>
                            <div className={`px-3 py-2 rounded text-center border font-mono font-black min-w-[48px] ${countdownColor.bg} ${countdownColor.num}`}>
                              <div className={`text-2xl tabular-nums leading-none ${isUrgentRed ? "animate-pulse" : ""}`}>{String(timeLeft.minutes).padStart(2, "0")}</div>
                              <div className={`text-[9px] font-semibold mt-0.5 uppercase ${countdownColor.label}`}>Phút</div>
                            </div>
                            <span className="text-gray-300 font-bold text-lg">:</span>
                            <div className={`px-3 py-2 rounded text-center border font-mono font-black min-w-[48px] ${countdownColor.bg} ${countdownColor.num}`}>
                              <div className={`text-2xl tabular-nums leading-none ${isUrgentRed ? "animate-pulse" : ""}`}>{String(timeLeft.seconds).padStart(2, "0")}</div>
                              <div className={`text-[9px] font-semibold mt-0.5 uppercase ${countdownColor.label}`}>Giây</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick meta strip */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-500 py-3 border-t border-b border-gray-100">
                      <span>
                        Bước giá tối thiểu:&nbsp;
                        <strong className="text-gray-800 font-mono">+{formatPrice(auction.minBidStep || 500_000)}</strong>
                      </span>
                      <span>
                        Tiền cọc:&nbsp;
                        <strong className="text-gray-800 font-mono">
                          {auction.depositAmount > 0 ? formatPrice(auction.depositAmount) : "Miễn phí cọc"}
                        </strong>
                      </span>
                      <span>
                        Người tham gia:&nbsp;
                        <strong className="text-gray-800">{auction.totalParticipants || 0} thành viên</strong>
                      </span>
                    </div>

                    {/* Bidding form */}
                    {auction.auctionStatus === "ACTIVE" && !timeLeft.isEnded ? (
                      <form onSubmit={handlePlaceBid} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            Mức giá bạn muốn trả (VNĐ) <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={bidAmountInput}
                              onChange={(e) => handleInputChange(e.target.value)}
                              placeholder="Nhập mức giá bạn muốn trả"
                              className={`w-full py-3.5 pl-4 pr-14 text-xl font-black font-mono text-gray-900 bg-white border rounded-md outline-none transition-all ${
                                inputError
                                  ? "border-red-400 focus:ring-2 focus:ring-red-200"
                                  : "border-gray-300 focus:border-gray-800 focus:ring-2 focus:ring-gray-100"
                              }`}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">₫</span>
                          </div>
                          {inputError && <p className="text-xs text-red-600 mt-1.5 font-medium">{inputError}</p>}
                        </div>

                        {/* Quick add chips */}
                        <div>
                          <span className="text-xs text-gray-500 mb-2 block font-medium">Chọn nhanh bước giá:</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { label: `+Bước (${formatPrice(auction.minBidStep || 500_000)})`, val: auction.minBidStep || 500_000 },
                              { label: "+10 Triệu", val: 10_000_000 },
                              { label: "+50 Triệu", val: 50_000_000 },
                              { label: "+100 Triệu", val: 100_000_000 },
                            ].map((chip, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleQuickAdd(chip.val)}
                                className="py-2 px-2 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-150 cursor-pointer text-center select-none"
                              >
                                {chip.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* CTA */}
                        {!isLoggedIn ? (
                          <Link
                            href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}
                            className="w-full py-4 px-6 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-md text-center block transition-all"
                          >
                            Đăng nhập để tham gia đấu giá
                          </Link>
                        ) : !auction.isUserRegistered && auction.depositAmount > 0 ? (
                          <button
                            type="button"
                            onClick={handleRegisterParticipant}
                            disabled={registering}
                            className="w-full py-4 px-6 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-md transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            {registering ? "Đang xử lý đăng ký..." : `Đăng ký tham gia (Đặt cọc ${formatPrice(auction.depositAmount)})`}
                          </button>
                        ) : (
                          <button
                            type="submit"
                            disabled={bidding}
                            className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 active:scale-[0.985] text-white font-black text-base rounded-md transition-all duration-150 cursor-pointer flex items-center justify-center gap-2.5 uppercase tracking-wide select-none"
                          >
                            {bidding ? (
                              <>
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Đang gửi lượt trả giá...</span>
                              </>
                            ) : (
                              <>
                                <Icons.Gavel />
                                <span>Đặt giá — {bidAmountInput || "0"} ₫</span>
                              </>
                            )}
                          </button>
                        )}
                      </form>
                    ) : (
                      <div className="py-4 text-center text-sm text-gray-500 font-medium bg-gray-50 rounded-md border border-gray-100">
                        Phiên đấu giá hiện không mở để trả giá trực tiếp.
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 3. TABS: RULES / SIM INFO / SELLER ── */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Tab Nav */}
                  <div className="flex border-b border-gray-200 px-6 gap-6">
                    {(["rules", "sim_info", "seller"] as const).map((tab) => {
                      const labels = { rules: "Quy Chế Đấu Giá", sim_info: "Thông Tin SIM", seller: "Người Bán" };
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`py-4 text-sm font-semibold transition-colors relative cursor-pointer border-b-2 -mb-px ${
                            activeTab === tab
                              ? "text-gray-900 border-gray-900"
                              : "text-gray-400 border-transparent hover:text-gray-700"
                          }`}
                        >
                          {labels[tab]}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-6 sm:p-8">
                    {/* RULES TAB */}
                    {activeTab === "rules" && (
                      <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <h4 className="font-bold text-gray-900 mb-1.5">Cơ chế đấu giá kiểu Anh</h4>
                            <p className="text-sm text-gray-500">
                              Giá khởi điểm từ {formatPrice(auction.startingPrice)}. Các thành viên trả giá công khai tăng dần,
                              mỗi lượt tối thiểu phải cao hơn mức giá hiện tại một bước giá ({formatPrice(auction.minBidStep || 500_000)}).
                            </p>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 mb-1.5">Quy định chống Sniping</h4>
                            <p className="text-sm text-gray-500">
                              Nếu có lượt trả giá trong 60 giây cuối, hệ thống tự động cộng thêm {auction.extensionDurationSeconds || 60} giây
                              để bảo vệ quyền lợi của mọi người tham gia.
                            </p>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                          <h4 className="font-bold text-gray-900 mb-1.5">Hoàn tiền cọc</h4>
                          <p className="text-sm text-gray-500">
                            Người không trúng đấu giá được hoàn 100% tiền đặt cọc vào ví TrustSim trong vòng 24 giờ sau khi phiên kết thúc.
                            Người thắng dùng tiền cọc cấn trừ vào giá trị hợp đồng.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* SIM INFO TAB */}
                    {activeTab === "sim_info" && (
                      <div className="space-y-5">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                          <div className="border-b border-gray-100 pb-3">
                            <p className="text-xs text-gray-400 mb-0.5">Số thuê bao</p>
                            <p className="font-bold text-gray-900 font-mono">{auction.simPhoneNumber}</p>
                          </div>
                          <div className="border-b border-gray-100 pb-3">
                            <p className="text-xs text-gray-400 mb-0.5">Nhà mạng phát hành</p>
                            <p className="font-bold text-gray-900">{carrierConfig.label}</p>
                          </div>
                          <div className="border-b border-gray-100 pb-3">
                            <p className="text-xs text-gray-400 mb-0.5">Tình trạng phôi SIM</p>
                            <p className="font-bold text-gray-900">SIM Vật lý / eSIM</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-md text-sm">
                          <span className="text-emerald-600 mt-0.5"><Icons.ShieldCheck /></span>
                          <div>
                            <p className="font-bold text-emerald-800 mb-1">Cam kết bảo đảm pháp lý từ TrustSim</p>
                            <p className="text-emerald-700 text-xs leading-relaxed">
                              100% số SIM niêm yết đã vượt qua quy trình thẩm định quyền sở hữu, không có tranh chấp,
                              không vướng nợ cước và được bảo hành chuyển quyền sở hữu chính chủ trọn đời.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SELLER TAB */}
                    {activeTab === "seller" && (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                          {auction.authorName?.charAt(0) || "T"}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-base flex items-center gap-2">
                            {auction.authorName || "Đối tác TrustSim"}
                            <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold">
                              Đã xác minh eKYC
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Thành viên uy tín · Đã hoàn tất nhiều phiên đấu giá SIM số đẹp thành công trên sàn
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ════ RIGHT COLUMN: BID FEED ════ */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden sticky top-24">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    {auction.auctionStatus === "ACTIVE" && !timeLeft.isEnded && <Icons.LiveDot />}
                    <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                      Diễn Biến Đấu Giá
                    </h3>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded font-mono">
                    {bids.length} lượt
                  </span>
                </div>

                {/* Bid list */}
                <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
                  {bids.length === 0 ? (
                    <div className="py-14 text-center text-gray-400 text-sm">
                      <div className="flex justify-center mb-2">
                        <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                          <path d="M7 7h.01" />
                        </svg>
                      </div>
                      <p>Chưa có lượt trả giá nào.</p>
                      <p className="text-xs mt-1 text-blue-600 font-semibold">Hãy là người đầu tiên đặt giá!</p>
                    </div>
                  ) : (
                    bids.map((bid, index) => {
                      const isTop = index === 0;
                      const isNewlyAdded = bid.id === newestBidId;
                      const avatar = getAvatarStyle(bid.userNameMasked);

                      return (
                        <div
                          key={bid.id}
                          className={`flex items-center justify-between px-5 py-3.5 transition-colors ${
                            isNewlyAdded
                              ? "bg-amber-50 animate-slide-down"
                              : isTop
                              ? "bg-amber-50"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {/* Left: avatar + user */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                              style={{ backgroundColor: avatar.bg, color: avatar.text }}
                            >
                              {bid.userNameMasked.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-xs text-gray-800 truncate font-mono">
                                  {bid.userNameMasked}
                                </span>
                                {isTop && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    <Icons.Crown /> Dẫn đầu
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-400 mt-0.5">
                                {new Date(bid.placedAt).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Right: amount */}
                          <div className="text-right shrink-0 ml-3">
                            <div className={`font-mono text-sm font-bold tabular-nums ${isTop ? "text-red-600" : "text-gray-700"}`}>
                              {formatPrice(bid.bidAmount)}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {isTop ? "Cao nhất" : "Đã bị vượt"}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer notice */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-400 flex items-start gap-1.5">
                  <Icons.Lock />
                  <span>Mọi dữ liệu trả giá được mã hóa an toàn và kiểm toán tự động theo thời gian thực (UTC+7).</span>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* ─── Keyframe Animations ─────────────────────────────────────── */}
      <style>{`
        @keyframes slide-down {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
