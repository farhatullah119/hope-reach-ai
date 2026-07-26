import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PublicArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  language: string;
  image_url: string | null;
  created_at: string;
};

export type PublicHospital = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  maps_url: string | null;
  emergency_24_7: boolean;
  opening_hours: string | null;
  services: string[] | null;
};

export const listPublishedArticles = createServerFn({ method: "GET" }).handler(async () => {
  const { publicSupabase } = await import("@/lib/supabase-public.server");
  const { data } = await publicSupabase()
    .from("health_articles")
    .select("id, title, slug, excerpt, category, language, image_url, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(60);
  return (data ?? []) as Omit<PublicArticle, "content">[];
});

export const getPublishedArticle = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().trim().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { publicSupabase } = await import("@/lib/supabase-public.server");
    const { data: row } = await publicSupabase()
      .from("health_articles")
      .select("id, title, slug, excerpt, content, category, language, image_url, created_at")
      .eq("published", true)
      .eq("slug", data.slug)
      .maybeSingle();
    return (row ?? null) as PublicArticle | null;
  });

export const listPublicHospitals = createServerFn({ method: "GET" }).handler(async () => {
  const { publicSupabase } = await import("@/lib/supabase-public.server");
  const { data } = await publicSupabase()
    .from("hospitals")
    .select(
      "id, name, description, address, city, country, phone, website, maps_url, emergency_24_7, opening_hours, services",
    )
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .limit(200);
  return (data ?? []) as PublicHospital[];
});