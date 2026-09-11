"use client";
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Smartphone,
  Gavel,
  FolderTree,
  Radio,
  CreditCard,
  Users,
  ShieldCheck,
  AlertOctagon,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  Bell,
  CheckCircle2,
  Shield,
  Layers,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  tab: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  badge?: string | number;
  badgeType?: "danger" | "warning" | "info";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "TỔNG QUAN",
    items: [
      { id: "dashboard", label: "Tổng quan", tab: "dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "KHO SIM & ĐẤU GIÁ",
    items: [
      { id: "sims", label: "Quản lý SIM", tab: "sims", icon: Smartphone },
      { id: "auctions", label: "Phiên đấu giá", tab: "auctions", icon: Gavel, badge: 24, badgeType: "info" },
      { id: "categories", label: "Danh mục SIM", tab: "categories", icon: FolderTree },
      { id: "carriers", label: "Nhà mạng & Đầu số", tab: "carriers", icon: Radio },
    ],
  },
  {
    title: "TÀI CHÍNH & TÀI KHOẢN",
    items: [
      { id: "transactions", label: "Giao dịch Escrow", tab: "transactions", icon: CreditCard },
      { id: "users", label: "Người dùng", tab: "users", icon: Users },
      { id: "ekyc", label: "Phê duyệt eKYC", tab: "ekyc", icon: ShieldCheck, badge: 3, badgeType: "warning" },
    ],
  },
  {
    title: "VẬN HÀNH & AN TOÀN",
    items: [
      { id: "disputes", label: "Khiếu nại", tab: "disputes", icon: AlertOctagon, badge: 2, badgeType: "danger" },
      { id: "anomalies", label: "Giám sát AI Fraud", tab: "anomalies", icon: Bot, badge: "AI", badgeType: "danger" },
      { id: "settings", label: "Cấu hình hệ thống", tab: "settings", icon: Settings },
    ],
  },
];

const TAB_LABELS: Record<string, string> = {
  dashboard: "Tổng quan hệ thống",
  sims: "Quản lý kho SIM",
  auctions: "Quản lý phiên đấu giá",
  categories: "Danh mục & Định giá SIM",
  carriers: "Nhà mạng & Dải đầu số",
  transactions: "Giao dịch ký quỹ Escrow",
  users: "Quản lý người dùng & Phân quyền",
  ekyc: "Phê duyệt hồ sơ eKYC",
  disputes: "Giải quyết khiếu nại & Trọng tài",
  anomalies: "AI Giám sát bất thường & Gian lận",
  settings: "Cài đặt & Cấu hình sàn",
};

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);

  // Active tab determination
  const currentTab = searchParams?.get("tab") || "dashboard";

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] text-[#001743] font-sans antialiased">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-[#E5E7EB] flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? "w-[68px]" : "w-[250px]"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-[#E5E7EB] flex items-center px-4 gap-3 select-none">
          <div className="w-9 h-9 rounded-md bg-[#E4011E] text-white flex items-center justify-center font-bold text-base tracking-tighter shadow-sm shrink-0">
            TS
          </div>
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap leading-tight">
              <div className="font-extrabold text-[#001743] text-[15px] tracking-tight flex items-center gap-1.5">
                TrustSim
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-[#E4011E] border border-red-100">
                  Admin
                </span>
              </div>
              <div className="text-[11px] text-[#6B7280] font-medium">Sàn Giao Dịch Số Đẹp</div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <div className="px-2 pb-1.5 text-[10px] font-bold tracking-wider text-[#9CA3AF] uppercase">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = currentTab === item.tab;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.id}
                      href={`/admin?tab=${item.tab}`}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 relative ${
                        isActive
                          ? "bg-red-50 text-[#E4011E] font-semibold border border-red-200/70"
                          : "text-[#4B5563] hover:text-[#001743] hover:bg-gray-100/70 border border-transparent"
                      }`}
                    >
                      <Icon
                        size={18}
                        strokeWidth={1.5}
                        className={`shrink-0 ${isActive ? "text-[#E4011E]" : "text-[#6B7280]"}`}
                      />
                      {!collapsed && (
                        <span className="flex-1 truncate tracking-normal">{item.label}</span>
                      )}
                      {!collapsed && item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            item.badgeType === "danger"
                              ? "bg-red-100 text-[#E4011E]"
                              : item.badgeType === "warning"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-2.5 border-t border-[#E5E7EB] bg-white space-y-1">
          {/* Admin User Info */}
          {!collapsed ? (
            <div className="p-2 rounded-md bg-[#F8F9FA] border border-[#E5E7EB] flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-md bg-[#001743] text-white flex items-center justify-center font-bold text-xs shrink-0">
                AD
              </div>
              <div className="overflow-hidden leading-snug flex-1">
                <div className="text-xs font-bold text-[#001743] truncate">Super Administrator</div>
                <div className="text-[10px] text-[#6B7280] truncate">admin@trustsim.vn</div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 rounded-md bg-[#001743] text-white flex items-center justify-center font-bold text-xs">
                AD
              </div>
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-2 rounded-md text-xs font-medium text-[#4B5563] hover:text-[#001743] hover:bg-gray-100 transition-colors border border-transparent"
          >
            {collapsed ? (
              <ChevronRight size={16} strokeWidth={1.5} />
            ) : (
              <>
                <ChevronLeft size={16} strokeWidth={1.5} />
                <span>Thu gọn menu</span>
              </>
            )}
          </button>

          {/* Return to Marketplace */}
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-1.5 px-2 rounded-md text-xs font-medium text-[#6B7280] hover:text-[#E4011E] hover:bg-red-50/50 transition-colors"
          >
            <Home size={16} strokeWidth={1.5} />
            {!collapsed && <span>Về trang người dùng</span>}
          </Link>
        </div>
      </aside>

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
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-medium">
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
                className="p-2 rounded-md text-[#4B5563] hover:text-[#001743] hover:bg-gray-100 transition-colors relative"
                aria-label="Thông báo"
              >
                <Bell size={18} strokeWidth={1.5} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E4011E] ring-2 ring-white"></span>
              </button>
            </div>

            {/* Role Badge */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#E5E7EB]">
              <div className="w-8 h-8 rounded bg-[#001743] text-white flex items-center justify-center font-bold text-xs">
                A
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
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-sm text-gray-500">Đang tải giao diện quản trị...</div>}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}
