"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Layers,
  ArrowUpDown,
} from "lucide-react";
import ImportExportBar from "@/components/admin/ImportExportBar";
import { ExcelColumnDef } from "@/services/excelService";
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  type DocumentDto,
  type CreateDocumentPayload,
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

export function AdminDocumentsTab() {
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Drawer / Form State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedDoc, setSelectedDoc] = useState<DocumentDto | null>(null);
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Safeguard Modal
  const [deleteModalDoc, setDeleteModalDoc] = useState<DocumentDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
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
    if (!q) return documents;
    return documents.filter(
      (d) =>
        d.documentName.toLowerCase().includes(q) ||
        d.linkUrl.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
    );
  }, [documents, search]);

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

  // Open Create Drawer
  const handleOpenCreate = () => {
    setDrawerMode("create");
    setSelectedDoc(null);
    setFormName("");
    setFormUrl("");
    setFormError(null);
    setDrawerOpen(true);
  };

  // Open Edit Drawer
  const handleOpenEdit = (doc: DocumentDto) => {
    setDrawerMode("edit");
    setSelectedDoc(doc);
    setFormName(doc.documentName);
    setFormUrl(doc.linkUrl);
    setFormError(null);
    setDrawerOpen(true);
  };

  // Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formName.trim();
    const url = formUrl.trim();

    if (!name) {
      setFormError("Vui lòng nhập tên tài liệu / chính sách.");
      return;
    }

    if (!url) {
      setFormError("Vui lòng nhập đường dẫn URL của tài liệu.");
      return;
    }

    try {
      new URL(url);
    } catch {
      setFormError("Đường dẫn URL không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: https://...)");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (drawerMode === "create") {
        await createDocument({ documentName: name, linkUrl: url });
        showToast("Thêm mới tài liệu thành công!");
      } else if (drawerMode === "edit" && selectedDoc) {
        await updateDocument(selectedDoc.id, {
          documentName: name,
          linkUrl: url,
        });
        showToast("Cập nhật tài liệu thành công!");
      }

      setDrawerOpen(false);
      fetchDocuments(true);
    } catch (err: any) {
      setFormError(err.message || "Thao tác thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Document
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

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl border text-xs font-semibold flex items-center gap-2.5 animate-fade-up ${
            toastMessage.type === "success"
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

      {/* ── 1. Header Card (Matching Carriers & Categories) ── */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-[#001743]">Quản Lý Tài Liệu &amp; Chính Sách Hệ Thống</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
              {documents.length} văn bản
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Quản lý các văn bản pháp lý, quy chế hoạt động sàn, điều khoản sử dụng và cơ sở tri thức cho AI RAG.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
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
            className="p-1.5 text-[#4B5563] hover:text-[#001743] hover:bg-slate-100 border border-[#D1D5DB] rounded-[6px] transition-colors bg-white disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin text-[#001743]" : ""} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#001743] hover:bg-[#00266B] text-white text-xs font-bold rounded-[6px] transition-colors shadow-xs shrink-0"
          >
            <Plus size={15} strokeWidth={1.75} />
            <span>Thêm tài liệu mới</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Docs */}
        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <FileText size={20} strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Tổng số tài liệu
            </div>
            <div className="text-2xl font-bold text-[#001743] mt-0.5 font-mono">
              {documents.length}
            </div>
          </div>
        </div>

        {/* External Links */}
        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Globe size={20} strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Liên kết trực tuyến
            </div>
            <div className="text-2xl font-bold text-[#001743] mt-0.5 font-mono">
              {documents.filter((d) => d.linkUrl && d.linkUrl.startsWith("http")).length}
            </div>
          </div>
        </div>

        {/* Latest Added */}
        <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-4 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Calendar size={20} strokeWidth={1.75} />
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

      {/* 3. Search & Filters Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-[8px] p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên tài liệu hoặc đường dẫn URL..."
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

      {/* 4. Table / Content View */}
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
            {search ? (
              <button
                onClick={() => setSearch("")}
                className="mt-3 text-xs text-[#001743] font-semibold hover:underline"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            ) : (
              <button
                onClick={handleOpenCreate}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#001743] text-white text-xs font-medium rounded-lg hover:bg-[#00266B] transition-colors"
              >
                <Plus size={13} />
                <span>Thêm tài liệu đầu tiên</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Tên tài liệu / Văn bản</th>
                    <th className="py-3 px-4">Liên kết URL</th>
                    <th className="py-3 px-4 w-44">Ngày tạo</th>
                    <th className="py-3 px-4 w-32 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {pagedDocs.map((doc, idx) => {
                    const stt = (currentPage - 1) * pageSize + idx + 1;
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
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                              <FileText size={15} />
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

                        {/* Link URL */}
                        <td className="py-3 px-4">
                          {doc.linkUrl ? (
                            <a
                              href={doc.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline max-w-md truncate font-mono text-xs"
                              title={doc.linkUrl}
                            >
                              <span className="truncate">{doc.linkUrl}</span>
                              <ExternalLink size={12} className="shrink-0 text-slate-400" />
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">Chưa có liên kết</span>
                          )}
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
                          <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                            {doc.linkUrl && (
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
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(doc)}
                              title="Chỉnh sửa tài liệu"
                              className="p-1.5 text-slate-400 hover:text-[#001743] hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
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

      {/* 5. RightDrawer for Create/Edit */}
      <RightDrawer
        open={drawerOpen}
        onClose={() => !submitting && setDrawerOpen(false)}
        title={drawerMode === "create" ? "Thêm tài liệu / chính sách mới" : "Chỉnh sửa tài liệu"}
        badge={drawerMode === "create" ? "Tạo mới" : "Cập nhật"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DrawerBody>
            {formError && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

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
                required
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
          </DrawerBody>

          <DrawerFooter>
            <div className="flex items-center justify-end gap-2.5 w-full">
              <BtnSecondary
                onClick={() => setDrawerOpen(false)}
                disabled={submitting}
              >
                Hủy
              </BtnSecondary>
              <BtnPrimary type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>{drawerMode === "create" ? "Tạo tài liệu" : "Lưu thay đổi"}</span>
                )}
              </BtnPrimary>
            </div>
          </DrawerFooter>
        </form>
      </RightDrawer>

      {/* 6. Modal Xác nhận xóa */}
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
