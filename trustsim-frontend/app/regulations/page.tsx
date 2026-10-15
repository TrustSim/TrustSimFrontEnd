/* Hallmark · genre: modern-minimal · style: Clean High-Trust Banking & Regulatory Ledger · macrostructure: Dossier Index · role: public-regulations-center */
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  ShieldCheck,
  Scale,
  Lock,
  FileText,
  Clock,
  AlertTriangle,
  Gavel,
  CheckCircle2,
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Award,
  Wallet,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  PhoneCall,
  Check,
  AlertOctagon,
  Info,
} from "lucide-react";

/* ─── Dữ Liệu Câu Hỏi & Giải Đáp Thực Tế ──────────────────── */
interface FaqItem {
  id: string;
  category: "escrow" | "auction" | "penalty" | "handover";
  categoryLabel: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    category: "escrow",
    categoryLabel: "Ký quỹ & Hoàn tiền",
    question: "Nếu tôi nạp tiền đặt cọc nhưng không trúng đấu giá thì tiền cọc có bị mất không?",
    answer:
      "HOÀN TOÀN KHÔNG. Hệ thống ký quỹ của TrustSim sẽ tự động giải tỏa và hoàn trả 100% số tiền đặt cọc vào số dư ví khả dụng của bạn ngay khi phiên đấu giá kết thúc (gõ búa). Bạn có thể dùng số tiền này để tham gia phiên khác hoặc rút về tài khoản ngân hàng chính chủ bất kỳ lúc nào mà không mất bất kỳ khoản phí nào.",
  },
  {
    id: "faq-2",
    category: "escrow",
    categoryLabel: "Ký quỹ & Hoàn tiền",
    question: "Tiền đặt cọc của người tham gia được giữ ở đâu? Có an toàn không?",
    answer:
      "Toàn bộ tiền cọc và tiền thanh toán mua SIM được phong tỏa an toàn trong tài khoản ký quỹ độc lập được bảo chứng qua ngân hàng. Sàn TrustSim và người bán hoàn toàn không thể tự ý rút tiền khi chưa có biên nhận hoàn tất thủ tục sang tên đổi chủ chính thức từ nhà mạng viễn thông.",
  },
  {
    id: "faq-3",
    category: "auction",
    categoryLabel: "Luật Đấu Giá",
    question: "Tại sao phiên đấu giá lại tự động cộng thêm thời gian khi có người trả giá ở những giây cuối?",
    answer:
      "Đây là cơ chế tự động bù giờ phút chót. Để bảo đảm công bằng và ngăn chặn việc cài cắm công cụ tự động cướp giá ở 1–2 giây cuối khiến người khác không kịp bấm giá, hệ thống sẽ tự động cộng thêm từ 30 đến 60 giây mỗi khi có lượt trả giá mới trong thời gian đếm ngược bảo vệ. Phiên chỉ chính thức kết thúc khi hết thời gian mà không còn ai trả giá cao hơn.",
  },
  {
    id: "faq-4",
    category: "auction",
    categoryLabel: "Luật Đấu Giá",
    question: "Đấu giá giá xuống (kiểu Hà Lan) diễn ra như thế nào? Khác gì đấu giá thông thường?",
    answer:
      "Đấu giá thông thường bắt đầu từ giá thấp và người tham gia nâng giá dần lên. Ngược lại, đấu giá kiểu Hà Lan bắt đầu từ mức giá cao nhất do người bán đưa ra, sau đó giá sẽ tự động giảm đều đặn theo từng khoảng thời gian (ví dụ cứ 60 giây lại giảm 500.000 ₫). Người đầu tiên bấm 'MUA NGAY' tại mức giá đang chạy trên màn hình sẽ là người mua duy nhất và phiên kết thúc ngay lập tức.",
  },
  {
    id: "faq-5",
    category: "penalty",
    categoryLabel: "Chế Tài & Phạt Cọc",
    question: "Nếu người trả giá cao nhất không đủ tiền thanh toán thì có bị phạt cọc ngay lập tức không?",
    answer:
      "Không bị phạt ngay lập tức. Sau khi phiên kết thúc, người thắng được cấp thời hạn thanh toán bổ sung (thông thường là 24 giờ). Trong khoảng thời gian này, người mua có quyền nạp thêm tiền vào ví để hoàn tất nghĩa vụ. Chỉ khi hết 24 giờ mà người mua vẫn không thanh toán hoặc chủ động bấm nút 'Bỏ Mua SIM', hệ thống mới chính thức thực hiện chế tài phạt bùng cọc.",
  },
  {
    id: "faq-6",
    category: "penalty",
    categoryLabel: "Chế Tài & Phạt Cọc",
    question: "Tiền phạt khi người thắng bùng cọc được phân chia và xử lý như thế nào?",
    answer:
      "Tiền phạt cọc được phân bổ minh bạch theo tỷ lệ 50/50: Đúng 50% tiền cọc được cộng thẳng vào ví của Người Bán để bồi thường chi phí cơ hội và thời gian mở phiên; 50% còn lại được nộp vào Quỹ bảo đảm an toàn giao dịch của Sàn TrustSim. Tài khoản người vi phạm sẽ bị khóa quyền đấu giá và ghi nhận cảnh báo trên toàn hệ thống.",
  },
  {
    id: "faq-7",
    category: "penalty",
    categoryLabel: "Chế Tài & Phạt Cọc",
    question: "Người về nhì (Á quân) có bắt buộc phải mua lại SIM không? Nếu từ chối có bị phạt không?",
    answer:
      "Á QUÂN HOÀN TOÀN KHÔNG BẮT BUỘC VÀ KHÔNG BỊ PHẠT. Khi người về nhất bùng cọc và Người bán đồng ý chuyển nhượng, Á quân nhận được quyền ưu tiên mua lại SIM với chính mức giá mà Á quân đã trả. Nếu Á quân bấm 'Từ chối mua SIM', hệ thống hoàn trả 100% tiền cọc cho Á quân ngay lập tức mà không áp dụng bất kỳ hình thức phạt hay trừ phí nào.",
  },
  {
    id: "faq-8",
    category: "auction",
    categoryLabel: "Kiểm Soát Liêm Chính",
    question: "Hành vi thông đồng mồi giá ảo là gì và TrustSim xử lý như thế nào?",
    answer:
      "Mồi giá ảo là chiêu trò khi 2 tài khoản thông đồng với nhau: Tài khoản thứ nhất trả giá thấp, tài khoản thứ hai đẩy vọt giá lên cực cao để dọa mọi người bỏ cuộc, sau đó tài khoản thứ hai cố tình bùng cọc để ép người bán phải chuyển SIM cho tài khoản thứ nhất giá rẻ. TrustSim áp dụng quy tắc kiểm soát an toàn: Tỷ lệ chênh lệch giữa giá người nhất và giá người nhì không được vượt quá 1.5 lần (150%). Nếu vượt ngưỡng này hoặc phiên có dưới 2 người tham gia độc lập, hệ thống sẽ hủy bỏ phiên đấu giá, trả SIM về cho người bán và không cho phép chuyển nhượng cho người nhì.",
  },
  {
    id: "faq-9",
    category: "handover",
    categoryLabel: "Sang Tên & Hợp Đồng",
    question: "Hợp đồng điện tử ký trên sàn TrustSim có giá trị pháp lý không?",
    answer:
      "CÓ ĐẦY ĐỦ GIÁ TRỊ PHÁP LÝ. Hợp đồng chuyển nhượng quyền sử dụng số thuê bao viễn thông được thiết lập tự động, ký kết qua mã xác thực OTP gắn liền với căn cước công dân chính chủ của hai bên, tuân thủ nghiêm ngặt Luật Giao dịch Điện tử và các quy định của pháp luật Việt Nam về thương mại điện tử.",
  },
  {
    id: "faq-10",
    category: "handover",
    categoryLabel: "Sang Tên & Hợp Đồng",
    question: "Quy trình đổi tên chính chủ tại điểm giao dịch nhà mạng diễn ra như thế nào?",
    answer:
      "Sau khi tiền mua SIM đã được khóa an toàn trong tài khoản ký quỹ, hai bên hẹn gặp tại bất kỳ Cửa hàng / Điểm giao dịch chính thức của nhà mạng (Viettel, VinaPhone, MobiFone). Hai bên xuất trình căn cước công dân gắn chip để nhân viên nhà mạng làm thủ tục đổi phôi SIM và đăng ký chính chủ cho người mua. Sau khi ảnh biên nhận sang tên được tải lên hệ thống, tiền lập tức được giải ngân vào ví người bán trong vòng 15 phút.",
  },
];

