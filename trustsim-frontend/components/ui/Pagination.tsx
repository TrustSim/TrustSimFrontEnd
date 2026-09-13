"use client";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  loading?: boolean;
}

export function Pagination({
  pageIndex,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  loading = false,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, pageIndex), totalPages);

  const from = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalCount);

  // Generate pagination items: e.g. [1, 2, '...', 5, 6, 7, '...', 10]
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push("ellipsis-1");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(i);
      }
    }

    if (currentPage < totalPages - 2) {
      pages.push("ellipsis-2");
    }

    pages.push(totalPages);
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-[#E2E8F0] text-xs select-none">
      {/* Left: Summary text & page size selector */}
      <div className="flex items-center gap-3 text-[#6B7280]">
        <span>
          Hiển thị <strong className="text-[#001743] font-semibold">{from}–{to}</strong> trên tổng số{" "}
          <strong className="text-[#001743] font-semibold">{totalCount}</strong> bản ghi
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-[#E2E8F0]">
            <span className="text-[11px] text-[#6B7280]">Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={loading}
              className="px-2 py-1 bg-white border border-[#D1D5DB] rounded-[6px] text-xs font-semibold text-[#001743] focus:border-[#001743] focus:outline-none disabled:opacity-50 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page navigation */}
      <div className="flex items-center gap-1">
        {/* Previous page button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          aria-label="Trang trước"
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#4B5563] bg-white border border-[#D1D5DB] hover:bg-slate-50 hover:text-[#001743] rounded-[6px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline">Trước</span>
        </button>

        {/* Page buttons */}
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, idx) => {
            if (typeof p === "string") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 text-xs select-none"
                >
                  …
                </span>
              );
            }

            const isActive = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                disabled={loading}
                className={`min-w-[28px] h-7 px-2 text-xs font-bold rounded-[6px] transition-colors tabular-nums ${
                  isActive
                    ? "bg-[#001743] text-white shadow-xs"
                    : "bg-white text-[#4B5563] border border-[#D1D5DB] hover:bg-slate-50 hover:text-[#001743]"
                } disabled:opacity-50`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next page button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
          aria-label="Trang kế tiếp"
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#4B5563] bg-white border border-[#D1D5DB] hover:bg-slate-50 hover:text-[#001743] rounded-[6px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="hidden sm:inline">Tiếp</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
