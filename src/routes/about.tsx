import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/lib/i18n";
import { Heart, Target, Sparkles } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About — ISF Hub AI" },
    { name: "description", content: "About ISF Hub AI: our mission to empower refugees & vulnerable communities with free AI-powered guidance." },
    { property: "og:title", content: "About ISF Hub AI" },
    { property: "og:description", content: "Mission, problem, solution — meet the humanitarian AI platform for refugees." },
  ]}),
  component: About,
});

function About() {
  const { t } = useI18n();
  return (
    <AppLayout>
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-2"><Heart className="h-4 w-4" /> ISF Hub AI</div>
        <h1 className="text-4xl md:text-5xl font-bold">{t("about_title")}</h1>
        <p className="mt-6 text-lg text-muted-foreground">{t("about_p1")}</p>
        <p className="mt-4 text-lg text-muted-foreground">{t("about_p2")}</p>

        <div className="mt-12 grid md:grid-cols-2 gap-5">
          <div className="glass rounded-2xl p-6">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-hero text-white mb-3"><Target className="h-5 w-5" /></div>
            <h2 className="font-semibold text-xl">{t("problem")}</h2>
            <p className="mt-2 text-muted-foreground">{t("problem_d")}</p>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-hero text-white mb-3"><Sparkles className="h-5 w-5" /></div>
            <h2 className="font-semibold text-xl">{t("solution")}</h2>
            <p className="mt-2 text-muted-foreground">{t("solution_d")}</p>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}