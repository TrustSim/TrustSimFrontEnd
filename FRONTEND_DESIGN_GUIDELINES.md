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

---

## 8. Nguyên Tắc Thiết Kế Theo Ưu Tiên, Không Theo Ô

### 8.1 Thiết kế theo ưu tiên nghiệp vụ

Mỗi màn hình chỉ nên trả lời một câu hỏi chính:

- **Dashboard:** "Hôm nay admin cần xử lý gì?"
- **Quản lý SIM:** "SIM nào cần thao tác?"
- **eKYC:** "Hồ sơ nào cần duyệt?"
- **Ký quỹ:** "Tiền nào đang chờ xử lý hoặc có rủi ro?"
- **Khiếu nại:** "Vụ nào cần ưu tiên?"

**Card chỉ dùng cho:** KPI quan trọng, khối cần tách biệt rõ, form/preview/panel chi tiết. Các phần còn lại phân tách bằng khoảng trắng, heading và divider mảnh.

### 8.2 Quy tắc phân cấp thị giác 60–30–10

Trong một viewport:
- **60%:** Nội dung chính (bảng, danh sách, timeline, biểu đồ).
- **30%:** Thông tin hỗ trợ (filter, KPI, trạng thái).
- **10%:** CTA, cảnh báo nghiêm trọng, điểm nhấn.

> Khi cái gì cũng nổi bật thì thực tế không có gì nổi bật.

### 8.3 Dùng khoảng trắng thay cho đường viền

| Vị trí | Khoảng cách |
|---|---|
| Giữa các section lớn | 24–32px |
| Giữa các thành phần trong card | 16–20px |
| Giữa icon và text | 8–10px |
| Giữa label và giá trị | 4–6px |

Border chỉ dùng để xác định vùng thao tác (input, bảng, card, modal). Ưu tiên border xám xanh nhạt, độ tương phản thấp.

### 8.4 Hệ thống màu có vai trò cố định

Không dùng màu chỉ để "làm đẹp". Mỗi màu phải mang ý nghĩa:

| Màu | Vai trò |
|---|---|
| **Navy `#001743`** | Thương hiệu, cấu trúc, CTA chính, số liệu chính |
| **Đỏ `#E4011E`** | Nguy hiểm, rủi ro cao, thao tác không thể đảo ngược |
| **Cam `#F59E0B`** | Cần theo dõi, gần hết hạn, chờ xử lý |
| **Xanh lá `#16A34A`** | An toàn, thành công, đã xác minh |
| **Xanh dương nhạt** | Thông tin, trạng thái đang xử lý |
| **Xám xanh** | Text phụ, metadata, divider, nền phụ |

**Nguyên tắc màu:** Trong một khối chỉ có một màu nhấn chính. Không dùng đỏ làm màu button mặc định cho mọi thao tác. Nền màu chỉ nên thật nhạt; màu đậm dành cho text, icon, badge, button. Một màn hình chỉ nên có tối đa một cảnh báo đỏ thật nổi bật.

### 8.5 Typography: dùng độ đậm để dẫn mắt

Tránh toàn chữ in hoa và toàn chữ đậm. Phân cấp:

```
Tiêu đề trang:     24–28px, đậm
Tiêu đề section:   16–18px, đậm vừa
Nhãn bảng/filter:  12–13px, medium, màu xám xanh
Nội dung chính:    14–15px, regular
Metadata:          12–13px, màu dịu
Số tiền/KPI:       24–32px, đậm
```

**Quy tắc:** Viết hoa toàn bộ chỉ cho label ngắn: `LIVE`, `MỚI`, `KHẨN CẤP`. Một card chỉ có một dòng thật đậm. Không dùng quá ba mức `font-weight` trong cùng màn hình.

### 8.6 Hệ thống shape nhất quán

| Thành phần | Shape đề xuất |
|---|---|
| Card | Bo góc 8–12px, nền trắng, border nhẹ |
| Button | Bo góc 6–8px |
| Input/Select | Bo góc 6–8px |
| Badge trạng thái | Pill, padding nhỏ |
| Avatar | Tròn |
| Icon button | Không khung; chỉ hiện nền khi hover |

**Không bọc mọi icon trong ô vuông.** Icon chỉ có nền khi là tín hiệu trạng thái.

### 8.7 Card phải có mục đích rõ ràng

Mỗi card chứa: một tiêu đề ngắn + một thông tin chính + một hành động hoặc metadata.

**Không nên:** Card chứa card; card có quá nhiều divider; card chứa 5–6 chỉ số ngang hàng; card nào cũng có icon, border, background và button.

### 8.8 Bảng dữ liệu phải dễ "quét"

