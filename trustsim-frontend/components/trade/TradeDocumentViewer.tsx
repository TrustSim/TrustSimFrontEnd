"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  FileCheck2,
  FileText,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { tradeService } from "@/services/tradeService";

type DocumentKind = "winning-notice" | "contract" | "liquidation";

const DOCUMENT_META: Record<
  DocumentKind,
  { title: string; shortTitle: string; filePrefix: string }
> = {
  "winning-notice": {
    title: "Phiếu chốt giá trúng",
    shortTitle: "Phiếu chốt giá",
    filePrefix: "phieu-chot-gia-trung",
  },
  contract: {
    title: "Hợp đồng chuyển nhượng quyền sử dụng SIM",
    shortTitle: "Hợp đồng chuyển nhượng",
    filePrefix: "hop-dong-chuyen-nhuong",
  },
  liquidation: {
    title: "Biên bản nghiệm thu và thanh lý",
    shortTitle: "Biên bản nghiệm thu",
    filePrefix: "bien-ban-nghiem-thu-thanh-ly",
  },
};

interface ViewerState {
  tradeCode: string;
  html?: string;
  pdfUrl?: string;
  hash?: string | null;
}

export default function TradeDocumentViewer({
  identifier,
  kind,
}: {
  identifier: string;
  kind: DocumentKind;
}) {
  const [viewer, setViewer] = useState<ViewerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const meta = DOCUMENT_META[kind];
  const tradeHref = `/trades/${encodeURIComponent(identifier)}`;

  const fileName = useMemo(
    () => `${meta?.filePrefix || "tai-lieu"}-${viewer?.tradeCode || identifier}.pdf`,
    [identifier, meta?.filePrefix, viewer?.tradeCode]
  );

  useEffect(() => {
    let disposed = false;
    let objectUrl: string | undefined;

    const loadDocument = async () => {
      if (!meta) {
        setError("Loại tài liệu không hợp lệ.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const trade = await tradeService.getTradeByIdentifier(identifier);
        let html: string | undefined;
        let hash: string | null | undefined;
        let hasPdf = false;

        if (kind === "liquidation") {
          const liquidation = await tradeService.getLiquidationPreview(trade.id);
          html = liquidation.htmlContent;
          hash = liquidation.liquidationDocumentHash;
          hasPdf = Boolean(liquidation.liquidationDocumentUrl);
        } else {
          const contract = await tradeService.getContractPreview(trade.id);
          if (kind === "contract") {
            html = contract.htmlContent;
            hash = contract.documentHash;
            hasPdf = Boolean(contract.documentPdfUrl);
          } else {
            hash = contract.winningNoticeHash;
            hasPdf = Boolean(contract.winningNoticeUrl);
          }
        }

        if (hasPdf) {
          const blob = await tradeService.getDocumentBlob(trade.id, kind);
          objectUrl = URL.createObjectURL(
            blob.type === "application/pdf"
              ? blob
              : new Blob([blob], { type: "application/pdf" })
          );
        }

        if (!objectUrl && !html) {
          throw new Error("Tài liệu chưa được phát hành trong hồ sơ giao dịch này.");
        }

        if (disposed) {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          return;
        }

        setViewer({
          tradeCode: trade.tradeTransactionCode,
          html,
          pdfUrl: objectUrl,
          hash,
        });
      } catch (loadError) {
        if (!disposed) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể mở tài liệu. Hãy kiểm tra kết nối và thử lại."
          );
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    void loadDocument();

    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [identifier, kind, meta]);

  if (!meta) {
    return <DocumentError message="Loại tài liệu không hợp lệ." tradeHref={tradeHref} />;
  }

  return (
    <main className="flex min-h-dvh flex-col bg-slate-200 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#001743] text-white shadow-lg shadow-slate-900/10">
        <div className="mx-auto flex min-h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={tradeHref}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/20 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Quay lại hồ sơ giao dịch"
            >
              <ArrowLeft size={19} />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold sm:text-base">{meta.title}</h1>
              <p className="mt-0.5 truncate text-xs text-blue-100/70">
                {viewer?.tradeCode || "Đang tải hồ sơ"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {viewer?.pdfUrl ? (
              <a
                href={viewer.pdfUrl}
                download={fileName}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2.5 text-xs font-bold text-[#001743] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Download size={15} />
                <span className="hidden sm:inline">Tải PDF</span>
              </a>
            ) : null}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="rounded-xl bg-white px-6 py-5 text-center shadow-sm">
            <LoaderCircle className="mx-auto animate-spin text-[#001743]" size={26} />
            <p className="mt-3 text-sm font-semibold text-slate-700">Đang mở tài liệu…</p>
            <p className="mt-1 text-xs text-slate-500">TrustSim đang xác thực quyền truy cập.</p>
          </div>
        </div>
      ) : error ? (
        <DocumentError message={error} tradeHref={tradeHref} />
      ) : viewer ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-slate-300 bg-white px-4 py-2.5 text-xs sm:px-6">
            <div className="flex min-w-0 items-center gap-2 text-slate-600">
              {viewer.pdfUrl ? (
                <FileCheck2 size={16} className="shrink-0 text-emerald-700" />
              ) : (
                <FileText size={16} className="shrink-0 text-amber-700" />
              )}
              <span className="font-semibold">
                {viewer.pdfUrl ? "Bản PDF đã phát hành" : "Bản xem trước chưa phát hành PDF"}
              </span>
            </div>
            {viewer.hash ? (
              <span className="hidden max-w-[45%] truncate font-mono text-[10px] text-slate-400 md:block">
                SHA-256: {viewer.hash}
              </span>
            ) : null}
          </div>

          {viewer.pdfUrl ? (
            <iframe
              src={`${viewer.pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
              title={meta.title}
              className="min-h-[calc(100dvh-113px)] w-full flex-1 border-0 bg-slate-300"
            />
          ) : (
            <div className="flex-1 overflow-auto px-3 py-5 sm:px-6 sm:py-8">
              <article
                className="mx-auto max-w-5xl bg-white p-5 shadow-xl shadow-slate-900/10 sm:p-10 lg:p-14"
                dangerouslySetInnerHTML={{ __html: viewer.html || "" }}
              />
            </div>
          )}
        </div>
      ) : null}
    </main>
  );
}

function DocumentError({ message, tradeHref }: { message: string; tradeHref: string }) {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-slate-100 p-5">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
          <AlertTriangle size={24} />
        </div>
        <h1 className="mt-4 text-lg font-extrabold text-[#001743]">Không thể mở tài liệu</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} /> Thử lại
          </button>
          <Link
            href={tradeHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#001743] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00245f]"
          >
            <ShieldCheck size={16} /> Về hồ sơ giao dịch
          </Link>
        </div>
      </section>
    </div>
  );
}
