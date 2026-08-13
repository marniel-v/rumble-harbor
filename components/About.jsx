export default function About() {
  return (
    <section className="section" id="about">
      <div className="container">
        <div className="about__grid">
          <div>
            <p className="eyebrow">ABOUT US</p>
            <h2 className="about__title">
              NEW STUDIO,
              <br />
              <span className="grad">DEEP ROOTS</span>
            </h2>
          </div>

          <div className="about__body">
            <p>
              Rumble Harbor is a new studio, founded by full-stack engineers
              with 14+ years of experience behind them. We work across the whole
              stack focusing on web and cloud platforms, native iOS and Android
              apps, multi-platform games, and machine-learning tools built on
              neural networks and image recognition.
            </p>
            <p>
              That experience spans analytics-driven SaaS for B2B and C2B,
              logistics platforms for budget estimation and reporting, and ERP
              systems for manufacturing and shipping. Different domains, one way
              of working.
            </p>

            <div className="about__pillars">
              <div className="about__pillar">
                <span className="about__pillar-label">SCALABLE</span>
                <span className="about__pillar-text">
                  Built to grow with your users and your data.
                </span>
              </div>
              <div className="about__pillar">
                <span className="about__pillar-label">MAINTAINABLE</span>
                <span className="about__pillar-text">
                  Clean codebases your team can live in.
                </span>
              </div>
              <div className="about__pillar">
                <span className="about__pillar-label">FAST</span>
                <span className="about__pillar-text">
                  Performance treated as a feature, not an afterthought.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
