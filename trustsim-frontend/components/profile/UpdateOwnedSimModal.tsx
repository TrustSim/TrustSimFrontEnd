"use client";

import React, { useState } from "react";
import {
  X,
  RefreshCw,
  Smartphone,
  Sparkles,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";
import { OwnedSim } from "./types";
import { ToastMessage } from "@/components/ui/Toast";
import { updateSim, FormatRhythmItemDto, getCarrierColor } from "@/services/simService";
import { SimCategoryDto } from "@/services/categoryService";
import { aiValuationService, SimValuationDto } from "@/services/aiValuationService";

interface UpdateOwnedSimModalProps {
  sim: OwnedSim;
  formatRhythmsList: FormatRhythmItemDto[];
  categoriesList?: SimCategoryDto[];
  onClose: () => void;
  onSuccess: (updatedSim: OwnedSim) => void;
  addToast: (t: Omit<ToastMessage, "id">) => void;
}

/* ─── Square Carrier Emblem Component with Fallback ──────────────────────── */
function CarrierSquareEmblem({
  name,
  logo,
  size = 40,
}: {
  name: string;
  logo?: string;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const color = getCarrierColor(name);
  const isValid =
    logo &&
    typeof logo === "string" &&
    logo.trim().length > 0 &&
    !logo.includes("trustsim.vn");

  if (isValid && !imgError) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-[12px] border border-slate-200/80 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs"
      >
        <img
          src={logo}
          alt={name}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback: Elegant colored emblem with carrier initials
  const abbr = name ? name.substring(0, 2).toUpperCase() : "SM";
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: `0 4px 12px ${color}35`,
      }}
      className="rounded-[12px] flex items-center justify-center shrink-0 font-black text-xs text-white shadow-2xs font-mono tracking-tight"
    >
      {abbr}
    </div>
  );
}

