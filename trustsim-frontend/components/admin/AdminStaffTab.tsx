"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  UserCheck,
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
  UserCog,
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
  { header: "Email", key: "email", width: 25 },
  { header: "Số điện thoại", key: "phoneNumber", width: 16 },
  {
    header: "Vai trò",
    key: "role",
    width: 18,
    formatter: (v) =>
      v === UserRoleEnum.ADMIN || v === 1 || v === "ADMIN" ? "Quản trị viên" : "Tư vấn viên",
  },
  {
    header: "Trạng thái",
    key: "isActive",
    width: 16,
    formatter: (v) => (v ? "Đang hoạt động" : "Đã khóa"),
  },
  { header: "Ngày tạo", key: "createdDate", width: 18 },
];

// Flat Minimalist Staff Avatar (Line/Clean styled)
function StaffAvatar({ name, avatar }: { name: string; avatar?: string }) {
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
  const initials = (name || "NV")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 bg-[#001743]">
      {initials || "NV"}
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
  const displayStaff = [...staffList].sort((a, b) => {
    const left = sortKey === "name" ? (a.fullName || a.userName || "") : String(a.createdDate || "");
    const right = sortKey === "name" ? (b.fullName || b.userName || "") : String(b.createdDate || "");
    const result = String(left).localeCompare(String(right), "vi");
    return sortDirection === "asc" ? result : -result;
  });
  const changeSort = (key: "name" | "date") => {
    const next = toggleSort(sortKey, sortDirection, key);
    setSortKey(next.key); setSortDirection(next.direction);
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
      setError(err.message || "Không thể tải danh sách nhân sự.");
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
      // Giữ nguyên dữ liệu có sẵn từ bảng nếu fetch chi tiết lỗi
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
      // Giữ nguyên dữ liệu có sẵn từ bảng nếu fetch chi tiết lỗi
    }
  };

  const handleToggleStatusConfirm = async () => {
    if (!statusConfirm) return;
    setStatusLoading(true);
    try {
      await userService.toggleUserStatus(statusConfirm.user.id, statusConfirm.targetStatus);
      showToast(
        statusConfirm.targetStatus
          ? `Đã mở khóa tài khoản nhân sự "${statusConfirm.user.fullName}" thành công.`
          : `Đã khóa tài khoản nhân sự "${statusConfirm.user.fullName}" thành công.`
      );
      setStaffList((prev) =>
        prev.map((s) => (s.id === statusConfirm.user.id ? { ...s, isActive: statusConfirm.targetStatus } : s))
      );
      setStatusConfirm(null);
    } catch (err: any) {
      showToast(`Lỗi: ${err.message}`);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="admin-tab admin-tab-staff space-y-4">
      {/* ── 1. Header Workspace with Segmented Control ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-[#001743]">Quản Lý Nhân Sự &amp; Nội Bộ</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
              {totalCount} nhân sự
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Phân quyền hệ thống, quản lý tài khoản Quản trị viên và đội ngũ Tư vấn viên trực sàn.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
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
                    String(r["Vai trò"] || r.role).toLowerCase().includes("admin")
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
                showToast(`Đã nhập thành công ${newStaff.length} nhân sự từ file Excel.`);
              }
            }}
          />
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[6px] transition-colors shadow-xs shrink-0"
          >
            <Plus size={15} strokeWidth={1.5} />
            <span>{activeSegment === "admins" ? "Thêm Quản trị viên" : "Thêm Tư vấn viên"}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Segmented Tabs Switcher ── */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            setActiveSegment("admins");
            setPageIndex(1);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeSegment === "admins"
              ? "border-[#001743] text-[#001743]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck size={16} strokeWidth={1.5} />
          <span>Quản trị viên</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSegment("consultants");
            setPageIndex(1);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeSegment === "consultants"
              ? "border-[#001743] text-[#001743]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Headphones size={16} strokeWidth={1.5} />
          <span>Tư vấn viên</span>
        </button>
      </div>

      {/* ── 3. Filter Toolbar Card ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative w-72">
            <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo họ tên, tên đăng nhập, email..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none"
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

          <button
            onClick={fetchStaff}
            disabled={loading}
            className="p-1.5 text-[#4B5563] hover:text-[#001743] hover:bg-slate-100 border border-[#D1D5DB] rounded-[6px] transition-colors bg-white disabled:opacity-50"
            title="Tải lại danh sách"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} strokeWidth={1.5} />
          </button>
        </div>

        <div className="text-xs text-[#6B7280]">
          Hiển thị <strong className="text-[#001743]">{staffList.length}</strong> /{" "}
          <strong className="text-[#001743]">{totalCount}</strong> tài sự
        </div>
      </div>

      {/* ── 4. Table Card (CRUD Workspace 60-30-10 layout) ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-slate-500 font-semibold uppercase text-[10px] tracking-wider h-10">
                <th className="py-3 px-4"><AdminSortButton label="Nhân sự" active={sortKey === "name"} direction={sortDirection} onClick={() => changeSort("name")} /></th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">
                  {activeSegment === "admins" ? "Thẩm quyền quản trị" : "Phụ trách chuyên môn"}
                </th>
                <th className="py-3 px-4"><AdminSortButton label="Ngày cấp quyền" active={sortKey === "date"} direction={sortDirection} onClick={() => changeSort("date")} /></th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="h-16 animate-pulse">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 bg-slate-200 rounded w-28" />
                          <div className="h-2.5 bg-slate-100 rounded w-20" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                    <td className="py-3 px-4"><div className="h-5 bg-slate-100 rounded-full w-28" /></td>
                    <td className="py-3 px-4"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                    <td className="py-3 px-4 text-center"><div className="h-5 bg-slate-100 rounded w-16 mx-auto" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-7 bg-slate-100 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <AlertTriangle size={28} strokeWidth={1.5} className="text-amber-500 mx-auto mb-2" />
                    <div className="text-xs font-bold text-slate-800">Không thể tải dữ liệu nhân sự</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{error}</p>
                    <button
                      onClick={fetchStaff}
                      className="mt-3 px-3 py-1.5 bg-[#001743] text-white text-xs font-semibold rounded-[6px]"
                    >
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <UserCheck size={28} strokeWidth={1.5} className="text-slate-300 mx-auto mb-2" />
                    <div className="text-xs font-bold text-slate-700">
                      Chưa có {activeSegment === "admins" ? "quản trị viên" : "tư vấn viên"} nào
                    </div>
                  </td>
                </tr>
              ) : (
                displayStaff.map((member) => {
                  const isUpdated = updatedStaffId === member.id;

                  return (
                    <tr
                      key={member.id}
                      onClick={() => openView(member)}
                      className={`transition-colors h-16 cursor-pointer ${
                        isUpdated ? "bg-emerald-50" : "hover:bg-slate-50/80"
                      }`}
                      style={{ transition: isUpdated ? "background-color 1500ms ease-out" : undefined }}
                    >
                      {/* Cột 1: Thông tin nhân sự */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <StaffAvatar name={member.fullName || member.userName} avatar={member.avatarImg} />
                          <div>
                            <div className="font-bold text-xs text-[#001743]">
                              {member.fullName || member.userName}
                            </div>
                            <div className="text-[11px] text-[#6B7280] flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-slate-400">@{member.userName}</span>
                              <span>•</span>
                              <span className="truncate max-w-[160px]">{member.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: SĐT */}
                      <td className="py-3 px-4 font-mono font-bold text-xs text-[#001743]">
                        {member.phoneNumber || "Chưa cập nhật"}
                      </td>

                      {/* Cột 3: Quyền hạn hoặc Phụ trách */}
                      <td className="py-3 px-4">
                        {activeSegment === "admins" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <ShieldCheck size={12} strokeWidth={1.5} />
                            <span>Toàn quyền hệ thống</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Headphones size={12} strokeWidth={1.5} />
                            <span>Tư vấn VIP &amp; Đấu giá</span>
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Ngày cấp quyền */}
                      <td className="py-3 px-4 text-xs font-mono text-slate-600">
                        {member.createdDate ? new Date(member.createdDate).toLocaleDateString("vi-VN") : "—"}
                      </td>

                      {/* Cột 5: Trạng thái */}
                      <td className="py-3 px-4 text-center">
                        {member.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Đã khóa
                          </span>
                        )}
                      </td>

                      {/* Cột 6: Thao tác */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(member);
                            }}
                            className="p-1.5 text-slate-500 hover:text-[#001743] hover:bg-slate-100 rounded-[6px] transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit3 size={15} strokeWidth={1.5} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusConfirm({ user: member, targetStatus: !member.isActive });
                            }}
                            className={`p-1.5 rounded-[6px] transition-colors ${
                              member.isActive
                                ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            }`}
                            title={member.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
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

      {/* ── 5. RightDrawer: Chi tiết / Chỉnh sửa / Thêm mới Nhân sự ── */}
      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          drawerMode === "create"
            ? activeSegment === "admins"
              ? "Thêm Quản trị viên mới"
              : "Thêm Tư vấn viên mới"
            : drawerMode === "view"
            ? "Chi tiết tài khoản nhân sự"
            : "Chỉnh sửa tài khoản nhân sự"
        }
        badge={
          drawerMode === "create"
            ? activeSegment === "admins"
              ? "Quản trị viên"
              : "Tư vấn viên"
            : selectedStaff?.fullName || selectedStaff?.userName || "Nhân sự"
        }
        badgeCls={
          drawerMode === "create"
            ? activeSegment === "admins"
              ? "bg-purple-50 text-purple-700 font-bold"
              : "bg-blue-50 text-blue-700 font-bold"
            : "bg-slate-100 text-[#001743] font-bold"
        }
        size="md"
      >
        {drawerMode === "view" && selectedStaff && (
          <div className="flex flex-col flex-1 min-h-0">
            <DrawerBody>
              {/* Header profile card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StaffAvatar name={selectedStaff.fullName || selectedStaff.userName} avatar={selectedStaff.avatarImg} />
                  <div>
                    <div className="font-bold text-sm text-[#001743]">
                      {selectedStaff.fullName || selectedStaff.userName}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">@{selectedStaff.userName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedStaff.role === UserRoleEnum.ADMIN ||
                      selectedStaff.role === 1 ||
                      selectedStaff.role === "ADMIN"
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {selectedStaff.role === UserRoleEnum.ADMIN ||
                    selectedStaff.role === 1 ||
                    selectedStaff.role === "ADMIN"
                      ? "Quản trị viên"
                      : "Tư vấn viên"}
                  </span>
                  {selectedStaff.isActive ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Hoạt động
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Đã khóa
                    </span>
                  )}
                </div>
              </div>

              {/* Section 1: Thông tin tài khoản & quyền hạn */}
              <DrawerSection title="Tài khoản & Thẩm quyền" subtitle="Thông tin định danh và quyền truy cập quản trị">
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Tên đăng nhập:</span>
                    <span className="font-mono font-bold text-[#001743]">@{selectedStaff.userName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Email nội bộ:</span>
                    <span className="font-medium text-[#001743]">{selectedStaff.email}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Quyền hạn hệ thống:</span>
                    <span className="font-bold text-[#001743]">
                      {selectedStaff.role === UserRoleEnum.ADMIN ||
                      selectedStaff.role === 1 ||
                      selectedStaff.role === "ADMIN"
                        ? "Toàn quyền quản trị hệ thống"
                        : "Tư vấn VIP & Quản lý đấu giá"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Ngày cấp quyền:</span>
                    <span className="font-mono text-slate-700">
                      {selectedStaff.createdDate
                        ? new Date(selectedStaff.createdDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Trạng thái tài khoản:</span>
                    <span className={`font-bold ${selectedStaff.isActive ? "text-emerald-600" : "text-rose-600"}`}>
                      {selectedStaff.isActive ? "Đang hoạt động bình thường" : "Đang bị khóa quyền truy cập"}
                    </span>
                  </div>
                </div>
              </DrawerSection>

              {/* Section 2: Hồ sơ nhân sự & liên hệ */}
              <DrawerSection title="Hồ sơ nhân sự" subtitle="Thông tin liên hệ công vụ và thông tin cá nhân">
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Họ và tên:</span>
                    <span className="font-bold text-[#001743]">{selectedStaff.fullName || "Chưa cập nhật"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Số điện thoại công vụ:</span>
                    <span className="font-mono font-bold text-[#001743]">{selectedStaff.phoneNumber || "Chưa cập nhật"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Số CCCD / Định danh:</span>
                    <span className="font-mono font-bold text-[#001743]">{selectedStaff.identityNumber || "Chưa cập nhật"}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Địa chỉ công tác:</span>
                    <span className="font-medium text-slate-800 text-right max-w-[60%]">{selectedStaff.address || "Chưa cập nhật"}</span>
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
                  className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] border transition-colors ${
                    selectedStaff.isActive
                      ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {selectedStaff.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                </button>
                <div className="flex items-center gap-2">
                  <BtnSecondary onClick={() => setDrawerOpen(false)}>Đóng</BtnSecondary>
                  <BtnPrimary onClick={() => setDrawerMode("edit")}>
                    <Edit3 size={13} strokeWidth={1.5} />
                    <span>Chỉnh sửa</span>
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
                showToast(`Đã thêm mới tài khoản nội bộ "${savedStaff.fullName || savedStaff.userName}" thành công.`);
              } else {
                setStaffList((prev) => prev.map((s) => (s.id === savedStaff.id ? savedStaff : s)));
                setSelectedStaff(savedStaff);
                showToast(`Đã cập nhật thông tin tài khoản thành công.`);
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

      {/* ── 6. Modal xác nhận khóa / mở khóa ── */}
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
                {statusConfirm.targetStatus ? <Unlock size={18} strokeWidth={1.5} /> : <Lock size={18} strokeWidth={1.5} />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#001743]">
                  {statusConfirm.targetStatus ? "Mở khóa nhân sự" : "Xác nhận khóa tài khoản"}
                </h3>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  Bạn có chắc chắn muốn {statusConfirm.targetStatus ? "mở khóa" : "khóa"} tài khoản nhân sự{" "}
                  <strong className="text-slate-800">
                    "{statusConfirm.user.fullName || statusConfirm.user.userName}"
                  </strong>
                  ? Khi bị khóa, tài khoản này sẽ lập tức mất quyền truy cập trang quản trị.
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
                className={`px-3.5 py-1.5 text-xs font-semibold text-white rounded-[6px] flex items-center gap-1.5 transition-colors ${
                  statusConfirm.targetStatus ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
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

      {/* ── 7. Toast thông báo nổi ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#001743] text-white px-4 py-3 rounded-[8px] shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-fade-up">
          <CheckCircle2 size={16} strokeWidth={1.5} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

// --- Sub-component: Staff Form ---
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

  // Đồng bộ lại state khi initial hoặc defaultRole thay đổi
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
    if (!email.trim() || !email.includes("@")) errs.email = "Email nội bộ không hợp lệ.";
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
            <AlertTriangle size={15} strokeWidth={1.5} className="shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {!isCreate && initial && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <StaffAvatar name={initial.fullName || initial.userName} avatar={initial.avatarImg} />
              <div>
                <div className="font-bold text-xs text-[#001743]">{initial.fullName || initial.userName}</div>
                <div className="text-[11px] text-slate-500 font-mono">@{initial.userName}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  role === UserRoleEnum.ADMIN
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {role === UserRoleEnum.ADMIN ? "Quản trị viên" : "Tư vấn viên"}
              </span>
              {initial.isActive ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Hoạt động
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Đã khóa
                </span>
              )}
            </div>
          </div>
        )}

        <DrawerSection title="Thông tin tài khoản đăng nhập" subtitle="Tài khoản truy cập hệ thống dành cho nhân sự">
          {isCreate ? (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Tên đăng nhập" required error={errors.userName}>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="VD: admin_hieu"
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none font-mono font-semibold"
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
          ) : (
            <FormField label="Tên đăng nhập hệ thống" hint="Cố định theo tài khoản nội bộ">
              <input
                type="text"
                value={`@${userName}`}
                disabled
                className="w-full text-xs p-2.5 border border-[#E2E8F0] bg-slate-100 text-slate-500 rounded-[6px] font-mono font-semibold cursor-not-allowed"
              />
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email nội bộ công việc" required error={errors.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tennhanvien@trustsim.vn"
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none"
              />
            </FormField>

            <FormField label="Vai trò chức danh" required>
              <select
                value={role}
                onChange={(e) => setRole(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none font-semibold text-[#001743]"
              >
                <option value={UserRoleEnum.ADMIN}>Quản trị viên</option>
                <option value={UserRoleEnum.CONSULTANT}>Tư vấn viên</option>
              </select>
            </FormField>
          </div>
        </DrawerSection>

        <DrawerSection title="Hồ sơ nhân sự" subtitle="Họ tên và phương thức liên lạc công vụ">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Họ và tên" required error={errors.fullName}>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Lê Hoàng Chuyên Viên"
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none font-semibold text-[#001743]"
              />
            </FormField>

            <FormField label="Số điện thoại công vụ" required error={errors.phoneNumber}>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="VD: 0900000002"
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none font-mono"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Số CCCD / Định danh (Tùy chọn)">
              <input
                type="text"
                value={identityNumber}
                onChange={(e) => setIdentityNumber(e.target.value)}
                placeholder="VD: 001201012345"
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none font-mono"
              />
            </FormField>

            <FormField label="Địa chỉ công tác (Tùy chọn)">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="VD: Trụ sở chính Hà Nội"
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none"
              />
            </FormField>
          </div>
        </DrawerSection>
      </DrawerBody>

      <DrawerFooter>
        <div className="flex items-center justify-end gap-2 w-full">
          <BtnSecondary type="button" onClick={onCancel} disabled={saving}>
            Hủy bỏ
          </BtnSecondary>
          <BtnPrimary type="submit" disabled={saving}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={1.5} />}
            <span>{isCreate ? "Khởi tạo tài khoản" : "Lưu thay đổi"}</span>
          </BtnPrimary>
        </div>
      </DrawerFooter>
    </form>
  );
}
