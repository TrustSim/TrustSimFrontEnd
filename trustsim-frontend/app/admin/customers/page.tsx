"use client";

import React, { Suspense } from "react";
import { AdminCustomersTab } from "@/components/admin/AdminCustomersTab";

export default function AdminCustomersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang tải danh sách khách hàng...</div>}>
      <AdminCustomersTab />
    </Suspense>
  );
}
