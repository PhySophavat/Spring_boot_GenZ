import React from "react";
import { Filter, RotateCcw } from "lucide-react";
import type { PinFilter, BalanceFilter, CurrencyFilter } from "../../../types/wallet";

interface WalletFilterProps {
  pinFilter: PinFilter;
  onPinFilterChange: (val: PinFilter) => void;
  balanceFilter: BalanceFilter;
  onBalanceFilterChange: (val: BalanceFilter) => void;
  currencyFilter: CurrencyFilter;
  onCurrencyFilterChange: (val: CurrencyFilter) => void;
  onResetFilters: () => void;
}

export function WalletFilter({
  pinFilter,
  onPinFilterChange,
  balanceFilter,
  onBalanceFilterChange,
  currencyFilter,
  onCurrencyFilterChange,
  onResetFilters,
}: WalletFilterProps) {
  const isFiltered = pinFilter !== "ALL" || balanceFilter !== "ALL" || currencyFilter !== "BOTH";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* PIN Status Filter */}
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
        <Filter className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-semibold text-slate-500">PIN:</span>
        <select
          value={pinFilter}
          onChange={(e) => onPinFilterChange(e.target.value as PinFilter)}
          className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="ALL">All</option>
          <option value="SET">Set (Green)</option>
          <option value="NOT_SET">Not Set (Orange)</option>
        </select>
      </div>

      {/* Balance Filter */}
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
        <span className="text-xs font-semibold text-slate-500">Balance:</span>
        <select
          value={balanceFilter}
          onChange={(e) => onBalanceFilterChange(e.target.value as BalanceFilter)}
          className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="ALL">All</option>
          <option value="POSITIVE">Positive (&gt; 0)</option>
          <option value="ZERO">Zero ($0)</option>
        </select>
      </div>

      {/* Currency Filter */}
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
        <span className="text-xs font-semibold text-slate-500">Currency:</span>
        <select
          value={currencyFilter}
          onChange={(e) => onCurrencyFilterChange(e.target.value as CurrencyFilter)}
          className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="BOTH">Both</option>
          <option value="USD">USD ($)</option>
          <option value="KHR">KHR (៛)</option>
        </select>
      </div>

      {/* Reset Filter Button */}
      {isFiltered && (
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      )}
    </div>
  );
}
