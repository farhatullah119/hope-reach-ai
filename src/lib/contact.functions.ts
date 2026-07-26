import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

export const contactSchema = z.object({
  full_name: z.string().trim().min(1, "Please enter your full name").max(100),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().min(1, "Please enter a subject").max(150),
  message: z.string().trim().min(1, "Please enter a message").max(2000),
});

export type ContactInput = z.infer<typeof contactSchema>;

function clientIp(): string | null {
  try {
    const req = getRequest();
    const h = req.headers;
    const raw =
      h.get("cf-connecting-ip") ??
      h.get("x-real-ip") ??
      h.get("x-forwarded-for");
    if (!raw) return null;
    const first = raw.split(",")[0]?.trim();
    return first && first.length <= 64 ? first : null;
  } catch {
    return null;
  }
}

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("contact_messages")
      .insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone ? data.phone : null,
        subject: data.subject,
        message: data.message,
        user_ip: clientIp(),
        status: "new",
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("[contact] insert failed", error.message);
      throw new Error("We could not save your message. Please try again.");
    }

    let emailed = false;
    try {
      emailed = await notifyOwner({ ...data, id: row.id, created_at: row.created_at, ip: clientIp() });
      if (emailed) {
        await supabaseAdmin
          .from("contact_messages")
          .update({ status: "emailed", emailed_at: new Date().toISOString() })
          .eq("id", row.id);
      }
    } catch (e) {
      console.error("[contact] notification failed", e instanceof Error ? e.message : e);
    }

    return { ok: true as const, id: row.id, emailed };
  });

/**
 * Sends the "New Contact Form Submission - ISF Health Hub AI" notification.
 * Requires an email sender domain to be configured for the project; until then
 * submissions are still stored in the database with status "new".
 */
async function notifyOwner(payload: {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  created_at: string;
  ip: string | null;
}): Promise<boolean> {
  const { sendContactNotification } = await import("./contact-notify.server");
  return sendContactNotification(payload);
}