import React from "react";
import { Search, X } from "lucide-react";

interface WalletSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function WalletSearch({ searchTerm, onSearchChange }: WalletSearchProps) {
  return (
    <div className="relative flex-1 min-w-[240px]">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
        <Search className="h-4 w-4" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by Wallet ID, Number, Name, Phone..."
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      />
      {searchTerm && (
        <button
          type="button"
          onClick={() => onSearchChange("")}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
