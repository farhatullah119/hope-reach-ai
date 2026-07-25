import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useI18n, type Lang } from "@/lib/i18n";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowRightLeft, Languages } from "lucide-react";

export const Route = createFileRoute("/_authenticated/translator")({
  head: () => ({ meta: [
    { title: "AI Translator — ISF Hub AI" },
    { name: "description", content: "Instant AI translation between English, Urdu and Pashto." },
  ]}),
  component: Translator,
});

function Translator() {
  const { t } = useI18n();
  const [from, setFrom] = useState<Lang>("en");
  const [to, setTo] = useState<Lang>("ur");
  const [text, setText] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);

  async function translate() {
    if (!text.trim() || busy) return;
    if (from === to) { setOut(text); return; }
    setBusy(true); setOut("");
    try {
      const res = await fetch("/api/translate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, from, to }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { text: result } = (await res.json()) as { text: string };
      setOut(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Translation failed");
    } finally { setBusy(false); }
  }

  function swap() { setFrom(to); setTo(from); setText(out); setOut(text); }

  return (
    <AppLayout>
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-2"><Languages className="h-4 w-4" /> AI Translator</div>
        <h1 className="text-2xl md:text-3xl font-bold">{t("translator_title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("translator_sub")}</p>

        <div className="mt-6 glass rounded-2xl p-6">
          <div className="flex items-center gap-3 justify-center mb-4">
            <LangSelect value={from} onChange={setFrom} label={t("from")} />
            <Button variant="ghost" size="icon" onClick={swap} aria-label="Swap"><ArrowRightLeft className="h-4 w-4" /></Button>
            <LangSelect value={to} onChange={setTo} label={t("to")} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="Type text to translate…" dir={from === "ur" || from === "ps" ? "rtl" : "ltr"} />
            <Textarea value={out} readOnly rows={8} placeholder={t("result")} dir={to === "ur" || to === "ps" ? "rtl" : "ltr"} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={translate} disabled={busy || !text.trim()}>{busy ? t("translating") : t("translate")}</Button>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

function LangSelect({ value, onChange, label }: { value: Lang; onChange: (l: Lang) => void; label: string }) {
  return (
    <label className="text-sm">
      <span className="text-muted-foreground mr-2">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as Lang)} className="bg-transparent border rounded-lg px-3 py-1.5 cursor-pointer">
        <option value="en">English</option>
        <option value="ur">اردو</option>
        <option value="ps">پښتو</option>
      </select>
    </label>
  );
}