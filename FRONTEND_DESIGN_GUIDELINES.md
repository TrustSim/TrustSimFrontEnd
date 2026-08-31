# 🎨 TRUSTSIM - FRONTEND DESIGN GUIDELINES & UI SPECIFICATION

> **Dành cho AI Agent & Frontend Developers**  
> Tài liệu này chuẩn hóa toàn bộ ngôn ngữ thiết kế, quy chuẩn component, typography, icon và các điều cấm kỵ (Do's & Don'ts) khi xây dựng giao diện cho dự án **TrustSim**.

---

## 1. Triết lý Thiết kế (Core Design Philosophy)

TrustSim là **sàn giao dịch & đấu giá SIM số cao cấp kết hợp yếu tố tài chính (Fintech / Marketplace)**. Giao diện cần thể hiện:
1. **Minh bạch & Đáng tin cậy (Trust & Transparency)**: Cấu trúc rõ ràng, thông số chính xác, không màu mè rườm rà.
2. **Hiện đại, Tối giản & Sắc nét (Clean, Sharp & Minimalist)**: Ưu tiên đường nét dứt khoát, góc cạnh tinh tế, không lạm dụng hiệu ứng bóng đổ dày hoặc bo góc quá đà.
3. **Bảng màu chuẩn hóa**: 
   - Nền trắng chủ đạo (~75 - 80% **`#FFFFFF`**).
   - Màu chính (**Primary Red**): **`#E4011E`** (CTA, trạng thái Live, số liệu quan trọng, nút hành động chính).
   - Màu phụ (**Secondary Navy**): **`#001743`** (Tiêu đề nhấn, Header/Dark surface, footer, thẻ cao cấp, icon/badge bổ trợ thể hiện sự vững chắc và uy tín tài chính).

---

## 2. Bảng Màu Chuẩn (Color Palette)

| Loại màu | Mã Hex / RGB | Mô tả & Ứng dụng |
| :--- | :--- | :--- |
| **Primary (Brand Red)** | `#E4011E` | Nút bấm chính (CTA), badge "Đang diễn ra", giá nổi bật, thanh tiến trình |
| **Primary Hover / Dark** | `#B80018` | Trạng thái hover/active của nút bấm chính |
| **Primary Subtle** | `rgba(228, 1, 30, 0.06)` | Nền tag, hover nhẹ trên các list item |
| **Secondary (Navy Deep)** | `#001743` | Tiêu đề chính, thanh header/footer, card header cao cấp, badge bổ trợ, nền khối uy tín |
| **Secondary Light** | `#002266` | Trạng thái hover của các element màu secondary |
| **Secondary Subtle** | `rgba(0, 23, 67, 0.06)` | Nền tag phụ, icon container phụ |
| **Neutral Base (White)** | `#FFFFFF` | Nền chính của toàn trang và thẻ Card |
| **Neutral Surface** | `#F8F9FA` hoặc `#F3F4F6` | Nền phụ, phân tách các section, nền ô input |
| **Border Normal** | `#E5E7EB` (Gray-200) | Viền bao quanh Card, table, divider |
| **Border Strong** | `#D1D5DB` (Gray-300) | Viền input, viền button dạng outline |
| **Text Primary** | `#001743` / `#111827` | Tiêu đề, số SIM, giá tiền chính |
| **Text Secondary** | `#4B5563` (Gray-600) | Đoạn văn bản, mô tả, thông số phụ |
| **Text Muted** | `#9CA3AF` (Gray-400) | Nhãn phụ, placeholder, timestamp |

---

## 3. Quy chuẩn Khối & Thẻ (Card & Container Rules)

### ❌ CÁC KIỂU THIẾT KẾ BỊ CẤM (STRICTLY PROHIBITED)

1. ⛔ **CẤM Bo tròn góc quá lớn (`border-radius > 10px`, `rounded-2xl`, `rounded-3xl`)**:
   - Không bo tròn thẻ kiểu bong bóng/bầu dục (nhìn thiếu chuyên nghiệp, không phù hợp với sàn đấu giá/tài chính).
2. ⛔ **CẤM Thẻ có viền màu 1 cạnh (Left-border accent line / Colored side-strip)**:
   - *Ví dụ mẫu bị loại bỏ:* Thẻ bo cong có dải màu xanh/đỏ dày ở mép trái (như hình mẫu cũ).
   - Kiểu này tạo cảm giác đứt đoạn, chắp vá và lỗi thời.
3. ⛔ **CẤM Sử dụng Emoji màu 3D hoặc Icon hoạt hình (`📈`, `📉`, `📱`, `🛒`,... làm icon chính)**:
   - Không nhúng emoji trực tiếp vào icon hiển thị của tính năng/thẻ. Thay vào đó dùng SVG Line Icons.

---

### ✅ QUY CHUẨN THẺ CHUẨN (STANDARD CARD SPECIFICATION)

- **Border Radius**: Góc vuông dứt khoát hoặc chỉ bo cực nhẹ:
  - Thẻ chuẩn: `border-radius: 4px` đến tối đa `8px` (`rounded-sm` hoặc `rounded-md`).
  - Nút bấm: `border-radius: 6px` đến `8px`.
  - Tag / Badge: `border-radius: 4px` (hoặc `rounded-full` dạng pill siêu mảnh nếu dùng cho status dot).
