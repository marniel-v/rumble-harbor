"use client";

import { useState } from "react";
import SignalMarker from "@/components/SignalMarker";
import { SpectrumField } from "@/components/Icons";

const initial = { name: "", email: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    if (!form.name.trim())
      return "Add your name so we know who we're talking to.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "That email doesn't look right, try again.";
    if (form.message.trim().length < 10)
      return "Tell us a little more about what you're building.";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setStatus("error");
      setError(problem);
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("sent");
      setForm(initial);
    } catch {
      setStatus("error");
      setError("Something went wrong sending that. Try again in a moment.");
    }
  };

  return (
    <section className="contact section" id="contact">
      <SpectrumField className="contact__pattern" />
      <div className="container contact__inner">
        <div className="contact__intro">
          <SignalMarker label="GET IN TOUCH" />
          <h2 className="contact__title">Set it in motion</h2>
          <p className="contact__lead">
            Tell us what you have in mind and we&apos;ll get back to you within
            a day or two.
          </p>
          <a className="contact__email" href="mailto:hello@rumbleharbor.com">
            hello@rumbleharbor.com
          </a>
        </div>

        <form className="contact__form" onSubmit={onSubmit} noValidate>
          <label className="field">
            <span className="field__label">Name</span>
            <input
              className="field__input"
              type="text"
              value={form.name}
              onChange={update("name")}
              placeholder="Your name"
              autoComplete="name"
            />
          </label>

          <label className="field">
            <span className="field__label">Email</span>
            <input
              className="field__input"
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span className="field__label">Project</span>
            <textarea
              className="field__input field__input--area"
              rows={4}
              value={form.message}
              onChange={update("message")}
              placeholder="A few lines about what you're building…"
            />
          </label>

          {status === "error" && (
            <p className="form-note form-note--error" role="alert">
              {error}
            </p>
          )}
          {status === "sent" && (
            <p className="form-note form-note--ok" role="status">
              Thanks, your message is in. We&apos;ll be in touch shortly.
            </p>
          )}

          <button
            className="btn btn--primary btn--block"
            type="submit"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Transmitting…" : "Send message"}
          </button>
        </form>
      </div>
    </section>
  );
}
