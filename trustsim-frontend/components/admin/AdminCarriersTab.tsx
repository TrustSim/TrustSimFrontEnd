"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  X,
  Check,
  Loader2,
  RefreshCw,
  Signal,
  Search,
  Hash,
  CheckCircle2,
} from "lucide-react";
import {
  getCarriers,
  createCarrier,
  updateCarrier,
  deleteCarrier,
  getPrefixes,
  createPrefix,
  deletePrefix,
  type SimCarrierDto,
  type CreateCarrierPayload,
  type PhonePrefixDto,
} from "@/services/carrierService";
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

// --- Brand color map ---
const BRAND_COLORS: Record<string, string> = {
  viettel: "#E4011E",
  mobifone: "#005BAA",
  vinaphone: "#00A3E0",
  vietnamobile: "#FF6600",
  wintel: "#6B21A8",
  itelecom: "#E4011E",
  reddi: "#E4011E",
};

function brandColor(name: string) {
  const n = name.toLowerCase();
  for (const [key, color] of Object.entries(BRAND_COLORS)) {
    if (n.includes(key)) return color;
  }
  return "#001743";
}

// --- Avatar / Logo ---
function CarrierAvatar({ name, logo, size = 9 }: { name: string; logo?: string; size?: number }) {
  const color = brandColor(name);
  if (logo && logo.trim() !== "") {
    return (
      <img
        src={logo}
        alt={name}
        className={`w-${size} h-${size} rounded-full object-contain border border-slate-200 bg-white p-1 shrink-0`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs`}
      style={{ backgroundColor: color }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// --- Delete Modal ---
function DeleteModal({
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-fade-in">
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] shadow-xl p-5 w-full max-w-sm animate-fade-up">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0">
            <AlertTriangle size={18} strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#001743]">{title}</h3>
            <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-3.5 py-1.5 border border-[#D1D5DB] text-xs font-semibold text-[#4B5563] rounded-[6px] hover:bg-slate-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-[6px] transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            <span>Xác nhận xóa</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Carrier Form (used inside RightDrawer) ---
function CarrierForm({
  initial,
  carrierPrefixes = [],
  onSave,
  onAddPrefix,
  onDeletePrefix,
  onClose,
}: {
  initial?: SimCarrierDto | null;
  carrierPrefixes?: PhonePrefixDto[];
  onSave: (p: CreateCarrierPayload, id?: string) => Promise<void>;
  onAddPrefix: (carrierId: string, prefixValue: string) => Promise<void>;
  onDeletePrefix: (prefixId: string) => Promise<void>;
  onClose: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<CreateCarrierPayload>({
    carrierName: initial?.carrierName ?? "",
    carrierCode: initial?.carrierCode ?? "",
    logoImg: initial?.logoImg ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateCarrierPayload, string>>>({});
  const [saving, setSaving] = useState(false);

  // Mini state for adding prefix
  const [inputPrefix, setInputPrefix] = useState("");
  const [prefixAdding, setPrefixAdding] = useState(false);
  const [prefixError, setPrefixError] = useState<string | null>(null);

  // Mini state for deleting prefix
  const [deletePrefixTarget, setDeletePrefixTarget] = useState<PhonePrefixDto | null>(null);
  const [prefixDeleting, setPrefixDeleting] = useState(false);

  const set = (k: keyof CreateCarrierPayload, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.carrierName.trim()) e.carrierName = "Tên nhà mạng không được để trống.";
    if (!form.carrierCode.trim()) e.carrierCode = "Mã viết tắt không được để trống.";
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

  const handleAddPrefixSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initial) return;
    const clean = inputPrefix.trim().replace(/\D/g, "");
    if (!clean || clean.length < 2 || clean.length > 5) {
      setPrefixError("Đầu số không hợp lệ (2 - 5 số, ví dụ 098, 086)");
      return;
    }
    // Check if already exists in this carrier
    if (carrierPrefixes.some((p) => p.prefixValue === clean)) {
      setPrefixError(`Đầu số ${clean} đã tồn tại trong nhà mạng này`);
      return;
    }

    setPrefixError(null);
    setPrefixAdding(true);
    try {
      await onAddPrefix(initial.id, clean);
      setInputPrefix("");
    } catch (err: any) {
      setPrefixError(err.message || "Thêm đầu số thất bại");
    } finally {
      setPrefixAdding(false);
    }
  };

  const handleConfirmDeletePrefix = async () => {
    if (!deletePrefixTarget) return;
    setPrefixDeleting(true);
    try {
      await onDeletePrefix(deletePrefixTarget.id);
      setDeletePrefixTarget(null);
    } finally {
      setPrefixDeleting(false);
    }
  };

  const color = brandColor(form.carrierName || "viettel");

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <form id="carrier-drawer-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <DrawerBody>
          {/* Live Graphic Preview */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center gap-3.5 shadow-2xs">
            <CarrierAvatar name={form.carrierName || "SIM"} logo={form.logoImg} size={11} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#001743] truncate">
                {form.carrierName || "Tên nhà mạng viễn thông"}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border"
                  style={{ color, backgroundColor: `${color}14`, borderColor: `${color}30` }}
                >
                  {form.carrierCode || "CODE"}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {carrierPrefixes.length > 0
                    ? `${carrierPrefixes.length} đầu số đăng ký`
                    : "Chưa có đầu số"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Thông tin nhận diện */}
          <DrawerSection title="Thông tin nhận diện nhà mạng" subtitle="Tên thương mại và mã giao dịch hệ thống">
            <FormField label="Tên nhà mạng" required error={errors.carrierName} hint="VD: Viettel, MobiFone, VinaPhone, Vietnamobile, Wintel">
              <input
                type="text"
                value={form.carrierName}
                onChange={(e) => set("carrierName", e.target.value)}
                placeholder="VD: Viettel Telecom"
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none font-semibold text-[#001743]"
              />
            </FormField>

            <FormField label="Mã viết tắt (Carrier Code)" required error={errors.carrierCode} hint="Viết hoa, tối đa 10 ký tự. VD: VTL, MBF, VNP">
              <input
                type="text"
                value={form.carrierCode}
                maxLength={10}
                onChange={(e) => set("carrierCode", e.target.value.toUpperCase())}
                placeholder="VD: VTL"
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none font-mono font-bold uppercase text-[#001743]"
              />
            </FormField>
          </DrawerSection>

          {/* Section 2: Logo & Thương hiệu */}
          <DrawerSection title="Thương hiệu & Hình ảnh" subtitle="Đường dẫn logo SVG/PNG sắc nét hiển thị trên sàn">
            <FormField label="URL Logo" hint="Đường dẫn logo chính thức (CDN/Cloudinary/S3). Để trống nếu dùng huy hiệu tự động.">
              <input
                type="text"
                value={form.logoImg}
                onChange={(e) => set("logoImg", e.target.value)}
                placeholder="https://assets.trustsim.vn/carriers/..."
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none text-slate-700"
              />
            </FormField>
          </DrawerSection>

          {/* Section 3: QUẢN LÝ DẢI ĐẦU SỐ (Chỉ khả dụng khi sửa hoặc có ID) */}
          {isEdit && initial && (
            <DrawerSection
              title="Dải đầu số trực thuộc (Phone Prefixes)"
              subtitle={`Quản lý toàn bộ các đầu số đã đăng ký cho nhà mạng ${initial.carrierName}`}
            >
              {/* Danh sách các đầu số hiện có */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#001743] flex items-center gap-1.5">
                    <Hash size={14} className="text-slate-400" />
                    <span>Đầu số đang liên kết ({carrierPrefixes.length})</span>
                  </span>
                </div>

                {carrierPrefixes.length === 0 ? (
                  <div className="p-4 border border-dashed border-slate-200 rounded-lg text-center bg-slate-50/50">
                    <p className="text-xs text-slate-400">Nhà mạng này chưa có đầu số nào được gán trong database.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg">
                    {carrierPrefixes.map((pref) => (
                      <div
                        key={pref.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-[5px] text-xs font-mono font-bold shadow-2xs group hover:border-slate-300 transition-colors"
                      >
                        <span className="text-[#001743]">{pref.prefixValue}</span>
                        <button
                          type="button"
                          onClick={() => setDeletePrefixTarget(pref)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                          title={`Xóa đầu số ${pref.prefixValue}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form thêm đầu số mới */}
                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={inputPrefix}
                        maxLength={5}
                        onChange={(e) => {
                          setInputPrefix(e.target.value);
                          setPrefixError(null);
                        }}
                        placeholder="Nhập đầu số mới (VD: 098, 086)"
                        className="w-full text-xs p-2 border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none font-mono font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPrefixSubmit}
                      disabled={prefixAdding || !inputPrefix.trim()}
                      className="flex items-center gap-1 px-3 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[6px] transition-colors disabled:opacity-50 shrink-0"
                    >
                      {prefixAdding ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Plus size={13} strokeWidth={2} />
                      )}
                      <span>Thêm đầu số</span>
                    </button>
                  </div>
                  {prefixError && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{prefixError}</p>
                  )}
                </div>
              </div>
            </DrawerSection>
          )}
        </DrawerBody>

        <DrawerFooter>
          <div className="flex items-center justify-end gap-2 w-full">
            <BtnSecondary type="button" onClick={onClose} disabled={saving}>
              Hủy bỏ
            </BtnSecondary>
            <BtnPrimary type="submit" disabled={saving}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              <span>{isEdit ? "Lưu thay đổi" : "Thêm nhà mạng"}</span>
            </BtnPrimary>
          </div>
        </DrawerFooter>
      </form>

      {/* Modal xác nhận xóa đầu số */}
      {deletePrefixTarget && (
        <DeleteModal
          title="Xác nhận xóa đầu số"
          message={
            <>
              Bạn có chắc chắn muốn xóa đầu số{" "}
              <strong className="font-mono text-slate-800">
                "{deletePrefixTarget.prefixValue}"
              </strong>{" "}
              khỏi nhà mạng{" "}
              <strong className="text-[#001743]">
                {initial?.carrierName}
              </strong>
              ? Hành động này có thể ảnh hưởng đến các SIM đang thuộc đầu số này.
            </>
          }
          onConfirm={handleConfirmDeletePrefix}
          onCancel={() => setDeletePrefixTarget(null)}
          loading={prefixDeleting}
        />
      )}
    </div>
  );
}

