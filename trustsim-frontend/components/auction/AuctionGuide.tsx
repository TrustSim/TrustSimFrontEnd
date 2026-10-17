"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, Gavel, ShieldCheck, TrendingDown, TrendingUp, Wallet, X } from "lucide-react";

export type AuctionGuideType = "create" | "participate";

type GuideStep = { title: string; description: string; icon: typeof Gavel };

const GUIDE_STEPS: Record<AuctionGuideType, GuideStep[]> = {
  create: [
    { title: "Chọn SIM và loại đấu giá", description: "Chọn số SIM đã xác minh, sau đó chọn đấu giá kiểu Anh hoặc kiểu Hà Lan.", icon: Gavel },
    { title: "Thiết lập giá và thời gian", description: "Nhập giá khởi điểm, bước giá hoặc mức giảm, thời gian mở và thời gian kết thúc phiên.", icon: Clock3 },
    { title: "Chọn quy định của phiên", description: "Kiểm tra tiền đặt cọc, gia hạn phút chót và giới hạn mỗi lượt trước khi đăng.", icon: ShieldCheck },
    { title: "Kiểm tra rồi tạo phiên", description: "Xem lại toàn bộ thông tin. Khi xác nhận, phiên sẽ được lưu và hiển thị trong danh sách đấu giá.", icon: CheckCircle2 },
  ],
  participate: [
    { title: "Xem thông tin phiên", description: "Kiểm tra loại đấu giá, giá hiện tại, thời gian còn lại và các quy định quan trọng.", icon: Gavel },
    { title: "Đăng ký và đặt cọc", description: "Đăng ký tham gia, sau đó đặt cọc nếu phiên yêu cầu. Tiền cọc được hoàn theo quy định khi bạn không trúng.", icon: Wallet },
    { title: "Trả giá đúng cách", description: "Kiểu Anh: nhập mức giá muốn trả. Kiểu Hà Lan: chọn mua ở mức giá đang hiển thị.", icon: TrendingUp },
    { title: "Theo dõi kết quả", description: "Theo dõi lượt trả giá theo thời gian thực. Nếu thắng, hoàn tất thanh toán và sang tên SIM đúng hạn.", icon: TrendingDown },
  ],
};

const GUIDE_META: Record<AuctionGuideType, { title: string; intro: string; accent: string }> = {
  create: { title: "Hướng dẫn tạo phiên", intro: "Chuẩn bị một phiên đấu giá rõ ràng, đủ thông tin và dễ tham gia.", accent: "blue" },
  participate: { title: "Hướng dẫn tham gia phiên", intro: "Nắm các bước chính trước khi đăng ký và trả giá.", accent: "emerald" },
};

interface AuctionGuideProps {
  initialType?: AuctionGuideType;
  compact?: boolean;
}

export function AuctionGuide({ initialType = "participate", compact = false }: AuctionGuideProps) {
  const [type, setType] = useState<AuctionGuideType>(initialType);
  const meta = GUIDE_META[type];

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Hướng dẫn nhanh</p>
          <h2 className="mt-1 text-xl font-bold text-[#001743]">{meta.title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">{meta.intro}</p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="tablist" aria-label="Loại hướng dẫn">
          {(["create", "participate"] as AuctionGuideType[]).map((item) => (
            <button key={item} type="button" role="tab" aria-selected={type === item} onClick={() => setType(item)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${type === item ? "bg-white text-[#001743] shadow-sm" : "text-slate-500 hover:text-[#001743]"}`}>
              {item === "create" ? "Tạo phiên" : "Tham gia phiên"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {GUIDE_STEPS[type].map((step, index) => {
          const Icon = step.icon;
          return (
            <article key={step.title} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.accent === "blue" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                <Icon size={17} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-400">0{index + 1}</span>
                  <h3 className="text-sm font-bold text-[#001743]">{step.title}</h3>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{step.description}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-xs leading-relaxed ${meta.accent === "blue" ? "border-blue-100 bg-blue-50/70 text-blue-900" : "border-emerald-100 bg-emerald-50/70 text-emerald-900"}`}>
        <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
        <span>{type === "create" ? "Chỉ đăng phiên sau khi đã kiểm tra giá, thời gian và điều kiện đặt cọc." : "Luôn kiểm tra thời gian còn lại và giá tối thiểu trước khi xác nhận thao tác."}</span>
      </div>
    </div>
  );
}

interface AuctionGuideModalProps extends AuctionGuideProps {
  open: boolean;
  onClose: () => void;
}

export function AuctionGuideModal({ open, onClose, initialType = "participate" }: AuctionGuideModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-[#001743]/45 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="auction-guide-title">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">TrustSim</p>
            <h2 id="auction-guide-title" className="mt-1 text-lg font-bold text-[#001743]">Bạn cần biết trước khi bắt đầu</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700" aria-label="Đóng hướng dẫn"><X size={18} /></button>
        </div>
        <AuctionGuide initialType={initialType} compact />
      </div>
    </div>
  );
}

export default AuctionGuide;
