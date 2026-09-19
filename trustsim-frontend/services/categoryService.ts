import { apiFetch } from "./apiClient";

// --- DTOs (mirror backend) ---
export interface SimCategoryDto {
  id: string;
  categoryCode: string;
  categoryName: string;
  description: string;
  valuationMultiplier: number;
}

export interface CreateCategoryPayload {
  categoryCode: string;
  categoryName: string;
  description?: string;
  valuationMultiplier?: number;
}

export interface UpdateCategoryPayload extends CreateCategoryPayload {
  id: string;
}

// --- API calls ---
export async function getCategories(): Promise<SimCategoryDto[]> {
  const res = await apiFetch<SimCategoryDto[]>("/Categories");
  return res.data ?? [];
}

export async function createCategory(payload: CreateCategoryPayload): Promise<SimCategoryDto> {
  const res = await apiFetch<SimCategoryDto>("/Categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.data) throw new Error(res.message || "Tao the loai that bai.");
  return res.data;
}

export async function updateCategory(
  id: string,
  payload: CreateCategoryPayload
): Promise<SimCategoryDto> {
  const res = await apiFetch<SimCategoryDto>(`/Categories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, id }),
  });
  if (!res.data) throw new Error(res.message || "Cap nhat that bai.");
  return res.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch<boolean>(`/Categories/${id}`, { method: "DELETE" });
}
