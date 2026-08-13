import WaveMark from "@/components/WaveMark";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <a
          href="#top"
          className="footer__brand"
          aria-label="Rumble Harbor home"
        >
          <WaveMark size={22} />
          <span className="footer__name">Rumble Harbor</span>
        </a>
        <nav className="footer__links" aria-label="Footer">
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#work">Work</a>
          <a href="#contact">Contact</a>
        </nav>
        <p className="footer__copy">© {year} Rumble Harbor</p>
      </div>
    </footer>
  );
}
