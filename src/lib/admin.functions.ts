import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  articleSchema,
  hospitalSchema,
  idSchema,
  listQuerySchema,
  messageReadSchema,
  messageReplySchema,
  uploadSchema,
  userIdSchema,
  userRoleSchema,
  userStatusSchema,
  userUpdateSchema,
} from "@/lib/admin-schemas";

export type AdminUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  preferred_language: string;
  role: "admin" | "user";
  suspended: boolean;
  created_at: string;
  last_sign_in_at: string | null;
};

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: data === true };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireAdmin, lastNDays, dayKey } = await import("@/lib/admin.server");
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const countOf = async (table: string) => {
      const { count } = await supabaseAdmin.from(table as never).select("id", { count: "exact", head: true });
      return count ?? 0;
    };

    const since = new Date(Date.now() - 13 * 86400000).toISOString();

    const [
      usersRes,
      chats,
      chatMessages,
      messages,
      articles,
      hospitals,
      reminders,
      records,
      documents,
      chatSeries,
      msgSeries,
      recentMessages,
      recentLogs,
    ] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      countOf("chat_conversations"),
      countOf("chat_messages"),
      countOf("contact_messages"),
      countOf("health_articles"),
      countOf("hospitals"),
      countOf("medicine_reminders"),
      countOf("medical_records"),
      countOf("documents"),
      supabaseAdmin.from("chat_conversations").select("created_at").gte("created_at", since),
      supabaseAdmin.from("contact_messages").select("created_at").gte("created_at", since),
      supabaseAdmin
        .from("contact_messages")
        .select("id, full_name, subject, created_at, status")
        .order("created_at", { ascending: false })
        .limit(6),
      supabaseAdmin
        .from("admin_audit_log")
        .select("id, admin_email, action, entity, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const users = usersRes.data?.users ?? [];
    const days = lastNDays(14);
    const bucket = (rows: { created_at: string }[] | null) => {
      const m = new Map<string, number>();
      for (const r of rows ?? []) m.set(dayKey(r.created_at), (m.get(dayKey(r.created_at)) ?? 0) + 1);
      return m;
    };
    const chatMap = bucket(chatSeries.data as { created_at: string }[] | null);
    const msgMap = bucket(msgSeries.data as { created_at: string }[] | null);
    const signupMap = new Map<string, number>();
    for (const u of users) {
      const k = (u.created_at ?? "").slice(0, 10);
      if (k) signupMap.set(k, (signupMap.get(k) ?? 0) + 1);
    }

    return {
      totals: {
        users: users.length,
        admins: 0,
        chats,
        chatMessages,
        messages,
        articles,
        hospitals,
        reminders,
        records,
        documents,
      },
      series: days.map((d) => ({
        day: d.slice(5),
        chats: chatMap.get(d) ?? 0,
        messages: msgMap.get(d) ?? 0,
        signups: signupMap.get(d) ?? 0,
      })),
      recentMessages: (recentMessages.data ?? []) as {
        id: string;
        full_name: string;
        subject: string;
        created_at: string;
        status: string;
      }[],
      recentLogs: (recentLogs.data ?? []) as {
        id: string;
        admin_email: string | null;
        action: string;
        entity: string;
        created_at: string;
      }[],
    };
  });

export const listAdminUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listQuerySchema.parse(d ?? {}))
  .handler(async ({ context, data }) => {
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [authRes, profiles, roles] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from("profiles").select("id, full_name, preferred_language, status"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);

    const profileMap = new Map(
      (profiles.data ?? []).map((p) => [p.id, p as { id: string; full_name: string | null; preferred_language: string; status: string }]),
    );
    const adminIds = new Set((roles.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));

    let rows: AdminUser[] = (authRes.data?.users ?? []).map((u) => {
      const p = profileMap.get(u.id);
      const banned = (u as unknown as { banned_until?: string | null }).banned_until;
      return {
        id: u.id,
        email: u.email ?? null,
        full_name: p?.full_name ?? (u.user_metadata?.full_name as string | undefined) ?? null,
        preferred_language: p?.preferred_language ?? "en",
        role: adminIds.has(u.id) ? "admin" : "user",
        suspended: Boolean(banned && new Date(banned) > new Date()) || p?.status === "suspended",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
      };
    });

    const q = data.search.toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) => (r.email ?? "").toLowerCase().includes(q) || (r.full_name ?? "").toLowerCase().includes(q),
      );
    }
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    const total = rows.length;
    const start = (data.page - 1) * data.pageSize;
    return { rows: rows.slice(start, start + data.pageSize), total };
  });

