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
                Calmly Engineered
              </h2>
              <Resonance className="about__resonance" />
            </div>

            <div className="about__body">
              <p>
                With Rumble Harbor, there's no team to hand your project down to
                and no layers to lose your problem in. Just one engineer with
                14+ years of experience, working end to end across web and cloud
                platforms, native iOS and Android apps, multi-platform games,
                and machine-learning tools spanning neural networks and computer
                vision.
              </p>
              <p>
                That experience runs from analytics SaaS for B2B and consumer
                markets, through logistics platforms for estimation and
                reporting, to ERP for manufacturing and shipping. Different
                domains, one discipline: architecture before abstraction, every
                time.
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
