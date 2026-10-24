/* Hallmark · genre: modern-minimal · style: Clean High-Trust Banking · macrostructure: Workbench · role: customer-escrow-management */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Search,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Wallet,
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal,
  Fingerprint,
  Phone,
  Mail,
  BadgeCheck,
  Calendar,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import {
  userService,
  AdminUserDetailDto,
  UserRoleEnum,
  VerificationStatusEnum,
} from "@/services/userService";
import {
  RightDrawer,
  DrawerBody,
  DrawerFooter,
  DrawerSection,
  BtnSecondary,
} from "@/components/ui/RightDrawer";
import { Pagination } from "@/components/ui/Pagination";
import { AdminSortButton, toggleSort, type SortDirection } from "@/components/admin/AdminPrimitives";
import ImportExportBar from "@/components/admin/ImportExportBar";
import { ExcelColumnDef } from "@/services/excelService";
import { SortOrder, UserAccountSortBy } from "@/types/common";

// Format currency
const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

const CUSTOMER_EXPORT_COLUMNS: ExcelColumnDef<AdminUserDetailDto>[] = [
  { header: "Mã khách hàng", key: "id", width: 15 },
  { header: "Họ và tên", key: "fullName", width: 22 },
  { header: "Tên đăng nhập", key: "userName", width: 18 },
  { header: "Email", key: "email", width: 25 },
  { header: "Số điện thoại", key: "phoneNumber", width: 16 },
  { header: "Số CCCD/CMND", key: "identityNumber", width: 18 },
  { header: "Địa chỉ", key: "address", width: 30 },
  {
    header: "Số dư khả dụng (VNĐ)",
    key: "availableBalance",
    width: 20,
    formatter: (v) => formatVND(Number(v) || 0),
  },
  {
    header: "Số dư tạm khóa (VNĐ)",
    key: "lockedBalance",
    width: 20,
    formatter: (v) => formatVND(Number(v) || 0),
  },
  {
    header: "Trạng thái eKYC",
    key: "verificationStatus",
    width: 18,
    formatter: (v) => getKycBadge(v).label,
  },
  {
    header: "Trạng thái tài khoản",
    key: "isActive",
    width: 18,
    formatter: (v) => (v ? "Đang hoạt động" : "Đã tạm khóa"),
  },
  { header: "Ngày đăng ký", key: "createdDate", width: 18 },
];

