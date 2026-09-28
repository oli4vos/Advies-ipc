export default function NotFound() {
  return (
    <main id="main-content" className="page narrow not-found-page">
      <span className="not-found-code">404</span>
      <p className="eyebrow">PAGINA NIET GEVONDEN</p>
      <h1>Deze route bestaat niet.</h1>
      <p>
        Ga terug naar het begin. Uw eventuele conceptvraag blijft in deze
        browser bewaard.
      </p>
      <a className="button primary" href="./">
        Terug naar Fiscale Lijn
      </a>
    </main>
  );
}
