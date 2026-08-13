import { WaveLine } from "@/components/Icons";

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container hero__inner">
        <span className="eyebrow eyebrow--boxed">EST 2026</span>

        <h1 className="hero__title">
          MOMENTUM
          <br />
          <span className="grad">ENGINEERED</span>
        </h1>

        <div className="hero__wave">
          <WaveLine />
        </div>

        <p className="hero__lead">
          Shipping software that&apos;s built to scale, easy to maintain, and
          fast — across web and mobile.
        </p>

        <div className="hero__cta">
          <a href="#contact" className="btn btn--primary">
            BOOK A CALL
          </a>
          <a href="#work" className="btn btn--ghost">
            SEE OUR WORK
          </a>
        </div>
      </div>
    </section>
  );
}
