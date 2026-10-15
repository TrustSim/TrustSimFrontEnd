/* Hallmark · genre: modern-minimal · style: Clean High-Trust Banking & AI Valuation · role: quick-ai-valuation-modal */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Bot,
  Zap,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { aiValuationService, SimValuationDto } from "@/services/aiValuationService";
import { formatPhoneNumber } from "@/services/simService";

interface QuickAiValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
}

function formatVND(amount?: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getReasoningBullets(text?: string): string[] {
  if (!text) return [];
  return text
    .split(/(?<=[.?!;])\s+|\n+/)
    .map((s) => s.trim().replace(/^[-*•]\s*/, ""))
    .filter((s) => s.length > 5);
}

export default function QuickAiValuationModal({
  isOpen,
  onClose,
  initialPhone = "",
}: QuickAiValuationModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimValuationDto | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDetail, setShowDetail] = useState(false);

  if (!isOpen) return null;

  const handleValuate = async (targetPhone?: string) => {
    const rawNumber = (targetPhone || phoneNumber).replace(/\D/g, "");
    if (!rawNumber || rawNumber.length < 9 || rawNumber.length > 11) {
      setErrorMsg("Vui lòng nhập số điện thoại hợp lệ (10 số).");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const data = await aiValuationService.estimatePrice({ phoneNumber: rawNumber });
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Hệ thống chưa thể thẩm định số SIM này lúc này. Quý khách vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = (sample: string) => {
    setPhoneNumber(sample);
    handleValuate(sample);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Tiêu đề & Giới thiệu */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#001743]">Thẩm Định Giá SIM Tự Động</h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 tracking-wide">
                  MIỄN PHÍ
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Định giá dựa trên cấu trúc nhịp số, nhà mạng và dữ liệu giao dịch thực tế trên sàn TrustSim.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X size={16} />
          </button>
        </div>

        {/* Khung nhập số SIM */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-[#001743] block">
            Nhập số điện thoại cần tra cứu giá trị:
          </label>
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleValuate();
                }}
                placeholder="Ví dụ: 0988.888.888 hoặc 0797979799"
                className="w-full py-2.5 pl-3.5 pr-4 text-base font-bold font-mono tracking-wider text-[#001743] bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleValuate()}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>{loading ? "Đang thẩm định…" : "Định giá ngay"}</span>
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
              <AlertTriangle size={13} className="shrink-0" />
              <span>{errorMsg}</span>
            </p>
          )}

          {/* Mẫu tham khảo */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-slate-400 font-medium">Số mẫu tra nhanh:</span>
            {["0988.888.888", "0909.68.68.68", "0888.79.79.79", "079.79.79.799"].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 rounded-lg text-[11px] font-mono font-medium transition-colors cursor-pointer"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Trạng thái đang tải dữ liệu */}
        {loading && (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-3 animate-pulse">
            <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-[#001743]">Hệ Thống Đang Phân Tích Cấu Trúc Số &amp; Thị Trường...</h4>
              <p className="text-[11px] text-slate-500">
                Đối soát quy luật dãy số, nhà mạng và lịch sử giao dịch tương đương trên sàn.
              </p>
            </div>
          </div>
        )}

        {/* Kết quả thẩm định giá */}
        {result && !loading && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Thẻ bảng giá nổi bật */}
            <div className="bg-gradient-to-br from-[#001743] via-[#00225c] to-[#0D2847] text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-xs font-mono font-bold tracking-widest text-slate-300">
                  {formatPhoneNumber(result.phoneNumber)}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-emerald-300 border border-white/10">
                  <ShieldCheck size={11} className="text-emerald-400" />
                  Độ tin cậy thẩm định: {result.confidenceScore ? `${Math.round(result.confidenceScore * 100)}%` : "Rất cao"}
                </span>
              </div>

              <div className="text-slate-400 text-[11px] font-medium">Mức giá khuyến nghị theo thị trường:</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight tabular-nums mt-1">
                {formatVND(result.suggestedPrice)}
              </div>

              {/* Biên độ mức giá */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-center">
                <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Mức giá tối thiểu</span>
                  <span className="font-mono font-bold text-xs text-slate-200 tabular-nums mt-0.5 block">
                    {formatVND(result.minPrice)}
                  </span>
                </div>
                <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Giá thanh khoản nhanh</span>
                  <span className="font-mono font-bold text-xs text-slate-200 tabular-nums mt-0.5 block">
                    {formatVND(result.dealerPrice || result.minPrice)}
                  </span>
                </div>
                <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Mức giá tối đa</span>
                  <span className="font-mono font-bold text-xs text-slate-200 tabular-nums mt-0.5 block">
                    {formatVND(result.maxPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Dạng số & Thế số */}
            <div className="flex flex-wrap items-center gap-2">
              {result.detectedRhythmName && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                  <Zap size={12} className="text-purple-600" />
                  <span>Dạng số: {result.detectedRhythmName}</span>
                </span>
              )}
              {result.detectedCategories &&
                result.detectedCategories.map((cat, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700"
                  >
                    {cat}
                  </span>
                ))}
            </div>

            {/* Cơ sở phân tích chi tiết */}
            {result.valuationReasoning && (
              <div className="bg-slate-50 rounded-xl border border-slate-200/90 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowDetail(!showDetail)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-[#001743] hover:bg-slate-100/70 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Bot size={14} className="text-purple-600" />
                    <span>Xem cơ sở định giá chi tiết ({getReasoningBullets(result.valuationReasoning).length} tiêu chí)</span>
                  </span>
                  {showDetail ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {showDetail && (
                  <div className="p-4 pt-1 border-t border-slate-200/60 text-xs text-slate-700 space-y-2">
                    <ul className="list-disc pl-5 space-y-1.5 leading-relaxed text-slate-600">
                      {getReasoningBullets(result.valuationReasoning).map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                    {result.fengShuiAnalysis && (
                      <div className="p-2.5 bg-purple-50/60 rounded-lg border border-purple-200/60 text-purple-950 mt-2 text-[11px] leading-relaxed">
                        <strong className="block mb-0.5 text-purple-900">Ý nghĩa phong thủy số:</strong>
                        {result.fengShuiAnalysis}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Các nút hành động */}
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/auctions"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold text-center transition-colors"
              >
                Xem các phiên tương tự
              </Link>
              <Link
                href="/profile?tab=auctions"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-[#001743] hover:bg-[#00266B] active:scale-[0.99] text-white text-xs font-bold text-center shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Đăng bán đấu giá số này</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
