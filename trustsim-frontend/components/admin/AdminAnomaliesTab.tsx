/* Hallmark · genre: modern-minimal · macrostructure: Workbench · designed-as-app */
"use client";

import { Bot, DatabaseZap, RefreshCw, ShieldCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminDataPrimitives";

export function AdminAnomaliesTab() {
  return (
    <div className="admin-tab admin-tab-anomalies space-y-4">
      <AdminPageHeader
        title="Giám sát bất thường & gian lận"
        description="Không hiển thị cảnh báo giả khi backend chưa cung cấp API giám sát."
        badge="Chưa có nguồn dữ liệu"
        actions={
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-400 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} />
            Đồng bộ cảnh báo
          </button>
        }
      />

      <section className="overflow-hidden rounded-xl border border-[#e4e7ec] bg-white shadow-xs">
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#001743]">
            <Bot size={15} />
            Hàng đợi cảnh báo vận hành
          </div>
        </div>
        <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500">
            <DatabaseZap size={22} />
          </div>
          <h2 className="mt-4 text-sm font-bold text-[#001743]">Backend chưa có API cảnh báo bất thường</h2>
          <p className="mt-2 max-w-lg text-xs leading-5 text-slate-500">
            Tab đã có khung quản trị chuẩn nhưng chưa thể lọc, phân trang hoặc xử lý cảnh báo an toàn cho đến khi có endpoint trả danh sách và trạng thái xử lý.
          </p>
          <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-700">
            <ShieldCheck size={14} />
            Các tab có API vẫn đang dùng dữ liệu thật; tab này không tạo dữ liệu demo.
          </div>
        </div>
      </section>
    </div>
  );
}
