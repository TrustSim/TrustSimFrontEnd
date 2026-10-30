"use client";

import { useMemo, type ReactNode } from "react";
import { Button, Table, Tooltip } from "antd";
import type { TableProps } from "antd";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const ADMIN_ICON_SIZE = 16;

export function AdminPageHeader({
  title,
  description,
  badge,
  actions,
}: {
  title: string;
  description: string;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="admin-page-header">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <h1 className="tracking-tight">{title}</h1>
          {badge ? <span className="admin-page-badge shrink-0">{badge}</span> : null}
        </div>
        <p className="mt-1">{description}</p>
      </div>
      {actions ? <div className="admin-page-actions shrink-0">{actions}</div> : null}
    </section>
  );
}

export function AdminFilterBar({ children }: { children: ReactNode }) {
  return <section className="admin-filter-bar min-w-0 w-full">{children}</section>;
}

export function AdminIconButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Tooltip title={label} mouseEnterDelay={0.7}>
      <Button
        type="text"
        danger={danger}
        disabled={disabled}
        onClick={onClick}
        aria-label={label}
        icon={<Icon size={ADMIN_ICON_SIZE} strokeWidth={1.8} aria-hidden="true" />}
      />
    </Tooltip>
  );
}

export function AdminDataTable<RecordType extends object>({
  className,
  pagination,
  locale,
  scroll,
  columns,
  ...props
}: TableProps<RecordType>) {
  // Tính toán trước scroll.x tối ưu từ độ rộng các cột
  // Tránh việc Ant Design ép hẹp các cột trạng thái (badge) hoặc làm cột cố định (fixed: right) đè lên dữ liệu
  const computedScroll = useMemo(() => {
    if (scroll?.x && typeof scroll.x === "number") {
      return scroll;
    }
    let calculatedWidth = 0;
    if (columns && Array.isArray(columns) && columns.length > 0) {
      calculatedWidth = columns.reduce((acc, col) => {
        const w = typeof col.width === "number" ? col.width : 135;
        return acc + w;
      }, 0);
    }
    const finalX = Math.max(calculatedWidth, 980);
    return {
      x: scroll?.x ?? finalX,
      ...scroll,
    };
  }, [scroll, columns]);

  return (
    <section className="admin-data-table min-w-0 max-w-full w-full">
      <Table<RecordType>
        columns={columns}
        {...props}
        className={`trustsim-admin-table ${className || ""}`}
        size="small"
        scroll={computedScroll}
        pagination={
          pagination === false
            ? false
            : {
                showSizeChanger: true,
                showQuickJumper: false,
                position: ["bottomRight"],
                showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} bản ghi`,
                itemRender: (_page, type, originalElement) => {
                  if (type === "prev") return <ChevronLeft size={14} aria-hidden="true" />;
                  if (type === "next") return <ChevronRight size={14} aria-hidden="true" />;
                  return originalElement;
                },
                ...pagination,
              }
        }
        locale={{
          emptyText: "Không có dữ liệu phù hợp",
          ...locale,
        }}
      />
    </section>
  );
}
