"use client";

import React, { useState } from "react";
import { authService } from "@/services/authService";
import { AuthResponseDto, UserProfileDto } from "@/types/auth";
import { ToastMessage } from "@/components/ui/Toast";
import { ProfileIcons as Icons } from "./ProfileIcons";
import { identityValidators } from "@/utils/validators";

interface SettingsTabProps {
  user: AuthResponseDto | null;
  profile: UserProfileDto | null;
  addToast: (t: Omit<ToastMessage, "id">) => void;
}

export default function SettingsTab({ user, profile, addToast }: SettingsTabProps) {
  const [fullName, setFullName] = useState(profile?.fullName || user?.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || user?.phoneNumber || "");
  const [identityNumber, setIdentityNumber] = useState(profile?.identityNumber || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const valRes = identityValidators.validateProfileUpdate({
      fullName,
      phoneNumber,
      identityNumber,
    });
    if (!valRes.isValid) {
      addToast({
        type: "error",
        title: "Thông tin hồ sơ chưa hợp lệ",
        message: valRes.error || "Vui lòng kiểm tra lại thông tin hồ sơ.",
      });
      return;
    }

    setLoadingProfile(true);
    try {
      await authService.updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        identityNumber: identityNumber.trim(),
        address: address.trim(),
      });
      addToast({
        type: "success",
        title: "Cập nhật thành công",
        message: "Thông tin hồ sơ cá nhân của bạn đã được lưu lại.",
      });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Cập nhật thất bại",
        message: err.message || "Không thể cập nhật hồ sơ.",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      addToast({
        type: "error",
        title: "Thiếu mật khẩu hiện tại",
        message: "Vui lòng nhập mật khẩu hiện tại.",
      });
      return;
    }

    const valPwd = identityValidators.validatePassword(newPassword);
    if (!valPwd.isValid) {
      addToast({
        type: "error",
        title: "Mật khẩu mới chưa hợp lệ",
        message: valPwd.error || "Mật khẩu phải từ 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.",
      });
      return;
    }

    if (newPassword === currentPassword) {
      addToast({
        type: "error",
        title: "Mật khẩu không đổi",
        message: "Mật khẩu mới không được trùng với mật khẩu hiện tại.",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      addToast({
        type: "error",
        title: "Mật khẩu không khớp",
        message: "Xác nhận mật khẩu mới không trùng khớp.",
      });
      return;
    }
    setLoadingPassword(true);
    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      addToast({
        type: "success",
        title: "Đổi mật khẩu thành công",
        message: "Mật khẩu của bạn đã được thay đổi an toàn.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Đổi mật khẩu thất bại",
        message: err.message || "Mật khẩu hiện tại không chính xác.",
      });
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 960 }}>
      {/* Cột 1: Thông tin cá nhân */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#001743", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <Icons.User /> Thông tin cá nhân
        </h3>
        <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
              Họ và tên
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="profile-input"
              required
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
              Số điện thoại
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="profile-input"
              required
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
              Số CCCD / CMND
            </label>
            <input
              type="text"
              value={identityNumber}
              onChange={(e) => setIdentityNumber(e.target.value)}
              className="profile-input"
              required
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
              Địa chỉ liên hệ
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="profile-input"
            />
          </div>
          <button
            type="submit"
            disabled={loadingProfile}
            className="btn-red"
            style={{ marginTop: 8, padding: "10px 18px", fontSize: 13, borderRadius: 6 }}
          >
            {loadingProfile ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </form>
      </div>

      {/* Cột 2: Đổi mật khẩu */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#001743", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <Icons.Lock /> Đổi mật khẩu tài khoản
        </h3>
        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              placeholder="Nhập mật khẩu cũ"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="profile-input"
              required
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
              Mật khẩu mới
            </label>
            <input
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="profile-input"
              required
              minLength={6}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#001743", marginBottom: 4 }}>
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="profile-input"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loadingPassword}
            className="btn-outline"
            style={{ marginTop: 8, padding: "10px 18px", fontSize: 13, borderRadius: 6 }}
          >
            {loadingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
          </button>
        </form>
      </div>

      <style>{`
        .profile-input {
          width: 100%;
          padding: 8px 12px;
          font-size: 13px;
          border-radius: 6px;
          border: 1px solid #D1D5DB;
          outline: none;
          color: #001743;
          background: #FFFFFF;
          transition: border-color 0.2s;
        }
        .profile-input:focus {
          border-color: #001743;
        }
      `}</style>
    </div>
  );
}
