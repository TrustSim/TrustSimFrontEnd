/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit3, Trash2, AlertTriangle, X, Check,
  Loader2, RefreshCw, Tag, TrendingUp, Search,
} from "lucide-react";
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  type SimCategoryDto, type CreateCategoryPayload,
} from "@/services/categoryService";
import {
  RightDrawer, DrawerBody, DrawerFooter, DrawerSection, FormField,
  BtnPrimary, BtnSecondary,
} from "@/components/ui/RightDrawer";
import { Pagination } from "@/components/ui/Pagination";
import { AdminSortButton, toggleSort, type SortDirection } from "@/components/admin/AdminPrimitives";
import { simValidators } from "@/utils/validators";

// --- Delete Modal ---
function DeleteModal({ name, onConfirm, onCancel, loading }: {
  name: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs px-4 animate-fade-in">
      <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xl p-5 w-full max-w-sm animate-fade-up">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0">
            <AlertTriangle size={18} strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#001743]">Xác nhận xóa thể loại SIM</h3>
            <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
              Bạn có chắc chắn muốn xóa thể loại <span className="font-bold text-slate-800">"{name}"</span>?
              Hành động này sẽ gỡ liên kết danh mục khỏi toàn bộ SIM liên quan trong kho.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-3.5 py-1.5 border border-[#e4e7ec] text-xs font-semibold text-[#4B5563] rounded-lg hover:bg-slate-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#E4011E] hover:bg-[#c8001a] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            <span>Xác nhận xóa</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Category Form inside RightDrawer ---
function CategoryForm({ initial, onSave, onClose }: {
  initial?: SimCategoryDto | null;
  onSave: (p: CreateCategoryPayload, id?: string) => Promise<void>;
  onClose: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<CreateCategoryPayload>({
    categoryCode: initial?.categoryCode ?? "",
    categoryName: initial?.categoryName ?? "",
    description: initial?.description ?? "",
    valuationMultiplier: initial?.valuationMultiplier ?? 1.0,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateCategoryPayload, string>>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: keyof CreateCategoryPayload, v: any) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  };
  const validate = () => {
    const e: typeof errors = {};
    const res = simValidators.validateCategory(form.categoryName, form.categoryCode);
    if (!res.isValid && res.error) {
      if (res.error.includes("Tên")) {
        e.categoryName = res.error;
      } else if (res.error.includes("Mã")) {
        e.categoryCode = res.error;
      } else {
        e.categoryName = res.error;
      }
    }
    if ((form.valuationMultiplier ?? 0) <= 0) e.valuationMultiplier = "Hệ số AI phải lớn hơn 0.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form, initial?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form id="category-drawer-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
      <DrawerBody>
        {/* Live Preview Card */}
        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex items-center justify-between shadow-2xs">
          <div>
            <div className="text-sm font-bold text-[#001743]">{form.categoryName || "Tên thể loại SIM"}</div>
            <div className="text-[11px] font-mono text-slate-500 mt-0.5">{form.categoryCode || "CODE"}</div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-indigo-600 block font-bold">Hệ số định giá AI</span>
            <span className="text-base font-black text-indigo-700 tabular-nums">
              x{form.valuationMultiplier || 1.0} AI Score
            </span>
          </div>
        </div>

        <DrawerSection title="Thông tin định danh thể loại" subtitle="Tên hiển thị và mã kỹ thuật nhận diện thế số">
          <FormField label="Mã thể loại (Category Code)" required error={errors.categoryCode} hint="Viết hoa, không dấu, dùng gạch dưới. VD: BAT_QUY, THAN_TAI, LOC_PHAT">
            <input
              type="text"
              value={form.categoryCode}
              onChange={e => set("categoryCode", e.target.value.toUpperCase())}
              placeholder="VD: BAT_QUY"
              className="w-full text-xs p-2.5 border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none font-mono font-bold uppercase text-[#001743] transition-colors"
            />
          </FormField>

          <FormField label="Tên hiển thị thể loại" required error={errors.categoryName} hint="VD: Bát quý (88888888), Lộc phát (6868), Tứ quý kép">
            <input
              type="text"
              value={form.categoryName}
              onChange={e => set("categoryName", e.target.value)}
              placeholder="VD: Bát quý (88888888)"
              className="w-full text-xs p-2.5 border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none font-semibold text-[#001743] transition-colors"
            />
          </FormField>
        </DrawerSection>

        <DrawerSection title="Mô hình định giá AI (AI Valuation Engine)" subtitle="Hệ số nhân bản định giá tự động và thanh khoản thị trường">
          <FormField label="Hệ số định giá AI (Multiplier)" required error={errors.valuationMultiplier} hint="Giá định giá AI = Hệ số x Giá sàn thị trường. Mặc định 1.0.">
            <div className="relative">
              <TrendingUp size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600" strokeWidth={1.75} />
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={form.valuationMultiplier}
                onChange={e => set("valuationMultiplier", parseFloat(e.target.value) || 1.0)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none tabular-nums font-bold text-[#001743] transition-colors"
              />
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="bg-white p-2.5 rounded-lg border border-[#e4e7ec]">
              <span className="text-[#6B7280] block text-[10px]">Độ hiếm phân loại:</span>
              <strong className="text-[#001743] font-bold">
                {form.valuationMultiplier && form.valuationMultiplier >= 3.0 ? "Cực hiếm (Super Rare)" : "Phổ biến / Tiêu chuẩn"}
              </strong>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-[#e4e7ec]">
              <span className="text-[#6B7280] block text-[10px]">Dự báo thanh khoản:</span>
              <strong className="text-emerald-700 font-bold">Rất cao (A+)</strong>
            </div>
          </div>
        </DrawerSection>

        <DrawerSection title="Mô tả quy tắc & Phong thủy" subtitle="Đặc điểm thế số, ý nghĩa phong thủy và nhận diện">
          <FormField label="Mô tả phong thủy" hint="Giải thích quy luật chữ số và độ hiếm cho khách hàng">
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="VD: Dãy số tiến liên tục hoặc lặp lại chữ số đại cát, mang lại tài lộc và hanh thông…"
              rows={4}
              className="w-full p-2.5 text-xs border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none text-slate-700 resize-none leading-relaxed transition-colors"
            />
          </FormField>
        </DrawerSection>
      </DrawerBody>

      <DrawerFooter>
        <div className="flex items-center justify-end gap-2 w-full">
          <BtnSecondary type="button" onClick={onClose} disabled={saving}>
            Hủy bỏ
          </BtnSecondary>
          <BtnPrimary type="submit" disabled={saving}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            <span>{isEdit ? "Lưu thay đổi" : "Thêm thể loại"}</span>
          </BtnPrimary>
        </div>
      </DrawerFooter>
    </form>
  );
}

// --- Main Tab ---
export function AdminCategoriesTab() {
  const [categories, setCategories] = useState<SimCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<"name" | "multiplier">("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [toast, setToast] = useState<string | null>(null);
  const [updatedId, setUpdatedId] = useState<string | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editingCat, setEditingCat] = useState<SimCategoryDto | null>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<SimCategoryDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await getCategories());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingCat(null);
    setDrawerMode("create");
    setDrawerOpen(true);
  };

  const openEdit = (c: SimCategoryDto) => {
    setEditingCat(c);
    setDrawerMode("edit");
    setDrawerOpen(true);
  };

  const handleSave = async (payload: CreateCategoryPayload, id?: string) => {
    if (id) {
      const updated = await updateCategory(id, payload);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      showToast(`Đã cập nhật thể loại "${updated.categoryName}" thành công.`);
      setUpdatedId(id);
      setTimeout(() => setUpdatedId(null), 1600);
    } else {
      const created = await createCategory(payload);
      setCategories((prev) => [...prev, created]);
      showToast(`Đã thêm mới thể loại "${created.categoryName}" thành công.`);
      setUpdatedId(created.id);
      setTimeout(() => setUpdatedId(null), 1600);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteCategory(deleteTarget.id);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      showToast(`Đã xóa thể loại "${deleteTarget.categoryName}" thành công.`);
      setDeleteTarget(null);
    } catch (e: any) {
      showToast(`Lỗi: ${e.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = categories.filter(
    (c) =>
      c.categoryName.toLowerCase().includes(search.toLowerCase()) ||
      c.categoryCode.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const left = sortKey === "name" ? a.categoryName : Number(a.valuationMultiplier ?? 0);
    const right = sortKey === "name" ? b.categoryName : Number(b.valuationMultiplier ?? 0);
    const result = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "vi");
    return sortDirection === "asc" ? result : -result;
  });
  const paged = sorted.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);

  const changeSort = (key: "name" | "multiplier") => {
    const next = toggleSort(sortKey, sortDirection, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
    setPageIndex(1);
  };

  return (
    <div className="admin-tab admin-tab-categories space-y-4">
      {/* ── 1. Header Card (Matching Kho SIM) ── */}
      <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-[#001743]">Quản Lý Thể Loại SIM &amp; Mô Hình Định Giá AI</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Cấu hình thế số phong thủy, hệ số định giá nhân bản (AI Score multiplier) và dự báo thanh khoản sàn đấu giá.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs shrink-0"
        >
          <Plus size={15} strokeWidth={1.75} />
          <span>Thêm thể loại</span>
        </button>
      </div>

      {/* ── 2. Filter Toolbar Card (Matching Kho SIM) ── */}
      <div className="bg-white border border-[#e4e7ec] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageIndex(1);
              }}
              placeholder="Tìm theo tên thể loại, mã nhận diện, mô tả…"
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-[#e4e7ec] rounded-lg focus:border-[#001743] focus:outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPageIndex(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="p-1.5 text-[#4B5563] hover:text-[#001743] hover:bg-slate-50 border border-[#e4e7ec] rounded-lg transition-colors bg-white disabled:opacity-50"
            title="Tải lại danh sách"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} strokeWidth={1.75} />
          </button>
        </div>
        <div className="text-xs text-[#6B7280]">
          Hiển thị <strong className="text-[#001743]">{filtered.length}</strong> thể loại trong danh mục
        </div>
      </div>

      {/* ── 3. Table Card (Matching Kho SIM) ── */}
      <div className="bg-white border border-[#e4e7ec] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#e4e7ec] bg-[#F8FAFC] text-slate-500 font-semibold uppercase text-[10px] tracking-wider h-10">
                <th className="py-3 px-4"><AdminSortButton label="Thể loại / Mã thế số" active={sortKey === "name"} direction={sortDirection} onClick={() => changeSort("name")} /></th>
                <th className="py-3 px-4 text-center"><AdminSortButton label="Hệ số định giá AI" align="center" active={sortKey === "multiplier"} direction={sortDirection} onClick={() => changeSort("multiplier")} /></th>
                <th className="py-3 px-4">Quy tắc nhận diện &amp; Mô tả phong thủy</th>
                <th className="py-3 px-4 text-center">Thanh khoản dự báo</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="h-16 animate-pulse">
                    <td className="py-3 px-4">
                      <div className="space-y-1.5">
                        <div className="h-3.5 bg-slate-200 rounded w-32" />
                        <div className="h-2.5 bg-slate-100 rounded w-16" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center"><div className="h-5 bg-slate-100 rounded w-16 mx-auto" /></td>
                    <td className="py-3 px-4"><div className="h-3 bg-slate-100 rounded w-48" /></td>
                    <td className="py-3 px-4 text-center"><div className="h-5 bg-slate-100 rounded w-16 mx-auto" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-7 bg-slate-100 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <AlertTriangle size={28} className="text-amber-500 mx-auto mb-2" />
                    <div className="text-xs font-bold text-slate-800">Không thể tải dữ liệu thể loại</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{error}</p>
                    <button
                      onClick={load}
                      className="mt-3 px-3 py-1.5 bg-[#001743] text-white text-xs font-semibold rounded-[6px]"
                    >
                      Thử lại
                    </button>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Tag size={28} className="text-slate-300 mx-auto mb-2" />
                    <div className="text-xs font-bold text-slate-700">
                      {search ? "Không tìm thấy thể loại phù hợp" : "Chưa có thể loại nào"}
                    </div>
                    {!search && (
                      <button
                        onClick={openCreate}
                        className="mt-3 inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#001743] text-white text-xs font-bold rounded-[6px]"
                      >
                        <Plus size={13} />
                        <span>Thêm thể loại đầu tiên</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paged.map((cat) => {
                  const isUpdated = updatedId === cat.id;

                  return (
                    <tr
                      key={cat.id}
                      onClick={() => openEdit(cat)}
                      className={`transition-colors h-16 cursor-pointer ${
                        isUpdated ? "bg-emerald-50" : "hover:bg-slate-50/80"
                      }`}
                      style={{ transition: isUpdated ? "background-color 1500ms ease-out" : undefined }}
                    >
                      {/* Tên & Mã */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-xs text-[#001743]">{cat.categoryName}</div>
                        <div className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">{cat.categoryCode}</div>
                      </td>

                      {/* Hệ số AI */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-[4px] text-[11px] font-bold tabular-nums">
                          <TrendingUp size={11} strokeWidth={2} />
                          <span>x{cat.valuationMultiplier.toFixed(1)} AI Score</span>
                        </span>
                      </td>

                      {/* Mô tả phong thủy */}
                      <td className="py-3 px-4 max-w-sm">
                        <span className="text-xs text-slate-600 line-clamp-2">
                          {cat.description || <span className="text-slate-400 italic">Chưa có mô tả chi tiết</span>}
                        </span>
                      </td>

                      {/* Thanh khoản dự báo */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {cat.valuationMultiplier >= 3.0 ? "Rất cao (A+)" : "Cao (A)"}
                        </span>
                      </td>

                      {/* THAO TÁC — Direct Icon Buttons */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(cat);
                            }}
                            className="p-1.5 text-[#4B5563] hover:text-[#001743] hover:bg-gray-100 rounded-[6px] transition-colors"
                            title="Chỉnh sửa thể loại"
                          >
                            <Edit3 size={15} strokeWidth={1.5} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(cat);
                            }}
                            className="p-1.5 text-[#4B5563] hover:text-rose-600 hover:bg-rose-50 rounded-[6px] transition-colors"
                            title="Xóa thể loại"
                          >
                            <Trash2 size={15} strokeWidth={1.5} />
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

        {/* ── Standard Pagination Bar ── */}
        <Pagination
          pageIndex={pageIndex}
          pageSize={pageSize}
          totalCount={filtered.length}
          onPageChange={(page) => setPageIndex(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageIndex(1);
          }}
          loading={loading}
        />
      </div>

      {/* ── 4. RightDrawer (Create / Edit) ── */}
      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerMode === "edit" ? "Chỉnh sửa thể loại SIM" : "Thêm thể loại mới"}
        badge={editingCat?.categoryCode || "MỚI"}
        badgeCls="bg-slate-100 text-slate-700 font-mono"
        size="md"
      >
        <CategoryForm
          key={editingCat?.id || "create"}
          initial={editingCat}
          onSave={handleSave}
          onClose={() => setDrawerOpen(false)}
        />
      </RightDrawer>

      {/* ── 5. Delete Safeguard Modal ── */}
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.categoryName}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      {/* ── 6. Toast Feedback ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#001743] text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-fade-up">
          <Check size={16} className="text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
