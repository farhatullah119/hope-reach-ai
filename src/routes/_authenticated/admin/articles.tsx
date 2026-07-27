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
import { Loader2, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  listAdminArticles, saveArticle, setArticlePublished, deleteArticle, uploadAdminMedia,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/articles")({
  component: ArticlesPage,
});

type Row = {
  id: string; title: string; slug: string | null; excerpt: string | null; content: string | null;
  category: string; language: string; image_url: string | null; published: boolean; created_at: string;
};
type Form = {
  id?: string; title: string; slug: string; excerpt: string; content: string;
  category: string; language: "en" | "ur" | "ps"; image_url: string; published: boolean;
};
const EMPTY: Form = { title: "", slug: "", excerpt: "", content: "", category: "General", language: "en", image_url: "", published: false };

function ArticlesPage() {
  const list = useServerFn(listAdminArticles);
  const save = useServerFn(saveArticle);
  const setPub = useServerFn(setArticlePublished);
  const remove = useServerFn(deleteArticle);
  const upload = useServerFn(uploadAdminMedia);

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Row | null>(null);
  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await list({ data: { search: q, page, pageSize } });
      setRows(res.rows as unknown as Row[]);
      setTotal(res.total);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to load articles"); }
    finally { setLoading(false); }
  }, [list, q, page]);

  useEffect(() => { void load(); }, [load]);

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      let bin = "";
      buf.forEach((b) => { bin += String.fromCharCode(b); });
      const res = await upload({ data: { filename: file.name, contentType: file.type, dataBase64: btoa(bin) } });
      setForm((f) => (f ? { ...f, image_url: res.url } : f));
      toast.success("Image uploaded");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    finally { setUploading(false); }
  }

  return (
    <AdminShell
      title="Health Articles"
      description="Create, edit, publish and delete articles"
      actions={<Button size="sm" onClick={() => setForm({ ...EMPTY })}><Plus className="h-4 w-4 mr-1" /> New</Button>}
    >
      <div className="glass rounded-2xl p-4">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search title or category" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {loading ? (
          <div className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-2 pr-3">Title</th><th className="py-2 pr-3">Category</th><th className="py-2 pr-3">Lang</th><th className="py-2 pr-3">Published</th><th className="py-2 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-3 pr-3 max-w-[280px]"><div className="font-medium truncate">{r.title}</div><div className="text-xs text-muted-foreground truncate">{r.excerpt}</div></td>
                    <td className="py-3 pr-3"><Badge variant="secondary">{r.category}</Badge></td>
                    <td className="py-3 pr-3 uppercase text-xs">{r.language}</td>
                    <td className="py-3 pr-3">
                      <Switch checked={r.published} onCheckedChange={async (v) => {
                        try { await setPub({ data: { id: r.id, published: v } }); toast.success(v ? "Published" : "Unpublished"); await load(); }
                        catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
                      }} />
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setForm({
                          id: r.id, title: r.title, slug: r.slug ?? "", excerpt: r.excerpt ?? "", content: r.content ?? "",
                          category: r.category, language: (r.language as Form["language"]) ?? "en", image_url: r.image_url ?? "", published: r.published,
                        })}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setConfirmDel(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">No articles yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={page} pageSize={pageSize} total={total} onPage={setPage} />
      </div>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form?.id ? "Edit article" : "New article"}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                <div>
                  <Label>Language</Label>
                  <select className="w-full h-9 rounded-md border bg-background px-3 text-sm" value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value as Form["language"] })}>
                    <option value="en">English</option><option value="ur">Urdu</option><option value="ps">Pashto</option>
                  </select>
                </div>
              </div>
              <div><Label>Excerpt</Label><Textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
              <div><Label>Content</Label><Textarea rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
              <div>
                <Label>Cover image</Label>
                <div className="flex gap-2 items-center">
                  <Input value={form.image_url} placeholder="/api/public/media/..." onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                  <Button type="button" variant="outline" disabled={uploading} onClick={() => document.getElementById("art-file")?.click()}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </Button>
                  <input id="art-file" type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void onUpload(f); e.target.value = ""; }} />
                </div>
                {form.image_url && <img src={form.image_url} alt="Article cover preview" className="mt-2 h-28 rounded-lg object-cover" />}
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
                <Label>Published</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>Cancel</Button>
            <Button disabled={saving} onClick={async () => {
              if (!form) return;
              setSaving(true);
              try {
                await save({ data: form });
                toast.success("Article saved");
                setForm(null);
                await load();
              } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
              finally { setSaving(false); }
            }}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete article?</AlertDialogTitle>
            <AlertDialogDescription>"{confirmDel?.title}" will be permanently deleted.</AlertDialogDescription>
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
