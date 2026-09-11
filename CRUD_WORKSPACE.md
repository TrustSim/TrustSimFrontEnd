# CRUD Workspace Design System — TrustSim Admin

> Tài liệu chuẩn hóa pattern **List → Drawer → Modal** cho toàn bộ admin dashboard.
> Mọi màn hình CRUD mới phải tuân theo hệ thống này để đảm bảo nhất quán UX.

---

## Triết lý cốt lõi

> **List để quản lý nhiều bản ghi.**
> **Drawer để xem, tạo hoặc chỉnh sửa phức tạp.**
> **Modal để xác nhận một quyết định ngắn và có hậu quả.**

Admin không bao giờ mất ngữ cảnh. Khi mở Drawer, danh sách phía sau vẫn hiển thị.

---

## 1. Cấu trúc trang CRUD chuẩn

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Breadcrumb nhỏ]                                                         │
│ Tiêu đề trang (sentence case)                    [+ CTA chính duy nhất] │
│ Mô tả một dòng · X bản ghi                                              │
├──────────────────────────────────────────────────────────────────────────┤
│ [🔍 Tìm kiếm...............] [Filter 1 ▾] [Filter 2 ▾] [⋯ Thêm]       │
│ Đang lọc: [Chip ×] [Chip ×]                          128 kết quả        │
├──────────────────────────────────────────────────────────────────────────┤
│ [KPI nhỏ 1] · [KPI nhỏ 2] · [KPI nhỏ 3]    (chỉ khi hỗ trợ quyết định)│
├──────────────────────────────────────────────────────────────────────────┤
│ Bảng dữ liệu                                                             │
│  Nhận diện chính        Trạng thái    Ngày        ⋯                     │
│  → metadata phụ 1 dòng                                                  │
├──────────────────────────────────────────────────────────────────────────┤
│ Hiển thị 1–20 / 128                                      ‹ 1  2  3  › │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Header trang

- **Breadcrumb** nhỏ phía trên (12px, màu slate-400), chỉ cần khi depth > 1.
- **Tiêu đề** sentence case, 18–20px, bold navy `#001743`.
- **Mô tả** một dòng, 12px, slate-500. Gộp với số bản ghi: `12.480 SIM đang quản lý`.
- **CTA chính** tối đa 1 nút ở góc phải: filled navy, icon `+` nhỏ.

```tsx
<div className="flex items-start justify-between gap-4">
  <div>
    <div className="text-[11px] text-slate-400 mb-1">Admin / Quản lý SIM</div>
    <h1 className="text-lg font-bold text-[#001743]">Quản lý SIM số đẹp</h1>
    <p className="text-xs text-slate-500 mt-0.5">12.480 SIM đang được quản lý trong kho</p>
  </div>
  <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#001743] text-white text-xs font-semibold rounded-lg">
    <Plus size={14} /> Thêm SIM
  </button>
</div>
```

---

## 3. Toolbar tìm kiếm và lọc

- Search luôn đứng đầu, chiếm khoảng 40–50% toolbar.
- Chỉ hiện **2–3 filter phổ biến** inline. Filter nâng cao → nút `Bộ lọc`.
- **Filter chip** hiển thị bên dưới toolbar khi có điều kiện đang áp dụng.
- Chip có nút `×` riêng và nút **Xóa tất cả** xuất hiện khi có ≥ 2 chip.

```tsx
{/* Toolbar */}
<div className="flex items-center gap-2">
  <div className="relative flex-1 max-w-sm">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
    <input className="w-full pl-9 py-2 text-sm border border-slate-200 rounded-lg focus:border-[#001743] outline-none" />
  </div>
  <select className="px-3 py-2 text-xs border border-slate-200 rounded-lg">...</select>
  <select className="px-3 py-2 text-xs border border-slate-200 rounded-lg">...</select>
</div>

{/* Active chips */}
{hasFilters && (
  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-full text-slate-700">
      Viettel <button><X size={10}/></button>
    </span>
    <button className="text-[11px] text-[#E4011E]">Xóa tất cả</button>
  </div>
)}
```

