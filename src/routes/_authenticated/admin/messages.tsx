import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell, Pager } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, Loader2, Mail, MailOpen, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  listAdminMessages, setMessageRead, replyToMessage, deleteMessage, exportMessagesCsv,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: MessagesPage,
});

type Row = {
  id: string; full_name: string; email: string; phone: string | null; subject: string; message: string;
  status: string; user_ip: string | null; admin_reply: string | null; replied_at: string | null; created_at: string;
};

function MessagesPage() {
  const list = useServerFn(listAdminMessages);
  const setRead = useServerFn(setMessageRead);
  const reply = useServerFn(replyToMessage);
  const remove = useServerFn(deleteMessage);
  const exportCsv = useServerFn(exportMessagesCsv);

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Row | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Row | null>(null);
  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await list({ data: { search: q, page, pageSize } });
      setRows(res.rows as unknown as Row[]);
      setTotal(res.total);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to load messages"); }
    finally { setLoading(false); }
  }, [list, q, page]);

  useEffect(() => { void load(); }, [load]);

  return (
    <AdminShell
      title="Contact Messages"
      description="Read, reply to, export and delete submissions"
      actions={
        <Button size="sm" variant="outline" onClick={async () => {
          try {
            const res = await exportCsv({ data: {} });
            const url = URL.createObjectURL(new Blob([res.csv], { type: "text/csv" }));
            const a = document.createElement("a");
            a.href = url; a.download = `contact-messages-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
            URL.revokeObjectURL(url);
            toast.success(`Exported ${res.count} messages`);
          } catch (e) { toast.error(e instanceof Error ? e.message : "Export failed"); }
        }}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
      }
    >
      <div className="glass rounded-2xl p-4">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name, email or subject" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {loading ? (
          <div className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-2 pr-3">From</th><th className="py-2 pr-3">Subject</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Date</th><th className="py-2 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={`border-t ${r.status === "new" ? "font-medium" : ""}`}>
                    <td className="py-3 pr-3"><div>{r.full_name}</div><div className="text-xs text-muted-foreground">{r.email}</div></td>
                    <td className="py-3 pr-3 max-w-[260px] truncate">{r.subject}</td>
                    <td className="py-3 pr-3"><Badge variant={r.status === "new" ? "default" : r.status === "replied" ? "secondary" : "outline"}>{r.status}</Badge></td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title="Open" onClick={() => { setOpen(r); setReplyText(r.admin_reply ?? ""); if (r.status === "new") void setRead({ data: { id: r.id, read: true } }).then(load); }}>
                          <MailOpen className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Mark unread" onClick={async () => {
                          try { await setRead({ data: { id: r.id, read: false } }); await load(); } catch { toast.error("Failed"); }
                        }}><Mail className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setConfirmDel(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">No messages.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={page} pageSize={pageSize} total={total} onPage={setPage} />
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>{open?.subject}</DialogTitle></DialogHeader>
          {open && (
            <div className="space-y-3 text-sm">
              <div className="text-muted-foreground text-xs">
                {open.full_name} · {open.email}{open.phone ? ` · ${open.phone}` : ""} · {new Date(open.created_at).toLocaleString()}
                {open.user_ip ? ` · IP ${open.user_ip}` : ""}
              </div>
              <div className="rounded-xl bg-muted p-3 whitespace-pre-wrap">{open.message}</div>
              <div>
                <Label>Reply</Label>
                <Textarea rows={5} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write your reply…" />
              </div>
              {open.replied_at && <p className="text-xs text-muted-foreground">Last replied {new Date(open.replied_at).toLocaleString()}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(null)}>Close</Button>
            <Button disabled={saving || !replyText.trim()} onClick={async () => {
              if (!open) return;
              setSaving(true);
              try { await reply({ data: { id: open.id, reply: replyText.trim() } }); toast.success("Reply saved"); setOpen(null); await load(); }
              catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
              finally { setSaving(false); }
            }}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Send reply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>The message from {confirmDel?.email} will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              const r = confirmDel; setConfirmDel(null);
              if (!r) return;
              try { await remove({ data: { id: r.id } }); toast.success("Deleted"); await load(); }
              catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed"); }
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
