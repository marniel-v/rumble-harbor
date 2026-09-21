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
            <div className="about__head">
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
                Rumble Harbor is an independent software engineering studio
                focused on building and solving complex software systems. With
                14+ years of experience, it brings deep engineering capability
                across platforms, applications, data, cloud infrastructure, and
                AI.
              </p>
              <p>
                The studio is built around direct ownership. One senior engineer
                takes a project from the initial problem through architecture,
                development, and production. That means fewer layers, faster
                decisions, and no loss of context. The result is software built
                to solve the real problem and keep working as the business
                evolves.
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
