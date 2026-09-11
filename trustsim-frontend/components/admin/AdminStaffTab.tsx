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
  const [totalCount, setTotalCount] = useState(0);

  // Toast & selection
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [updatedStaffId, setUpdatedStaffId] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<AdminUserDetailDto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");

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

  const openEdit = (s: AdminUserDetailDto) => {
    setSelectedStaff(s);
    setDrawerMode("edit");
    setDrawerOpen(true);
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
    <div className="space-y-4">
      {/* ── 1. Header Workspace with Segmented Control ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-[#001743]">Quản Lý Nhân Sự &amp; Nội Bộ (Staff &amp; Admins)</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
              {totalCount} nhân sự
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Phân quyền hệ thống, quản lý tài khoản Quản trị viên và đội ngũ Tư vấn viên trực sàn.
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[6px] transition-colors shadow-xs shrink-0"
        >
          <Plus size={15} strokeWidth={1.5} />
          <span>{activeSegment === "admins" ? "Thêm Quản trị viên" : "Thêm Tư vấn viên"}</span>
        </button>
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
          <span>Quản trị viên (Admins)</span>
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
          <span>Tư vấn viên (Consultants)</span>
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
              placeholder={`Tìm theo họ tên, username, email...`}
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
                <th className="py-3 px-4">Nhân sự</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">
                  {activeSegment === "admins" ? "Thẩm quyền quản trị" : "Phụ trách chuyên môn"}
                </th>
                <th className="py-3 px-4">Ngày cấp quyền</th>
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
                staffList.map((member) => {
                  const isUpdated = updatedStaffId === member.id;

                  return (
                    <tr
                      key={member.id}
                      onClick={() => openEdit(member)}
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

      {/* ── 5. RightDrawer: Thêm mới / Chỉnh sửa Nhân sự ── */}
      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          drawerMode === "create"
            ? activeSegment === "admins"
              ? "Thêm Quản trị viên mới"
              : "Thêm Tư vấn viên mới"
            : "Chỉnh sửa tài khoản nhân sự"
        }
        badge={activeSegment === "admins" ? "ADMIN" : "CONSULTANT"}
        badgeCls={activeSegment === "admins" ? "bg-purple-50 text-purple-700 font-bold font-mono" : "bg-blue-50 text-blue-700 font-bold font-mono"}
        size="md"
      >
        <StaffForm
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
              showToast(`Đã cập nhật thông tin tài khoản thành công.`);
            }
            setUpdatedStaffId(savedStaff.id);
            setTimeout(() => setUpdatedStaffId(null), 1600);
            setDrawerOpen(false);
          }}
          onCancel={() => setDrawerOpen(false)}
        />
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
                  ? Khi bị khóa, tài khoản này sẽ lập tức mất quyền truy cập portal quản trị.
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
  const [role, setRole] = useState<number>(
    typeof initial?.role === "number"
      ? initial.role
      : initial?.role === "ADMIN"
      ? UserRoleEnum.ADMIN
      : defaultRole
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
          role,
        };
        const created = await userService.createAdminUser(payload);
        onSuccess(created);
      } else if (initial) {
        const payload: AdminUpdateUserPayload = {
          email: email.trim(),
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
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

        <DrawerSection title="Thông tin tài khoản đăng nhập" subtitle="Tài khoản truy cập portal dành cho nhân sự">
          {isCreate && (
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
                <option value={UserRoleEnum.ADMIN}>Quản trị viên (Admin)</option>
                <option value={UserRoleEnum.CONSULTANT}>Tư vấn viên (Consultant)</option>
              </select>
            </FormField>
          </div>
        </DrawerSection>

        <DrawerSection title="Hồ sơ nhân viên" subtitle="Họ tên và phương thức liên lạc công vụ">
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
