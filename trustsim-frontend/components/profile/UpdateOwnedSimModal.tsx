"use client";

import React, { useState } from "react";
import { X, RefreshCw, Smartphone } from "lucide-react";
import { OwnedSim } from "./types";
import { ToastMessage } from "@/components/ui/Toast";
import { updateSim, FormatRhythmItemDto } from "@/services/simService";

interface UpdateOwnedSimModalProps {
  sim: OwnedSim;
  formatRhythmsList: FormatRhythmItemDto[];
  onClose: () => void;
  onSuccess: (updatedSim: OwnedSim) => void;
  addToast: (t: Omit<ToastMessage, "id">) => void;
}

export default function UpdateOwnedSimModal({
  sim,
  formatRhythmsList,
  onClose,
  onSuccess,
  addToast,
}: UpdateOwnedSimModalProps) {
  const [estimatedValue, setEstimatedValue] = useState<number>(sim.estimatedValue || 10_000_000);
  const [estimatedValueFormatted, setEstimatedValueFormatted] = useState<string>(
    (sim.estimatedValue || 10_000_000).toLocaleString("vi-VN")
  );
  const [simType, setSimType] = useState<"Trả trước" | "Trả sau">(sim.simType || "Trả trước");
  const [formatRhythmName, setFormatRhythmName] = useState<string>(sim.formatRhythmName || "");
  const [submitting, setSubmitting] = useState(false);

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
          formatRhythmId: matchedRhythm?.id,
        });
      }

      const updated: OwnedSim = {
        ...sim,
        estimatedValue,
        simType,
        formatRhythmName,
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
        {/* Header Modal */}
        <div className="flex items-center justify-between p-5 pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/logo/S-Logo.png" alt="TrustSIM" className="w-7 h-7 object-contain shrink-0" />
            <div>
              <h3 className="text-base font-black text-[#001743] tracking-tight m-0">
                Cập nhật thông tin số SIM
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Số: {sim.simNumber} ({sim.carrier})
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
            {/* Field: Số điện thoại (Read-only) */}
            <div>
              <label className="block text-xs font-bold text-[#001743] mb-1.5">
                Số điện thoại SIM
              </label>
              <input
                type="text"
                value={sim.simNumber}
                disabled
                className="w-full text-xs p-3 border border-slate-200 rounded-[12px] bg-slate-100 font-mono font-bold text-slate-500 cursor-not-allowed"
              />
            </div>

            {/* Field: Loại thuê bao */}
            <div>
              <label className="block text-xs font-bold text-[#001743] mb-1.5">
                Loại thuê bao <span className="text-red-600">*</span>
              </label>
              <select
                value={simType}
                onChange={(e) => setSimType(e.target.value as any)}
                className="w-full text-xs p-3 border border-slate-200 rounded-[12px] bg-white font-semibold text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
              >
                <option value="Trả trước">Trả trước</option>
                <option value="Trả sau">Trả sau</option>
              </select>
            </div>

            {/* Field: Nhịp định dạng / Thế số */}
            <div>
              <label className="block text-xs font-bold text-[#001743] mb-1.5">
                Nhịp định dạng (Thế số)
              </label>
              <select
                value={formatRhythmName}
                onChange={(e) => setFormatRhythmName(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-[12px] bg-white font-semibold text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
              >
                <option value="">Chưa chọn thế số</option>
                {formatRhythmsList.map((r) => (
                  <option key={r.id} value={r.formatRhythmName}>
                    {r.formatRhythmName}
                  </option>
                ))}
              </select>
            </div>

            {/* Field: Định giá ước tính */}
            <div>
              <label className="block text-xs font-bold text-[#001743] mb-1.5">
                Định giá ước tính <span className="text-red-600">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={estimatedValueFormatted}
                  onChange={handleEstimatedValueMasking}
                  placeholder="10.000.000"
                  className="w-full text-xs p-3 pr-8 border border-slate-200 rounded-[12px] font-mono font-bold text-[#001743] focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 focus:outline-none transition-all"
                  required
                />
                <span className="absolute right-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                  ₫
                </span>
              </div>

              {/* Quick Add Pills */}
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
                    className="px-3 py-1 bg-[#F3F4F6] hover:bg-[#E4011E] hover:text-white active:scale-95 text-slate-700 rounded-full text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
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
