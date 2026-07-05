import { useEffect, useState } from "react";
import {
  Activity,
  CreditCard,
  Database,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Users
} from "lucide-react";

interface User {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  createdAt: string;
}

const USERS_API_PATH = "/api/users";
const NAV_ITEMS = [
  { label: "Dashboard", detail: "Overview", icon: Activity, active: false },
  { label: "Users", detail: "User records", icon: Users, active: true },
  { label: "Payments", detail: "Wallet flow", icon: CreditCard, active: false },
  { label: "Storage", detail: "Database", icon: Database, active: false }
];

function App() {
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
      const response = await fetch(USERS_API_PATH);
      if (!response.ok) {
        throw new Error("Failed to load users");
      }

      const data: User[] = await response.json();
      setUsers(data);
    } catch {
      setError("Unable to load user records.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 rounded-[30px] border border-[var(--border)] bg-[var(--sidebar)] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.12)] lg:sticky lg:top-6 lg:min-h-[calc(100vh-3rem)] lg:w-[284px]">
          <div className="rounded-[24px] bg-[linear-gradient(135deg,var(--hero-start),var(--hero-end))] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.32em] text-white/70">Flex Pay</p>
           
          

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-2 text-sm">
              <ShieldCheck className="h-4 w-4" />
              Secure workspace
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                    item.active
                      ? "border-transparent bg-[var(--sidebar-accent)] text-[var(--foreground)]"
                      : "border-transparent bg-transparent text-[var(--muted-foreground)] hover:border-[var(--border)] hover:bg-[var(--sidebar-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <span
                    className={`rounded-xl p-2 ${
                      item.active ? "bg-white/75" : "bg-[var(--surface)]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="block text-xs uppercase tracking-[0.18em] opacity-80">
                      {item.detail}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

         
        </aside>

        <div className="min-w-0 flex-1">
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
                      <tr key={user.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]/40 transition-colors">
                        <td className="px-4 py-4 text-sm font-mono text-[var(--muted-foreground)]">
                          #{user.id}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium">{user.fullName}</td>
                        <td className="px-4 py-4 text-sm">{user.phone ?? "—"}</td>
                        <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">{user.email ?? "—"}</td>
                        <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">{formatDate(user.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function formatDate(value: string | unknown) {
  // Handle Jackson numeric-array format: [year, month, day, hour, minute, second, nano]
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value as number[];
    const d = new Date(year, month - 1, day, hour, minute, second);
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(d);
  }
  // Handle ISO-8601 string (when write-dates-as-timestamps=false)
  if (typeof value === "string" && value) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(d);
    }
  }
  return String(value ?? "—");
}

export default App;
