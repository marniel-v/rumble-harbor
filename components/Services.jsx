import { IconWorld, IconMobile, IconScan } from "@/components/Icons";

function IconServer({ size = 18 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4.5" width="16" height="6" rx="1.6" />
      <rect x="4" y="13.5" width="16" height="6" rx="1.6" />
      <circle cx="7.5" cy="7.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="7.5" cy="16.5" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

const services = [
  {
    key: "web",
    title: "WEB & CLOUD",
    body: "Full-stack apps and platforms, integrated with the major cloud providers and built to scale.",
    accent: "var(--cyan)",
    tint: "rgba(52,225,225,0.16)",
    color: "#7ef0f0",
    Icon: IconWorld,
  },
  {
    key: "mobile",
    title: "MOBILE & GAME",
    body: "Native iOS and Android apps from a single shared codebase. Multi-platform game development, from prototype to launch.",
    accent: "#36a6e6",
    tint: "rgba(54,166,230,0.16)",
    color: "#8fcdf2",
    Icon: IconMobile,
  },
  {
    key: "ai",
    title: "AI & VISION",
    body: "Neural networks and image recognition at the core, with LLM features and automation ready when you need them.",
    accent: "#3f9be0",
    tint: "rgba(47,104,236,0.16)",
    color: "#7ea4f5",
    Icon: IconScan,
  },
  {
    key: "ops",
    title: "MANAGED OPS",
    body: "Cloud ops, handled. We deploy, secure, scale, and maintain your apps so you can keep building.",
    accent: "var(--blue)",
    tint: "rgba(63,155,224,0.16)",
    color: "#9fcdf2",
    Icon: IconServer,
  },
];

export default function Services() {
  return (
    <section className="services section" id="services">
      <div className="container services__inner">
        <p className="eyebrow services__eyebrow">WHAT WE DO</p>

        <div className="svc-grid">
          {services.map(({ key, title, body, accent, tint, color, Icon }) => (
            <article
              key={key}
              className="svc-card"
              style={{ borderTopColor: accent }}
            >
              <span
                className="svc-card__icon"
                style={{ background: tint, color }}
              >
                <Icon />
              </span>
              <div className="svc-card__text">
                <h3 className="svc-card__title">{title}</h3>
                <p className="svc-card__body">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
