import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, FileText, Languages, BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [
    { title: "Dashboard — ISF Hub AI" },
    { name: "description", content: "Your personal ISF Hub AI workspace: recent chats, documents and quick actions." },
  ]}),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [stats, setStats] = useState({ chats: 0, docs: 0 });
  const [chats, setChats] = useState<{ id: string; title: string; updated_at: string }[]>([]);
  const [docs, setDocs] = useState<{ id: string; filename: string; created_at: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [c, d, cl, dl] = await Promise.all([
        supabase.from("chat_conversations").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("chat_conversations").select("id,title,updated_at").order("updated_at", { ascending: false }).limit(5),
        supabase.from("documents").select("id,filename,created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({ chats: c.count ?? 0, docs: d.count ?? 0 });
      setChats((cl.data as { id: string; title: string; updated_at: string }[] | null) ?? []);
      setDocs((dl.data as { id: string; filename: string; created_at: string }[] | null) ?? []);
    })();
  }, [user]);

  const quick = [
    { to: "/assistant", label: t("nav_assistant"), icon: MessageSquare },
    { to: "/documents", label: t("nav_documents"), icon: FileText },
    { to: "/translator", label: t("nav_translator"), icon: Languages },
    { to: "/resources", label: t("nav_resources"), icon: BookOpen },
  ];

  return (
    <AppLayout>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="glass rounded-2xl p-6">
          <h1 className="text-2xl md:text-3xl font-bold">{t("dashboard_welcome")}, {user?.user_metadata?.full_name ?? user?.email?.split("@")[0]} 👋</h1>
          <p className="mt-1 text-muted-foreground">{t("dashboard_sub")}</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label={t("stat_chats")} value={stats.chats} />
          <StatCard label={t("stat_docs")} value={stats.docs} />
          <StatCard label={t("stat_saved")} value={0} />
        </div>

        <h2 className="mt-10 mb-3 text-lg font-semibold">{t("quick_actions")}</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {quick.map((q) => {
            const Icon = q.icon;
            return (
              <Link key={q.to} to={q.to} className="glass rounded-2xl p-5 hover:shadow-soft transition">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-hero text-white"><Icon className="h-5 w-5" /></div>
                <div className="mt-3 font-medium">{q.label}</div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold mb-3">{t("recent_chats")}</h3>
            {chats.length === 0 ? <p className="text-sm text-muted-foreground">No conversations yet.</p> :
              <ul className="space-y-2 text-sm">
                {chats.map((c) => (
                  <li key={c.id}><Link to="/assistant" className="hover:text-primary">{c.title}</Link></li>
                ))}
              </ul>}
          </div>
          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold mb-3">{t("recent_docs")}</h3>
            {docs.length === 0 ? <p className="text-sm text-muted-foreground">No documents yet.</p> :
              <ul className="space-y-2 text-sm">
                {docs.map((d) => (
                  <li key={d.id}><Link to="/documents" className="hover:text-primary">{d.filename}</Link></li>
                ))}
              </ul>}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}