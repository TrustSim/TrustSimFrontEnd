"use client";

import React, { Suspense } from "react";
import { AdminCarriersTab } from "@/components/admin/AdminCarriersTab";

export default function AdminCarriersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang tải dữ liệu nhà mạng & đầu số...</div>}>
      <AdminCarriersTab />
    </Suspense>
  );
}
