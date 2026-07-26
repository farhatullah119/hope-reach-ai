import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitContactMessage, contactSchema } from "@/lib/contact.functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Phone, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact — ISF Hub AI" },
    { name: "description", content: "Contact the ISF Hub AI team. We read every message and reply as soon as we can." },
    { property: "og:title", content: "Contact ISF Hub AI" },
    { property: "og:description", content: "Get in touch with our humanitarian AI team." },
  ]}),
  component: Contact,
});

function Contact() {
  const { t } = useI18n();
  const send = useServerFn(submitContactMessage);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Please check the form";
      setStatus({ kind: "error", text: msg });
      toast.error(msg);
      return;
    }
    setStatus(null);
    setLoading(true);
    try {
      await send({ data: parsed.data });
      setStatus({ kind: "success", text: t("sent") });
      toast.success(t("sent"));
      setForm({ full_name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
      setStatus({ kind: "error", text: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <section className="mx-auto max-w-5xl px-4 py-12 grid md:grid-cols-5 gap-8">
        <div className="md:col-span-2">
          <h1 className="text-3xl md:text-4xl font-bold">{t("contact_title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("contact_sub")}</p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> farhatullahtajak@gmail.com</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> Rescue 1122 · Edhi 115</div>
          </div>
        </div>
        <form onSubmit={submit} className="md:col-span-3 glass rounded-2xl p-6 space-y-4">
          {status && (
            <div
              role="status"
              aria-live="polite"
              className={
                status.kind === "success"
                  ? "flex items-start gap-2 rounded-xl border border-secondary/40 bg-secondary/10 p-3 text-sm text-foreground"
                  : "flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground"
              }
            >
              {status.kind === "success" ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-secondary" />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5 text-destructive" />
              )}
              <span>{status.text}</span>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="n">{t("field_name")}</Label>
              <Input id="n" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e">{t("field_email")}</Label>
              <Input id="e" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={255} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p">{t("field_phone")}</Label>
              <Input id="p" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={30} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s">{t("field_subject")}</Label>
              <Input id="s" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required maxLength={150} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m">{t("field_message")}</Label>
            <Textarea id="m" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required maxLength={2000} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("sending")}
              </>
            ) : (
              t("submit")
            )}
          </Button>
        </form>
      </section>
    </AppLayout>
  );
}