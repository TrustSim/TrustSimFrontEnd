# TrustSim Design System — "Soft-Cloud Navy"

> **Cách dùng:** đính kèm file này khi chat (ví dụ: `@TRUSTSIM_DESIGN_SYSTEM.md làm lại trang đấu giá`).
> Agent PHẢI đọc toàn bộ file trước khi viết/sửa UI và tuân thủ mọi quy tắc bên dưới.
> Nguồn chuẩn (reference implementation): `trustsim-frontend/components/home/BuyerHomepage.tsx` + `BuyerHomepage.module.css`, `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`. Khi cần chi tiết, mở các file này để copy pattern, không tự chế.

---

## 1. Tinh thần thiết kế

- **Sàn đấu giá SIM đáng tin cậy**: sáng, mềm, hiện đại, tối giản; cảm giác "mây + kính mờ" chứ không phải dashboard nặng nề.
- Gốc cảm hứng: landing page e-SIM (pill nav, thẻ bo lớn, chữ gradient, nền mây), **nhưng đổi sang navy chủ đạo** và **không có component giá gói cước/thuê bao**.
- Nguyên tắc: nhiều khoảng thở, bo góc lớn, bóng đổ nhẹ màu navy, một điểm nhấn gradient mỗi tiêu đề, không rối.
- Ngôn ngữ UI: **tiếng Việt** (có dấu, tự nhiên). Dùng "ký quỹ" (không dùng "escrow") trong text hiển thị.

## 2. Design tokens

### Màu
| Token | Giá trị | Dùng cho |
|---|---|---|
| `--navy` | `#001743` | Màu chủ đạo, nút chính, tiêu đề số, icon nhấn |
| `--navy-2` | `#0b2a6b` | Đầu gradient nút/badge |
| `--indigo` | `#4c5fd5` | Điểm nhấn thứ cấp, hover border, text gradient giữa |
| `--periwinkle` | `#8c9cff` | Glow nền, cuối text gradient |
| `--ink` | `#0b1630` | Chữ tiêu đề / body chính |
| `--copy` | `#5b6477` | Chữ mô tả |
| `--muted` | `#98a1b3` | Placeholder, caption, label phụ |
| `--line` | `rgba(0,23,67,.08)` | Viền mọi thẻ |
| Nền trang | `#f7f8fd` | Background page |
| Nền hero/mây | `linear-gradient(180deg,#f1f3ff,#dfe5ff 55%,#c7d0ff)` + radial trắng/periwinkle | Hero, vùng nhấn |

Trạng thái (chỉ dùng cho semantic, không làm màu thương hiệu):
- Live/thành công: nền `#e8f8ef`, chữ `#118a4a`, chấm `#17b26a`
- Cảnh báo: amber · Lỗi/hủy: rose (`#E4011E` chỉ dùng cho badge lỗi, chấm "live" và thông báo chưa đọc)
- **Cấm** dùng đỏ `#E4011E` làm nút chính/CTA mới. Cấm tím đậm kiểu e-SIM gốc; chỉ dùng indigo/periwinkle làm sắc phụ.

### Chữ
- Font: **Inter** (`var(--font-inter)`), không thêm font khác.
- Tiêu đề: `font-weight: 600`, `letter-spacing: -0.04em ~ -0.05em`, `line-height: 1.04–1.1`.
  - H1 hero: `clamp(2.5rem, 6vw, 4.6rem)` · H2 section: `clamp(2rem, 4.2vw, 3.1rem)`
- Body: `0.95–1.02rem`, `line-height: 1.6`, màu `--copy`.
- Số liệu/số SIM/giá: `font-weight: 700`, `font-variant-numeric: tabular-nums`, màu `--navy` hoặc `--ink`.
- Không dùng chữ in hoa toàn bộ + letter-spacing rộng kiểu "kicker" cũ; thay bằng **chip** (xem 3.2).

### Bo góc · Bóng · Khoảng cách
- Bo: nút/chip/input/nav = **pill (`999px`)**; thẻ nhỏ `22px`; thẻ lớn/section box `32–36px`; icon tròn `50%`.
- Bóng (luôn tông navy, nhẹ): thẻ `0 8px 28px rgba(0,23,67,.05)` · nổi `0 20px 50px rgba(0,23,67,.16)` · nút navy `0 6px 16px rgba(0,23,67,.3)`.
- Container: `width: min(1180px, calc(100% - 40px))`; mobile `calc(100% - 28px)`.
- Section padding dọc: `64–96px` desktop, giảm còn ~`48px` mobile. Gap lưới: `16px`.
- Viền: luôn `1px solid var(--line)`; thẻ trên nền kính dùng `rgba(255,255,255,.9)`.

