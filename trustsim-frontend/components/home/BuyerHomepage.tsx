"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  FileSignature,
  Gavel,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { auctionService, type AuctionDto, type GetAuctionsParams } from "@/services/auctionService";
import { getCarriers, type SimCarrierDto } from "@/services/carrierService";
import { AuctionSortBy, SortOrder } from "@/types/common";
import styles from "./BuyerHomepage.module.css";

type BudgetKey = "all" | "under10" | "10to20" | "20to50" | "over50";

type SearchCriteria = {
  keyword: string;
  carrierId: string;
  budget: BudgetKey;
};

const INITIAL_CRITERIA: SearchCriteria = {
  keyword: "",
  carrierId: "all",
  budget: "all",
};

const BUDGETS: Array<{
  key: BudgetKey;
  label: string;
  minPrice?: number;
  maxPrice?: number;
}> = [
  { key: "all", label: "Mọi ngân sách" },
  { key: "under10", label: "Dưới 10 triệu", maxPrice: 10_000_000 },
  { key: "10to20", label: "10 – 20 triệu", minPrice: 10_000_000, maxPrice: 20_000_000 },
  { key: "20to50", label: "20 – 50 triệu", minPrice: 20_000_000, maxPrice: 50_000_000 },
  { key: "over50", label: "Trên 50 triệu", minPrice: 50_000_000 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 10) return value;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
};

const formatEndTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa xác định";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const isPublicAuction = (auction: AuctionDto) =>
  auction.auctionStatus !== "DRAFT" && String(auction.auctionStatus) !== "0";

const getStatusLabel = (status: string) => {
  if (status === "ACTIVE" || String(status) === "2") return "Đang diễn ra";
  if (status === "SCHEDULE" || String(status) === "1") return "Sắp diễn ra";
  return "Đã kết thúc";
};

const PROCESS_STEPS = [
  { title: "Đăng ký và đặt cọc", desc: "Xác thực danh tính, đặt cọc để tham gia phiên." },
  { title: "Tham gia đấu giá", desc: "Đặt giá theo thời gian thực, có bù giờ phút chót." },
  { title: "Ký hợp đồng điện tử", desc: "Ký bằng OTP, tiền ký quỹ được sàn giữ trung gian." },
  { title: "Hoàn tất sang tên SIM", desc: "Chụp bằng chứng chuyển nhượng, nhận SIM và hoàn tất." },
];

const getAuctionTypeLabel = (type: string) =>
  type === "DUTCH" || String(type) === "1" ? "Giảm dần" : "Tăng dần";

