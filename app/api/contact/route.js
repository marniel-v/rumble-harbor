import { NextResponse } from "next/server";

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

  // ── Wire up real delivery here ───────────────────────────────────────────
  // This stub just logs the submission. To actually send mail, plug in a
  // provider such as Resend, Postmark, SendGrid, or Nodemailer, e.g.:
  //
  //   import { Resend } from "resend";
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   await resend.emails.send({
  //     from: "site@rumbleharbor.com",
  //     to: "hello@rumbleharbor.com",
  //     subject: `New enquiry from ${name}`,
  //     replyTo: email,
  //     text: message,
  //   });
  // ─────────────────────────────────────────────────────────────────────────
  console.log("New contact submission:", { name, email, message });

  return NextResponse.json({ ok: true });
}
