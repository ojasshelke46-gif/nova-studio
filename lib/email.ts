import { Resend } from "resend";

const FROM = "Nova Studio <onboarding@resend.dev>";

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendAdminNotification(contact: ContactPayload) {
  const resend = getClient();
  if (!resend || !process.env.ADMIN_EMAIL) return;

  await resend.emails.send({
    from: FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `New inquiry from ${contact.name}`,
    text: `Name: ${contact.name}\nEmail: ${contact.email}\n\nMessage:\n${contact.message}`,
  });
}

export async function sendClientConfirmation(contact: ContactPayload) {
  const resend = getClient();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to: contact.email,
    subject: "We got your message — Nova Studio",
    text: `Hi ${contact.name}, thanks for reaching out. We've received your inquiry and will get back to you within 24 hours. — Nova Studio`,
  });
}
