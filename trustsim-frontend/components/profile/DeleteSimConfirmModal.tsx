"use client";

import React, { useState } from "react";
import { X, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { OwnedSim } from "./types";
import { ToastMessage } from "@/components/ui/Toast";
import { deleteSim } from "@/services/simService";

interface DeleteSimConfirmModalProps {
  sim: OwnedSim;
  onClose: () => void;
  onSuccess: (simId: string) => void;
  addToast: (t: Omit<ToastMessage, "id">) => void;
}

export default function DeleteSimConfirmModal({
  sim,
  onClose,
  onSuccess,
  addToast,
}: DeleteSimConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const isGuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(sim.id);
      if (isGuid) {
        await deleteSim(sim.id);
      }
      onSuccess(sim.id);
      addToast({
        type: "success",
        title: "Xóa SIM thành công",
        message: `Đã xóa số SIM ${sim.simNumber} khỏi kho cá nhân của bạn.`,
      });
      onClose();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Không thể xóa SIM",
        message: err.message || "Đã xảy ra lỗi khi xóa số SIM.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-[20px] w-full max-w-[440px] shadow-2xl border border-slate-100 animate-fade-up flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
              <Trash2 size={18} />
            </div>
            <h3 className="text-base font-black text-[#001743] tracking-tight m-0">
              Xóa số SIM khỏi kho
            </h3>
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

        {/* Body */}
        <div className="p-5 flex flex-col gap-3">
          <p className="text-xs text-slate-600 leading-relaxed m-0">
            Bạn có chắc chắn muốn xóa số SIM{" "}
            <strong className="text-[#001743] font-mono">{sim.simNumber}</strong> (
            {sim.carrier}) khỏi kho tài sản của mình không?
          </p>

          {sim.ownershipStatus === "VERIFIED_OWNER" && (
            <div className="p-3 bg-amber-50/70 rounded-[12px] text-[11.5px] text-amber-900 border border-amber-200/50 flex items-start gap-2 leading-relaxed">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Lưu ý:</strong> Số SIM này đã được xác thực chính chủ. Nếu xóa, bạn sẽ cần thực hiện lại quy trình xác thực nếu muốn thêm lại sau này.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-full text-xs font-semibold transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
          >
            {deleting && <RefreshCw size={13} className="animate-spin" />}
            <span>{deleting ? "Đang xóa..." : "Xác nhận xóa"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
