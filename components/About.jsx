import PulseMark from "@/components/PulseMark";
import PulseText from "@/components/PulseText";
import SignalMarker from "@/components/SignalMarker";
import { Resonance } from "@/components/Icons";

const pillars = [
  {
    label: "ARCHITECTURE",
    text: "Structure before abstraction. The shape of the system comes first.",
  },
  {
    label: "CONTROL",
    text: "Force, contained. Predictable behaviour under real load.",
  },
  {
    label: "STABILITY",
    text: "Built to hold when traffic, data, and deadlines arrive at once.",
  },
];

export default function About() {
  return (
    <section className="section about" id="about">
      <div className="container">
        <PulseText>
          <div className="about__grid">
            <div>
              <SignalMarker label="ABOUT" />
              <h2 className="about__title">
                Complex Problems
                <br />
                Calmly Engineered<span className="stop">.</span>
              </h2>
              <Resonance className="about__resonance" />
            </div>

            <div className="about__body">
              <p>
                Founded by full-stack engineers with 14+ years of experience
                behind them. We work across the whole stack focusing on web and
                cloud platforms, native iOS and Android apps, multi-platform
                games, and machine-learning tools built on neural networks and
                image recognition.
              </p>
              <p>
                That experience spans analytics-driven SaaS for B2B and C2B,
                logistics platforms for budget estimation and reporting, and ERP
                systems for manufacturing and shipping. Different domains, one
                way of working — architecture before abstraction, every time.
              </p>

              <div className="about__pillars">
                {pillars.map((p) => (
                  <div className="about__pillar" key={p.label}>
                    <span className="about__pillar-label">
                      <PulseMark size={8} />
                      {p.label}
                    </span>
                    <span className="about__pillar-text">{p.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PulseText>
      </div>
    </section>
  );
}
