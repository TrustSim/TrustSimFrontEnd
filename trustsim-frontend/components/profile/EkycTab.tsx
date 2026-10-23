import React, { useState, useEffect, useRef, useCallback } from "react";
import { ekycService, EkycVerificationResultDto, IdentityVerificationDto } from "@/services/ekycService";
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
            disabled={isPending || loading}
            className="btn-red"
            style={{ padding: "8px 16px", fontSize: 13, borderRadius: 6, display: "flex", alignItems: "center", gap: 6, fontWeight: 700, opacity: isPending || loading ? 0.55 : 1, cursor: isPending || loading ? "not-allowed" : "pointer" }}
          >
            <Icons.ShieldCheck size={16} />
            {isVerified ? "Cập nhật lại CCCD" : isRejected ? "Nộp lại hồ sơ eKYC" : isPending ? "Đang chờ xác minh" : "Bắt đầu xác thực eKYC"}
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
            desc: "Chụp bằng camera hoặc tải ảnh từ thiết bị, rõ 4 góc, đầy đủ họ tên, số căn cước.",
            icon: <Icons.CreditCard size={20} />,
          },
          {
            step: "02",
            title: "Mặt sau CCCD",
            desc: "Chụp bằng camera hoặc tải ảnh từ thiết bị, rõ chip điện tử và 3 dòng mã vạch MRZ.",
            icon: <Icons.FileText size={20} />,
          },
          {
            step: "03",
            title: "Ảnh chân dung khuôn mặt",
            desc: "Bắt buộc chụp trực tiếp qua camera, nhìn thẳng đủ sáng, không sử dụng ảnh tải từ máy.",
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

      {/* 5. Modal: Wizard xác thực eKYC 3 bước */}
      {isModalOpen && (
        <EkycWizardModal
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
   Component chụp ảnh trực tiếp bằng Camera với khung căn chỉnh
───────────────────────────────────────────────────────────── */
interface CameraCaptureProps {
  mode: "card" | "face";
  facingMode?: "environment" | "user";
  fileName: string;
  onCapture: (file: File, previewUrl: string) => void;
  helperText: string;
}

function CameraCapture({
  mode,
  facingMode = "user",
  fileName,
  onCapture,
  helperText,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const reactId = React.useId();
  const maskId = `camera-mask-${mode}-${reactId.replace(/:/g, "")}`;

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setCameraError(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Trình duyệt không hỗ trợ truy cập máy ảnh.");
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode === "environment" ? { ideal: "environment" } : "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = newStream;

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError(
          "Quyền truy cập máy ảnh bị từ chối. Vui lòng cho phép truy cập camera trong cài đặt trình duyệt để tiếp tục."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("Không tìm thấy thiết bị camera trên máy của bạn.");
      } else {
        setCameraError(err.message || "Không thể khởi động camera. Vui lòng kiểm tra lại.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopStream();
    };
  }, [startCamera, stopStream]);

  const handleTakePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Nếu là camera trước chụp mặt, lật ảnh lại cho tự nhiên như gương
    if (mode === "face" && facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], fileName, { type: "image/jpeg" });
        const previewUrl = URL.createObjectURL(blob);
        stopStream();
        onCapture(file, previewUrl);
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      {/* 1. Khung Camera Preview rộng rãi (chiều cao 370px, thoải mái căn chỉnh khuôn mặt) */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 370,
          background: "#000000",
          borderRadius: 8,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
        }}
      >
        {isLoading && (
          <div style={{ color: "#FFFFFF", fontSize: 13, display: "flex", alignItems: "center", gap: 8, zIndex: 10 }}>
            <Icons.Refresh size={18} /> Đang khởi động camera...
          </div>
        )}

        {cameraError ? (
          <div
            style={{
              padding: 20,
              textAlign: "center",
              color: "#FFFFFF",
              maxWidth: 420,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              zIndex: 10,
            }}
          >
            <div style={{ color: "#EF4444" }}>
              <Icons.AlertTriangle size={30} />
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>{cameraError}</div>
            <button
              type="button"
              onClick={startCamera}
              className="btn-outline"
              style={{
                marginTop: 4,
                padding: "6px 14px",
                fontSize: 12,
                borderRadius: 6,
                background: "rgba(255,255,255,0.15)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.3)",
                cursor: "pointer",
              }}
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: mode === "face" && facingMode === "user" ? "scaleX(-1)" : "none",
              }}
            />

            {/* Khung hướng dẫn: Oval khuôn mặt chuẩn tỷ lệ chân dung hoặc Khung CCCD */}
            {mode === "face" ? (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 220,
                  height: 290,
                  maxWidth: "85%",
                  maxHeight: "85%",
                  borderRadius: "50%",
                  border: "2.5px dashed rgba(255, 255, 255, 0.9)",
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65)",
                  pointerEvents: "none",
                  zIndex: 4,
                  transition: "all 0.2s ease",
                }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 440,
                  height: 275,
                  maxWidth: "90%",
                  maxHeight: "85%",
                  borderRadius: 10,
                  border: "2px dashed rgba(255, 255, 255, 0.85)",
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65)",
                  pointerEvents: "none",
                  zIndex: 4,
                }}
              >
                {/* 4 góc viền trắng điểm nhấn CCCD */}
                <div style={{ position: "absolute", top: -2, left: -2, width: 22, height: 22, borderTop: "3.5px solid #FFFFFF", borderLeft: "3.5px solid #FFFFFF", borderTopLeftRadius: 10 }} />
                <div style={{ position: "absolute", top: -2, right: -2, width: 22, height: 22, borderTop: "3.5px solid #FFFFFF", borderRight: "3.5px solid #FFFFFF", borderTopRightRadius: 10 }} />
                <div style={{ position: "absolute", bottom: -2, left: -2, width: 22, height: 22, borderBottom: "3.5px solid #FFFFFF", borderLeft: "3.5px solid #FFFFFF", borderBottomLeftRadius: 10 }} />
                <div style={{ position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderBottom: "3.5px solid #FFFFFF", borderRight: "3.5px solid #FFFFFF", borderBottomRightRadius: 10 }} />
              </div>
            )}

            {/* Dòng hướng dẫn dạng Pill trên nền đen mờ 70% */}
            <div
              style={{
                position: "absolute",
                top: 14,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                pointerEvents: "none",
                zIndex: 10,
                padding: "0 16px",
              }}
            >
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.7)",
                  color: "#FFFFFF",
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: "6px 16px",
                  borderRadius: 9999,
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                  textAlign: "center",
                }}
              >
                {helperText}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. Nút bấm chụp ảnh TÁCH BIỆT DƯỚI CAMERA: Không bị đè lên góc cam, không bị che khuất */}
      {!cameraError && !isLoading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 14,
            width: "100%",
          }}
        >
          <button
            type="button"
            onClick={handleTakePhoto}
            className="btn-red"
            style={{
              background: "#E4011E",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 9999,
              padding: "10px 32px",
              fontSize: 13.5,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(228, 1, 30, 0.35)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Icons.Camera size={18} />
            Chụp ảnh
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Modal Wizard xác thực eKYC 3 bước
   - Bước 1: Mặt trước CCCD (Camera hoặc Tải ảnh)
   - Bước 2: Mặt sau CCCD (Camera hoặc Tải ảnh)
   - Bước 3: Ảnh chân dung selfie (Bắt buộc Camera)
───────────────────────────────────────────────────────────── */
function EkycWizardModal({
  onClose,
  onSuccess,
  addToast,
}: {
  onClose: () => void;
  onSuccess: () => void;
  addToast: (t: Omit<ToastMessage, "id">) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const modalContentRef = useRef<HTMLDivElement | null>(null);

  // Ảnh mặt trước
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [frontMode, setFrontMode] = useState<"camera" | "upload">("upload");

  // Ảnh mặt sau
  const [backImage, setBackImage] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [backMode, setBackMode] = useState<"camera" | "upload">("upload");

  // Ảnh chân dung (Bắt buộc Camera)
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EkycVerificationResultDto | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    title: string;
    message: string;
    advice?: string;
    targetStep?: number;
    extractedData?: {
      label: string;
      cardValue?: string;
      profileValue?: string;
    };
  } | null>(null);

  // Xử lý khi người dùng chọn file từ máy (Bước 1 hoặc 2)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "back"
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
    } else {
      setBackImage(file);
      setBackPreview(previewUrl);
    }
  };

  // Nộp hồ sơ sau khi hoàn tất cả 3 bước
  const handleSubmitAll = async () => {
    if (!frontImage || !backImage || !selfieImage) {
      const msg = "Vui lòng hoàn thành đủ cả 3 bước: Mặt trước, Mặt sau và Ảnh chân dung khuôn mặt.";
      setErrorDetails({
        title: "Chưa hoàn tất hồ sơ",
        message: msg,
        advice: "Hãy đảm bảo cả 3 bước đều có ảnh hợp lệ trước khi gửi thẩm định.",
      });
      addToast({
        type: "error",
        title: "Chưa hoàn tất hồ sơ",
        message: msg,
      });
      return;
    }

    setSubmitting(true);
    setErrorDetails(null);
    try {
      const formData = new FormData();
      formData.append("FrontCardImage", frontImage);
      formData.append("BackCardImage", backImage);
      formData.append("SelfieImage", selfieImage);

      const result = await ekycService.submitEkyc(formData);

      setAnalysisResult(result);
      addToast({
        type: "info",
        title: "Phân tích eKYC hoàn tất",
        message: "Vui lòng kiểm tra dữ liệu trích xuất và xác nhận để hoàn tất định danh.",
      });
    } catch (err: any) {
      console.error("eKYC submit error:", err);
      let title = "Xác thực eKYC không thành công";
      let msg = err.message || "Đã xảy ra lỗi khi gửi hồ sơ eKYC. Vui lòng thử lại.";
      let advice: string | undefined = "Vui lòng kiểm tra lại hình ảnh và thực hiện lại.";
      let targetStep: number | undefined = undefined;
      let extractedData: { label: string; cardValue?: string; profileValue?: string } | undefined = undefined;

      const rawMsg = (err.message || "").toLowerCase();
      const status = err.status;

      // 1. Số CCCD trên hình ảnh không khớp với hồ sơ cá nhân (IdentityNumberMismatchException)
      if (
        rawMsg.includes("số cmnd/cccd trên hình ảnh") ||
        (rawMsg.includes("cmnd/cccd") && rawMsg.includes("hồ sơ cá nhân")) ||
        rawMsg.includes("identitynumbermismatch")
      ) {
        title = "Số CCCD trên ảnh không khớp với hồ sơ cá nhân";
        targetStep = 1;
        // Trích xuất 2 số từ thông điệp backend: Số CMND/CCCD trên hình ảnh (087204005634) không trùng khớp với số CMND/CCCD trong hồ sơ cá nhân (001098004444).
        const match = (err.message || "").match(/\(([^)]+)\).*?\(([^)]+)\)/);
        if (match) {
          extractedData = {
            label: "Số CMND/CCCD",
            cardValue: match[1],
            profileValue: match[2],
          };
        }
        msg = err.message || "Số CMND/CCCD trên hình ảnh thẻ vừa chụp không trùng khớp với số CMND/CCCD đã lưu trong hồ sơ tài khoản.";
        advice = "💡 Thẻ CCCD bạn vừa chụp không thuộc về chủ tài khoản này. Vui lòng bấm 'Quay lại Bước 1' bên dưới để chụp đúng thẻ CCCD chính chủ đã đăng ký trên hệ thống.";
      }
      // 2. Họ và tên trên thẻ CCCD không khớp với hồ sơ cá nhân (IdentityNameMismatchException)
      else if (
        rawMsg.includes("họ và tên trên thẻ cccd") ||
        (rawMsg.includes("họ và tên") && rawMsg.includes("hồ sơ cá nhân")) ||
        rawMsg.includes("identitynamemismatch")
      ) {
        title = "Họ và tên trên ảnh thẻ không khớp với hồ sơ";
        targetStep = 1;
        const match = (err.message || "").match(/\(([^)]+)\).*?\(([^)]+)\)/);
        if (match) {
          extractedData = {
            label: "Họ và tên",
            cardValue: match[1],
            profileValue: match[2],
          };
        }
        msg = err.message || "Họ và tên trên thẻ CCCD không trùng khớp với họ và tên trong hồ sơ tài khoản.";
        advice = "💡 Vui lòng bấm 'Quay lại Bước 1' để chụp thẻ CCCD chính chủ có họ tên trùng khớp với tài khoản.";
      }
      // 3. Khuôn mặt selfie không trùng khớp với ảnh CCCD (KycFaceMismatchException)
      else if (
        rawMsg.includes("khuôn mặt trong ảnh chân dung") ||
        rawMsg.includes("ảnh chân dung selfie không trùng khớp") ||
        rawMsg.includes("độ tương đồng:") ||
        rawMsg.includes("facemismatch")
      ) {
        title = "Khuôn mặt selfie không trùng khớp với ảnh CCCD";
        targetStep = 3;
        msg = err.message || "Khuôn mặt trong ảnh chân dung selfie không đạt độ tương đồng yêu cầu với ảnh chân dung trên thẻ CCCD.";
        advice = "💡 Hướng dẫn: Đảm bảo người chụp chân dung và người trên thẻ CCCD là cùng một người. Nhìn thẳng vào camera nơi đủ sáng, không đeo khẩu trang hay kính râm.";
      }
      // 4. Tài khoản đã xác thực trước đó (IdentityAlreadyVerifiedException - 409)
      else if (
        rawMsg.includes("đã được xác thực") ||
        rawMsg.includes("trước đó") ||
        rawMsg.includes("identityalreadyverified") ||
        rawMsg.includes("đã hoàn tất xác minh")
      ) {
        title = "Tài khoản đã hoàn tất xác thực eKYC (Mã 409)";
        msg = "Tài khoản của bạn đã được xác minh danh tính eKYC thành công trước đó. Hệ thống không cho phép gửi lại hồ sơ để bảo vệ an toàn danh tính.";
        advice = "💡 Nếu bạn muốn kiểm thử quy trình eKYC bằng camera, vui lòng đăng nhập bằng một tài khoản mới chưa xác thực (hoặc nhờ admin đặt lại trạng thái).";
      }
      // 5. Số CCCD đã được tài khoản khác sử dụng (DuplicateIdentityNumberException - 409)
      else if (
        rawMsg.includes("đã được sử dụng") ||
        rawMsg.includes("liên kết với một tài khoản khác") ||
        rawMsg.includes("duplicate")
      ) {
        title = "Số CCCD đã tồn tại trong hệ thống (Mã 409)";
        targetStep = 1;
        msg = err.message || "Số CMND/CCCD này đã được liên kết với một tài khoản khác trong hệ thống TrustSim.";
        advice = "💡 Mỗi số CCCD chỉ được liên kết với một tài khoản duy nhất. Vui lòng kiểm tra lại ảnh chụp thẻ CCCD của bạn.";
      }
      // 6. Ảnh mờ / Không đọc được số CCCD (InvalidIdentityDocumentException / KycImageQualityException - 400)
      else if (
        rawMsg.includes("không thể đọc") ||
        rawMsg.includes("chất lượng") ||
        rawMsg.includes("mờ")
      ) {
        title = "Chất lượng hình ảnh chưa đạt yêu cầu";
        targetStep = rawMsg.includes("selfie") ? 3 : 1;
        msg = err.message || "Hệ thống AI không nhận diện được số CCCD hoặc khuôn mặt do ảnh chụp bị mờ hoặc lóa sáng.";
        advice = "💡 Hãy đặt thẻ CCCD trên mặt phẳng, đủ ánh sáng, không bị bóng lóa và chụp rõ nét toàn bộ 4 góc thẻ.";
      }
      // 7. Lỗi 409 khác
      else if (status === 409) {
        title = "Xung đột hồ sơ eKYC (Mã lỗi 409)";
        msg = err.message || "Hồ sơ eKYC bị xung đột với dữ liệu hiện có trên hệ thống.";
        advice = "💡 Tài khoản có thể đã được xác minh trước đó hoặc số CCCD đã được sử dụng.";
      }

      setErrorDetails({ title, message: msg, advice, targetStep, extractedData });
      // Cuộn lên đầu modal để người dùng nhìn thấy thông báo lỗi ngay lập tức
      setTimeout(() => {
        modalContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);

      addToast({
        type: "error",
        title: title,
        message: msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmEkyc = async () => {
    if (!analysisResult?.verificationId) return;
    setConfirming(true);
    setErrorDetails(null);
    try {
      await ekycService.confirmEkyc(analysisResult.verificationId);
      addToast({
        type: "success",
        title: "Xác thực eKYC thành công",
        message: "Hồ sơ định danh và chữ ký số của bạn đã được kích hoạt.",
      });
      onSuccess();
    } catch (err: any) {
      setErrorDetails({
        title: "Không thể xác nhận eKYC",
        message: err?.message || "Yêu cầu xác nhận không thành công. Vui lòng thử lại.",
      });
    } finally {
      setConfirming(false);
    }
  };

  const stepsMeta = [
    {
      num: 1,
      label: "Mặt trước CCCD",
      isDone: !!frontImage && errorDetails?.targetStep !== 1,
      hasError: errorDetails?.targetStep === 1,
    },
    {
      num: 2,
      label: "Mặt sau CCCD",
      isDone: !!backImage && errorDetails?.targetStep !== 2,
      hasError: errorDetails?.targetStep === 2,
    },
    {
      num: 3,
      label: "Chân dung khuôn mặt",
      isDone: !!selfieImage && errorDetails?.targetStep !== 3,
      hasError: errorDetails?.targetStep === 3,
    },
  ];

  return (
    <div
      className="profile-modal-backdrop profile-kyc-modal"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 23, 67, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999, // Đảm bảo đè lên Navbar (zIndex 1000)
        padding: "20px 16px",
      }}
    >
      <div
        className="profile-modal-panel"
        style={{
          background: "#FFFFFF",
          borderRadius: 8,
          width: "100%",
          maxWidth: 680,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
          border: "1px solid #E5E7EB",
          overflow: "hidden", // Cố định header và sticky footer, cuộn nội dung ở giữa
        }}
      >
        {/* 1. Header & Stepper cố định ở trên cùng */}
        <div
          style={{
            padding: "16px 24px 12px",
            borderBottom: "1px solid #E5E7EB",
            background: "#FFFFFF",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#001743", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Icons.ShieldCheck size={20} /> Xác thực danh tính điện tử eKYC
              </h3>
              <p style={{ fontSize: 12, color: "#6B7280", margin: "3px 0 0" }}>
                Quy trình 3 bước đảm bảo tính xác thực và an toàn danh tính chính chủ.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", padding: 4 }}
            >
              <Icons.X size={20} />
            </button>
          </div>

          {/* Stepper Bar: Hiển thị trạng thái các bước, tô đỏ cảnh báo nếu bước nào bị lỗi */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 14px",
              background: "#F8F9FA",
              borderRadius: 6,
              border: "1px solid #E5E7EB",
            }}
          >
            {stepsMeta.map((s, idx) => {
              const isCurrent = step === s.num;
              return (
                <React.Fragment key={s.num}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                    onClick={() => setStep(s.num as 1 | 2 | 3)}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 800,
                        background: s.hasError
                          ? "#DC2626"
                          : s.isDone
                          ? "#16A34A"
                          : isCurrent
                          ? "#001743"
                          : "#E5E7EB",
                        color: s.hasError || s.isDone || isCurrent ? "#FFFFFF" : "#6B7280",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {s.hasError ? (
                        <Icons.AlertTriangle size={13} />
                      ) : s.isDone ? (
                        <Icons.Check size={13} />
                      ) : (
                        s.num
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: isCurrent || s.hasError ? 800 : 600,
                          color: s.hasError
                            ? "#DC2626"
                            : isCurrent
                            ? "#001743"
                            : s.isDone
                            ? "#16A34A"
                            : "#6B7280",
                        }}
                      >
                        {s.label}
                      </span>
                      {s.hasError && (
                        <span style={{ fontSize: 10, color: "#DC2626", fontWeight: 700 }}>
                          (Chụp lại)
                        </span>
                      )}
                      {s.num === 3 && !s.hasError && (
                        <span style={{ color: isCurrent ? "#001743" : s.isDone ? "#16A34A" : "#9CA3AF", display: "flex" }}>
                          <Icons.Camera size={13} />
                        </span>
                      )}
                    </div>
                  </div>
                  {idx < stepsMeta.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        background: s.isDone && !s.hasError ? "#16A34A" : "#E5E7EB",
                        margin: "0 10px",
                        transition: "background 0.2s ease",
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* 2. Vùng chứa nội dung cuộn tự do (max-height thích ứng, không bị cấn footer) */}
        <div
          ref={modalContentRef}
          style={{
            flex: 1,
            overflowY: "auto",
            maxHeight: "calc(92vh - 150px)",
            padding: "16px 24px 20px",
          }}
        >
          {/* Hộp cảnh báo lỗi chi tiết khi xác thực thất bại (409 Conflict, 400 Mismatch...) */}
          {errorDetails && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1.5px solid #FCA5A5",
                borderRadius: 8,
                padding: "16px 18px",
                marginBottom: 18,
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.08)",
              }}
            >
              <div style={{ color: "#DC2626", marginTop: 2, flexShrink: 0 }}>
                <Icons.AlertTriangle size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      background: "#DC2626",
                      color: "#FFFFFF",
                      padding: "2px 8px",
                      borderRadius: 4,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    {errorDetails.targetStep === 1
                      ? "Lỗi đối soát CCCD"
                      : errorDetails.targetStep === 3
                      ? "Lỗi so khớp khuôn mặt"
                      : "Lỗi xác thực eKYC"}
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#991B1B" }}>
                    {errorDetails.title}
                  </div>
                </div>

                <div style={{ fontSize: 13, color: "#B91C1C", marginTop: 6, lineHeight: 1.5 }}>
                  {errorDetails.message}
                </div>

                {/* Bảng so sánh trực quan nếu có dữ liệu đối soát không khớp (Số CCCD hoặc Họ tên) */}
                {errorDetails.extractedData && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      marginTop: 10,
                      background: "#FFFFFF",
                      padding: "10px 14px",
                      borderRadius: 6,
                      border: "1px solid #FECACA",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 700 }}>
                        {errorDetails.extractedData.label} trên ảnh CCCD vừa chụp:
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: "#DC2626", marginTop: 3, fontFamily: "monospace" }}>
                        {errorDetails.extractedData.cardValue}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 700 }}>
                        {errorDetails.extractedData.label} lưu trong hồ sơ tài khoản:
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: "#001743", marginTop: 3, fontFamily: "monospace" }}>
                        {errorDetails.extractedData.profileValue}
                      </div>
                    </div>
                  </div>
                )}

                {errorDetails.advice && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#7F1D1D",
                      marginTop: 10,
                      fontWeight: 600,
                      background: "#FEE2E2",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #FECACA",
                      lineHeight: 1.4,
                    }}
                  >
                    {errorDetails.advice}
                  </div>
                )}

                {/* Nút hành động nhanh để quay lại bước bị lỗi và chụp lại */}
                {errorDetails.targetStep && (
                  <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const target = errorDetails.targetStep as 1 | 2 | 3;
                        setStep(target);
                        if (target === 1) {
                          setFrontImage(null);
                          setFrontPreview(null);
                        } else if (target === 2) {
                          setBackImage(null);
                          setBackPreview(null);
                        } else if (target === 3) {
                          setSelfieImage(null);
                          setSelfiePreview(null);
                        }
                      }}
                      className="btn-red"
                      style={{
                        padding: "7px 16px",
                        fontSize: 12,
                        fontWeight: 700,
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                      }}
                    >
                      <Icons.Refresh size={14} />
                      Quay lại Bước {errorDetails.targetStep} để chụp lại ngay
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setErrorDetails(null)}
                style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", padding: 2 }}
              >
                <Icons.X size={16} />
              </button>
            </div>
          )}

          {analysisResult && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ padding: 16, borderRadius: 8, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <h4 style={{ margin: 0, color: "#166534", fontSize: 15, fontWeight: 800 }}>
                  AI đã phân tích hồ sơ — vui lòng kiểm tra trước khi xác nhận
                </h4>
                <p style={{ margin: "6px 0 0", color: "#4B5563", fontSize: 12.5, lineHeight: 1.6 }}>
                  Bước xác nhận chỉ gửi mã hồ sơ <strong>{analysisResult.verificationId}</strong>. Dữ liệu cá nhân bên dưới được backend đọc từ kết quả OCR đã lưu và không thể bị sửa trên trình duyệt.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                {[
                  ["Họ và tên", analysisResult.extractedFullName || "Chưa nhận diện"],
                  ["Số CCCD", analysisResult.extractedIdentityNumber || "Chưa nhận diện"],
                  ["Ngày sinh", analysisResult.extractedDateOfBirth ? new Date(analysisResult.extractedDateOfBirth).toLocaleDateString("vi-VN") : "Chưa nhận diện"],
                  ["Độ tương đồng khuôn mặt", `${Number(analysisResult.faceSimilarityScore || 0).toFixed(2)}%`],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: "12px 14px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#FFFFFF" }}>
                    <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
                    <div style={{ marginTop: 5, fontSize: 14, color: "#001743", fontWeight: 800 }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "12px 14px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#F8FAFC" }}>
                <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 700, textTransform: "uppercase" }}>Địa chỉ thường trú</div>
                <div style={{ marginTop: 5, fontSize: 13, color: "#001743", fontWeight: 700 }}>{analysisResult.extractedAddress || "Chưa nhận diện"}</div>
              </div>
            </div>
          )}

          {!analysisResult && step === 1 && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h4 style={{ fontSize: 14.5, fontWeight: 800, color: "#001743", margin: 0 }}>
                      Bước 1: Ảnh mặt trước CCCD / CMND
                    </h4>
                    <p style={{ fontSize: 12, color: "#6B7280", margin: "3px 0 0" }}>
                      Yêu cầu ảnh chụp rõ 4 góc, đầy đủ họ tên, ngày sinh, số căn cước và không bị lóa sáng.
                    </p>
                  </div>
                  {!frontPreview && (
                    <div style={{ display: "flex", gap: 6, background: "#F3F4F6", padding: 3, borderRadius: 6 }}>
                      <button
                        type="button"
                        onClick={() => setFrontMode("upload")}
                        style={{
                          padding: "4px 10px",
                          fontSize: 12,
                          fontWeight: frontMode === "upload" ? 700 : 500,
                          background: frontMode === "upload" ? "#FFFFFF" : "transparent",
                          color: frontMode === "upload" ? "#001743" : "#6B7280",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          boxShadow: frontMode === "upload" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Icons.Upload size={13} /> Tải ảnh từ máy
                      </button>
                      <button
                        type="button"
                        onClick={() => setFrontMode("camera")}
                        style={{
                          padding: "4px 10px",
                          fontSize: 12,
                          fontWeight: frontMode === "camera" ? 700 : 500,
                          background: frontMode === "camera" ? "#FFFFFF" : "transparent",
                          color: frontMode === "camera" ? "#001743" : "#6B7280",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          boxShadow: frontMode === "camera" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Icons.Camera size={13} /> Chụp bằng Camera
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {frontPreview ? (
                <div
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    background: "#F8F9FA",
                  }}
                >
                  <img
                    src={frontPreview}
                    alt="Mặt trước CCCD"
                    style={{ maxHeight: 200, maxWidth: "100%", objectFit: "contain", borderRadius: 6, border: "1px solid #E5E7EB" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: 12 }}>
                    <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icons.CheckCircle size={16} /> Đã chọn ảnh mặt trước CCCD
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFrontImage(null);
                        setFrontPreview(null);
                      }}
                      className="btn-outline"
                      style={{ padding: "5px 12px", fontSize: 12, borderRadius: 6, color: "#DC2626", borderColor: "#FECACA" }}
                    >
                      Chụp lại / Chọn ảnh khác
                    </button>
                  </div>
                </div>
              ) : frontMode === "camera" ? (
                <CameraCapture
                  mode="card"
                  facingMode="environment"
                  fileName="front_card.jpg"
                  helperText="Đặt mặt trước CCCD nằm trọn trong khung viền"
                  onCapture={(file, url) => {
                    setFrontImage(file);
                    setFrontPreview(url);
                  }}
                />
              ) : (
                <label
                  style={{
                    border: "1.5px dashed #D1D5DB",
                    borderRadius: 8,
                    padding: 30,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#F9FAFB",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "front")}
                    style={{ display: "none" }}
                  />
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: "#EFF6FF",
                      color: "#2563EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 10,
                    }}
                  >
                    <Icons.Upload size={20} />
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: "#001743" }}>
                    Tải lên ảnh mặt trước CCCD
                  </span>
                  <span style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                    Nhấp để duyệt file từ máy (JPG, PNG, WEBP dưới 10MB)
                  </span>
                </label>
              )}
            </div>
          )}

          {!analysisResult && step === 2 && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h4 style={{ fontSize: 14.5, fontWeight: 800, color: "#001743", margin: 0 }}>
                      Bước 2: Ảnh mặt sau CCCD / CMND
                    </h4>
                    <p style={{ fontSize: 12, color: "#6B7280", margin: "3px 0 0" }}>
                      Yêu cầu ảnh chụp rõ nét chip điện tử và 3 dòng mã vạch MRZ ở phía dưới thẻ.
                    </p>
                  </div>
                  {!backPreview && (
                    <div style={{ display: "flex", gap: 6, background: "#F3F4F6", padding: 3, borderRadius: 6 }}>
                      <button
                        type="button"
                        onClick={() => setBackMode("upload")}
                        style={{
                          padding: "4px 10px",
                          fontSize: 12,
                          fontWeight: backMode === "upload" ? 700 : 500,
                          background: backMode === "upload" ? "#FFFFFF" : "transparent",
                          color: backMode === "upload" ? "#001743" : "#6B7280",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          boxShadow: backMode === "upload" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Icons.Upload size={13} /> Tải ảnh từ máy
                      </button>
                      <button
                        type="button"
                        onClick={() => setBackMode("camera")}
                        style={{
                          padding: "4px 10px",
                          fontSize: 12,
                          fontWeight: backMode === "camera" ? 700 : 500,
                          background: backMode === "camera" ? "#FFFFFF" : "transparent",
                          color: backMode === "camera" ? "#001743" : "#6B7280",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          boxShadow: backMode === "camera" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Icons.Camera size={13} /> Chụp bằng Camera
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {backPreview ? (
                <div
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    background: "#F8F9FA",
                  }}
                >
                  <img
                    src={backPreview}
                    alt="Mặt sau CCCD"
                    style={{ maxHeight: 200, maxWidth: "100%", objectFit: "contain", borderRadius: 6, border: "1px solid #E5E7EB" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: 12 }}>
                    <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icons.CheckCircle size={16} /> Đã chọn ảnh mặt sau CCCD
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBackImage(null);
                        setBackPreview(null);
                      }}
                      className="btn-outline"
                      style={{ padding: "5px 12px", fontSize: 12, borderRadius: 6, color: "#DC2626", borderColor: "#FECACA" }}
                    >
                      Chụp lại / Chọn ảnh khác
                    </button>
                  </div>
                </div>
              ) : backMode === "camera" ? (
                <CameraCapture
                  mode="card"
                  facingMode="environment"
                  fileName="back_card.jpg"
                  helperText="Đặt mặt sau CCCD vừa vặn trong khung hình"
                  onCapture={(file, url) => {
                    setBackImage(file);
                    setBackPreview(url);
                  }}
                />
              ) : (
                <label
                  style={{
                    border: "1.5px dashed #D1D5DB",
                    borderRadius: 8,
                    padding: 30,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#F9FAFB",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "back")}
                    style={{ display: "none" }}
                  />
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: "#EFF6FF",
                      color: "#2563EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 10,
                    }}
                  >
                    <Icons.Upload size={20} />
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: "#001743" }}>
                    Tải lên ảnh mặt sau CCCD
                  </span>
                  <span style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                    Nhấp để duyệt file từ máy (JPG, PNG, WEBP dưới 10MB)
                  </span>
                </label>
              )}
            </div>
          )}

          {!analysisResult && step === 3 && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <h4 style={{ fontSize: 14.5, fontWeight: 800, color: "#001743", margin: 0 }}>
                  Bước 3: Ảnh chân dung khuôn mặt
                </h4>
                <p style={{ fontSize: 12, color: "#6B7280", margin: "3px 0 0" }}>
                  Căn chỉnh khuôn mặt vào giữa khung hình oval, nhìn thẳng camera nơi đủ sáng, không đeo khẩu trang hay kính râm.
                </p>
              </div>

              {selfiePreview ? (
                <div
                  style={{
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    background: "#F8F9FA",
                  }}
                >
                  <img
                    src={selfiePreview}
                    alt="Ảnh chân dung selfie"
                    style={{ maxHeight: 220, maxWidth: "100%", objectFit: "contain", borderRadius: 8, border: "1px solid #E5E7EB" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: 12 }}>
                    <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icons.CheckCircle size={16} /> Đã chụp ảnh chân dung khuôn mặt
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelfieImage(null);
                        setSelfiePreview(null);
                      }}
                      className="btn-outline"
                      style={{ padding: "5px 12px", fontSize: 12, borderRadius: 6, color: "#DC2626", borderColor: "#FECACA" }}
                    >
                      Chụp lại ảnh khác
                    </button>
                  </div>
                </div>
              ) : (
                <CameraCapture
                  mode="face"
                  facingMode="user"
                  fileName="selfie.jpg"
                  helperText="Căn chỉnh khuôn mặt vào giữa khung hình và nhìn thẳng"
                  onCapture={(file, url) => {
                    setSelfieImage(file);
                    setSelfiePreview(url);
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* 3. Sticky Footer cố định ở đáy modal, luôn luôn hiển thị đầy đủ nút bấm */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: "#FFFFFF",
            borderTop: "1px solid #E5E7EB",
            padding: "12px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            flexShrink: 0,
            zIndex: 20,
          }}
        >
          {/* Cảnh báo lỗi rút gọn ngay trên các nút bấm để người dùng thấy ngay dù đang ở cuối trang */}
          {errorDetails && (
            <div
              style={{
                fontSize: 12,
                color: "#991B1B",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 6,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <span style={{ color: "#DC2626", display: "inline-flex", flexShrink: 0 }}>
                  <Icons.AlertTriangle size={15} />
                </span>
                <span>
                  <strong>{errorDetails.title}:</strong> {errorDetails.message}
                </span>
              </div>
              {errorDetails.targetStep && (
                <button
                  type="button"
                  onClick={() => {
                    const target = errorDetails.targetStep as 1 | 2 | 3;
                    setStep(target);
                    if (target === 1) {
                      setFrontImage(null);
                      setFrontPreview(null);
                    } else if (target === 2) {
                      setBackImage(null);
                      setBackPreview(null);
                    } else if (target === 3) {
                      setSelfieImage(null);
                      setSelfiePreview(null);
                    }
                  }}
                  style={{
                    background: "#DC2626",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 4,
                    padding: "3px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Quay lại Bước {errorDetails.targetStep}
                </button>
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
          {analysisResult && (
            <>
              <button
                type="button"
                disabled={confirming}
                onClick={() => setAnalysisResult(null)}
                className="btn-outline"
                style={{ padding: "8px 16px", fontSize: 12.5, borderRadius: 6 }}
              >
                ← Kiểm tra lại ảnh
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={handleConfirmEkyc}
                className="btn-red"
                style={{ padding: "9px 24px", fontSize: 13, fontWeight: 700, borderRadius: 6, display: "flex", alignItems: "center", gap: 6, opacity: confirming ? 0.6 : 1 }}
              >
                <Icons.ShieldCheck size={16} />
                {confirming ? "Đang xác nhận..." : "Thông tin chính xác — Xác nhận eKYC"}
              </button>
            </>
          )}

          {!analysisResult && step === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="btn-outline"
                style={{ padding: "8px 16px", fontSize: 12.5, borderRadius: 6 }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!frontImage}
                onClick={() => setStep(2)}
                className="btn-red"
                style={{
                  padding: "9px 22px",
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: !frontImage ? 0.5 : 1,
                  cursor: !frontImage ? "not-allowed" : "pointer",
                }}
              >
                Tiếp tục sang Bước 2 <Icons.ArrowRight size={16} />
              </button>
            </>
          )}

          {!analysisResult && step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-outline"
                style={{ padding: "8px 16px", fontSize: 12.5, borderRadius: 6 }}
              >
                ← Quay lại Bước 1
              </button>
              <button
                type="button"
                disabled={!backImage}
                onClick={() => setStep(3)}
                className="btn-red"
                style={{
                  padding: "9px 22px",
                  fontSize: 13,
                  fontWeight: 700,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: !backImage ? 0.5 : 1,
                  cursor: !backImage ? "not-allowed" : "pointer",
                }}
              >
                Tiếp tục sang Bước 3 <Icons.ArrowRight size={16} />
              </button>
            </>
          )}

          {!analysisResult && step === 3 && (
            <>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-outline"
                style={{ padding: "8px 16px", fontSize: 12.5, borderRadius: 6 }}
              >
                ← Quay lại Bước 2
              </button>
              <button
                type="button"
                disabled={submitting || !frontImage || !backImage || !selfieImage}
                onClick={handleSubmitAll}
                className="btn-red"
                style={{
                  padding: "9px 24px",
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
                {submitting ? "Đang gửi hồ sơ thẩm định..." : "Gửi hồ sơ thẩm định eKYC"}
              </button>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
