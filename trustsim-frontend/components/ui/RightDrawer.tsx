"use client";

import React from "react";
import { Button, Drawer, Tabs } from "antd";

type DrawerSize = "md" | "lg" | "xl";

const SIZE_MAP: Record<DrawerSize, string> = {
  md: "min(520px, 100vw)",
  lg: "min(640px, 100vw)",
  xl: "min(760px, 100vw)",
};

interface RightDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  badge?: string;
  badgeCls?: string;
  size?: DrawerSize;
  children: React.ReactNode;
}

/**
 * RightDrawer — slide-in panel from the right.
 * Layout: sticky header → scrollable content → (optional) sticky footer.
 *
 * Usage:
 *   <RightDrawer open={open} onClose={onClose} title="Chỉnh sửa SIM" badge="SIM-002" size="lg">
 *     <DrawerBody>...</DrawerBody>
 *     <DrawerFooter>...</DrawerFooter>
 *   </RightDrawer>
 */
export function RightDrawer({
  open,
  onClose,
  title,
  badge,
  badgeCls = "bg-slate-100 text-slate-600",
  size = "md",
  children,
}: RightDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={SIZE_MAP[size]}
      keyboard
      maskClosable
      destroyOnHidden
      rootClassName="trustsim-admin-drawer"
      title={
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="truncate text-sm font-semibold text-[var(--admin-ink)]">{title}</span>
          {badge ? (
            <span className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] font-semibold ${badgeCls}`}>
              {badge}
            </span>
          ) : null}
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </Drawer>
  );
}

/**
 * DrawerBody — scrollable middle section.
 */
export function DrawerBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex-1 overflow-y-auto px-6 py-5 space-y-5 ${className}`}>
      {children}
    </div>
  );
}

/**
 * DrawerFooter — sticky bottom action bar.
 */
export function DrawerFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-white">
      {children}
    </div>
  );
}

/**
 * DrawerSection — form section with a heading.
 */
export function DrawerSection({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {(title || subtitle) && (
        <div>
          {title && (
            <div className="text-xs font-semibold text-slate-800">
              {title}
            </div>
          )}
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="space-y-3.5">{children}</div>
    </div>
  );
}

/**
 * FormField — label + input wrapper with validation.
 */
export function FormField({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700">
        <span className="mb-1.5 block">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </span>
        {children}
      </label>
      <p className={`mt-1 min-h-[1.25rem] text-[11px] ${error ? "text-rose-600" : "text-slate-500"}`}>
        {error || hint || ""}
      </p>
    </div>
  );
}

/**
 * DrawerTabs — simple tab row inside a drawer.
 */
export function DrawerTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: number;
  onChange: (i: number) => void;
}) {
  return (
    <Tabs
      className="admin-drawer-tabs"
      activeKey={String(active)}
      onChange={(key) => onChange(Number(key))}
      items={tabs.map((tab, index) => ({ key: String(index), label: tab }))}
    />
  );
}

/**
 * Primary action mapped to the shared Ant Design theme.
 */
export function BtnPrimary({
  children,
  onClick,
  disabled,
  type = "button",
  form,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  form?: string;
}) {
  return (
    <Button type="primary" htmlType={type} form={form} onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
}

/**
 * Pre-built secondary button.
 */
export function BtnSecondary({
  children,
  onClick,
  disabled,
  type = "button",
  form,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  form?: string;
}) {
  return (
    <Button htmlType={type} form={form} onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
}
