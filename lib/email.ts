import nodemailer from "nodemailer";

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

const FROM = () => `"Nova Studio" <${process.env.GMAIL_USER}>`;

export async function sendAdminNotification(contact: ContactPayload) {
  const transporter = getTransporter();
  if (!transporter || !process.env.ADMIN_EMAIL) return;
  try {
    await transporter.sendMail({
      from: FROM(),
      to: process.env.ADMIN_EMAIL,
      subject: `New inquiry from ${contact.name}`,
      text: `Name: ${contact.name}\nEmail: ${contact.email}\n\nMessage:\n${contact.message}`,
      html: `<p><strong>Name:</strong> ${contact.name}</p><p><strong>Email:</strong> ${contact.email}</p><p><strong>Message:</strong><br>${contact.message.replace(/\n/g, "<br>")}</p>`,
    });
  } catch (err) {
    console.error("sendAdminNotification failed:", err);
  }
}

export async function sendClientConfirmation(contact: ContactPayload) {
  const transporter = getTransporter();
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: FROM(),
      to: contact.email,
      subject: "We got your message — Nova Studio",
      text: `Hi ${contact.name}, thanks for reaching out. We've received your inquiry and will get back to you within 24 hours. — Nova Studio`,
      html: `<p>Hi ${contact.name},</p><p>Thanks for reaching out. We've received your inquiry and will get back to you within 24 hours.</p><p>— Nova Studio</p>`,
    });
  } catch (err) {
    console.error("sendClientConfirmation failed:", err);
  }
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
  const transporter = getTransporter();
  if (!transporter) throw new Error("Email not configured");
  await transporter.sendMail({
    from: FROM(),
    to: contact.email,
    subject: "A few questions before our meeting — Nova Studio",
    text: emailBody,
    html: emailBody.replace(/\n/g, "<br>"),
  });
}

export async function sendBookingConfirmation(
  contact: { name: string; email: string },
  slotTime: Date
) {
  const transporter = getTransporter();
  if (!transporter) return;
  const formatted = formatSlotTime(slotTime);
  try {
    await transporter.sendMail({
      from: FROM(),
      to: contact.email,
      subject: "Meeting confirmed — Nova Studio",
      text: `Hi ${contact.name},\n\nYour meeting with Nova Studio is confirmed for ${formatted}.\n\nWe'll send a few questions beforehand to make the most of our time together.\n\nSee you then,\nNova Studio`,
      html: `<p>Hi ${contact.name},</p><p>Your meeting with Nova Studio is confirmed for <strong>${formatted}</strong>.</p><p>We'll send a few questions beforehand to make the most of our time together.</p><p>See you then,<br>Nova Studio</p>`,
    });
  } catch (err) {
    console.error("sendBookingConfirmation failed:", err);
  }
}
