import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/lib/i18n";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink, Phone, MapPin, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type R = { id: string; category: string; name: string; description: string | null; country: string | null; city: string | null; contact: string | null; website: string | null; tags: string[] | null };

const CATEGORIES = ["all", "ngo", "scholarship", "health", "legal", "education", "employment", "emergency", "government"] as const;
const LABELS: Record<string, string> = {
  all: "All", ngo: "NGOs", scholarship: "Scholarships", health: "Health", legal: "Legal",
  education: "Education", employment: "Employment", emergency: "Emergency", government: "Government",
};

export const Route = createFileRoute("/resources")({
  head: () => ({ meta: [
    { title: "Resource Directory — ISF Hub AI" },
    { name: "description", content: "Search NGOs, scholarships, hospitals, legal aid, schools, emergency contacts & government offices for refugees and vulnerable communities." },
    { property: "og:title", content: "Humanitarian Resource Directory" },
    { property: "og:description", content: "Vetted resources: NGOs, scholarships, health, legal, education, jobs, emergency." },
  ]}),
  component: Resources,
});

function Resources() {
  const { t } = useI18n();
  const [items, setItems] = useState<R[] | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  useEffect(() => {
    supabase.from("resources").select("*").order("category").then(({ data }) => setItems((data as R[]) ?? []));
  }, []);

  const filtered = useMemo(() => {
    if (!items) return null;
    return items.filter((r) => {
      if (cat !== "all" && r.category !== cat) return false;
      if (!q) return true;
      const s = `${r.name} ${r.description ?? ""} ${r.country ?? ""} ${r.city ?? ""} ${(r.tags ?? []).join(" ")}`.toLowerCase();
      return s.includes(q.toLowerCase());
    });
  }, [items, q, cat]);

  return (
    <AppLayout>
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold">{t("resources_title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("resources_sub")}</p>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("search_ph")} value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <Button key={c} variant={cat === c ? "default" : "outline"} size="sm" onClick={() => setCat(c)}>
                {c === "all" ? t("filter_all") : LABELS[c]}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {!filtered && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          {filtered?.map((r) => (
            <div key={r.id} className="glass rounded-2xl p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-primary uppercase tracking-wide">{LABELS[r.category] ?? r.category}</div>
                  <h3 className="mt-1 font-semibold text-lg leading-snug">{r.name}</h3>
                </div>
              </div>
              {r.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{r.description}</p>}
              <div className="mt-3 space-y-1 text-sm">
                {(r.city || r.country) && (
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{[r.city, r.country].filter(Boolean).join(", ")}</div>
                )}
                {r.contact && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{r.contact}</div>}
              </div>
              {r.website && (
                <a href={r.website} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                  Visit website <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ))}
          {filtered && filtered.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-10">No results.</div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}