export default function UpdateOwnedSimModal({
  sim,
  formatRhythmsList,
  categoriesList = [],
  onClose,
  onSuccess,
  addToast,
}: UpdateOwnedSimModalProps) {
  const carrierColor = getCarrierColor(sim.carrier || "");
  const [estimatedValue, setEstimatedValue] = useState<number>(sim.estimatedValue || 10_000_000);
  const [estimatedValueFormatted, setEstimatedValueFormatted] = useState<string>(
    (sim.estimatedValue || 10_000_000).toLocaleString("vi-VN")
  );
  const [simType, setSimType] = useState<"Trả trước" | "Trả sau">(sim.simType || "Trả trước");
  const [formatRhythmName, setFormatRhythmName] = useState<string>(sim.formatRhythmName || "");
  const [aiDetectedCategoryIds, setAiDetectedCategoryIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // AI Valuation State
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiResult, setAiResult] = useState<SimValuationDto | null>(null);
  const [showAiAnalysisDetail, setShowAiAnalysisDetail] = useState(false);

  // Number masking for estimated value
  const handleEstimatedValueMasking = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setEstimatedValue(0);
      setEstimatedValueFormatted("");
      return;
    }
    const num = parseInt(raw, 10);
    setEstimatedValue(num);
    setEstimatedValueFormatted(num.toLocaleString("vi-VN"));
  };

  const handleQuickAddPrice = (addAmount: number) => {
    const nextVal = (estimatedValue || 0) + addAmount;
    setEstimatedValue(nextVal);
    setEstimatedValueFormatted(nextVal.toLocaleString("vi-VN"));
  };

  const handleAiValuation = async () => {
    setLoadingAi(true);
    try {
      const res = await aiValuationService.estimatePrice({
        phoneNumber: sim.simNumber.replace(/\D/g, ""),
        simNumberId: sim.id,
      });
      setAiResult(res);
      if (res.suggestedPrice && res.suggestedPrice > 0) {
        const price = Math.round(res.suggestedPrice);
        setEstimatedValue(price);
        setEstimatedValueFormatted(price.toLocaleString("vi-VN"));
      }
      if (res.detectedRhythmName) {
        const matched = formatRhythmsList.find(
          (r) =>
            r.formatRhythmName.toLowerCase() === res.detectedRhythmName.toLowerCase() ||
            res.detectedRhythmName.toLowerCase().includes(r.formatRhythmName.toLowerCase()) ||
            r.formatRhythmName.toLowerCase().includes(res.detectedRhythmName.toLowerCase())
        );
        if (matched) {
          setFormatRhythmName(matched.formatRhythmName);
        } else {
          setFormatRhythmName(res.detectedRhythmName);
        }
      }
      if (res.detectedCategories && res.detectedCategories.length > 0 && categoriesList.length > 0) {
        const matchedCats = categoriesList
          .filter((c) =>
            res.detectedCategories.some(
              (dc) =>
                dc.toLowerCase().includes(c.categoryName.toLowerCase()) ||
                c.categoryName.toLowerCase().includes(dc.toLowerCase())
            )
          )
          .map((c) => c.id);
        if (matchedCats.length > 0) {
          setAiDetectedCategoryIds(matchedCats);
        }
      }
      addToast({
        type: "success",
        title: "Định giá AI hoàn tất",
        message: `Mức giá AI đề xuất: ${res.suggestedPrice?.toLocaleString("vi-VN")} ₫.`,
      });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Không thể định giá bằng AI",
        message: err.message || "Vui lòng thử lại sau.",
      });
    } finally {
      setLoadingAi(false);
    }
  };

  const getReasoningBullets = (text?: string): string[] => {
    if (!text) return [];
    return text
      .split(/(?<=[.?!;])\s+|\n+/)
      .map((s) => s.trim().replace(/^[-*•]\s*/, ""))
      .filter((s) => s.length > 5);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Find matching rhythmId if available
      const matchedRhythm = formatRhythmsList.find((r) => r.formatRhythmName === formatRhythmName);

      // Call API if valid UUID
      const isGuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(sim.id);
      if (isGuid) {
        await updateSim(sim.id, {
          formatRhythmId: matchedRhythm?.id || sim.formatRhythmId,
          phonePrefixId: sim.phonePrefixId,
          price: estimatedValue,
          categoryIds: aiDetectedCategoryIds.length > 0 ? aiDetectedCategoryIds : undefined,
        });
      }

      const updated: OwnedSim = {
        ...sim,
        estimatedValue,
        simType,
        formatRhythmName,
        categoryNames: aiResult?.detectedCategories && aiResult.detectedCategories.length > 0
          ? aiResult.detectedCategories
          : sim.categoryNames,
      };

      onSuccess(updated);
      addToast({
        type: "success",
        title: "Cập nhật thành công",
        message: `Đã cập nhật thông tin số SIM ${sim.simNumber}.`,
      });
      onClose();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Cập nhật thất bại",
        message: err.message || "Đã xảy ra lỗi khi cập nhật thông tin SIM.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-[20px] w-full max-w-[480px] shadow-2xl border border-slate-100 animate-fade-up flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header Modal: Trang trí với Tag Nhà mạng màu thương hiệu */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/logo/S-Logo.png" alt="TrustSIM" className="w-7 h-7 object-contain shrink-0" />
            <div>
              <h3 className="text-base font-black text-[#001743] tracking-tight m-0">
                Cập nhật thông tin số SIM
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-slate-400 font-medium">Kho tài sản cá nhân</span>
                <span className="text-slate-300">•</span>
                <span
                  style={{
                    backgroundColor: `${carrierColor}14`,
                    color: carrierColor,
                    borderColor: `${carrierColor}30`,
                  }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider"
                >
                  {sim.carrier}
                </span>
              </div>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
            {/* Field 1: Khối Card hiển thị Số điện thoại (Thay thế Disabled Input bợt màu) */}
            <div className="p-3.5 bg-[#F8FAFC] rounded-[16px] flex items-center justify-between border-0 shadow-2xs">
              <div className="flex items-center gap-3">
                {/* Carrier Emblem with Error Fallback */}
                <CarrierSquareEmblem name={sim.carrier} logo={sim.carrierLogo} size={40} />

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <span>Số điện thoại SIM</span>
                  </div>
                  <div className="text-lg font-black font-mono tracking-wide text-[#001743] mt-0.5">
                    {sim.simNumber}
                  </div>
                </div>
              </div>

              {/* Chỉ hiển thị Icon Khóa thanh lịch */}
              <div
                className="w-8 h-8 rounded-full bg-white/90 border border-slate-200/70 shadow-2xs flex items-center justify-center text-slate-400 shrink-0"
                title="Số điện thoại cố định (không thể thay đổi)"
              >
                <Lock size={14} className="text-slate-400" />
              </div>
            </div>

            {/* Field 2: Loại thuê bao */}
            <div>
              <label className="block text-xs font-bold text-[#001743] mb-1.5">
                Loại thuê bao <span className="text-red-600">*</span>
              </label>
              <select
                value={simType}
                onChange={(e) => setSimType(e.target.value as any)}
                className="w-full text-xs p-3 border border-slate-200/70 bg-slate-50/40 hover:bg-white hover:border-slate-300 rounded-[12px] font-semibold text-[#001743] focus:bg-white focus:border-[#001743]/70 focus:ring-4 focus:ring-[#001743]/5 focus:outline-none transition-all shadow-2xs"
              >
                <option value="Trả trước">Trả trước</option>
                <option value="Trả sau">Trả sau</option>
              </select>
            </div>

            {/* Field 3: Nhịp định dạng / Thế số */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#001743]">
                  Nhịp định dạng (Thế số)
                </label>
                {aiResult?.detectedRhythmName && (
                  <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold border border-blue-100 flex items-center gap-1">
                    <Sparkles size={10} className="text-[#E4011E]" />
                    <span>AI gợi ý: {aiResult.detectedRhythmName}</span>
                  </span>
                )}
              </div>
              <select
                value={formatRhythmName}
                onChange={(e) => setFormatRhythmName(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200/70 bg-slate-50/40 hover:bg-white hover:border-slate-300 rounded-[12px] font-semibold text-[#001743] focus:bg-white focus:border-[#001743]/70 focus:ring-4 focus:ring-[#001743]/5 focus:outline-none transition-all shadow-2xs"
              >
                <option value="">Chưa chọn thế số</option>
                {formatRhythmsList.map((r) => (
                  <option key={r.id} value={r.formatRhythmName}>
                    {r.formatRhythmName}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 4: Định giá ước tính (Nút Nhờ AI định giá Viền Gradient + Nền Trắng Cao Cấp) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#001743]">
                  Định giá ước tính <span className="text-red-600">*</span>
                </label>
                {/* Nút Nhờ AI định giá: Viền Gradient mỏng + Nền trắng + Icon Line */}
                <button
                  type="button"
                  onClick={handleAiValuation}
                  disabled={loadingAi}
                  className="group relative p-[1.2px] rounded-full bg-gradient-to-r from-[#E4011E] via-purple-600 to-blue-600 hover:from-[#E4011E] hover:via-purple-700 hover:to-blue-700 transition-all shadow-2xs hover:shadow-md cursor-pointer disabled:opacity-50 active:scale-95"
                  title="Yêu cầu AI phân tích và tự động điền giá & nhịp số"
                >
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full transition-colors group-hover:bg-slate-50/90">
                    {loadingAi ? (
                      <>
                        <RefreshCw size={12} className="animate-spin text-[#E4011E]" />
                        <span className="text-[11px] font-bold bg-gradient-to-r from-[#E4011E] to-[#7C3AED] bg-clip-text text-transparent">
                          Đang phân tích...
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} className="text-[#E4011E] stroke-[1.8] group-hover:rotate-12 transition-transform" />
                        <span className="text-[11px] font-extrabold bg-gradient-to-r from-[#E4011E] via-purple-600 to-blue-600 bg-clip-text text-transparent">
                          Nhờ AI định giá
                        </span>
                      </>
                    )}
                  </span>
                </button>
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  value={estimatedValueFormatted}
                  onChange={handleEstimatedValueMasking}
                  placeholder="10.000.000"
                  className="w-full text-xs p-3 pr-8 border border-slate-200/70 bg-slate-50/40 hover:bg-white hover:border-slate-300 rounded-[12px] font-mono font-bold text-[#001743] focus:bg-white focus:border-[#001743]/70 focus:ring-4 focus:ring-[#001743]/5 focus:outline-none transition-all shadow-2xs"
                  required
                />
                <span className="absolute right-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                  ₫
                </span>
              </div>

              {/* Quick Add Pills: Nảy nhẹ khi hover (-translate-y-0.5) và đổi sắc thái */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Cộng nhanh:</span>
                {[
                  { label: "+1 triệu", val: 1_000_000 },
                  { label: "+5 triệu", val: 5_000_000 },
                  { label: "+10 triệu", val: 10_000_000 },
                  { label: "+50 triệu", val: 50_000_000 },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleQuickAddPrice(chip.val)}
                    className="px-3 py-1 bg-slate-100/80 text-slate-700 hover:bg-[#E4011E]/10 hover:text-[#E4011E] hover:border-[#E4011E]/30 border border-transparent rounded-full text-[11px] font-bold transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Skeleton Loading State */}
            {loadingAi && (
              <div className="p-3.5 bg-gradient-to-r from-blue-50/70 via-purple-50/40 to-slate-50/70 rounded-[14px] border border-purple-100/60 animate-pulse transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={13} className="text-[#E4011E] animate-spin" />
                  <span className="text-xs font-bold text-[#001743]">
                    AI đang phân tích thế số, phong thủy và định giá thị trường...
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200/80 rounded-full w-3/4" />
                  <div className="h-2.5 bg-slate-200/60 rounded-full w-1/2" />
                </div>
              </div>
            )}

            {/* Thẻ hiển thị kết quả định giá AI */}
            {aiResult && !loadingAi && (
              <div className="p-3.5 bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-slate-50/80 rounded-[16px] border border-blue-100/70 shadow-xs relative overflow-hidden transition-all animate-fadeIn">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src="/logo/S-Logo.png" alt="TrustSim AI" className="w-4 h-4 object-contain shrink-0" />
                    <span className="text-xs font-bold text-[#001743] shrink-0">
                      Kết quả AI định giá
                    </span>
                    {aiResult.detectedRhythmName && (
                      <span className="px-2 py-0.5 bg-blue-100/80 text-blue-800 rounded-full text-[10px] font-semibold truncate">
                        {aiResult.detectedRhythmName}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiResult(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/50 transition-colors cursor-pointer"
                    title="Đóng kết quả định giá"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/90 p-2.5 rounded-[12px] border border-blue-50/80">
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium">Mức giá AI đề xuất:</div>
                    <div className="text-sm font-extrabold text-[#E4011E] font-mono mt-0.5">
                      {aiResult.suggestedPrice?.toLocaleString("vi-VN")} ₫
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

                {/* AI Detected Categories */}
                {aiResult.detectedCategories && aiResult.detectedCategories.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-blue-100/60">
                    <span className="text-[10px] font-bold text-[#001743] flex items-center gap-1 mb-1">
                      <Check size={11} className="text-emerald-600" />
                      <span>Thể loại phát hiện (AI phân loại):</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {aiResult.detectedCategories.map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 bg-white text-[#001743] border border-blue-200/80 rounded-full text-[10px] font-bold shadow-2xs"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accordion Toggle */}
                {aiResult.valuationReasoning && (
                  <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-blue-100/50 text-[10px]">
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                      <span>Đã tự động áp dụng giá và nhịp số</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAiAnalysisDetail(!showAiAnalysisDetail)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 cursor-pointer transition-colors"
                    >
                      <span>{showAiAnalysisDetail ? "Thu gọn" : "Chi tiết nhận định"}</span>
                      {showAiAnalysisDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>
                )}

                {showAiAnalysisDetail && aiResult.valuationReasoning && (
                  <div className="mt-2 p-2.5 bg-white/80 rounded-[10px] border border-blue-100/60 animate-fadeIn">
                    <ul className="space-y-1 text-[11px] text-slate-600">
                      {getReasoningBullets(aiResult.valuationReasoning).map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="p-4 px-5 border-t border-slate-100 bg-white/95 backdrop-blur-xs flex items-center justify-end gap-2.5 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] rounded-b-[20px]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#001743] hover:bg-[#00266B] text-white rounded-full text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
            >
              {submitting && <RefreshCw size={13} className="animate-spin" />}
              <span>{submitting ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
