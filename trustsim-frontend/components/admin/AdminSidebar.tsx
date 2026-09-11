"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Smartphone,
  Gavel,
  FolderTree,
  Radio,
  CreditCard,
  Users,
  UserCheck,
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
      { id: "customers", label: "Khách hàng", tab: "customers", icon: Users },
      { id: "staff", label: "Nhân sự & Nội bộ", tab: "staff", icon: UserCheck },
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
      className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-200/70 flex flex-col transition-all duration-300 ease-in-out select-none ${collapsed ? "w-[68px]" : "w-[245px]"
        }`}
    >
      {/* Brand Header */}
      <div className="h-14 border-b border-slate-100 flex items-center justify-center px-4">
        <Link href="/admin" className="flex items-center justify-center">
          <Image
            src="/logo/S-Logo.png"
            alt="TrustSim"
            width={24}
            height={24}
            className="object-contain"
            priority
          />
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
                    className={`group flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 relative ${isActive
                      ? "bg-[#001743]/[0.06] text-[#001743] font-semibold border-l-[3px] border-[#001743] pl-[calc(0.5rem-3px)]"
                      : "text-slate-500 hover:text-[#001743] hover:bg-slate-50 border-l-[3px] border-transparent"
                      }`}
                  >
                    {/* Icon with relative positioning for dot indicator */}
                    <div className="relative flex items-center justify-center">
                      <Icon
                        size={17}
                        className={`shrink-0 transition-all duration-150 ${isActive ? "text-[#001743]" : "text-slate-400 group-hover:text-[#001743]"
                          }`}
                      />
                      {/* Dot indicator: only shown in collapsed mode when badge exists */}
                      {collapsed && item.badge !== undefined && (
                        <span
                          className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ring-2 ring-white ${item.badgeType === "danger"
                            ? "bg-rose-500"
                            : item.badgeType === "warning"
                              ? "bg-amber-400"
                              : "bg-blue-500"
                            }`}
                        />
                      )}
                    </div>
                    {!collapsed && (
                      <span className="flex-1 truncate tracking-normal">{item.label}</span>
                    )}
                    {!collapsed && item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${item.badgeType === "danger"
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

      {/* Sidebar Footer */}
      <div className="p-2.5 border-t border-slate-100 bg-white">
        {/* Collapsed: just action icons */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <Link
              href="/"
              title="Về trang người dùng"
              aria-label="Về trang người dùng"
              className="flex items-center justify-center p-2 rounded-[6px] text-slate-400 hover:text-[#001743] hover:bg-slate-100 transition-colors"
            >
              <Home size={17} strokeWidth={1.5} />
            </Link>
            <button
              onClick={onToggleCollapse}
              title="Mở rộng thanh điều hướng"
              aria-label="Mở rộng thanh điều hướng"
              className="flex items-center justify-center p-2 rounded-[6px] text-slate-400 hover:text-[#001743] hover:bg-slate-100 transition-colors"
            >
              <ChevronRight size={17} strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1">
            <Link
              href="/"
              title="Về trang người dùng"
              aria-label="Về trang người dùng"
              className="flex items-center justify-center p-2 rounded-[6px] text-slate-400 hover:text-[#001743] hover:bg-slate-100 transition-colors"
            >
              <Home size={17} strokeWidth={1.5} />
            </Link>
            <button
              onClick={onToggleCollapse}
              title="Thu gọn thanh điều hướng"
              aria-label="Thu gọn thanh điều hướng"
              className="flex items-center justify-center p-2 rounded-[6px] text-slate-400 hover:text-[#001743] hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={17} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
