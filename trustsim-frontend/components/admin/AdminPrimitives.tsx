"use client";

import React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

export type SortDirection = "asc" | "desc";

export function AdminSortButton({
  label,
  active,
  direction = "asc",
  onClick,
  align = "left",
}: {
  label: string;
  active?: boolean;
  direction?: SortDirection;
  onClick: () => void;
  align?: "left" | "right" | "center";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`admin-sort-button inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] font-bold uppercase tracking-[.06em] text-[#667085] hover:text-[#101828] ${
        align === "right" ? "justify-end w-full" : align === "center" ? "justify-center w-full" : "justify-start"
      }`}
      aria-label={`Sắp xếp theo ${label}`}
    >
      <span className="whitespace-nowrap">{label}</span>
      {active ? (
        direction === "asc" ? <ArrowUp size={12} className="shrink-0" /> : <ArrowDown size={12} className="shrink-0" />
      ) : (
        <ChevronsUpDown size={12} className="text-[#98a2b3] shrink-0" />
      )}
    </button>
  );
}

export function toggleSort<T extends string>(
  currentKey: T,
  currentDirection: SortDirection,
  key: T
): { key: T; direction: SortDirection } {
  return {
    key,
    direction: currentKey === key && currentDirection === "asc" ? "desc" : "asc",
  };
}

