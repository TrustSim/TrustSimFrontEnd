"use client";

import { use } from "react";
import ContractLifecycleWorkspace from "@/components/trade/ContractLifecycleWorkspace";

export default function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved =
    typeof (params as Promise<{ id: string }>).then === "function"
      ? use(params as Promise<{ id: string }>)
      : (params as { id: string });

  return <ContractLifecycleWorkspace identifier={resolved.id} />;
}
