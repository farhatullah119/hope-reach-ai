import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, Phone } from "lucide-react";

const schema = z.object({
  full_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional(),
  subject: z.string().trim().min(1).max(150),
  message: z.string().trim().min(1).max(2000),
});

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
  const { user } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Please check the form"); return; }
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert({
      ...parsed.data, user_id: user?.id ?? null,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("sent"));
    setForm({ full_name: "", email: "", phone: "", subject: "", message: "" });
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
          <Button type="submit" disabled={loading} className="w-full">{loading ? t("sending") : t("submit")}</Button>
        </form>
      </section>
    </AppLayout>
  );
}