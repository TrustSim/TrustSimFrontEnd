"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChatWorkspace from "@/components/chat/ChatWorkspace";

function MessagesContent() {
  const params = useSearchParams();
  return <ChatWorkspace initialId={params.get("conversation") || undefined} mode="direct" />;
}

export default function MessagesPage() {
  return <div className="min-h-screen bg-[radial-gradient(circle_at_75%_0%,#e6ebff,#f7f8fd_38%)]"><main className="px-3 pb-8 pt-28 sm:px-6"><Suspense fallback={<p className="p-8 text-center text-sm">Đang tải hộp thư…</p>}><MessagesContent /></Suspense></main></div>;
}