- **Border**: Viền bao bọc **toàn bộ 4 cạnh** đồng nhất: `border: 1px solid #E5E7EB`.
- **Shadow**: Sử dụng shadow siêu phẳng hoặc flat hoàn toàn:
  - Bình thường: `box-shadow: 0 1px 2px rgba(0,0,0,0.04)` hoặc `box-shadow: none`.
  - Hover: `border-color: #D1D5DB; box-shadow: 0 4px 12px rgba(0,0,0,0.05);` (chuyển động nhẹ nhàng 0.2s).

```tsx
/* ✅ Ví dụ cấu trúc Card chuẩn */
<div className="bg-white border border-gray-200 rounded-md p-6 hover:border-gray-300 transition-all duration-200">
  {/* Header */}
  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">English Auction</span>
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
      Đang diễn ra
    </span>
  </div>
  {/* Body */}
  ...
</div>
```

---

## 4. Quy chuẩn Icon (Iconography)

1. **Thư viện Icon chuẩn**:
   - Sử dụng **Lucide React** (`lucide-react`) hoặc **Heroicons** (Dạng Outline/Line).
   - Tuyệt đối dùng icon dạng nét viền mảnh (**Line / Stroke icon**) hoặc icon đơn sắc phẳng (**Monochrome flat icon**).
2. **Kích thước & Độ dày nét**:
   - `strokeWidth`: `1.5px` hoặc `1.75px` (tạo cảm giác thanh lịch, chuẩn Fintech).
   - Kích thước icon chuẩn: `16px` (sm), `20px` (md), `24px` (lg).
3. **Màu sắc Icon**:
   - Icon thông tin/điều hướng: `#4B5563` (Gray-600) hoặc `#111827`.
   - Icon cảnh báo/điểm nhấn: `#E4011E` hoặc `#2563EB` đặt trong khung nền xám nhạt `bg-gray-50` hoặc viền `border-gray-200`.

---

## 5. Quy chuẩn Typography & Hiển thị Số SIM

1. **Font chữ**:
   - Font chính: `Inter`, `system-ui`, `-apple-system`, `sans-serif`.
2. **Số SIM (`.sim-number`)**:
   - Luôn sử dụng `font-variant-numeric: tabular-nums` (để các chữ số có chiều rộng bằng nhau, hiển thị thẳng hàng trong danh sách/bảng).
   - Độ đậm: `font-bold` (700) hoặc `font-extrabold` (800).
   - Khoảng cách ký tự: `tracking-wider` (`letter-spacing: 0.08em` đến `0.1em`).
   - Format SIM: `0988 888 888` hoặc `090.123.4567` rõ ràng, dễ nhìn.
3. **Giá tiền (`.price-value`)**:
   - Sử dụng `tabular-nums`, định dạng tiền tệ `toLocaleString('vi-VN') + " ₫"`.
   - Nổi bật với màu `#E4011E` hoặc `#111827` tùy ngữ cảnh.

---

## 6. Quy chuẩn Nút bấm (Buttons) & Nhãn (Badges)

### Buttons
- **Primary Button (`.btn-red`)**:
  - Nền: `#E4011E`, chữ trắng, font-semibold (600).
  - Bo góc: `rounded-md` (6px - 8px).
  - Hover: nền `#B80018`, không dùng bóng đổ quá chói.
- **Secondary / Outline Button (`.btn-outline`)**:
  - Nền trong suốt, viền `1.5px solid #D1D5DB`, màu chữ `#111827`.
  - Hover: viền `#E4011E`, chữ `#E4011E`, nền `rgba(228, 1, 30, 0.04)`.

### Badges / Tags
- Hình khối: Hình chữ nhật bo nhẹ `rounded` (4px).
- Nền & viền đồng điệu nhẹ (pastel / subtle):
  - *Live*: `bg-red-50 text-red-600 border border-red-200` + chấm tròn status đỏ nhấp nháy.
  - *Upcoming*: `bg-amber-50 text-amber-700 border border-amber-200`.
  - *Ended*: `bg-gray-100 text-gray-600 border border-gray-200`.

---

## 7. Bảng Tóm Tắt Quy Chuẩn Cho Agent (Quick Checklist)

| Yếu tố | ✅ ĐƯỢC PHÉP DÙNG | ❌ TUYỆT ĐỐI TRÁNH |
| :--- | :--- | :--- |
| **Góc bo (Radius)** | `rounded-sm` (4px), `rounded-md` (6px - 8px) | `rounded-2xl` (16px), `rounded-3xl` (24px+) |
| **Viền Card** | Viền 4 cạnh liền mạch `border border-gray-200` | Card có viền 1 cạnh bên trái/phải (`border-l-4`) |
| **Icon** | Lucide / Line SVG (`strokeWidth={1.5}`) | Emoji màu 3D, sticker màu |
| **Tỷ lệ màu** | Trắng 80% + Xám nhạt + Điểm nhấn đỏ `#E4011E` | Nền đen toàn bộ (dark theme cũ), đa sắc màu mè |
| **Bóng đổ** | Flat / Subtle shadow (`shadow-sm`, `shadow`) | Glow màu lớn, shadow đen dày |
| **Chữ số SIM** | `font-mono` hoặc `tabular-nums` | Chữ số dính liền không phân cách |
