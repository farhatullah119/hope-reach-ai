import { Link, useRouter } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Heart, Menu, Moon, Sun, Globe, X, LogOut, LayoutDashboard, MessageSquare, FileText, Languages } from "lucide-react";
import { useI18n, LANGUAGES, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: ReactNode }) {
  const { t, lang, setLang, dir } = useI18n();
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const publicLinks: { to: string; label: string }[] = [
    { to: "/", label: t("nav_home") },
    { to: "/about", label: t("nav_about") },
    { to: "/assistant", label: t("nav_assistant") },
    { to: "/resources", label: t("nav_resources") },
    { to: "/faq", label: t("nav_faq") },
    { to: "/contact", label: t("nav_contact") },
  ];
  const appLinks = user
    ? [
        { to: "/dashboard", label: t("nav_dashboard"), icon: LayoutDashboard },
        { to: "/assistant", label: t("nav_assistant"), icon: MessageSquare },
        { to: "/documents", label: t("nav_documents"), icon: FileText },
        { to: "/translator", label: t("nav_translator"), icon: Languages },
      ]
    : [];

  return (
    <div dir={dir} className="min-h-dvh flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 glass border-b">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero text-white shadow-soft">
              <Heart className="h-5 w-5" />
            </span>
            <span className="hidden sm:inline">{t("brand")}</span>
          </Link>
          <nav className="ml-4 hidden md:flex items-center gap-1">
            {publicLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
                activeProps={{ className: "px-3 py-2 rounded-lg text-sm font-medium text-primary bg-accent" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <select
                aria-label={t("lang_label")}
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className="appearance-none bg-transparent border rounded-lg pl-8 pr-3 py-2 text-sm cursor-pointer hover:bg-muted transition"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
              <Globe className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <button
              onClick={toggle}
              aria-label={t("theme_toggle")}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border hover:bg-muted transition"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {user ? (
              <>
                <Link to="/dashboard" className="hidden sm:inline-flex">
                  <Button variant="default" size="sm">{t("nav_dashboard")}</Button>
                </Link>
                <button
                  onClick={async () => { await signOut(); router.navigate({ to: "/" }); }}
                  aria-label={t("nav_signout")}
                  className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" search={{ mode: "signin" }} className="hidden sm:inline-flex">
                  <Button variant="ghost" size="sm">{t("nav_signin")}</Button>
                </Link>
                <Link to="/auth" search={{ mode: "signup" }} className="hidden sm:inline-flex">
                  <Button size="sm">{t("nav_signup")}</Button>
                </Link>
              </>
            )}
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
              className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg border hover:bg-muted"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t bg-background">
            <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
              {[...publicLinks, ...appLinks].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted"
                >
                  {l.label}
                </Link>
              ))}
              {user ? (
                <button
                  onClick={async () => { setOpen(false); await signOut(); router.navigate({ to: "/" }); }}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted"
                >
                  {t("nav_signout")}
                </button>
              ) : (
                <>
                  <Link to="/auth" search={{ mode: "signin" }} onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-sm hover:bg-muted">{t("nav_signin")}</Link>
                  <Link to="/auth" search={{ mode: "signup" }} onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-sm hover:bg-muted">{t("nav_signup")}</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className={cn("flex-1")}>{children}</main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 grid gap-6 md:grid-cols-3 text-sm">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-hero text-white">
                <Heart className="h-4 w-4" />
              </span>
              {t("brand")}
            </div>
            <p className="mt-2 text-muted-foreground">{t("tagline")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("footer_note")}</p>
          </div>
          <div>
            <div className="font-medium mb-2">{t("nav_resources")}</div>
            <ul className="space-y-1 text-muted-foreground">
              <li><Link to="/resources" className="hover:text-foreground">{t("nav_resources")}</Link></li>
              <li><Link to="/faq" className="hover:text-foreground">{t("nav_faq")}</Link></li>
              <li><Link to="/about" className="hover:text-foreground">{t("nav_about")}</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">{t("nav_contact")}</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-2">Emergency</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>Rescue 1122 (Pakistan)</li>
              <li>Edhi Ambulance: 115</li>
              <li>UNHCR PK: +92-51-2829-502</li>
            </ul>
          </div>
        </div>
        <div className="border-t py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {t("brand")} · {t("disclaimer")}
        </div>
      </footer>
    </div>
  );
}