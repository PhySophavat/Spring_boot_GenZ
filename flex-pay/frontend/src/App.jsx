import { mockUsers } from "./mockUsers";

function App() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-6 rounded-[28px] border border-white/10 bg-slate-950/70 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl lg:grid-cols-[1.4fr_0.9fr]">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.32em] text-amber-300">
            Flex Pay / ReactJS Test UI
          </p>
          <h1 className="max-w-[10ch] font-['Space_Grotesk','IBM_Plex_Sans',sans-serif] text-5xl leading-none font-bold text-stone-100 sm:text-6xl lg:text-7xl">
            Users table for the PostgreSQL `flex_pay` database.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-stone-300/85">
            This screen mirrors the test rows inserted into the `users` table so
            you can verify the UI structure before wiring a real API.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl border border-white/10 bg-linear-to-br from-amber-400/16 to-teal-300/14 px-5 py-4">
            <span className="block text-[11px] uppercase tracking-[0.28em] text-stone-300/60">
              Database
            </span>
            <strong className="mt-2 block text-2xl font-semibold text-stone-100">
              flex_pay
            </strong>
          </div>
          <div className="rounded-3xl border border-white/10 bg-linear-to-br from-amber-400/16 to-teal-300/14 px-5 py-4">
            <span className="block text-[11px] uppercase tracking-[0.28em] text-stone-300/60">
              Rows
            </span>
            <strong className="mt-2 block text-2xl font-semibold text-stone-100">
              {mockUsers.length}
            </strong>
          </div>
          <div className="rounded-3xl border border-white/10 bg-linear-to-br from-amber-400/16 to-teal-300/14 px-5 py-4">
            <span className="block text-[11px] uppercase tracking-[0.28em] text-stone-300/60">
              Mode
            </span>
            <strong className="mt-2 block text-2xl font-semibold text-stone-100">
              Mock UI
            </strong>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-white/10 bg-slate-950/70 p-7 shadow-[0_24px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.32em] text-amber-300">
              Users
            </p>
            <h2 className="font-['Space_Grotesk','IBM_Plex_Sans',sans-serif] text-3xl font-bold text-stone-100">
              Test account records
            </h2>
          </div>
          <span className="inline-flex w-fit items-center rounded-full bg-teal-300/14 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-teal-200">
            React + Vite + Tailwind
          </span>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-white/10">
          <table className="min-w-full border-collapse bg-white/2">
            <thead className="bg-white/5">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.26em] text-amber-300">
                  ID
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.26em] text-amber-300">
                  Full Name
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.26em] text-amber-300">
                  Email
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.26em] text-amber-300">
                  Password
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.26em] text-amber-300">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-white/6 text-stone-200 transition-colors hover:bg-white/4"
                >
                  <td className="px-5 py-4">{user.id}</td>
                  <td className="px-5 py-4">{user.fullName}</td>
                  <td className="px-5 py-4">{user.email}</td>
                  <td className="px-5 py-4">{user.password}</td>
                  <td className="px-5 py-4">{user.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default App;
