import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/lib/auth";

type Search = { mode?: "signin" | "signup" };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: s.mode === "signup" ? "signup" : "signin",
  }),
  head: () => ({ meta: [
    { title: "Sign in — ISF Hub AI" },
    { name: "description", content: "Create your free ISF Hub AI account to use the AI assistant, document analyzer and translator." },
    { property: "og:title", content: "Sign in to ISF Hub AI" },
    { property: "og:description", content: "Free account for refugees and vulnerable communities." },
  ]}),
  component: Auth,
});

const emailSchema = z.string().trim().email().max(255);
const passSchema = z.string().min(6).max(72);

function Auth() {
  const { t } = useI18n();
  const { mode } = useSearch({ from: "/auth" });
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailSchema.safeParse(email).success) return toast.error("Invalid email");
    if (!passSchema.safeParse(password).success) return toast.error("Password must be 6-72 characters");
    setLoading(true);
    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name || email.split("@")[0] } },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Account created!");
      navigate({ to: "/dashboard" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      navigate({ to: "/dashboard" });
    }
  }

  async function google() {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error(res.error.message ?? "Google sign-in failed");
  }

  return (
    <AppLayout>
      <section className="mx-auto max-w-md px-4 py-12">
        <div className="glass rounded-2xl p-6 shadow-soft">
          <h1 className="text-2xl font-bold">{isSignup ? t("auth_signup_title") : t("auth_signin_title")}</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="n">{t("auth_name")}</Label>
                <Input id="n" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="e">{t("auth_email")}</Label>
              <Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p">{t("auth_password")}</Label>
              <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "…" : isSignup ? t("nav_signup") : t("nav_signin")}
            </Button>
          </form>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px bg-border flex-1" /> {t("auth_or")} <div className="h-px bg-border flex-1" />
          </div>
          <Button variant="outline" className="w-full" onClick={google}>{t("auth_google")}</Button>
          <button
            onClick={() => navigate({ to: "/auth", search: { mode: isSignup ? "signin" : "signup" } })}
            className="mt-6 w-full text-sm text-primary hover:underline"
          >
            {isSignup ? t("auth_switch_to_signin") : t("auth_switch_to_signup")}
          </button>
        </div>
      </section>
    </AppLayout>
  );
}