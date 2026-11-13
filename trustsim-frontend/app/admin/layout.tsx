/* Hallmark · pre-emit critique: P5 H4 E4 S5 R5 V4 */
"use client";

import React, { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu } from "lucide-react";
import { App as AntApp, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AuthSessionGuard } from "@/components/auth/AuthSessionGuard";
import { NotificationDropdown, UserMenuDropdown } from "@/components/layout/Navbar";
import { authService } from "@/services/authService";
import type { AuthResponseDto } from "@/types/auth";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AuthResponseDto | null>(null);
  const routeTab = pathname?.split("/")[2];
  const currentTab = searchParams?.get("tab") || routeTab || "dashboard";

  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) setCollapsed(true);
  }, []);

  useEffect(() => {
    const syncUser = () => setUser(authService.getUser());
    syncUser();
    window.addEventListener("trustsim_auth_change", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("trustsim_auth_change", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  return (
    <div className="admin-shell min-h-screen flex text-[#001743] font-sans antialiased overflow-x-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        currentTab={currentTab}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`admin-main flex min-h-screen min-w-0 w-full max-w-full flex-1 flex-col transition-[margin] duration-200 ${collapsed ? "lg:ml-[68px]" : "lg:ml-[248px]"}`}>
        <header className="admin-topbar sticky top-0 z-30 flex h-[60px] items-center justify-between border-b px-3 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden rounded-md p-2 text-[#001743] hover:bg-[#eaf0ff]"
            aria-label="Mở danh mục quản trị"
          >
            <Menu size={19} strokeWidth={1.8} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <NotificationDropdown />
            {user && <UserMenuDropdown user={user} isAdmin />}
          </div>
        </header>
        <main className="admin-content mx-auto w-full max-w-[1680px] min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-7">
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
        <div className="min-h-screen bg-[#f7f8fd] flex items-center justify-center text-xs text-slate-500">
          Đang tải giao diện quản trị…
        </div>
      }
    >
      <AuthSessionGuard>
        <ConfigProvider
          locale={viVN}
          theme={{
            token: {
              colorPrimary: "#001743",
              colorInfo: "#4C5FD5",
              colorSuccess: "#15803D",
              colorWarning: "#B45309",
              colorError: "#C5162E",
              colorText: "#0B1630",
              colorTextHeading: "#001743",
              colorTextSecondary: "#5B6477",
              colorBorder: "#D5DBEB",
              colorBorderSecondary: "#E7EBF5",
              colorBgLayout: "#F7F8FD",
              colorBgContainer: "#FFFFFF",
              borderRadius: 8,
              controlHeight: 40,
              fontFamily: "var(--font-inter), Inter, sans-serif",
              fontSize: 13,
              motionDurationFast: "0.12s",
              motionDurationMid: "0.18s",
            },
            components: {
              Table: {
                headerBg: "#F3F5FB",
                headerColor: "#52617B",
                borderColor: "#E7EBF5",
                rowHoverBg: "#F4F6FC",
                cellPaddingBlockSM: 11,
                cellPaddingInlineSM: 14,
              },
              Button: { fontWeight: 600, primaryShadow: "none" },
              Drawer: { paddingLG: 20 },
              Form: { itemMarginBottom: 16, labelColor: "#344054" },
              Pagination: { itemActiveBg: "#001743" },
              Tabs: { itemColor: "#667085", itemSelectedColor: "#001743", inkBarColor: "#4C5FD5" },
            },
          }}
        >
          <AntApp>
            <AdminLayoutInner>{children}</AdminLayoutInner>
          </AntApp>
        </ConfigProvider>
      </AuthSessionGuard>
    </Suspense>
  );
}