/* ─── Mục Lục Điều Hướng ─────────────────────────────────── */
type ChapterKey = "all" | "escrow" | "auction_rules" | "runner_up" | "handover" | "faq";

export default function RegulationsPage() {
  const [activeChapter, setActiveChapter] = useState<ChapterKey>("all");
  const [faqSearch, setFaqSearch] = useState("");
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>("all");
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({ "faq-1": true, "faq-5": true });

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((f) => {
      const matchCat = faqCategoryFilter === "all" || f.category === faqCategoryFilter;
      const matchSearch =
        !faqSearch ||
        f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
        f.answer.toLowerCase().includes(faqSearch.toLowerCase()) ||
        f.categoryLabel.toLowerCase().includes(faqSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [faqCategoryFilter, faqSearch]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-20 pb-20">
        {/* ═══ 1. BANNER QUY CHẾ VÀ ĐIỀU KHOẢN ═══ */}
        <section className="bg-gradient-to-br from-[#001743] via-[#00225c] to-[#0A2540] text-white pt-10 pb-12 border-b border-[#0D2847] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 relative z-10">
            {/* Đường dẫn trang */}
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
              <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
              <span>/</span>
              <span className="text-white font-medium">Trung tâm Pháp Lý &amp; Quy Chế</span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-white/10 text-slate-200 border border-white/15 mb-3">
                  <Scale size={13} className="text-emerald-400" />
                  <span>Văn Bản Quy Chế Hoạt Động Sàn · Năm 2026</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white">
                  Quy Chế Giao Dịch, Ký Quỹ &amp; Luật Đấu Giá Minh Bạch
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
                  Văn bản hợp nhất quy định về nghĩa vụ ký quỹ 100%, cơ chế bù giờ tự động chống cướp giá phút chót,
                  chế tài phạt bùng cọc theo tỷ lệ 50/50 và quyền nhận mua của người về nhì (Á quân) nhằm bảo đảm an toàn, công bằng tuyệt đối cho khách hàng.
                </p>
              </div>

              {/* Nút hành động nhanh */}
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <a
                  href="#faq"
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 transition-all flex items-center gap-1.5"
                >
                  <HelpCircle size={14} className="text-amber-400" />
                  <span>Giải đáp thắc mắc</span>
                </a>
                <Link
                  href="/auctions"
                  className="px-4 py-2.5 rounded-xl bg-[#E4011E] hover:bg-[#C00119] active:scale-[0.99] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <Gavel size={14} />
                  <span>Vào sàn đấu giá</span>
                </Link>
              </div>
            </div>

            {/* 4 Trụ Cột An Toàn */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10">
              {[
                { icon: <Lock size={15} className="text-emerald-400" />, title: "Ký Quỹ 100% An Toàn", desc: "Tiền cọc giữ tại ngân hàng bảo lãnh, hoàn 100% nếu không trúng" },
                { icon: <Clock size={15} className="text-amber-400" />, title: "Tự Động Bù Giờ Phút Chót", desc: "Tự động cộng thêm thời gian khi có người trả giá ở giây cuối" },
                { icon: <AlertTriangle size={15} className="text-rose-400" />, title: "Chế Tài Phạt Cọc 50/50", desc: "50% bồi thường cho Người bán, 50% nộp vào Quỹ bảo đảm" },
                { icon: <Award size={15} className="text-blue-400" />, title: "Quyền Mua Của Á Quân", desc: "Quyền nhận mua minh bạch cho người nhì khi người nhất bỏ cuộc" },
              ].map((p, i) => (
                <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">{p.icon}</div>
                  <div>
                    <h2 className="text-xs font-bold text-white">{p.title}</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 2. BỐ CỤC CHÍNH (MỤC LỤC & NỘI DUNG) ═══ */}
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">

            {/* ── MỤC LỤC NEO BÊN TRÁI ── */}
            <aside className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs lg:sticky lg:top-24 space-y-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Mục lục văn bản quy chế
              </div>
              <nav className="space-y-1 text-xs font-semibold">
                {[
                  { key: "all", label: "Toàn văn quy chế", href: "#all" },
                  { key: "escrow", label: "Chương I: Ký Quỹ Đặt Cọc & Hoàn Tiền", href: "#escrow" },
                  { key: "auction_rules", label: "Chương II: Luật Đấu Giá Tăng & Giảm Dần", href: "#auction-rules" },
                  { key: "runner_up", label: "Chương III: Chế Tài Bùng Cọc & Quyền Á Quân", href: "#runner-up" },
                  { key: "handover", label: "Chương IV: Quy Trình Sang Tên 5 Bước", href: "#handover" },
                  { key: "faq", label: "Chương V: Câu Hỏi Thường Gặp & Giải Đáp", href: "#faq" },
                ].map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    onClick={() => setActiveChapter(item.key as ChapterKey)}
                    className={`block px-3 py-2.5 rounded-xl transition-all ${
                      activeChapter === item.key
                        ? "bg-[#001743] text-white font-bold shadow-xs"
                        : "text-slate-600 hover:text-[#001743] hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="pt-3 border-t border-slate-100 px-2 space-y-2">
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  Cần hỗ trợ phân xử giao dịch hoặc khiếu nại vi phạm?
                </div>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E4011E] hover:underline"
                >
                  <PhoneCall size={12} />
                  <span>Tổng đài giải quyết khiếu nại</span>
                </a>
              </div>
            </aside>

            {/* ── NỘI DUNG VĂN BẢN CHI TIẾT ── */}
            <div className="space-y-8">

              {/* ═══ CHƯƠNG I: KÝ QUỸ ĐẶT CỌC & HOÀN TIỀN ═══ */}
              <section id="escrow" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold text-sm shrink-0">
                    I
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block">Chương I</span>
                    <h2 className="text-lg sm:text-xl font-bold text-[#001743]">
                      Quy Chế Ký Quỹ Đặt Cọc &amp; Bảo Đảm Hoàn Tiền 100%
                    </h2>
                  </div>
                </div>

                {/* Điều 1 */}
                <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <h3 className="font-bold text-sm text-[#001743]">Điều 1. Nghĩa vụ đặt cọc ký quỹ trước khi đấu giá</h3>
                  <p>
                    1. Trước khi gửi lệnh trả giá trong phiên đấu giá giá lên hoặc bấm nút Mua ngay trong phiên đấu giá giá xuống, người tham gia bắt buộc phải thực hiện đặt cọc ký quỹ một khoản tiền theo quy định của từng phiên (thông thường từ 10% đến 20% giá khởi điểm).
                  </p>
                  <p>
                    2. Khoản tiền cọc này được hệ thống phong tỏa độc lập trong số dư ví TrustSim của người tham gia. Trong suốt thời gian diễn ra phiên đấu giá, số tiền này được bảo đảm an toàn và không thể sử dụng cho các mục đích khác.
                  </p>
                </div>

                {/* Điều 2 */}
                <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed pt-3 border-t border-slate-100">
                  <h3 className="font-bold text-sm text-[#001743]">Điều 2. Tự động hoàn trả 100% tiền cọc cho người không trúng</h3>
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs">
                      <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                      <span>Cam kết bảo toàn nguồn vốn của khách hàng</span>
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      Ngay thời điểm phiên đấu giá kết thúc (gõ búa), hệ thống tự động giải phóng 100% tiền đặt cọc của toàn bộ những người tham gia không trúng thầu về số dư ví khả dụng ngay lập tức. Khách hàng có thể đặt lệnh rút tiền về tài khoản ngân hàng liên kết bất kỳ lúc nào mà không phải chịu bất kỳ khoản phí nào từ Sàn.
                    </p>
                  </div>
                </div>

                {/* Điều 3 */}
                <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed pt-3 border-t border-slate-100">
                  <h3 className="font-bold text-sm text-[#001743]">Điều 3. Trừ thẳng tiền cọc vào giá thanh toán hợp đồng</h3>
                  <p>
                    Đối với người thắng cuộc (Quán quân), số tiền cọc đã phong tỏa sẽ được hệ thống tự động cấn trừ thẳng vào giá trúng đấu giá chính thức:
                  </p>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-[#001743]">
                    Số tiền cần nạp thêm = Giá chốt trúng đấu giá - Tiền đặt cọc đã phong tỏa
                  </div>
                </div>
              </section>

              {/* ═══ CHƯƠNG II: LUẬT ĐẤU GIÁ TĂNG DẦN & GIẢM DẦN ═══ */}
              <section id="auction-rules" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-sm shrink-0">
                    II
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest block">Chương II</span>
                    <h2 className="text-lg sm:text-xl font-bold text-[#001743]">
                      Luật Đấu Giá Giá Lên (Tăng Dần) &amp; Đấu Giá Giá Xuống (Giảm Dần)
                    </h2>
                  </div>
                </div>

                {/* Đấu giá kiểu Anh */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <TrendingUp size={13} className="inline mr-1 text-amber-600" />
                      1. Cơ Chế Đấu Giá Giá Lên (Kiểu Anh)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <strong className="text-[#001743] block">Bước giá tối thiểu:</strong>
                      <p className="text-slate-600 leading-relaxed">
                        Mỗi lượt trả giá hợp lệ phải cao hơn mức giá hiện tại ít nhất bằng một bước giá do chủ phiên quy định.
                      </p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <strong className="text-[#001743] block">Mức tăng giá tối đa mỗi lượt:</strong>
                      <p className="text-slate-600 leading-relaxed">
                        Để ngăn chặn việc nhảy giá bất thường phá rối phiên, mỗi người tham gia chỉ được nâng tối đa 10 lần bước giá trong một lượt bấm.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cơ chế tự động bù giờ */}
                <div className="space-y-2 pt-2">
                  <h3 className="font-bold text-sm text-[#001743] flex items-center gap-2">
                    <Clock size={15} className="text-amber-600" />
                    <span>Điều 4. Cơ chế tự động bù giờ ở những giây cuối phiên</span>
                  </h3>
                  <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950 leading-relaxed space-y-1.5">
                    <p>
                      Để bảo đảm công bằng và ngăn chặn việc dùng công cụ tự động đặt giá ở 1–2 giây cuối cùng khiến người khác không kịp phản ứng, nếu có bất kỳ lượt trả giá hợp lệ nào xuất hiện trong khoảng thời gian đếm ngược quy định (30–60 giây cuối phiên), hệ thống sẽ:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li>Tự động cộng thêm thời gian cho phiên đấu giá từ <strong>30 đến 60 giây</strong>.</li>
                      <li>Phát âm thanh thông báo và làm nổi bật tín hiệu trên màn hình của tất cả người tham gia.</li>
                      <li>Tạo cơ hội để những người tham gia khác có đủ thời gian cân nhắc đưa ra mức giá mới.</li>
                    </ul>
                  </div>
                </div>

                {/* Đấu giá kiểu Hà Lan */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      <TrendingDown size={13} className="inline mr-1 text-blue-600" />
                      2. Cơ Chế Đấu Giá Giá Xuống (Kiểu Hà Lan)
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Phiên đấu giá bắt đầu từ mức giá cao nhất do người bán thiết lập và tự động giảm dần đều đặn theo từng chu kỳ định sẵn (ví dụ giảm 1.000.000 ₫ mỗi 60 giây). Người tham gia đầu tiên bấm nút <strong>MUA NGAY</strong> tại mức giá đang hiển thị sẽ lập tức giành quyền sở hữu số SIM và phiên kết thúc ngay. Nếu giá giảm chạm <strong>Giá sàn tối thiểu của người bán</strong> mà vẫn không có ai mua, phiên sẽ tự động đóng lại.
                  </p>
                </div>
              </section>

              {/* ═══ CHƯƠNG III: CHẾ TÀI BÙNG CỌC & QUYỀN Á QUÂN ═══ */}
              <section id="runner-up" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold text-sm shrink-0">
                    III
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest block">Chương III</span>
                    <h2 className="text-lg sm:text-xl font-bold text-[#001743]">
                      Chế Tài Phạt Bùng Cọc 50/50 &amp; Quyền Nhận Mua Của Á Quân
                    </h2>
                  </div>
                </div>

                {/* Điều 5 */}
                <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <h3 className="font-bold text-sm text-[#001743]">Điều 5. Thời hạn thanh toán bổ sung</h3>
                  <p>
                    Khi phiên kết thúc, người thắng cuộc được cấp khoảng thời gian thanh toán bổ sung là 24 giờ. Người thắng có nghĩa vụ hoàn tất thanh toán số tiền còn lại trước khi thời gian này đếm về 0.
                  </p>
                </div>

                {/* Điều 6: Phạt bùng cọc 50/50 */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h3 className="font-bold text-sm text-[#001743]">
                    Điều 6. Chế tài xử lý khi người thắng bùng cọc
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Nếu người thắng chủ động bấm <strong>"Bỏ Mua SIM"</strong> hoặc <strong>để hết thời hạn 24 giờ mà không thanh toán</strong>, hệ thống tự động xử lý chế tài:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                        <Wallet size={15} className="text-emerald-600" />
                        <span>50% BỒI THƯỜNG CHO NGƯỜI BÁN</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        Hệ thống tự động chuyển 50% tiền cọc của người thắng vào ví khả dụng của Người Bán để bù đắp chi phí cơ hội và thời gian mở phiên.
                      </p>
                    </div>

                    <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-950">
                        <Scale size={15} className="text-rose-600" />
                        <span>50% NỘP VÀO QUỸ BẢO ĐẢM CỦA SÀN</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        50% tiền cọc còn lại được nộp vào Quỹ bảo đảm an toàn giao dịch của Sàn TrustSim. Tài khoản vi phạm sẽ bị khóa quyền tham gia đấu giá.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Điều 7: Kiểm soát mồi giá ảo */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h3 className="font-bold text-sm text-[#001743]">
                    Điều 7. Kiểm soát liêm chính &amp; Vô hiệu hóa hành vi thông đồng mồi giá ảo
                  </h3>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700 leading-relaxed">
                    <p className="font-bold text-[#001743]">
                      Để ngăn chặn tình trạng tài khoản phụ nhảy giá ảo rồi bùng cọc nhằm giúp tài khoản chính (Á quân) mua rẻ:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>
                        <strong>Tỷ lệ chênh lệch giá an toàn:</strong> Tỷ lệ giữa Giá Người Nhất / Giá Người Nhì không được vượt quá <strong>1.5 lần</strong> (150%). Nếu vượt ngưỡng 1.5 lần, hệ thống sẽ tự động hủy phiên đấu giá để bảo vệ người bán.
                      </li>
                      <li>
                        <strong>Số lượng người tham gia tối thiểu:</strong> Phiên phải có từ 2 người đặt giá độc lập trở lên mới đủ điều kiện xét chuyển nhượng cho Á quân.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Điều 8: Quyền Á Quân */}
                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <h3 className="font-bold text-sm text-[#001743]">
                    Điều 8. Quyền phê duyệt của Người Bán &amp; Quyền nhận mua của Á Quân
                  </h3>
                  <p>
                    1. Người Bán có quyền xem xét mức giá của Á quân để quyết định <strong>Đồng ý bán</strong> hoặc <strong>Từ chối bán</strong> (giữ nguyên số tiền được bồi thường cọc và nhận lại SIM).
                  </p>
                  <p>
                    2. Nếu Người Bán đồng ý, quyền mua được chuyển sang cho Á quân. Á quân có toàn quyền lựa chọn:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
                    <li><strong>Đồng ý mua SIM:</strong> Thanh toán số tiền theo đúng mức giá chính mình đã trả và nhận hợp đồng chuyển nhượng chính thức.</li>
                    <li><strong>Từ chối mua SIM:</strong> Được hoàn trả 100% tiền đặt cọc ngay lập tức mà không chịu bất kỳ hình thức phạt nào.</li>
                  </ul>
                </div>
              </section>

              {/* ═══ CHƯƠNG IV: QUY TRÌNH SANG TÊN 5 BƯỚC ═══ */}
              <section id="handover" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold text-sm shrink-0">
                    IV
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest block">Chương IV</span>
                    <h2 className="text-lg sm:text-xl font-bold text-[#001743]">
                      Quy Trình 5 Bước Bàn Giao, Sang Tên Chính Chủ &amp; Giải Ngân
                    </h2>
                  </div>
                </div>

                {/* 5 Bước Giao Dịch */}
                <div className="space-y-3">
                  {[
                    { step: "01", title: "Khám phá & Đặt cọc ký quỹ", desc: "Thành viên chọn SIM ưng ý, nạp tiền ký quỹ bảo đảm theo tỷ lệ quy định để kích hoạt quyền trả giá." },
                    { step: "02", title: "Đấu giá trực tiếp công khai", desc: "Tham gia đặt giá minh bạch trong phiên hoặc chốt lệnh mua ngay đối với phiên giá xuống." },
                    { step: "03", title: "Xác nhận kết quả & Khóa giữ số", desc: "Hệ thống lập biên bản điện tử, khóa quyền sở hữu SIM để chuẩn bị thủ tục chuyển nhượng." },
                    { step: "04", title: "Ký hợp đồng chuyển nhượng điện tử", desc: "Hai bên ký hợp đồng chuyển nhượng có giá trị pháp lý, tiền thanh toán được lưu giữ an toàn tại tài khoản ký quỹ." },
                    { step: "05", title: "Sang tên tại nhà mạng & Giải ngân tiền", desc: "Hai bên xuất trình CCCD tại điểm giao dịch của nhà mạng để đổi phôi SIM chính chủ. Tiền bán SIM được giải ngân cho người bán trong 15 phút." },
                  ].map((s, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-4">
                      <span className="font-mono font-black text-sm text-[#001743] bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs shrink-0">
                        BƯỚC {s.step}
                      </span>
                      <div>
                        <h3 className="font-bold text-xs sm:text-sm text-[#001743]">{s.title}</h3>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ═══ CHƯƠNG V: CÂU HỎI THƯỜNG GẶP (FAQ) ═══ */}
              <section id="faq" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold text-sm shrink-0">
                      V
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block">Chương V</span>
                      <h2 className="text-lg sm:text-xl font-bold text-[#001743]">
                        Giải Đáp Thắc Mắc &amp; Tình Huống Thực Tế
                      </h2>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
                    {filteredFaqs.length} câu hỏi
                  </span>
                </div>

                {/* Tìm kiếm & Phân loại câu hỏi */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={faqSearch}
                      onChange={(e) => setFaqSearch(e.target.value)}
                      placeholder="Tìm kiếm câu hỏi (ví dụ: hoàn cọc, bùng cọc, phạt 50/50, sang tên...)"
                      className="w-full py-2.5 pl-9 pr-4 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#001743] focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                      { key: "all", label: "Tất cả" },
                      { key: "escrow", label: "Ký quỹ & Hoàn tiền" },
                      { key: "auction", label: "Luật đấu giá" },
                      { key: "penalty", label: "Phạt cọc" },
                      { key: "handover", label: "Sang tên" },
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setFaqCategoryFilter(cat.key)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          faqCategoryFilter === cat.key
                            ? "bg-[#001743] text-white font-bold"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Danh sách câu hỏi dạng mở/đóng */}
                <div className="space-y-3">
                  {filteredFaqs.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Không tìm thấy câu hỏi nào phù hợp với từ khóa của bạn.
                    </div>
                  ) : (
                    filteredFaqs.map((faq) => {
                      const isOpen = Boolean(openFaqIds[faq.id]);
                      return (
                        <div
                          key={faq.id}
                          className="border border-slate-200 rounded-xl overflow-hidden transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => toggleFaq(faq.id)}
                            className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0 mt-0.5">
                                {faq.categoryLabel}
                              </span>
                              <h3 className="text-xs sm:text-sm font-bold text-[#001743] leading-snug">
                                {faq.question}
                              </h3>
                            </div>
                            <span className="text-slate-400 shrink-0">
                              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                          </button>

                          {isOpen && (
                            <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* ═══ KHỐI LIÊN HỆ & GIẢI QUYẾT KHIẾU NẠI ═══ */}
              <section id="contact" className="bg-gradient-to-r from-slate-900 to-[#001743] text-white rounded-2xl p-6 sm:p-8 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 text-emerald-300 text-[11px] font-bold uppercase mb-2">
                      <ShieldCheck size={13} />
                      <span>Hội Đồng Giám Sát &amp; Phân Xử Sàn</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      Cần Trợ Giúp Về Khiếu Nại Giao Dịch &amp; Đối Soát?
                    </h2>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                      Mọi thắc mắc về phân xử bồi thường cọc hoặc tranh chấp sang tên chính chủ đều được Hội đồng Pháp lý TrustSim tiếp nhận và xử lý nhanh chóng trong vòng 24 giờ.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <a
                      href="tel:19006868"
                      className="px-5 py-3 rounded-xl bg-[#E4011E] hover:bg-[#C00119] active:scale-[0.99] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
                    >
                      <PhoneCall size={14} />
                      <span>Tổng đài: 1900 6868</span>
                    </a>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
