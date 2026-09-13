"use client";

import React, { Suspense } from "react";
import { AdminStaffTab } from "@/components/admin/AdminStaffTab";

export default function AdminStaffPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang tải danh sách nhân sự...</div>}>
      <AdminStaffTab />
    </Suspense>
  );
}
