"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Clock3,
  FileSignature,
  Gavel,
  Search,
  ShieldCheck,
  Smartphone,
  Users,
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

const getAuctionTypeLabel = (type: string) =>
  type === "DUTCH" || String(type) === "1" ? "Giảm dần" : "Tăng dần";

export default function BuyerHomepage() {
  const [criteria, setCriteria] = useState<SearchCriteria>(INITIAL_CRITERIA);
  const [appliedCriteria, setAppliedCriteria] = useState<SearchCriteria>(INITIAL_CRITERIA);
  const [carriers, setCarriers] = useState<SimCarrierDto[]>([]);
  const [auctions, setAuctions] = useState<AuctionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroRule} aria-hidden="true" />
        <div className={styles.shell}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Sàn đấu giá SIM minh bạch</p>
            <h1 id="home-title">
              Tìm đúng số.
              <br />
              Vào đúng phiên.
            </h1>
            <p className={styles.lede}>
              Tìm theo dãy số, ngân sách và nhà mạng. TrustSim đưa những phiên phù hợp lên trước để bạn
              so sánh và quyết định nhanh hơn.
            </p>
          </div>

          <form className={styles.searchPanel} onSubmit={handleSubmit} aria-label="Tìm phiên đấu giá SIM">
            <label className={styles.searchField}>
              <span>Số hoặc mẫu số</span>
              <div className={styles.inputWrap}>
                <Search size={19} aria-hidden="true" />
                <input
                  value={criteria.keyword}
                  onChange={(event) => setCriteria((current) => ({ ...current, keyword: event.target.value }))}
                  placeholder="Ví dụ: 6868, 8888, 09…"
                />
              </div>
            </label>

            <label className={styles.selectField}>
              <span>Nhà mạng</span>
              <select
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
            </label>

            <label className={styles.selectField}>
              <span>Ngân sách</span>
              <select
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
            </label>

            <button className={styles.searchButton} type="submit" disabled={loading}>
              {loading ? "Đang tìm…" : "Tìm phiên đấu giá"}
              {!loading ? <ArrowRight size={18} aria-hidden="true" /> : null}
            </button>

            <div className={styles.quickFilters} aria-label="Gợi ý tìm nhanh">
              <button
                type="button"
                onClick={() => applyPreset({ ...INITIAL_CRITERIA, budget: "10to20" })}
              >
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
        </div>
      </section>

      <section className={styles.discovery} aria-labelledby="discovery-title">
        <div className={styles.shell}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Bắt đầu theo cách của bạn</p>
              <h2 id="discovery-title">Khám phá theo nhu cầu mua</h2>
            </div>
            <p>Chọn một lối tắt, sau đó tinh chỉnh thêm bằng bộ tìm kiếm phía trên.</p>
          </div>

          <div className={styles.discoveryGrid}>
            <button type="button" onClick={() => applyPreset({ ...INITIAL_CRITERIA, budget: "under10" })}>
              <span>Ngân sách dễ bắt đầu</span>
              <strong>Dưới 10 triệu</strong>
              <small>Xem các phiên có mức giá hiện tại phù hợp.</small>
            </button>
            <button type="button" onClick={() => applyPreset({ ...INITIAL_CRITERIA, keyword: "68" })}>
              <span>Ý nghĩa tài lộc</span>
              <strong>Lộc phát 68</strong>
              <small>Tìm các dãy số có nhịp 6 và 8.</small>
            </button>
            <button type="button" onClick={() => applyPreset({ ...INITIAL_CRITERIA, keyword: "8888" })}>
              <span>Dấu ấn mạnh</span>
              <strong>Tứ quý</strong>
              <small>Ưu tiên những dãy số lặp dễ nhận diện.</small>
            </button>
            <button type="button" onClick={() => applyPreset(INITIAL_CRITERIA)}>
              <span>Cần quyết định sớm</span>
              <strong>Sắp kết thúc</strong>
              <small>Phiên đang hoạt động được xếp theo thời gian còn lại.</small>
            </button>
          </div>
        </div>
      </section>

      <section className={styles.auctionSection} id="featured-auctions" aria-labelledby="auction-title">
        <div className={styles.shell}>
          <div className={styles.auctionHeading}>
            <div>
              <p className={styles.kicker}>{hasAppliedFilters ? "Kết quả tìm kiếm" : "Đang trên sàn"}</p>
              <h2 id="auction-title">{resultHeading}</h2>
            </div>
            <Link href="/auctions" className={styles.allAuctionsLink}>
              Xem toàn bộ sàn <ArrowRight size={17} aria-hidden="true" />
            </Link>
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
              {auctions.map((auction, index) => (
                <Link
                  className={`${styles.auctionCard} ${index === 0 ? styles.primaryAuction : ""}`}
                  href={`/auctions/${auction.id}`}
                  key={auction.id}
                >
                  <div className={styles.cardMeta}>
                    <span data-status={auction.auctionStatus}>{getStatusLabel(auction.auctionStatus)}</span>
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
                    <span className={styles.cardAction}>
                      Xem phiên <ArrowRight size={16} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className={styles.trustSection} aria-labelledby="trust-title">
        <div className={styles.shell}>
          <div className={styles.trustIntro}>
            <p className={styles.kicker}>Bảo vệ giao dịch</p>
            <h2 id="trust-title">Mỗi phiên đều có dấu vết rõ ràng.</h2>
            <Link href="/regulations">
              Xem quy chế sàn <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.trustList}>
            <article>
              <Smartphone aria-hidden="true" />
              <div>
                <h3>Xác minh SIM</h3>
                <p>Kiểm tra quyền sở hữu trước khi mở phiên.</p>
              </div>
            </article>
            <article>
              <ShieldCheck aria-hidden="true" />
              <div>
                <h3>Ký quỹ giao dịch</h3>
                <p>Khoản tiền được kiểm soát theo tiến trình.</p>
              </div>
            </article>
            <article>
              <FileSignature aria-hidden="true" />
              <div>
                <h3>Hợp đồng điện tử</h3>
                <p>Các bên ký xác nhận và lưu vết giao dịch.</p>
              </div>
            </article>
            <article>
              <Gavel aria-hidden="true" />
              <div>
                <h3>Quy trình tranh chấp</h3>
                <p>Có đầu mối và quy chế xử lý rõ ràng.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.processSection} aria-labelledby="process-title">
        <div className={styles.shell}>
          <div className={styles.processHeading}>
            <Clock3 aria-hidden="true" />
            <div>
              <p className={styles.kicker}>Sau khi chọn được SIM</p>
              <h2 id="process-title">Từ đặt giá đến nhận chuyển nhượng.</h2>
            </div>
          </div>
          <ol className={styles.processList}>
            <li><span>01</span><strong>Đăng ký và đặt cọc</strong></li>
            <li><span>02</span><strong>Tham gia đấu giá</strong></li>
            <li><span>03</span><strong>Ký hợp đồng điện tử</strong></li>
            <li><span>04</span><strong>Hoàn tất sang tên SIM</strong></li>
          </ol>
        </div>
      </section>
    </div>
  );
}
