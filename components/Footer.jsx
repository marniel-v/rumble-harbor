import PulseMark from "@/components/PulseMark";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__lockup">
          <a
            href="#top"
            className="footer__brand"
            aria-label="Rumble Harbor home"
          >
            <span className="footer__name">
              Ru
              <PulseMark inline gap={32} />
              ble Harbor
            </span>
          </a>
        </div>
        <nav className="footer__links" aria-label="Footer">
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#work">Work</a>
          <a href="/capabilities/analytics">Capabilities</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#contact">Contact</a>
        </nav>
        <p className="footer__copy">© {year} Rumble Harbor</p>
      </div>
    </footer>
  );
}
