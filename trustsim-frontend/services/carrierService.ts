import { apiFetch } from "./apiClient";

// --- DTOs (mirror backend) ---
export interface SimCarrierDto {
  id: string;
  carrierName: string;
  carrierCode: string;
  logoImg: string;
}

export interface CreateCarrierPayload {
  carrierName: string;
  carrierCode: string;
  logoImg?: string;
}

// --- API calls ---
export async function getCarriers(): Promise<SimCarrierDto[]> {
  const res = await apiFetch<SimCarrierDto[]>("/SimCarriers");
  return res.data ?? [];
}

export async function createCarrier(payload: CreateCarrierPayload): Promise<SimCarrierDto> {
  const res = await apiFetch<SimCarrierDto>("/SimCarriers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.data) throw new Error(res.message || "Tao nha mang that bai.");
  return res.data;
}

export async function updateCarrier(
  id: string,
  payload: CreateCarrierPayload
): Promise<SimCarrierDto> {
  const res = await apiFetch<SimCarrierDto>(`/SimCarriers/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, id }),
  });
  if (!res.data) throw new Error(res.message || "Cap nhat that bai.");
  return res.data;
}

export async function deleteCarrier(id: string): Promise<void> {
  await apiFetch<boolean>(`/SimCarriers/${id}`, { method: "DELETE" });
}
