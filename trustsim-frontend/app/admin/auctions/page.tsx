"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminAuctionsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin?tab=auctions");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-[#6B7280]">
      Đang chuyển hướng đến Quản lý phiên đấu giá...
    </div>
  );
}