export const updateAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => userUpdateSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { requireAdmin, logAdminAction } = await import("@/lib/admin.server");
    const admin = await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").upsert({
      id: data.userId,
      full_name: data.full_name ?? null,
      preferred_language: data.preferred_language ?? "en",
    });
    if (error) throw new Error(error.message);
    await logAdminAction(admin, "update", "user", data.userId, { full_name: data.full_name });
    return { ok: true as const };
  });

export const setAdminUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => userStatusSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { requireAdmin, logAdminAction } = await import("@/lib/admin.server");
    const admin = await requireAdmin(context);
    if (data.userId === context.userId) throw new Error("You cannot suspend your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.suspend ? "876000h" : "none",
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: data.userId, status: data.suspend ? "suspended" : "active" });
    await logAdminAction(admin, data.suspend ? "suspend" : "activate", "user", data.userId);
    return { ok: true as const };
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => userIdSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { requireAdmin, logAdminAction } = await import("@/lib/admin.server");
    const admin = await requireAdmin(context);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await logAdminAction(admin, "delete", "user", data.userId);
    return { ok: true as const };
  });

export const resetAdminUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => userIdSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { requireAdmin, logAdminAction } = await import("@/lib/admin.server");
    const admin = await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error: uErr } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (uErr || !u.user?.email) throw new Error("User email not found");
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(u.user.email);
    if (error) throw new Error(error.message);
    await logAdminAction(admin, "password_reset", "user", data.userId, { email: u.user.email });
    return { ok: true as const, email: u.user.email };
  });

export const setAdminUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => userRoleSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { requireAdmin, logAdminAction } = await import("@/lib/admin.server");
    const admin = await requireAdmin(context);
    if (data.userId === context.userId && data.role === "user")
      throw new Error("You cannot remove your own administrator role");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.role === "admin") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    await logAdminAction(admin, "set_role", "user", data.userId, { role: data.role });
    return { ok: true as const };
  });

/* ---------------------------- ARTICLES ---------------------------- */

export const listAdminArticles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listQuerySchema.parse(d ?? {}))
  .handler(async ({ context, data }) => {
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("health_articles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    if (data.search) q = q.or(`title.ilike.%${data.search}%,category.ilike.%${data.search}%`);
    const from = (data.page - 1) * data.pageSize;
    const { data: rows, count, error } = await q.range(from, from + data.pageSize - 1);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const saveArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => articleSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { requireAdmin, logAdminAction, slugify } = await import("@/lib/admin.server");
    const admin = await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      title: data.title,
      slug: data.slug ? slugify(data.slug) : slugify(data.title),
      excerpt: data.excerpt || null,
      content: data.content || "",
      category: data.category,
      language: data.language,
      image_url: data.image_url || null,
      published: data.published,
      author_id: context.userId,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("health_articles").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      await logAdminAction(admin, "update", "article", data.id, { title: data.title });
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("health_articles")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logAdminAction(admin, "create", "article", row.id, { title: data.title });
    return { ok: true as const, id: row.id };
  });

export const setArticlePublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.extend({ published: articleSchema.shape.published }).parse(d))
  .handler(async ({ context, data }) => {
    const { requireAdmin, logAdminAction } = await import("@/lib/admin.server");
    const admin = await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("health_articles")
      .update({ published: data.published })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAdminAction(admin, data.published ? "publish" : "unpublish", "article", data.id);
    return { ok: true as const };
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { requireAdmin, logAdminAction } = await import("@/lib/admin.server");
    const admin = await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("health_articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAdminAction(admin, "delete", "article", data.id);
    return { ok: true as const };
  });

/* ---------------------------- HOSPITALS ---------------------------- */

export const listAdminHospitals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listQuerySchema.parse(d ?? {}))
  .handler(async ({ context, data }) => {
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("hospitals")
      .select("*", { count: "exact" })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (data.search) q = q.or(`name.ilike.%${data.search}%,city.ilike.%${data.search}%`);
    const from = (data.page - 1) * data.pageSize;
    const { data: rows, count, error } = await q.range(from, from + data.pageSize - 1);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const saveHospital = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => hospitalSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { requireAdmin, logAdminAction } = await import("@/lib/admin.server");
    const admin = await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      name: data.name,
      description: data.description || null,
      address: data.address || null,
      city: data.city || null,
      country: data.country || "Pakistan",
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      maps_url: data.maps_url || null,
      emergency_24_7: data.emergency_24_7,
      opening_hours: data.opening_hours || null,
      services: data.services
        ? data.services.split(",").map((s) => s.trim()).filter(Boolean)
        : null,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("hospitals").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      await logAdminAction(admin, "update", "hospital", data.id, { name: data.name });
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await supabaseAdmin.from("hospitals").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    await logAdminAction(admin, "create", "hospital", row.id, { name: data.name });
    return { ok: true as const, id: row.id };
  });

