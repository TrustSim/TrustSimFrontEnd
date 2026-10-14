/* Hallmark · genre: modern-minimal · style: Clean High-Trust Banking · macrostructure: Workbench · role: human-capital-management */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Plus,
  Edit3,
  Lock,
  Unlock,
  RefreshCw,
  X,
  Check,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Headphones,
  UserCheck,
  Eye,
  KeyRound,
  Fingerprint,
  Building2,
  Phone,
  Mail,
  BadgeCheck,
  Users,
  Clock,
  SlidersHorizontal,
} from "lucide-react";
import {
  userService,
  AdminUserDetailDto,
  AdminCreateUserPayload,
  AdminUpdateUserPayload,
  UserRoleEnum,
  VerificationStatusEnum,
} from "@/services/userService";
import {
  RightDrawer,
  DrawerBody,
  DrawerFooter,
  DrawerSection,
  FormField,
  BtnPrimary,
  BtnSecondary,
} from "@/components/ui/RightDrawer";
import { Pagination } from "@/components/ui/Pagination";
import { AdminSortButton, toggleSort, type SortDirection } from "@/components/admin/AdminPrimitives";
import ImportExportBar from "@/components/admin/ImportExportBar";
import { ExcelColumnDef } from "@/services/excelService";

const STAFF_EXPORT_COLUMNS: ExcelColumnDef<AdminUserDetailDto>[] = [
  { header: "Mã nhân sự", key: "id", width: 15 },
  { header: "Họ và tên", key: "fullName", width: 22 },
  { header: "Tên đăng nhập", key: "userName", width: 18 },
  { header: "Email công vụ", key: "email", width: 25 },
  { header: "Số điện thoại", key: "phoneNumber", width: 16 },
  {
    header: "Phân cấp thẩm quyền",
    key: "role",
    width: 20,
    formatter: (v) =>
      v === UserRoleEnum.ADMIN || v === 1 || v === "ADMIN" ? "Quản trị viên (Tier-3)" : "Tư vấn viên (Tier-1)",
  },
  {
    header: "Trạng thái vận hành",
    key: "isActive",
    width: 18,
    formatter: (v) => (v ? "Đang hoạt động" : "Đã tạm khóa"),
  },
  { header: "Ngày cấp quyền", key: "createdDate", width: 18 },
];

