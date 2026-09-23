"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Search,
  RefreshCw,
  AlertTriangle,
  X,
  Check,
  Loader2,
  CheckCircle2,
  Globe,
  Calendar,
  BookOpen,
  UploadCloud,
  FileCode,
  FileSpreadsheet,
  FileType,
  Sparkles,
  Layers,
  Cpu,
  Info,
  RotateCw,
  FileCheck2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import ImportExportBar from "@/components/admin/ImportExportBar";
import { ExcelColumnDef } from "@/services/excelService";
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  ingestDocumentFromUrl,
  uploadDocumentFile,
  getDocumentIngestStatus,
  type DocumentDto,
  type DocumentTypeEnum,
  type IngestDocumentResponseDto,
} from "@/services/documentService";
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

const DOCUMENT_EXPORT_COLUMNS: ExcelColumnDef<DocumentDto>[] = [
  { header: "Mã tài liệu", key: "id", width: 36 },
  { header: "Tên văn bản / Quy chế", key: "documentName", width: 35 },
  { header: "Đường dẫn URL", key: "linkUrl", width: 45 },
  {
    header: "Ngày tạo",
    key: "createdDate",
    width: 22,
    formatter: (val) => (val ? new Date(String(val)).toLocaleString("vi-VN") : "—"),
  },
];

const DOCUMENT_TYPES: { value: DocumentTypeEnum; label: string; desc: string }[] = [
  {
    value: "MARKET_RESEARCH",
    label: "Nghiên cứu thị trường SIM",
    desc: "Khảo sát giá, xu hướng tiêu dùng, thống kê phân khúc SIM số đẹp.",
  },
  {
    value: "FENG_SHUI_RULE",
    label: "Quy tắc Phong thủy & Ngũ hành",
    desc: "Tri thức quẻ dịch, ngũ hành tương sinh tương khắc, tính cách & số học.",
  },
  {
    value: "PRICING_GUIDELINE",
    label: "Chính sách & Quy tắc Định giá",
    desc: "Biểu phí, công thức định giá tự động, hệ số uy tín định giá SIM.",
  },
  {
    value: "GENERAL",
    label: "Văn bản & Quy chế chung",
    desc: "Điều khoản sử dụng, chính sách bảo mật, quy chế hoạt động sàn.",
  },
];

