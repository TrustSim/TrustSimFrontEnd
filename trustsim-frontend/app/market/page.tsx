"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, SlidersHorizontal, ShieldCheck, RefreshCw,
  ChevronLeft, ChevronRight, Gavel, ShoppingBag, AlertCircle,
  X, Phone,
} from "lucide-react";
import {
  getSims, formatPhoneNumber, getCarrierColor, getSimStatusLabel,
  type SimNumberDto, type SimStatus, type PagedResult,
} from "@/services/simService";
import { RightDrawer, DrawerBody, DrawerFooter, BtnPrimary, BtnSecondary } from "@/components/ui/RightDrawer";
import { PhysicalSimCard } from "@/components/ui/PhysicalSimCard";

// --- Constants ---
const CARRIERS = ["Tất cả", "Viettel", "Mobifone", "Vinaphone", "Vietnamobile", "Wintel"];
const STATUS_OPTIONS: { label: string; value: SimStatus | "" }[] = [
  { label: "Tất cả", value: "" },
  { label: "Đang bán", value: "AVAILABLE" },
  { label: "Đang đấu giá", value: "IN_AUCTION" },
  { label: "Đã niêm yết", value: "LISTED" },
];
const PAGE_SIZE = 20;

// --- Status badge ---
const STATUS_CONFIG: Record<SimStatus, { label: string; cls: string }> = {
  AVAILABLE: { label: "Đang bán", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  LISTED: { label: "Niêm yết", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  IN_AUCTION: { label: "Đang đấu giá", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  TRANFERING: { label: "Đang chuyển", cls: "bg-purple-50 text-purple-700 border-purple-200" },
  TRANFERED: { label: "Đã chuyển", cls: "bg-slate-100 text-slate-500 border-slate-200" },
  SUSPENED: { label: "Tạm khóa", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};
function SimStatusBadge({ status }: { status: SimStatus }) {
  const { label, cls } = STATUS_CONFIG[status] ?? { label: status, cls: "bg-slate-100 text-slate-500 border-slate-200" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>{label}</span>;
}

// --- SIM Detail Drawer ---
function SimDetailDrawer({ sim, onClose }: { sim: SimNumberDto | null; onClose: () => void }) {
  const open = !!sim;
  const color = sim ? getCarrierColor(sim.carrierName) : "#001743";
  const formatted = sim ? formatPhoneNumber(sim.phoneNumber) : "";
  const isAuction = sim?.simStatus === "IN_AUCTION";

  return (
    <RightDrawer
      open={open}
      onClose={onClose}
      title="Chi tiết SIM"
      badge={sim?.carrierName}
      badgeCls="bg-slate-100 text-slate-600 font-semibold"
      size="md"
    >
      {sim && (
        <>
          <DrawerBody>
            {/* Physical SIM Hero Card */}
            <div className="mb-5">
              <PhysicalSimCard
                phoneNumber={sim.phoneNumber}
                carrierName={sim.carrierName}
                categoryName={sim.categoryNames?.[0] || "SIM Số Đẹp"}
                patternDesc={sim.categoryNames.length > 0 ? sim.categoryNames.join(" • ") : undefined}
                badgeText={getSimStatusLabel(sim.simStatus)}
                isAuction={isAuction}
                isLive={isAuction}
              />
            </div>

            {/* Details */}
            <div className="space-y-0 border border-slate-200/70 rounded-xl overflow-hidden">
              {[
                { label: "Nhà mạng", value: sim.carrierName },
                { label: "Đầu số", value: sim.prefixValue },
                { label: "Thể loại", value: sim.categoryNames.length > 0 ? sim.categoryNames.join(", ") : "Không có" },
                { label: "Ngày tạo", value: new Date(sim.createdDate).toLocaleDateString("vi-VN") },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 last:border-0">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xs font-semibold text-slate-800 text-right max-w-[60%]">{value}</span>
                </div>
              ))}
            </div>

            {isAuction && (
              <div className="flex items-center gap-2.5 px-4 py-3.5 bg-amber-50 border border-amber-200/60 rounded-xl">
                <Gavel size={16} className="text-amber-700 shrink-0" strokeWidth={1.75} />
                <div>
                  <div className="text-xs font-semibold text-amber-800">SIM đang trong phiên đấu giá</div>
                  <div className="text-[11px] text-amber-600 mt-0.5">
                    Bạn có thể xem và tham gia đặt giá ngay trên sàn TrustSim.
                  </div>
                </div>
              </div>
            )}
          </DrawerBody>
          <DrawerFooter>
            <BtnSecondary onClick={onClose}>Đóng</BtnSecondary>
            {isAuction ? (
              <a href={`/auctions?sim=${sim.id}`}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-semibold rounded-lg transition-all">
                <Gavel size={13} strokeWidth={1.75} />
                Xem phiên đấu giá
              </a>
            ) : (
              <BtnPrimary>
                <ShoppingBag size={13} strokeWidth={1.75} />
                Mua ngay
              </BtnPrimary>
            )}
          </DrawerFooter>
        </>
      )}
    </RightDrawer>
  );
}

// --- SIM List Row ---
function SimRow({ sim, onDetail }: { sim: SimNumberDto; onDetail: (s: SimNumberDto) => void }) {
  const color = getCarrierColor(sim.carrierName);
  const formatted = formatPhoneNumber(sim.phoneNumber);
  const isAuction = sim.simStatus === "IN_AUCTION";

  return (
    <div className="group flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/70 transition-colors duration-150 border-b border-slate-100 last:border-0">
      <div className="w-0.5 h-9 rounded-full shrink-0 transition-all duration-200 group-hover:h-11"
        style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onDetail(sim)}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base font-bold tabular-nums tracking-wider font-mono" style={{ color }}>
            {formatted}
          </span>
          <SimStatusBadge status={sim.simStatus} />
          {sim.categoryNames[0] && (
            <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
              {sim.categoryNames[0]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
          <span style={{ color, opacity: 0.85 }} className="font-medium">{sim.carrierName}</span>
          <span>·</span>
          <span>Đầu số {sim.prefixValue}</span>
          {sim.categoryNames.length > 1 && (
            <><span>·</span><span className="text-slate-500 truncate max-w-[160px]">{sim.categoryNames.slice(1).join(", ")}</span></>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isAuction ? (
          <a href={`/auctions?sim=${sim.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg border border-amber-200/70 transition-colors">
            <Gavel size={12} strokeWidth={1.75} />
            <span>Đấu giá</span>
          </a>
        ) : (
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#001743] hover:bg-[#00266B] active:scale-[0.98] text-white text-xs font-semibold rounded-lg transition-all">
            <ShoppingBag size={12} strokeWidth={1.75} />
            <span>Mua ngay</span>
          </button>
        )}
        <button
          onClick={() => onDetail(sim)}
          className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-[#001743] hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors">
          Chi tiết
        </button>
      </div>
    </div>
  );
}

// --- Skeleton ---
function SimSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-100 animate-pulse">
      <div className="w-0.5 h-9 rounded-full bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-40" />
        <div className="h-3 bg-slate-100 rounded w-56" />
      </div>
      <div className="h-7 w-20 bg-slate-200 rounded-lg" />
    </div>
  );
}

// --- Pagination ---
function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }
  return (
    <div className="flex items-center justify-center gap-1 py-5">
      <button onClick={() => onPage(page - 1)} disabled={page === 1}
        className="p-1.5 rounded-lg text-slate-400 hover:text-[#001743] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft size={16} />
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`el-${i}`} className="px-2 text-slate-400 text-sm">&hellip;</span>
        ) : (
          <button key={p} onClick={() => onPage(p as number)}
            className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-[#001743] text-white" : "text-slate-600 hover:bg-slate-100 hover:text-[#001743]"}`}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
        className="p-1.5 rounded-lg text-slate-400 hover:text-[#001743] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// --- Main Page ---
export default function MarketPage() {
  const [result, setResult] = useState<PagedResult<SimNumberDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedCarrier, setSelectedCarrier] = useState("Tất cả");
  const [selectedStatus, setSelectedStatus] = useState<SimStatus | "">("");
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [detailSim, setDetailSim] = useState<SimNumberDto | null>(null);

  const fetchSims = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const parts: string[] = [];
      if (activeSearch) parts.push(activeSearch);
      if (selectedCarrier !== "Tất cả") parts.push(selectedCarrier);
      const data = await getSims({
        keyword: parts.join(" ").trim() || undefined,
        status: selectedStatus || undefined,
        pageIndex: page, pageSize: PAGE_SIZE,
      });
      setResult(data);
    } catch (err: any) { setError(err.message); setResult(null); }
    finally { setLoading(false); }
  }, [activeSearch, selectedCarrier, selectedStatus, page]);

  useEffect(() => { fetchSims(); }, [fetchSims]);

  const prevRef = useRef({ activeSearch, selectedCarrier, selectedStatus });
  useEffect(() => {
    const prev = prevRef.current;
    if (prev.activeSearch !== activeSearch || prev.selectedCarrier !== selectedCarrier || prev.selectedStatus !== selectedStatus) {
      setPage(1);
      prevRef.current = { activeSearch, selectedCarrier, selectedStatus };
    }
  }, [activeSearch, selectedCarrier, selectedStatus]);

  const handleSearch = () => setActiveSearch(searchInput.trim());
  const handleReset = () => { setSearchInput(""); setActiveSearch(""); setSelectedCarrier("Tất cả"); setSelectedStatus(""); setPage(1); };
  const hasFilters = activeSearch || selectedCarrier !== "Tất cả" || selectedStatus !== "";
  const sims = result?.items ?? [];
  const totalCount = result?.totalCount ?? 0;
  const totalPages = result?.totalPages ?? 0;

  return (
    <div className="min-h-screen bg-[#F8F9FA]" style={{ paddingTop: 64 }}>
      {/* HERO */}
      <section className="bg-[#001743] text-white">
        <div className="max-w-5xl mx-auto px-5 py-10 sm:py-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Phone size={16} strokeWidth={1.75} className="text-blue-300" />
              <span className="text-xs font-semibold text-blue-300 tracking-wide uppercase">Thị trường SIM số đẹp</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Tìm SIM phù hợp với bạn</h1>
            <p className="text-sm text-white/60 mb-6">Hàng nghìn số SIM xác thực chính chủ. Tìm theo số đẹp, nhà mạng hoặc phong thủy mệnh số.</p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" strokeWidth={1.75} />
                <input type="text" value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="Nhập số điện thoại, đầu số, nhà mạng hoặc loại SIM..."
                  className="w-full pl-9 pr-10 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-white/40 outline-none focus:bg-white/15 focus:border-white/40 transition-colors" />
                {searchInput && (
                  <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                    <X size={14} />
                  </button>
                )}
              </div>
              <button onClick={handleSearch}
                className="px-5 py-2.5 bg-[#E4011E] hover:bg-[#B80018] active:scale-[0.98] text-white text-sm font-semibold rounded-lg transition-all shrink-0">
                Tìm kiếm
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {["Tứ quý 8888", "Lộc phát 6868", "Viettel 098", "Thần tài 3939"].map(tag => (
                <button key={tag} onClick={() => { setSearchInput(tag); setActiveSearch(tag); }}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium text-white/60 border border-white/15 hover:text-white hover:bg-white/10 transition-colors">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7 pb-20">
        <div className="flex gap-7 items-start">
          {/* Sidebar filter */}
          <aside className="hidden lg:block w-52 shrink-0 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bộ lọc</span>
              {hasFilters && (
                <button onClick={handleReset} className="inline-flex items-center gap-1 text-[11px] text-[#E4011E] font-medium hover:underline">
                  <RefreshCw size={10} /> Đặt lại
                </button>
              )}
            </div>
            <div className="mb-5">
              <div className="text-xs font-medium text-slate-700 mb-2">Nhà mạng</div>
              <div className="space-y-2">
                {CARRIERS.map(c => (
                  <label key={c} className="flex items-center gap-2.5 cursor-pointer group">
                    <input type="radio" name="carrier" checked={selectedCarrier === c} onChange={() => setSelectedCarrier(c)} className="w-3.5 h-3.5 accent-[#001743]" />
                    <span className={`text-xs transition-colors ${selectedCarrier === c ? "text-[#001743] font-semibold" : "text-slate-600 group-hover:text-slate-900"}`}>{c}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="h-px bg-slate-100 mb-5" />
            <div>
              <div className="text-xs font-medium text-slate-700 mb-2">Trạng thái</div>
              <div className="space-y-2">
                {STATUS_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                    <input type="radio" name="status" checked={selectedStatus === opt.value} onChange={() => setSelectedStatus(opt.value)} className="w-3.5 h-3.5 accent-[#001743]" />
                    <span className={`text-xs transition-colors ${selectedStatus === opt.value ? "text-[#001743] font-semibold" : "text-slate-600 group-hover:text-slate-900"}`}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* List */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#001743]">
                  {loading ? <span className="text-slate-400">Đang tải...</span> : (
                    <><span className="tabular-nums">{totalCount.toLocaleString("vi-VN")}</span><span className="text-slate-500 font-normal"> SIM phù hợp</span></>
                  )}
                </h2>
                {hasFilters && !loading && (
                  <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full">Đang lọc</span>
                )}
              </div>
              <button onClick={() => setSidebarOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-xs active:scale-[0.98] transition-all">
                <SlidersHorizontal size={13} strokeWidth={1.75} /> Bộ lọc
              </button>
            </div>

            {/* Filter chips */}
            {hasFilters && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {activeSearch && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 rounded-full text-slate-700 shadow-xs">
                    &ldquo;{activeSearch}&rdquo;
                    <button onClick={() => { setSearchInput(""); setActiveSearch(""); }} className="text-slate-400 hover:text-slate-700 ml-0.5"><X size={10} /></button>
                  </span>
                )}
                {selectedCarrier !== "Tất cả" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 rounded-full text-slate-700 shadow-xs">
                    {selectedCarrier}
                    <button onClick={() => setSelectedCarrier("Tất cả")} className="text-slate-400 hover:text-slate-700 ml-0.5"><X size={10} /></button>
                  </span>
                )}
                {selectedStatus && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 rounded-full text-slate-700 shadow-xs">
                    {getSimStatusLabel(selectedStatus)}
                    <button onClick={() => setSelectedStatus("")} className="text-slate-400 hover:text-slate-700 ml-0.5"><X size={10} /></button>
                  </span>
                )}
                {(activeSearch || selectedCarrier !== "Tất cả" || selectedStatus) && (
                  <button onClick={handleReset} className="text-[11px] text-[#E4011E] font-medium px-2 py-1 hover:underline">Xóa tất cả</button>
                )}
              </div>
            )}

            {/* List */}
            <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden shadow-xs">
              {loading ? (
                <>{Array.from({ length: 8 }).map((_, i) => <SimSkeleton key={i} />)}</>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <AlertCircle size={32} className="text-slate-300 mb-3" strokeWidth={1.5} />
                  <div className="text-sm font-semibold text-slate-700 mb-1">Không thể tải dữ liệu</div>
                  <p className="text-xs text-slate-400 mb-4 max-w-xs">{error}</p>
                  <button onClick={fetchSims}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#001743] hover:bg-[#00266B] rounded-lg">
                    <RefreshCw size={12} strokeWidth={1.75} /> Thử lại
                  </button>
                </div>
              ) : sims.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <Search size={32} className="text-slate-200 mb-3" strokeWidth={1.5} />
                  <div className="text-sm font-semibold text-slate-700 mb-1">Không tìm thấy SIM phù hợp</div>
                  <p className="text-xs text-slate-400 mb-4 max-w-xs">Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc nhà mạng.</p>
                  <button onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200">
                    <X size={12} /> Xóa bộ lọc
                  </button>
                </div>
              ) : (
                sims.map(sim => <SimRow key={sim.id} sim={sim} onDetail={setDetailSim} />)
              )}
            </div>

            {!loading && !error && totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            )}
            {!loading && !error && totalCount > 0 && (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-slate-400">
                <ShieldCheck size={11} strokeWidth={1.75} className="text-emerald-500" />
                <span>Toàn bộ SIM được xác thực chính chủ bởi TrustSim</span>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile filter overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <span className="text-sm font-semibold text-[#001743]">Bộ lọc SIM</span>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nhà mạng</div>
                <div className="space-y-2.5">
                  {CARRIERS.map(c => (
                    <label key={c} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="radio" name="m-carrier" checked={selectedCarrier === c} onChange={() => setSelectedCarrier(c)} className="accent-[#001743]" />
                      <span className={`text-sm ${selectedCarrier === c ? "font-semibold text-[#001743]" : "text-slate-600"}`}>{c}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Trạng thái</div>
                <div className="space-y-2.5">
                  {STATUS_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="radio" name="m-status" checked={selectedStatus === opt.value} onChange={() => setSelectedStatus(opt.value)} className="accent-[#001743]" />
                      <span className={`text-sm ${selectedStatus === opt.value ? "font-semibold text-[#001743]" : "text-slate-600"}`}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex gap-2">
              <button onClick={handleReset} className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors">Đặt lại</button>
              <button onClick={() => setSidebarOpen(false)} className="flex-1 py-2 text-sm font-semibold text-white bg-[#001743] hover:bg-[#00266B] rounded-lg transition-colors">Xem kết quả</button>
            </div>
          </aside>
        </div>
      )}

      {/* SIM Detail Drawer */}
      <SimDetailDrawer sim={detailSim} onClose={() => setDetailSim(null)} />
    </div>
  );
}