// Clean High-Trust Banking Avatar with status ring
function BankingStaffAvatar({
  name,
  avatar,
  isActive,
  size = "md",
}: {
  name: string;
  avatar?: string;
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-8 h-8 text-[11px]",
    md: "w-10 h-10 text-xs",
    lg: "w-14 h-14 text-sm font-semibold",
  }[size];

  const initials = (name || "NV")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(-2)
    .join("")
    .toUpperCase() || "NV";

  return (
    <div className="relative inline-block shrink-0">
      {avatar && avatar.trim() !== "" && !avatar.includes("default.png") ? (
        <img
          src={avatar}
          alt={name}
          className={`${sizeClasses} rounded-full object-cover border border-slate-200/90 bg-white ring-1 ring-slate-100 shadow-2xs`}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div
          className={`${sizeClasses} rounded-full flex items-center justify-center text-white font-semibold tracking-wider bg-[#001743] border border-[#00266B] ring-1 ring-slate-200 shadow-2xs`}
        >
          {initials}
        </div>
      )}

      {/* Realtime Status Indicator Ring */}
      {isActive !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
            isActive ? "bg-emerald-500 ring-1 ring-emerald-300" : "bg-rose-500 ring-1 ring-rose-300"
          }`}
          title={isActive ? "Đang trực tuyến & Hoạt động" : "Tài khoản bị khóa"}
        />
      )}
    </div>
  );
}

export function AdminStaffTab() {
  const [activeSegment, setActiveSegment] = useState<"admins" | "consultants">("admins");
  const [staffList, setStaffList] = useState<AdminUserDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<"name" | "date">("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [totalCount, setTotalCount] = useState(0);

  // Toast & selection
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [updatedStaffId, setUpdatedStaffId] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<AdminUserDetailDto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | "view">("create");

  // Lock / Unlock Confirmation
  const [statusConfirm, setStatusConfirm] = useState<{ user: AdminUserDetailDto; targetStatus: boolean } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPageIndex(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const targetRole = activeSegment === "admins" ? UserRoleEnum.ADMIN : UserRoleEnum.CONSULTANT;

  // Sorting
  const displayStaff = useMemo(() => {
    return [...staffList].sort((a, b) => {
      const left = sortKey === "name" ? (a.fullName || a.userName || "") : String(a.createdDate || "");
      const right = sortKey === "name" ? (b.fullName || b.userName || "") : String(b.createdDate || "");
      const result = String(left).localeCompare(String(right), "vi");
      return sortDirection === "asc" ? result : -result;
    });
  }, [staffList, sortKey, sortDirection]);

  const changeSort = (key: "name" | "date") => {
    const next = toggleSort(sortKey, sortDirection, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
  };

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getAdminUsers({
        keyword: debouncedSearch,
        role: targetRole,
        isActive: selectedStatus !== "" ? selectedStatus === "active" : undefined,
        pageIndex,
        pageSize,
      });
      setStaffList(res.items);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      setError(err.message || "Không thể truy xuất dữ liệu nhân sự kiểm toán.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, targetRole, selectedStatus, pageIndex, pageSize]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const openCreate = () => {
    setSelectedStaff(null);
    setDrawerMode("create");
    setDrawerOpen(true);
  };

  const openView = async (s: AdminUserDetailDto) => {
    setSelectedStaff(s);
    setDrawerMode("view");
    setDrawerOpen(true);
    try {
      const full = await userService.getAdminUserById(s.id);
      if (full) setSelectedStaff(full);
    } catch {
      // Fallback to table data
    }
  };

  const openEdit = async (s: AdminUserDetailDto) => {
    setSelectedStaff(s);
    setDrawerMode("edit");
    setDrawerOpen(true);
    try {
      const full = await userService.getAdminUserById(s.id);
      if (full) setSelectedStaff(full);
    } catch {
      // Fallback to table data
    }
  };

  const handleToggleStatusConfirm = async () => {
    if (!statusConfirm) return;
    setStatusLoading(true);
    try {
      await userService.toggleUserStatus(statusConfirm.user.id, statusConfirm.targetStatus);
      showToast(
        statusConfirm.targetStatus
          ? `Đã kích hoạt quyền vận hành cho tài khoản "${statusConfirm.user.fullName}".`
          : `Đã thu hồi quyền truy cập của tài khoản "${statusConfirm.user.fullName}".`
      );
      setStaffList((prev) =>
        prev.map((s) => (s.id === statusConfirm.user.id ? { ...s, isActive: statusConfirm.targetStatus } : s))
      );
      setStatusConfirm(null);
    } catch (err: any) {
      showToast(`Lỗi kiểm toán: ${err.message}`);
    } finally {
      setStatusLoading(false);
    }
  };

  // High-Trust Metrics summary (Calculated on current scope)
  const activeStaffCount = staffList.filter((s) => s.isActive).length;
  const lockedStaffCount = staffList.filter((s) => !s.isActive).length;

  return (
    <div className="admin-tab-staff space-y-6">
      {/* ── SECTION 1: Institutional Context Header & Master Action Bar ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        {/* Subtle decorative security grid background */}
        <div className="absolute right-0 top-0 w-80 h-full opacity-[0.03] pointer-events-none bg-[radial-gradient(#001743_1px,transparent_1px)] [background-size:12px_12px]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-[#001743] border border-slate-200">
                <ShieldCheck size={12} className="text-[#001743]" />
                <span>Kiểm soát phân quyền cấp cao</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">ISO/IEC 27001 COMPLIANT</span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-[#001743] mt-2">
              Quản Trị Nhân Sự &amp; Thẩm Quyền Vận Hành
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Quản lý định danh nhân sự nội bộ, phân cấp bảo mật Tier-3 (Quản trị viên) và Tier-1 (Tư vấn viên trực sàn).
              Mọi thay đổi thẩm quyền đều được ghi vết tự động vào sổ cái kiểm toán.
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <ImportExportBar
              data={staffList}
              columns={STAFF_EXPORT_COLUMNS}
              filename={`TrustSim_NhanSu_${new Date().toISOString().slice(0, 10)}`}
              entityName="nhân sự"
              onImport={(rows) => {
                const newStaff: AdminUserDetailDto[] = rows
                  .map((r, idx) => ({
                    id: `STAFF-IMP-${Date.now()}-${idx + 1}`,
                    userName: String(r["Tên đăng nhập"] || r.userName || `staff_${Date.now()}_${idx}`),
                    email: String(r["Email"] || r.email || `staff${idx}@trustsim.vn`),
                    role:
                      String(r["Phân cấp"] || r["Vai trò"] || r.role).toLowerCase().includes("admin")
                        ? UserRoleEnum.ADMIN
                        : UserRoleEnum.CONSULTANT,
                    isActive: true,
                    fullName: String(r["Họ và tên"] || r.fullName || "Nhân sự mới"),
                    phoneNumber: String(r["Số điện thoại"] || r.phoneNumber || "").replace(/\D/g, ""),
                    address: String(r["Địa chỉ"] || r.address || "Trụ sở TrustSim"),
                    identityNumber: String(r["Số CCCD/CMND"] || r.identityNumber || ""),
                    verificationStatus: VerificationStatusEnum.VERIFIED,
                    availableBalance: 0,
                    lockedBalance: 0,
                    hasPkiKeys: true,
                    createdDate: new Date().toLocaleDateString("vi-VN"),
                  }))
                  .filter((s) => s.fullName);

                if (newStaff.length > 0) {
                  setStaffList((prev) => [...newStaff, ...prev]);
                  showToast(`Đã ghi nhận ${newStaff.length} nhân sự kiểm toán vào hệ thống.`);
                }
              }}
            />

            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#001743] hover:bg-[#00266B] active:scale-[0.99] text-white text-xs font-semibold rounded-xl shadow-xs transition-all duration-150 shrink-0"
            >
              <Plus size={15} strokeWidth={2} />
              <span>{activeSegment === "admins" ? "Cấp tài khoản Quản trị" : "Cấp tài khoản Tư vấn"}</span>
            </button>
          </div>
        </div>

        {/* ── SECTION 2: Clean High-Trust KPI Metrics Ribbon ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng nhân sự trực</div>
              <div className="text-lg font-bold text-[#001743] font-mono tabular-nums mt-0.5">{totalCount}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/70 flex items-center justify-center text-slate-700 shadow-2xs">
              <Users size={16} strokeWidth={1.5} />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Tier-3 Clearance</div>
              <div className="text-lg font-bold text-purple-950 font-mono tabular-nums mt-0.5">
                {activeSegment === "admins" ? totalCount : "Quản trị"}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200/70 flex items-center justify-center text-purple-700 shadow-2xs">
              <ShieldCheck size={16} strokeWidth={1.5} />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Tier-1 Support</div>
              <div className="text-lg font-bold text-blue-950 font-mono tabular-nums mt-0.5">
                {activeSegment === "consultants" ? totalCount : "Tư vấn"}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-700 shadow-2xs">
              <Headphones size={16} strokeWidth={1.5} />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tình trạng kiểm toán</div>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-emerald-700 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>100% Khóa bảo mật</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shadow-2xs">
              <BadgeCheck size={16} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Institutional Navigation Console & Filter Strip ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Segmented Controller (Banking Switcher) */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 self-start">
            <button
              type="button"
              onClick={() => {
                setActiveSegment("admins");
                setPageIndex(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                activeSegment === "admins"
                  ? "bg-white text-[#001743] shadow-xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck size={15} strokeWidth={activeSegment === "admins" ? 2 : 1.5} className="text-[#001743]" />
              <span>Quản trị viên (Tier-3)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSegment("consultants");
                setPageIndex(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 ${
                activeSegment === "consultants"
                  ? "bg-white text-[#001743] shadow-xs border border-slate-200/60 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Headphones size={15} strokeWidth={activeSegment === "consultants" ? 2 : 1.5} className="text-[#001743]" />
              <span>Tư vấn viên (Tier-1)</span>
            </button>
          </div>

          {/* Quick Status Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <SlidersHorizontal size={12} />
              <span>Trạng thái:</span>
            </span>

            {[
              { id: "", label: "Tất cả" },
              { id: "active", label: "Hoạt động" },
              { id: "locked", label: "Đã tạm khóa" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setSelectedStatus(st.id);
                  setPageIndex(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  selectedStatus === st.id
                    ? "bg-[#001743] text-white shadow-2xs font-bold"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar + Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="relative w-full sm:w-96">
            <Search size={15} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo họ tên, username, số điện thoại, CCCD…"
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#001743] focus:ring-1 focus:ring-[#001743] focus:outline-none transition-all placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X size={13} strokeWidth={1.5} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-xs text-slate-500 font-mono">
              Hiển thị <strong className="text-[#001743] font-bold">{staffList.length}</strong> /{" "}
              <span className="text-slate-700">{totalCount}</span> hồ sơ
            </div>

            <button
              onClick={fetchStaff}
              disabled={loading}
              className="p-2 text-slate-600 hover:text-[#001743] hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors bg-white disabled:opacity-50 shadow-2xs"
              title="Đồng bộ lại danh sách kiểm toán"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: The Clean High-Trust Institutional Data Table ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider h-11">
                <th className="py-3 px-5">
                  <AdminSortButton
                    label="Định danh nhân sự"
                    active={sortKey === "name"}
                    direction={sortDirection}
                    onClick={() => changeSort("name")}
                  />
                </th>
                <th className="py-3 px-4">Liên hệ &amp; Định danh</th>
                <th className="py-3 px-4">Phân cấp kiểm toán</th>
                <th className="py-3 px-4">
                  <AdminSortButton
                    label="Ngày cấp phép"
                    active={sortKey === "date"}
                    direction={sortDirection}
                    onClick={() => changeSort("date")}
                  />
                </th>
                <th className="py-3 px-4 text-center">Tình trạng vận hành</th>
                <th className="py-3 px-5 text-right">Kiểm toán &amp; Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="h-16 animate-pulse bg-white">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 bg-slate-200 rounded w-32" />
                          <div className="h-2.5 bg-slate-100 rounded w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="h-3 bg-slate-100 rounded w-28" />
                        <div className="h-2.5 bg-slate-100 rounded w-20" />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-5 bg-slate-100 rounded-md w-32" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="h-3.5 bg-slate-100 rounded w-20" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="h-5 bg-slate-100 rounded-full w-20 mx-auto" />
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="h-7 bg-slate-100 rounded-lg w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
                      <AlertTriangle size={24} strokeWidth={1.5} />
                    </div>
                    <div className="text-sm font-bold text-slate-800">Không thể truy xuất dữ liệu nhân sự</div>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{error}</p>
                    <button
                      onClick={fetchStaff}
                      className="mt-4 px-4 py-2 bg-[#001743] text-white text-xs font-semibold rounded-xl hover:bg-[#00266B] transition-colors"
                    >
                      Thử kết nối lại
                    </button>
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <UserCheck size={24} strokeWidth={1.5} />
                    </div>
                    <div className="text-sm font-bold text-slate-700">
                      Chưa ghi nhận {activeSegment === "admins" ? "quản trị viên" : "tư vấn viên"} phù hợp bộ lọc
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc cấp tài khoản mới.</p>
                  </td>
                </tr>
              ) : (
                displayStaff.map((member) => {
                  const isUpdated = updatedStaffId === member.id;

                  return (
                    <tr
                      key={member.id}
                      onClick={() => openView(member)}
                      className={`group cursor-pointer transition-all duration-150 ${
                        isUpdated
                          ? "bg-emerald-50/70"
                          : "hover:bg-slate-50/80 bg-white"
                      }`}
                    >
                      {/* Cột 1: Thông tin nhân sự & Avatar Status Ring */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3.5">
                          <BankingStaffAvatar
                            name={member.fullName || member.userName}
                            avatar={member.avatarImg}
                            isActive={member.isActive}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#001743] group-hover:text-blue-900 transition-colors flex items-center gap-1.5">
                              <span className="truncate">{member.fullName || member.userName}</span>
                              {member.hasPkiKeys && (
                                <span title="Đã xác thực chứng thư PKI">
                                  <BadgeCheck size={14} className="text-blue-600 shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5 truncate">
                              <span className="text-slate-600 font-semibold">@{member.userName}</span>
                              <span className="text-slate-300">•</span>
                              <span className="truncate max-w-[170px] text-slate-500">{member.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: SĐT và CCCD Định danh (High-trust banking privacy format) */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-xs font-semibold text-[#001743] flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" />
                          <span>{member.phoneNumber || "Chưa đăng ký"}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Fingerprint size={11} className="text-slate-400" />
                          <span>
                            {member.identityNumber
                              ? `CCCD: •••• ${member.identityNumber.slice(-4)}`
                              : "Chưa nộp CCCD"}
                          </span>
                        </div>
                      </td>

                      {/* Cột 3: Phân cấp thẩm quyền & Quyền hạn */}
                      <td className="py-3.5 px-4">
                        {activeSegment === "admins" ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200/80">
                            <ShieldCheck size={13} className="text-purple-700 shrink-0" />
                            <span>Tier-3 • Toàn quyền hệ thống</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200/80">
                            <Headphones size={13} className="text-blue-700 shrink-0" />
                            <span>Tier-1 • Tư vấn VIP &amp; Đấu giá</span>
                          </div>
                        )}
                      </td>

                      {/* Cột 4: Ngày cấp phép & Kiểm toán */}
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-400" />
                          <span>{member.createdDate ? new Date(member.createdDate).toLocaleDateString("vi-VN") : "—"}</span>
                        </div>
                      </td>

                      {/* Cột 5: Trạng thái vận hành */}
                      <td className="py-3.5 px-4 text-center">
                        {member.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            <span>Hoạt động</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            <span>Tạm đình chỉ</span>
                          </span>
                        )}
                      </td>

                      {/* Cột 6: Thao tác kiểm toán */}
                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openView(member);
                            }}
                            className="p-2 text-slate-500 hover:text-[#001743] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Kiểm tra hồ sơ công vụ"
                          >
                            <Eye size={15} strokeWidth={1.5} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(member);
                            }}
                            className="p-2 text-slate-500 hover:text-[#001743] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Điều chỉnh thông tin"
                          >
                            <Edit3 size={15} strokeWidth={1.5} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusConfirm({ user: member, targetStatus: !member.isActive });
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              member.isActive
                                ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            }`}
                            title={member.isActive ? "Tạm đình chỉ quyền vận hành" : "Khôi phục quyền truy cập"}
                          >
                            {member.isActive ? (
                              <Lock size={15} strokeWidth={1.5} />
                            ) : (
                              <Unlock size={15} strokeWidth={1.5} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Chân bảng: Phân trang chuẩn Pagination */}
        {!loading && totalCount > 0 && (
          <div className="border-t border-slate-200/80 px-4 py-3 bg-slate-50/50">
            <Pagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={setPageIndex}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPageIndex(1);
              }}
            />
          </div>
        )}
      </div>

      {/* ── SECTION 5: RightDrawer Dossier & Management Console ── */}
      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          drawerMode === "create"
            ? activeSegment === "admins"
              ? "Cấp Tài Khoản Quản Trị Viên Mới"
              : "Cấp Tài Khoản Tư Vấn Viên Mới"
            : drawerMode === "view"
            ? "Hồ Sơ Công Vụ & Kiểm Toán Nhân Sự"
            : "Điều Chỉnh Thông Tin Nhân Sự"
        }
        badge={
          drawerMode === "create"
            ? activeSegment === "admins"
              ? "Tier-3 Admin"
              : "Tier-1 Consultant"
            : selectedStaff?.fullName || selectedStaff?.userName || "Nhân sự"
        }
        badgeCls={
          drawerMode === "create"
            ? activeSegment === "admins"
              ? "bg-purple-100 text-purple-800 font-bold"
              : "bg-blue-100 text-blue-800 font-bold"
            : "bg-slate-100 text-[#001743] font-bold"
        }
        size="md"
      >
        {drawerMode === "view" && selectedStaff && (
          <div className="flex flex-col flex-1 min-h-0">
            <DrawerBody>
              {/* Dossier Header Card */}
              <div className="p-5 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <BankingStaffAvatar
                    name={selectedStaff.fullName || selectedStaff.userName}
                    avatar={selectedStaff.avatarImg}
                    isActive={selectedStaff.isActive}
                    size="lg"
                  />
                  <div>
                    <div className="font-bold text-base text-[#001743]">
                      {selectedStaff.fullName || selectedStaff.userName}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">@{selectedStaff.userName}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{selectedStaff.email}</div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                      selectedStaff.role === UserRoleEnum.ADMIN ||
                      selectedStaff.role === 1 ||
                      selectedStaff.role === "ADMIN"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {selectedStaff.role === UserRoleEnum.ADMIN ||
                    selectedStaff.role === 1 ||
                    selectedStaff.role === "ADMIN"
                      ? "Tier-3 Admin"
                      : "Tier-1 Consultant"}
                  </span>
                  {selectedStaff.isActive ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Đang hoạt động
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Tạm đình chỉ
                    </span>
                  )}
                </div>
              </div>

              {/* Dossier Section 1: Thẩm quyền & An toàn bảo mật */}
              <DrawerSection
                title="Thẩm quyền & Phân cấp hệ thống"
                subtitle="Cơ chế cấp phép truy cập tài nguyên bảo mật TrustSim"
              >
                <div className="space-y-3 text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Mã định danh nội bộ:</span>
                    <span className="font-mono font-bold text-[#001743]">{selectedStaff.id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Phân cấp thẩm quyền:</span>
                    <span className="font-bold text-[#001743]">
                      {selectedStaff.role === UserRoleEnum.ADMIN ||
                      selectedStaff.role === 1 ||
                      selectedStaff.role === "ADMIN"
                        ? "Toàn quyền quản trị cấp cao (Root)"
                        : "Tư vấn viên trực sàn & CSKH VIP"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Xác thực chứng thư số PKI:</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                      <ShieldCheck size={13} />
                      <span>{selectedStaff.hasPkiKeys ? "Đã cấp chứng thư PKI hợp lệ" : "Đang chờ cấp chứng thư"}</span>
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Ngày kích hoạt quyền:</span>
                    <span className="font-mono text-slate-700">
                      {selectedStaff.createdDate ? new Date(selectedStaff.createdDate).toLocaleDateString("vi-VN") : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Trạng thái khóa an toàn:</span>
                    <span className={`font-bold ${selectedStaff.isActive ? "text-emerald-600" : "text-rose-600"}`}>
                      {selectedStaff.isActive ? "Bình thường (Cho phép đăng nhập)" : "Đã khóa (Chặn toàn bộ API)"}
                    </span>
                  </div>
                </div>
              </DrawerSection>

              {/* Dossier Section 2: Hồ sơ công vụ & Liên hệ */}
              <DrawerSection
                title="Hồ sơ công vụ & Định danh công dân"
                subtitle="Thông tin phục vụ giám sát nội bộ và tuân thủ ngân hàng"
              >
                <div className="space-y-3 text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Họ và tên đầy đủ:</span>
                    <span className="font-bold text-[#001743]">{selectedStaff.fullName || "Chưa cập nhật"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Hotline công vụ:</span>
                    <span className="font-mono font-bold text-[#001743]">{selectedStaff.phoneNumber || "Chưa cập nhật"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Số CCCD / Hộ chiếu:</span>
                    <span className="font-mono font-bold text-[#001743]">
                      {selectedStaff.identityNumber || "Chưa nộp định danh"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Trụ sở / Địa chỉ công tác:</span>
                    <span className="font-medium text-slate-800 text-right max-w-[65%]">
                      {selectedStaff.address || "Trụ sở chính TrustSim"}
                    </span>
                  </div>
                </div>
              </DrawerSection>
            </DrawerBody>

            <DrawerFooter>
              <div className="flex items-center justify-between w-full">
                <button
                  type="button"
                  onClick={() => {
                    setStatusConfirm({
                      user: selectedStaff,
                      targetStatus: !selectedStaff.isActive,
                    });
                  }}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                    selectedStaff.isActive
                      ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {selectedStaff.isActive ? "Đình chỉ tài khoản" : "Khôi phục tài khoản"}
                </button>
                <div className="flex items-center gap-2">
                  <BtnSecondary onClick={() => setDrawerOpen(false)}>Đóng</BtnSecondary>
                  <BtnPrimary onClick={() => setDrawerMode("edit")}>
                    <Edit3 size={14} strokeWidth={1.5} />
                    <span>Điều chỉnh thông tin</span>
                  </BtnPrimary>
                </div>
              </div>
            </DrawerFooter>
          </div>
        )}

        {(drawerMode === "create" || drawerMode === "edit") && (
          <StaffForm
            key={selectedStaff ? `staff-${selectedStaff.id}-${drawerMode}` : `create-${activeSegment}`}
            mode={drawerMode}
            defaultRole={activeSegment === "admins" ? UserRoleEnum.ADMIN : UserRoleEnum.CONSULTANT}
            initial={selectedStaff}
            onSuccess={(savedStaff) => {
              if (drawerMode === "create") {
                setStaffList((prev) => [savedStaff, ...prev]);
                setTotalCount((c) => c + 1);
                showToast(`Đã cấp tài khoản kiểm toán cho "${savedStaff.fullName || savedStaff.userName}".`);
              } else {
                setStaffList((prev) => prev.map((s) => (s.id === savedStaff.id ? savedStaff : s)));
                setSelectedStaff(savedStaff);
                showToast(`Đã cập nhật hồ sơ nhân sự thành công.`);
              }
              setUpdatedStaffId(savedStaff.id);
              setTimeout(() => setUpdatedStaffId(null), 1600);
              setDrawerOpen(false);
            }}
            onCancel={() => {
              if (drawerMode === "edit" && selectedStaff) {
                setDrawerMode("view");
              } else {
                setDrawerOpen(false);
              }
            }}
          />
        )}
      </RightDrawer>

      {/* ── SECTION 6: High-Trust Banking Security Confirmation Modal ── */}
      {statusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs px-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-up">
            <div className="flex items-start gap-4 mb-4">
              <div
                className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center border ${
                  statusConfirm.targetStatus
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-rose-50 text-rose-600 border-rose-200"
                }`}
              >
                {statusConfirm.targetStatus ? <Unlock size={22} strokeWidth={1.5} /> : <Lock size={22} strokeWidth={1.5} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#001743]">
                  {statusConfirm.targetStatus ? "Xác nhận khôi phục quyền vận hành" : "Xác nhận đình chỉ quyền vận hành"}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Bạn đang chuẩn bị {statusConfirm.targetStatus ? "mở khóa" : "tạm đình chỉ"} tài khoản nội bộ{" "}
                  <strong className="text-[#001743]">
                    "{statusConfirm.user.fullName || statusConfirm.user.userName}"
                  </strong>
                  .
                </p>
                {!statusConfirm.targetStatus && (
                  <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-[11px] text-rose-800 flex items-center gap-2">
                    <ShieldAlert size={14} className="shrink-0 text-rose-600" />
                    <span>Mọi phiên đăng nhập hiện tại và quyền truy cập API sẽ bị thu hồi ngay lập tức.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatusConfirm(null)}
                disabled={statusLoading}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleToggleStatusConfirm}
                disabled={statusLoading}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl flex items-center gap-1.5 transition-colors ${
                  statusConfirm.targetStatus ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#E4011E] hover:bg-[#c8001a]"
                }`}
              >
                {statusLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : statusConfirm.targetStatus ? (
                  <Unlock size={14} strokeWidth={1.5} />
                ) : (
                  <Lock size={14} strokeWidth={1.5} />
                )}
                <span>{statusConfirm.targetStatus ? "Khôi phục ngay" : "Xác nhận đình chỉ"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 7: Institutional Toast Notification ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#001743] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2.5 animate-fade-up">
          <CheckCircle2 size={16} strokeWidth={2} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

// --- Sub-component: Clean High-Trust Staff Form ---
function parseStaffRole(item?: AdminUserDetailDto | null, defaultRole: UserRoleEnum = UserRoleEnum.CONSULTANT): number {
  if (!item) return defaultRole;
  if (typeof item.role === "number") return item.role;
  if (item.role === "ADMIN") return UserRoleEnum.ADMIN;
  if (item.role === "CONSULTANT") return UserRoleEnum.CONSULTANT;
  if (item.role === "USER") return UserRoleEnum.USER;
  return defaultRole;
}

function StaffForm({
  mode,
  defaultRole,
  initial,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  defaultRole: UserRoleEnum;
  initial?: AdminUserDetailDto | null;
  onSuccess: (u: AdminUserDetailDto) => void;
  onCancel: () => void;
}) {
  const isCreate = mode === "create";

  const [userName, setUserName] = useState(initial?.userName || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(initial?.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(initial?.phoneNumber || "");
  const [identityNumber, setIdentityNumber] = useState(initial?.identityNumber || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [role, setRole] = useState<number>(parseStaffRole(initial, defaultRole));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setUserName(initial.userName || "");
      setEmail(initial.email || "");
      setFullName(initial.fullName || "");
      setPhoneNumber(initial.phoneNumber || "");
      setIdentityNumber(initial.identityNumber || "");
      setAddress(initial.address || "");
      setRole(parseStaffRole(initial, defaultRole));
      setPassword("");
    } else {
      setUserName("");
      setEmail("");
      setFullName("");
      setPhoneNumber("");
      setIdentityNumber("");
      setAddress("");
      setRole(defaultRole);
      setPassword("");
    }
  }, [initial, defaultRole]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (isCreate) {
      if (!userName.trim()) errs.userName = "Tên đăng nhập không được để trống.";
      else if (userName.length < 3) errs.userName = "Tên đăng nhập tối thiểu 3 ký tự.";
      if (!password.trim()) errs.password = "Mật khẩu không được để trống.";
      else if (password.length < 6) errs.password = "Mật khẩu tối thiểu 6 ký tự.";
    }
    if (!email.trim() || !email.includes("@")) errs.email = "Email nội bộ công vụ không hợp lệ.";
    if (!fullName.trim()) errs.fullName = "Họ và tên không được để trống.";
    if (!phoneNumber.trim()) errs.phoneNumber = "Số điện thoại không được để trống.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      if (isCreate) {
        const payload: AdminCreateUserPayload = {
          userName: userName.trim(),
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          identityNumber: identityNumber.trim() || undefined,
          address: address.trim() || undefined,
          role,
        };
        const created = await userService.createAdminUser(payload);
        onSuccess(created);
      } else if (initial) {
        const payload: AdminUpdateUserPayload = {
          email: email.trim(),
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          identityNumber: identityNumber.trim() || undefined,
          address: address.trim() || undefined,
          role,
        };
        const updated = await userService.updateAdminUser(initial.id, payload);
        onSuccess(updated);
      }
    } catch (err: any) {
      setErrors({ form: err.message || "Thao tác cập nhật thất bại." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
      <DrawerBody>
        {errors.form && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2.5 mb-4">
            <AlertTriangle size={16} strokeWidth={1.5} className="shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        <DrawerSection
          title="Thông tin định danh bảo mật"
          subtitle="Tài khoản truy cập và phân cấp thẩm quyền trên hệ thống"
        >
          {isCreate ? (
            <div className="grid grid-cols-2 gap-3.5">
              <FormField label="Tên đăng nhập hệ thống" required error={errors.userName}>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="VD: admin_trungtam"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-[#001743] focus:ring-1 focus:ring-[#001743] focus:outline-none font-mono font-semibold transition-colors bg-white"
                />
              </FormField>

              <FormField label="Mật khẩu khởi tạo" required error={errors.password}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-[#001743] focus:ring-1 focus:ring-[#001743] focus:outline-none transition-colors bg-white"
                />
              </FormField>
            </div>
          ) : (
            <FormField label="Tên đăng nhập hệ thống" hint="Cố định theo mã định danh kiểm toán">
              <input
                type="text"
                value={`@${userName}`}
                disabled
                className="w-full text-xs p-2.5 border border-slate-200 bg-slate-100 text-slate-500 rounded-xl font-mono font-semibold cursor-not-allowed"
              />
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-3.5">
            <FormField label="Email công vụ (@trustsim.vn)" required error={errors.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hoten@trustsim.vn"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-[#001743] focus:ring-1 focus:ring-[#001743] focus:outline-none transition-colors bg-white"
              />
            </FormField>

            <FormField label="Phân cấp thẩm quyền" required>
              <select
                value={role}
                onChange={(e) => setRole(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-[#001743] focus:ring-1 focus:ring-[#001743] focus:outline-none font-semibold text-[#001743] transition-colors bg-white"
              >
                <option value={UserRoleEnum.ADMIN}>Tier-3 • Quản trị viên hệ thống</option>
                <option value={UserRoleEnum.CONSULTANT}>Tier-1 • Tư vấn viên trực sàn</option>
              </select>
            </FormField>
          </div>
        </DrawerSection>

        <DrawerSection title="Hồ sơ nhân sự công vụ" subtitle="Thông tin định danh công dân và liên lạc công vụ">
          <div className="grid grid-cols-2 gap-3.5">
            <FormField label="Họ và tên đầy đủ" required error={errors.fullName}>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-[#001743] focus:ring-1 focus:ring-[#001743] focus:outline-none font-semibold text-[#001743] transition-colors bg-white"
              />
            </FormField>

            <FormField label="Hotline công vụ" required error={errors.phoneNumber}>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="VD: 0900000001"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-[#001743] focus:ring-1 focus:ring-[#001743] focus:outline-none font-mono transition-colors bg-white"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <FormField label="Số CCCD / Định danh (Tùy chọn)">
              <input
                type="text"
                value={identityNumber}
                onChange={(e) => setIdentityNumber(e.target.value)}
                placeholder="VD: 001201012345"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-[#001743] focus:ring-1 focus:ring-[#001743] focus:outline-none font-mono transition-colors bg-white"
              />
            </FormField>

            <FormField label="Trụ sở / Địa chỉ công tác">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="VD: Trụ sở chính Hà Nội"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-[#001743] focus:ring-1 focus:ring-[#001743] focus:outline-none transition-colors bg-white"
              />
            </FormField>
          </div>
        </DrawerSection>
      </DrawerBody>

      <DrawerFooter>
        <div className="flex items-center justify-end gap-2.5 w-full">
          <BtnSecondary type="button" onClick={onCancel} disabled={saving}>
            Hủy bỏ
          </BtnSecondary>
          <BtnPrimary type="submit" disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2} />}
            <span>{isCreate ? "Cấp quyền nhân sự" : "Lưu thay đổi"}</span>
          </BtnPrimary>
        </div>
      </DrawerFooter>
    </form>
  );
}
