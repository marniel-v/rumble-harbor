import PulseMark from "@/components/PulseMark";
import SignalMarker from "@/components/SignalMarker";

/* Placeholder copy — swap in real quotes and attribution before launch.
 *
 * `name`, `photo` and `linkedin` are all optional and all need the person's
 * permission, so the placeholders carry none of them:
 *
 *   name:     "Jordan Vega"
 *   photo:    "/testimonials/jordan-vega.jpg"  — a real file in public/
 *   linkedin: "https://www.linkedin.com/in/jordan-vega/"
 *
 * Photos are served from public/, not hotlinked from media.licdn.com: those
 * URLs are signed and expire, and reusing them off-platform is against
 * LinkedIn's terms. Ask for the headshot along with the quote.
 */
const quotes = [
  {
    key: "logistics",
    text: "We came in with a half-finished estimation platform and a hard deadline. It shipped on time, and the architecture has held through every load spike since.",
    role: "Head of Engineering",
    sector: "Logistics SaaS",
  },
  {
    key: "analytics",
    text: "One person, no handoffs, no translation layer. The thing we described in the first call is the thing that went to production.",
    role: "Founder",
    sector: "B2B Analytics",
  },
  {
    key: "manufacturing",
    text: "The vision models were the easy part. Getting them into an ERP that runs a factory floor was the work, and it was handled end to end.",
    role: "Operations Director",
    sector: "Manufacturing",
  },
];

const initials = (name) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

/* Photo if there is one, initials if there's only a name, and nothing at all
   until the real attribution lands — an unconditional <img> would just render
   a broken frame against the placeholders. */
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
            /* The profile link wraps the whole identity block, so the photo and
               the name are one target rather than two. */
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
