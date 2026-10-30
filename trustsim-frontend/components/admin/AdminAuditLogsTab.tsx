"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Button, DatePicker, Input, Select, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Download, RefreshCw, Search } from "lucide-react";
import { AdminDataTable, AdminFilterBar, AdminPageHeader } from "@/components/admin/AdminDataPrimitives";
import { exportTableToExcel } from "@/services/excelService";
import { getAuditLogs, type AuditLogDto } from "@/services/auditLogService";

const { RangePicker } = DatePicker;

function actionColor(action: unknown) {
  const value = String(action || "").toUpperCase();
  if (value.includes("DELETE") || value.includes("REMOVE")) return "error";
  if (value.includes("CREATE") || value.includes("ADD")) return "success";
  if (value.includes("UPDATE") || value.includes("EDIT")) return "processing";
  return "default";
}

export function AdminAuditLogsTab() {
  const { message } = App.useApp();
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
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
      setPageIndex(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  const currentFilter = useMemo(
    () => ({
      keyword: debouncedKeyword || undefined,
      entityName: entityName.trim() || undefined,
      entityId: entityId.trim() || undefined,
      actorId: actorId.trim() || undefined,
      actionType: actionType || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }),
    [debouncedKeyword, entityName, entityId, actorId, actionType, fromDate, toDate],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAuditLogs({ ...currentFilter, pageIndex, pageSize, sortOrder: "Desc" });
      setItems(result.items);
      setTotalCount(result.totalCount);
    } catch {
      void message.error("Không thể tải nhật ký kiểm toán.");
    } finally {
      setLoading(false);
    }
  }, [currentFilter, message, pageIndex, pageSize]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportTableToExcel("/AuditLogs/export", currentFilter, "TrustSim_AuditLogs");
    } catch {
      void message.error("Không thể xuất nhật ký kiểm toán.");
    } finally {
      setExporting(false);
    }
  };

  const columns: ColumnsType<AuditLogDto> = [
    {
      title: "Thời gian",
      dataIndex: "createdDate",
      key: "createdDate",
      width: 164,
      render: (value: string) => <span className="whitespace-nowrap">{new Date(value).toLocaleString("vi-VN")}</span>,
    },
    {
      title: "Hành động",
      dataIndex: "actionType",
      key: "actionType",
      width: 132,
      render: (value) => <Tag color={actionColor(value)}>{String(value)}</Tag>,
    },
    {
      title: "Thực thể",
      key: "entity",
      width: 240,
      render: (_, item) => <div className="min-w-0"><strong className="block truncate text-xs text-[var(--admin-ink)]">{item.entityName}</strong><span className="block truncate font-mono text-[11px] text-slate-500">{item.entityId}</span></div>,
    },
    {
      title: "Người thực hiện",
      key: "actor",
      width: 240,
      render: (_, item) => <div className="min-w-0"><strong className="block truncate text-xs text-[var(--admin-ink)]">{item.actorName}</strong><span className="block truncate font-mono text-[11px] text-slate-500">{item.actorId}</span></div>,
    },
    {
      title: "Địa chỉ IP",
      dataIndex: "ipAddress",
      key: "ipAddress",
      width: 140,
      render: (value) => <span className="font-mono text-xs">{value || "—"}</span>,
    },
  ];

  return (
    <div className="admin-tab space-y-4">
      <AdminPageHeader
        title="Nhật ký kiểm toán hệ thống"
        description="Theo dõi thay đổi dữ liệu, tác nhân thực hiện và xuất đúng phạm vi đang lọc."
        badge={`${totalCount} sự kiện`}
        actions={<><Button onClick={() => void handleExport()} loading={exporting} icon={<Download size={14} aria-hidden="true" />}>Xuất Excel</Button><Button onClick={() => void loadData()} loading={loading} icon={<RefreshCw size={14} aria-hidden="true" />}>Làm mới</Button></>}
      />

      <AdminFilterBar>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="admin-filter-field xl:col-span-2"><span>Tìm kiếm</span><Input allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tên nhật ký hoặc người thực hiện" prefix={<Search size={14} aria-hidden="true" />} /></label>
          <label className="admin-filter-field"><span>Thực thể</span><Input allowClear value={entityName} onChange={(event) => { setEntityName(event.target.value); setPageIndex(1); }} /></label>
          <label className="admin-filter-field"><span>Hành động</span><Select value={actionType || undefined} allowClear placeholder="Tất cả hành động" onChange={(value) => { setActionType(value || ""); setPageIndex(1); }} options={[{ value: "CREATE", label: "Tạo mới" }, { value: "UPDATE", label: "Cập nhật" }, { value: "DELETE", label: "Xóa" }]} /></label>
          <label className="admin-filter-field"><span>Entity ID</span><Input allowClear value={entityId} onChange={(event) => { setEntityId(event.target.value); setPageIndex(1); }} /></label>
          <label className="admin-filter-field"><span>Actor ID</span><Input allowClear value={actorId} onChange={(event) => { setActorId(event.target.value); setPageIndex(1); }} /></label>
          <label className="admin-filter-field md:col-span-2"><span>Khoảng thời gian</span><RangePicker format="DD/MM/YYYY" onChange={(_dates, dateStrings) => { setFromDate(dateStrings[0]); setToDate(dateStrings[1]); setPageIndex(1); }} /></label>
        </div>
      </AdminFilterBar>

      <AdminDataTable<AuditLogDto>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={{ current: pageIndex, pageSize, total: totalCount, onChange: (page, size) => { setPageIndex(page); setPageSize(size); } }}
      />
    </div>
  );
}
