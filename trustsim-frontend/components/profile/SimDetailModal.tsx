"use client";

import React, { useState } from "react";
import {
  X,
  Smartphone,
  ShieldCheck,
  Check,
  Clock,
  Gavel,
  Pencil,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { OwnedSim } from "../../types/types";
import { ToastMessage } from "@/components/ui/Toast";
import AiValuationModal from "./AiValuationModal";

interface SimDetailModalProps {
  sim: OwnedSim;
  onClose: () => void;
  onOpenVerify: (sim: OwnedSim) => void;
  onOpenUpdate: (sim: OwnedSim) => void;
  onOpenDelete: (sim: OwnedSim) => void;
  onOpenCreateAuction: (sim: OwnedSim) => void;
  onSimUpdated?: (updatedSim: OwnedSim) => void;
  addToast?: (t: Omit<ToastMessage, "id">) => void;
}

export default function SimDetailModal({
  sim,
  onClose,
  onOpenVerify,
  onOpenUpdate,
  onOpenDelete,
  onOpenCreateAuction,
  onSimUpdated,
  addToast,
}: SimDetailModalProps) {
  const isOwnerVerified = sim.ownershipStatus === "VERIFIED_OWNER";
  const [currentEstimatedValue, setCurrentEstimatedValue] = useState<number>(sim.estimatedValue || 0);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-[20px] w-full max-w-[540px] shadow-2xl border border-slate-100 animate-fade-up flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header Modal */}
          <div className="flex items-center justify-between p-5 pb-3.5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <img src="/logo/S-Logo.png" alt="TrustSIM" className="w-7 h-7 object-contain shrink-0" />
              <div>
                <h3 className="text-base font-black text-[#001743] tracking-tight m-0">
                  Thông tin chi tiết số SIM
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  Kho tài sản số cá nhân
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

          {/* Modal Body */}
          <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
            {/* Hero SIM Card */}
            <div className="p-4 bg-gradient-to-br from-[#001743] via-[#002266] to-[#010B1B] rounded-[16px] text-white relative overflow-hidden shadow-lg">
              {/* Pattern Overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px)",
                  backgroundSize: "16px 16px",
                  pointerEvents: "none",
                }}
              />

              <div className="relative z-10 flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-yellow-300">
                  {sim.carrier}
                </span>
                {isOwnerVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <Check size={11} strokeWidth={2.5} /> Đã xác thực chính chủ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Clock size={11} strokeWidth={2} /> Chưa xác thực chính chủ
                  </span>
                )}
              </div>

              <div className="relative z-10 text-center py-2">
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-white">
                  {sim.simNumber}
                </div>
                {sim.formatRhythmName && (
                  <div className="mt-1.5">
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-yellow-300 border border-white/15">
                      Thế số: {sim.formatRhythmName}
                    </span>
                  </div>
                )}
              </div>

              <div className="relative z-10 flex items-center justify-between pt-3 mt-2 border-t border-white/15 text-xs">
                <div>
                  <span className="text-slate-300 block text-[10px] uppercase tracking-wider font-mono">
                    Định giá ước tính:
                  </span>
                  <span className="text-lg font-extrabold text-yellow-400 font-mono">
                    {currentEstimatedValue.toLocaleString("vi-VN")} ₫
                  </span>
                </div>

                {/* Nút thẩm định AI mở Modal riêng biệt */}
                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="relative overflow-hidden group inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:brightness-110 border border-white/20 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95"
                  title="Mở bảng thẩm định AI chuyên sâu cho số SIM này"
                >
                  <Sparkles size={12} className="text-yellow-300 animate-pulse" />
                  <span>Thẩm định AI</span>
                </button>
              </div>
            </div>

            {/* Detailed Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-[12px] border border-slate-100">
                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                  <Smartphone size={13} />
                  <span>Loại thuê bao</span>
                </div>
                <div className="text-xs font-bold text-[#001743]">{sim.simType}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-[12px] border border-slate-100">
                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                  <Layers size={13} />
                  <span>Nguồn gốc sở hữu</span>
                </div>
                <div className="text-xs font-bold text-[#001743]">
                  {sim.acquiredFrom === "PLATFORM_AUCTION" ? "Trúng đấu giá sàn" : "Tự thêm cá nhân"}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-[12px] border border-slate-100">
                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                  <Calendar size={13} />
                  <span>Ngày thêm vào kho</span>
                </div>
                <div className="text-xs font-bold text-[#001743]">{sim.createdDate}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-[12px] border border-slate-100">
                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                  <Gavel size={13} />
                  <span>Trạng thái sàn</span>
                </div>
                <div className="text-xs font-bold text-[#001743]">
                  {sim.hasActiveAuction ? "Đang mở đấu giá" : "Trong kho cá nhân"}
                </div>
              </div>
            </div>

            {/* Categories Badges if any */}
            {sim.categoryNames && sim.categoryNames.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-[12px] border border-slate-100">
                <div className="text-[11px] text-slate-400 font-medium mb-1.5">
                  Thể loại số SIM
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sim.categoryNames.map((c, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full text-[11px] font-bold"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Callout if unverified */}
            {!isOwnerVerified && (
              <div className="p-3.5 bg-amber-50/60 rounded-[14px] border border-amber-200/60 flex items-center justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                  <span>SIM cần xác thực chính chủ với nhà mạng để mở phiên đấu giá.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenVerify(sim);
                  }}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-[11px] font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
                >
                  Xác thực ngay
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 px-5 border-t border-slate-100 bg-white flex items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUpdate(sim);
                }}
                className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                title="Chỉnh sửa thông tin SIM"
              >
                <Pencil size={13} />
                <span>Sửa</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDelete(sim);
                }}
                className="inline-flex items-center gap-1 px-3 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                title="Xóa SIM khỏi kho"
              >
                <Trash2 size={13} />
                <span>Xóa</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng
              </button>
              {isOwnerVerified ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCreateAuction(sim);
                  }}
                  className="px-5 py-2 bg-[#E4011E] hover:bg-[#B80018] text-white rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Gavel size={13} />
                  <span>Mở đấu giá</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenVerify(sim);
                  }}
                  className="px-5 py-2 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <ShieldCheck size={13} />
                  <span>Xác thực chính chủ</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Thẩm định AI độc lập ── */}
      {showAiModal && (
        <AiValuationModal
          sim={{ ...sim, estimatedValue: currentEstimatedValue }}
          onClose={() => setShowAiModal(false)}
          onSimUpdated={(updatedSim) => {
            setCurrentEstimatedValue(updatedSim.estimatedValue);
            onSimUpdated?.(updatedSim);
          }}
          addToast={addToast}
        />
      )}
    </>
  );
}