## 3. Component chuẩn

### 3.1 Header (Navbar)
- `fixed`, bọc ngoài `pointer-events-none pt-2.5`, bên trong là **viên thuốc** `h-[52px] rounded-full backdrop-blur-xl`, `max-w-[1180px]`.
- Nền `bg-white/70` (đầu trang) → `bg-white/90` + shadow đậm hơn khi cuộn.
- Link nav: `rounded-full px-3.5 py-1.5`; active `bg-[#001743]/[0.07] text-[#001743] font-bold`.
- CTA chính "Đăng ký": `rounded-full bg-gradient-to-b from-[#0B2A6B] to-[#001743] text-white`.
- Trang có header nổi phải chừa `padding-top: 64px`.

### 3.2 Chip (nhãn section)
Viên thuốc nhỏ: icon (màu `--indigo`, size 14) + chữ `0.78rem / 600`, nền `rgba(255,255,255,.85)`, viền `--line`. Đặt **phía trên mỗi tiêu đề section**.

### 3.3 Tiêu đề section
`Chip` → `H2` căn giữa, trong đó **1 cụm từ khóa** bọc `.grad`:
```css
.grad { background: linear-gradient(90deg,#0b2a6b,#4c5fd5 60%,#8c9cff);
        -webkit-background-clip:text; background-clip:text; color:transparent; }
```
→ Mỗi tiêu đề chỉ **một** cụm gradient. Sau đó là đoạn lede ngắn (`max-width ~560px`, căn giữa, `--copy`).

### 3.4 Nút
- **Primary:** pill, gradient `#0b2a6b → #001743`, chữ trắng 600, bóng navy; hover `translateY(-1px)`.
- **Secondary/Ghost:** pill, nền trắng, viền `--line`, chữ navy 600.
- **Trên nền navy (CTA cuối trang):** primary = nền trắng chữ navy; secondary = viền `rgba(255,255,255,.35)` nền `rgba(255,255,255,.08)`.
- Icon mũi tên `ArrowRight` size 15–18 sau chữ cho hành động điều hướng.
- Disabled: `opacity .7`, `cursor: wait/not-allowed`.

### 3.5 Search bar
Một viên thuốc trắng `rgba(255,255,255,.92)` shadow lớn: icon Search · input · divider 1px · select (nhà mạng) · divider · select (ngân sách) · nút primary. Mobile: wrap, select 40% width, nút 100%. Dưới là hàng **quick filter pills** nền trắng mờ.

### 3.6 Thẻ (Card)
- Nền trắng hoặc `rgba(255,255,255,.78)`, viền `--line`, bo `22px`, padding `20–22px`.
- Feature card: gradient 135° từ trắng → tint rất nhạt (indigo / xanh dương / xanh lá), icon tròn 38px nền `rgba(0,23,67,.07)`, tiêu đề 1rem/600, mô tả 0.86rem.
- Card phiên đấu giá: pill trạng thái (live = xanh + chấm) · hạn kết thúc · **số SIM 1.65rem/700 navy** · nhà mạng + loại đấu giá · dòng "Giá hiện tại" ngăn bằng `border-top: 1px dashed` · footer lượt đặt + nút tròn mũi tên.
  Hover: `translateY(-4px)`, viền `rgba(76,95,213,.4)`, shadow `0 18px 40px rgba(0,23,67,.1)`; nút tròn chuyển sang nền navy chữ trắng.
- Thẻ "xòe" (fan cards) ở hero: 3 thẻ, thẻ giữa lớn và nổi, 2 bên xoay ±8° scale .92; **ẩn 2 thẻ bên trên mobile**.

### 3.7 Section nền đặc biệt
- **Hero:** margin `0 12px`, bo `36px`, nền mây (xem token), căn giữa, có "mây" mờ bằng `::before/::after` blur 34px.
- **How-it-works:** box trắng bo `32px`, glow periwinkle bên phải; trái là danh sách bước (bước active: nền gradient nhạt + số tròn navy), phải là thẻ minh họa kiểu điện thoại.
- **CTA cuối trang:** box navy gradient bo `36px`, glow periwinkle, chữ trắng, 2 nút.
- **Statement:** đoạn chữ lớn căn giữa, 1–2 cụm `.grad`, phần cuối màu `#b9c0d2` (mờ dần).