export function AdminDocumentsTab() {
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "date">("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [activeOnly, setActiveOnly] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Drawer Modes: "upload" (file) | "ingest" (url) | "create" (manual) | "edit"
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "ingest" | "create">("upload");
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedDoc, setSelectedDoc] = useState<DocumentDto | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formDocType, setFormDocType] = useState<DocumentTypeEnum>("MARKET_RESEARCH");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Status Detail Modal
  const [statusModalDoc, setStatusModalDoc] = useState<DocumentDto | null>(null);
  const [statusData, setStatusData] = useState<IngestDocumentResponseDto | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [reingesting, setReingesting] = useState(false);

  // Delete Safeguard Modal
  const [deleteModalDoc, setDeleteModalDoc] = useState<DocumentDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Documents
  const fetchDocuments = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      const data = await getDocuments(activeOnly);
      setDocuments(data);
    } catch (err: any) {
      console.error("Lỗi tải danh sách tài liệu:", err);
      showToast(err.message || "Không thể tải danh sách tài liệu.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Filtered list
  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = !q ? [...documents] : documents.filter(
      (d) =>
        d.documentName.toLowerCase().includes(q) ||
        d.linkUrl.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
    );
    return filtered.sort((a, b) => {
      const left = sortKey === "name" ? a.documentName : new Date(a.createdDate).getTime();
      const right = sortKey === "name" ? b.documentName : new Date(b.createdDate).getTime();
      const result = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "vi");
      return sortDirection === "asc" ? result : -result;
    });
  }, [documents, search, sortKey, sortDirection]);

  const changeSort = (key: "name" | "date") => {
    const next = toggleSort(sortKey, sortDirection, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
    setCurrentPage(1);
  };

  // Paginated list
  const totalPages = Math.ceil(filteredDocs.length / pageSize) || 1;
  const pagedDocs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocs.slice(start, start + pageSize);
  }, [filteredDocs, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeOnly]);

  // Open Drawer: Add Document (with choices: Ingest URL, Upload File, Manual)
  const handleOpenAddDocument = (defaultTab: "ingest" | "upload" | "create" = "ingest") => {
    setDrawerMode("create");
    setActiveTab(defaultTab);
    setSelectedDoc(null);
    setFormName("");
    setFormUrl("");
    setFormDocType("MARKET_RESEARCH");
    setSelectedFile(null);
    setFormError(null);
    setDrawerOpen(true);
  };

  // Open Edit Drawer
  const handleOpenEdit = (doc: DocumentDto) => {
    setDrawerMode("edit");
    setActiveTab("create");
    setSelectedDoc(doc);
    setFormName(doc.documentName);
    setFormUrl(doc.linkUrl);
    setFormError(null);
    setDrawerOpen(true);
  };

  // File Drop / Selection Handlers
  const handleFileChange = (file: File | null) => {
    if (!file) return;
    const allowedExts = [".pdf", ".docx", ".txt", ".md", ".csv"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExts.includes(ext)) {
      setFormError(`Định dạng tệp ${ext} không được hỗ trợ. Vui lòng chọn tệp: ${allowedExts.join(", ")}`);
      return;
    }
    // Max 25MB
    if (file.size > 25 * 1024 * 1024) {
      setFormError("Dung lượng tệp vượt quá giới hạn cho phép (tối đa 25MB).");
      return;
    }
    setSelectedFile(file);
    setFormError(null);
    if (!formName.trim()) {
      // Tự động gán tên từ tệp
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setFormName(baseName);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Handle Submit (Upload / Ingest / Create / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formName.trim();

    if (drawerMode === "edit") {
      if (!name) {
        setFormError("Vui lòng nhập tên tài liệu / chính sách.");
        return;
      }
      try {
        setSubmitting(true);
        setFormError(null);
        await updateDocument(selectedDoc!.id, {
          documentName: name,
          linkUrl: formUrl.trim(),
        });
        showToast("Cập nhật tài liệu thành công!");
        setDrawerOpen(false);
        fetchDocuments(true);
      } catch (err: any) {
        setFormError(err.message || "Cập nhật thất bại.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // CREATE MODE: 3 TABS
    if (activeTab === "upload") {
      // 1. DIRECT FILE UPLOAD -> /api/ai/documents/upload
      if (!selectedFile) {
        setFormError("Vui lòng chọn hoặc kéo thả tệp tin tài liệu để tải lên.");
        return;
      }
      try {
        setSubmitting(true);
        setFormError(null);
        const formData = new FormData();
        formData.append("file", selectedFile);
        if (name) formData.append("documentName", name);
        formData.append("documentType", formDocType);

        const res = await uploadDocumentFile(formData);
        showToast(
          `Tệp "${res.documentName}" đã được tải lên và đang nạp vào bộ nhớ AI!`,
          "success"
        );
        setDrawerOpen(false);
        fetchDocuments(true);
      } catch (err: any) {
        setFormError(err.message || "Tải lên tài liệu thất bại.");
      } finally {
        setSubmitting(false);
      }
    } else if (activeTab === "ingest") {
      // 2. INGEST FROM URL -> /api/ai/documents/ingest
      const url = formUrl.trim();
      if (!name) {
        setFormError("Vui lòng nhập tên tài liệu.");
        return;
      }
      if (!url) {
        setFormError("Vui lòng nhập đường dẫn URL của tài liệu để cào dữ liệu.");
        return;
      }
      try {
        new URL(url);
      } catch {
        setFormError("Đường dẫn URL không hợp lệ (ví dụ: https://example.com/tai-lieu)");
        return;
      }
      try {
        setSubmitting(true);
        setFormError(null);
        const res = await ingestDocumentFromUrl({
          documentName: name,
          linkUrl: url,
          documentType: formDocType,
        });
        showToast(
          `Yêu cầu nạp tài liệu "${res.documentName}" đã được tiếp nhận và đang xử lý!`,
          "success"
        );
        setDrawerOpen(false);
        fetchDocuments(true);
      } catch (err: any) {
        setFormError(err.message || "Nạp tài liệu từ URL thất bại.");
      } finally {
        setSubmitting(false);
      }
    } else {
      // 3. MANUAL CREATE -> /api/documents
      if (!name) {
        setFormError("Vui lòng nhập tên tài liệu.");
        return;
      }
      try {
        setSubmitting(true);
        setFormError(null);
        await createDocument({
          documentName: name,
          linkUrl: formUrl.trim(),
        });
        showToast("Tạo tài liệu điều khoản thành công!");
        setDrawerOpen(false);
        fetchDocuments(true);
      } catch (err: any) {
        setFormError(err.message || "Tạo tài liệu thất bại.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  // View Status Modal Handler
  const handleOpenStatus = async (doc: DocumentDto) => {
    setStatusModalDoc(doc);
    setStatusData(null);
    setLoadingStatus(true);
    try {
      const data = await getDocumentIngestStatus(doc.id);
      setStatusData(data);
    } catch (err: any) {
      console.error("Lỗi lấy trạng thái:", err);
      // Fallback display if not yet indexed in RAG
      setStatusData({
        documentId: doc.id,
        documentName: doc.documentName,
        linkUrl: doc.linkUrl,
        documentType: "GENERAL",
        status: "PENDING",
        totalChunks: 0,
        totalTokens: 0,
        errorMessage: err.message,
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  // Re-ingest from Status Modal
  const handleReingest = async () => {
    if (!statusModalDoc || !statusModalDoc.linkUrl) return;
    try {
      setReingesting(true);
      const res = await ingestDocumentFromUrl({
        documentName: statusModalDoc.documentName,
        linkUrl: statusModalDoc.linkUrl,
        documentType: "GENERAL",
      });
      showToast("Đã gửi yêu cầu nạp lại dữ liệu cho AI!");
      setStatusData(res);
    } catch (err: any) {
      showToast(err.message || "Thử lại thất bại.", "error");
    } finally {
      setReingesting(false);
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deleteModalDoc) return;
    try {
      setDeleting(true);
      await deleteDocument(deleteModalDoc.id);
      showToast(`Đã xóa tài liệu "${deleteModalDoc.documentName}" thành công!`);
      setDeleteModalDoc(null);
      fetchDocuments(true);
    } catch (err: any) {
      showToast(err.message || "Xóa tài liệu thất bại.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const getFileIcon = (urlOrName: string) => {
    const ext = urlOrName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText size={16} className="text-rose-600" />;
    if (ext === "csv") return <FileSpreadsheet size={16} className="text-emerald-600" />;
    if (ext === "docx" || ext === "doc") return <FileType size={16} className="text-blue-600" />;
    if (ext === "md" || ext === "txt") return <FileCode size={16} className="text-indigo-600" />;
    return <FileText size={16} className="text-slate-600" />;
  };

  return (
    <div className="admin-tab admin-tab-documents space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl border text-xs font-semibold flex items-center gap-2.5 animate-fade-up ${toastMessage.type === "success"
              ? "bg-[#001743] text-white border-slate-700"
              : "bg-rose-600 text-white border-rose-700"
            }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-white shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ─── 1. Header Card with Direct Ingest & Upload Action Buttons ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-[#001743]">
              Quản Lý Tài Liệu &amp; Cơ Sở Tri Thức AI
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
              {documents.length} văn bản
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Quản lý văn bản pháp lý, chính sách và nạp tài liệu định giá SIM số đẹp cho hệ thống AI.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <ImportExportBar
            data={filteredDocs}
            columns={DOCUMENT_EXPORT_COLUMNS}
            filename="TrustSim_Documents"
            sheetName="DanhSachTaiLieu"
            showImport={false}
            entityName="tài liệu"
          />

          <button
            type="button"
            onClick={() => fetchDocuments(true)}
            disabled={refreshing || loading}
            title="Làm mới dữ liệu"
            className="p-2 text-[#4B5563] hover:text-[#001743] hover:bg-slate-100 border border-[#D1D5DB] rounded-[6px] transition-colors bg-white disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-[#001743]" : ""} />
          </button>

          {/* Button: Thêm tài liệu (Gộp chung Nạp từ URL, Tải lên tệp, Tạo thủ công) */}
          <button
            type="button"
            onClick={() => handleOpenAddDocument("ingest")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[6px] transition-colors shadow-xs"
          >
            <Plus size={15} />
            <span>Thêm tài liệu</span>
          </button>
        </div>
      </div>

      {/* ─── 2. KPI Overview Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Total Docs */}
        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3.5 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <FileText size={18} strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Tổng số tài liệu
            </div>
            <div className="text-xl font-bold text-[#001743] mt-0.5 font-mono">
              {documents.length}
            </div>
          </div>
        </div>

        {/* External Links */}
        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3.5 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Globe size={18} strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Liên kết URL ngoài
            </div>
            <div className="text-xl font-bold text-[#001743] mt-0.5 font-mono">
              {documents.filter((d) => d.linkUrl && d.linkUrl.startsWith("http")).length}
            </div>
          </div>
        </div>

        {/* Direct Uploads / Internal */}
        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3.5 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Cpu size={18} strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Bộ nhớ AI
            </div>
            <div className="text-xl font-bold text-[#001743] mt-0.5 font-mono">
              Sẵn sàng
            </div>
          </div>
        </div>

        {/* Latest Update */}
        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3.5 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Calendar size={18} strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Cập nhật gần nhất
            </div>
            <div className="text-xs font-semibold text-[#001743] mt-0.5 truncate">
              {documents.length > 0 && documents[0].createdDate
                ? new Date(documents[0].createdDate).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
                : "Chưa có"}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Search & Filters Bar ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên tài liệu, URL hoặc ID..."
            className="w-full text-xs pl-9 pr-8 py-1.5 bg-white border border-[#D1D5DB] rounded-[6px] focus:outline-none focus:border-[#001743] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-[#001743] focus:ring-[#001743] border-slate-300"
            />
            <span>Chỉ hiển thị đang kích hoạt</span>
          </label>
        </div>
      </div>

      {/* ─── 4. Table / Content View ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 size={28} className="animate-spin text-[#001743]" />
            <span className="text-xs">Đang tải danh sách tài liệu...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <BookOpen size={24} />
            </div>
            <h3 className="text-sm font-bold text-[#001743]">Chưa có tài liệu nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search
                ? `Không tìm thấy tài liệu phù hợp với từ khóa "${search}".`
                : "Hệ thống chưa có tài liệu hay chính sách nào được thêm."}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                onClick={() => handleOpenAddDocument("ingest")}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#001743] text-white text-xs font-semibold rounded-lg hover:bg-[#00266B] transition-colors shadow-xs"
              >
                <Plus size={14} />
                <span>Thêm tài liệu mới</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4"><AdminSortButton label="Tên tài liệu / Văn bản" active={sortKey === "name"} direction={sortDirection} onClick={() => changeSort("name")} /></th>
                    <th className="py-3 px-4">Đường dẫn / Tệp nguồn</th>
                    <th className="py-3 px-4 w-36">Trạng thái học dữ liệu</th>
                    <th className="py-3 px-4 w-40"><AdminSortButton label="Ngày tạo" active={sortKey === "date"} direction={sortDirection} onClick={() => changeSort("date")} /></th>
                    <th className="py-3 px-4 w-36 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {pagedDocs.map((doc, idx) => {
                    const stt = (currentPage - 1) * pageSize + idx + 1;
                    const isExternalUrl = doc.linkUrl && doc.linkUrl.startsWith("http");

                    return (
                      <tr
                        key={doc.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* STT */}
                        <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                          {stt}
                        </td>

                        {/* Document Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                              {getFileIcon(doc.linkUrl || doc.documentName)}
                            </div>
                            <div>
                              <div className="font-semibold text-[#001743] hover:text-blue-600 transition-colors">
                                {doc.documentName}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                ID: {doc.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Link / File */}
                        <td className="py-3 px-4">
                          {isExternalUrl ? (
                            <a
                              href={doc.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline max-w-xs truncate font-mono text-xs"
                              title={doc.linkUrl}
                            >
                              <span className="truncate">{doc.linkUrl}</span>
                              <ExternalLink size={12} className="shrink-0 text-slate-400" />
                            </a>
                          ) : doc.linkUrl ? (
                            <span className="text-slate-600 font-mono text-xs flex items-center gap-1">
                              <FileCheck2 size={13} className="text-emerald-600 shrink-0" />
                              <span className="truncate max-w-xs">{doc.linkUrl}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa có liên kết</span>
                          )}
                        </td>

                        {/* AI Status Quick Button */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleOpenStatus(doc)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                            title="Kiểm tra trạng thái nạp dữ liệu của AI"
                          >
                            <Cpu size={12} className="text-indigo-600" />
                            <span>Kiểm tra</span>
                          </button>
                        </td>

                        {/* Created Date */}
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {doc.createdDate
                            ? new Date(doc.createdDate).toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : "—"}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100">
                            {/* Check Status */}
                            <button
                              type="button"
                              onClick={() => handleOpenStatus(doc)}
                              title="Xem chi tiết tiến độ nạp dữ liệu AI"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            >
                              <Sparkles size={14} />
                            </button>

                            {/* External Link */}
                            {isExternalUrl && (
                              <a
                                href={doc.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Mở liên kết trong tab mới"
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(doc)}
                              title="Chỉnh sửa tài liệu"
                              className="p-1.5 text-slate-400 hover:text-[#001743] hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeleteModalDoc(doc)}
                              title="Xóa tài liệu"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredDocs.length > pageSize && (
              <Pagination
                pageIndex={currentPage}
                pageSize={pageSize}
                totalCount={filteredDocs.length}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>

      {/* ─── 5. RightDrawer: Multi-Tab Ingest / Upload / Create ─── */}
      <RightDrawer
        open={drawerOpen}
        onClose={() => !submitting && setDrawerOpen(false)}
        title={
          drawerMode === "edit"
            ? "Chỉnh sửa tài liệu"
            : activeTab === "upload"
              ? "Tải lên tệp tài liệu cho AI"
              : activeTab === "ingest"
                ? "Nạp tài liệu từ liên kết bài viết"
                : "Thêm văn bản chính sách mới"
        }
        badge={drawerMode === "edit" ? "Cập nhật" : "Tạo mới"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DrawerBody>
            {/* Mode Switcher Tabs: Chọn Nạp từ URL, Tải lên tệp hoặc Tạo thủ công */}
            {drawerMode === "create" && (
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg mb-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("ingest");
                    setFormError(null);
                  }}
                  className={`py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === "ingest"
                      ? "bg-white text-[#001743] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <Globe size={13} />
                  <span>Từ đường dẫn</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("upload");
                    setFormError(null);
                  }}
                  className={`py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === "upload"
                      ? "bg-white text-[#001743] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <UploadCloud size={13} />
                  <span>Tải lên tệp</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("create");
                    setFormError(null);
                  }}
                  className={`py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === "create"
                      ? "bg-white text-[#001743] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <FileText size={13} />
                  <span>Tạo thủ công</span>
                </button>
              </div>
            )}

            {formError && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* TAB 1: FILE UPLOAD */}
            {drawerMode === "create" && activeTab === "upload" && (
              <DrawerSection title="Tệp tin tài liệu">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver
                      ? "border-[#001743] bg-blue-50/50"
                      : selectedFile
                        ? "border-emerald-300 bg-emerald-50/30"
                        : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.md,.csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                  />

                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <FileCheck2 size={20} />
                      </div>
                      <div className="text-xs font-bold text-[#001743]">
                        {selectedFile.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {(selectedFile.size / 1024).toFixed(1)} KB · Nhấn để đổi tệp khác
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                        <UploadCloud size={20} />
                      </div>
                      <div className="text-xs font-bold text-[#001743]">
                        Kéo thả tệp tin vào đây hoặc nhấn để chọn
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Hỗ trợ: PDF, Word (.docx), Markdown (.md), Text (.txt), CSV (Tối đa 25MB)
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <FormField label="Tên hiển thị tài liệu (Tùy chọn)">
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Mặc định lấy theo tên tệp tải lên..."
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#001743]"
                    />
                  </FormField>
                </div>

                <div className="mt-3">
                  <FormField label="Phân loại tri thức AI" required>
                    <select
                      value={formDocType}
                      onChange={(e) => setFormDocType(e.target.value as DocumentTypeEnum)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#001743]"
                    >
                      {DOCUMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {DOCUMENT_TYPES.find((t) => t.value === formDocType)?.desc}
                  </p>
                </div>
              </DrawerSection>
            )}

            {/* TAB 2: INGEST FROM URL */}
            {drawerMode === "create" && activeTab === "ingest" && (
              <DrawerSection title="Nạp từ liên kết URL">
                <FormField
                  label="Đường dẫn URL bài viết / tài liệu"
                  required
                  hint="Hệ thống sẽ tự động đọc nội dung bài viết, trích xuất dữ liệu và nạp vào bộ nhớ AI."
                >
                  <input
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://trustsim.vn/nghien-cuu-thi-truong-sim-2026"
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#001743] font-mono"
                    autoFocus
                  />
                </FormField>

                <div className="mt-3">
                  <FormField label="Tên tài liệu / Tiêu đề" required>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="VD: Báo cáo phân tích định giá SIM ngũ quý 2026"
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#001743]"
                    />
                  </FormField>
                </div>

                <div className="mt-3">
                  <FormField label="Phân loại tri thức AI" required>
                    <select
                      value={formDocType}
                      onChange={(e) => setFormDocType(e.target.value as DocumentTypeEnum)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#001743]"
                    >
                      {DOCUMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {DOCUMENT_TYPES.find((t) => t.value === formDocType)?.desc}
                  </p>
                </div>
              </DrawerSection>
            )}

            {/* TAB 3 / EDIT: MANUAL CREATE OR EDIT */}
            {(drawerMode === "edit" || activeTab === "create") && (
              <DrawerSection title="Thông tin văn bản">
                <FormField label="Tên tài liệu / Văn bản" required>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="VD: Quy chế hoạt động Sàn giao dịch SIM số đẹp TrustSim"
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#001743]"
                    autoFocus
                  />
                </FormField>

                <FormField
                  label="Đường dẫn liên kết (URL)"
                  hint="Đường dẫn đến file tài liệu, PDF trực tuyến hoặc trang điều khoản chính sách."
                >
                  <input
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://trustsim.vn/terms hoặc https://drive.google.com/..."
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#001743] font-mono"
                  />
                </FormField>

                {formUrl && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Xem trước liên kết:
                    </div>
                    <a
                      href={formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:underline font-mono text-[11px] break-all"
                    >
                      <span>{formUrl}</span>
                      <ExternalLink size={11} className="shrink-0" />
                    </a>
                  </div>
                )}
              </DrawerSection>
            )}
          </DrawerBody>

          <DrawerFooter>
            <div className="flex items-center justify-end gap-2.5 w-full">
              <BtnSecondary onClick={() => setDrawerOpen(false)} disabled={submitting}>
                Hủy
              </BtnSecondary>
              <BtnPrimary type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>
                    {drawerMode === "edit"
                      ? "Lưu thay đổi"
                      : activeTab === "upload"
                        ? "Tải lên & Nạp vào AI"
                        : activeTab === "ingest"
                          ? "Nạp dữ liệu cho AI"
                          : "Tạo tài liệu"}
                  </span>
                )}
              </BtnPrimary>
            </div>
          </DrawerFooter>
        </form>
      </RightDrawer>

      {/* ─── 6. Status Detail Modal (Tiến độ nạp tri thức AI) ─── */}
      {statusModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-2xl p-5 animate-fade-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                  <Cpu size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#001743]">
                    Trạng Thái Tiếp Nhận Dữ Liệu AI
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ID: {statusModalDoc.id}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X size={16} />
              </button>
            </div>

            {loadingStatus ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 size={24} className="animate-spin text-indigo-600" />
                <span className="text-xs">Đang kiểm tra tiến độ từ máy chủ AI...</span>
              </div>
            ) : statusData ? (
              <div className="space-y-4 text-xs">
                {/* Document Name */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-[11px] text-slate-500 font-medium">Tên tài liệu:</div>
                  <div className="text-xs font-bold text-[#001743] mt-0.5">
                    {statusData.documentName || statusModalDoc.documentName}
                  </div>
                  {statusData.linkUrl && (
                    <div className="text-[11px] text-blue-600 font-mono truncate mt-1">
                      {statusData.linkUrl}
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-600 font-medium">Trạng thái xử lý:</span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${String(statusData.status) === "INDEXED" || Number(statusData.status) === 3
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : String(statusData.status) === "PROCESSING" || Number(statusData.status) === 2
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : String(statusData.status) === "CRAWLING" || Number(statusData.status) === 1
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : String(statusData.status) === "FAILED" || Number(statusData.status) === 4
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                  >
                    {String(statusData.status) === "INDEXED" || Number(statusData.status) === 3 ? (
                      <>
                        <CheckCircle2 size={12} />
                        <span>Đã nạp xong (Sẵn sàng)</span>
                      </>
                    ) : String(statusData.status) === "PROCESSING" || Number(statusData.status) === 2 ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Đang xử lý dữ liệu...</span>
                      </>
                    ) : String(statusData.status) === "CRAWLING" || Number(statusData.status) === 1 ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Đang tải nội dung từ liên kết...</span>
                      </>
                    ) : String(statusData.status) === "FAILED" || Number(statusData.status) === 4 ? (
                      <>
                        <AlertCircle size={12} />
                        <span>Chưa nạp được (Có lỗi)</span>
                      </>
                    ) : (
                      <span>Đang chờ xử lý</span>
                    )}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">Số đoạn nội dung trích xuất:</div>
                    <div className="text-lg font-bold text-[#001743] font-mono mt-0.5">
                      {statusData.totalChunks?.toLocaleString("vi-VN") || 0}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">Dung lượng từ vựng AI:</div>
                    <div className="text-lg font-bold text-[#001743] font-mono mt-0.5">
                      {statusData.totalTokens?.toLocaleString("vi-VN") || 0}
                    </div>
                  </div>
                </div>

                {/* Crawled Date */}
                {statusData.crawledAt && (
                  <div className="text-[11px] text-slate-500">
                    Thời điểm hoàn tất:{" "}
                    <span className="font-mono text-slate-700">
                      {new Date(statusData.crawledAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                )}

                {/* Error Box if any */}
                {statusData.errorMessage && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      <AlertTriangle size={13} />
                      <span>Thông điệp lỗi:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{statusData.errorMessage}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  {statusModalDoc.linkUrl && statusModalDoc.linkUrl.startsWith("http") && (
                    <button
                      type="button"
                      onClick={handleReingest}
                      disabled={reingesting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <RotateCw size={13} className={reingesting ? "animate-spin" : ""} />
                      <span>{reingesting ? "Đang nạp lại..." : "Nạp lại dữ liệu cho AI"}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setStatusModalDoc(null)}
                    className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ─── 7. Modal Xác nhận xóa ─── */}
      {deleteModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm shadow-2xl p-5 animate-fade-up">
            <div className="flex items-center gap-2.5 mb-2.5 text-rose-600">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
              <h3 className="text-sm font-bold text-[#001743]">Xác nhận xóa tài liệu</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Bạn có chắc chắn muốn xóa văn bản{" "}
              <strong className="text-[#001743] font-medium">
                &ldquo;{deleteModalDoc.documentName}&rdquo;
              </strong>{" "}
              khỏi hệ thống? Thao tác này sẽ thực hiện xóa mềm tài liệu.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalDoc(null)}
                disabled={deleting}
                className="px-3.5 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <span>Xác nhận xóa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
