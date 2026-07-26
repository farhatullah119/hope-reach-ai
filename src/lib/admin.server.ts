/**
 * Server-only admin helpers. Never import this from client code.
 */
export type AdminCtx = { userId: string; email: string | null };

type SupabaseLike = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
};

export async function requireAdmin(ctx: {
  supabase: SupabaseLike;
  userId: string;
  claims?: Record<string, unknown> | null;
}): Promise<AdminCtx> {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || data !== true) throw new Error("Forbidden: administrator access required");
  const email = (ctx.claims?.email as string | undefined) ?? null;
  return { userId: ctx.userId, email };
}

export async function logAdminAction(
  admin: AdminCtx,
  action: string,
  entity: string,
  entityId?: string | null,
  details?: Record<string, unknown>,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("admin_audit_log").insert({
    admin_id: admin.userId,
    admin_email: admin.email,
    action,
    entity,
    entity_id: entityId ?? null,
    details: (details ?? null) as never,
  });
}

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return base || `article-${Date.now()}`;
}

export function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function lastNDays(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}