import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText, Languages, BookOpen, GraduationCap, Siren, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ISF Hub AI — Empowering Refugees & Vulnerable Communities" },
      { name: "description", content: "Free AI assistant, document analyzer, translator, and vetted resource directory for refugees, students, and vulnerable communities. English, Urdu, Pashto." },
      { property: "og:title", content: "ISF Hub AI — Empowering Refugees" },
      { property: "og:description", content: "One place for refugees & vulnerable communities to get AI help with education, health, legal, jobs and emergencies." },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useI18n();
  const features = [
    { icon: MessageSquare, k: "f1" as const, to: "/assistant" },
    { icon: FileText, k: "f2" as const, to: "/documents" },
    { icon: Languages, k: "f3" as const, to: "/translator" },
    { icon: BookOpen, k: "f4" as const, to: "/resources" },
    { icon: GraduationCap, k: "f5" as const, to: "/resources" },
    { icon: Siren, k: "f6" as const, to: "/resources" },
  ];
  return (
    <AppLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Powered by AI · Free
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              {t("hero_title")}
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">{t("hero_sub")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/assistant"><Button size="lg" className="gap-2">{t("hero_cta")} <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/resources"><Button size="lg" variant="outline">{t("hero_cta2")}</Button></Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">{t("audiences")}</p>
          </div>
          <div className="relative">
            <div className="glass rounded-3xl p-6 shadow-glow">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero text-white"><MessageSquare className="h-4 w-4" /></span>
                <div className="text-sm font-medium">{t("assistant_title")}</div>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl bg-muted p-3 text-sm">How do I apply for a DAFI scholarship as an Afghan refugee in Pakistan?</div>
                <div className="rounded-2xl bg-primary/10 border border-primary/20 p-3 text-sm">
                  <strong>ISF Hub AI:</strong> You'll need a valid POR card, proof of high school completion, and an admission offer from a Pakistani university. The DAFI program is run by UNHCR — start by contacting the UNHCR office in Islamabad or your nearest field office…
                </div>
                <div className="rounded-2xl bg-muted p-3 text-sm">شکریہ! کیا یہ فارم آن لائن دستیاب ہے؟</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center">{t("features_title")}</h2>
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Link key={f.k} to={f.to} className="group glass rounded-2xl p-6 hover:shadow-soft transition">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-hero text-white shadow-soft group-hover:scale-105 transition">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{t(`${f.k}_t` as never)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(`${f.k}_d` as never)}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-gradient-hero text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">{t("audience_title")}</h2>
          <p className="mt-4 text-white/90 max-w-3xl mx-auto">{t("audiences")}</p>
          <div className="mt-8">
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="lg" variant="secondary">{t("nav_signup")}</Button>
            </Link>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
