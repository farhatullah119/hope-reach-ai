import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell, Pager } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listAdminHospitals, saveHospital, deleteHospital } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/hospitals")({
  component: HospitalsPage,
});

type Form = {
  id?: string; name: string; description: string; address: string; city: string; country: string;
  phone: string; email: string; website: string; maps_url: string; emergency_24_7: boolean;
  opening_hours: string; services: string;
};
type Row = Form & { id: string };
const EMPTY: Form = {
  name: "", description: "", address: "", city: "", country: "Pakistan", phone: "", email: "",
  website: "", maps_url: "", emergency_24_7: false, opening_hours: "", services: "",
};

function HospitalsPage() {
  const list = useServerFn(listAdminHospitals);
  const save = useServerFn(saveHospital);
  const remove = useServerFn(deleteHospital);

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Row | null>(null);
  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await list({ data: { search: q, page, pageSize } });
      setRows(res.rows as unknown as Row[]);
      setTotal(res.total);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to load hospitals"); }
    finally { setLoading(false); }
  }, [list, q, page]);

  useEffect(() => { void load(); }, [load]);

  const field = (k: keyof Form, label: string, ph?: string) => (
    <div>
      <Label>{label}</Label>
      <Input value={String(form?.[k] ?? "")} placeholder={ph} onChange={(e) => form && setForm({ ...form, [k]: e.target.value })} />
    </div>
  );

  return (
    <AdminShell
      title="Hospitals & Clinics"
      description="Manage the health facility directory"
      actions={<Button size="sm" onClick={() => setForm({ ...EMPTY })}><Plus className="h-4 w-4 mr-1" /> New</Button>}
    >
      <div className="glass rounded-2xl p-4">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by name or city" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {loading ? (
          <div className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-2 pr-3">Name</th><th className="py-2 pr-3">City</th><th className="py-2 pr-3">Phone</th><th className="py-2 pr-3">24/7</th><th className="py-2 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-3 pr-3"><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground truncate max-w-[260px]">{r.address}</div></td>
                    <td className="py-3 pr-3">{r.city}</td>
                    <td className="py-3 pr-3">{r.phone}</td>
                    <td className="py-3 pr-3">{r.emergency_24_7 ? <Badge>Emergency</Badge> : <span className="text-xs text-muted-foreground">—</span>}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setForm({
                          id: r.id, name: r.name, description: r.description ?? "", address: r.address ?? "", city: r.city ?? "",
                          country: r.country ?? "", phone: r.phone ?? "", email: r.email ?? "", website: r.website ?? "",
                          maps_url: r.maps_url ?? "", emergency_24_7: Boolean(r.emergency_24_7), opening_hours: r.opening_hours ?? "",
                          services: r.services ?? "",
                        })}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setConfirmDel(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">No hospitals yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={page} pageSize={pageSize} total={total} onPage={setPage} />
      </div>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form?.id ? "Edit hospital" : "New hospital"}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-3">
              {field("name", "Name")}
              <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              {field("address", "Address")}
              <div className="grid sm:grid-cols-2 gap-3">{field("city", "City")}{field("country", "Country")}</div>
              <div className="grid sm:grid-cols-2 gap-3">{field("phone", "Phone")}{field("email", "Email")}</div>
              <div className="grid sm:grid-cols-2 gap-3">{field("website", "Website")}{field("maps_url", "Google Maps link")}</div>
              <div className="grid sm:grid-cols-2 gap-3">{field("opening_hours", "Opening hours", "Mon–Sat 9am–9pm")}{field("services", "Services", "Comma separated")}</div>
              <div className="flex items-center gap-2">
                <Switch checked={form.emergency_24_7} onCheckedChange={(v) => setForm({ ...form, emergency_24_7: v })} />
                <Label>24/7 emergency available</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>Cancel</Button>
            <Button disabled={saving} onClick={async () => {
              if (!form) return;
              setSaving(true);
              try { await save({ data: form }); toast.success("Hospital saved"); setForm(null); await load(); }
              catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
              finally { setSaving(false); }
            }}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete hospital?</AlertDialogTitle>
            <AlertDialogDescription>"{confirmDel?.name}" will be permanently removed from the directory.</AlertDialogDescription>
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
