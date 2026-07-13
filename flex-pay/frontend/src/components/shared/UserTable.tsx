import { LoaderCircle } from "lucide-react";
import { formatDate } from "../../lib/formatDate";
import type { User } from "../../types/user";

interface UserTableProps {
  users: User[];
  loading: boolean;
  error: string;
}

export default function UserTable({ users, loading, error }: UserTableProps) {
  return (
    <section className="mt-6 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
          Stored Users
        </p>
        <h2 className="mt-2 font-['Manrope','IBM_Plex_Sans',sans-serif] text-2xl font-bold">
          User record table
        </h2>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-3xl border border-[var(--border)]">
        <table className="min-w-full border-collapse">
          <thead className="bg-[var(--muted)]">
            <tr>
              <th className="px-4 py-4 text-left text-[11px] uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
                ID
              </th>
              <th className="px-4 py-4 text-left text-[11px] uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
                Full Name
              </th>
              <th className="px-4 py-4 text-left text-[11px] uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
                Phone
              </th>
              <th className="px-4 py-4 text-left text-[11px] uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
                Email
              </th>
              <th className="px-4 py-4 text-left text-[11px] uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
                Created At
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10">
                  <div className="flex items-center justify-center gap-2 text-[var(--muted-foreground)]">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Loading users...
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-[var(--muted-foreground)]"
                >
                  No user records found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors"
                >
                  <td className="px-4 py-4 text-sm font-mono text-[var(--muted-foreground)]">
                    #{user.id}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium">{user.fullName}</td>
                  <td className="px-4 py-4 text-sm">{user.phoneNumber ?? "—"}</td>
                  <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {user.email ?? "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
