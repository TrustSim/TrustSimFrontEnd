"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Search, ScrollText } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminDataPrimitives";
import { Pagination } from "@/components/ui/Pagination";
import { exportTableToExcel } from "@/services/excelService";
import { getAuditLogs, type AuditLogDto } from "@/services/auditLogService";

export function AdminAuditLogsTab() {
  const [items, setItems] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [entityName, setEntityName] = useState("");
  const [entityId, setEntityId] = useState("");
  const [actorId, setActorId] = useState("");
  const [actionType, setActionType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedKeyword(keyword.trim()); setPageIndex(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  const currentFilter = useMemo(() => ({
    keyword: debouncedKeyword || undefined,
    entityName: entityName.trim() || undefined,
    entityId: entityId.trim() || undefined,
    actorId: actorId.trim() || undefined,
    actionType: actionType || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  }), [debouncedKeyword, entityName, entityId, actorId, actionType, fromDate, toDate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAuditLogs({ ...currentFilter, pageIndex, pageSize, sortOrder: "Desc" });
      setItems(result.items);
      setTotalCount(result.totalCount);
    } finally {
      setLoading(false);
    }
  }, [currentFilter, pageIndex, pageSize]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleExport = async () => {
    setExporting(true);
    try { await exportTableToExcel("/AuditLogs/export", currentFilter, "TrustSim_AuditLogs"); }
    finally { setExporting(false); }
  };

  return <div className="admin-tab space-y-4">
    <AdminPageHeader title="Nhật ký kiểm toán hệ thống" description="Theo dõi ai đã thay đổi dữ liệu nào và xuất đúng phạm vi đang lọc." badge={`${totalCount} sự kiện`} actions={<><button type="button" onClick={handleExport} disabled={exporting} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#001743] disabled:opacity-50"><Download size={14} />{exporting ? "Đang xuất…" : "Xuất Excel"}</button><button type="button" onClick={() => void loadData()} disabled={loading} aria-label="Làm mới nhật ký" className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-[#001743] disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /></button></>} />
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        <label className="relative xl:col-span-2"><Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tên nhật ký, người thực hiện…" className="min-h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs" /></label>
        <input value={entityName} onChange={(event) => { setEntityName(event.target.value); setPageIndex(1); }} placeholder="Tên thực thể" className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs" />
        <select value={actionType} onChange={(event) => { setActionType(event.target.value); setPageIndex(1); }} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs"><option value="">Tất cả hành động</option><option value="CREATE">Tạo mới</option><option value="UPDATE">Cập nhật</option></select>
        <input value={entityId} onChange={(event) => { setEntityId(event.target.value); setPageIndex(1); }} placeholder="Entity ID" className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs" />
        <input value={actorId} onChange={(event) => { setActorId(event.target.value); setPageIndex(1); }} placeholder="Actor ID" className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs" />
        <label className="text-[10px] font-semibold text-slate-500">Từ ngày<input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setPageIndex(1); }} className="mt-1 min-h-9 w-full rounded-lg border border-slate-200 px-2 text-xs" /></label>
        <label className="text-[10px] font-semibold text-slate-500">Đến ngày<input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setPageIndex(1); }} className="mt-1 min-h-9 w-full rounded-lg border border-slate-200 px-2 text-xs" /></label>
      </div>
    </section>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="border-b border-slate-200 bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Hành động</th><th className="px-4 py-3">Thực thể</th><th className="px-4 py-3">Người thực hiện</th><th className="px-4 py-3">Địa chỉ IP</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={5} className="px-4 py-16 text-center text-slate-500">Đang tải nhật ký…</td></tr> : items.length === 0 ? <tr><td colSpan={5} className="px-4 py-16 text-center text-slate-500"><ScrollText className="mx-auto mb-2 size-5" />Không có sự kiện phù hợp.</td></tr> : items.map((item) => <tr key={item.id} className="hover:bg-slate-50"><td className="whitespace-nowrap px-4 py-3">{new Date(item.createdDate).toLocaleString("vi-VN")}</td><td className="px-4 py-3 font-semibold text-[#001743]">{String(item.actionType)}</td><td className="px-4 py-3"><strong className="block">{item.entityName}</strong><span className="font-mono text-[10px] text-slate-500">{item.entityId}</span></td><td className="px-4 py-3"><strong className="block">{item.actorName}</strong><span className="font-mono text-[10px] text-slate-500">{item.actorId}</span></td><td className="px-4 py-3 font-mono text-slate-600">{item.ipAddress || "—"}</td></tr>)}</tbody></table></div>
      <Pagination pageIndex={pageIndex} pageSize={pageSize} totalCount={totalCount} onPageChange={setPageIndex} onPageSizeChange={(size) => { setPageSize(size); setPageIndex(1); }} />
    </section>
  </div>;
}
