"use client";

import React, { Suspense } from "react";
import { AdminSimsTab } from "@/components/admin/AdminSimsTab";

export default function AdminSimsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Đang tải dữ liệu kho SIM...
        </div>
      }
    >
      <AdminSimsTab />
    </Suspense>
  );
}
