import {
  IconWorld,
  IconMobile,
  IconScan,
  FrequencyField,
} from "@/components/Icons";
import SignalMarker from "@/components/SignalMarker";

function IconServer({ size = 18 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
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
    index: "01",
    title: "Web & Cloud",
    body: "Full-stack apps and platforms, integrated with the major cloud providers and built to scale.",
    Icon: IconWorld,
  },
  {
    key: "mobile",
    index: "02",
    title: "Mobile & Game",
    body: "Native iOS and Android apps from a single shared codebase. Multi-platform game development, from prototype to launch.",
    Icon: IconMobile,
  },
  {
    key: "ai",
    index: "03",
    title: "AI & Vision",
    body: "Neural networks and image recognition at the core, with LLM features and automation ready when you need them.",
    Icon: IconScan,
  },
  {
    key: "ops",
    index: "04",
    title: "Managed Ops",
    body: "Cloud ops, handled. We deploy, secure, scale, and maintain your apps so you can keep building.",
    Icon: IconServer,
  },
];

export default function Services() {
  return (
    <section className="services section" id="services">
      <FrequencyField className="services__field" />
      <div className="container services__inner">
        <SignalMarker label="Capabilities" className="marker--section" />

        <div className="svc-grid">
          {services.map(({ key, index, title, body, Icon }) => (
            <article key={key} className="svc-card">
              <span className="svc-card__icon">
                <Icon />
              </span>
              <div className="svc-card__text">
                <div className="svc-card__head">
                  <h3 className="svc-card__title">{title}</h3>
                  <span className="svc-card__index">{index}</span>
                </div>
                <p className="svc-card__body">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
