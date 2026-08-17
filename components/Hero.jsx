import { PulseField } from "@/components/Icons";
import PulseText from "@/components/PulseText";
import SignalMarker from "@/components/SignalMarker";

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container hero__inner">
        <PulseText className="hero__pulse">
          <SignalMarker label="DEV HOUSE" status="EST 2026" icon={false} />
          <h1 className="hero__title">
            Systems That Hold
            <br />
            Under Pressure<span className="stop">.</span>
          </h1>

          <div className="hero__field">
            <PulseField />
          </div>

          <p className="hero__lead">
            We don&apos;t just ship features. We build the architecture
            underneath them — across web, mobile, and cloud.
          </p>
        </PulseText>

        <div className="hero__cta">
          <a href="#contact" className="btn btn--primary">
            Book a call
          </a>
          <a href="#work" className="btn btn--ghost">
            See the work
          </a>
        </div>
      </div>
    </section>
  );
}
