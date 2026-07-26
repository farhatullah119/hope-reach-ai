import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listAuditLog } from "@/lib/admin.functions";
import { AdminShell, Pager } from "@/components/admin/AdminShell";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  head: () => ({ meta: [{ title: "Admin Activity Log — ISF Hub AI" }, { name: "robots", content: "noindex" }] }),
  component: LogsPage,
});

type LogRow = {
  id: string;
  admin_email: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  created_at: string;
};

function LogsPage() {
  const list = useServerFn(listAuditLog);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const { data, isPending } = useQuery({
    queryKey: ["admin-logs", search, page],
    queryFn: () => list({ data: { search, page, pageSize } }),
  });
  const rows = (data?.rows ?? []) as LogRow[];

  return (
    <AdminShell title="Activity Log" description="Every administrator action is recorded">
      <div className="glass rounded-2xl p-4">
        <Input
          placeholder="Search action or entity…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-sm"
        />
        {isPending ? (
          <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-2">When</th><th>Admin</th><th>Action</th><th>Entity</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="truncate">{r.admin_email ?? "—"}</td>
                    <td>{r.action}</td>
                    <td>{r.entity}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No activity yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={page} pageSize={pageSize} total={data?.total ?? 0} onPage={setPage} />
      </div>
    </AdminShell>
  );
}