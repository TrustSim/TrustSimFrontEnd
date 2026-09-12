import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

function toFriendlyErrorMessage(raw?: string): string {
  if (!raw) return "Tải ảnh lên không thành công. Vui lòng thử lại.";
  const lower = raw.toLowerCase();
  if (lower.includes("cloud_name") || lower.includes("cloud name")) {
    return "Tên Cloud Name trên Cloudinary chưa chính xác. Vui lòng kiểm tra lại mục 'Cloud name' trên trang Cloudinary Dashboard.";
  }
  if (lower.includes("api key") || lower.includes("must supply") || lower.includes("signature") || lower.includes("unknown")) {
    return "Thông tin xác thực Cloudinary chưa chính xác. Vui lòng kiểm tra lại API Key hoặc API Secret.";
  }
  if (lower.includes("format") || lower.includes("invalid") || lower.includes("corrupted") || lower.includes("unsupported")) {
    return "Định dạng tệp không được hỗ trợ hoặc tệp ảnh bị hỏng. Vui lòng chọn ảnh PNG, JPG, WEBP hoặc SVG.";
  }
  if (lower.includes("size") || lower.includes("large") || lower.includes("limit") || lower.includes("too big")) {
    return "Dung lượng tệp ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.";
  }
  return "Tải ảnh lên không thành công. Vui lòng thử lại với hình ảnh khác.";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return NextResponse.json({ success: false, error: "Vui lòng chọn tệp hình ảnh để tải lên" });
    }

    // Kiểm tra định dạng ảnh
    if (file.type && !file.type.startsWith("image/")) {
      return NextResponse.json({
        success: false,
        error: "Định dạng tệp không hợp lệ. Vui lòng chỉ chọn tệp hình ảnh (PNG, JPG, WEBP, SVG).",
      });
    }

    // Kiểm tra dung lượng (tối đa 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: "Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.",
      });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "591159175355924";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "6_ZIkAc_swLiBS0ZZ-RYLoqF7DU";
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "trustsim_preset";

    // ── 1. Thử tải lên Cloudinary nếu Cloud Name đã được cấu hình hợp lệ (khác placeholder 'TrustSim') ──
    const isPlaceholderCloudName = !cloudName || cloudName.trim().toLowerCase() === "trustsim";

    if (!isPlaceholderCloudName && apiKey && apiSecret) {
      try {
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append("file", file);
        cloudinaryFormData.append("folder", folder);

        const timestamp = Math.floor(Date.now() / 1000).toString();
        const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

        cloudinaryFormData.append("api_key", apiKey);
        cloudinaryFormData.append("timestamp", timestamp);
        cloudinaryFormData.append("signature", signature);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: cloudinaryFormData,
        });

        const data = await uploadRes.json();

        if (uploadRes.ok && data.secure_url) {
          return NextResponse.json({
            success: true,
            url: data.secure_url,
            publicId: data.public_id,
            provider: "cloudinary",
          });
        }

        console.warn("[Cloudinary] Upload failed:", data?.error?.message);
      } catch (cloudErr) {
        console.warn("[Cloudinary] Request error, falling back to local storage:", cloudErr);
      }
    }

    // ── 2. Fallback: Lưu trữ cục bộ trong public/uploads để đảm bảo người dùng luôn upload thành công ──
    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Xác định đuôi file
      const rawExt = path.extname(file.name || "").toLowerCase();
      const validExt = [".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(rawExt)
        ? rawExt
        : file.type === "image/png"
        ? ".png"
        : file.type === "image/webp"
        ? ".webp"
        : file.type === "image/svg+xml"
        ? ".svg"
        : ".jpg";

      const uniqueSuffix = `${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
      const filename = `${uniqueSuffix}${validExt}`;

      const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
      await mkdir(uploadsDir, { recursive: true });

      const filepath = path.join(uploadsDir, filename);
      await writeFile(filepath, buffer);

      const localUrl = `/uploads/${folder}/${filename}`;
      return NextResponse.json({
        success: true,
        url: localUrl,
        provider: "local",
      });
    } catch (fsErr) {
      console.warn("[Upload] Local disk write failed, falling back to Base64 data-url:", fsErr);

      // ── 3. Fallback cuối cùng: Base64 Data URL nếu môi trường không cho ghi disk ──
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      const mimeType = file.type || "image/png";
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return NextResponse.json({
        success: true,
        url: dataUrl,
        provider: "data-url",
      });
    }
  } catch (err: any) {
    console.error("[Upload] Critical route error:", err);
    return NextResponse.json({
      success: false,
      error: toFriendlyErrorMessage(err?.message),
    });
  }
}