export const deleteHospital = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { requireAdmin, logAdminAction } = await import("@/lib/admin.server");
    const admin = await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("hospitals").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAdminAction(admin, "delete", "hospital", data.id);
    return { ok: true as const };
  });

/* ---------------------------- MESSAGES ---------------------------- */

export const listAdminMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listQuerySchema.parse(d ?? {}))
  .handler(async ({ context, data }) => {
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("contact_messages")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    if (data.search)
      q = q.or(
        `full_name.ilike.%${data.search}%,email.ilike.%${data.search}%,subject.ilike.%${data.search}%`,
      );
    const from = (data.page - 1) * data.pageSize;
    const { data: rows, count, error } = await q.range(from, from + data.pageSize - 1);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const setMessageRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => messageReadSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { requireAdmin, logAdminAction } = await import("@/lib/admin.server");
    const admin = await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("contact_messages")
      .update({ read_at: data.read ? new Date().toISOString() : null, status: data.read ? "read" : "new" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAdminAction(admin, data.read ? "mark_read" : "mark_unread", "contact_message", data.id);
    return { ok: true as const };
  });

export const replyToMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => messageReplySchema.parse(d))
  .handler(async ({ context, data }) => {
    const { requireAdmin, logAdminAction } = await import("@/lib/admin.server");
    const admin = await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("contact_messages")
      .update({
        admin_reply: data.reply,
        replied_at: new Date().toISOString(),
        status: "replied",
        read_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAdminAction(admin, "reply", "contact_message", data.id);
    return { ok: true as const };
  });

export const deleteMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { requireAdmin, logAdminAction } = await import("@/lib/admin.server");
    const admin = await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAdminAction(admin, "delete", "contact_message", data.id);
    return { ok: true as const };
  });

export const exportMessagesCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireAdmin, logAdminAction } = await import("@/lib/admin.server");
    const admin = await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("contact_messages")
      .select("created_at, full_name, email, phone, subject, message, status, user_ip, admin_reply, replied_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    const headers = [
      "created_at",
      "full_name",
      "email",
      "phone",
      "subject",
      "message",
      "status",
      "user_ip",
      "admin_reply",
      "replied_at",
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      headers.join(","),
      ...(rows ?? []).map((r) => headers.map((h) => esc((r as Record<string, unknown>)[h])).join(",")),
    ].join("\n");
    await logAdminAction(admin, "export", "contact_message", null, { count: rows?.length ?? 0 });
    return { csv, count: rows?.length ?? 0 };
  });

/* ---------------------------- AUDIT LOG + MEDIA ---------------------------- */

export const listAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listQuerySchema.parse(d ?? {}))
  .handler(async ({ context, data }) => {
    const { requireAdmin } = await import("@/lib/admin.server");
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("admin_audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    if (data.search) q = q.or(`action.ilike.%${data.search}%,entity.ilike.%${data.search}%`);
    const from = (data.page - 1) * data.pageSize;
    const { data: rows, count, error } = await q.range(from, from + data.pageSize - 1);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const uploadAdminMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => uploadSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { requireAdmin, logAdminAction, slugify } = await import("@/lib/admin.server");
    const admin = await requireAdmin(context);
    if (!data.contentType.startsWith("image/")) throw new Error("Only image uploads are allowed");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext = data.filename.includes(".") ? data.filename.split(".").pop()!.slice(0, 6) : "png";
    const path = `articles/${Date.now()}-${slugify(data.filename.replace(/\.[^.]+$/, ""))}.${ext}`;
    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    const { error } = await supabaseAdmin.storage
      .from("media")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    await logAdminAction(admin, "upload", "media", path);
    return { ok: true as const, url: `/api/public/media/${path}` };
  });