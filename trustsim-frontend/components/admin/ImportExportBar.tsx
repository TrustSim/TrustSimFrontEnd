"use client";
import React, { useRef, useState } from "react";
import { Download, Upload, FileSpreadsheet, Check, X, AlertCircle } from "lucide-react";
import { exportToExcel, parseExcelFile, ExcelColumnDef } from "@/services/excelService";

interface ImportExportBarProps<T = any> {
  data: T[];
  columns: ExcelColumnDef<T>[];
  filename: string;
  sheetName?: string;
  onImport?: (rows: any[]) => void | Promise<void>;
  entityName?: string;
  showImport?: boolean;
}

export default function ImportExportBar<T = any>({
  data,
  columns,
  filename,
  sheetName = "Sheet1",
  onImport,
  entityName = "dữ liệu",
  showImport = true,
}: ImportExportBarProps<T>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = () => {
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
      alert("Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng file.");
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
      alert(`Lỗi khi nhập dữ liệu: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

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
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#D1D5DB] rounded-[6px] text-xs font-semibold transition-colors shadow-xs"
              title="Nhập dữ liệu từ file Excel"
            >
              <Upload size={13} strokeWidth={2} className="text-slate-500" />
              <span>Nhập Excel</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#D1D5DB] rounded-[6px] text-xs font-semibold transition-colors shadow-xs"
          title="Xuất bảng ra file Excel"
        >
          <Download size={13} strokeWidth={2} className="text-slate-500" />
          <span>Xuất Excel</span>
        </button>
      </div>

      {/* Modal Preview Import */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-[8px] w-full max-w-2xl shadow-xl overflow-hidden animate-fade-up">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-emerald-600" />
                <h3 className="text-sm font-bold text-[#001743]">
                  Xem trước dữ liệu nhập ({previewRows.length} dòng từ {importFileName})
                </h3>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 max-h-[420px] overflow-y-auto">
              <p className="text-xs text-slate-500 mb-3">
                Kiểm tra dữ liệu trích xuất từ file Excel trước khi đưa vào hệ thống {entityName}.
              </p>

              {previewRows.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center gap-2">
                  <AlertCircle size={24} />
                  <span>File không có dòng dữ liệu hợp lệ</span>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-[6px] overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold">
                        <th className="p-2.5">#</th>
                        {Object.keys(previewRows[0] || {}).slice(0, 6).map((headerKey) => (
                          <th key={headerKey} className="p-2.5 whitespace-nowrap">
                            {headerKey}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewRows.slice(0, 8).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-2.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          {Object.keys(previewRows[0] || {}).slice(0, 6).map((headerKey) => (
                            <td key={headerKey} className="p-2.5 max-w-[160px] truncate text-slate-700">
                              {String(row[headerKey] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewRows.length > 8 && (
                    <div className="p-2 bg-slate-50 text-center text-slate-400 text-[11px] border-t border-slate-200">
                      ... và {previewRows.length - 8} dòng khác
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-[#E2E8F0] bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-3.5 py-1.5 border border-[#D1D5DB] text-xs font-semibold text-slate-600 rounded-[6px] hover:bg-white transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={previewRows.length === 0 || isProcessing}
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[6px] transition-colors disabled:opacity-50"
              >
                <Check size={14} />
                <span>{isProcessing ? "Đang xử lý..." : `Xác nhận nhập ${previewRows.length} bản ghi`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