export default function BuyerHomepage() {
  const [criteria, setCriteria] = useState<SearchCriteria>(INITIAL_CRITERIA);
  const [appliedCriteria, setAppliedCriteria] = useState<SearchCriteria>(INITIAL_CRITERIA);
  const [carriers, setCarriers] = useState<SimCarrierDto[]>([]);
  const [auctions, setAuctions] = useState<AuctionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const requestIdRef = useRef(0);

  const loadAuctions = useCallback(async (nextCriteria: SearchCriteria) => {
    const requestId = ++requestIdRef.current;
    const selectedBudget = BUDGETS.find((item) => item.key === nextCriteria.budget) ?? BUDGETS[0];

    setLoading(true);
    setError(null);
    setAppliedCriteria(nextCriteria);

    const params: GetAuctionsParams = {
      keyword: nextCriteria.keyword.trim() || undefined,
      carrierId: nextCriteria.carrierId !== "all" ? nextCriteria.carrierId : undefined,
      minPrice: selectedBudget.minPrice,
      maxPrice: selectedBudget.maxPrice,
      sortBy: AuctionSortBy.EndAt,
      sortOrder: SortOrder.Asc,
      pageIndex: 1,
      pageSize: 6,
    };

    if (!params.keyword && !params.carrierId && !params.minPrice && !params.maxPrice) {
      params.status = "ACTIVE";
    }

    try {
      const response = await auctionService.getAuctions(params);
      if (requestId !== requestIdRef.current) return;
      setAuctions((response.items ?? []).filter(isPublicAuction));
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return;
      setAuctions([]);
      setError(loadError instanceof Error ? loadError.message : "Không thể tải phiên đấu giá lúc này.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveStep((s) => (s + 1) % 4), 3500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    getCarriers()
      .then((items) => {
        if (active) setCarriers(items);
      })
      .catch(() => undefined);

    void loadAuctions(INITIAL_CRITERIA);

    return () => {
      active = false;
      requestIdRef.current += 1;
    };
  }, [loadAuctions]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadAuctions(criteria);
  };

  const applyPreset = (nextCriteria: SearchCriteria) => {
    setCriteria(nextCriteria);
    void loadAuctions(nextCriteria);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelector("#featured-auctions")?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const hasAppliedFilters = Boolean(
    appliedCriteria.keyword || appliedCriteria.carrierId !== "all" || appliedCriteria.budget !== "all"
  );

  const resultHeading = hasAppliedFilters ? "Phiên phù hợp với tiêu chí" : "Phiên đáng xem ngay";

  const fanAuctions = auctions.slice(0, 3);
  const [fanLeft, fanCenter, fanRight] = [fanAuctions[1], fanAuctions[0], fanAuctions[2]];

  const renderFanCard = (auction: AuctionDto | undefined, className: string) => {
    if (!auction) return null;
    return (
      <Link href={`/auctions/${auction.id}`} className={`${styles.fanCard} ${className}`}>
        <div className={styles.fanTop}>
          <span>{auction.carrierName || "Nhà mạng"}</span>
          <span>{getAuctionTypeLabel(auction.auctionType)}</span>
        </div>
        <strong className={styles.fanNumber}>{formatPhoneNumber(auction.simPhoneNumber)}</strong>
        <p className={styles.fanMeta}>{getStatusLabel(auction.auctionStatus)} · {auction.totalBids ?? 0} lượt đặt</p>
        <div className={styles.fanBid}>
          <span>Giá hiện tại</span>
          <strong>{formatCurrency(auction.currentPrice || auction.startingPrice)}</strong>
        </div>
        {className === styles.fanCenter ? (
          <div className={styles.fanCta}>
            Vào phiên ngay <ArrowRight size={15} aria-hidden="true" />
          </div>
        ) : null}
      </Link>
    );
  };

  return (
    <div className={styles.page}>
      {/* ── HERO ── */}
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={`${styles.shell} ${styles.heroInner}`}>
          <span className={styles.chip}>
            <Sparkles size={14} aria-hidden="true" /> Sàn đấu giá SIM minh bạch
          </span>
          <h1 id="home-title">
            Sở hữu số đẹp,
            <br />
            đấu giá <span className={styles.grad}>an tâm tuyệt đối</span>
          </h1>
          <p className={styles.lede}>
            Tìm theo dãy số, ngân sách và nhà mạng. Mọi phiên đều có ký quỹ độc lập và hợp đồng điện tử —
            nhanh, rõ ràng, đáng tin.
          </p>

          <form className={styles.searchPanel} onSubmit={handleSubmit} aria-label="Tìm phiên đấu giá SIM">
            <div className={styles.searchBar}>
              <Search size={19} aria-hidden="true" />
              <input
                value={criteria.keyword}
                onChange={(event) => setCriteria((current) => ({ ...current, keyword: event.target.value }))}
                placeholder="Nhập số hoặc mẫu số: 6868, 8888, 09…"
                aria-label="Số hoặc mẫu số"
              />
              <span className={styles.divider} aria-hidden="true" />
              <select
                aria-label="Nhà mạng"
                value={criteria.carrierId}
                onChange={(event) => setCriteria((current) => ({ ...current, carrierId: event.target.value }))}
              >
                <option value="all">Mọi nhà mạng</option>
                {carriers.map((carrier) => (
                  <option key={carrier.id} value={carrier.id}>
                    {carrier.carrierName}
                  </option>
                ))}
              </select>
              <span className={styles.divider} aria-hidden="true" />
              <select
                aria-label="Ngân sách"
                value={criteria.budget}
                onChange={(event) =>
                  setCriteria((current) => ({ ...current, budget: event.target.value as BudgetKey }))
                }
              >
                {BUDGETS.map((budget) => (
                  <option key={budget.key} value={budget.key}>
                    {budget.label}
                  </option>
                ))}
              </select>
              <button className={styles.searchButton} type="submit" disabled={loading}>
                {loading ? "Đang tìm…" : "Tìm phiên"}
                {!loading ? <ArrowRight size={17} aria-hidden="true" /> : null}
              </button>
            </div>

            <div className={styles.quickFilters} aria-label="Gợi ý tìm nhanh">
              <button type="button" onClick={() => applyPreset({ ...INITIAL_CRITERIA, budget: "10to20" })}>
                10 – 20 triệu
              </button>
              <button type="button" onClick={() => applyPreset({ ...INITIAL_CRITERIA, keyword: "68" })}>
                Lộc phát 68
              </button>
              <button type="button" onClick={() => applyPreset({ ...INITIAL_CRITERIA, keyword: "8888" })}>
                Tứ quý 8
              </button>
              <button type="button" onClick={() => applyPreset({ ...INITIAL_CRITERIA, keyword: "1234" })}>
                Sảnh tiến
              </button>
            </div>
          </form>

          {fanCenter ? (
            <div className={styles.fan} aria-label="Phiên đấu giá nổi bật">
              {renderFanCard(fanLeft, styles.fanLeft)}
              {renderFanCard(fanRight, styles.fanRight)}
              {renderFanCard(fanCenter, styles.fanCenter)}
            </div>
          ) : null}

          <div className={styles.laurel}>
            <div className={styles.laurelIcons} aria-hidden="true">
              <span><Smartphone size={16} /></span>
              <span><ShieldCheck size={16} /></span>
              <span><FileSignature size={16} /></span>
            </div>
            <strong>Giao dịch được bảo vệ đa tầng</strong>
            <small>Xác minh SIM chính chủ · Ký quỹ độc lập · Hợp đồng điện tử</small>
          </div>
        </div>
      </section>

      {/* ── STATEMENT ── */}
      <section className={styles.statement} aria-label="Giới thiệu">
        <div className={styles.shell}>
          <p>
            Trong thị trường SIM số đẹp nhiều rủi ro, TrustSim là nơi <span className={styles.grad}>minh bạch</span>{" "}
            <span className={styles.grad}>và đáng tin cậy.</span> Chúng tôi kiểm tra chính chủ, giữ tiền trung
            gian và ghi nhận từng bước —{" "}
            <span className={styles.fade}>
              để bạn tập trung chọn đúng con số mình muốn, không phải lo bị lừa hay mất cọc.
            </span>
          </p>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={styles.features} aria-labelledby="trust-title">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <span className={styles.chip}>
              <ShieldCheck size={14} aria-hidden="true" /> Bảo vệ giao dịch
            </span>
            <h2 className={styles.sectionTitle} id="trust-title">
              Đấu giá <span className={styles.grad}>minh bạch</span>, mỗi bước đều có dấu vết
            </h2>
            <p className={styles.sectionLede}>
              Từ xác minh quyền sở hữu đến khi nhận chuyển nhượng, quy trình được kiểm soát và lưu vết rõ ràng.
            </p>
          </div>

          <div className={styles.featureGrid}>
            <article className={styles.featureCard}>
              <span className={styles.featureIcon}><Smartphone size={18} aria-hidden="true" /></span>
              <div>
                <h3>Xác minh SIM chính chủ</h3>
                <p>Kiểm tra quyền sở hữu qua OTP và đối soát nhà mạng trước khi mở phiên.</p>
              </div>
            </article>
            <article className={styles.featureCard}>
              <span className={styles.featureIcon}><Wallet size={18} aria-hidden="true" /></span>
              <div>
                <h3>Ký quỹ độc lập</h3>
                <p>Tiền được giữ trung gian, chỉ chuyển cho người bán khi giao dịch hoàn tất.</p>
              </div>
            </article>
            <article className={styles.featureCard}>
              <span className={styles.featureIcon}><FileSignature size={18} aria-hidden="true" /></span>
              <div>
                <h3>Hợp đồng điện tử</h3>
                <p>Các bên ký xác nhận bằng OTP, hợp đồng được lưu vết và đối chiếu khi cần.</p>
              </div>
            </article>
            <article className={styles.featureCard}>
              <span className={styles.featureIcon}><Gavel size={18} aria-hidden="true" /></span>
              <div>
                <h3>Giải quyết tranh chấp</h3>
                <p>Có đầu mối, bằng chứng và quy chế xử lý rõ ràng cho cả người mua lẫn người bán.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className={styles.how} aria-labelledby="process-title">
        <div className={styles.shell}>
          <div className={styles.howGrid}>
            <div className={styles.howCopy}>
              <span className={styles.chip}>
                <Clock3 size={14} aria-hidden="true" /> Sau khi chọn được SIM
              </span>
              <h2 id="process-title">
                Từ đặt giá đến <span className={styles.grad}>nhận chuyển nhượng</span>
              </h2>
              <p>Bốn bước đơn giản, mọi khoản tiền và chữ ký đều được kiểm soát theo tiến trình.</p>
              <ol className={styles.steps}>
                {PROCESS_STEPS.map((step, index) => (
                  <li
                    key={step.title}
                    className={`${styles.step} ${index === activeStep ? styles.stepActive : ""}`}
                    onMouseEnter={() => setActiveStep(index)}
                  >
                    <span className={styles.stepNo}>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <span className="desc">{step.desc}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className={styles.phoneCard} aria-hidden="true">
              <div className={styles.sealBadge}>
                <BadgeCheck size={30} />
              </div>
              <h4>Hợp đồng đã ký thành công</h4>
              <p>Tiền ký quỹ đang được sàn giữ trung gian</p>
              <div className={styles.phoneRows}>
                <div><span>Số SIM</span><b>0868 686 868</b></div>
                <div><span>Hình thức</span><b>Đấu giá kiểu Anh</b></div>
                <div><span>Ký hợp đồng</span><b>OTP · Đã xác nhận</b></div>
                <div><span>Ký quỹ</span><b>Đang giữ an toàn</b></div>
              </div>
              <div className={styles.phoneBtn}>Tiếp tục sang tên SIM</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AUCTIONS ── */}
      <section className={styles.auctions} id="featured-auctions" aria-labelledby="auction-title">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <span className={styles.chip}>
              <Gavel size={14} aria-hidden="true" /> {hasAppliedFilters ? "Kết quả tìm kiếm" : "Đang trên sàn"}
            </span>
            <h2 className={styles.sectionTitle} id="auction-title">
              {hasAppliedFilters ? (
                <>Phiên <span className={styles.grad}>phù hợp</span> với tiêu chí</>
              ) : (
                <>Hôm nay bạn muốn sở hữu <span className={styles.grad}>số nào?</span></>
              )}
            </h2>
            <p className={styles.sectionLede}>
              Chọn một lối tắt hoặc dùng bộ tìm kiếm phía trên để tinh chỉnh theo nhu cầu của bạn.
            </p>
          </div>

          <div className={styles.presetRow}>
            <button type="button" className={styles.preset} onClick={() => applyPreset({ ...INITIAL_CRITERIA, budget: "under10" })}>
              Dưới 10 triệu
            </button>
            <button type="button" className={styles.preset} onClick={() => applyPreset({ ...INITIAL_CRITERIA, keyword: "68" })}>
              Lộc phát 68
            </button>
            <button type="button" className={styles.preset} onClick={() => applyPreset({ ...INITIAL_CRITERIA, keyword: "8888" })}>
              Tứ quý
            </button>
            <button type="button" className={styles.preset} onClick={() => applyPreset(INITIAL_CRITERIA)}>
              Sắp kết thúc
            </button>
          </div>

          {error ? (
            <div className={styles.statePanel} role="alert">
              <strong>Chưa thể tải phiên đấu giá.</strong>
              <p>{error}</p>
              <button type="button" onClick={() => void loadAuctions(appliedCriteria)}>
                Thử lại
              </button>
            </div>
          ) : loading ? (
            <div className={styles.auctionGrid} aria-label="Đang tải phiên đấu giá" aria-busy="true">
              {Array.from({ length: 3 }).map((_, index) => (
                <div className={styles.skeleton} key={index} />
              ))}
            </div>
          ) : auctions.length === 0 ? (
            <div className={styles.statePanel}>
              <strong>Chưa có phiên phù hợp.</strong>
              <p>Thử bỏ bớt tiêu chí hoặc chuyển sang một khoảng ngân sách rộng hơn.</p>
              <button type="button" onClick={() => applyPreset(INITIAL_CRITERIA)}>
                Xem phiên đang diễn ra
              </button>
            </div>
          ) : (
            <div className={styles.auctionGrid}>
              {auctions.map((auction) => {
                const isLive = auction.auctionStatus === "ACTIVE" || String(auction.auctionStatus) === "2";
                return (
                  <Link className={styles.auctionCard} href={`/auctions/${auction.id}`} key={auction.id}>
                    <div className={styles.cardMeta}>
                      <span className={styles.statusPill} data-live={isLive}>
                        {getStatusLabel(auction.auctionStatus)}
                      </span>
                      <time dateTime={auction.endAt}>Kết thúc {formatEndTime(auction.endAt)}</time>
                    </div>
                    <h3>{formatPhoneNumber(auction.simPhoneNumber)}</h3>
                    <p className={styles.cardDescriptor}>
                      {auction.carrierName || "Nhà mạng chưa cập nhật"} · {getAuctionTypeLabel(auction.auctionType)}
                    </p>
                    <div className={styles.cardPrice}>
                      <span>Giá hiện tại</span>
                      <strong>{formatCurrency(auction.currentPrice || auction.startingPrice)}</strong>
                    </div>
                    <div className={styles.cardFooter}>
                      <span>
                        <Users size={15} aria-hidden="true" /> {auction.totalBids ?? 0} lượt đặt
                      </span>
                      <span className={styles.cardArrow}>
                        <ArrowRight size={15} aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className={styles.moreRow}>
            <Link href="/auctions" className={styles.ghostBtn}>
              Xem toàn bộ sàn <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.cta} aria-label="Bắt đầu">
        <div className={styles.shell}>
          <div className={styles.ctaBox}>
            <h2>Sẵn sàng đấu giá hoặc đăng bán SIM của bạn?</h2>
            <p>Tạo tài khoản, xác thực danh tính và tham gia sàn trong vài phút. Mọi giao dịch đều được ký quỹ an toàn.</p>
            <div className={styles.ctaActions}>
              <Link href="/register" className={styles.ctaPrimary}>
                Tạo tài khoản <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/regulations" className={styles.ctaSecondary}>
                Xem quy chế sàn
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
