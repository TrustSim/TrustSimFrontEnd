"use client";

import type { ReactNode } from "react";
import { Table } from "antd";
import type { TableProps } from "antd";

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
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1>{title}</h1>
          {badge ? <span className="admin-page-badge">{badge}</span> : null}
        </div>
        <p>{description}</p>
      </div>
      {actions ? <div className="admin-page-actions">{actions}</div> : null}
    </section>
  );
}

export function AdminFilterBar({ children }: { children: ReactNode }) {
  return <section className="admin-filter-bar">{children}</section>;
}

export function AdminDataTable<RecordType extends object>({
  className,
  pagination,
  locale,
  scroll,
  ...props
}: TableProps<RecordType>) {
  return (
    <section className="admin-data-table">
      <Table<RecordType>
        {...props}
        className={`trustsim-admin-table ${className || ""}`}
        size="small"
        scroll={scroll ?? { x: "max-content" }}
        pagination={
          pagination === false
            ? false
            : {
                showSizeChanger: true,
                showQuickJumper: false,
                position: ["bottomRight"],
                showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} bản ghi`,
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
