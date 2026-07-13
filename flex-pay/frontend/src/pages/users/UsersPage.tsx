import { useEffect, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import UserTable from "../../components/shared/UserTable";
import { fetchUsers } from "../../services/userService";
import type { User } from "../../types/user";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch {
      setError("Unable to load user records.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-w-0 flex-1">
      {/* Page header */}
      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
              User Records
            </p>
            <h2 className="mt-2 font-['Manrope','IBM_Plex_Sans',sans-serif] text-3xl font-bold">
              Admin user data
            </h2>
          </div>

          <button
            type="button"
            onClick={() => void loadUsers()}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {/* Stats row */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
                Total Users
              </p>
              <p className="mt-3 font-['Manrope','IBM_Plex_Sans',sans-serif] text-4xl font-bold">
                {users.length}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--muted)] p-4">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
          <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
            Sync Status
          </p>
          <p className="mt-3 font-['Manrope','IBM_Plex_Sans',sans-serif] text-2xl font-bold">
            API online
          </p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Connected to Spring Boot service through the local `/api` proxy.
          </p>
        </div>
      </section>

      {/* User table */}
      <UserTable users={users} loading={loading} error={error} />
    </div>
  );
}