---

## 4. KPI ngữ cảnh

Chỉ dùng khi KPI **hỗ trợ quyết định** của tab đó. Không dùng chỉ để lấp chỗ trống.

| Tab | KPI phù hợp |
|---|---|
| SIM | Sẵn sàng · Đang đấu giá · Cần xác minh |
| eKYC | Chờ duyệt · Quá 24h · Bị từ chối hôm nay |
| Ký quỹ | Đang giữ · Chờ nạp đủ · Đang tranh chấp |
| Người dùng | Hoạt động · Bị khóa · Cần xem xét |
| Nhà mạng | Tổng đầu số · Tổng SIM |
| Thể loại | Tổng thể loại · Hệ số trung bình |

KPI nhỏ — không cần card to. Hiển thị theo kiểu inline strip:

```tsx
<div className="flex items-center gap-5 py-3 border-t border-b border-slate-100">
  <div>
    <div className="text-[11px] text-slate-400">Sẵn sàng</div>
    <div className="text-lg font-bold text-emerald-600 tabular-nums">4.820</div>
  </div>
  <div className="w-px h-8 bg-slate-200" />
  <div>
    <div className="text-[11px] text-slate-400">Đang đấu giá</div>
    <div className="text-lg font-bold text-amber-600 tabular-nums">12</div>
  </div>
</div>
```

---

## 5. Bảng dữ liệu (List)

### Quy tắc cột

| Vị trí | Nội dung |
|---|---|
| Cột 1 | Nhận diện chính (SIM, tên, mã) + metadata phụ 1 dòng bên dưới |
| Cột 2–N | Trạng thái, giá trị, ngày, metadata hỗ trợ |
| Cột cuối | Actions: icon `⋯` menu (không để button đỏ lộ diện liên tục) |

### Stacked data (gộp thông tin trong một ô)

```tsx
<td className="px-5 py-3.5">
  <div className="font-medium text-slate-900 text-sm">0901 234 567</div>
  <div className="text-[11px] text-slate-400 mt-0.5">SIM-02 · Mobifone · Sảnh tiến</div>
</td>
```

### Hover + highlight sau update

```tsx
// Hover
<tr className="hover:bg-slate-50/60 transition-colors duration-150 cursor-pointer">

// Row highlight sau lưu thành công (1.5s)
<tr className={`transition-colors duration-700 ${justUpdated ? "bg-emerald-50" : "bg-white"}`}>
```

### Action menu (⋯) hoặc Bộ nút thao tác trực tiếp
- Với các bảng dữ liệu chuyên biệt có ít thao tác (2–3 actions), ưu tiên **nút icon thao tác trực tiếp** (`Edit3`, `Trash2`, `Eye`, `Zap`) với tooltip rõ ràng để admin thao tác dứt khoát 1 chạm.
- Khi có > 3 hành động hoặc hành động phụ ít dùng, gom vào popover menu `⋯`.

---

## 5.1. Quy chuẩn Phân trang (Pagination Standard)

Mọi bảng dữ liệu (List) trong Admin Dashboard đều **bắt buộc phải có thanh phân trang (Pagination Bar)** ở chân thẻ chứa bảng (`Table Container Footer`).

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Bảng dữ liệu (thead, tbody)                                              │
├──────────────────────────────────────────────────────────────────────────┤
│ Hiển thị 1–10 trên tổng số 48 bản ghi    [10/trang ▾]        ‹ 1  2  3  › │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1. Cấu trúc và Vị trí
- **Vị trí**: Nằm cố định ở đáy bảng, ngăn cách với hàng dữ liệu cuối cùng bằng đường viền `border-t border-[#E2E8F0]`. Nền trắng `bg-white px-4 py-3`.
- **Bên trái (Metadata & Page Size)**:
  - Dòng text tóm tắt: `Hiển thị {from}–{to} trên tổng số {total} bản ghi`.
  - Dropdown kích thước trang: Lựa chọn `10`, `20`, `50` bản ghi trên mỗi trang. Mặc định là `10` hoặc `20`.