function getKycBadge(status: number | VerificationStatusEnum | string) {
  if (status === VerificationStatusEnum.VERIFIED || status === "VERIFIED" || status === 2) {
    return { label: "eKYC Đã thẩm định", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (status === VerificationStatusEnum.PENDING_VERIFICATION || status === "PENDING_VERIFICATION" || status === 1) {
    return { label: "Chờ duyệt hồ sơ", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (status === VerificationStatusEnum.REJECTED || status === "REJECTED" || status === 3) {
    return { label: "Hồ sơ bị từ chối", cls: "bg-rose-50 text-rose-700 border-rose-200" };
  }
  return { label: "Chưa nộp eKYC", cls: "bg-slate-50 text-slate-500 border-slate-200" };
}

// Clean High-Trust Banking Customer Avatar with status ring
function BankingCustomerAvatar({
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

  const initials = (name || "KH")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(-2)
    .join("")
    .toUpperCase() || "KH";

  return (
    <div className="relative inline-block shrink-0">
      {avatar && avatar.trim() !== "" && !avatar.includes("default.png") ? (
        <img
          src={avatar}
          alt={name}
          className={`${sizeClasses} rounded-full object-cover border border-slate-200 bg-white ring-1 ring-slate-100 shadow-2xs`}
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

      {isActive !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
            isActive ? "bg-emerald-500 ring-1 ring-emerald-300" : "bg-rose-500 ring-1 ring-rose-300"
          }`}
          title={isActive ? "Đang hoạt động" : "Tài khoản bị khóa"}
        />
      )}
    </div>
  );
}

export function AdminCustomersTab() {
  const [customers, setCustomers] = useState<AdminUserDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedKyc, setSelectedKyc] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<"name" | "wallet">("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [totalCount, setTotalCount] = useState(0);

  // Toast & selection
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [updatedCustomerId, setUpdatedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<AdminUserDetailDto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getAdminUsers({
        keyword: debouncedSearch,
        role: UserRoleEnum.USER,
        isActive: selectedStatus !== "" ? selectedStatus === "active" : undefined,
        kycStatus: selectedKyc !== "" ? selectedKyc : undefined,
        sortBy: sortKey === "wallet" ? UserAccountSortBy.WalletBalance : UserAccountSortBy.FullName,
        sortOrder: sortDirection === "asc" ? SortOrder.Asc : SortOrder.Desc,
        pageIndex,
        pageSize,
      });
      setCustomers(res.items);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách kiểm toán khách hàng.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedKyc, selectedStatus, sortKey, sortDirection, pageIndex, pageSize]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openDetail = (cust: AdminUserDetailDto) => {
    setSelectedCustomer(cust);
    setDrawerOpen(true);
  };

  const handleToggleStatusConfirm = async () => {
    if (!statusConfirm) return;
    setStatusLoading(true);
    try {
      await userService.toggleUserStatus(statusConfirm.user.id, statusConfirm.targetStatus);
      showToast(
        statusConfirm.targetStatus
          ? `Đã khôi phục quyền giao dịch cho tài khoản "${statusConfirm.user.fullName}".`
          : `Đã tạm đình chỉ quyền giao dịch của tài khoản "${statusConfirm.user.fullName}".`
      );
      setCustomers((prev) =>
        prev.map((c) => (c.id === statusConfirm.user.id ? { ...c, isActive: statusConfirm.targetStatus } : c))
      );
      if (selectedCustomer?.id === statusConfirm.user.id) {
        setSelectedCustomer((prev) => (prev ? { ...prev, isActive: statusConfirm.targetStatus } : null));
      }
      setStatusConfirm(null);
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`);
    } finally {
      setStatusLoading(false);
    }
  };

  const hasActiveFilters = debouncedSearch || selectedKyc !== "" || selectedStatus !== "";
  const displayCustomers = customers;

  const changeSort = (key: "name" | "wallet") => {
    const next = toggleSort(sortKey, sortDirection, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
  };

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedKyc("");
    setSelectedStatus("");
    setPageIndex(1);
  };

  // KPIs
  const verifiedCount = useMemo(() => {
    return customers.filter(
      (c) =>
        c.verificationStatus === VerificationStatusEnum.VERIFIED ||
        c.verificationStatus === "VERIFIED" ||
        c.verificationStatus === 2
    ).length;
  }, [customers]);

  const totalPageAvailableBalance = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.availableBalance || 0), 0);
  }, [customers]);

  const totalPageLockedBalance = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.lockedBalance || 0), 0);
  }, [customers]);

  return (
    <div className="admin-tab admin-tab-customers space-y-4">
      {/* ── SECTION 1: Institutional Context Header & Master Action Bar ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-[0.03] pointer-events-none bg-[radial-gradient(#001743_1px,transparent_1px)] [background-size:12px_12px]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-[#001743] border border-slate-200">
                <Users size={12} className="text-[#001743]" />
                <span>Hồ sơ định danh &amp; Ký quỹ sàn</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">FINANCIAL COMPLIANCE GATEWAY</span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-[#001743] mt-2">
              Quản Trị Khách Hàng &amp; Giám Sát Tài Khoản Ký Quỹ
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Theo dõi định danh pháp lý eKYC, chữ ký số điện tử PKI, số dư ví khả dụng và trạng thái đóng băng ký quỹ
              phục vụ các phiên đấu giá SIM số đẹp.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <ImportExportBar
              data={customers}
              columns={CUSTOMER_EXPORT_COLUMNS}
              filename={`TrustSim_KhachHang_${new Date().toISOString().slice(0, 10)}`}
              entityName="khách hàng"
              onImport={(rows) => {
                const newCustomers: AdminUserDetailDto[] = rows
                  .map((r, idx) => ({
                    id: `CUST-IMP-${Date.now()}-${idx + 1}`,
                    userName: String(r["Tên đăng nhập"] || r.userName || `user_${Date.now()}_${idx}`),
                    email: String(r["Email"] || r.email || `user${idx}@trustsim.vn`),
                    role: UserRoleEnum.USER,
                    isActive: true,
                    fullName: String(r["Họ và tên"] || r.fullName || "Khách hàng mới"),
                    phoneNumber: String(r["Số điện thoại"] || r.phoneNumber || "").replace(/\D/g, ""),
                    address: String(r["Địa chỉ"] || r.address || ""),
                    identityNumber: String(r["Số CCCD/CMND"] || r.identityNumber || ""),
                    verificationStatus: VerificationStatusEnum.UNVERIFIED,
                    availableBalance: Number(r["Số dư khả dụng (VNĐ)"] || r.availableBalance || 0),
                    lockedBalance: Number(r["Số dư tạm khóa (VNĐ)"] || r.lockedBalance || 0),
                    hasPkiKeys: false,
                    createdDate: new Date().toLocaleDateString("vi-VN"),
                  }))
                  .filter((c) => c.fullName);

                if (newCustomers.length > 0) {
                  setCustomers((prev) => [...newCustomers, ...prev]);
                  showToast(`Đã nhập ${newCustomers.length} khách hàng vào hệ thống.`);
                }
              }}
            />

            <button
              onClick={fetchCustomers}
              disabled={loading}
              className="p-2.5 text-slate-600 hover:text-[#001743] hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors bg-white disabled:opacity-50 shadow-2xs"
              title="Đồng bộ lại danh sách khách hàng"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* ── SECTION 2: Clean High-Trust KPI Metrics Ribbon ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng khách hàng</div>
              <div className="text-lg font-bold text-[#001743] font-mono tabular-nums mt-0.5">{totalCount}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/70 flex items-center justify-center text-slate-700 shadow-2xs">
              <Users size={16} strokeWidth={1.5} />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Đã xác thực eKYC</div>
              <div className="text-lg font-bold text-emerald-950 font-mono tabular-nums mt-0.5">{verifiedCount} tài khoản</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shadow-2xs">
              <ShieldCheck size={16} strokeWidth={1.5} />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Ví khả dụng (Trang này)</div>
              <div className="text-sm font-bold text-blue-950 font-mono tabular-nums mt-0.5">
                {formatVND(totalPageAvailableBalance)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-700 shadow-2xs">
              <Wallet size={16} strokeWidth={1.5} />
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Đóng băng ký quỹ</div>
              <div className="text-sm font-bold text-amber-950 font-mono tabular-nums mt-0.5">
                {formatVND(totalPageLockedBalance)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700 shadow-2xs">
              <Lock size={16} strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Institutional Navigation Console & Filter Strip ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Quick eKYC Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <SlidersHorizontal size={12} />
              <span>eKYC:</span>
            </span>

            {[
              { id: "", label: "Tất cả" },
              { id: "2", label: "Đã duyệt" },
              { id: "1", label: "Chờ duyệt" },
              { id: "3", label: "Bị từ chối" },
              { id: "0", label: "Chưa nộp" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setSelectedKyc(st.id);
                  setPageIndex(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  selectedKyc === st.id
                    ? "bg-[#001743] text-white shadow-2xs font-bold"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Quick Status Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
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

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1.5 hover:bg-rose-50 rounded-lg transition-colors ml-2"
              >
                Đặt lại
              </button>
            )}
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
              placeholder="Tìm theo tên khách, username, email, SĐT, CCCD…"
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

          <div className="text-xs text-slate-500 font-mono">
            Hiển thị <strong className="text-[#001743] font-bold">{customers.length}</strong> /{" "}
            <span className="text-slate-700">{totalCount}</span> khách hàng
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
                    label="Khách hàng"
                    active={sortKey === "name"}
                    direction={sortDirection}
                    onClick={() => changeSort("name")}
                  />
                </th>
                <th className="py-3 px-4">Liên hệ &amp; CCCD</th>
                <th className="py-3 px-4">Định danh eKYC</th>
                <th className="py-3 px-4 text-center">Chữ ký số PKI</th>
                <th className="py-3 px-4 text-right">
                  <AdminSortButton
                    label="Ví số dư khả dụng"
                    align="right"
                    active={sortKey === "wallet"}
                    direction={sortDirection}
                    onClick={() => changeSort("wallet")}
                  />
                </th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-5 text-right">Kiểm toán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
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
                      <div className="h-5 bg-slate-100 rounded-md w-24" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="h-4 bg-slate-100 rounded w-16 mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="h-4 bg-slate-100 rounded w-24 ml-auto" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="h-5 bg-slate-100 rounded-full w-20 mx-auto" />
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="h-7 bg-slate-100 rounded-lg w-20 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
                      <AlertTriangle size={24} strokeWidth={1.5} />
                    </div>
                    <div className="text-sm font-bold text-slate-800">Không thể truy xuất dữ liệu khách hàng</div>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{error}</p>
                    <button
                      onClick={fetchCustomers}
                      className="mt-4 px-4 py-2 bg-[#001743] text-white text-xs font-semibold rounded-xl hover:bg-[#00266B] transition-colors"
                    >
                      Thử kết nối lại
                    </button>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <Users size={24} strokeWidth={1.5} />
                    </div>
                    <div className="text-sm font-bold text-slate-700">
                      {hasActiveFilters ? "Không tìm thấy khách hàng phù hợp bộ lọc" : "Chưa có khách hàng nào"}
                    </div>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 text-xs text-blue-600 font-semibold hover:underline"
                      >
                        Xóa toàn bộ bộ lọc
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                displayCustomers.map((customer) => {
                  const kycBadge = getKycBadge(customer.verificationStatus);
                  const isUpdated = updatedCustomerId === customer.id;

                  return (
                    <tr
                      key={customer.id}
                      onClick={() => openDetail(customer)}
                      className={`group cursor-pointer transition-all duration-150 ${
                        isUpdated ? "bg-emerald-50/70" : "hover:bg-slate-50/80 bg-white"
                      }`}
                    >
                      {/* Cột 1: Thông tin khách hàng */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3.5">
                          <BankingCustomerAvatar
                            name={customer.fullName || customer.userName}
                            avatar={customer.avatarImg}
                            isActive={customer.isActive}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#001743] group-hover:text-blue-900 transition-colors flex items-center gap-1.5">
                              <span className="truncate">{customer.fullName || customer.userName}</span>
                              {customer.hasPkiKeys && (
                                <span title="Đã cấp chứng thư PKI">
                                  <BadgeCheck size={14} className="text-blue-600 shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5 truncate">
                              <span className="text-slate-600 font-semibold">@{customer.userName}</span>
                              <span className="text-slate-300">•</span>
                              <span className="truncate max-w-[170px] text-slate-500">{customer.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: SĐT và CCCD Định danh (High-trust banking privacy format) */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-xs font-semibold text-[#001743] flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" />
                          <span>{customer.phoneNumber || "Chưa cập nhật"}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Fingerprint size={11} className="text-slate-400" />
                          <span>
                            {customer.identityNumber ? `CCCD: •••• ${customer.identityNumber.slice(-4)}` : "Chưa có CCCD"}
                          </span>
                        </div>
                      </td>

                      {/* Cột 3: Định danh eKYC */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border ${kycBadge.cls}`}>
                          {kycBadge.label}
                        </span>
                      </td>

                      {/* Cột 4: Chữ ký số PKI */}
                      <td className="py-3.5 px-4 text-center">
                        {customer.hasPkiKeys ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                            title="Đã khởi tạo khóa ký hợp đồng điện tử"
                          >
                            <KeyRound size={12} strokeWidth={1.5} />
                            <span>Đã cấp PKI</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Chưa cấp</span>
                        )}
                      </td>

                      {/* Cột 5: Ví số dư */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-xs text-[#001743] tabular-nums">
                          {formatVND(customer.availableBalance)}
                        </div>
                        {customer.lockedBalance > 0 && (
                          <div className="text-[10px] text-amber-600 font-mono tabular-nums mt-0.5">
                            Ký quỹ: {formatVND(customer.lockedBalance)}
                          </div>
                        )}
                      </td>

                      {/* Cột 6: Trạng thái tài khoản */}
                      <td className="py-3.5 px-4 text-center">
                        {customer.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            <span>Hoạt động</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            <span>Tạm khóa</span>
                          </span>
                        )}
                      </td>

                      {/* Cột 7: Thao tác */}
                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetail(customer);
                            }}
                            className="p-2 text-slate-500 hover:text-[#001743] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Xem chi tiết hồ sơ & ví khách hàng"
                          >
                            <Eye size={15} strokeWidth={1.5} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusConfirm({ user: customer, targetStatus: !customer.isActive });
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              customer.isActive
                                ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            }`}
                            title={customer.isActive ? "Khóa tài khoản khách hàng" : "Mở khóa tài khoản khách hàng"}
                          >
                            {customer.isActive ? (
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

      {/* ── SECTION 5: RightDrawer Dossier & Escrow Overview ── */}
      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Hồ Sơ Kiểm Toán Khách Hàng"
        badge={selectedCustomer ? `@${selectedCustomer.userName}` : undefined}
        badgeCls="bg-slate-100 text-[#001743] font-mono font-bold"
        size="md"
      >
        {selectedCustomer && (
          <div className="flex flex-col flex-1 min-h-0">
            <DrawerBody>
              {/* Profile Card Header */}
              <div className="p-5 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <BankingCustomerAvatar
                    name={selectedCustomer.fullName || selectedCustomer.userName}
                    avatar={selectedCustomer.avatarImg}
                    isActive={selectedCustomer.isActive}
                    size="lg"
                  />
                  <div>
                    <div className="font-bold text-base text-[#001743]">
                      {selectedCustomer.fullName || selectedCustomer.userName}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">@{selectedCustomer.userName}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{selectedCustomer.email}</div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                      getKycBadge(selectedCustomer.verificationStatus).cls
                    }`}
                  >
                    {getKycBadge(selectedCustomer.verificationStatus).label}
                  </span>
                  {selectedCustomer.isActive ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Đang hoạt động
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Đã tạm khóa
                    </span>
                  )}
                </div>
              </div>

              {/* Tài chính ví ký quỹ */}
              <DrawerSection
                title="Tài chính ví ký quỹ sàn"
                subtitle="Số dư ký thác phục vụ đặt cọc và thanh toán SIM số đẹp"
              >
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono block">
                      Số dư khả dụng
                    </span>
                    <span className="text-base font-bold text-emerald-700 font-mono tabular-nums mt-1 block">
                      {formatVND(selectedCustomer.availableBalance)}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono block">
                      Đóng băng ký quỹ
                    </span>
                    <span className="text-base font-bold text-amber-700 font-mono tabular-nums mt-1 block">
                      {formatVND(selectedCustomer.lockedBalance)}
                    </span>
                  </div>
                </div>
              </DrawerSection>

              {/* Định danh pháp lý CCCD & Chữ ký số */}
              <DrawerSection
                title="Định danh cá nhân &amp; Chứng thư số PKI"
                subtitle="Hồ sơ xác thực eKYC phục vụ hợp đồng số hợp pháp"
              >
                <div className="space-y-3 text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Mã khách hàng nội bộ:</span>
                    <span className="font-mono font-bold text-[#001743]">{selectedCustomer.id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Số CCCD / CMND:</span>
                    <span className="font-mono font-bold text-[#001743]">
                      {selectedCustomer.identityNumber || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Số điện thoại liên hệ:</span>
                    <span className="font-mono font-bold text-[#001743]">
                      {selectedCustomer.phoneNumber || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Địa chỉ thường trú:</span>
                    <span className="font-medium text-slate-800 text-right max-w-[65%]">
                      {selectedCustomer.address || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Ngày sinh:</span>
                    <span className="font-mono text-slate-800">
                      {selectedCustomer.dateOfBirth
                        ? new Date(selectedCustomer.dateOfBirth).toLocaleDateString("vi-VN")
                        : "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Chứng thư ký số điện tử:</span>
                    <span
                      className={`font-semibold inline-flex items-center gap-1 ${
                        selectedCustomer.hasPkiKeys ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      <KeyRound size={13} />
                      <span>{selectedCustomer.hasPkiKeys ? "Đã xác thực và sẵn sàng ký hợp đồng" : "Chưa khởi tạo"}</span>
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
                      user: selectedCustomer,
                      targetStatus: !selectedCustomer.isActive,
                    });
                  }}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                    selectedCustomer.isActive
                      ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {selectedCustomer.isActive ? "Đình chỉ tài khoản" : "Khôi phục tài khoản"}
                </button>
                <BtnSecondary onClick={() => setDrawerOpen(false)}>Đóng hồ sơ</BtnSecondary>
              </div>
            </DrawerFooter>
          </div>
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
                  {statusConfirm.targetStatus ? "Mở khóa tài khoản khách hàng" : "Khóa tài khoản khách hàng"}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Bạn có chắc chắn muốn {statusConfirm.targetStatus ? "mở khóa" : "khóa"} tài khoản khách hàng{" "}
                  <strong className="text-[#001743]">
                    "{statusConfirm.user.fullName || statusConfirm.user.userName}"
                  </strong>
                  ?
                </p>
                {!statusConfirm.targetStatus && (
                  <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-[11px] text-rose-800 flex items-center gap-2">
                    <ShieldAlert size={14} className="shrink-0 text-rose-600" />
                    <span>Khi bị khóa, khách hàng sẽ không thể đặt giá đấu giá hay thực hiện giao dịch ví.</span>
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
                <span>{statusConfirm.targetStatus ? "Mở khóa ngay" : "Xác nhận khóa"}</span>
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
