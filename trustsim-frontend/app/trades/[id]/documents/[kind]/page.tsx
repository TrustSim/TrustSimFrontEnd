"use client";

import { use } from "react";
import TradeDocumentViewer from "@/components/trade/TradeDocumentViewer";

type DocumentKind = "winning-notice" | "contract" | "liquidation";

export default function TradeDocumentPage({
  params,
}: {
  params:
    | Promise<{ id: string; kind: DocumentKind }>
    | { id: string; kind: DocumentKind };
}) {
  const resolved =
    typeof (params as Promise<{ id: string; kind: DocumentKind }>).then === "function"
      ? use(params as Promise<{ id: string; kind: DocumentKind }>)
      : (params as { id: string; kind: DocumentKind });

  return <TradeDocumentViewer identifier={resolved.id} kind={resolved.kind} />;
}

