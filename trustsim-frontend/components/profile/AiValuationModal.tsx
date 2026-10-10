"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  RefreshCw,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  BadgeCheck,
  Zap,
} from "lucide-react";
import { OwnedSim } from "@/types/types";
import { aiValuationService, SimValuationDto } from "@/services/aiValuationService";
import { updateSim } from "@/services/simService";
import { ToastMessage } from "@/components/ui/Toast";

interface AiValuationModalProps {
  sim: OwnedSim;
  onClose: () => void;
  onSimUpdated?: (updatedSim: OwnedSim) => void;
  addToast?: (t: Omit<ToastMessage, "id">) => void;
}

function getReasoningBullets(text?: string): string[] {
  if (!text) return [];
  return text
    .split(/(?<=[.?!;])\s+|\n+/)
    .map((s) => s.trim().replace(/^[-*•]\s*/, ""))
    .filter((s) => s.length > 5);
}

function PriceTierCard({
  label,
  value,
  highlight,
  accent,
}: {
  label: string;
  value?: number;
  highlight?: boolean;
  accent?: string;
}) {
  return (
    <div
      className={`p-2.5 rounded-[10px] border text-center transition-all ${
        highlight
          ? "bg-gradient-to-br from-[#001743] to-[#00266B] border-blue-800/40 shadow-sm"
          : "bg-white/90 border-slate-100"
      }`}
    >
      <div
        className={`text-[9.5px] font-semibold mb-0.5 ${highlight ? "text-blue-200" : "text-slate-400"}`}
      >
        {label}
      </div>
      <div
        className={`text-xs sm:text-[13px] font-black font-mono ${
          highlight ? "text-yellow-300" : accent || "text-[#001743]"
        }`}
      >
        {value ? value.toLocaleString("vi-VN") + " ₫" : "—"}
      </div>
    </div>
  );
}

