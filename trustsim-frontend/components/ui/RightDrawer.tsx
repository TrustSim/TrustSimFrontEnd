"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

type DrawerSize = "md" | "lg" | "xl";

const SIZE_MAP: Record<DrawerSize, string> = {
  md: "w-[560px]",
  lg: "w-[640px]",
  xl: "w-[720px]",
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
  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px] transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`
          fixed right-0 top-0 bottom-0 z-[61] flex flex-col bg-white shadow-2xl
          ${SIZE_MAP[size]} max-w-full
          transition-transform duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)]
          ${open ? "translate-x-0" : "translate-x-full pointer-events-none invisible"}
        `}
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-sm font-semibold text-[#001743] truncate">{title}</h2>
            {badge && (
              <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${badgeCls}`}>
                {badge}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Đóng"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Scrollable body + optional sticky footer — children handle this */}
        <div className="flex flex-col flex-1 min-h-0">
          {children}
        </div>
      </div>
    </>
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
            <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
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
      <label className="block text-xs font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
      {!error && hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
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
    <div className="flex gap-0 border-b border-slate-100 shrink-0 px-6">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          onClick={() => onChange(i)}
          className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors duration-150 ${
            active === i
              ? "border-[#001743] text-[#001743]"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

/**
 * Pre-built primary button with active:scale feedback.
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
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#001743] hover:bg-[#00266B] active:scale-[0.98] text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
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
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] text-slate-600 text-xs font-medium rounded-lg border border-slate-200 transition-all disabled:opacity-50"
    >
      {children}
    </button>
  );
}
