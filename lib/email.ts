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

function formatSlotTime(date: Date): string {
  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export async function sendPrepEmail(
  contact: { name: string; email: string },
  emailBody: string
) {
  const resend = getClient();
  if (!resend) throw new Error("Resend not configured");

  await resend.emails.send({
    from: FROM,
    to: contact.email,
    subject: "A few questions before our meeting — Nova Studio",
    text: emailBody,
  });
}

export async function sendBookingConfirmation(
  contact: { name: string; email: string },
  slotTime: Date
) {
  const resend = getClient();
  if (!resend) return;

  const formatted = formatSlotTime(slotTime);

  await resend.emails.send({
    from: FROM,
    to: contact.email,
    subject: "Meeting confirmed — Nova Studio",
    text: `Hi ${contact.name},\n\nYour meeting with Nova Studio is confirmed for ${formatted}.\n\nWe'll send a few questions beforehand to make the most of our time together.\n\nSee you then,\nNova Studio`,
  });
}
