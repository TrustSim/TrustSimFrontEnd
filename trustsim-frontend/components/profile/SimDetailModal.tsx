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
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { OwnedSim } from "../../types/types";
import { aiValuationService, SimValuationDto } from "@/services/aiValuationService";
import { updateSim } from "@/services/simService";
import { ToastMessage } from "@/components/ui/Toast";

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

  // AI Valuation State
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiResult, setAiResult] = useState<SimValuationDto | null>(null);
  const [showAiAnalysisDetail, setShowAiAnalysisDetail] = useState(false);
  const [applyingPrice, setApplyingPrice] = useState(false);
  const [currentEstimatedValue, setCurrentEstimatedValue] = useState<number>(sim.estimatedValue || 0);

  const getReasoningBullets = (text?: string): string[] => {
    if (!text) return [];
    return text
      .split(/(?<=[.?!;])\s+|\n+/)
      .map((s) => s.trim().replace(/^[-*•]\s*/, ""))
      .filter((s) => s.length > 5);
  };

  const handleRunAiValuation = async () => {
    setLoadingAi(true);
    try {
      const res = await aiValuationService.estimatePrice({
        phoneNumber: sim.simNumber.replace(/\D/g, ""),
        simNumberId: sim.id,
      });
      setAiResult(res);
      addToast?.({
        type: "success",
        title: "Định giá AI hoàn tất",
        message: `Đã thẩm định giá cho SIM ${sim.simNumber}: ${res.suggestedPrice?.toLocaleString("vi-VN")} ₫.`,
      });
    } catch (err: any) {
      addToast?.({
        type: "error",
        title: "Không thể định giá bằng AI",
        message: err.message || "Vui lòng thử lại sau.",
      });
    } finally {
      setLoadingAi(false);
    }
  };

  const handleApplyAiPrice = async () => {
    if (!aiResult?.suggestedPrice) return;
    const newPrice = Math.round(aiResult.suggestedPrice);
    setApplyingPrice(true);
    try {
      const isGuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(sim.id);
      if (isGuid) {
        await updateSim(sim.id, {
          price: newPrice,
          phonePrefixId: sim.phonePrefixId,
          formatRhythmId: sim.formatRhythmId,
        });
      }
      setCurrentEstimatedValue(newPrice);
      const updatedSim: OwnedSim = {
        ...sim,
        estimatedValue: newPrice,
      };
      onSimUpdated?.(updatedSim);
      addToast?.({
        type: "success",
        title: "Áp dụng giá thành công",
        message: `Đã cập nhật định giá số SIM ${sim.simNumber} thành ${newPrice.toLocaleString("vi-VN")} ₫.`,
      });
    } catch (err: any) {
      addToast?.({
        type: "error",
        title: "Không thể áp dụng giá",
        message: err.message || "Đã xảy ra lỗi khi lưu mức giá mới.",
      });
    } finally {
      setApplyingPrice(false);
    }
  };

  return (
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

              {/* Nút thẩm định AI ngay trong Hero Card */}
              <button
                type="button"
                onClick={handleRunAiValuation}
                disabled={loadingAi}
                className="relative overflow-hidden group inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-500/20 via-purple-500/25 to-blue-500/20 hover:from-red-500/30 hover:to-purple-500/35 border border-yellow-400/40 hover:border-yellow-400 text-yellow-300 rounded-full text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
                title="Yêu cầu hệ thống AI thẩm định và phân tích giá thị trường"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                {loadingAi ? (
                  <>
                    <RefreshCw size={12} className="animate-spin text-yellow-400" />
                    <span>Đang thẩm định...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} className="text-yellow-400" />
                    <span>Thẩm định AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Skeleton Loading State */}
          {loadingAi && (
            <div className="p-3.5 bg-gradient-to-r from-blue-50/70 via-purple-50/40 to-slate-50/70 rounded-[14px] border border-purple-100/60 animate-pulse transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={13} className="text-[#E4011E] animate-spin" />
                <span className="text-xs font-bold text-[#001743]">
                  AI đang phân tích thế số, phong thủy và đối soát thị trường...
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-200/80 rounded-full w-3/4" />
                <div className="h-2.5 bg-slate-200/60 rounded-full w-1/2" />
              </div>
            </div>
          )}

          {/* Thẻ Kết quả AI Thẩm định */}
          {aiResult && !loadingAi && (
            <div className="p-4 bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-slate-50/80 rounded-[16px] border border-blue-100/70 shadow-xs relative overflow-hidden transition-all animate-fadeIn">
              {/* Header card with S-Logo & Rhythm Badge & Close button */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <img src="/logo/S-Logo.png" alt="TrustSim AI" className="w-4 h-4 object-contain shrink-0" />
                  <span className="text-xs font-bold text-[#001743] shrink-0">
                    Kết quả AI thẩm định chuyên sâu
                  </span>
                  {aiResult.confidenceScore ? (
                    <span className="px-2 py-0.5 bg-emerald-100/80 text-emerald-800 rounded-full text-[10px] font-semibold">
                      Độ tin cậy: {Math.round(aiResult.confidenceScore * 100)}%
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setAiResult(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/50 transition-colors cursor-pointer"
                  title="Đóng kết quả AI"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Giá đề xuất & khoảng giá thị trường kèm nút áp dụng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white/95 p-3 rounded-[12px] border border-blue-100/60 shadow-2xs">
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Mức giá AI đề xuất:</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-black text-[#E4011E] font-mono">
                      {aiResult.suggestedPrice?.toLocaleString("vi-VN")} ₫
                    </span>
                    {currentEstimatedValue !== Math.round(aiResult.suggestedPrice) ? (
                      <button
                        type="button"
                        onClick={handleApplyAiPrice}
                        disabled={applyingPrice}
                        title="Áp dụng mức giá này làm định giá mới của SIM"
                        className="px-2.5 py-1 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-[10px] font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95 shrink-0 disabled:opacity-50"
                      >
                        {applyingPrice ? <RefreshCw size={10} className="animate-spin" /> : <Check size={10} />}
                        <span>Áp dụng giá</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <CheckCircle2 size={10} /> Đã áp dụng
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Khoảng giá thị trường:</div>
                  <div className="text-xs font-bold text-slate-700 font-mono mt-1">
                    {aiResult.minPrice ? aiResult.minPrice.toLocaleString("vi-VN") : "---"} ₫
                    {" – "}
                    {aiResult.maxPrice ? aiResult.maxPrice.toLocaleString("vi-VN") : "---"} ₫
                  </div>
                </div>
              </div>

              {/* 3 Price Tiers Grid (Bán lẻ / P2P / Giá thợ) */}
              <div className="grid grid-cols-3 gap-2 mt-2.5">
                <div className="p-2 bg-white/80 rounded-[10px] border border-slate-100 text-center">
                  <div className="text-[9.5px] text-slate-400 font-medium">Giá bán lẻ (Retail)</div>
                  <div className="text-[11px] font-bold text-[#001743] font-mono mt-0.5">
                    {aiResult.retailPrice
                      ? aiResult.retailPrice.toLocaleString("vi-VN") + " ₫"
                      : (aiResult.suggestedPrice * 1.15).toLocaleString("vi-VN") + " ₫"}
                  </div>
                </div>
                <div className="p-2 bg-blue-50/70 rounded-[10px] border border-blue-100/60 text-center">
                  <div className="text-[9.5px] text-blue-700 font-bold">Giá người dùng (P2P)</div>
                  <div className="text-[11px] font-black text-[#E4011E] font-mono mt-0.5">
                    {aiResult.p2pPrice
                      ? aiResult.p2pPrice.toLocaleString("vi-VN") + " ₫"
                      : aiResult.suggestedPrice.toLocaleString("vi-VN") + " ₫"}
                  </div>
                </div>
                <div className="p-2 bg-white/80 rounded-[10px] border border-slate-100 text-center">
                  <div className="text-[9.5px] text-slate-400 font-medium">Giá thu mua đại lý</div>
                  <div className="text-[11px] font-bold text-slate-600 font-mono mt-0.5">
                    {aiResult.dealerPrice
                      ? aiResult.dealerPrice.toLocaleString("vi-VN") + " ₫"
                      : (aiResult.suggestedPrice * 0.75).toLocaleString("vi-VN") + " ₫"}
                  </div>
                </div>
              </div>

              {/* Accordion Toggle */}
              {aiResult.valuationReasoning && (
                <div className="mt-2.5 pt-2 border-t border-blue-100/50 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAiAnalysisDetail(!showAiAnalysisDetail)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 cursor-pointer transition-colors"
                  >
                    <span>{showAiAnalysisDetail ? "Thu gọn phân tích" : "Xem chi tiết phân tích AI"}</span>
                    {showAiAnalysisDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
              )}

              {/* Accordion Content */}
              {showAiAnalysisDetail && aiResult.valuationReasoning && (
                <div className="mt-2 p-3 bg-white/90 rounded-[12px] border border-blue-100/60 animate-fadeIn space-y-2 text-xs">
                  <div>
                    <div className="text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Sparkles size={11} className="text-[#E4011E]" />
                      <span>Nhận định thẩm định của AI:</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      {getReasoningBullets(aiResult.valuationReasoning).map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {aiResult.fengShuiAnalysis && (
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-amber-950">
                      <span className="font-bold text-amber-900 block mb-0.5">Ý nghĩa phong thủy:</span>
                      <p className="m-0 text-slate-600">{aiResult.fengShuiAnalysis}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
  );
}
