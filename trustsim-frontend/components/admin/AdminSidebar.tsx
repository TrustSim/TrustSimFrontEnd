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
      { id: "transactions", label: "Giao dịch Ký quỹ", tab: "transactions", icon: CreditCard },
      { id: "users", label: "Người dùng", tab: "users", icon: Users },
      { id: "ekyc", label: "Phê duyệt eKYC", tab: "ekyc", icon: ShieldCheck, badge: 3, badgeType: "warning" },
    ],
  },
  {
    title: "VẬN HÀNH & AN TOÀN",
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
      className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-[#E5E7EB] flex flex-col transition-all duration-300 ease-in-out select-none ${
        collapsed ? "w-[68px]" : "w-[250px]"
      }`}
    >
      {/* Brand Header with Asset 14 Logo */}
      <div className="h-16 border-b border-[#E5E7EB] flex items-center px-3.5 justify-center">
        <Link href="/admin" className="flex items-center justify-center w-full">
          {!collapsed ? (
            <Image
              src={asset14Logo}
              alt="TrustSim Logo"
              height={38}
              className="h-[38px] w-auto object-contain max-w-[200px]"
              priority
            />
          ) : (
            <Image
              src="/logo/S-Logo.png"
              alt="TrustSim"
              width={26}
              height={32}
              className="h-7 w-auto object-contain"
              priority
            />
          )}
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {ADMIN_NAV_SECTIONS.map((section) => (
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
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-all duration-150 relative ${
                      isActive
                        ? "bg-slate-100 text-[#001743] font-bold border border-slate-200 shadow-xs"
                        : "text-[#4B5563] hover:text-[#001743] hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={1.5}
                      className={`shrink-0 ${isActive ? "text-[#001743]" : "text-[#6B7280]"}`}
                    />
                    {!collapsed && (
                      <span className="flex-1 truncate tracking-normal">{item.label}</span>
                    )}
                    {!collapsed && item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-[4px] ${
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
      <div className="p-2 border-t border-[#E5E7EB] bg-white">
        {/* Administrator Status Pill */}
        {!collapsed ? (
          <div className="p-2 rounded-[8px] bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-[6px] bg-[#001743] flex items-center justify-center p-1 shrink-0 shadow-xs">
                <Image
                  src="/logo/S-White-Logo.png"
                  alt="Admin"
                  width={16}
                  height={16}
                  className="object-contain"
                />
              </div>
              <div className="overflow-hidden leading-tight flex-1">
                <div className="text-xs font-bold text-[#001743] truncate">Administrator</div>
                <div className="text-[10px] text-[#9CA3AF] truncate">admin@trustsim.vn</div>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Đang trực tuyến"></div>
          </div>
        ) : (
          <div className="flex justify-center mb-2">
            <div className="w-8 h-8 rounded-[6px] bg-[#001743] flex items-center justify-center p-1.5 shadow-xs">
              <Image
                src="/logo/S-White-Logo.png"
                alt="Admin"
                width={18}
                height={18}
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
