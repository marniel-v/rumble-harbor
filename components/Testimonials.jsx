import PulseMark from "@/components/PulseMark";
import SignalMarker from "@/components/SignalMarker";

const quotes = [
  {
    key: "manufacturing",
    text: "I had the privilege of working with Marniel a few years ago. He consistently went the extra mile, putting in the time and effort to finish work on schedule. Marniel is passionate about all things software, and he isn't afraid to speak up and challenge ideas in order to achieve the best result.",
    name: "Alwyn Lubbe",
    photo: "/testimonials/alwyn-lubbe.jpeg",
    role: "Engineer",
    sector: "Mecalc",
  },
  {
    key: "logistics",
    text: "Marniel is a technically fluent software engineer who is goal oriented: give him the objective, not the steps, and he gets there. He is grounded in the traditions of best practice while pushing the boundaries of what is possible with current technology.",
    name: "Chris Ryan",
    photo: "/testimonials/chris-ryan.jpeg",
    linkedin:
      "https://ae.linkedin.com/in/chris-ryan-14557619https://ae.linkedin.com/in/chris-ryan-14557619",
    role: "VP",
    sector: "DSV - Global Products",
  },
  {
    key: "analytics",
    text: `Marniel is a highly skilled engineer, a strong people person, and someone who genuinely understands business
requirements. He has an excellent ability to translate those needs into reliable, secure, and well-engineered
software.`,
    name: "Dave Blakey",
    photo: "/testimonials/dave-blakey.jpeg",
    linkedin: "https://za.linkedin.com/in/daveblakey",
    role: "CTO",
    sector: "October Health",
  },
];

const initials = (name) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

function Avatar({ name, photo }) {
  if (photo)
    return (
      <img
        className="quote-card__avatar"
        src={photo}
        alt={name}
        width={40}
        height={40}
        loading="lazy"
      />
    );
  if (name)
    return (
      <span className="quote-card__avatar quote-card__monogram" aria-hidden>
        {initials(name)}
      </span>
    );
  return <PulseMark size={8} />;
}

export default function Testimonials() {
  return (
    <section className="section" id="testimonials">
      <div className="container">
        <SignalMarker label="TESTIMONIALS" className="marker--section" />
        <div className="quote-grid">
          {quotes.map(({ key, text, name, photo, linkedin, role, sector }) => {
            const ident = (
              <>
                <Avatar name={name} photo={photo} />
                <span className="quote-card__ident">
                  {name && <span className="quote-card__name">{name}</span>}
                  <span className="quote-card__meta">
                    <span className="quote-card__role">{role}</span>
                    <span className="quote-card__rule">/</span>
                    <span className="quote-card__sector">{sector}</span>
                  </span>
                </span>
              </>
            );

            return (
              <article className="quote-card" key={key}>
                <p className="quote-card__text">{text}</p>
                <footer className="quote-card__by">
                  {linkedin ? (
                    <a
                      className="quote-card__profile"
                      href={linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${name} on LinkedIn`}
                    >
                      {ident}
                    </a>
                  ) : (
                    ident
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
