import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  let data;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { name, email, message } = data || {};
  const emailOk =
    typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name || !emailOk || !message || message.trim().length < 10) {
    return NextResponse.json(
      { error: "Missing or invalid fields." },
      { status: 422 },
    );
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  try {
    await transport.sendMail({
      from: process.env.CONTACT_FROM,
      to: process.env.CONTACT_TO || "hello@rumbleharbor.com",
      replyTo: `${name} <${email}>`,
      subject: `New enquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });
  } catch (err) {
    console.error("Contact mail failed:", err);
    return NextResponse.json(
      { error: "Could not send message." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
