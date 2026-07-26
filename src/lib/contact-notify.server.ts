/**
 * Owner notification for contact form submissions.
 *
 * Delivery runs through the project's managed email sender. Until a verified
 * sender domain exists for this project, this returns false and the submission
 * simply stays in the database with status "new" (nothing is lost).
 */

export const CONTACT_RECIPIENT = "farhatullahtajak@gmail.com";
export const CONTACT_EMAIL_SUBJECT = "New Contact Form Submission - ISF Health Hub AI";

export type ContactNotification = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  created_at: string;
  ip: string | null;
};

export function renderContactNotificationText(p: ContactNotification): string {
  return [
    `Name: ${p.full_name}`,
    `Email: ${p.email}`,
    p.phone ? `Phone: ${p.phone}` : null,
    `Subject: ${p.subject}`,
    "",
    "Message:",
    p.message,
    "",
    `Date and time: ${new Date(p.created_at).toUTCString()}`,
    `User IP: ${p.ip ?? "unavailable"}`,
    `Reference: ${p.id}`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export async function sendContactNotification(p: ContactNotification): Promise<boolean> {
  const senderDomain = process.env.SENDER_DOMAIN;
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!senderDomain || !apiKey) {
    console.warn("[contact] email sender not configured yet — submission stored only");
    return false;
  }

  const res = await fetch("https://api.lovable.dev/v1/emails/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Idempotency-Key": `contact-${p.id}`,
    },
    body: JSON.stringify({
      sender_domain: senderDomain,
      from: `ISF Health Hub AI <noreply@${senderDomain}>`,
      to: CONTACT_RECIPIENT,
      reply_to: p.email,
      subject: CONTACT_EMAIL_SUBJECT,
      text: renderContactNotificationText(p),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Email send failed [${res.status}]: ${body}`);
  }
  return true;
}