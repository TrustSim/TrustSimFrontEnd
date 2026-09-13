"use client";
import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bell } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AuthSessionGuard } from "@/components/auth/AuthSessionGuard";

const TAB_LABELS: Record<string, string> = {
  dashboard: "Tổng quan hệ thống",
  sims: "Quản lý kho SIM",
  auctions: "Quản lý phiên đấu giá",
  categories: "Danh mục & Định giá SIM",
  carriers: "Nhà mạng & Dải đầu số",
  transactions: "Giao dịch ký quỹ",
  customers: "Quản lý Khách hàng & Tài chính Ví",
  staff: "Quản lý Nhân sự & Quản trị viên",
  users: "Quản lý Khách hàng",
  ekyc: "Phê duyệt hồ sơ eKYC",
  disputes: "Giải quyết khiếu nại & Trọng tài",
  anomalies: "AI Giám sát bất thường & Gian lận",
  settings: "Cài đặt & Cấu hình sàn",
};

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);

  // Active tab determination
  const currentTab = searchParams?.get("tab") || "dashboard";

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] text-[#001743] font-sans antialiased">
      {/* Modular Admin Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        currentTab={currentTab}
      />

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          collapsed ? "ml-[68px]" : "ml-[250px]"
        }`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200 shadow-[0_1px_4px_0_rgba(0,23,67,0.06)] px-6 flex items-center justify-between">
          {/* Breadcrumb / Title */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-normal">Quản trị</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-[#001743] text-xs tracking-tight">
              {TAB_LABELS[currentTab] || "Quản trị"}
            </span>
          </div>

          {/* Header Utilities */}
          <div className="flex items-center gap-3.5">
            {/* System Health Pulse */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-0.5 bg-emerald-50/80 text-emerald-700 border border-emerald-200/60 rounded-full text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Hệ thống trực tuyến</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-500 hover:text-[#001743] hover:bg-slate-100 transition-colors relative"
                aria-label="Thông báo"
              >
                <Bell size={17} strokeWidth={1.5} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E4011E] ring-2 ring-white"></span>
              </button>
            </div>

            {/* Admin Avatar + Info */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200/60">
              {/* Initials Avatar */}
              <div className="w-8 h-8 rounded-full bg-[#001743] flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-white text-[11px] font-bold tracking-wide select-none">AD</span>
              </div>
              <div className="hidden md:block text-left leading-none">
                <div className="text-xs font-semibold text-[#001743]">Administrator</div>
                <div className="text-[10px] text-slate-400 mt-0.5">admin@trustsim.vn</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-xs text-[#6B7280]">
          Đang tải giao diện quản trị...
        </div>
      }
    >
      <AuthSessionGuard>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </AuthSessionGuard>
    </Suspense>
  );
}
