import { apiFetch } from "./apiClient";

// --- DTOs (mirror backend DocumentsController) ---
export interface DocumentDto {
  id: string;
  documentName: string;
  linkUrl: string;
  createdDate: string;
}

export interface CreateDocumentPayload {
  documentName: string;
  linkUrl: string;
}

export interface UpdateDocumentPayload {
  id?: string;
  documentName: string;
  linkUrl: string;
}

// --- API Calls ---

/**
 * Lấy danh sách tài liệu / quy chế sàn / chính sách
 */
export async function getDocuments(activeOnly: boolean = false): Promise<DocumentDto[]> {
  const query = activeOnly ? "?activeOnly=true" : "?activeOnly=false";
  const res = await apiFetch<DocumentDto[]>(`/Documents${query}`);
  return res.data ?? [];
}

/**
 * Lấy chi tiết tài liệu theo ID
 */
export async function getDocumentById(id: string): Promise<DocumentDto> {
  const res = await apiFetch<DocumentDto>(`/Documents/${id}`);
  if (!res.data) {
    throw new Error(res.message || "Không tìm thấy thông tin tài liệu.");
  }
  return res.data;
}

/**
 * [Admin] Tạo văn bản điều khoản / chính sách mới
 */
export async function createDocument(payload: CreateDocumentPayload): Promise<DocumentDto> {
  const res = await apiFetch<DocumentDto>("/Documents", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.data) {
    throw new Error(res.message || "Tạo văn bản điều khoản thất bại.");
  }
  return res.data;
}

/**
 * [Admin] Cập nhật văn bản điều khoản / chính sách
 */
export async function updateDocument(
  id: string,
  payload: UpdateDocumentPayload
): Promise<DocumentDto> {
  const res = await apiFetch<DocumentDto>(`/Documents/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, id }),
  });
  if (!res.data) {
    throw new Error(res.message || "Cập nhật văn bản điều khoản thất bại.");
  }
  return res.data;
}

/**
 * [Admin] Xóa (xóa mềm) tài liệu / chính sách
 */
export async function deleteDocument(id: string): Promise<boolean> {
  const res = await apiFetch<boolean>(`/Documents/${id}`, {
    method: "DELETE",
  });
  return res.data ?? res.success ?? false;
}
