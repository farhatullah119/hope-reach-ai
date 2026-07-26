import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminStats } from "@/lib/admin.functions";
import { AdminShell, StatTile } from "@/components/admin/AdminShell";
import { Users, MessageSquare, Mail, Newspaper, Hospital, Pill, FolderHeart, FileText, Loader2 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — ISF Hub AI" }, { name: "robots", content: "noindex" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const fetchStats = useServerFn(getAdminStats);
  const { data, isPending } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fetchStats() });

  return (
    <AdminShell title="Dashboard" description="Platform overview and analytics">
      {isPending || !data ? (
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Total users" value={data.totals.users} icon={Users} />
            <StatTile label="AI chats" value={data.totals.chats} icon={MessageSquare} />
            <StatTile label="Contact messages" value={data.totals.messages} icon={Mail} />
            <StatTile label="Health articles" value={data.totals.articles} icon={Newspaper} />
            <StatTile label="Hospitals" value={data.totals.hospitals} icon={Hospital} />
            <StatTile label="Medicine reminders" value={data.totals.reminders} icon={Pill} />
            <StatTile label="Medical records" value={data.totals.records} icon={FolderHeart} />
            <StatTile label="Documents analysed" value={data.totals.documents} icon={FileText} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="glass rounded-2xl p-4">
              <h2 className="mb-3 text-sm font-semibold">AI chats · last 14 days</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.series}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" fontSize={11} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="chats" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass rounded-2xl p-4">
              <h2 className="mb-3 text-sm font-semibold">Signups &amp; messages · last 14 days</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.series}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" fontSize={11} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="signups" fill="hsl(var(--primary))" radius={4} />
                    <Bar dataKey="messages" fill="hsl(var(--secondary))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="glass rounded-2xl p-4">
              <h2 className="mb-3 text-sm font-semibold">Recent contact messages</h2>
              {data.recentMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.recentMessages.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{m.full_name} — {m.subject}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="glass rounded-2xl p-4">
              <h2 className="mb-3 text-sm font-semibold">Recent admin activity</h2>
              {data.recentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No admin actions logged yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.recentLogs.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{l.admin_email ?? "admin"} · {l.action} {l.entity}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}