- **Bên phải (Điều hướng trang)**:
  - Nút chuyển trang trước `‹ Trước` (disabled khi đang ở trang 1).
  - Danh sách số trang:
    - Nếu tổng số trang ≤ 7: Hiển thị đầy đủ tất cả các trang `1 2 3 4 5 6 7`.
    - Nếu tổng số trang > 7: Hiển thị dạng rút gọn thông minh với dấu ba chấm `1 2 ... 8 9 10` hoặc `1 ... 4 5 6 ... 10`.
  - Nút chuyển trang kế `Tiếp ›` (disabled khi đang ở trang cuối).
- **Trạng thái Active**: Nút trang hiện tại có nền xanh Navy `#001743`, chữ trắng, bo góc `rounded-[6px]`, font đậm.
- **Trạng thái Hover**: Các trang chưa chọn có viền `border-[#E2E8F0] hover:bg-slate-100 text-slate-700`.

### 2. Quy tắc Quản lý State & Query Params
1. **Reset trang khi Lọc / Tìm kiếm**: Bất cứ khi nào người dùng nhập từ khóa tìm kiếm (`search`) hoặc thay đổi một tiêu chí lọc (nhà mạng, trạng thái, ngày tháng), hệ thống **BẮT BUỘC reset `pageIndex` về `1`**.
2. **Khóa tương tác khi Đang tải (`loading = true`)**: Disable toàn bộ các nút chuyển trang và đổi page size để tránh gửi request dồn dập (race conditions).
3. **Empty State**: Khi không có dữ liệu (`totalCount === 0`), ẩn thanh phân trang hoặc hiển thị `Hiển thị 0 bản ghi` và disable mọi nút.

### 3. Component Tiêu Chuẩn: `components/ui/Pagination.tsx`
Tất cả các trang Admin đều sử dụng component `Pagination` dùng chung thay vì tự viết lại HTML.

```tsx
<Pagination
  pageIndex={pageIndex}
  pageSize={pageSize}
  totalCount={totalCount}
  onPageChange={(page) => setPageIndex(page)}
  onPageSizeChange={(size) => {
    setPageSize(size);
    setPageIndex(1);
  }}
  loading={loading}
/>
```

---

## 6. RightDrawer — 3 kích thước

| Loại | Dùng cho | Chiều rộng |
|---|---|---|
| `md` | Xem chi tiết SIM, người dùng, giao dịch | 560px |
| `lg` | Thêm SIM, tạo phiên, chỉnh sửa phức tạp | 640px |
| `xl` | eKYC, fraud, khiếu nại, evidence | 720px |

### Cấu trúc Drawer cố định

```tsx
<RightDrawer open={open} onClose={onClose} size="lg" title="Chỉnh sửa SIM" badge="SIM-002">
  {/* Tabs (tùy chọn) */}
  <DrawerTabs tabs={["Tổng quan", "Lịch sử"]} />
  
  {/* Scrollable content */}
  <DrawerContent>
    <Section title="Thông tin cơ bản">
      <FormField label="Số điện thoại" required>...</FormField>
    </Section>
    <Section title="Phân loại">...</Section>
  </DrawerContent>
  
  {/* Sticky footer */}
  <DrawerFooter>
    <button variant="secondary">Hủy bỏ</button>
    <button variant="primary">Lưu thay đổi</button>
  </DrawerFooter>
</RightDrawer>
```

### Animation

```css
/* Drawer mở */
transform: translateX(0);
transition: transform 220ms cubic-bezier(0.32, 0.72, 0, 1);

/* Drawer đóng */
transform: translateX(100%);
transition: transform 180ms cubic-bezier(0.32, 0.72, 0, 1);
```

