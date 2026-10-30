/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
"use client";
import React, { useRef, useState } from "react";
import { App, Button, Empty, Modal, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import { exportToExcel, parseExcelFile, ExcelColumnDef } from "@/services/excelService";

interface ImportExportBarProps<T = any> {
  data: T[];
  columns: ExcelColumnDef<T>[];
  filename: string;
  sheetName?: string;
  onImport?: (rows: any[]) => void | Promise<void>;
  entityName?: string;
  onExport?: () => void | Promise<void>;
  exportLoading?: boolean;
  showImport?: boolean;
}

export default function ImportExportBar<T = any>({
  data,
  columns,
  filename,
  sheetName = "Sheet1",
  onImport,
  entityName = "dữ liệu",
  onExport,
  exportLoading = false,
  showImport = true,
}: ImportExportBarProps<T>) {
  const { message } = App.useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = () => {
    if (onExport) {
      void onExport();
      return;
    }
    exportToExcel(data, columns, filename, sheetName);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportFileName(file.name);
      const rows = await parseExcelFile(file);
      setPreviewRows(rows);
      setImportModalOpen(true);
    } catch (err: any) {
      void message.error("Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng file.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!onImport || previewRows.length === 0) return;
    setIsProcessing(true);
    try {
      await onImport(previewRows);
      setImportModalOpen(false);
      setPreviewRows([]);
    } catch (err: any) {
      void message.error(`Lỗi khi nhập dữ liệu: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const previewKeys = Object.keys(previewRows[0] || {}).slice(0, 6);
  const previewColumns: ColumnsType<Record<string, unknown>> = [
    {
      title: "#",
      key: "index",
      width: 56,
      render: (_value, _row, index) => index + 1,
    },
    ...previewKeys.map((key) => ({
      title: key,
      dataIndex: key,
      key,
      ellipsis: true,
      render: (value: unknown) => String(value ?? ""),
    })),
  ];

  return (
    <>
      <div className="flex items-center gap-2">
        {showImport && onImport && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              title="Nhập dữ liệu từ file Excel"
              icon={<Upload size={14} strokeWidth={1.8} aria-hidden="true" />}
            >
              Nhập Excel
            </Button>
          </>
        )}

        <Button
          onClick={handleExport}
          disabled={exportLoading}
          title="Xuất bảng ra file Excel"
          icon={<Download size={14} strokeWidth={1.8} aria-hidden="true" />}
        >
          {exportLoading ? "Đang xuất…" : "Xuất Excel"}
        </Button>
      </div>

      <Modal
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        onOk={() => void handleConfirmImport()}
        okText={isProcessing ? "Đang xử lý…" : `Nhập ${previewRows.length} bản ghi`}
        cancelText="Hủy"
        okButtonProps={{ disabled: previewRows.length === 0, loading: isProcessing }}
        width={760}
        title={
          <span className="inline-flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-emerald-700" aria-hidden="true" />
            Xem trước dữ liệu nhập
          </span>
        }
      >
        <p className="mb-3 text-xs text-slate-500">
          {importFileName} · Kiểm tra dữ liệu trước khi đưa vào hệ thống {entityName}.
        </p>
        {previewRows.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="File không có dòng dữ liệu hợp lệ" />
        ) : (
          <Table<Record<string, unknown>>
            rowKey={(_row, index) => String(index)}
            size="small"
            columns={previewColumns}
            dataSource={previewRows.slice(0, 8)}
            pagination={false}
            scroll={{ x: "max-content" }}
          />
        )}
        {previewRows.length > 8 ? (
          <p className="mt-2 text-center text-[11px] text-slate-500">… và {previewRows.length - 8} dòng khác</p>
        ) : null}
      </Modal>
    </>
  );
}
