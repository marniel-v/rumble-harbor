import Transmission from "@/components/Transmission";
import PulseText from "@/components/PulseText";
import SignalMarker from "@/components/SignalMarker";

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container hero__inner">
        <SignalMarker label="DEV HOUSE" status="EST 2026" icon={false} />

        <div className="hero__field">
          <Transmission />
        </div>

        <p className="hero__lead">From signal to system.</p>

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
