"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Smartphone,
  Search,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Eye,
  SlidersHorizontal,
  FolderTree,
  Tag,
  User,
  HelpCircle,
  Radio,
  Check,
  X,
  Sparkles,
  ChevronDown,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import ImportExportBar from "@/components/admin/ImportExportBar";
import { ExcelColumnDef } from "@/services/excelService";
import {
  getAdminSims,
  createAdminSim,
  updateAdminSim,
  deleteAdminSim,
  importAdminSims,
  getFormatRhythms,
  formatPhoneNumber,
  getSimStatusLabel,
  getCarrierColor,
  type AdminSimItemDto,
  type SimStatus,
  type FormatRhythmItemDto,
} from "@/services/simService";
import { getCarriers, type SimCarrierDto, type PhonePrefixDto } from "@/services/carrierService";
import { getCategories, type SimCategoryDto } from "@/services/categoryService";
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
import { PhysicalSimCard } from "@/components/ui/PhysicalSimCard";

// --- Excel Export Columns ---
const SIM_EXPORT_COLUMNS: ExcelColumnDef<AdminSimItemDto>[] = [
  { header: "Mã SIM", key: "id", width: 14 },
  { header: "Số điện thoại", key: "phoneNumber", width: 16, formatter: (v) => formatPhoneNumber(String(v)) },
  { header: "Nhà mạng", key: "carrierName", width: 14 },
  { header: "Đầu số", key: "prefixValue", width: 10 },
  { header: "Định dạng", key: "formatRhythmName", width: 16 },
  { header: "Danh mục", key: "categoryNames", width: 22, formatter: (v) => Array.isArray(v) ? v.join(", ") : String(v || "") },
  { header: "Chủ sở hữu", key: "ownerFullName", width: 18, formatter: (v) => String(v || "Kho sàn TrustSim") },
  { header: "SĐT Chủ sở hữu", key: "ownerPhoneNumber", width: 16 },
  { header: "Trạng thái", key: "simStatus", width: 16, formatter: (v) => getSimStatusLabel(v as SimStatus) },
  { header: "Ngày tạo", key: "createdDate", width: 16, formatter: (v) => new Date(String(v)).toLocaleDateString("vi-VN") },
];

