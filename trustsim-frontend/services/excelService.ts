import * as XLSX from "xlsx";

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
