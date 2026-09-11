"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import asset14Logo from "@/assets/logo/Asset 14.png";
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
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  tab: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  badge?: string | number;
  badgeType?: "danger" | "warning" | "info";
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    title: "Tổng quan",
    items: [
      { id: "dashboard", label: "Tổng quan", tab: "dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Kho SIM & Đấu giá",
    items: [
      { id: "sims", label: "Quản lý SIM", tab: "sims", icon: Smartphone },
      { id: "auctions", label: "Phiên đấu giá", tab: "auctions", icon: Gavel },
      { id: "categories", label: "Danh mục SIM", tab: "categories", icon: FolderTree },
      { id: "carriers", label: "Nhà mạng & Đầu số", tab: "carriers", icon: Radio },
    ],
  },
  {
    title: "Tài chính & Tài khoản",
    items: [
      { id: "transactions", label: "Giao dịch Ký quỹ", tab: "transactions", icon: CreditCard },
      { id: "users", label: "Người dùng", tab: "users", icon: Users },
      { id: "ekyc", label: "Phê duyệt eKYC", tab: "ekyc", icon: ShieldCheck, badge: 3, badgeType: "warning" },
    ],
  },
  {
    title: "Vận hành & An toàn",
    items: [
      { id: "disputes", label: "Khiếu nại", tab: "disputes", icon: AlertOctagon, badge: 2, badgeType: "danger" },
      { id: "anomalies", label: "Giám sát AI Fraud", tab: "anomalies", icon: Bot, badge: 2, badgeType: "danger" },
      { id: "settings", label: "Cấu hình hệ thống", tab: "settings", icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  currentTab: string;
}

export default function AdminSidebar({
  collapsed,
  onToggleCollapse,
  currentTab,
}: AdminSidebarProps) {
  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-200/70 flex flex-col transition-all duration-300 ease-in-out select-none ${
        collapsed ? "w-[68px]" : "w-[245px]"
      }`}
    >
      {/* Brand Header with Asset 14 Logo */}
      <div className="h-14 border-b border-slate-100 flex items-center px-4 justify-center">
        <Link href="/admin" className="flex items-center justify-center w-full">
          {!collapsed ? (
            <Image
              src={asset14Logo}
              alt="TrustSim Logo"
              height={28}
              className="h-[28px] w-auto object-contain max-w-[170px]"
              priority
            />
          ) : (
            <Image
              src="/logo/S-Logo.png"
              alt="TrustSim"
              width={24}
              height={28}
              className="h-6 w-auto object-contain"
              priority
            />
          )}
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
        {ADMIN_NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 tracking-normal">
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
                    className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative ${
                      isActive
                        ? "bg-slate-100 text-[#001743] font-semibold"
                        : "text-slate-600 hover:text-[#001743] hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`p-1 rounded-md transition-all duration-150 flex items-center justify-center ${
                        isActive
                          ? "bg-white text-[#001743] shadow-2xs"
                          : "group-hover:bg-slate-100 group-hover:text-blue-600 group-hover:scale-105"
                      }`}
                    >
                      <Icon
                        size={17}
                        strokeWidth={1.5}
                        className={`shrink-0 transition-transform ${isActive ? "text-[#001743]" : "text-slate-500"}`}
                      />
                    </div>
                    {!collapsed && (
                      <span className="flex-1 truncate tracking-normal">{item.label}</span>
                    )}
                    {!collapsed && item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          item.badgeType === "danger"
                            ? "bg-rose-100 text-rose-700"
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

      {/* Minimalist Sidebar Footer */}
      <div className="p-2.5 border-t border-slate-100 bg-white">
        {/* Administrator Status Pill */}
        {!collapsed ? (
          <div
            title="admin@trustsim.vn"
            className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 mb-2"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-md bg-[#001743] flex items-center justify-center p-1 shrink-0 shadow-2xs">
                <Image
                  src="/logo/S-White-Logo.png"
                  alt="Admin"
                  width={15}
                  height={15}
                  className="object-contain"
                />
              </div>
              <div className="overflow-hidden leading-tight flex-1">
                <div className="text-xs font-semibold text-[#001743] truncate">Administrator</div>
                <div className="text-[10px] text-slate-400 truncate">Admin Core</div>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Đang trực tuyến"></div>
          </div>
        ) : (
          <div className="flex justify-center mb-2">
            <div className="w-8 h-8 rounded-md bg-[#001743] flex items-center justify-center p-1.5 shadow-2xs">
              <Image
                src="/logo/S-White-Logo.png"
                alt="Admin"
                width={16}
                height={16}
                className="object-contain"
              />
            </div>
          </div>
        )}

        {/* Minimalist Bottom Actions (Sleek Compact Icons) */}
        <div
          className={`flex items-center gap-1 ${
            collapsed ? "flex-col justify-center" : "justify-between px-1"
          }`}
        >
          {/* Return to Marketplace Icon */}
          <Link
            href="/"
            title="Về trang người dùng"
            aria-label="Về trang người dùng"
            className="flex items-center justify-center p-2 rounded-[6px] text-[#6B7280] hover:text-[#001743] hover:bg-slate-100 transition-colors"
          >
            <Home size={17} strokeWidth={1.5} />
          </Link>

          {/* Toggle Collapse Icon */}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            aria-label={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            className="flex items-center justify-center p-2 rounded-[6px] text-[#6B7280] hover:text-[#001743] hover:bg-slate-100 transition-colors"
          >
            {collapsed ? (
              <ChevronRight size={17} strokeWidth={1.5} />
            ) : (
              <ChevronLeft size={17} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
