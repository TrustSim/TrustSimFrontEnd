"use client";

import React, { Suspense } from "react";
import { AdminDocumentsTab } from "@/components/admin/AdminDocumentsTab";

export default function AdminDocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Đang tải dữ liệu tài liệu & chính sách...
        </div>
      }
    >
      <AdminDocumentsTab />
    </Suspense>
  );
}
