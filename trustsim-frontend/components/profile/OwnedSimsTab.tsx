import React, { useState } from "react";
import Link from "next/link";
import { ToastMessage } from "@/components/ui/Toast";
import { ProfileIcons as Icons } from "./ProfileIcons";
import { OwnedSim } from "./types";

interface OwnedSimsTabProps {
  isEkycVerified: boolean;
  addToast: (t: Omit<ToastMessage, "id">) => void;
  onNavigateToEkyc: () => void;
}

export default function OwnedSimsTab({
  isEkycVerified,
  addToast,
  onNavigateToEkyc,
}: OwnedSimsTabProps) {
  const [ownedSims, setOwnedSims] = useState<OwnedSim[]>([
    {
      id: "sim-1",
      simNumber: "0352 468 024",
      carrier: "Viettel",
      simType: "Trả trước",
      acquiredFrom: "PLATFORM_AUCTION",
      ownershipStatus: "VERIFIED_OWNER",
      estimatedValue: 8_500_000,
      createdDate: "05/09/2026",
    },
    {
      id: "sim-2",
      simNumber: "0901 888 999",
      carrier: "Mobifone",
      simType: "Trả sau",
      acquiredFrom: "PERSONAL_IMPORT",
      ownershipStatus: "UNVERIFIED",
      estimatedValue: 35_000_000,
      createdDate: "09/09/2026",
    },
    {
      id: "sim-3",
      simNumber: "0888 555 666",
      carrier: "Vinaphone",
      simType: "Trả trước",
      acquiredFrom: "PERSONAL_IMPORT",
      ownershipStatus: "VERIFIED_OWNER",
      estimatedValue: 18_000_000,
      createdDate: "08/09/2026",
    },
  ]);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSimNumber, setNewSimNumber] = useState("");
  const [newCarrier, setNewCarrier] = useState("Viettel");
  const [newSimType, setNewSimType] = useState<"Trả trước" | "Trả sau">("Trả trước");
  const [newEstimatedValue, setNewEstimatedValue] = useState("10000000");

  const [selectedSimForAuction, setSelectedSimForAuction] = useState<OwnedSim | null>(null);
  const [auctionStartPrice, setAuctionStartPrice] = useState("8000000");
  const [auctionStepPrice, setAuctionStepPrice] = useState("500000");
  const [auctionBuyNowPrice, setAuctionBuyNowPrice] = useState("");
  const [auctionDuration, setAuctionDuration] = useState("24");

  // Handle Add Personal SIM
  const handleAddPersonalSim = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = newSimNumber.trim().replace(/\s+/g, "");
    if (!cleanNumber || cleanNumber.length < 9) {
      addToast({
        type: "error",
        title: "Số SIM không hợp lệ",
        message: "Vui lòng nhập đúng định dạng số SIM từ 9 đến 11 chữ số.",
      });
      return;
    }

    const newSim: OwnedSim = {
      id: `sim-${Date.now()}`,
      simNumber: newSimNumber.trim(),
      carrier: newCarrier,
      simType: newSimType,
      acquiredFrom: "PERSONAL_IMPORT",
      ownershipStatus: "UNVERIFIED",
      estimatedValue: parseInt(newEstimatedValue, 10) || 5_000_000,
      createdDate: new Date().toLocaleDateString("vi-VN"),
    };

    setOwnedSims((prev) => [newSim, ...prev]);
    setIsAddModalOpen(false);
    setNewSimNumber("");

    addToast({
      type: "success",
      title: "Thêm SIM cá nhân thành công",
      message: `Đã lưu SIM ${newSim.simNumber} vào kho của bạn.`,
    });
  };

  // Handle Create Auction for a Verified SIM
  const handleOpenCreateAuction = (sim: OwnedSim) => {
    if (sim.ownershipStatus !== "VERIFIED_OWNER") {
      addToast({
        type: "error",
        title: "Không đủ điều kiện mở đấu giá",
        message: "Chỉ SIM đã được xác thực chính chủ mới có thể tạo phiên đấu giá.",
      });
      return;
    }
    setSelectedSimForAuction(sim);
    setAuctionStartPrice(Math.round(sim.estimatedValue * 0.8).toString());
    setAuctionStepPrice("500000");
    setAuctionBuyNowPrice("");
  };

  const handleConfirmCreateAuction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSimForAuction) return;

    setOwnedSims((prev) =>
      prev.map((s) =>
        s.id === selectedSimForAuction.id
          ? { ...s, hasActiveAuction: true, activeAuctionId: "1" }
          : s
      )
    );

    addToast({
      type: "success",
      title: "Khởi tạo phiên đấu giá thành công",
      message: `Phiên đấu giá cho SIM ${selectedSimForAuction.simNumber} đã được khởi tạo thành công với giá khởi điểm ${parseInt(auctionStartPrice, 10).toLocaleString("vi-VN")} ₫.`,
    });

    setSelectedSimForAuction(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 1. Header & Add Action */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#001743", margin: 0 }}>
            Kho SIM sở hữu của bạn
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>
            Quản lý danh sách SIM cá nhân và SIM đã thắng đấu giá trên sàn.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-red"
          style={{ padding: "8px 16px", fontSize: 13, borderRadius: 6, display: "flex", alignItems: "center", gap: 6 }}
        >
          <Icons.Plus size={16} /> + Thêm SIM cá nhân
        </button>
      </div>

      {/* 2. Owned SIMs Table */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F8F9FA", borderBottom: "1px solid #E5E7EB", color: "#4B5563", fontWeight: 700 }}>
              <th style={{ padding: "12px 16px" }}>Số SIM</th>
              <th style={{ padding: "12px 16px" }}>Nhà mạng & Gói</th>
              <th style={{ padding: "12px 16px" }}>Nguồn gốc</th>
              <th style={{ padding: "12px 16px" }}>Xác thực chính chủ</th>
              <th style={{ padding: "12px 16px" }}>Định giá ước tính</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Thao tác đấu giá</th>
            </tr>
          </thead>
          <tbody>
            {ownedSims.map((sim) => {
              const isOwnerVerified = sim.ownershipStatus === "VERIFIED_OWNER";
              return (
                <tr key={sim.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 800, color: "#001743", fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
                      {sim.simNumber}
                    </div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>Ngày thêm: {sim.createdDate}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700, color: "#1F2937" }}>{sim.carrier}</div>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>{sim.simType}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {sim.acquiredFrom === "PLATFORM_AUCTION" ? (
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: "#2563EB", background: "#EFF6FF", padding: "2px 8px", borderRadius: 4, border: "1px solid #BFDBFE" }}>
                        Trúng đấu giá sàn
                      </span>
                    ) : (
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: "#4B5563", background: "#F3F4F6", padding: "2px 8px", borderRadius: 4 }}>
                        Tự thêm cá nhân
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    {isOwnerVerified ? (
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: "#16A34A",
                          background: "#F0FDF4",
                          border: "1px solid #BBF7D0",
                          padding: "3px 8px",
                          borderRadius: 4,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Icons.Check size={12} /> Đã xác thực chính chủ
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: "#B45309",
                          background: "#FFFBEB",
                          border: "1px solid #FDE68A",
                          padding: "3px 8px",
                          borderRadius: 4,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Icons.Clock size={11} /> Chưa xác thực chính chủ
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: "#E4011E", fontVariantNumeric: "tabular-nums" }}>
                    {sim.estimatedValue.toLocaleString("vi-VN")} ₫
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    {sim.hasActiveAuction ? (
                      <Link
                        href={`/auctions/${sim.activeAuctionId || 1}`}
                        className="btn-outline"
                        style={{ padding: "5px 12px", fontSize: 11.5, borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        Đang đấu giá →
                      </Link>
                    ) : isOwnerVerified ? (
                      <button
                        onClick={() => handleOpenCreateAuction(sim)}
                        className="btn-red"
                        style={{
                          padding: "6px 14px",
                          fontSize: 12,
                          fontWeight: 700,
                          borderRadius: 6,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                        }}
                      >
                        <Icons.Gavel size={14} /> Tạo phiên đấu giá
                      </button>
                    ) : (
                      <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                        <button
                          disabled
                          style={{
                            padding: "6px 12px",
                            fontSize: 11.5,
                            fontWeight: 700,
                            borderRadius: 6,
                            background: "#F3F4F6",
                            color: "#9CA3AF",
                            border: "1px solid #E5E7EB",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            cursor: "not-allowed",
                          }}
                          title="Chỉ SIM đã xác thực chính chủ mới được tạo đấu giá."
                        >
                          <Icons.Lock size={12} /> Tạo đấu giá (Khóa)
                        </button>
                        <span style={{ fontSize: 10, color: "#DC2626", fontWeight: 600 }}>
                          * Cần xác thực chính chủ
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Modal: Thêm SIM cá nhân */}
      {isAddModalOpen && (
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
              maxWidth: 480,
              padding: 24,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "#001743", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Icons.SimCard size={20} /> Thêm SIM cá nhân vào kho
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer" }}
              >
                <Icons.X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPersonalSim} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
                  Số điện thoại SIM *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 0912 345 678"
                  value={newSimNumber}
                  onChange={(e) => setNewSimNumber(e.target.value)}
                  className="profile-input"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
                    Nhà mạng
                  </label>
                  <select
                    value={newCarrier}
                    onChange={(e) => setNewCarrier(e.target.value)}
                    className="profile-input"
                  >
                    <option value="Viettel">Viettel</option>
                    <option value="Mobifone">Mobifone</option>
                    <option value="Vinaphone">Vinaphone</option>
                    <option value="Vietnamobile">Vietnamobile</option>
                    <option value="Wintel">Wintel</option>
                    <option value="Itelecom">Itelecom</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
                    Loại thuê bao
                  </label>
                  <select
                    value={newSimType}
                    onChange={(e) => setNewSimType(e.target.value as any)}
                    className="profile-input"
                  >
                    <option value="Trả trước">Trả trước</option>
                    <option value="Trả sau">Trả sau</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
                  Định giá ước tính (₫)
                </label>
                <input
                  type="number"
                  value={newEstimatedValue}
                  onChange={(e) => setNewEstimatedValue(e.target.value)}
                  className="profile-input"
                  step="500000"
                  min="0"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-outline"
                  style={{ padding: "8px 16px", fontSize: 12, borderRadius: 6 }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-red"
                  style={{ padding: "8px 18px", fontSize: 12, borderRadius: 6, fontWeight: 700 }}
                >
                  Lưu vào kho SIM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Tạo phiên đấu giá cho SIM đã xác thực chính chủ */}
      {selectedSimForAuction && (
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
              maxWidth: 520,
              padding: 24,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "#001743", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Icons.Gavel size={18} /> Mở phiên đấu giá SIM chính chủ
                </h3>
                <div style={{ fontSize: 12, color: "#16A34A", fontWeight: 700, marginTop: 2 }}>
                  ✓ Đã kiểm tra quyền sở hữu chính chủ thành công
                </div>
              </div>
              <button
                onClick={() => setSelectedSimForAuction(null)}
                style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer" }}
              >
                <Icons.X size={18} />
              </button>
            </div>

            {/* Sim Info Banner */}
            <div
              style={{
                background: "#001743",
                color: "#FFFFFF",
                borderRadius: 8,
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.65)", textTransform: "uppercase" }}>Số SIM đấu giá</div>
                <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: "-0.01em" }}>{selectedSimForAuction.simNumber}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.65)" }}>Nhà mạng</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedSimForAuction.carrier} ({selectedSimForAuction.simType})</div>
              </div>
            </div>

            <form onSubmit={handleConfirmCreateAuction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
                    Giá khởi điểm (₫) *
                  </label>
                  <input
                    type="number"
                    value={auctionStartPrice}
                    onChange={(e) => setAuctionStartPrice(e.target.value)}
                    className="profile-input"
                    required
                    step="100000"
                    min="100000"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
                    Bước giá tối thiểu (₫) *
                  </label>
                  <input
                    type="number"
                    value={auctionStepPrice}
                    onChange={(e) => setAuctionStepPrice(e.target.value)}
                    className="profile-input"
                    required
                    step="50000"
                    min="50000"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
                    Giá mua ngay (₫ - Tùy chọn)
                  </label>
                  <input
                    type="number"
                    placeholder="Để trống nếu không áp dụng"
                    value={auctionBuyNowPrice}
                    onChange={(e) => setAuctionBuyNowPrice(e.target.value)}
                    className="profile-input"
                    step="500000"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
                    Thời gian diễn ra phiên
                  </label>
                  <select
                    value={auctionDuration}
                    onChange={(e) => setAuctionDuration(e.target.value)}
                    className="profile-input"
                  >
                    <option value="24">24 giờ (1 ngày)</option>
                    <option value="48">48 giờ (2 ngày)</option>
                    <option value="72">72 giờ (3 ngày)</option>
                  </select>
                </div>
              </div>

              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 6, padding: "10px 12px" }}>
                <div style={{ fontSize: 11.5, color: "#166534", lineHeight: 1.4 }}>
                  <strong>Cơ chế ký quỹ bảo đảm:</strong> Trong suốt thời gian diễn ra phiên đấu giá, SIM sẽ được khóa chuyển nhượng để đảm bảo an toàn giao dịch cho người mua hợp lệ.
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedSimForAuction(null)}
                  className="btn-outline"
                  style={{ padding: "8px 16px", fontSize: 12, borderRadius: 6 }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-red"
                  style={{ padding: "8px 20px", fontSize: 12, borderRadius: 6, fontWeight: 700 }}
                >
                  Xác nhận mở phiên đấu giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
