/* Hallmark · genre: modern-minimal · style: Clean High-Trust Banking & AI Valuation · role: quick-ai-valuation-modal */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  X,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Bot,
  Zap,
  AlertTriangle,
  Smartphone,
  Layers,
  Search,
  Lock,
  Plus,
  Info,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { aiValuationService, SimValuationDto } from "@/services/aiValuationService";
import {
  getMySims,
  formatPhoneNumber,
  getCarrierColor,
  type MySimItemDto,
} from "@/services/simService";
import { authService } from "@/services/authService";

interface QuickAiValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  initialSimId?: string;
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
  initialSimId,
}: QuickAiValuationModalProps) {
  // Chế độ: "inventory" (Chọn từ kho SIM) hoặc "manual" (Nhập số thủ công)
  const [mode, setMode] = useState<"inventory" | "manual">("inventory");

  // Dữ liệu kho SIM của người dùng
  const [mySims, setMySims] = useState<MySimItemDto[]>([]);
  const [loadingSims, setLoadingSims] = useState<boolean>(false);
  const [selectedSim, setSelectedSim] = useState<MySimItemDto | null>(null);
  const [inventorySearch, setInventorySearch] = useState<string>("");

  // Dữ liệu nhập thủ công & thẩm định
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimValuationDto | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDetail, setShowDetail] = useState(false);

  const isAuthenticated = authService.isAuthenticated();

  // ─── 1. Tải danh sách SIM trong kho của người dùng khi mở modal ───
  useEffect(() => {
    if (!isOpen) return;

    if (isAuthenticated) {
      setLoadingSims(true);
      getMySims({ pageIndex: 1, pageSize: 50 })
        .then((res) => {
          const items = res.items || [];
          setMySims(items);

          // Nếu có initialPhone hoặc initialSimId, kiểm tra khớp
          if (initialPhone) {
            const cleanInit = initialPhone.replace(/\D/g, "");
            const found = items.find(
              (s) => s.phoneNumber.replace(/\D/g, "") === cleanInit
            );
            if (found) {
              setSelectedSim(found);
              setMode("inventory");
            } else {
              setMode("manual");
            }
            handleValuate(initialPhone);
          } else if (items.length > 0) {
            setMode("inventory");
          } else {
            setMode("manual");
          }
        })
        .catch(() => {
          setMySims([]);
          setMode("manual");
        })
        .finally(() => {
          setLoadingSims(false);
        });
    } else {
      setMySims([]);
      setMode("manual");
      if (initialPhone) {
        handleValuate(initialPhone);
      }
    }
  }, [isOpen, isAuthenticated, initialPhone]);

  // ─── 2. Xác định xem số SIM đang hiển thị kết quả có thuộc kho của người dùng không ───
  const isOwnedByUser = useMemo(() => {
    const rawNumber = (result?.phoneNumber || phoneNumber || "").replace(/\D/g, "");
    if (!rawNumber || mySims.length === 0) return false;
    return mySims.some((s) => s.phoneNumber.replace(/\D/g, "") === rawNumber);
  }, [result, phoneNumber, mySims]);

  // Tìm đối tượng SIM trong kho tương ứng (nếu có)
  const matchedOwnedSim = useMemo(() => {
    const rawNumber = (result?.phoneNumber || phoneNumber || "").replace(/\D/g, "");
    if (!rawNumber) return null;
    return mySims.find((s) => s.phoneNumber.replace(/\D/g, "") === rawNumber) || null;
  }, [result, phoneNumber, mySims]);

  // Bộ lọc danh sách SIM trong kho
  const filteredMySims = useMemo(() => {
    if (!inventorySearch.trim()) return mySims;
    const cleanKeyword = inventorySearch.toLowerCase().replace(/\D/g, "");
    return mySims.filter((sim) => {
      const cleanPhone = sim.phoneNumber.replace(/\D/g, "");
      const matchPhone = cleanKeyword ? cleanPhone.includes(cleanKeyword) : false;
      const matchCarrier = sim.carrierName.toLowerCase().includes(inventorySearch.toLowerCase());
      const matchRhythm = sim.formatRhythmName?.toLowerCase().includes(inventorySearch.toLowerCase());
      return matchPhone || matchCarrier || matchRhythm;
    });
  }, [mySims, inventorySearch]);

  if (!isOpen) return null;

  // ─── 3. Hàm kích hoạt thẩm định giá ───
  const handleValuate = async (targetPhone?: string) => {
    const rawNumber = (targetPhone || phoneNumber).replace(/\D/g, "");
    if (!rawNumber || rawNumber.length < 9 || rawNumber.length > 11) {
      setErrorMsg("Vui lòng nhập số điện thoại hợp lệ (10 chữ số).");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const data = await aiValuationService.estimatePrice({ phoneNumber: rawNumber });
      setResult(data);
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          "Hệ thống chưa thể thẩm định số SIM này lúc này. Quý khách vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  // Chọn 1 SIM từ kho
  const handleSelectFromInventory = (sim: MySimItemDto) => {
    setSelectedSim(sim);
    setPhoneNumber(sim.phoneNumber);
    handleValuate(sim.phoneNumber);
  };

  // Chọn mẫu tra nhanh
  const handleSelectSample = (sample: string) => {
    setSelectedSim(null);
    setPhoneNumber(sample);
    handleValuate(sample);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* ═══ HEADER ═══ */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
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

        {/* ═══ BỘ CHUYỂN NGUỒN SIM (SEGMENTED SOURCE SWITCHER) ═══ */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("inventory")}
            className={`flex-1 py-2 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === "inventory"
                ? "bg-white text-[#001743] font-bold shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers size={14} className={mode === "inventory" ? "text-purple-600" : "text-slate-400"} />
            <span>Kho SIM của tôi</span>
            {isAuthenticated && mySims.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 font-bold">
                {mySims.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`flex-1 py-2 px-3 rounded-lg text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === "manual"
                ? "bg-white text-[#001743] font-bold shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Search size={14} className={mode === "manual" ? "text-purple-600" : "text-slate-400"} />
            <span>Nhập số thủ công</span>
          </button>
        </div>

        {/* ═══ VIEW 1: CHỌN TỪ KHO SIM CỦA TÔI ═══ */}
        {mode === "inventory" && (
          <div className="space-y-3">
            {!isAuthenticated ? (
              // Chưa đăng nhập
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                  <Lock size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#001743]">Đăng nhập để xem kho SIM chính chủ</h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    Quý khách vui lòng đăng nhập để hệ thống hiển thị danh sách các số SIM bạn đang sở hữu và kích hoạt quyền đăng bán đấu giá.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="px-4 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Đăng nhập ngay
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMode("manual")}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
                  >
                    Nhập số thủ công
                  </button>
                </div>
              </div>
            ) : loadingSims ? (
              // Đang tải danh sách SIM
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <RefreshCw size={18} className="animate-spin text-purple-600 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">Đang tải danh sách SIM trong kho của bạn...</p>
              </div>
            ) : mySims.length === 0 ? (
              // Kho SIM trống
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2.5">
                <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                  <Smartphone size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#001743]">Kho SIM của bạn hiện đang trống</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto leading-relaxed">
                    Bạn chưa có số SIM nào được xác thực trong kho. Hãy đăng ký số SIM mới hoặc chuyển sang nhập số thủ công để thẩm định giá trị.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Link
                    href="/profile?tab=auctions"
                    onClick={onClose}
                    className="px-3.5 py-1.5 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>Đăng ký SIM vào kho</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMode("manual")}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
                  >
                    Nhập số thủ công
                  </button>
                </div>
              </div>
            ) : (
              // Có danh sách SIM trong kho
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#001743]">
                    Chọn số SIM cần thẩm định ({mySims.length} SIM trong kho):
                  </span>
                  {mySims.length > 4 && (
                    <div className="relative w-44">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={inventorySearch}
                        onChange={(e) => setInventorySearch(e.target.value)}
                        placeholder="Lọc số trong kho..."
                        className="w-full py-1 pl-7 pr-2 text-[11px] bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-purple-600"
                      />
                    </div>
                  )}
                </div>

                {/* Danh sách thẻ SIM có thể bấm chọn */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredMySims.map((sim) => {
                    const isPicked =
                      selectedSim?.id === sim.id ||
                      (result && result.phoneNumber.replace(/\D/g, "") === sim.phoneNumber.replace(/\D/g, ""));
                    const carrierColor = getCarrierColor(sim.carrierName);

                    return (
                      <button
                        key={sim.id}
                        type="button"
                        onClick={() => handleSelectFromInventory(sim)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer group ${
                          isPicked
                            ? "bg-purple-50/70 border-purple-400 ring-2 ring-purple-100 shadow-2xs"
                            : "bg-slate-50/80 hover:bg-white hover:border-slate-300 border-slate-200"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: carrierColor }}
                              title={sim.carrierName}
                            />
                            <span className="font-mono font-bold text-xs text-[#001743] tracking-wide">
                              {formatPhoneNumber(sim.phoneNumber)}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
                            <span className="font-medium text-slate-600">{sim.carrierName}</span>
                            {sim.formatRhythmName && (
                              <>
                                <span>•</span>
                                <span className="text-purple-700 font-semibold truncate">
                                  {sim.formatRhythmName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 transition-colors ${
                            isPicked
                              ? "bg-purple-600 text-white"
                              : "bg-slate-200/80 text-slate-600 group-hover:bg-purple-100 group-hover:text-purple-800"
                          }`}
                        >
                          {isPicked ? "Đang chọn" : "Thẩm định"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ VIEW 2: NHẬP SỐ THỦ CÔNG ═══ */}
        {mode === "manual" && (
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#001743] block">
              Nhập số điện thoại cần thẩm định giá trị:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setSelectedSim(null);
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
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
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
        )}

        {/* ═══ LOADING ANIMATION ═══ */}
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

        {/* ═══ KẾT QUẢ THẨM ĐỊNH GIÁ & KIỂM SOÁT QUYỀN HÀNH ĐỘNG ═══ */}
        {result && !loading && (
          <div className="space-y-4 animate-in fade-in duration-200 pt-1">
            {/* Thẻ bảng giá chính */}
            <div className="bg-gradient-to-br from-[#001743] via-[#00225c] to-[#0D2847] text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-xs font-mono font-bold tracking-widest text-slate-200">
                  {formatPhoneNumber(result.phoneNumber)}
                </span>

                {/* Huy hiệu quyền sở hữu */}
                {isOwnedByUser ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    <span>SIM chính chủ trong kho của bạn</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10">
                    <Info size={11} className="text-slate-400" />
                    <span>Tra cứu tham khảo thị trường</span>
                  </span>
                )}
              </div>

              <div className="text-slate-400 text-[11px] font-medium">Mức giá khuyến nghị theo thị trường:</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight tabular-nums mt-1">
                {formatVND(result.suggestedPrice)}
              </div>

              {/* 3 Biên độ mức giá */}
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
              {result.confidenceScore && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 ml-auto">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>Độ tin cậy: {Math.round(result.confidenceScore * 100)}%</span>
                </span>
              )}
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

            {/* ═══ KHU VỰC NÚT HÀNH ĐỘNG PHÂN QUYỀN ═══ */}
            <div className="space-y-2 pt-1">
              {isOwnedByUser ? (
                // ─── TRƯỜNG HỢP 1: SIM THUỘC KHO SỞ HỮU CỦA NGƯỜI DÙNG ───
                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/auctions?keyword=${(result?.phoneNumber || "").replace(/\D/g, "")}`}
                    onClick={onClose}
                    className="flex-1 py-3 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold text-center transition-colors"
                  >
                    Xem phiên tương tự
                  </Link>

                  <Link
                    href={
                      matchedOwnedSim
                        ? `/profile?tab=auctions&createSimId=${matchedOwnedSim.id}`
                        : `/profile?tab=auctions`
                    }
                    onClick={onClose}
                    className="flex-1 py-3 px-3.5 rounded-xl bg-[#001743] hover:bg-[#00266B] active:scale-[0.99] text-white text-xs font-bold text-center shadow-md transition-all flex items-center justify-center gap-1.5 group"
                  >
                    <span>Đăng bán đấu giá số này</span>
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              ) : (
                // ─── TRƯỜNG HỢP 2: SIM KHÔNG THUỘC KHO (HOẶC CHƯA ĐĂNG NHẬP) ───
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <Link
                      href={`/auctions?keyword=${(result?.phoneNumber || "").replace(/\D/g, "")}`}
                      onClick={onClose}
                      className="flex-1 py-3 px-4 rounded-xl bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold text-center shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Search size={13} />
                      <span>Khám phá các phiên SIM tương tự trên sàn</span>
                    </Link>

                    {isAuthenticated && (
                      <Link
                        href="/profile?tab=auctions"
                        onClick={onClose}
                        className="py-3 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold text-center transition-colors shrink-0 flex items-center gap-1"
                        title="Đăng ký thêm số SIM này vào kho của bạn nếu bạn là chủ sở hữu"
                      >
                        <Plus size={13} />
                        <span>Thêm vào kho</span>
                      </Link>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 flex items-start gap-1.5">
                    <Info size={13} className="text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Lưu ý:</strong> Quý khách chỉ có thể mở phiên đấu giá cho các số SIM chính chủ đã được xác thực trong Kho SIM của mình.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
