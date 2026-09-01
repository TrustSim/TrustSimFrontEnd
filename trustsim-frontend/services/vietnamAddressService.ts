export interface Province {
  code: number;
  name: string;
  division_type?: string;
  codename?: string;
  phone_code?: number;
}

export interface District {
  code: number;
  name: string;
  division_type?: string;
  codename?: string;
  province_code?: number;
}

export interface Ward {
  code: number;
  name: string;
  division_type?: string;
  codename?: string;
  district_code?: number;
}

const BASE_URL = "https://provinces.open-api.vn/api";

// Fallback data in case the external API is temporarily unreachable
export const FALLBACK_PROVINCES: Province[] = [
  { code: 1, name: "Thành phố Hà Nội" },
  { code: 79, name: "Thành phố Hồ Chí Minh" },
  { code: 48, name: "Thành phố Đà Nẵng" },
  { code: 31, name: "Thành phố Hải Phòng" },
  { code: 92, name: "Thành phố Cần Thơ" },
  { code: 75, name: "Tỉnh Đồng Nai" },
  { code: 74, name: "Tỉnh Bình Dương" },
  { code: 77, name: "Tỉnh Bà Rịa - Vũng Tàu" },
  { code: 56, name: "Tỉnh Khánh Hòa" },
  { code: 49, name: "Tỉnh Quảng Nam" },
];

/**
 * Fetch all 63 provinces/cities in Vietnam
 */
export async function getProvinces(): Promise<Province[]> {
  try {
    const res = await fetch(`${BASE_URL}/p/`, { cache: "force-cache" });
    if (!res.ok) throw new Error("Failed to fetch provinces");
    const data: Province[] = await res.json();
    return data;
  } catch (error) {
    console.warn("Using fallback provinces:", error);
    return FALLBACK_PROVINCES;
  }
}

/**
 * Fetch districts for a given province code
 */
export async function getDistricts(provinceCode: number): Promise<District[]> {
  if (!provinceCode) return [];
  try {
    const res = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`);
    if (!res.ok) throw new Error("Failed to fetch districts");
    const data = await res.json();
    return data.districts || [];
  } catch (error) {
    console.warn("Failed to fetch districts:", error);
    return [];
  }
}

/**
 * Fetch wards for a given district code
 */
export async function getWards(districtCode: number): Promise<Ward[]> {
  if (!districtCode) return [];
  try {
    const res = await fetch(`${BASE_URL}/d/${districtCode}?depth=2`);
    if (!res.ok) throw new Error("Failed to fetch wards");
    const data = await res.json();
    return data.wards || [];
  } catch (error) {
    console.warn("Failed to fetch wards:", error);
    return [];
  }
}
