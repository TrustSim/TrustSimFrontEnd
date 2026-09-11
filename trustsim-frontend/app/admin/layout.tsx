"use client";
import React, { Suspense, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Bell } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";

const TAB_LABELS: Record<string, string> = {
  dashboard: "Tổng quan hệ thống",
  sims: "Quản lý kho SIM",
  auctions: "Quản lý phiên đấu giá",
  categories: "Danh mục & Định giá SIM",
  carriers: "Nhà mạng & Dải đầu số",
  transactions: "Giao dịch ký quỹ",
  users: "Quản lý người dùng & Phân quyền",
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
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-6 flex items-center justify-between">
          {/* Breadcrumb / Title */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#6B7280] font-medium">Bảng quản trị</span>
            <span className="text-[#D1D5DB]">/</span>
            <span className="font-semibold text-[#001743] text-sm tracking-tight">
              {TAB_LABELS[currentTab] || "Quản trị"}
            </span>
          </div>

          {/* Header Utilities */}
          <div className="flex items-center gap-4">
            {/* System Health Pulse */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-[6px] text-xs font-medium">
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
                className="p-2 rounded-[6px] text-[#4B5563] hover:text-[#001743] hover:bg-gray-100 transition-colors relative"
                aria-label="Thông báo"
              >
                <Bell size={18} strokeWidth={1.5} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E4011E] ring-2 ring-white"></span>
              </button>
            </div>

            {/* Role Badge with S-Logo */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#E5E7EB]">
              <div className="w-8 h-8 rounded-[6px] bg-[#001743] flex items-center justify-center p-1.5 shadow-xs">
                <Image
                  src="/logo/S-White-Logo.png"
                  alt="Admin"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
              <div className="hidden md:block text-left leading-none">
                <div className="text-xs font-bold text-[#001743]">Admin Center</div>
                <div className="text-[10px] text-[#6B7280] mt-0.5">TrustSim Core v2.0</div>
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
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}
