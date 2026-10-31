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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Cột 1: Thông tin cá nhân */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-slate-200/70">
            <div className="w-8 h-8 rounded-xl bg-[#001743] flex items-center justify-center text-white shrink-0">
              <Icons.User size={15} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#001743] m-0">
                Thông tin cá nhân
              </h3>
              <p className="text-[11px] text-slate-500 m-0">
                Cập nhật thông tin định danh & địa chỉ liên lạc
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-[#001743] mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 outline-none transition-all font-medium"
                placeholder="Nhập họ và tên đầy đủ"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#001743] mb-1">
                Số điện thoại liên hệ
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 outline-none transition-all font-mono tabular-nums font-medium"
                placeholder="0912 345 678"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#001743] mb-1">
                Số CCCD / CMND
              </label>
              <input
                type="text"
                value={identityNumber}
                onChange={(e) => setIdentityNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 outline-none transition-all font-mono tabular-nums font-medium"
                placeholder="12 chữ số CCCD"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#001743] mb-1">
                Địa chỉ cư trú
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 outline-none transition-all font-medium"
                placeholder="Địa chỉ liên hệ và nhận hợp đồng"
              />
            </div>

            <div className="pt-1.5">
              <button
                type="submit"
                disabled={loadingProfile}
                className="rounded-full bg-[#001743] hover:bg-[#0A2558] text-white px-5 py-2 text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer inline-flex items-center gap-1.5"
              >
                {loadingProfile ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Lưu thay đổi hồ sơ"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Cột 2: Đổi mật khẩu */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-slate-200/70">
            <div className="w-8 h-8 rounded-xl bg-[#001743] flex items-center justify-center text-white shrink-0">
              <Icons.Lock size={15} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#001743] m-0">
                Đổi mật khẩu tài khoản
              </h3>
              <p className="text-[11px] text-slate-500 m-0">
                Bảo vệ tài khoản bằng mật khẩu mạnh
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-[#001743] mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 outline-none transition-all font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#001743] mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                placeholder="Tối thiểu 8 ký tự (hoa, thường, số, ký tự đặc biệt)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 outline-none transition-all font-medium"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#001743] mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:border-[#001743] focus:ring-2 focus:ring-[#001743]/10 outline-none transition-all font-medium"
                required
                minLength={6}
              />
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loadingPassword}
                className="rounded-full bg-white hover:bg-slate-100 text-[#001743] border border-slate-200 px-5 py-2 text-xs font-bold shadow-2xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer inline-flex items-center gap-1.5"
              >
                {loadingPassword ? (
                  <>
                    <span className="w-3 h-3 border-2 border-[#001743]/30 border-t-[#001743] rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Cập nhật mật khẩu mới"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
