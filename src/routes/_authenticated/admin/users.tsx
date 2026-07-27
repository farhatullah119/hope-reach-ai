import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell, Pager } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Pencil, Search, ShieldCheck, Trash2, KeyRound, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import {
  listAdminUsers, updateAdminUser, setAdminUserStatus, setAdminUserRole,
  deleteAdminUser, resetAdminUserPassword, type AdminUser,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
});

function UsersPage() {
  const list = useServerFn(listAdminUsers);
  const update = useServerFn(updateAdminUser);
  const setStatus = useServerFn(setAdminUserStatus);
  const setRole = useServerFn(setAdminUserRole);
  const remove = useServerFn(deleteAdminUser);
  const resetPw = useServerFn(resetAdminUserPassword);

  const [rows, setRows] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [name, setName] = useState("");
  const [confirmDel, setConfirmDel] = useState<AdminUser | null>(null);
  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await list({ data: { search: q, page, pageSize } });
      setRows(res.rows);
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [list, q, page]);

  useEffect(() => { void load(); }, [load]);

  async function act(id: string, fn: () => Promise<unknown>, msg: string) {
    setBusy(id);
    try { await fn(); toast.success(msg); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Action failed"); }
    finally { setBusy(null); }
  }

  return (
    <AdminShell title="User Management" description="Search, edit, suspend, promote or delete users">
      <div className="glass rounded-2xl p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }}
          className="flex gap-2 mb-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-2 pr-3">User</th><th className="py-2 pr-3">Role</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Joined</th><th className="py-2 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="py-3 pr-3">
                      <div className="font-medium">{u.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                    </td>
                    <td className="py-3 pr-3">
                      <Badge variant={u.suspended ? "destructive" : "outline"}>{u.suspended ? "suspended" : "active"}</Badge>
                    </td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        {busy === u.id && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                        <Button size="icon" variant="ghost" title="Edit" onClick={() => { setEditing(u); setName(u.full_name ?? ""); }}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title={u.role === "admin" ? "Make user" : "Make admin"}
                          onClick={() => act(u.id, () => setRole({ data: { userId: u.id, role: u.role === "admin" ? "user" : "admin" } }), "Role updated")}>
                          <ShieldCheck className={`h-4 w-4 ${u.role === "admin" ? "text-primary" : ""}`} />
                        </Button>
                        <Button size="icon" variant="ghost" title={u.suspended ? "Activate" : "Suspend"}
                          onClick={() => act(u.id, () => setStatus({ data: { userId: u.id, suspend: !u.suspended } }), u.suspended ? "User activated" : "User suspended")}>
                          {u.suspended ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" title="Send password reset"
                          onClick={() => act(u.id, () => resetPw({ data: { userId: u.id } }), "Password reset email sent")}>
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Delete" onClick={() => setConfirmDel(u)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">No users found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={page} pageSize={pageSize} total={total} onPage={setPage} />
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit user</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Email</Label><Input value={editing?.email ?? ""} disabled /></div>
            <div><Label htmlFor="fn">Full name</Label><Input id="fn" value={name} onChange={(e) => setName(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={async () => {
              if (!editing) return;
              const id = editing.id;
              setEditing(null);
              await act(id, () => update({ data: { userId: id, full_name: name } }), "User updated");
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>{confirmDel?.email} will be permanently removed along with their data. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              const u = confirmDel; setConfirmDel(null);
              if (u) await act(u.id, () => remove({ data: { userId: u.id } }), "User deleted");
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
