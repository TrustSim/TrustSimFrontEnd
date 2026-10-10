/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
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
  Filter,
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
  BtnPrimary,
} from "@/components/ui/RightDrawer";
import { Pagination } from "@/components/ui/Pagination";
import { AdminSortButton, toggleSort, type SortDirection } from "@/components/admin/AdminPrimitives";
import ImportExportBar from "@/components/admin/ImportExportBar";
import { ExcelColumnDef } from "@/services/excelService";

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
    header: "Trạng thái hoạt động",
    key: "isActive",
    width: 18,
    formatter: (v) => (v ? "Hoạt động" : "Đã khóa"),
  },
  { header: "Ngày tham gia", key: "createdDate", width: 18 },
];

function getKycBadge(status: number | VerificationStatusEnum | string) {
  if (status === VerificationStatusEnum.VERIFIED || status === "VERIFIED" || status === 2) {
    return { label: "Đã xác thực", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (status === VerificationStatusEnum.PENDING_VERIFICATION || status === "PENDING_VERIFICATION" || status === 1) {
    return { label: "Chờ thẩm định", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  }
  if (status === VerificationStatusEnum.REJECTED || status === "REJECTED" || status === 3) {
    return { label: "Bị từ chối", cls: "bg-rose-50 text-rose-700 border-rose-200" };
  }
  return { label: "Chưa xác thực", cls: "bg-slate-50 text-slate-500 border-slate-200" };
}

// Flat Minimalist Avatar (Line/Clean styled)
function CustomerAvatar({ name, avatar }: { name: string; avatar?: string }) {
  if (avatar && avatar.trim() !== "" && !avatar.includes("default.png")) {
    return (
      <img
        src={avatar}
        alt={name}
        className="w-9 h-9 rounded-full object-cover border border-slate-200 bg-white shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  const initials = (name || "KH")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 bg-[#001743]">
      {initials || "KH"}
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
        role: UserRoleEnum.USER, // Luôn lọc chỉ lấy Khách hàng (User)
        isActive: selectedStatus !== "" ? selectedStatus === "active" : undefined,
        pageIndex,
        pageSize,
      });

      let items = res.items;
      if (selectedKyc !== "") {
        const kycNum = Number(selectedKyc);
        items = items.filter((u) => Number(u.verificationStatus) === kycNum || String(u.verificationStatus) === selectedKyc);
      }

      setCustomers(items);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách khách hàng.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedKyc, selectedStatus, pageIndex, pageSize]);

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
          ? `Đã mở khóa tài khoản khách hàng "${statusConfirm.user.fullName}" thành công.`
          : `Đã khóa tài khoản khách hàng "${statusConfirm.user.fullName}" thành công.`
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
  const displayCustomers = [...customers].sort((a, b) => {
    const left = sortKey === "name" ? (a.fullName || a.userName || "") : Number(a.availableBalance ?? 0);
    const right = sortKey === "name" ? (b.fullName || b.userName || "") : Number(b.availableBalance ?? 0);
    const result = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "vi");
    return sortDirection === "asc" ? result : -result;
  });
  const changeSort = (key: "name" | "wallet") => {
    const next = toggleSort(sortKey, sortDirection, key);
    setSortKey(next.key); setSortDirection(next.direction);
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
      (c) => c.verificationStatus === VerificationStatusEnum.VERIFIED || c.verificationStatus === "VERIFIED" || c.verificationStatus === 2
    ).length;
  }, [customers]);

  const totalBalance = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.availableBalance || 0), 0);
  }, [customers]);

  return (
    <div className="admin-tab admin-tab-customers space-y-4">
      {/* ── 1. Header Workspace ── */}
      <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-[#001743]">Quản Lý Khách Hàng</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
              {totalCount} khách hàng
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Hồ sơ người dùng sàn đấu giá, theo dõi định danh eKYC, chữ ký số điện tử và số dư ví ký quỹ.
          </p>
        </div>

        {/* Quick stats badges & Export/Import Bar */}
        <div className="flex items-center gap-3">
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
                showToast(`Đã nhập thành công ${newCustomers.length} khách hàng từ file Excel.`);
              }
            }}
          />
          <div className="px-3 py-1.5 bg-slate-50 border border-[#e4e7ec] rounded-lg text-right">
            <span className="text-[10px] block text-slate-400 font-mono uppercase">Tổng số dư trang này</span>
            <span className="text-xs font-bold text-[#001743] font-mono tabular-nums">{formatVND(totalBalance)}</span>
          </div>
          <button
            onClick={fetchCustomers}
            disabled={loading}
            className="p-2 text-[#4B5563] hover:text-[#001743] hover:bg-slate-50 border border-[#e4e7ec] rounded-lg transition-colors bg-white disabled:opacity-50"
            title="Tải lại danh sách"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ── 2. Filter Toolbar Card ── */}
      <div className="bg-white border border-[#e4e7ec] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search box */}
          <div className="relative w-72">
            <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên khách, username, email, SĐT…"
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* eKYC filter */}
          <select
            value={selectedKyc}
            onChange={(e) => {
              setSelectedKyc(e.target.value);
              setPageIndex(1);
            }}
            className="text-xs py-1.5 px-2.5 bg-white border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none text-[#001743] transition-colors"
          >
            <option value="">Tất cả trạng thái eKYC</option>
            <option value="2">Đã xác thực</option>
            <option value="1">Chờ thẩm định</option>
            <option value="3">Bị từ chối</option>
            <option value="0">Chưa gửi hồ sơ</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPageIndex(1);
            }}
            className="text-xs py-1.5 px-2.5 bg-white border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none text-[#001743] transition-colors"
          >
            <option value="">Tất cả trạng thái tài khoản</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Bị khóa</option>
          </select>

          {/* Reset filter button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 hover:bg-rose-50 rounded transition-colors"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        <div className="text-xs text-[#6B7280]">
          Hiển thị <strong className="text-[#001743]">{customers.length}</strong> /{" "}
          <strong className="text-[#001743]">{totalCount}</strong> khách hàng
        </div>
      </div>

      {/* ── 3. Table Card (CRUD Workspace 60-30-10 layout) ── */}
      <div className="bg-white border border-[#e4e7ec] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#e4e7ec] bg-[#F8FAFC] text-slate-500 font-semibold uppercase text-[10px] tracking-wider h-10">
                <th className="py-3 px-4"><AdminSortButton label="Khách hàng" active={sortKey === "name"} direction={sortDirection} onClick={() => changeSort("name")} /></th>
                <th className="py-3 px-4">Số điện thoại / CCCD</th>
                <th className="py-3 px-4">Định danh eKYC</th>
                <th className="py-3 px-4 text-center">Chữ ký số</th>
                <th className="py-3 px-4 text-right"><AdminSortButton label="Ví khả dụng" align="right" active={sortKey === "wallet"} direction={sortDirection} onClick={() => changeSort("wallet")} /></th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="h-16 animate-pulse">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 bg-slate-200 rounded w-32" />
                          <div className="h-2.5 bg-slate-100 rounded w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="h-3 bg-slate-100 rounded w-24" />
                        <div className="h-2.5 bg-slate-100 rounded w-20" />
                      </div>
                    </td>
                    <td className="py-3 px-4"><div className="h-5 bg-slate-100 rounded-full w-24" /></td>
                    <td className="py-3 px-4 text-center"><div className="h-4 bg-slate-100 rounded w-16 mx-auto" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-100 rounded w-20 ml-auto" /></td>
                    <td className="py-3 px-4 text-center"><div className="h-5 bg-slate-100 rounded w-16 mx-auto" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-7 bg-slate-100 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <AlertTriangle size={28} strokeWidth={1.5} className="text-amber-500 mx-auto mb-2" />
                    <div className="text-xs font-bold text-slate-800">Không thể tải dữ liệu khách hàng</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{error}</p>
                    <button
                      onClick={fetchCustomers}
                      className="mt-3 px-3 py-1.5 bg-[#001743] text-white text-xs font-semibold rounded-[6px]"
                    >
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Users size={28} strokeWidth={1.5} className="text-slate-300 mx-auto mb-2" />
                    <div className="text-xs font-bold text-slate-700">
                      {hasActiveFilters ? "Không tìm thấy khách hàng phù hợp với bộ lọc" : "Chưa có khách hàng nào"}
                    </div>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 text-xs text-blue-600 hover:underline"
                      >
                        Xóa bộ lọc
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
                      className={`transition-colors h-16 cursor-pointer ${
                        isUpdated ? "bg-emerald-50" : "hover:bg-slate-50/80"
                      }`}
                      style={{ transition: isUpdated ? "background-color 1500ms ease-out" : undefined }}
                    >
                      {/* Cột 1: Thông tin khách hàng */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <CustomerAvatar name={customer.fullName || customer.userName} avatar={customer.avatarImg} />
                          <div>
                            <div className="font-bold text-xs text-[#001743]">
                              {customer.fullName || customer.userName}
                            </div>
                            <div className="text-[11px] text-[#6B7280] flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-slate-400">@{customer.userName}</span>
                              <span>•</span>
                              <span className="truncate max-w-[160px]">{customer.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: SĐT & CCCD */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-mono font-bold text-[#001743] text-xs">
                            {customer.phoneNumber || "Chưa cập nhật"}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            CCCD: {customer.identityNumber || "—"}
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Định danh eKYC */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold border ${kycBadge.cls}`}
                        >
                          {kycBadge.label}
                        </span>
                      </td>

                      {/* Cột 4: Chữ ký số PKI */}
                      <td className="py-3 px-4 text-center">
                        {customer.hasPkiKeys ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                            title="Đã khởi tạo cặp khóa ký hợp đồng điện tử"
                          >
                            <KeyRound size={12} strokeWidth={1.5} />
                            <span>Đã cấp</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Chưa cấp</span>
                        )}
                      </td>

                      {/* Cột 5: Ví số dư */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-bold text-xs text-slate-800 tabular-nums">
                          {formatVND(customer.availableBalance)}
                        </div>
                        {customer.lockedBalance > 0 && (
                          <div className="text-[10px] text-amber-600 font-mono tabular-nums">
                            Đóng băng: {formatVND(customer.lockedBalance)}
                          </div>
                        )}
                      </td>

                      {/* Cột 6: Trạng thái tài khoản */}
                      <td className="py-3 px-4 text-center">
                        {customer.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Đã khóa
                          </span>
                        )}
                      </td>

                      {/* Cột 7: Thao tác */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetail(customer);
                            }}
                            className="p-1.5 text-slate-500 hover:text-[#001743] hover:bg-slate-100 rounded-[6px] transition-colors"
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
                            className={`p-1.5 rounded-[6px] transition-colors ${
                              customer.isActive
                                ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            }`}
                            title={customer.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
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
          <div className="border-t border-[#e4e7ec]">
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

      {/* ── 4. RightDrawer: Hồ sơ Chi Tiết Khách Hàng ── */}
      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Hồ sơ khách hàng"
        badge={selectedCustomer ? `@${selectedCustomer.userName}` : undefined}
        badgeCls="bg-slate-100 text-slate-700 font-mono"
        size="md"
      >
        {selectedCustomer && (
          <div className="flex flex-col flex-1 min-h-0">
            <DrawerBody>
              {/* Profile Card Header */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center gap-3.5 shadow-2xs">
                <CustomerAvatar
                  name={selectedCustomer.fullName || selectedCustomer.userName}
                  avatar={selectedCustomer.avatarImg}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-[#001743] truncate">
                    {selectedCustomer.fullName || selectedCustomer.userName}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {selectedCustomer.email} • {selectedCustomer.phoneNumber}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        getKycBadge(selectedCustomer.verificationStatus).cls
                      }`}
                    >
                      {getKycBadge(selectedCustomer.verificationStatus).label}
                    </span>
                    {selectedCustomer.isActive ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Đang hoạt động
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Đã khóa
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tài chính ví ký quỹ */}
              <DrawerSection title="Tài chính ví ký quỹ sàn" subtitle="Số dư phục vụ đặt cọc và thanh toán SIM số đẹp">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono block">
                      Số dư khả dụng
                    </span>
                    <span className="text-sm font-bold text-emerald-600 font-mono tabular-nums">
                      {formatVND(selectedCustomer.availableBalance)}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono block">
                      Đóng băng ký quỹ
                    </span>
                    <span className="text-sm font-bold text-amber-600 font-mono tabular-nums">
                      {formatVND(selectedCustomer.lockedBalance)}
                    </span>
                  </div>
                </div>
              </DrawerSection>

              {/* Định danh pháp lý CCCD & Chữ ký số */}
              <DrawerSection title="Định danh cá nhân & eKYC" subtitle="Căn cước công dân và chữ ký số điện tử">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Số thẻ CCCD/CMND:</span>
                    <span className="font-mono font-bold text-[#001743]">
                      {selectedCustomer.identityNumber || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Số điện thoại liên hệ:</span>
                    <span className="font-mono font-bold text-[#001743]">
                      {selectedCustomer.phoneNumber || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Địa chỉ liên hệ:</span>
                    <span className="font-medium text-slate-800 text-right max-w-[60%]">
                      {selectedCustomer.address || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Ngày sinh:</span>
                    <span className="font-mono text-slate-800">
                      {selectedCustomer.dateOfBirth
                        ? new Date(selectedCustomer.dateOfBirth).toLocaleDateString("vi-VN")
                        : "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Chữ ký số điện tử:</span>
                    <span
                      className={`font-bold ${
                        selectedCustomer.hasPkiKeys ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      {selectedCustomer.hasPkiKeys ? "Đã xác thực chữ ký" : "Chưa khởi tạo"}
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
                  className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] border transition-colors ${
                    selectedCustomer.isActive
                      ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {selectedCustomer.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                </button>
                <BtnSecondary onClick={() => setDrawerOpen(false)}>Đóng hồ sơ</BtnSecondary>
              </div>
            </DrawerFooter>
          </div>
        )}
      </RightDrawer>

      {/* ── 5. Modal xác nhận khóa / mở khóa tài khoản ── */}
      {statusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs px-4 animate-fade-in">
          <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xl p-5 w-full max-w-sm animate-fade-up">
            <div className="flex items-start gap-3 mb-3">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  statusConfirm.targetStatus
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {statusConfirm.targetStatus ? (
                  <Unlock size={18} strokeWidth={1.5} />
                ) : (
                  <Lock size={18} strokeWidth={1.5} />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#001743]">
                  {statusConfirm.targetStatus ? "Mở khóa tài khoản khách hàng" : "Khóa tài khoản khách hàng"}
                </h3>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  Bạn có chắc chắn muốn {statusConfirm.targetStatus ? "mở khóa" : "khóa"} tài khoản khách hàng{" "}
                  <strong className="text-slate-800">
                    "{statusConfirm.user.fullName || statusConfirm.user.userName}"
                  </strong>
                  ? Khi bị khóa, khách hàng sẽ không thể đặt giá đấu giá hay chuyển tiền ví.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusConfirm(null)}
                disabled={statusLoading}
                className="px-3.5 py-1.5 border border-[#e4e7ec] text-xs font-semibold text-[#4B5563] rounded-lg hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleToggleStatusConfirm}
                disabled={statusLoading}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 ${
                  statusConfirm.targetStatus
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-[#E4011E] hover:bg-[#c8001a]"
                }`}
              >
                {statusLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : statusConfirm.targetStatus ? (
                  <Unlock size={13} strokeWidth={1.5} />
                ) : (
                  <Lock size={13} strokeWidth={1.5} />
                )}
                <span>{statusConfirm.targetStatus ? "Xác nhận mở khóa" : "Xác nhận khóa"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Toast thông báo nổi ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#001743] text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-fade-up">
          <CheckCircle2 size={16} strokeWidth={1.5} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
