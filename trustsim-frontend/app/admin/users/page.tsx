"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminUsersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin?tab=users");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-[#6B7280]">
      Đang chuyển hướng đến Quản lý người dùng...
    </div>
  );
}
