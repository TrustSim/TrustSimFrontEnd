import * as XLSX from "xlsx";
import { apiClient } from "./apiClient";
import { buildQueryParams } from "./queryParams";

export interface ExcelColumnDef<T = any> {
  header: string;
  key: keyof T | string;
  width?: number;
  formatter?: (val: any, row: T) => string | number;
}

/**
 * Xuất dữ liệu ra file Excel (.xlsx)
 */
export function exportToExcel<T = any>(
  data: T[],
  columns: ExcelColumnDef<T>[],
  filename: string,
  sheetName: string = "Data"
) {
  if (!data || data.length === 0) {
    const emptyRow = columns.reduce((acc, col) => {
      acc[col.header] = "";
      return acc;
    }, {} as Record<string, any>);
    const ws = XLSX.utils.json_to_sheet([emptyRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
    return;
  }

  // Chuyển đổi dữ liệu theo định dạng các cột
  const formattedRows = data.map((item) => {
    const row: Record<string, any> = {};
    columns.forEach((col) => {
      const rawVal = (item as any)[col.key];
      row[col.header] = col.formatter ? col.formatter(rawVal, item) : rawVal ?? "";
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(formattedRows);

  // Đặt độ rộng cột
  if (columns.some((c) => c.width)) {
    ws["!cols"] = columns.map((c) => ({ wch: c.width || 18 }));
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

/**
 * Đọc dữ liệu từ file Excel tải lên
 */
export function parseExcelFile<T = any>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          resolve([]);
          return;
        }
        const wb = XLSX.read(buffer, { type: "array" });
        const firstSheetName = wb.SheetNames[0];
        if (!firstSheetName) {
          resolve([]);
          return;
        }
        const ws = wb.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json<T>(ws, { defval: "" });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

type ExportFilterValue = string | number | boolean | null | undefined;

/**
 * Tải file Excel do backend tạo, giữ nguyên toàn bộ bộ lọc đang áp dụng trên bảng.
 * Phân trang được loại bỏ để endpoint export trả về toàn bộ bản ghi phù hợp.
 */
export async function exportTableToExcel(
  endpoint: string,
  filter: Record<string, ExportFilterValue>,
  fileNamePrefix: string,
): Promise<void> {
  const { pageIndex: _pageIndex, pageSize: _pageSize, ...exportFilter } = filter;
  const query = buildQueryParams(exportFilter);
  const normalizedEndpoint = endpoint.startsWith("/api/") ? endpoint : `/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const response = await apiClient.get<Blob>(`${normalizedEndpoint}${query ? `?${query}` : ""}`, {
    responseType: "blob",
  });

  const contentDisposition = response.headers["content-disposition"] as string | undefined;
  const encodedName = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plainName = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1];
  const serverFileName = encodedName ? decodeURIComponent(encodedName) : plainName;
  const fileName = serverFileName || `${fileNamePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
