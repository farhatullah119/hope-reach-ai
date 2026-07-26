import { Link, useRouter } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Newspaper,
  Hospital,
  Mail,
  ScrollText,
  ShieldCheck,
  Menu,
  X,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/logs", label: "Activity Log", icon: ScrollText },
] as const;

export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => {
        const Icon = n.icon;
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={() => setOpen(false)}
            activeOptions={{ exact: Boolean((n as { exact?: boolean }).exact) }}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
            activeProps={{
              className:
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold bg-accent text-primary",
            }}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-background text-foreground flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-muted/20 p-4">
        <Link to="/admin" className="flex items-center gap-2 font-bold">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          Admin Panel
        </Link>
        <div className="mt-6">{nav}</div>
        <div className="mt-auto space-y-2 pt-6 text-sm">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to app
          </Link>
          <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 glass border-b">
          <div className="flex h-16 items-center gap-3 px-4">
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Admin menu"
              className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg border"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">{title}</h1>
              {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
            </div>
            <div className="ml-auto flex items-center gap-2">
              {actions}
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut();
                  router.navigate({ to: "/" });
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {open && <div className="lg:hidden border-t p-3">{nav}</div>}
        </header>
        <main className={cn("flex-1 p-4 md:p-6")}>{children}</main>
      </div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
        {Icon && (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-primary">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );
}

export function Pager({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between gap-3 pt-4 text-sm">
      <span className="text-muted-foreground">
        {total === 0 ? "No results" : `Page ${page} of ${pages} · ${total} total`}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}