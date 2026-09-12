/**
 * Cloudinary Upload Service
 * Hỗ trợ upload ảnh logo nhà mạng và avatar người dùng lên Cloudinary CDN
 */

export interface CloudinaryUploadResponse {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

function sanitizeErrorMessage(msg?: string): string {
  if (!msg) return "Tải ảnh lên không thành công. Vui lòng thử lại.";
  const lower = msg.toLowerCase();
  if (lower.includes("api key") || lower.includes("must supply") || lower.includes("signature") || lower.includes("unknown") || lower.includes("cloud_name")) {
    return "Tải ảnh lên không thành công do hệ thống máy chủ ảnh đang xác thực. Vui lòng thử lại sau.";
  }
  if (lower.includes("format") || lower.includes("invalid") || lower.includes("corrupted")) {
    return "Định dạng tệp không được hỗ trợ hoặc tệp ảnh bị hỏng. Vui lòng chọn ảnh PNG, JPG hoặc WEBP.";
  }
  if (lower.includes("size") || lower.includes("large") || lower.includes("limit")) {
    return "Dung lượng tệp ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.";
  }
  return msg;
}

export async function uploadImageToCloudinary(
  file: File | Blob,
  folder: "carriers" | "avatars" | "general" = "general"
): Promise<CloudinaryUploadResponse> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (data.success && data.url) {
      return { success: true, url: data.url, publicId: data.publicId };
    }

    return {
      success: false,
      error: sanitizeErrorMessage(data.error || "Tải ảnh lên không thành công. Vui lòng thử lại."),
    };
  } catch (err: any) {
    return {
      success: false,
      error: sanitizeErrorMessage(err?.message),
    };
  }
}