export default function AiValuationModal({
  sim,
  onClose,
  onSimUpdated,
  addToast,
}: AiValuationModalProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<SimValuationDto | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const detailRef = React.useRef<HTMLDivElement>(null);
  const [applyingPrice, setApplyingPrice] = useState(false);
  const [appliedPrice, setAppliedPrice] = useState<number | null>(null);

  const handleToggleDetail = () => {
    setShowDetail((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 120);
      }
      return next;
    });
  };

  const reasoningBullets = React.useMemo(() => {
    if (!result) return [];
    const fromApi = getReasoningBullets(result.valuationReasoning);
    if (fromApi.length > 0) return fromApi;

    const list: string[] = [];
    if (result.detectedRhythmName) {
      list.push(`Cấu trúc số bóc tách theo ${result.detectedRhythmName}, tạo âm luật phát âm cân xứng và gia tăng tính nhận diện.`);
    }
    if (result.detectedCategories && result.detectedCategories.length > 0) {
      list.push(`Thế số đặc trưng: ${result.detectedCategories.join(", ")} mang lại ấn tượng nổi bật.`);
    }
    if (result.minPrice && result.maxPrice) {
      list.push(`Biên độ giá thị trường chuẩn từ ${result.minPrice.toLocaleString("vi-VN")} ₫ đến ${result.maxPrice.toLocaleString("vi-VN")} ₫ theo cơ sở dữ liệu viễn thông.`);
    }
    list.push(`Mức giá P2P đề xuất ${result.suggestedPrice?.toLocaleString("vi-VN")} ₫ được cân đối tối ưu giữa tính thanh khoản và giá trị thực tế của SIM.`);
    return list;
  }, [result]);

  // Trigger analysis automatically when modal opens
  useEffect(() => {
    runValuation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runValuation = async () => {
    setStatus("loading");
    setResult(null);
    setErrorMsg("");
    setShowDetail(false);
    try {
      const res = await aiValuationService.estimatePrice({
        phoneNumber: sim.simNumber.replace(/\D/g, ""),
        simNumberId: sim.id,
      });
      setResult(res);
      setStatus("done");
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể kết nối với hệ thống AI. Vui lòng thử lại.");
      setStatus("error");
    }
  };

  const handleApplyPrice = async () => {
    if (!result?.suggestedPrice) return;
    const newPrice = Math.round(result.suggestedPrice);
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
      setAppliedPrice(newPrice);
      onSimUpdated?.({ ...sim, estimatedValue: newPrice });
      const toastPayload = {
        type: "success" as const,
        title: "Áp dụng định giá AI thành công",
        message: `Số SIM ${sim.simNumber} đã được cập nhật định giá: ${newPrice.toLocaleString("vi-VN")} ₫.`,
        duration: 4000,
      };
      addToast?.(toastPayload);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("trustsim_toast", { detail: toastPayload }));
      }
    } catch (err: any) {
      const errPayload = {
        type: "error" as const,
        title: "Không thể áp dụng giá",
        message: err.message || "Đã xảy ra lỗi khi lưu mức giá mới.",
        duration: 4000,
      };
      addToast?.(errPayload);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("trustsim_toast", { detail: errPayload }));
      }
    } finally {
      setApplyingPrice(false);
    }
  };

  const isAlreadyApplied =
    appliedPrice !== null ||
    (result?.suggestedPrice != null &&
      Math.round(result.suggestedPrice) === sim.estimatedValue);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[20px] w-full max-w-[540px] shadow-2xl border border-slate-100 animate-fade-up flex flex-col max-h-[92vh] overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Gradient AI Badge */}
            <div className="p-1.5 rounded-[8px] bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-500 shadow-sm">
              <Sparkles size={15} className="text-white" />
            </div>
            <div>
              <h3 className="text-[14px] font-black text-[#001743] tracking-tight m-0 leading-tight">
                Thẩm định AI — {sim.simNumber}
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Phân tích thế số · Phong thủy · Đối soát thị trường
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

        {/* ── Body ── */}
        <div className="p-4 sm:px-5 sm:py-3.5 pb-4 overflow-y-auto flex-1 min-h-0 flex flex-col gap-2.5">
          {/* SIM Info Pill */}
          <div className="flex items-center justify-between gap-3 px-3.5 py-2 bg-gradient-to-r from-[#001743] to-[#00266B] rounded-[10px]">
            <div>
              <div className="text-[9.5px] text-slate-400 font-mono uppercase tracking-wider">
                {sim.carrier} · {sim.simType}
              </div>
              <div className="text-sm sm:text-base font-black text-white font-mono tracking-wider">
                {sim.simNumber}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9.5px] text-slate-400 font-mono uppercase">Định giá hiện tại</div>
              <div className="text-xs sm:text-sm font-bold text-yellow-400 font-mono">
                {sim.estimatedValue > 0
                  ? sim.estimatedValue.toLocaleString("vi-VN") + " ₫"
                  : "Chưa định giá"}
              </div>
            </div>
          </div>

          {/* ── Loading State ── */}
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              {/* Animated AI Brain Spinner */}
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-violet-100 animate-ping opacity-30" />
                <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 border-r-indigo-400 border-b-blue-400 border-l-transparent animate-spin" />
                <div className="absolute inset-3 flex items-center justify-center">
                  <Sparkles size={18} className="text-violet-500" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#001743]">AI đang phân tích số SIM...</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Đối soát dữ liệu thị trường · Tính phong thủy · Nhận diện thế số
                </p>
              </div>
              {/* Progress skeleton */}
              <div className="w-full space-y-2 animate-pulse">
                <div className="h-2.5 bg-slate-100 rounded-full w-full" />
                <div className="h-2.5 bg-slate-100 rounded-full w-4/5 mx-auto" />
                <div className="h-2.5 bg-slate-100 rounded-full w-3/5 mx-auto" />
              </div>
            </div>
          )}

          {/* ── Error State ── */}
          {status === "error" && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="p-3 rounded-full bg-rose-50 text-rose-400">
                <Zap size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-rose-700">Không thể thẩm định lúc này</p>
                <p className="text-[11px] text-slate-400 mt-1">{errorMsg}</p>
              </div>
              <button
                type="button"
                onClick={runValuation}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#001743] text-white text-xs font-bold rounded-full transition-colors hover:bg-[#00266B] cursor-pointer"
              >
                <RefreshCw size={13} />
                Thử lại
              </button>
            </div>
          )}

          {/* ── Result State ── */}
          {status === "done" && result && (
            <>
              {/* Main Price Card with integrated Confidence Badge */}
              <div className="p-3.5 bg-gradient-to-br from-violet-50/90 via-indigo-50/60 to-blue-50/50 rounded-[14px] border border-indigo-100/90 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">
                    Giá AI đề xuất
                  </span>
                  {result.confidenceScore && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                      <BadgeCheck size={12} className="text-emerald-600" />
                      Độ tin cậy: {Math.round(result.confidenceScore * 100)}%
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-2xl font-black text-[#E4011E] font-mono tracking-tight">
                    {result.suggestedPrice?.toLocaleString("vi-VN")}{" "}
                    <span className="text-base">₫</span>
                  </div>

                  {/* Delta vs current price */}
                  {sim.estimatedValue > 0 && result.suggestedPrice && (
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        result.suggestedPrice > sim.estimatedValue
                          ? "bg-emerald-100 text-emerald-700"
                          : result.suggestedPrice < sim.estimatedValue
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {result.suggestedPrice > sim.estimatedValue ? (
                        <TrendingUp size={11} />
                      ) : result.suggestedPrice < sim.estimatedValue ? (
                        <TrendingDown size={11} />
                      ) : (
                        <Minus size={11} />
                      )}
                      <span>
                        {result.suggestedPrice > sim.estimatedValue
                          ? "+"
                          : result.suggestedPrice < sim.estimatedValue
                          ? "-"
                          : ""}
                        {Math.abs(
                          result.suggestedPrice - sim.estimatedValue
                        ).toLocaleString("vi-VN")}{" "}
                        ₫
                      </span>
                    </div>
                  )}
                </div>

                {/* Market Range */}
                {(result.minPrice || result.maxPrice) && (
                  <div className="text-[11px] text-slate-500 font-mono mt-1.5 pt-1.5 border-t border-indigo-100/60 flex items-center justify-between">
                    <span>Khoảng thị trường:</span>
                    <strong className="text-slate-700 font-semibold">
                      {result.minPrice?.toLocaleString("vi-VN") ?? "—"} ₫ –{" "}
                      {result.maxPrice?.toLocaleString("vi-VN") ?? "—"} ₫
                    </strong>
                  </div>
                )}
              </div>

              {/* 3 Tier Price Grid */}
              <div className="grid grid-cols-3 gap-2">
                <PriceTierCard
                  label="Giá bán lẻ (Retail)"
                  value={result.retailPrice || Math.round((result.suggestedPrice || 0) * 1.15)}
                />
                <PriceTierCard
                  label="Giá người dùng (P2P)"
                  value={result.p2pPrice || result.suggestedPrice}
                  highlight
                />
                <PriceTierCard
                  label="Giá thu mua đại lý"
                  value={result.dealerPrice || Math.round((result.suggestedPrice || 0) * 0.75)}
                  accent="text-slate-500"
                />
              </div>

              {/* Detected Rhythm & Categories */}
              {(result.detectedRhythmName || (result.detectedCategories?.length ?? 0) > 0) && (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-[10px] border border-slate-100 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                    Thế số:
                  </span>
                  {result.detectedRhythmName && (
                    <span className="px-2 py-0.5 bg-yellow-50 text-yellow-800 border border-yellow-200/80 rounded-full text-[11px] font-bold">
                      Nhịp: {result.detectedRhythmName}
                    </span>
                  )}
                  {result.detectedCategories?.map((cat, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/70 rounded-full text-[11px] font-bold"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              {/* Accordion: Detailed Analysis & Feng Shui (Always visible) */}
              <div
                ref={detailRef}
                className="rounded-[12px] border border-violet-200 bg-white shadow-xs overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={handleToggleDetail}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-violet-50/80 via-indigo-50/50 to-slate-50 hover:from-violet-100/70 hover:to-indigo-100/60 transition-colors cursor-pointer text-xs font-bold text-[#001743]"
                >
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                      <Sparkles size={11} />
                    </div>
                    <span>Xem phân tích chuyên sâu & phong thủy</span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-violet-700 bg-violet-100/80 px-2 py-0.5 rounded-full shrink-0">
                    {showDetail ? "Thu gọn" : "Xem chi tiết"}
                    {showDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </span>
                </button>

                {showDetail && (
                  <div className="p-3.5 bg-white space-y-3 border-t border-violet-100 animate-fade-in">
                    {/* Reasoning Bullets */}
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Zap size={11} className="text-amber-500" />
                        Cơ sở định giá từ AI
                      </div>
                      <ul className="space-y-1.5">
                        {reasoningBullets.map((bullet, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-[11.5px] text-slate-600 leading-relaxed bg-slate-50/90 p-2 rounded-[8px] border border-slate-100"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Feng Shui */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span>☯</span>
                        Ý nghĩa phong thủy & quẻ số
                      </div>
                      <div className="p-2.5 bg-amber-50/60 rounded-[8px] border border-amber-100/80 text-[11.5px] text-amber-950 leading-relaxed">
                        {result.fengShuiAnalysis ||
                          "Dãy số mang năng lượng ngũ hành cân bằng, quẻ dịch số học hài hòa hỗ trợ tốt cho giao tiếp kinh doanh và phát triển lâu dài."}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-between gap-2.5 shrink-0 z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-full text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            {status === "done" && (
              <button
                type="button"
                onClick={runValuation}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-full text-xs font-semibold transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
                Thẩm định lại
              </button>
            )}

            {status === "done" && result?.suggestedPrice && (
              isAlreadyApplied ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  <CheckCircle2 size={13} />
                  Đã áp dụng định giá
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyPrice}
                  disabled={applyingPrice}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  {applyingPrice ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  Áp dụng định giá AI
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
