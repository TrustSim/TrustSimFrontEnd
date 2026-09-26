"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Smartphone,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Gavel,
  Clock,
} from "lucide-react";
import { OwnedSim } from "../../types/types";
import { ToastMessage } from "@/components/ui/Toast";
import { sendSimOwnershipOtp, verifySimOwnership } from "@/services/simService";

interface VerifySimOwnershipModalProps {
  sim: OwnedSim;
  isEkycVerified: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onNavigateToEkyc: () => void;
  onOpenCreateAuction?: (sim: OwnedSim) => void;
  addToast: (t: Omit<ToastMessage, "id">) => void;
}

export default function VerifySimOwnershipModal({
  sim,
  isEkycVerified,
  onClose,
  onSuccess,
  onNavigateToEkyc,
  onOpenCreateAuction,
  addToast,
}: VerifySimOwnershipModalProps) {
  // Steps: 1 = Send OTP, 2 = Verify OTP & Telco check, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [otpCode, setOtpCode] = useState("");
  const [loadingSendOtp, setLoadingSendOtp] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle Send OTP
  const handleSendOtp = async () => {
    if (!isEkycVerified) {
      addToast({
        type: "warning",
        title: "Chưa xác thực tài khoản",
        message: "Bạn cần hoàn tất xác thực danh tính eKYC tài khoản trước khi đối soát SIM.",
      });
      return;
    }

    setLoadingSendOtp(true);
    try {
      const res = await sendSimOwnershipOtp(sim.simNumber);
      setCooldown(res.cooldownSeconds || 60);
      setStep(2);
      addToast({
        type: "success",
        title: "Đã gửi mã OTP",
        message: res.message || `Mã OTP đã được gửi tới số ${sim.simNumber}. Vui lòng kiểm tra tin nhắn.`,
      });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Không thể gửi OTP",
        message: err.message || "Đã có lỗi xảy ra khi gửi mã OTP. Vui lòng thử lại sau.",
      });
    } finally {
      setLoadingSendOtp(false);
    }
  };

  // Handle Verify OTP & Telco check
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      addToast({
        type: "warning",
        title: "Mã OTP chưa đủ",
        message: "Vui lòng nhập đầy đủ mã OTP nhận được từ tin nhắn SMS.",
      });
      return;
    }

    setLoadingVerify(true);
    try {
      const res = await verifySimOwnership(sim.simNumber, otpCode);
      if (res.isSuccess) {
        setStep(3);
        onSuccess();
        addToast({
          type: "success",
          title: "Xác thực chính chủ thành công",
          message: res.message || `Số SIM ${sim.simNumber} đã được xác thực chính chủ thành công với cổng viễn thông.`,
        });
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Xác thực thất bại",
        message: err.message || "Mã OTP không chính xác hoặc thông tin thuê bao không trùng khớp.",
      });
    } finally {
      setLoadingVerify(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-[20px] w-full max-w-[480px] shadow-2xl border border-slate-100 animate-fade-up flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/logo/S-Logo.png" alt="TrustSIM" className="w-7 h-7 object-contain shrink-0" />
            <div>
              <h3 className="text-base font-black text-[#001743] tracking-tight m-0">
                Xác thực SIM chính chủ
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Đối soát Cổng viễn thông Nhà mạng
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* SIM Info Card */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 rounded-[14px] border border-blue-100/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white shadow-2xs border border-blue-100 flex items-center justify-center text-[#001743]">
                <Smartphone size={20} />
              </div>
              <div>
                <div className="font-extrabold text-base text-[#001743] font-mono tracking-wide">
                  {sim.simNumber}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {sim.carrier} • {sim.simType}
                </div>
              </div>
            </div>

            <span className="px-2.5 py-1 bg-amber-100/80 text-amber-800 rounded-full text-[10px] font-bold">
              Chưa xác thực
            </span>
          </div>

          {/* Condition: Tài khoản chưa eKYC */}
          {!isEkycVerified ? (
            <div className="p-4 bg-amber-50/60 rounded-[16px] border border-amber-200/60 flex flex-col gap-3">
              <div className="flex items-start gap-2.5 text-amber-900 text-xs leading-relaxed">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Yêu cầu xác thực tài khoản (eKYC):</strong>
                  <p className="mt-1 text-amber-800 text-[11.5px] leading-relaxed">
                    Theo quy định quản lý viễn thông, bạn cần hoàn tất xác thực danh tính cá nhân (CCCD/eKYC) trên hệ thống TrustSIM trước khi đối soát quyền sở hữu chính chủ của số SIM.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToEkyc();
                }}
                className="w-full py-2.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <ShieldCheck size={14} />
                <span>Đến trang xác thực eKYC ngay</span>
              </button>
            </div>
          ) : step === 1 ? (
            /* Bước 1: Gửi mã OTP SMS (Proof of Possession) */
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-slate-50/80 rounded-[14px] text-xs text-slate-600 leading-relaxed border border-slate-100">
                <p className="m-0">
                  Hệ thống sẽ gửi một mã xác thực OTP 6 chữ số qua tin nhắn SMS tới số SIM{" "}
                  <strong className="text-[#001743] font-mono">{sim.simNumber}</strong>.
                </p>
                <p className="mt-2 mb-0 text-[11px] text-slate-500">
                  Vui lòng đảm bảo SIM đang được lắp vào thiết bị và có thể nhận tin nhắn để hoàn tất xác thực quyền nắm giữ SIM (Proof of Possession).
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loadingSendOtp}
                className="w-full py-3 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-98 disabled:opacity-50"
              >
                {loadingSendOtp ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Đang gửi mã OTP qua SMS...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={14} />
                    <span>Gửi mã xác thực OTP qua SMS</span>
                  </>
                )}
              </button>
            </div>
          ) : step === 2 ? (
            /* Bước 2: Nhập OTP & Đối soát nhà mạng (Proof of Legal Ownership) */
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="p-3 bg-blue-50/60 rounded-[12px] text-xs text-blue-900 leading-relaxed flex items-center gap-2">
                <Clock size={15} className="text-blue-600 shrink-0" />
                <span>
                  Mã OTP đã được gửi tới <strong>{sim.simNumber}</strong>. Vui lòng nhập mã để đối soát chính chủ.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#001743] mb-1.5 text-center">
                  Nhập mã OTP 6 chữ số
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="------"
                  autoFocus
                  className="w-full text-center text-2xl font-mono font-bold tracking-[0.4em] p-3 border border-slate-200 rounded-[12px] text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
                />
              </div>

              {/* Cooldown & Resend button */}
              <div className="flex items-center justify-center gap-2 text-xs">
                {cooldown > 0 ? (
                  <span className="text-slate-400 text-[11px]">
                    Gửi lại mã sau <strong>{cooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loadingSendOtp}
                    className="text-blue-700 hover:text-blue-900 font-bold text-[11px] underline cursor-pointer"
                  >
                    Chưa nhận được mã? Gửi lại OTP
                  </button>
                )}
              </div>

              {/* Loading info when verifying */}
              {loadingVerify && (
                <div className="p-3 bg-purple-50/60 rounded-[12px] text-[11px] text-purple-900 leading-relaxed flex items-center gap-2 animate-pulse">
                  <RefreshCw size={13} className="animate-spin text-purple-600 shrink-0" />
                  <span>
                    Đang đối soát thông tin thuê bao với Cổng viễn thông {sim.carrier}... Vui lòng chờ trong giây lát.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loadingVerify}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={loadingVerify || otpCode.length < 4}
                  className="px-6 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loadingVerify && <RefreshCw size={13} className="animate-spin" />}
                  <span>{loadingVerify ? "Đang đối soát..." : "Xác nhận & Đối soát nhà mạng"}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Bước 3: Thành công (Success) */
            <div className="flex flex-col items-center text-center p-4 gap-3 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h4 className="text-base font-black text-[#001743] m-0">
                  Xác thực chính chủ thành công!
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Số SIM <strong className="text-[#001743] font-mono">{sim.simNumber}</strong> đã được đối soát chính chủ thành công với Cổng viễn thông {sim.carrier}. Bạn có thể mở phiên đấu giá ngay bây giờ.
                </p>
              </div>

              <div className="flex items-center gap-2.5 mt-2 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-bold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                {onOpenCreateAuction && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCreateAuction({
                        ...sim,
                        ownershipStatus: "VERIFIED_OWNER",
                      });
                    }}
                    className="flex-1 py-2.5 bg-[#E4011E] hover:bg-[#B80018] text-white rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <Gavel size={13} />
                    <span>Mở đấu giá ngay</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
