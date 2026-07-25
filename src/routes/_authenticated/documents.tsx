import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Upload, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({ meta: [
    { title: "Document Analyzer — ISF Hub AI" },
    { name: "description", content: "Upload a PDF, image, or text document. AI will summarize, translate, and extract key info." },
  ]}),
  component: Docs,
});

type Doc = { id: string; filename: string; summary: string | null; created_at: string; mime_type: string };

function Docs() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selected, setSelected] = useState<Doc | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadDocs() {
    const { data } = await supabase.from("documents").select("id,filename,summary,created_at,mime_type").order("created_at", { ascending: false }).limit(20);
    setDocs((data as Doc[] | null) ?? []);
  }
  useEffect(() => { if (user) loadDocs(); }, [user]);

  async function analyze() {
    if (!file || !user) return;
    if (file.size > 15 * 1024 * 1024) { toast.error("File must be under 15 MB"); return; }
    setBusy(true); setResult(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, mimeType: file.type, dataUrl, lang }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { text } = (await res.json()) as { text: string };
      setResult(text);
      await supabase.from("documents").insert({
        user_id: user.id, filename: file.name, mime_type: file.type, size_bytes: file.size,
        summary: text.slice(0, 4000), language: lang,
      });
      loadDocs();
      toast.success("Analysis complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    await supabase.from("documents").delete().eq("id", id);
    setDocs((d) => d.filter((x) => x.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  return (
    <AppLayout>
      <section className="mx-auto max-w-6xl px-4 py-10 grid md:grid-cols-[300px_1fr] gap-6">
        <aside className="space-y-3">
          <div className="glass rounded-2xl p-4">
            <h2 className="font-semibold mb-3 text-sm">{t("recent_docs")}</h2>
            <div className="space-y-1">
              {docs.map((d) => (
                <div key={d.id} className={`group flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-muted transition ${selected?.id === d.id ? "bg-accent" : ""}`}>
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <button onClick={() => { setSelected(d); setResult(d.summary); }} className="flex-1 truncate text-left">{d.filename}</button>
                  <button onClick={() => del(d.id)} className="opacity-0 group-hover:opacity-100 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              {docs.length === 0 && <p className="text-xs text-muted-foreground">No documents yet.</p>}
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t("documents_title")}</h1>
            <p className="mt-1 text-muted-foreground">{t("documents_sub")}</p>
          </div>

          <div className="glass rounded-2xl p-6">
            <input ref={inputRef} type="file" accept=".pdf,.txt,image/*" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); setSelected(null); }} className="hidden" />
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Button variant="outline" onClick={() => inputRef.current?.click()} className="gap-2"><Upload className="h-4 w-4" />{t("upload_cta")}</Button>
              {file && <span className="text-sm text-muted-foreground truncate max-w-xs">{file.name} · {(file.size / 1024).toFixed(0)} KB</span>}
              <Button onClick={analyze} disabled={!file || busy} className="sm:ml-auto">{busy ? t("analyzing") : t("analyze")}</Button>
            </div>
          </div>

          {result && (
            <div className="glass rounded-2xl p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}