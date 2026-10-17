"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Info, X } from "lucide-react";

export type AuctionHelpTopic = "english" | "dutch" | "min-step" | "max-step" | "extension" | "dutch-decrease" | "dutch-interval" | "reserve-price" | "deposit" | "current-price";

interface AuctionHelpPopoverProps {
  topic: AuctionHelpTopic;
  value?: string;
  children?: ReactNode;
  className?: string;
  align?: "left" | "right";
}

const TOPIC_CONTENT: Record<AuctionHelpTopic, { title: string; description: string; impact: string }> = {
  english: { title: "Đấu giá Kiểu Anh", description: "Giá bắt đầu từ mức khởi điểm và tăng lên sau mỗi lượt trả giá. Người có giá cao nhất khi phiên kết thúc sẽ thắng.", impact: "Mỗi lượt mới phải cao hơn giá dẫn đầu ít nhất bằng bước giá tối thiểu." },
  dutch: { title: "Đấu giá Hà Lan", description: "Giá bắt đầu cao và tự động giảm theo từng chu kỳ. Người đầu tiên chọn mua ở mức giá đang hiển thị sẽ thắng.", impact: "Nếu giá giảm đến giá sàn mà chưa có người mua, phiên sẽ kết thúc." },
  "min-step": { title: "Bước giá tối thiểu", description: "Khoản tiền nhỏ nhất mà giá mới phải tăng so với giá dẫn đầu hiện tại.", impact: "Lượt tiếp theo cần tăng ít nhất bằng mức này." },
  "max-step": { title: "Tăng tối đa một lượt", description: "Giới hạn số bước giá được phép tăng trong một lần trả giá.", impact: "Giúp hạn chế việc nhập nhầm giá quá cao." },
  extension: { title: "Gia hạn phút chót", description: "Khi có lượt trả giá sát thời điểm kết thúc, hệ thống cộng thêm thời gian để các bên có cơ hội phản hồi công bằng.", impact: "Thời gian kết thúc có thể thay đổi nếu có lượt trả giá cuối phiên." },
  "dutch-decrease": { title: "Mức giảm định kỳ", description: "Số tiền được trừ khỏi giá hiện tại sau mỗi chu kỳ của phiên đấu giá Hà Lan.", impact: "Mức giảm càng lớn thì giá thay đổi càng nhanh." },
  "dutch-interval": { title: "Chu kỳ hạ giá", description: "Khoảng thời gian giữa hai lần hệ thống tự động giảm giá.", impact: "Đây là nhịp giảm giá của phiên Hà Lan." },
  "reserve-price": { title: "Giá sàn bảo lưu", description: "Mức giá thấp nhất người bán chấp nhận trong phiên đấu giá Hà Lan.", impact: "Giá không giảm thấp hơn mức sàn này." },
  deposit: { title: "Tiền đặt cọc", description: "Khoản tiền tạm khóa để xác nhận cam kết tham gia phiên đấu giá.", impact: "Tiền cọc được hoàn lại theo quy định nếu bạn không trúng phiên." },
  "current-price": { title: "Giá hiện tại", description: "Mức giá đang được hệ thống ghi nhận ở thời điểm hiện tại.", impact: "Giá này được dùng làm căn cứ cho lượt trả giá tiếp theo." },
};

export function AuctionHelpPopover({ topic, value, children, className = "" }: AuctionHelpPopoverProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, above: false });
  const rootRef = useRef<HTMLSpanElement>(null);
  const content = TOPIC_CONTENT[topic];
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open || !rootRef.current) return;
    const updatePosition = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(310, window.innerWidth - 24);
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
      const above = rect.bottom + 330 > window.innerHeight && rect.top > 350;
      setPosition({ top: above ? rect.top - 9 : rect.bottom + 9, left, above });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);
  const impact = value ? `${content.impact} Hiện tại: ${value}.` : content.impact;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  return (
    <span ref={rootRef} className={`relative inline-flex align-middle ${className}`} onClick={(event) => event.stopPropagation()}>
      <button type="button" aria-label={`Giải thích: ${content.title}`} aria-expanded={open} onClick={(event) => { event.preventDefault(); event.stopPropagation(); setOpen((current) => !current); }} className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 transition-colors hover:border-[#001743] hover:text-[#001743] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
        <Info size={12} strokeWidth={2.25} />
      </button>
      {open && mounted && createPortal(
        <div role="dialog" aria-label={content.title} style={{ position: "fixed", top: position.above ? undefined : position.top, bottom: position.above ? window.innerHeight - position.top : undefined, left: position.left, width: "min(310px, calc(100vw - 24px))" }} className="z-[9999] rounded-xl border border-slate-300 bg-white p-4 text-left shadow-[0_14px_34px_rgba(0,23,67,0.14)]">
          <div className={`absolute ${position.above ? "-bottom-1.5" : "-top-1.5"} left-5 h-3 w-3 rotate-45 border-slate-300 bg-white ${position.above ? "border-b border-r" : "border-l border-t"}`} />
          <div className="relative">
            <button type="button" aria-label="Đóng giải thích" onClick={() => setOpen(false)} className="absolute -right-1 -top-1 rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700"><X size={16} /></button>
            <h3 className="pr-6 text-[14px] font-bold text-[#001743]">{content.title}</h3>
            <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">{content.description}</p>
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5 text-[12px] leading-relaxed text-slate-700"><strong className="font-bold text-[#001743]">Điều này có nghĩa là:</strong><br />{impact}</div>
            {children && <div className="mt-3 text-[12px] text-slate-600">{children}</div>}
          </div>
        </div>,
        document.body
      )}
    </span>
  );
}

export default AuctionHelpPopover;
