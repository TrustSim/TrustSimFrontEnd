/* Hallmark · preview harness for wallet modals
 * states: default · hover · focus-visible · active · disabled · loading · error · success
 */

"use client";

import React, { useState } from "react";
import { DepositModal } from "./DepositModal";
import { WithdrawModal } from "./WithdrawModal";

export const WalletModalsPreview: React.FC = () => {
  const [activeModal, setActiveModal] = useState<"none" | "deposit" | "withdraw">("none");
  const [balance, setBalance] = useState<number>(25_450_000);

  return (
    <div className="p-8 max-w-2xl mx-auto font-sans">
      <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-base font-bold text-[#001743]">Wallet Modals 8-State Preview</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Testing DepositModal and WithdrawModal under modern-minimal tokens
            </p>
          </div>
          <span className="font-mono font-bold text-sm text-[#001743] bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
            {balance.toLocaleString("vi-VN")} ₫
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            type="button"
            onClick={() => setActiveModal("deposit")}
            className="py-2.5 px-4 rounded-xl bg-[#001743] hover:bg-[#0A2566] text-white text-xs font-bold transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4011E] active:scale-[0.98]"
          >
            Mở DepositModal (Nạp tiền)
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("withdraw")}
            className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E4011E] active:scale-[0.98]"
          >
            Mở WithdrawModal (Rút tiền)
          </button>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            State Coverage Checklist
          </h2>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-medium border border-emerald-200/80">
              ✓ default
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-medium border border-emerald-200/80">
              ✓ hover
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-medium border border-emerald-200/80">
              ✓ focus-visible
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-medium border border-emerald-200/80">
              ✓ active
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-medium border border-emerald-200/80">
              ✓ disabled
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-medium border border-emerald-200/80">
              ✓ loading
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-medium border border-emerald-200/80">
              ✓ error
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-medium border border-emerald-200/80">
              ✓ success
            </span>
          </div>
        </div>
      </div>

      <DepositModal
        isOpen={activeModal === "deposit"}
        onClose={() => setActiveModal("none")}
        onSuccess={() => setBalance((prev) => prev + 500_000)}
        initialAmount={500_000}
      />

      <WithdrawModal
        isOpen={activeModal === "withdraw"}
        onClose={() => setActiveModal("none")}
        availableBalance={balance}
        onSuccess={(tx) => setBalance((prev) => Math.max(0, prev - tx.amount))}
      />
    </div>
  );
};

export default WalletModalsPreview;
