import { apiFetch } from "./apiClient";

export interface SimValuationDto {
  valuationId: string;
  simNumberId?: string;
  phoneNumber: string;
  formattedNumber: string;
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  retailPrice: number;
  p2pPrice: number;
  dealerPrice: number;
  totalPoints: number;
  prefixGroup: string;
  middleGroup: string;
  tailGroup: string;
  confidenceScore: number;
  baselinePrice: number;
  marketMultiplier: number;
  detectedRhythmName: string;
  detectedCategories: string[];
  valuationReasoning: string;
  fengShuiAnalysis?: string;
}

export const aiValuationService = {
  /**
   * Thẩm định & định giá SIM bằng AI (Mô hình Toán học + RAG + NVIDIA LLM)
   */
  async estimatePrice(params: { simNumberId?: string; phoneNumber?: string }): Promise<SimValuationDto> {
    const isGuid = (id?: string) =>
      Boolean(id && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id));

    const body: { simNumberId?: string; phoneNumber?: string } = {};
    if (params.phoneNumber) {
      body.phoneNumber = params.phoneNumber.replace(/\D/g, "");
    }
    if (isGuid(params.simNumberId)) {
      body.simNumberId = params.simNumberId;
    }

    const res = await apiFetch<SimValuationDto>("/ai/valuation/estimate", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.data) throw new Error(res.message || "Không thể định giá SIM lúc này.");
    return res.data;
  },
};
