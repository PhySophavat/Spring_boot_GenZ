import React from "react";

interface WalletSkeletonProps {
  rows?: number;
}

export function WalletSkeleton({ rows = 5 }: WalletSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-slate-100">
          <td className="px-6 py-4">
            <div className="h-4 w-20 rounded bg-slate-200" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-16 rounded bg-slate-200" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-12 rounded bg-slate-200" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-28 rounded bg-slate-200" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-24 rounded bg-slate-200" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-16 rounded bg-slate-200" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-20 rounded bg-slate-200" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-16 rounded bg-slate-200" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-20 rounded bg-slate-200" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-16 rounded bg-slate-200" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-20 rounded bg-slate-200" />
          </td>
          <td className="px-6 py-4">
            <div className="h-6 w-16 rounded-full bg-slate-200" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-24 rounded bg-slate-200" />
          </td>
          <td className="px-6 py-4">
            <div className="h-8 w-16 rounded-xl bg-slate-200" />
          </td>
        </tr>
      ))}
    </>
  );
}
