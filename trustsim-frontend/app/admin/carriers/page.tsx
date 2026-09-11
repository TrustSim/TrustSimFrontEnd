"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminCarriersRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin?tab=carriers"); }, [router]);
  return <div className="p-8 text-center text-xs text-slate-400">Dang chuyen huong...</div>;
}
