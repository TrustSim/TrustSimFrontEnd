/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
/* Note: Legacy/Orphaned tab. Active customer management is handled by AdminCustomersTab.tsx */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Plus,
  Edit3,
  Eye,
  Lock,
  Unlock,
  RefreshCw,
  X,
  Check,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  KeyRound,
  Calendar,
  Phone,
  Mail,
  MapPin,
  IdCard,
  Loader2,
  UserCheck,
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

// --- Formatter helpers ---
const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

function getRoleLabel(role: number | UserRoleEnum | string) {
  if (role === UserRoleEnum.ADMIN || role === "ADMIN" || role === 1) {
    return { label: "Quản trị viên", cls: "bg-purple-50 text-purple-700 border-purple-200" };
  }
  if (role === UserRoleEnum.CONSULTANT || role === "CONSULTANT" || role === 2) {
    return { label: "Tư vấn viên", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  return { label: "Người dùng", cls: "bg-slate-100 text-slate-700 border-slate-200" };
}

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
  return { label: "Chưa nộp KYC", cls: "bg-slate-50 text-slate-500 border-slate-200" };
}

// User Avatar component
function UserAvatar({ name, avatar, size = 9 }: { name: string; avatar?: string; size?: number }) {
  if (avatar && avatar.trim() !== "" && !avatar.includes("default.png")) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`w-${size} h-${size} rounded-full object-cover border border-slate-200 bg-white shrink-0`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  const initials = (name || "U")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs bg-[#001743]`}
    >
      {initials || "U"}
    </div>
  );
}

// --- Main Tab Component ---
export function AdminUsersTab() {
  const [users, setUsers] = useState<AdminUserDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [updatedUserId, setUpdatedUserId] = useState<string | null>(null);

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"detail" | "create" | "edit">("detail");
  const [selectedUser, setSelectedUser] = useState<AdminUserDetailDto | null>(null);

  // Toggle status modal
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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getAdminUsers({
        keyword: debouncedSearch,
        role: selectedRole !== "" ? selectedRole : undefined,
        isActive: selectedStatus !== "" ? selectedStatus === "active" : undefined,
        pageIndex,
        pageSize,
      });
      setUsers(res.items);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách tài khoản.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedRole, selectedStatus, pageIndex, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle drawer open
  const openDetail = (u: AdminUserDetailDto) => {
    setSelectedUser(u);
    setDrawerMode("detail");
    setDrawerOpen(true);
  };

  const openCreate = () => {
    setSelectedUser(null);
    setDrawerMode("create");
    setDrawerOpen(true);
  };

  const openEdit = (u: AdminUserDetailDto) => {
    setSelectedUser(u);
    setDrawerMode("edit");
    setDrawerOpen(true);
  };

  // Toggle user active status
  const handleToggleStatusConfirm = async () => {
    if (!statusConfirm) return;
    setStatusLoading(true);
    try {
      await userService.toggleUserStatus(statusConfirm.user.id, statusConfirm.targetStatus);
      showToast(
        statusConfirm.targetStatus
          ? `Đã mở khóa tài khoản "${statusConfirm.user.fullName}" thành công.`
          : `Đã khóa tài khoản "${statusConfirm.user.fullName}" thành công.`
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === statusConfirm.user.id ? { ...u, isActive: statusConfirm.targetStatus } : u))
      );
      if (selectedUser?.id === statusConfirm.user.id) {
        setSelectedUser((prev) => (prev ? { ...prev, isActive: statusConfirm.targetStatus } : null));
      }
      setStatusConfirm(null);
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`);
    } finally {
      setStatusLoading(false);
    }
  };

  const hasActiveFilters = debouncedSearch || selectedRole !== "" || selectedStatus !== "";

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedRole("");
    setSelectedStatus("");
    setPageIndex(1);
  };

  return (
    <div className="space-y-4">
      {/* ── 1. Header Card (Matching CRUD Workspace Guidelines) ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-[#001743]">Quản Lý Người Dùng &amp; Phân Quyền</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
              {totalCount} tài khoản
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Quản lý tài khoản hệ thống, thẩm định định danh eKYC, số dư ví ký quỹ và cấp quyền quản trị viên.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[6px] transition-colors shadow-xs shrink-0"
          >
            <Plus size={15} strokeWidth={1.75} />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      {/* ── 2. Filter Toolbar Card ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search box */}
          <div className="relative w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo họ tên, username, email, SĐT..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Role filter */}
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPageIndex(1);
            }}
            className="text-xs py-1.5 px-2.5 bg-white border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none text-[#001743]"
          >
            <option value="">Tất cả vai trò</option>
            <option value="1">Quản trị viên (ADMIN)</option>
            <option value="2">Tư vấn viên (CONSULTANT)</option>
            <option value="0">Người dùng (USER)</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPageIndex(1);
            }}
            className="text-xs py-1.5 px-2.5 bg-white border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none text-[#001743]"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Bị khóa</option>
          </select>

          {/* Reset filter button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 hover:bg-rose-50 rounded transition-colors"
            >
              Đặt lại
            </button>
          )}

          {/* Refresh button */}
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-1.5 text-[#4B5563] hover:text-[#001743] hover:bg-slate-100 border border-[#D1D5DB] rounded-[6px] transition-colors bg-white disabled:opacity-50"
            title="Tải lại danh sách"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} strokeWidth={1.75} />
          </button>
        </div>

        <div className="text-xs text-[#6B7280]">
          Hiển thị <strong className="text-[#001743]">{users.length}</strong> /{" "}
          <strong className="text-[#001743]">{totalCount}</strong> tài khoản
        </div>
      </div>

      {/* ── 3. Table Card (CRUD Workspace 60-30-10 layout) ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-slate-500 font-semibold uppercase text-[10px] tracking-wider h-10">
                <th className="py-3 px-4">Thành viên</th>
                <th className="py-3 px-4">Số điện thoại / CCCD</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Định danh eKYC</th>
                <th className="py-3 px-4 text-right">Ví khả dụng</th>
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
                    <td className="py-3 px-4"><div className="h-5 bg-slate-100 rounded-full w-20" /></td>
                    <td className="py-3 px-4"><div className="h-5 bg-slate-100 rounded-full w-24" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 bg-slate-100 rounded w-20 ml-auto" /></td>
                    <td className="py-3 px-4 text-center"><div className="h-5 bg-slate-100 rounded w-16 mx-auto" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-7 bg-slate-100 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <AlertTriangle size={28} className="text-amber-500 mx-auto mb-2" />
                    <div className="text-xs font-bold text-slate-800">Không thể tải dữ liệu người dùng</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{error}</p>
                    <button
                      onClick={fetchUsers}
                      className="mt-3 px-3 py-1.5 bg-[#001743] text-white text-xs font-semibold rounded-[6px]"
                    >
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Users size={28} className="text-slate-300 mx-auto mb-2" />
                    <div className="text-xs font-bold text-slate-700">
                      {hasActiveFilters ? "Không tìm thấy người dùng phù hợp với bộ lọc" : "Chưa có tài khoản nào"}
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
                users.map((user) => {
                  const roleBadge = getRoleLabel(user.role);
                  const kycBadge = getKycBadge(user.verificationStatus);
                  const isUpdated = updatedUserId === user.id;

                  return (
                    <tr
                      key={user.id}
                      onClick={() => openDetail(user)}
                      className={`transition-colors h-16 cursor-pointer ${
                        isUpdated ? "bg-emerald-50" : "hover:bg-slate-50/80"
                      }`}
                      style={{ transition: isUpdated ? "background-color 1500ms ease-out" : undefined }}
                    >
                      {/* Cột 1: Thông tin thành viên */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={user.fullName || user.userName} avatar={user.avatarImg} />
                          <div>
                            <div className="font-bold text-xs text-[#001743] flex items-center gap-1.5">
                              <span>{user.fullName || user.userName}</span>
                              {user.hasPkiKeys && (
                                <span title="Đã cấp cặp khóa PKI ký hợp đồng">
                                  <KeyRound size={12} className="text-amber-500" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#6B7280] flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-slate-400">@{user.userName}</span>
                              <span>•</span>
                              <span className="truncate max-w-[150px]">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: SĐT & CCCD */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-mono font-bold text-[#001743] text-xs">
                            {user.phoneNumber || "Chưa cập nhật"}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            CCCD: {user.identityNumber || "—"}
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Vai trò */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold border ${roleBadge.cls}`}
                        >
                          {roleBadge.label}
                        </span>
                      </td>

                      {/* Cột 4: eKYC */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold border ${kycBadge.cls}`}
                        >
                          {kycBadge.label}
                        </span>
                      </td>

                      {/* Cột 5: Ví số dư */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-bold text-xs text-slate-800 tabular-nums">
                          {formatVND(user.availableBalance)}
                        </div>
                        {user.lockedBalance > 0 && (
                          <div className="text-[10px] text-amber-600 font-mono tabular-nums">
                            Đóng băng: {formatVND(user.lockedBalance)}
                          </div>
                        )}
                      </td>

                      {/* Cột 6: Trạng thái tài khoản */}
                      <td className="py-3 px-4 text-center">
                        {user.isActive ? (
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
                              openDetail(user);
                            }}
                            className="p-1.5 text-slate-500 hover:text-[#001743] hover:bg-slate-100 rounded-[6px] transition-colors"
                            title="Xem chi tiết tài khoản"
                          >
                            <Eye size={15} strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(user);
                            }}
                            className="p-1.5 text-slate-500 hover:text-[#001743] hover:bg-slate-100 rounded-[6px] transition-colors"
                            title="Chỉnh sửa tài khoản"
                          >
                            <Edit3 size={15} strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusConfirm({ user, targetStatus: !user.isActive });
                            }}
                            className={`p-1.5 rounded-[6px] transition-colors ${
                              user.isActive
                                ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            }`}
                            title={user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          >
                            {user.isActive ? (
                              <Lock size={15} strokeWidth={1.75} />
                            ) : (
                              <Unlock size={15} strokeWidth={1.75} />
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

        {/* Chân bảng: Phân trang chuẩn mực Pagination */}
        {!loading && totalCount > 0 && (
          <div className="border-t border-[#E2E8F0]">
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

      {/* ── 4. RightDrawer: Xem Chi tiết / Thêm mới / Chỉnh sửa ── */}
      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          drawerMode === "detail"
            ? "Hồ sơ người dùng"
            : drawerMode === "create"
            ? "Tạo tài khoản nội bộ"
            : "Chỉnh sửa tài khoản"
        }
        badge={
          drawerMode === "create"
            ? "MỚI"
            : selectedUser
            ? getRoleLabel(selectedUser.role).label
            : undefined
        }
        badgeCls={
          selectedUser ? getRoleLabel(selectedUser.role).cls : "bg-slate-100 text-slate-700"
        }
        size="md"
      >
        {drawerMode === "detail" && selectedUser && (
          <div className="flex flex-col flex-1 min-h-0">
            <DrawerBody>
              {/* Profile Card Header */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center gap-3.5 shadow-2xs">
                <UserAvatar
                  name={selectedUser.fullName || selectedUser.userName}
                  avatar={selectedUser.avatarImg}
                  size={12}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-[#001743] truncate">
                    {selectedUser.fullName || selectedUser.userName}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    @{selectedUser.userName} • {selectedUser.email}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        getRoleLabel(selectedUser.role).cls
                      }`}
                    >
                      {getRoleLabel(selectedUser.role).label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        getKycBadge(selectedUser.verificationStatus).cls
                      }`}
                    >
                      {getKycBadge(selectedUser.verificationStatus).label}
                    </span>
                    {selectedUser.isActive ? (
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

              {/* Thông tin ví tiền & ký quỹ */}
              <DrawerSection title="Tài chính ví ký quỹ" subtitle="Số dư tài khoản và hạn mức đặt cọc đấu giá">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono block">
                      Số dư khả dụng
                    </span>
                    <span className="text-sm font-bold text-emerald-600 font-mono tabular-nums">
                      {formatVND(selectedUser.availableBalance)}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono block">
                      Số dư đóng băng (Ký quỹ)
                    </span>
                    <span className="text-sm font-bold text-amber-600 font-mono tabular-nums">
                      {formatVND(selectedUser.lockedBalance)}
                    </span>
                  </div>
                </div>
              </DrawerSection>

              {/* Thông tin định danh & CCCD */}
              <DrawerSection title="Định danh cá nhân" subtitle="Thông tin xác thực hồ sơ và chứng thư số">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Số CCCD/CMND:</span>
                    <span className="font-mono font-bold text-[#001743]">
                      {selectedUser.identityNumber || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Số điện thoại:</span>
                    <span className="font-mono font-bold text-[#001743]">
                      {selectedUser.phoneNumber || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Địa chỉ liên hệ:</span>
                    <span className="font-medium text-slate-800 text-right max-w-[60%]">
                      {selectedUser.address || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Ngày sinh:</span>
                    <span className="font-mono text-slate-800">
                      {selectedUser.dateOfBirth
                        ? new Date(selectedUser.dateOfBirth).toLocaleDateString("vi-VN")
                        : "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Cặp khóa chữ ký PKI:</span>
                    <span
                      className={`font-bold ${
                        selectedUser.hasPkiKeys ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      {selectedUser.hasPkiKeys ? "Đã khởi tạo hợp lệ" : "Chưa khởi tạo"}
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
                      user: selectedUser,
                      targetStatus: !selectedUser.isActive,
                    });
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] border transition-colors ${
                    selectedUser.isActive
                      ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {selectedUser.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                </button>
                <div className="flex items-center gap-2">
                  <BtnSecondary onClick={() => setDrawerOpen(false)}>Đóng</BtnSecondary>
                  <BtnPrimary onClick={() => setDrawerMode("edit")}>
                    <Edit3 size={13} />
                    <span>Chỉnh sửa</span>
                  </BtnPrimary>
                </div>
              </div>
            </DrawerFooter>
          </div>
        )}

        {(drawerMode === "create" || drawerMode === "edit") && (
          <UserForm
            mode={drawerMode}
            initial={selectedUser}
            onSuccess={(savedUser) => {
              if (drawerMode === "create") {
                setUsers((prev) => [savedUser, ...prev]);
                setTotalCount((c) => c + 1);
                showToast(`Đã tạo tài khoản "${savedUser.fullName || savedUser.userName}" thành công.`);
              } else {
                setUsers((prev) => prev.map((u) => (u.id === savedUser.id ? savedUser : u)));
                showToast(`Đã cập nhật thông tin tài khoản thành công.`);
              }
              setUpdatedUserId(savedUser.id);
              setTimeout(() => setUpdatedUserId(null), 1600);
              setDrawerOpen(false);
            }}
            onCancel={() => setDrawerOpen(false)}
          />
        )}
      </RightDrawer>

      {/* ── 5. Modal xác nhận khóa / mở khóa tài khoản ── */}
      {statusConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-[8px] shadow-xl p-5 w-full max-w-sm animate-fade-up">
            <div className="flex items-start gap-3 mb-3">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  statusConfirm.targetStatus
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {statusConfirm.targetStatus ? <Unlock size={18} /> : <Lock size={18} />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#001743]">
                  {statusConfirm.targetStatus ? "Mở khóa tài khoản" : "Xác nhận khóa tài khoản"}
                </h3>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  Bạn có chắc chắn muốn {statusConfirm.targetStatus ? "mở khóa" : "khóa"} tài khoản{" "}
                  <strong className="text-slate-800">
                    "{statusConfirm.user.fullName || statusConfirm.user.userName}"
                  </strong>
                  ? Khi bị khóa, người dùng sẽ không thể đăng nhập hoặc tham gia đấu giá.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusConfirm(null)}
                disabled={statusLoading}
                className="px-3.5 py-1.5 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] rounded-[6px] hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleToggleStatusConfirm}
                disabled={statusLoading}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-white text-xs font-bold rounded-[6px] transition-colors disabled:opacity-50 ${
                  statusConfirm.targetStatus
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {statusLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : statusConfirm.targetStatus ? (
                  <Unlock size={13} />
                ) : (
                  <Lock size={13} />
                )}
                <span>{statusConfirm.targetStatus ? "Xác nhận mở khóa" : "Xác nhận khóa"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Toast thông báo nổi ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#001743] text-white px-4 py-3 rounded-[8px] shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-fade-up">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

// --- Sub-component: User Create/Edit Form ---
function UserForm({
  mode,
  initial,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
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
  const [role, setRole] = useState<number>(
    typeof initial?.role === "number"
      ? initial.role
      : initial?.role === "ADMIN"
      ? UserRoleEnum.ADMIN
      : initial?.role === "CONSULTANT"
      ? UserRoleEnum.CONSULTANT
      : UserRoleEnum.USER
  );
  const [address, setAddress] = useState(initial?.address || "");
  const [dateOfBirth, setDateOfBirth] = useState<string>(
    initial?.dateOfBirth ? initial.dateOfBirth.split("T")[0] : ""
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (isCreate) {
      if (!userName.trim()) errs.userName = "Tên đăng nhập không được để trống.";
      else if (userName.length < 3) errs.userName = "Tên đăng nhập tối thiểu 3 ký tự.";
      if (!password.trim()) errs.password = "Mật khẩu không được để trống.";
      else if (password.length < 6) errs.password = "Mật khẩu tối thiểu 6 ký tự.";
    }
    if (!email.trim() || !email.includes("@")) errs.email = "Email không hợp lệ.";
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
          role,
          address: address.trim() || undefined,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
        };
        const created = await userService.createAdminUser(payload);
        onSuccess(created);
      } else if (initial) {
        const payload: AdminUpdateUserPayload = {
          email: email.trim(),
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          identityNumber: identityNumber.trim() || undefined,
          role,
          address: address.trim() || undefined,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
        };
        const updated = await userService.updateAdminUser(initial.id, payload);
        onSuccess(updated);
      }
    } catch (err: any) {
      setErrors({ form: err.message || "Thao tác thất bại." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
      <DrawerBody>
        {errors.form && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Section 1: Thông tin tài khoản đăng nhập */}
        <DrawerSection
          title="Tài khoản & Phân quyền"
          subtitle="Tên định danh, mật khẩu và thẩm quyền quản trị"
        >
          {isCreate && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Tên đăng nhập (Username)" required error={errors.userName}>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="VD: admin_nhanvien"
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none font-mono"
                />
              </FormField>

              <FormField label="Mật khẩu khởi tạo" required error={errors.password}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none"
                />
              </FormField>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Địa chỉ Email" required error={errors.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@trustsim.vn"
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none"
              />
            </FormField>

            <FormField label="Vai trò (Role)" required>
              <select
                value={role}
                onChange={(e) => setRole(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none font-semibold text-[#001743]"
              >
                <option value={UserRoleEnum.USER}>Người dùng (Khách hàng)</option>
                <option value={UserRoleEnum.CONSULTANT}>Tư vấn viên (Consultant)</option>
                <option value={UserRoleEnum.ADMIN}>Quản trị viên (Admin)</option>
              </select>
            </FormField>
          </div>
        </DrawerSection>

        {/* Section 2: Hồ sơ thông tin cá nhân */}
        <DrawerSection
          title="Hồ sơ thành viên"
          subtitle="Họ tên đầy đủ, số điện thoại và thông tin công dân"
        >
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Họ và tên" required error={errors.fullName}>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Văn An"
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none font-semibold text-[#001743]"
              />
            </FormField>

            <FormField label="Số điện thoại liên hệ" required error={errors.phoneNumber}>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="VD: 0901234567"
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none font-mono"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Số CCCD/CMND" hint="12 chữ số theo thẻ căn cước">
              <input
                type="text"
                value={identityNumber}
                onChange={(e) => setIdentityNumber(e.target.value)}
                placeholder="001088000123"
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none font-mono"
              />
            </FormField>

            <FormField label="Ngày sinh">
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none"
              />
            </FormField>
          </div>

          <FormField label="Địa chỉ thường trú / liên hệ">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="VD: Số 123 đường Hai Bà Trưng, Quận 1, TP.HCM"
              className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none"
            />
          </FormField>
        </DrawerSection>
      </DrawerBody>

      <DrawerFooter>
        <div className="flex items-center justify-end gap-2 w-full">
          <BtnSecondary type="button" onClick={onCancel} disabled={saving}>
            Hủy bỏ
          </BtnSecondary>
          <BtnPrimary type="submit" disabled={saving}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            <span>{isCreate ? "Tạo tài khoản" : "Lưu thay đổi"}</span>
          </BtnPrimary>
        </div>
      </DrawerFooter>
    </form>
  );
}