### 3.8 Footer
Nền `#F4F6FC`, bên trong thẻ trắng kính bo `32px`, grid `1.4fr + 3 cột link`; logo + mô tả + hotline/email (icon tròn); link hover hiện mũi tên `ArrowUpRight`; thanh dưới có badge xanh "bảo vệ giao dịch".

## 4. Chuyển động & trạng thái
- Transition `0.15–0.25s ease`; chỉ animate `transform`, `box-shadow`, `border-color`, `background`.
- Skeleton: shimmer gradient `#eef0f8 → #f7f8fd`, `1.4s linear infinite`.
- Empty/Error: thẻ trắng viền `dashed rgba(0,23,67,.2)`, bo `22px`, có nút hành động (Thử lại…).
- Bắt buộc `@media (prefers-reduced-motion: reduce)` tắt animation/transition.
- Focus ring: `outline: 3px solid rgba(76,95,213,.35); outline-offset: 3px`.

## 5. Responsive
- Breakpoint: `980px` (lưới 3→2 cột, how-it-works 2→1) và `680px` (1 cột, search bar wrap, ẩn thẻ xòe bên, giảm padding, bo nhỏ lại 24–28px).
- Không để tràn ngang; số tiền lớn phải `overflow-wrap`/giảm cỡ chữ, không vỡ layout.
- Touch target tối thiểu 40px.

## 6. Quy tắc kỹ thuật
- Next.js App Router + **CSS Modules** cho trang lớn (như `BuyerHomepage.module.css`); Navbar/Footer dùng Tailwind utility. Không trộn thêm thư viện UI mới.
- Icon: **lucide-react** (stroke mặc định, size 14–20). Không dùng emoji làm icon.
- Dùng biến CSS ở `.page { --navy … }`; **không hard-code màu rải rác** nếu đã có token.
- Giữ nguyên toàn bộ logic nghiệp vụ/service/API khi restyle; chỉ đổi presentation. Không đổi tên props/route.
- Accessibility: `aria-label` cho form/section, `aria-hidden` cho icon trang trí, tương phản chữ ≥ 4.5:1, HTML ngữ nghĩa (`section`, `h1` duy nhất, `ol` cho bước).
- Sau khi sửa: chạy `tsc --noEmit -p trustsim-frontend/tsconfig.json`, 0 lỗi.

## 7. Nội dung & giọng văn
- Giọng: tin cậy, rõ ràng, ngắn gọn, thân thiện; không phóng đại, **không bịa số liệu/đánh giá/khách hàng**.
- Nhấn mạnh 4 trụ cột: **Xác minh SIM chính chủ · Ký quỹ độc lập · Hợp đồng điện tử (ký OTP) · Giải quyết tranh chấp**.
- Thuật ngữ nghiệp vụ: *tiền cọc* (đặt cọc tham gia đấu giá) ≠ *ký quỹ* (tiền giao dịch sau khi thắng, sàn giữ trung gian đến khi hoàn tất chuyển nhượng).
- **Không** có component giá gói cước/thuê bao/data plan.

## 8. Quy trình khi áp dụng cho trang mới
1. Đọc file này + mở 1–2 file tham chiếu ở đầu tài liệu.
2. Xác định các section; mỗi section = `Chip` + `H2 (1 cụm .grad)` + lede + nội dung bằng thẻ chuẩn (mục 3).
3. Dựng bằng token ở mục 2, không tự thêm màu/font/bo góc mới.
4. Kiểm tra responsive (980/680), reduced-motion, focus ring, trạng thái loading/empty/error.
5. Chạy `tsc`; nêu rõ trong báo cáo những gì giữ nguyên logic.

## 9. Checklist trước khi báo hoàn thành
- [ ] Màu chủ đạo navy, không còn đỏ làm CTA chính
- [ ] Nút/chip/input/nav đều pill; thẻ bo ≥ 22px
- [ ] Mỗi H2 có đúng 1 cụm gradient + chip phía trên
- [ ] Bóng đổ tông navy, viền `--line`
- [ ] Không có giá gói cước, không có số liệu bịa
- [ ] Responsive ổn ở 980px & 680px, không tràn ngang
- [ ] `prefers-reduced-motion` + focus ring có mặt
- [ ] Logic cũ không bị thay đổi, `tsc` sạch

