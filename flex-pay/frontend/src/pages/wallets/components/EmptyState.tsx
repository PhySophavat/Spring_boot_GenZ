import React from "react";
import { Wallet } from "lucide-react";

interface EmptyStateProps {
  onResetFilters?: () => void;
}

export function EmptyState({ onResetFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Wallet className="h-8 w-8 opacity-40" />
      </div>
      <h3 className="mt-4 font-['Manrope',sans-serif] text-lg font-bold text-slate-800">
        No Wallet Found
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        There are currently no wallets in the system matching your criteria.
      </p>
      {onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-5 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
        >
          Reset All Filters
        </button>
      )}
    </div>
  );
}
