"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminCategoriesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin?tab=categories"); }, [router]);
  return <div className="p-8 text-center text-xs text-slate-400">Dang chuyen huong...</div>;
}
