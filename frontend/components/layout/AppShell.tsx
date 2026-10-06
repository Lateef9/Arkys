import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              Prototype
            </p>
            <h1 className="text-lg font-semibold text-[var(--foreground)]">
              Clinical Context Engine
            </h1>
          </div>
          <nav className="flex gap-4 text-sm text-[var(--muted)]">
            <Link className="hover:text-[var(--accent)]" href="/">
              Dashboard
            </Link>
            <Link className="hover:text-[var(--accent)]" href="/evaluation">
              Evaluation
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
