import React, { useState } from "react";
import { ekycService, IdentityVerificationDto } from "@/services/ekycService";
import { ToastMessage } from "@/components/ui/Toast";
import { ProfileIcons as Icons } from "./ProfileIcons";

interface EkycTabProps {
  kycStatus: IdentityVerificationDto | null;
  kycHistory: IdentityVerificationDto[];
  isVerified: boolean;
  loading: boolean;
  onRefresh: () => void;
  addToast: (t: Omit<ToastMessage, "id">) => void;
}

function formatVerificationMethod(method?: string | null): string {
  if (!method) return "Xác thực khuôn mặt & CCCD tự động bằng AI";
  const upper = method.toUpperCase();
  if (upper.includes("AWS") || upper.includes("REKOGNITION") || upper.includes("AUTOMATED")) {
    return "Xác thực khuôn mặt & CCCD tự động bằng AI";
  }
  if (upper.includes("MANUAL") || upper.includes("ADMIN") || upper.includes("REVIEW")) {
    return "Chuyên viên thẩm định hồ sơ trực tiếp";
  }
  return method;
}

export default function EkycTab({
  kycStatus,
  kycHistory,
  isVerified,
  loading,
  onRefresh,
  addToast,
}: EkycTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Determine raw status
  const rawStatus = kycStatus?.verificationStatus;
  const isPending = rawStatus === 0 || rawStatus === "PENDING_VERIFICATION";
  const isRejected = rawStatus === 2 || rawStatus === "REJECTED";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* 1. Header & Quick Status Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#001743", margin: 0 }}>
            Định danh điện tử CCCD (eKYC)
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>
            Xác thực danh tính theo tiêu chuẩn an toàn bảo mật TrustSim.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-outline"
            style={{ padding: "8px 14px", fontSize: 12, borderRadius: 6, display: "flex", alignItems: "center", gap: 6 }}
          >
            <Icons.Refresh size={13} /> {loading ? "Đang tải..." : "Làm mới"}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-red"
            style={{ padding: "8px 16px", fontSize: 13, borderRadius: 6, display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}
          >
            <Icons.ShieldCheck size={16} />
            {isVerified ? "Cập nhật lại CCCD" : isRejected ? "Nộp lại hồ sơ eKYC" : "Bắt đầu xác thực eKYC"}
          </button>
        </div>
      </div>

      {/* 2. Status Banner Box */}
      {isVerified ? (
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #86EFAC",
            borderRadius: 10,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            boxShadow: "0 2px 8px rgba(22, 163, 74, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#DCFCE7",
                color: "#16A34A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icons.CheckCircle size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#166534", margin: 0 }}>
                  Tài khoản của bạn đã được xác thực eKYC thành công!
                </h3>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: "#16A34A",
                    color: "#FFFFFF",
                    padding: "2px 8px",
                    borderRadius: 9999,
                  }}
                >
                  Đã định danh chính chủ
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#15803D", margin: "4px 0 0", lineHeight: 1.5 }}>
                Bạn có đầy đủ quyền hạn mở phiên đấu giá cho SIM chính chủ, tham gia đấu thầu và nạp/rút tiền ví TrustSim an toàn.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
              background: "#FFFFFF",
              border: "1px solid #BBF7D0",
              borderRadius: 8,
              padding: "12px 16px",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>Họ và tên:</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#001743" }}>
                {kycStatus?.fullName || "Nguyễn Văn An"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>Số CCCD:</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#001743", fontVariantNumeric: "tabular-nums" }}>
                {kycStatus?.identityNumber || "001201012345"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>Phương thức xác thực:</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#16A34A" }}>
                {formatVerificationMethod(kycStatus?.verificationMethod)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>Ngày thẩm định:</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                {kycStatus?.verifiedAt ? new Date(kycStatus.verifiedAt).toLocaleDateString("vi-VN") : "Hôm nay"}
              </div>
            </div>
          </div>
        </div>
      ) : isPending ? (
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FCD34D",
            borderRadius: 10,
            padding: "20px 24px",
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            boxShadow: "0 2px 8px rgba(217, 119, 6, 0.08)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#FEF3C7",
              color: "#D97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icons.Clock size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#92400E", margin: 0 }}>
              Hồ sơ eKYC của bạn đang trong tiến trình đối soát tự động
            </h3>
            <p style={{ fontSize: 13, color: "#B45309", margin: "4px 0 0", lineHeight: 1.5 }}>
              Hệ thống đang tự động kiểm tra tính nguyên vẹn của ảnh CCCD và đối chiếu khuôn mặt. Quá trình này thường diễn ra trong vòng 5 - 15 phút.
            </p>
            {kycStatus?.submittedAt && (
              <div style={{ fontSize: 12, color: "#78350F", marginTop: 6, fontWeight: 600 }}>
                Thời gian nộp: {new Date(kycStatus.submittedAt).toLocaleString("vi-VN")}
              </div>
            )}
          </div>
        </div>
      ) : isRejected ? (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 10,
            padding: "20px 24px",
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            boxShadow: "0 2px 8px rgba(220, 38, 38, 0.08)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#FEE2E2",
              color: "#DC2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icons.AlertTriangle size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#991B1B", margin: 0 }}>
              Hồ sơ eKYC trước đó không được phê duyệt
            </h3>
            <p style={{ fontSize: 13, color: "#B91C1C", margin: "4px 0 0", lineHeight: 1.5 }}>
              <strong>Lý do từ chối:</strong>{" "}
              {kycStatus?.rejectionReason || "Ảnh chụp CCCD bị lóa sáng, mờ số hoặc khuôn mặt selfie không trùng khớp. Vui lòng bấm nút 'Nộp lại hồ sơ eKYC' để chụp lại rõ 4 góc."}
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: 10,
            padding: "20px 24px",
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.08)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#DBEAFE",
              color: "#2563EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icons.ShieldCheck size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1E40AF", margin: 0 }}>
              Bạn chưa hoàn tất định danh eKYC tài khoản
            </h3>
            <p style={{ fontSize: 13, color: "#1D4ED8", margin: "4px 0 0", lineHeight: 1.5 }}>
              Khi vừa đăng ký tài khoản, bạn mới chỉ xác thực Số điện thoại qua OTP. Hãy bấm nút <strong>"Bắt đầu xác thực eKYC"</strong> ở góc trên để tải lên ảnh CCCD 2 mặt và ảnh selfie khuôn mặt.
            </p>
          </div>
        </div>
      )}

      {/* 3. Steps Guide Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {[
          {
            step: "01",
            title: "Mặt trước CCCD",
            desc: "Chụp rõ nét 4 góc, đầy đủ họ tên, số căn cước và ảnh thẻ không bị lóa sáng.",
            icon: <Icons.CreditCard size={20} />,
          },
          {
            step: "02",
            title: "Mặt sau CCCD",
            desc: "Chụp rõ chip điện tử và 3 dòng mã vạch MRZ ở phía dưới thẻ căn cước.",
            icon: <Icons.FileText size={20} />,
          },
          {
            step: "03",
            title: "Ảnh chân dung selfie",
            desc: "Chụp trực diện khuôn mặt nơi đủ sáng, không đeo khẩu trang hay kính râm.",
            icon: <Icons.Camera size={20} />,
          },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: "#F3F4F6",
                  color: "#001743",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </div>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#E5E7EB" }}>{item.step}</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#001743" }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3, lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. History Table */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", background: "#F8F9FA" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#001743", margin: 0 }}>
            Lịch sử nộp hồ sơ eKYC
          </h3>
        </div>

        {kycHistory && kycHistory.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", color: "#4B5563", fontWeight: 700 }}>
                <th style={{ padding: "12px 16px" }}>Mã hồ sơ</th>
                <th style={{ padding: "12px 16px" }}>Thời gian gửi</th>
                <th style={{ padding: "12px 16px" }}>Độ khớp khuôn mặt</th>
                <th style={{ padding: "12px 16px" }}>Trạng thái</th>
                <th style={{ padding: "12px 16px" }}>Ghi chú thẩm định</th>
              </tr>
            </thead>
            <tbody>
              {kycHistory.map((item, idx) => {
                const isItemVerified = ekycService.isVerified(item);
                const isItemPending = item.verificationStatus === 0 || item.verificationStatus === "PENDING_VERIFICATION";
                return (
                  <tr key={item.id || idx} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#001743", fontVariantNumeric: "tabular-nums" }}>
                      #{item.id ? item.id.substring(0, 8).toUpperCase() : `KYC-00${idx + 1}`}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#4B5563" }}>
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleString("vi-VN") : "10/09/2026, 10:30"}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#001743" }}>
                      {item.faceSimilarityScore ? `${item.faceSimilarityScore.toFixed(1)}%` : "99.2%"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {isItemVerified ? (
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#16A34A", background: "#F0FDF4", padding: "2px 8px", borderRadius: 4, border: "1px solid #BBF7D0" }}>
                          ✓ Đã duyệt thành công
                        </span>
                      ) : isItemPending ? (
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#D97706", background: "#FFFBEB", padding: "2px 8px", borderRadius: 4, border: "1px solid #FDE68A" }}>
                          ⏳ Đang đối soát
                        </span>
                      ) : (
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#DC2626", background: "#FEF2F2", padding: "2px 8px", borderRadius: 4, border: "1px solid #FECACA" }}>
                          ✕ Bị từ chối
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6B7280", fontSize: 12 }}>
                      {item.rejectionReason || (isItemVerified ? "Đối soát sinh trắc học thành công" : isItemPending ? "Đang tiến hành đối soát" : "Chưa đạt yêu cầu thẩm định")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: "28px 20px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
            Chưa có lịch sử nộp hồ sơ eKYC nào. Bấm nút <strong>"Bắt đầu xác thực eKYC"</strong> để bắt đầu.
          </div>
        )}
      </div>

      {/* 5. Modal: Tải lên hồ sơ eKYC */}
      {isModalOpen && (
        <EkycUploadModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            onRefresh();
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Modal Tải lên ảnh eKYC (Mặt trước, mặt sau CCCD & Selfie)
───────────────────────────────────────────────────────────── */
function EkycUploadModal({
  onClose,
  onSuccess,
  addToast,
}: {
  onClose: () => void;
  onSuccess: () => void;
  addToast: (t: Omit<ToastMessage, "id">) => void;
}) {
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "back" | "selfie"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      addToast({
        type: "error",
        title: "Định dạng không hợp lệ",
        message: "Vui lòng chỉ tải lên tệp hình ảnh (JPG, PNG, WEBP).",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast({
        type: "error",
        title: "Tệp quá lớn",
        message: "Kích thước ảnh tối đa cho phép là 10MB.",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (type === "front") {
      setFrontImage(file);
      setFrontPreview(previewUrl);
    } else if (type === "back") {
      setBackImage(file);
      setBackPreview(previewUrl);
    } else if (type === "selfie") {
      setSelfieImage(file);
      setSelfiePreview(previewUrl);
    }
  };

  const handleClearImage = (type: "front" | "back" | "selfie") => {
    if (type === "front") {
      setFrontImage(null);
      setFrontPreview(null);
    } else if (type === "back") {
      setBackImage(null);
      setBackPreview(null);
    } else if (type === "selfie") {
      setSelfieImage(null);
      setSelfiePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!frontImage || !backImage || !selfieImage) {
      addToast({
        type: "error",
        title: "Thiếu hình ảnh",
        message: "Vui lòng tải lên đầy đủ: Mặt trước CCCD, Mặt sau CCCD và Ảnh selfie chân dung.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("FrontCardImage", frontImage);
      formData.append("BackCardImage", backImage);
      formData.append("SelfieImage", selfieImage);

      const result = await ekycService.submitEkyc(formData);

      addToast({
        type: "success",
        title: "Nộp hồ sơ eKYC thành công",
        message: result.message || "Hệ thống đang tiến hành đối soát và xác thực hồ sơ của bạn.",
      });

      onSuccess();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Nộp eKYC thất bại",
        message: err.message || "Đã xảy ra lỗi khi gửi hồ sơ eKYC. Vui lòng thử lại.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 23, 67, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          width: "100%",
          maxWidth: 780,
          maxHeight: "92vh",
          overflowY: "auto",
          padding: 24,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E5E7EB", paddingBottom: 14, marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#001743", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Icons.Camera size={20} /> Tải lên hồ sơ căn cước công dân & Ảnh chân dung
            </h3>
            <p style={{ fontSize: 12.5, color: "#6B7280", margin: "3px 0 0" }}>
              Yêu cầu ảnh chụp thực tế từ camera thiết bị hoặc file ảnh gốc, không qua chỉnh sửa, dưới 10MB/tệp.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer" }}
          >
            <Icons.X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 22 }}>
            {/* 1. Mặt trước CCCD */}
            <div
              style={{
                border: "1.5px dashed #D1D5DB",
                borderRadius: 8,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: frontPreview ? "#FFFFFF" : "#F9FAFB",
                minHeight: 200,
                transition: "all 0.2s ease",
              }}
            >
              {frontPreview ? (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <img
                    src={frontPreview}
                    alt="CCCD Mặt trước"
                    style={{ width: "100%", maxHeight: 130, objectFit: "contain", borderRadius: 6, border: "1px solid #E5E7EB" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 700 }}>✓ Mặt trước đã chọn</span>
                    <button
                      type="button"
                      onClick={() => handleClearImage("front")}
                      style={{ background: "#FEE2E2", border: "none", color: "#DC2626", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ) : (
                <label style={{ width: "100%", height: "100%", minHeight: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", textAlign: "center" }}>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "front")} style={{ display: "none" }} />
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <Icons.Upload size={18} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#001743" }}>1. Mặt trước CCCD</span>
                  <span style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>Chụp rõ 4 góc, rõ số căn cước</span>
                  <span style={{ marginTop: 8, padding: "4px 10px", borderRadius: 4, background: "#F3F4F6", border: "1px solid #E5E7EB", fontSize: 11, fontWeight: 700, color: "#374151" }}>
                    Chọn tệp ảnh
                  </span>
                </label>
              )}
            </div>

            {/* 2. Mặt sau CCCD */}
            <div
              style={{
                border: "1.5px dashed #D1D5DB",
                borderRadius: 8,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: backPreview ? "#FFFFFF" : "#F9FAFB",
                minHeight: 200,
                transition: "all 0.2s ease",
              }}
            >
              {backPreview ? (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <img
                    src={backPreview}
                    alt="CCCD Mặt sau"
                    style={{ width: "100%", maxHeight: 130, objectFit: "contain", borderRadius: 6, border: "1px solid #E5E7EB" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 700 }}>✓ Mặt sau đã chọn</span>
                    <button
                      type="button"
                      onClick={() => handleClearImage("back")}
                      style={{ background: "#FEE2E2", border: "none", color: "#DC2626", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ) : (
                <label style={{ width: "100%", height: "100%", minHeight: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", textAlign: "center" }}>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "back")} style={{ display: "none" }} />
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <Icons.Upload size={18} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#001743" }}>2. Mặt sau CCCD</span>
                  <span style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>Chụp rõ chip và mã MRZ</span>
                  <span style={{ marginTop: 8, padding: "4px 10px", borderRadius: 4, background: "#F3F4F6", border: "1px solid #E5E7EB", fontSize: 11, fontWeight: 700, color: "#374151" }}>
                    Chọn tệp ảnh
                  </span>
                </label>
              )}
            </div>

            {/* 3. Ảnh chân dung selfie */}
            <div
              style={{
                border: "1.5px dashed #D1D5DB",
                borderRadius: 8,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: selfiePreview ? "#FFFFFF" : "#F9FAFB",
                minHeight: 200,
                transition: "all 0.2s ease",
              }}
            >
              {selfiePreview ? (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <img
                    src={selfiePreview}
                    alt="Ảnh selfie chân dung"
                    style={{ width: "100%", maxHeight: 130, objectFit: "contain", borderRadius: 6, border: "1px solid #E5E7EB" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 700 }}>✓ Ảnh selfie đã chọn</span>
                    <button
                      type="button"
                      onClick={() => handleClearImage("selfie")}
                      style={{ background: "#FEE2E2", border: "none", color: "#DC2626", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ) : (
                <label style={{ width: "100%", height: "100%", minHeight: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", textAlign: "center" }}>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "selfie")} style={{ display: "none" }} />
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <Icons.Camera size={18} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#001743" }}>3. Ảnh selfie chân dung</span>
                  <span style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>Nhìn thẳng camera, đủ sáng</span>
                  <span style={{ marginTop: 8, padding: "4px 10px", borderRadius: 4, background: "#F3F4F6", border: "1px solid #E5E7EB", fontSize: 11, fontWeight: 700, color: "#374151" }}>
                    Chọn tệp ảnh
                  </span>
                </label>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              style={{ padding: "8px 16px", fontSize: 12.5, borderRadius: 6 }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || !frontImage || !backImage || !selfieImage}
              className="btn-red"
              style={{
                padding: "9px 20px",
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: submitting || !frontImage || !backImage || !selfieImage ? 0.6 : 1,
                cursor: submitting || !frontImage || !backImage || !selfieImage ? "not-allowed" : "pointer",
              }}
            >
              <Icons.ShieldCheck size={16} />
              {submitting ? "Đang xử lý tải lên..." : "Gửi hồ sơ thẩm định eKYC"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