// --- Main Tab ---
export function AdminCarriersTab() {
  const [carriers, setCarriers] = useState<SimCarrierDto[]>([]);
  const [prefixes, setPrefixes] = useState<PhonePrefixDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toast, setToast] = useState<string | null>(null);
  const [updatedId, setUpdatedId] = useState<string | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editingCarrier, setEditingCarrier] = useState<SimCarrierDto | null>(null);

  // Delete carrier modal
  const [deleteTarget, setDeleteTarget] = useState<SimCarrierDto | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [carriersData, prefixesData] = await Promise.all([
        getCarriers(),
        getPrefixes(),
      ]);
      setCarriers(carriersData);
      setPrefixes(prefixesData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Group prefixes by simCarrierId
  const prefixesByCarrier = useMemo(() => {
    const map: Record<string, PhonePrefixDto[]> = {};
    for (const pref of prefixes) {
      if (!map[pref.simCarrierId]) {
        map[pref.simCarrierId] = [];
      }
      map[pref.simCarrierId].push(pref);
    }
    return map;
  }, [prefixes]);

  const openCreate = () => {
    setEditingCarrier(null);
    setDrawerMode("create");
    setDrawerOpen(true);
  };

  const openEdit = (c: SimCarrierDto) => {
    setEditingCarrier(c);
    setDrawerMode("edit");
    setDrawerOpen(true);
  };

  const handleSave = async (payload: CreateCarrierPayload, id?: string) => {
    if (id) {
      const updated = await updateCarrier(id, payload);
      setCarriers((prev) => prev.map((c) => (c.id === id ? updated : c)));
      showToast(`Đã cập nhật nhà mạng "${updated.carrierName}" thành công.`);
      setUpdatedId(id);
      setTimeout(() => setUpdatedId(null), 1600);
    } else {
      const created = await createCarrier(payload);
      setCarriers((prev) => [...prev, created]);
      showToast(`Đã thêm mới nhà mạng "${created.carrierName}" thành công.`);
      setUpdatedId(created.id);
      setTimeout(() => setUpdatedId(null), 1600);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteCarrier(deleteTarget.id);
      setCarriers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      showToast(`Đã xóa nhà mạng "${deleteTarget.carrierName}" thành công.`);
      setDeleteTarget(null);
    } catch (e: any) {
      showToast(`Lỗi: ${e.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Prefix handlers
  const handleAddPrefix = async (carrierId: string, prefixValue: string) => {
    const newPrefix = await createPrefix({
      simCarrierId: carrierId,
      prefixValue,
    });
    setPrefixes((prev) => [...prev, newPrefix]);
    showToast(`Đã thêm đầu số "${prefixValue}" thành công!`);
  };

  const handleDeletePrefix = async (prefixId: string) => {
    await deletePrefix(prefixId);
    setPrefixes((prev) => prev.filter((p) => p.id !== prefixId));
    showToast("Đã xóa đầu số thành công!");
  };

  const filtered = carriers.filter((c) => {
    const matchName =
      c.carrierName.toLowerCase().includes(search.toLowerCase()) ||
      c.carrierCode.toLowerCase().includes(search.toLowerCase());
    const carrierPrefs = prefixesByCarrier[c.id] || [];
    const matchPrefix = carrierPrefs.some((p) => p.prefixValue.includes(search));
    return matchName || matchPrefix;
  });

  const paged = filtered.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);

  return (
    <div className="space-y-4">
      {/* ── 1. Header Card (Matching Kho SIM) ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-[#001743]">Quản Lý Nhà Mạng &amp; Dải Đầu Số</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
              {carriers.length} nhà mạng • {prefixes.length} đầu số
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Danh mục nhà mạng viễn thông tại Việt Nam, quản lý dải đầu số (098, 090, 088...) đồng bộ cơ sở dữ liệu.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[6px] transition-colors shadow-xs shrink-0"
        >
          <Plus size={15} strokeWidth={1.75} />
          <span>Thêm nhà mạng</span>
        </button>
      </div>

      {/* ── 2. Filter Toolbar Card ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
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
              placeholder="Tìm theo tên nhà mạng, mã hoặc đầu số..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-[#D1D5DB] rounded-[6px] focus:border-[#001743] focus:outline-none"
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
            className="p-1.5 text-[#4B5563] hover:text-[#001743] hover:bg-slate-100 border border-[#D1D5DB] rounded-[6px] transition-colors bg-white disabled:opacity-50"
            title="Tải lại danh sách"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} strokeWidth={1.75} />
          </button>
        </div>
        <div className="text-xs text-[#6B7280]">
          Hiển thị <strong className="text-[#001743]">{filtered.length}</strong> nhà mạng
        </div>
      </div>

      {/* ── 3. Table Card ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-slate-500 font-semibold uppercase text-[10px] tracking-wider h-10">
                <th className="py-3 px-4">Nhà mạng</th>
                <th className="py-3 px-4">Mã viết tắt</th>
                <th className="py-3 px-4">Logo &amp; Thương hiệu</th>
                <th className="py-3 px-4">Dải đầu số liên kết ({prefixes.length})</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="h-16 animate-pulse">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 bg-slate-200 rounded w-28" />
                          <div className="h-2.5 bg-slate-100 rounded w-16" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><div className="h-5 bg-slate-100 rounded-full w-14" /></td>
                    <td className="py-3 px-4"><div className="h-3 bg-slate-100 rounded w-32" /></td>
                    <td className="py-3 px-4"><div className="h-3 bg-slate-100 rounded w-36" /></td>
                    <td className="py-3 px-4 text-center"><div className="h-5 bg-slate-100 rounded w-16 mx-auto" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-7 bg-slate-100 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <AlertTriangle size={28} className="text-amber-500 mx-auto mb-2" />
                    <div className="text-xs font-bold text-slate-800">Không thể tải dữ liệu nhà mạng</div>
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
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Signal size={28} className="text-slate-300 mx-auto mb-2" />
                    <div className="text-xs font-bold text-slate-700">
                      {search ? "Không tìm thấy nhà mạng phù hợp" : "Chưa có nhà mạng nào"}
                    </div>
                    {!search && (
                      <button
                        onClick={openCreate}
                        className="mt-3 inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#001743] text-white text-xs font-bold rounded-[6px]"
                      >
                        <Plus size={13} />
                        <span>Thêm nhà mạng đầu tiên</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paged.map((carrier) => {
                  const color = brandColor(carrier.carrierName);
                  const isUpdated = updatedId === carrier.id;
                  const carrierPrefixes = prefixesByCarrier[carrier.id] || [];

                  return (
                    <tr
                      key={carrier.id}
                      onClick={() => openEdit(carrier)}
                      className={`transition-colors h-16 cursor-pointer ${
                        isUpdated ? "bg-emerald-50" : "hover:bg-slate-50/80"
                      }`}
                      style={{ transition: isUpdated ? "background-color 1500ms ease-out" : undefined }}
                    >
                      {/* Nhà mạng & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <CarrierAvatar name={carrier.carrierName} logo={carrier.logoImg || undefined} />
                          <div>
                            <div className="font-bold text-xs text-[#001743]">{carrier.carrierName}</div>
                            <div className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">{carrier.carrierCode}</div>
                          </div>
                        </div>
                      </td>

                      {/* Mã viết tắt */}
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-[4px] text-[10px] font-mono font-bold border"
                          style={{ color, backgroundColor: `${color}12`, borderColor: `${color}28` }}
                        >
                          {carrier.carrierCode}
                        </span>
                      </td>

                      {/* Logo / Nhận diện */}
                      <td className="py-3 px-4">
                        {carrier.logoImg ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={carrier.logoImg}
                              alt={carrier.carrierName}
                              className="h-5 object-contain max-w-[70px]"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <span className="text-[11px] text-slate-500 font-mono">Đã xác thực</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Huy hiệu mặc định</span>
                        )}
                      </td>

                      {/* Dải đầu số thực tế từ DB */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap items-center gap-1.5 max-w-sm">
                          {carrierPrefixes.length === 0 ? (
                            <button
                              type="button"
                              onClick={() => openEdit(carrier)}
                              className="inline-flex items-center gap-1 text-[11px] text-amber-600 hover:text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
                            >
                              <Plus size={11} />
                              <span>Thêm đầu số</span>
                            </button>
                          ) : (
                            <>
                              {carrierPrefixes.slice(0, 6).map((p) => (
                                <span
                                  key={p.id}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[#001743] font-mono text-[11px] font-semibold"
                                >
                                  {p.prefixValue}
                                </span>
                              ))}
                              {carrierPrefixes.length > 6 && (
                                <button
                                  type="button"
                                  onClick={() => openEdit(carrier)}
                                  className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded hover:bg-blue-100 transition-colors"
                                >
                                  +{carrierPrefixes.length - 6}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openEdit(carrier)}
                                className="p-0.5 text-slate-400 hover:text-[#001743] hover:bg-slate-100 rounded transition-colors"
                                title="Quản lý đầu số"
                              >
                                <Plus size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Hoạt động
                        </span>
                      </td>

                      {/* THAO TÁC — Direct Icon Buttons */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(carrier);
                            }}
                            className="p-1.5 text-[#4B5563] hover:text-[#001743] hover:bg-gray-100 rounded-[6px] transition-colors"
                            title="Chỉnh sửa &amp; Quản lý đầu số"
                          >
                            <Edit3 size={15} strokeWidth={1.5} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(carrier);
                            }}
                            className="p-1.5 text-[#4B5563] hover:text-rose-600 hover:bg-rose-50 rounded-[6px] transition-colors"
                            title="Xóa nhà mạng"
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

        {/* Chân bảng: Phân trang chuẩn Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="border-t border-[#E2E8F0]">
            <Pagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              totalCount={filtered.length}
              onPageChange={setPageIndex}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPageIndex(1);
              }}
            />
          </div>
        )}
      </div>

      {/* ── 4. RightDrawer: Thêm / Sửa Nhà mạng & Quản lý Đầu số ── */}
      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerMode === "edit" ? "Chỉnh sửa nhà mạng & Dải đầu số" : "Thêm nhà mạng mới"}
        badge={editingCarrier?.carrierCode || "MỚI"}
        size="md"
      >
        <CarrierForm
          initial={editingCarrier}
          carrierPrefixes={editingCarrier ? prefixesByCarrier[editingCarrier.id] || [] : []}
          onSave={handleSave}
          onAddPrefix={handleAddPrefix}
          onDeletePrefix={handleDeletePrefix}
          onClose={() => setDrawerOpen(false)}
        />
      </RightDrawer>

      {/* ── 5. Modal xác nhận xóa nhà mạng ── */}
      {deleteTarget && (
        <DeleteModal
          title="Xác nhận xóa nhà mạng"
          message={
            <>
              Bạn có chắc chắn muốn xóa nhà mạng{" "}
              <span className="font-bold text-slate-800">
                "{deleteTarget.carrierName}"
              </span>
              ? Hành động này sẽ tác động tới các SIM và dải đầu số liên kết.
            </>
          }
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      {/* ── 6. Toast thông báo nổi ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#001743] text-white px-4 py-3 rounded-[8px] shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-fade-up">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