- Cột đầu tiên: định danh quan trọng (SIM, mã GD, người dùng).
- Số tiền: căn phải. Thời gian: căn giữa/phải. Status: căn giữa. Action: cột cuối.
- Chỉ giữ 5–7 cột quan trọng; chi tiết ít dùng đưa vào drawer.
- Dùng divider ngang nhẹ, không lưới dọc dày. Hover hàng nhẹ.
- Hàng có rủi ro có thể có thanh màu mảnh ở cạnh trái.

### 8.9 Action hierarchy: một hành động chính, còn lại lùi xuống

- **CTA chính:** filled navy.
- **CTA phụ:** outline hoặc nền nhạt.
- **Hành động ít dùng:** text button hoặc menu `⋯`.
- **Hành động nguy hiểm:** đỏ, luôn có confirm.

### 8.10 Status phải nhất quán toàn hệ thống

| Trạng thái | Hiển thị |
|---|---|
| Đang hoạt động | Chấm xanh lá + "Đang hoạt động" |
| Chờ duyệt | Badge vàng/cam |
| Đang xử lý | Xanh dương |
| Cần theo dõi | Cam |
| Rủi ro cao | Đỏ |
| Thành công | Xanh lá |
| Hủy/Hết hạn | Xám |
| Live | Chấm đỏ/xanh lá + nhãn `LIVE` |

Không chỉ dựa vào màu; luôn có text mô tả trạng thái.

### 8.11 Làm UI sinh động bằng dữ liệu, không bằng trang trí

**Nên dùng:** Countdown cho phiên sắp kết thúc; sparkline cho dòng tiền; progress mảnh cho tiến độ ký quỹ; timeline cho giao dịch; chấm trạng thái live; highlight nhẹ khi giá đấu thay đổi; empty state với CTA cụ thể.

**Tránh:** Gradient mạnh; nền quá nhiều màu; animation lặp liên tục; icon trang trí không truyền thông tin; biểu đồ chỉ để lấp khoảng trống.

### 8.12 Tránh cảm giác "AI-generated"

Một UI thường bị nhìn như AI khi: card nào cũng giống nhau; quá nhiều badge màu; icon ở mọi tiêu đề; quá nhiều gradient/shadow/border; text dài và chung chung; số liệu không liên quan đến hành động; nhiều button cùng nổi bật.

**Để tránh điều này:**
- Chỉ dùng icon khi icon giúp quét nhanh hơn text.
- Viết microcopy cụ thể theo nghiệp vụ: _"3 hồ sơ cần duyệt trước 17:00"_, không viết _"Có hồ sơ chờ xử lý"_.
- Thiết kế cho tình huống thật: không có dữ liệu, lỗi xác minh, quá hạn thanh toán, bị khóa phiên.
- Cho phép các module có layout khác nhau theo bản chất dữ liệu: bảng cho SIM, timeline cho chuyển nhượng, workspace hai cột cho eKYC.

### 8.13 Quy tắc responsive và accessibility

- Desktop: sidebar cố định; tablet: sidebar thu gọn; mobile: bảng chuyển thành card-list.
- Vùng bấm tối thiểu 40–44px trên thiết bị cảm ứng.
- Text phụ không nhỏ hơn 12px.
- Tương phản chữ/nền đủ cao (đặc biệt badge vàng, đỏ, xanh).
- Không đặt chức năng chỉ xuất hiện khi hover.
- Toast chỉ dùng để xác nhận thao tác ngắn; lỗi tài chính/nguy hiểm hiển thị rõ và có hướng xử lý.

### 8.14 Checklist trước khi hoàn thiện một màn hình

- [ ] Màn hình có một mục tiêu chính rõ ràng?
- [ ] Có tối đa một CTA chính trong vùng đầu màn hình?
- [ ] Có phần nào dùng border nhưng có thể thay bằng khoảng trắng?
- [ ] Có quá nhiều chữ in hoa hoặc chữ đậm?
- [ ] Màu đỏ có thực sự biểu thị nguy hiểm?
- [ ] Những thông tin quan trọng nhất có nhìn thấy trong 3 giây đầu?
- [ ] Bảng có thể giảm bớt cột không?
- [ ] Action nguy hiểm có confirmation và lý do không?
- [ ] Trạng thái có thống nhất tên, màu và icon với các tab khác không?
- [ ] Nếu bỏ hết icon, nội dung có còn dễ hiểu không?

> **Nguyên tắc tổng quát:** Giao diện đẹp không đến từ việc thêm màu, card hoặc animation; nó đến từ việc biết phần nào cần nổi bật, phần nào cần lùi xuống và chừa đủ khoảng trống để dữ liệu được "thở".