export function AdminSimsTab() {
  // State: Data
  const [sims, setSims] = useState<AdminSimItemDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Master Data
  const [carriers, setCarriers] = useState<SimCarrierDto[]>([]);
  const [categories, setCategories] = useState<SimCategoryDto[]>([]);
  const [rhythms, setRhythms] = useState<FormatRhythmItemDto[]>([]);

  // Pagination & Filtering
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Category Multi-Select Dropdown State
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Sorting
  const [sortKey, setSortKey] = useState<"phone" | "status" | "category" | "categoryCount" | "carrier" | "created">("phone");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // UI Selection
  const [selectedSimIds, setSelectedSimIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Drawer (View / Edit)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"view" | "edit">("view");
  const [activeSim, setActiveSim] = useState<AdminSimItemDto | null>(null);

  // Modal (Create)
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Modal (Delete)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [simToDelete, setSimToDelete] = useState<AdminSimItemDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form states for Create / Edit
  const [formPhone, setFormPhone] = useState("");
  const [formCarrierId, setFormCarrierId] = useState("");
  const [formPrefixId, setFormPrefixId] = useState("");
  const [formRhythmId, setFormRhythmId] = useState("");
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<SimStatus>("AVAILABLE");
  const [submitting, setSubmitting] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Master Data (Carriers, Categories, Rhythms)
  useEffect(() => {
    async function loadMasterData() {
      try {
        const [cList, catList, rList] = await Promise.all([
          getCarriers(),
          getCategories(),
          getFormatRhythms(),
        ]);
        setCarriers(cList);
        setCategories(catList);
        setRhythms(rList);
      } catch (err) {
        console.error("Lỗi tải danh mục hệ thống:", err);
      }
    }
    loadMasterData();
  }, []);

  // Close category dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch SIM list from database
  const fetchSims = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminSims({
        pageIndex,
        pageSize,
        status: (selectedStatus as SimStatus) || undefined,
        carrierId: selectedCarrier || undefined,
        categoryId: selectedCategories.length === 1 ? selectedCategories[0] : undefined,
        search: search.trim() || undefined,
      });
      setSims(res.items);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      console.error("Lỗi nạp danh sách SIM:", err);
      showToast(err.message || "Không thể tải danh sách số SIM.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pageIndex, pageSize, selectedStatus, selectedCarrier, selectedCategories, search]);

  useEffect(() => {
    fetchSims();
  }, [fetchSims]);

  // Derived available prefixes based on selected carrier in form
  const availablePrefixes = useMemo(() => {
    if (!formCarrierId) return [];
    const carrier = carriers.find((c) => c.id === formCarrierId);
    return carrier?.prefixes || [];
  }, [formCarrierId, carriers]);

  // Total pages
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Filter SIMs locally if multi-categories selected
  const filteredSims = useMemo(() => {
    if (selectedCategories.length <= 1) return sims;

    const selectedCatNames = categories
      .filter((c) => selectedCategories.includes(c.id))
      .map((c) => c.categoryName.toLowerCase());

    return sims.filter((s) => {
      if (!s.categoryNames || s.categoryNames.length === 0) return false;
      return s.categoryNames.some((catName) =>
        selectedCatNames.some((sn) => catName.toLowerCase().includes(sn) || sn.includes(catName.toLowerCase()))
      );
    });
  }, [sims, selectedCategories, categories]);

  // Sort SIMs
  const displaySims = useMemo(() => {
    return [...filteredSims].sort((a, b) => {
      let result = 0;
      if (sortKey === "phone") {
        result = String(a.phoneNumber).localeCompare(String(b.phoneNumber), "vi");
      } else if (sortKey === "status") {
        result = String(a.simStatus).localeCompare(String(b.simStatus), "vi");
      } else if (sortKey === "category") {
        // Sort by primary category (A-Z)
        const catA = (a.categoryNames && a.categoryNames[0]) || "";
        const catB = (b.categoryNames && b.categoryNames[0]) || "";
        result = catA.localeCompare(catB, "vi");
        if (result === 0) {
          result = (b.categoryNames?.length || 0) - (a.categoryNames?.length || 0);
        }
      } else if (sortKey === "categoryCount") {
        // Sort by number of attached categories
        result = (a.categoryNames?.length || 0) - (b.categoryNames?.length || 0);
      } else if (sortKey === "carrier") {
        result = String(a.carrierName).localeCompare(String(b.carrierName), "vi");
      } else if (sortKey === "created") {
        const timeA = new Date(a.createdDate || 0).getTime();
        const timeB = new Date(b.createdDate || 0).getTime();
        result = timeA - timeB;
      }
      return sortDirection === "asc" ? result : -result;
    });
  }, [filteredSims, sortKey, sortDirection]);

  const changeSort = (key: "phone" | "status" | "category" | "categoryCount" | "carrier" | "created") => {
    const next = toggleSort(sortKey, sortDirection, key);
    setSortKey(next.key as any);
    setSortDirection(next.direction);
  };

  // KPIs
  const kpiAvailable = useMemo(() => sims.filter((s) => s.simStatus === "AVAILABLE").length, [sims]);
  const kpiAuction = useMemo(() => sims.filter((s) => s.simStatus === "IN_AUCTION").length, [sims]);
  const kpiTransfered = useMemo(() => sims.filter((s) => s.simStatus === "TRANFERED").length, [sims]);

  // Open Drawer for Viewing or Editing
  const handleOpenDrawer = (sim: AdminSimItemDto, mode: "view" | "edit" = "view") => {
    setActiveSim(sim);
    setDrawerMode(mode);

    // Find carrier id by name or prefix
    const matchedCarrier = carriers.find(
      (c) => c.carrierName.toLowerCase() === sim.carrierName.toLowerCase()
    );
    setFormPhone(sim.phoneNumber);
    setFormCarrierId(matchedCarrier?.id || "");
    const matchedPrefix = matchedCarrier?.prefixes?.find(
      (p) => p.prefixValue === sim.prefixValue
    );
    setFormPrefixId(matchedPrefix?.id || "");

    const matchedRhythm = rhythms.find((r) => r.formatRhythmName === sim.formatRhythmName);
    setFormRhythmId(matchedRhythm?.id || "");

    const matchedCatIds = categories
      .filter((cat) => sim.categoryNames?.includes(cat.categoryName))
      .map((cat) => cat.id);
    setFormCategoryIds(matchedCatIds);
    setFormStatus(sim.simStatus);

    setDrawerOpen(true);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormPhone("");
    setFormCarrierId(carriers[0]?.id || "");
    setFormPrefixId(carriers[0]?.prefixes?.[0]?.id || "");
    setFormRhythmId(rhythms[0]?.id || "");
    setFormCategoryIds([]);
    setFormStatus("AVAILABLE");
    setCreateModalOpen(true);
  };

  // Handle Create SIM Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = formPhone.replace(/\D/g, "");
    if (cleanPhone.length < 9 || cleanPhone.length > 11) {
      showToast("Số điện thoại phải chứa từ 9 đến 11 chữ số.", "error");
      return;
    }
    if (!formPrefixId) {
      showToast("Vui lòng chọn đầu số nhà mạng hợp lệ.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await createAdminSim({
        phoneNumber: cleanPhone,
        phonePrefixId: formPrefixId,
        formatRhythmId: formRhythmId || undefined,
        categoryIds: formCategoryIds.length > 0 ? formCategoryIds : undefined,
      });
      showToast(`Đã thêm mới SIM ${cleanPhone} vào kho thành công!`);
      setCreateModalOpen(false);
      fetchSims();
    } catch (err: any) {
      showToast(err.message || "Tạo SIM thất bại.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit SIM Submit
  const handleEditSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeSim) return;
    if (!formPrefixId) {
      showToast("Vui lòng chọn đầu số nhà mạng hợp lệ.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await updateAdminSim(activeSim.id, {
        simStatus: formStatus,
        phonePrefixId: formPrefixId,
        formatRhythmId: formRhythmId || undefined,
        categoryIds: formCategoryIds,
      });
      showToast(`Đã cập nhật thông tin SIM ${activeSim.phoneNumber} thành công!`);
      setDrawerOpen(false);
      fetchSims();
    } catch (err: any) {
      showToast(err.message || "Cập nhật thất bại.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!simToDelete) return;
    setDeleting(true);
    try {
      await deleteAdminSim(simToDelete.id);
      showToast(`Đã xóa số SIM ${simToDelete.phoneNumber} khỏi hệ thống.`);
      setDeleteModalOpen(false);
      setSimToDelete(null);
      fetchSims();
    } catch (err: any) {
      showToast(err.message || "Xóa SIM thất bại.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Toggle category checkbox selection
  const handleToggleCategory = (catId: string) => {
    setFormCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Selection checkboxes
  const handleToggleSelectAll = () => {
    if (selectedSimIds.length === sims.length) {
      setSelectedSimIds([]);
    } else {
      setSelectedSimIds(sims.map((s) => s.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedSimIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="admin-tab admin-tab-sims space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 border animate-fade-in ${
            toastMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ── 1. Header Card (Matching Carriers & Categories) ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-[#001743]">Quản Lý Kho SIM Số Đẹp</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
              {totalCount} số SIM
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Quản lý tập trung toàn bộ SIM số đẹp, thông tin nhà mạng, đầu số, phân loại và trạng thái giao dịch.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <ImportExportBar
            data={sims}
            columns={SIM_EXPORT_COLUMNS}
            filename={`TrustSim_KhoSIM_${new Date().toISOString().slice(0, 10)}`}
            entityName="SIM"
            onImport={async (rows) => {
              showToast(`Đang xử lý ${rows.length} bản ghi nhập từ tệp...`);
              fetchSims();
            }}
          />
          <button
            onClick={() => {
              setRefreshing(true);
              fetchSims();
            }}
            disabled={refreshing || loading}
            title="Làm mới dữ liệu"
            className="p-1.5 text-[#4B5563] hover:text-[#001743] hover:bg-slate-100 border border-[#D1D5DB] rounded-[6px] transition-colors bg-white disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin text-[#001743]" : ""} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[6px] transition-colors shadow-xs shrink-0"
          >
            <Plus size={15} strokeWidth={1.75} />
            <span>Thêm SIM mới</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Tổng số SIM</span>
            <div className="text-xl lg:text-2xl font-bold text-[#001743] tabular-nums mt-1">{totalCount}</div>
            <span className="text-[11px] text-slate-400">Toàn bộ kho số sàn</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 text-[#001743] border border-slate-100">
            <Smartphone size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">Sẵn sàng bán</span>
            <div className="text-xl lg:text-2xl font-bold text-emerald-700 tabular-nums mt-1">{kpiAvailable}</div>
            <span className="text-[11px] text-slate-400">Đang niêm yết trong trang</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-amber-600 uppercase tracking-wider">Đang đấu giá</span>
            <div className="text-xl lg:text-2xl font-bold text-amber-700 tabular-nums mt-1">{kpiAuction}</div>
            <span className="text-[11px] text-slate-400">Phiên live thời gian thực</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            <Radio size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-blue-600 uppercase tracking-wider">Đã chuyển nhượng</span>
            <div className="text-xl lg:text-2xl font-bold text-blue-700 tabular-nums mt-1">{kpiTransfered}</div>
            <span className="text-[11px] text-slate-400">Bàn giao hợp đồng xong</span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Tag size={20} />
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[300px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo số SIM (ví dụ 0988, 8888)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageIndex(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#001743] focus:outline-none transition-colors"
            />
          </div>

          {/* Carrier Select */}
          <select
            value={selectedCarrier}
            onChange={(e) => {
              setSelectedCarrier(e.target.value);
              setPageIndex(1);
            }}
            className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#001743] focus:outline-none text-slate-700"
          >
            <option value="">Tất cả nhà mạng</option>
            {carriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.carrierName} ({c.carrierCode})
              </option>
            ))}
          </select>

          {/* Category Multi-Select Dropdown with Search & Quick Sorting */}
          <div className="relative" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className={`text-xs py-1.5 px-3 bg-slate-50 border rounded-lg hover:bg-white focus:outline-none transition-all flex items-center gap-2 ${
                selectedCategories.length > 0
                  ? "border-[#001743] bg-blue-50/50 text-[#001743] font-semibold ring-1 ring-[#001743]/10"
                  : "border-slate-200 text-slate-700"
              }`}
            >
              <Tag size={13} className={selectedCategories.length > 0 ? "text-[#001743]" : "text-slate-400"} />
              <span className="max-w-[150px] truncate">
                {selectedCategories.length === 0
                  ? "Tất cả thể loại"
                  : selectedCategories.length === 1
                  ? categories.find((c) => c.id === selectedCategories[0])?.categoryName || "1 thể loại"
                  : `${selectedCategories.length} thể loại đã chọn`}
              </span>
              {selectedCategories.length > 1 && (
                <span className="w-4 h-4 rounded-full bg-[#001743] text-white text-[9px] flex items-center justify-center font-bold">
                  {selectedCategories.length}
                </span>
              )}
              <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${categoryDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu Popup */}
            {categoryDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2.5 animate-in fade-in zoom-in-95 duration-100">
                {/* Search in Dropdown */}
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm thể loại SIM..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-[#001743] focus:outline-none"
                    autoFocus
                  />
                  {categorySearch && (
                    <button
                      onClick={() => setCategorySearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Quick actions & stats */}
                <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-100 text-[11px]">
                  <span className="text-slate-500 font-medium">
                    Đã chọn: <strong className="text-[#001743]">{selectedCategories.length}</strong>/{categories.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategories(categories.map((c) => c.id));
                        setPageIndex(1);
                      }}
                      className="text-[11px] text-[#001743] hover:underline font-semibold"
                    >
                      Chọn tất cả
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategories([]);
                        setPageIndex(1);
                      }}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                {/* Category List */}
                <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
                  {categories
                    .filter((c) =>
                      c.categoryName.toLowerCase().includes(categorySearch.toLowerCase())
                    )
                    .map((cat) => {
                      const isChecked = selectedCategories.includes(cat.id);
                      return (
                        <label
                          key={cat.id}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                            isChecked
                              ? "bg-blue-50/70 text-[#001743] font-medium"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedCategories((prev) =>
                                  isChecked
                                    ? prev.filter((id) => id !== cat.id)
                                    : [...prev, cat.id]
                                );
                                setPageIndex(1);
                              }}
                              className="rounded border-slate-300 text-[#001743] focus:ring-0 cursor-pointer"
                            />
                            <span className="truncate">{cat.categoryName}</span>
                          </div>
                          {isChecked && <Check size={13} className="text-[#001743] shrink-0" />}
                        </label>
                      );
                    })}
                  {categories.filter((c) =>
                    c.categoryName.toLowerCase().includes(categorySearch.toLowerCase())
                  ).length === 0 && (
                    <div className="py-4 text-center text-xs text-slate-400">
                      Không tìm thấy thể loại nào
                    </div>
                  )}
                </div>

                {/* Sorting Quick Options */}
                <div className="pt-2 mt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Sắp xếp:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSortKey("category");
                        setSortDirection(sortKey === "category" && sortDirection === "asc" ? "desc" : "asc");
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                        sortKey === "category"
                          ? "bg-[#001743] text-white border-[#001743]"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                      title="Sắp xếp theo tên thể loại (A-Z)"
                    >
                      A-Z {sortKey === "category" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortKey("categoryCount");
                        setSortDirection(sortKey === "categoryCount" && sortDirection === "desc" ? "asc" : "desc");
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                        sortKey === "categoryCount"
                          ? "bg-[#001743] text-white border-[#001743]"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                      title="Sắp xếp theo số lượng thể loại gán trên SIM"
                    >
                      Nhiều thể loại {sortKey === "categoryCount" ? (sortDirection === "desc" ? "↓" : "↑") : ""}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPageIndex(1);
            }}
            className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#001743] focus:outline-none text-slate-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="AVAILABLE">Sẵn sàng (Đang bán)</option>
            <option value="LISTED">Đã niêm yết</option>
            <option value="IN_AUCTION">Đang đấu giá</option>
            <option value="TRANFERING">Đang chuyển nhượng</option>
            <option value="TRANFERED">Đã chuyển nhượng</option>
            <option value="SUSPENED">Tạm khóa</option>
          </select>

          {/* Clear Filter Button */}
          {(search || selectedCarrier || selectedCategories.length > 0 || selectedStatus) && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCarrier("");
                setSelectedCategories([]);
                setSelectedStatus("");
                setPageIndex(1);
              }}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 font-medium transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500">
          Hiển thị <strong className="text-[#001743]">{displaySims.length}</strong> / <strong>{totalCount}</strong> số SIM
        </div>
      </div>

      {/* 4. Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider h-10">
                <th className="py-3 px-4 w-12 text-center shrink-0">
                  <input
                    type="checkbox"
                    checked={sims.length > 0 && selectedSimIds.length === sims.length}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-[#001743] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 min-w-[170px] whitespace-nowrap">
                  <AdminSortButton label="Số SIM / Đầu số" active={sortKey === "phone"} direction={sortDirection} onClick={() => changeSort("phone")} />
                </th>
                <th className="py-3 px-4 min-w-[130px] whitespace-nowrap">Nhà mạng</th>
                <th className="py-3 px-4 min-w-[160px] whitespace-nowrap">
                  <AdminSortButton
                    label="Thể loại"
                    active={sortKey === "category" || sortKey === "categoryCount"}
                    direction={sortDirection}
                    onClick={() => changeSort("category")}
                  />
                </th>
                <th className="py-3 px-4 min-w-[170px] whitespace-nowrap">Định dạng nhịp</th>
                <th className="py-3 px-4 min-w-[180px] whitespace-nowrap">Chủ sở hữu hiện tại</th>
                <th className="py-3 px-4 min-w-[140px] text-center whitespace-nowrap">
                  <AdminSortButton label="Trạng thái" align="center" active={sortKey === "status"} direction={sortDirection} onClick={() => changeSort("status")} />
                </th>
                <th className="py-3 px-4 min-w-[110px] whitespace-nowrap">Ngày tạo</th>
                <th className="py-3 px-4 min-w-[100px] text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto text-[#001743] mb-2" />
                    <span>Đang tải danh sách SIM từ cơ sở dữ liệu...</span>
                  </td>
                </tr>
              ) : displaySims.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Smartphone size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Không tìm thấy số SIM phù hợp</p>
                    <p className="text-[11px] mt-1">Thử thay đổi từ khóa tìm kiếm hoặc làm mới bộ lọc.</p>
                  </td>
                </tr>
              ) : (
                displaySims.map((s) => {
                  const isSelected = selectedSimIds.includes(s.id);
                  const carrierColor = getCarrierColor(s.carrierName);

                  return (
                    <tr
                      key={s.id}
                      onClick={() => handleOpenDrawer(s, "view")}
                      className={`h-16 transition-colors cursor-pointer ${
                        isSelected ? "bg-blue-50/40" : "hover:bg-slate-50/70"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center shrink-0" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(s.id)}
                          className="rounded border-slate-300 text-[#001743] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Phone number */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-extrabold text-sm text-[#001743] font-mono tracking-wider tabular-nums whitespace-nowrap">
                          {formatPhoneNumber(s.phoneNumber)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 whitespace-nowrap flex items-center gap-1">
                          <span>Đầu số:</span>
                          <strong className="text-slate-600">{s.prefixValue || "N/A"}</strong>
                        </div>
                      </td>

                      {/* Carrier */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {s.carrierLogo ? (
                            <img
                              src={s.carrierLogo}
                              alt={s.carrierName}
                              className="w-5 h-5 object-contain rounded-sm border border-slate-100 shrink-0 bg-white p-0.5"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div
                              style={{ backgroundColor: carrierColor }}
                              className="w-5 h-5 rounded-sm flex items-center justify-center text-white font-bold text-[9px] uppercase shrink-0"
                            >
                              {s.carrierName.slice(0, 2)}
                            </div>
                          )}
                          <span className="font-semibold text-slate-700 whitespace-nowrap">{s.carrierName}</span>
                        </div>
                      </td>

                      {/* Categories */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {s.categoryNames && s.categoryNames.length > 0 ? (
                            s.categoryNames.map((cat, idx) => {
                              const isMatched = selectedCategories.length > 0 && categories
                                .filter((c) => selectedCategories.includes(c.id))
                                .some((c) => c.categoryName.toLowerCase() === cat.toLowerCase());

                              return (
                                <span
                                  key={idx}
                                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border whitespace-nowrap transition-colors ${
                                    isMatched
                                      ? "bg-blue-100/90 text-[#001743] border-blue-300 font-bold"
                                      : "bg-slate-100 text-[#001743] border-slate-200"
                                  }`}
                                >
                                  {cat}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Format Rhythm */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        <span className="line-clamp-2" title={s.formatRhythmName || ""}>
                          {s.formatRhythmName || <span className="text-slate-400">—</span>}
                        </span>
                      </td>

                      {/* Current Owner */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {s.ownerFullName ? (
                          <div>
                            <div className="font-medium text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                              <User size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate max-w-[160px]" title={s.ownerFullName}>{s.ownerFullName}</span>
                            </div>
                            {s.ownerPhoneNumber && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">
                                {s.ownerPhoneNumber}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 whitespace-nowrap">
                            Kho sàn TrustSim
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                            s.simStatus === "AVAILABLE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : s.simStatus === "IN_AUCTION"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : s.simStatus === "TRANFERED"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : s.simStatus === "LISTED"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              s.simStatus === "AVAILABLE"
                                ? "bg-emerald-500"
                                : s.simStatus === "IN_AUCTION"
                                ? "bg-amber-500 animate-pulse"
                                : s.simStatus === "TRANFERED"
                                ? "bg-blue-500"
                                : s.simStatus === "LISTED"
                                ? "bg-indigo-500"
                                : "bg-slate-400"
                            }`}
                          />
                          <span>{getSimStatusLabel(s.simStatus)}</span>
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {s.createdDate ? new Date(s.createdDate).toLocaleDateString("vi-VN") : "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(s, "view")}
                            className="p-1.5 text-slate-500 hover:text-[#001743] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(s, "edit")}
                            className="p-1.5 text-slate-500 hover:text-[#001743] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Chỉnh sửa SIM"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSimToDelete(s);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa SIM"
                          >
                            <Trash2 size={15} />
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

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100">
          <Pagination
            pageIndex={pageIndex}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={(p) => setPageIndex(p)}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPageIndex(1);
            }}
          />
        </div>
      </div>

      {/* 5. Right Drawer (View / Edit SIM) */}
      <RightDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerMode === "view" ? "Chi tiết số SIM" : "Chỉnh sửa thông tin SIM"}
        badge={activeSim ? getSimStatusLabel(activeSim.simStatus) : undefined}
        badgeCls={
          activeSim?.simStatus === "AVAILABLE"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : activeSim?.simStatus === "IN_AUCTION"
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-slate-100 text-slate-700 border-slate-200"
        }
        size="lg"
      >
        <DrawerBody>
          {activeSim && (
            <div className="space-y-6">
              {/* Luxury Physical SIM Preview */}
              <PhysicalSimCard
                phoneNumber={activeSim.phoneNumber}
                carrierName={activeSim.carrierName}
                categoryName={activeSim.categoryNames?.[0] || "Số đẹp"}
                patternDesc={`Định dạng: ${activeSim.formatRhythmName || "Chuẩn viễn thông"}`}
                price={activeSim.price ?? 0}
                badgeText={getSimStatusLabel(activeSim.simStatus)}
              />

              {drawerMode === "view" ? (
                /* View Mode */
                <div className="space-y-5">
                  <DrawerSection title="Thông tin viễn thông" subtitle="Đặc tả kỹ thuật của số SIM">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-[11px]">Số thuê bao</span>
                        <strong className="text-[#001743] font-mono text-sm">
                          {formatPhoneNumber(activeSim.phoneNumber)}
                        </strong>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-[11px]">Nhà mạng viễn thông</span>
                        <strong className="text-[#001743]">{activeSim.carrierName}</strong>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-[11px]">Đầu số định tuyến</span>
                        <strong className="text-[#001743] font-mono">{activeSim.prefixValue || "—"}</strong>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 block text-[11px]">Kiểu định dạng nhịp</span>
                        <strong className="text-[#001743]">{activeSim.formatRhythmName || "Mặc định"}</strong>
                      </div>
                    </div>
                  </DrawerSection>

                  <DrawerSection title="Hồ sơ sở hữu" subtitle="Chủ nhân hiện tại đăng ký trên hệ thống">
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Chủ sở hữu:</span>
                        <strong className="text-[#001743]">{activeSim.ownerFullName || "Kho sàn TrustSim"}</strong>
                      </div>
                      {activeSim.ownerPhoneNumber && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Số điện thoại liên hệ:</span>
                          <strong className="text-[#001743] font-mono">{activeSim.ownerPhoneNumber}</strong>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ngày đăng ký lưu kho:</span>
                        <span className="text-slate-700 font-mono">
                          {activeSim.createdDate ? new Date(activeSim.createdDate).toLocaleDateString("vi-VN") : "—"}
                        </span>
                      </div>
                    </div>
                  </DrawerSection>

                  <DrawerSection title="Danh mục &amp; Phân loại thế số">
                    <div className="flex flex-wrap gap-1.5">
                      {activeSim.categoryNames && activeSim.categoryNames.length > 0 ? (
                        activeSim.categoryNames.map((c, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-slate-100 text-[#001743] rounded-md font-semibold text-xs border border-slate-200"
                          >
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs">Chưa gán danh mục thế số.</span>
                      )}
                    </div>
                  </DrawerSection>
                </div>
              ) : (
                /* Edit Mode */
                <form id="edit-sim-form" onSubmit={handleEditSubmit} className="space-y-5">
                  <DrawerSection title="Chỉnh sửa trạng thái" subtitle="Cập nhật vòng đời của số SIM trên sàn">
                    <FormField label="Trạng thái SIM" required>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as SimStatus)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:border-[#001743] focus:outline-none"
                      >
                        <option value="AVAILABLE">Sẵn sàng bán (AVAILABLE)</option>
                        <option value="LISTED">Đã niêm yết (LISTED)</option>
                        <option value="IN_AUCTION">Đang trong phiên đấu giá (IN_AUCTION)</option>
                        <option value="TRANFERING">Đang chuyển nhượng (TRANFERING)</option>
                        <option value="TRANFERED">Đã hoàn tất chuyển nhượng (TRANFERED)</option>
                        <option value="SUSPENED">Tạm khóa / Đình chỉ (SUSPENED)</option>
                      </select>
                    </FormField>
                  </DrawerSection>

                  <DrawerSection title="Quy tắc định tuyến viễn thông">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Nhà mạng">
                        <select
                          value={formCarrierId}
                          onChange={(e) => {
                            setFormCarrierId(e.target.value);
                            const found = carriers.find((c) => c.id === e.target.value);
                            setFormPrefixId(found?.prefixes?.[0]?.id || "");
                          }}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:border-[#001743] focus:outline-none"
                        >
                          <option value="">Chọn nhà mạng</option>
                          {carriers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.carrierName}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField label="Đầu số định tuyến" required>
                        <select
                          value={formPrefixId}
                          onChange={(e) => setFormPrefixId(e.target.value)}
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:border-[#001743] focus:outline-none"
                        >
                          <option value="">Chọn đầu số</option>
                          {availablePrefixes.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.prefixValue}
                            </option>
                          ))}
                        </select>
                      </FormField>
                    </div>

                    <FormField label="Kiểu định dạng nhịp">
                      <select
                        value={formRhythmId}
                        onChange={(e) => setFormRhythmId(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:border-[#001743] focus:outline-none"
                      >
                        <option value="">Mặc định hệ thống</option>
                        {rhythms.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.formatRhythmName}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </DrawerSection>

                  <DrawerSection title="Danh mục thế số phong thủy">
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((cat) => {
                        const checked = formCategoryIds.includes(cat.id);
                        return (
                          <label
                            key={cat.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              checked
                                ? "bg-blue-50/50 border-[#001743] text-[#001743] font-semibold"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleCategory(cat.id)}
                              className="rounded border-slate-300 text-[#001743] focus:ring-0"
                            />
                            <span className="truncate">{cat.categoryName}</span>
                          </label>
                        );
                      })}
                    </div>
                  </DrawerSection>
                </form>
              )}
            </div>
          )}
        </DrawerBody>

        <DrawerFooter>
          {drawerMode === "view" ? (
            <div className="flex items-center justify-between w-full">
              <BtnSecondary onClick={() => setDrawerOpen(false)}>Đóng</BtnSecondary>
              <BtnPrimary onClick={() => setDrawerMode("edit")}>
                <Edit3 size={14} className="mr-1.5" />
                <span>Chuyển sang Chỉnh sửa</span>
              </BtnPrimary>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2 w-full">
              <BtnSecondary onClick={() => setDrawerMode("view")} disabled={submitting}>
                Hủy bỏ
              </BtnSecondary>
              <BtnPrimary onClick={() => handleEditSubmit()} disabled={submitting}>
                {submitting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Check size={14} className="mr-1.5" />}
                <span>Lưu thay đổi</span>
              </BtnPrimary>
            </div>
          )}
        </DrawerFooter>
      </RightDrawer>

      {/* 6. Modal: Thêm SIM mới */}
      {createModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-xs px-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl p-6 w-full max-w-md animate-fade-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#001743]">
                <Smartphone size={20} />
                <h3 className="text-base font-bold">Thêm SIM Mới Vào Kho</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại SIM <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Ví dụ: 0988888888"
                  className="w-full text-sm font-mono font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#001743] focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Nhập đủ 10 chữ số định dạng viễn thông Việt Nam.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nhà mạng <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCarrierId}
                    onChange={(e) => {
                      setFormCarrierId(e.target.value);
                      const found = carriers.find((c) => c.id === e.target.value);
                      setFormPrefixId(found?.prefixes?.[0]?.id || "");
                    }}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#001743] focus:outline-none"
                  >
                    {carriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.carrierName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đầu số <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formPrefixId}
                    onChange={(e) => setFormPrefixId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#001743] focus:outline-none"
                  >
                    {availablePrefixes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.prefixValue}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kiểu định dạng nhịp</label>
                <select
                  value={formRhythmId}
                  onChange={(e) => setFormRhythmId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#001743] focus:outline-none"
                >
                  <option value="">Mặc định hệ thống</option>
                  {rhythms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.formatRhythmName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phân loại thế số</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                  {categories.map((cat) => {
                    const checked = formCategoryIds.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-2 p-1.5 rounded border text-xs cursor-pointer ${
                          checked
                            ? "bg-blue-50 border-[#001743] text-[#001743] font-semibold"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleCategory(cat.id)}
                          className="rounded border-slate-300 text-[#001743] focus:ring-0"
                        />
                        <span className="truncate">{cat.categoryName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Tạo SIM mới</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Xác nhận xóa SIM */}
      {deleteModalOpen && simToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-xs px-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl p-5 w-full max-w-sm animate-fade-up">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#001743]">Xác nhận xóa số SIM</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Bạn có chắc chắn muốn xóa số SIM{" "}
                  <strong className="text-rose-600 font-mono">
                    {formatPhoneNumber(simToDelete.phoneNumber)}
                  </strong>{" "}
                  khỏi kho dữ liệu? Thao tác này sẽ chuyển SIM về trạng thái lưu trữ bảo mật.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSimToDelete(null);
                }}
                disabled={deleting}
                className="px-3.5 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