---

## 7. Modal — chỉ cho quyết định ngắn

**Dùng Modal cho:**
- Xóa, khóa, ban, phong tỏa
- Hủy phiên, giải ngân thủ công
- Xác nhận hoàn tiền
- Gia hạn nhanh 5 phút
- Duyệt/từ chối đơn giản (không cần evidence)

**Không dùng Modal cho:**
- Tạo SIM, tạo Auction
- Chỉnh sửa User phức tạp
- Duyệt eKYC có CCCD, ảnh chân dung
- Xử lý tranh chấp

### Cấu trúc Modal xác nhận

```tsx
<Modal>
  <div className="flex items-start gap-3 mb-4">
    <AlertTriangle className="text-rose-600 mt-0.5 shrink-0" size={18} />
    <div>
      <h3 className="text-sm font-semibold text-slate-900">Xác nhận xóa</h3>
      <p className="text-xs text-slate-500 mt-1">
        Bạn chắc chắn muốn xóa <strong>"{name}"</strong>? Hành động này không thể hoàn tác.
      </p>
    </div>
  </div>
  {/* Optional reason field */}
  <textarea placeholder="Lý do (bắt buộc)..." />
  <div className="flex justify-end gap-2 mt-4">
    <button variant="secondary">Quay lại</button>
    <button variant="danger">Xác nhận xóa</button>
  </div>
</Modal>
```

---

## 8. Action hierarchy

| Cấp | Style | Ví dụ |
|---|---|---|
| **Primary** | `bg-[#001743] text-white rounded-lg px-4 py-2` | Tạo mới, Lưu, Mở phiên |
| **Secondary** | `bg-slate-50 border border-slate-200 text-slate-700` | Nhập dữ liệu, Xuất, Chỉnh sửa |
| **Tertiary** | `text-slate-500 hover:text-[#001743]` (text only) | Xem chi tiết, Sao chép |
| **Danger** | `bg-[#E4011E] text-white` (chỉ trong Modal confirm) | Xóa, Khóa, Phong tỏa |

> Nút đỏ **không** xuất hiện liên tục trong bảng. Chỉ xuất hiện sau bước xác nhận Modal.
> Trong bảng, action nguy hiểm ẩn sau menu `⋯`.

---

## 9. Animation & Micro-interactions

| Tương tác | Spec |
|---|---|
| Drawer mở | `translateX(100%→0)` 220ms `cubic-bezier(0.32,0.72,0,1)` |
| Drawer đóng | `translateX(0→100%)` 180ms |
| Modal | `opacity(0→1)` + `scale(0.97→1)` 150ms |
| Hover row | `bg-slate-50/60` 150ms |
| Row update highlight | `bg-emerald-50` → `bg-white` fade 1500ms |
| Button active | `active:scale-[0.98]` 100ms |
| Skeleton | `animate-pulse` tĩnh (không shimmer) |
| Status badge change | color transition 200ms |
| Toast confirm | slide-in từ bottom-right 200ms |

---

## 10. Checklist trước khi ship một tab CRUD

- [ ] Có header đúng format (breadcrumb + title + 1 CTA)?
- [ ] Search ở đầu toolbar, filter phụ inline ≤ 3?
- [ ] Active filter hiển thị dưới toolbar?
- [ ] KPI có thực sự hỗ trợ quyết định không?
- [ ] Bảng ≤ 7 cột, cột đầu là stacked data?
- [ ] Action nguy hiểm ẩn trong menu ⋯?
- [ ] Create/Edit dùng Drawer, không dùng Modal?
- [ ] Xóa/Khóa dùng Modal confirm, không dùng alert?
- [ ] Drawer có sticky header + scrollable content + sticky footer?
- [ ] Row highlight sau khi lưu?
