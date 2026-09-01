"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell handles top-level Layout logic:
 * - Automatically renders public Navbar & Footer for storefront pages (/, /auctions, /profile, etc.)
 * - Bypasses storefront Navbar & Footer on Admin and Auth pages (/admin, /login, /register) which manage their own dedicated layouts.
 */
export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();

  const isExcludedRoute =
    pathname?.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/register";

  if (isExcludedRoute) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
};

export default AppShell;
