import type { ReactNode } from "react";

export type AdminStatusTone = "success" | "info" | "warning" | "danger" | "neutral";

function toneFromStatus(status: string): AdminStatusTone {
  const value = status.trim().toLowerCase();
  if (/cancel|fail|reject|disput|suspend|blocked|khóa|hủy|thất bại|từ chối|tranh chấp/.test(value)) return "danger";
  if (/pending|waiting|schedule|review|chờ|đợi|đang xử lý|đang thẩm định/.test(value)) return "warning";
  if (/unverified|not_verified|chưa/.test(value)) return "neutral";
  if (/active|live|listed|đang bán|đang diễn ra|đang hoạt động/.test(value)) return "info";
  if (/verified|approved|completed|complete|posted|released|transferred|tranfered|available|indexed|hoàn tất|hoàn thành|đã duyệt|đã xác minh|đã thẩm định|đã cấp|đã chuyển|đã kết thúc|sẵn sàng|hoạt động/.test(value)) return "success";
  return "neutral";
}

export function AdminStatusBadge({
  status,
  label,
  tone,
}: {
  status: string;
  label?: ReactNode;
  tone?: AdminStatusTone;
}) {
  const semanticStatus = typeof label === "string" ? `${status} ${label}` : status;
  return <span className="admin-status-badge" data-tone={tone || toneFromStatus(semanticStatus)}>{label ?? status}</span>;
}
