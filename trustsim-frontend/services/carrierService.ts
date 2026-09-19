import { apiFetch } from "./apiClient";

// --- DTOs (mirror backend) ---
export interface SimCarrierDto {
  id: string;
  carrierName: string;
  carrierCode: string;
  logoImg: string;
  prefixes?: PhonePrefixDto[];
}

export interface PhonePrefixDto {
  id: string;
  prefixValue: string;
  simCarrierId: string;
  carrierName?: string;
}

export interface CreateCarrierPayload {
  carrierName: string;
  carrierCode: string;
  logoImg?: string;
}

export interface CreatePrefixPayload {
  prefixValue: string;
  simCarrierId: string;
}

export interface UpdatePrefixPayload {
  prefixValue: string;
  simCarrierId: string;
}

// --- Carrier API calls ---
export async function getCarriers(): Promise<SimCarrierDto[]> {
  const res = await apiFetch<SimCarrierDto[]>("/Carriers");
  return res.data ?? [];
}

export async function createCarrier(payload: CreateCarrierPayload): Promise<SimCarrierDto> {
  const res = await apiFetch<SimCarrierDto>("/Carriers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.data) throw new Error(res.message || "Tạo nhà mạng thất bại.");
  return res.data;
}

export async function updateCarrier(
  id: string,
  payload: CreateCarrierPayload
): Promise<SimCarrierDto> {
  const res = await apiFetch<SimCarrierDto>(`/Carriers/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, id }),
  });
  if (!res.data) throw new Error(res.message || "Cập nhật nhà mạng thất bại.");
  return res.data;
}

export async function deleteCarrier(id: string): Promise<void> {
  await apiFetch<boolean>(`/Carriers/${id}`, { method: "DELETE" });
}

// --- Phone Prefix API calls ---
export async function getPrefixes(carrierId?: string): Promise<PhonePrefixDto[]> {
  const query = carrierId ? `?carrierId=${encodeURIComponent(carrierId)}` : "";
  const res = await apiFetch<PhonePrefixDto[]>(`/PhonePrefixes${query}`);
  return res.data ?? [];
}

export async function createPrefix(payload: CreatePrefixPayload): Promise<PhonePrefixDto> {
  const res = await apiFetch<PhonePrefixDto>("/PhonePrefixes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.data) throw new Error(res.message || "Thêm đầu số thất bại.");
  return res.data;
}

export async function updatePrefix(
  id: string,
  payload: UpdatePrefixPayload
): Promise<PhonePrefixDto> {
  const res = await apiFetch<PhonePrefixDto>(`/PhonePrefixes/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, id }),
  });
  if (!res.data) throw new Error(res.message || "Cập nhật đầu số thất bại.");
  return res.data;
}

export async function deletePrefix(id: string): Promise<void> {
  const res = await apiFetch<boolean>(`/PhonePrefixes/${id}`, {
    method: "DELETE",
  });
  if (res.success === false) {
    throw new Error(res.message || "Xóa đầu số thất bại.");
  }
}
