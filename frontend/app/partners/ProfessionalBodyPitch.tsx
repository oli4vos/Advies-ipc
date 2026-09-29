import Link from "next/link";
import "./partner-pitch.css";

type BodyKey = "nob" | "rb";

type BodyConfig = {
  key: BodyKey;
  name: string;
  shortName: string;
  proposition: string;
  context: string;
  associationValue: Array<{ title: string; text: string }>;
  memberValue: Array<{ title: string; text: string }>;
  verification: Array<{ title: string; text: string }>;
  safeguards: string[];
  pilot: string[];
  sources: Array<{ label: string; note: string; href: string }>;
};

const bodies: Record<BodyKey, BodyConfig> = {
  nob: {
    key: "nob",
    name: "Nederlandse Orde van Belastingadviseurs",
    shortName: "NOB",
    proposition:
      "Maak actueel NOB-lidmaatschap een gecontroleerde toegangseis voor specialistisch platformwerk.",
    context:
      "De NOB borgt professionele erkenning met toelatingseisen, beroepsregels, permanente educatie, jaarlijkse toetsing en tuchtrecht. Fiscale Lijn wil die kwaliteitsinfrastructuur niet kopiëren of suggereren, maar onder regie van de NOB correct verifiëren en zichtbaar maken.",
    associationValue: [
      {
        title: "Kwaliteit zichtbaar op het beslismoment",
        text: "De status van een NOB-lid wordt gecontroleerd voordat een ondernemer een specialist kiest — niet alleen achteraf in een profieltekst.",
      },
      {
        title: "Nieuwe praktijkdata voor beroepsontwikkeling",
        text: "Geaggregeerde, niet tot klanten herleidbare signalen tonen welke specialismen, ontbrekende feiten en AI-risico’s in de praktijk terugkeren.",
      },
      {
        title: "Een beheerst antwoord op platformisering",
        text: "De NOB kan vooraf regels stellen voor onafhankelijkheid, geheimhouding, AI-gebruik, presentatie en escalatie, in plaats van achteraf op marktpraktijken te reageren.",
      },
    ],
    memberValue: [
      {
        title: "Meer werk binnen de eigen diepgang",
        text: "Leden ontvangen afgebakende casussen die passen bij hun gekozen specialisme, ervaring en beschikbare tijd.",
      },
      {
        title: "Minder onbetaalde intake",
        text: "Feiten, documenten, ontbrekende informatie, scope en indicatieve vergoeding zijn vóór acceptatie gestructureerd.",
      },
      {
        title: "Professionele autonomie blijft leidend",
        text: "Het lid kan weigeren, aanvullende informatie vragen en iedere AI-conclusie corrigeren. Er is geen pay-to-rank of druk om een bepaald oordeel te geven.",
      },
    ],
    verification: [
      {
        title: "Toestemming van het lid",
        text: "De fiscalist vraagt verificatie aan en stemt expliciet in met controle van uitsluitend de noodzakelijke lidmaatschapsstatus.",
      },
      {
        title: "Status uit een NOB-beheerde bron",
        text: "Voorkeur: beperkte registerkoppeling of verificatieservice. Een beveiligde handmatige controle is een passende pilotroute wanneer nog geen interface bestaat.",
      },
      {
        title: "Minimale terugmelding",
        text: "Alleen actief, type lidmaatschap, verificatiedatum en eventueel toegestane praktijkstatus — geen opleidingsdossier, PE-detail of disciplinaire informatie.",
      },
      {
        title: "Intrekking werkt direct door",
        text: "Een verlopen, geschorste of ingetrokken status blokkeert nieuwe opdrachten en verwijdert de NOB-vermelding volgens een gezamenlijk protocol.",
      },
    ],
    safeguards: [
      "Geen NOB-logo, woordmerk of suggestie van goedkeuring zonder afzonderlijke schriftelijke toestemming.",
      "Transparante platformvergoeding; geen betaling aan de NOB voor doorverwijzingen en geen commerciële beïnvloeding van het inhoudelijke oordeel.",
      "Menselijke eindcontrole, aantoonbare bronbeoordeling en expliciete onzekerheden bij ieder advies.",
      "Vertrouwelijke klantdata niet gebruiken voor modeltraining zonder aparte grondslag, doelbinding en toestemming.",
      "NOB krijgt een vast meldpunt, auditinformatie en een snelle route voor misbruik van de ledenstatus.",
    ],
    pilot: [
      "Gezamenlijk de toegestane ledenvermelding, doelgroep en uitsluitingsgronden vaststellen.",
      "Een kleine besloten pilot met vrijwillige leden uit twee afgebakende specialismen.",
      "Vooraf meetpunten afspreken: kwaliteit, onafhankelijkheid, klantbegrip, doorlooptijd en waarde voor leden.",
      "Na evaluatie pas besluiten over merkgebruik, structurele verificatie en eventuele bredere uitrol.",
    ],
    sources: [
      {
        label: "NOB-lidmaatschap",
        note: "Professionele erkenning, ethische normen, PE en jaarlijkse toetsing.",
        href: "https://www.nob.net/lidmaatschap/",
      },
      {
        label: "Statuten en reglementen",
        note: "Actuele Code of Conduct, PE-reglement, tuchtrecht en onafhankelijkheidsstatuut.",
        href: "https://www.nob.net/over-de-nob/statuten-en-reglementen-nob/",
      },
      {
        label: "NOB over AI en samenwerking",
        note: "Onafhankelijkheid, deskundigheid, zorgvuldigheid, human-in-the-loop en geheimhouding.",
        href: "https://www.nob.net/actueel/vijf-vragen-aan-erik-berk-over-de-aanpassing-van-de-code-of-conduct-en-de-handreiking-van-het-kantoorhandboek/",
      },
      {
        label: "NOB over ledentoezicht",
        note: "Verplichte e-learning, self-assessment en toezicht op beroepsregels.",
        href: "https://www.nob.net/actueel/nob-2024/",
      },
    ],
  },
  rb: {
    key: "rb",
    name: "Register Belastingadviseurs",
    shortName: "RB",
    proposition:
      "Laat het RB-keurmerk ook in digitale matching aantoonbaar het verschil maken voor het mkb.",
    context:
      "Het RB positioneert de RB-titel als kwaliteitsbewijs voor de mkb-adviespraktijk, biedt leden het logo als keurmerk en maakt leden optioneel vindbaar op interessegebied en specialisme. Fiscale Lijn kan daarop voortbouwen met geverifieerde toegang tot afgebakend specialistisch werk — onder regie van het RB.",
    associationValue: [
      {
        title: "Van vindbaarheid naar passende opdrachten",
        text: "De bestaande specialisme-indeling wordt niet alleen een zoekfilter, maar een gecontroleerde route van concrete mkb-vraag naar passend RB-lid.",
      },
      {
        title: "Meer aantoonbare ledenwaarde",
        text: "Leden krijgen een aanvullend kanaal voor betaald specialistisch werk, zonder zelf brede marketing of lange acquisitie te organiseren.",
      },
      {
        title: "Praktische proeftuin voor AI-beleid",
        text: "De Commissie AI & Digitalisering kan meekijken met veilige toepassing, menselijke controle en concrete leersignalen uit de mkb-praktijk.",
      },
    ],
    memberValue: [
      {
        title: "Een specialisme wordt economisch haalbaar",
        text: "Verspreide vragen worden landelijk gebundeld, zodat leden vaker casussen binnen hetzelfde vakgebied kunnen behandelen.",
      },
      {
        title: "Het platform doet het voorbereidende werk",
        text: "Intake, privacycontrole, structurering, ontbrekende feiten, matching en betaling worden vóór de inhoudelijke beoordeling georganiseerd.",
      },
      {
        title: "Geen race naar de laagste prijs",
        text: "Kwalificatie, inhoudelijke match, scope en kwaliteit wegen zwaarder dan prijs. Adviseurs zien geen openbare biedingen van concurrenten.",
      },
    ],
    verification: [
      {
        title: "Opt-in vanuit het RB-lid",
        text: "De fiscalist kiest voor deelname en machtigt Fiscale Lijn om actieve RB- of RBc-status en toegestane profielvelden te controleren.",
      },
      {
        title: "Aansluiten op RB-brondata",
        text: "Een beperkte verificatieservice kan voortbouwen op Mijn RB en Vind een RB, zonder het volledige ledenbestand te kopiëren.",
      },
      {
        title: "Specialismen door het lid bevestigd",
        text: "RB-status is de harde toegangseis; specialismen worden gekoppeld aan de RB-taxonomie en onderbouwd met ervaring en voorkeuren.",
      },
      {
        title: "Periodieke en gebeurtenisgestuurde controle",
        text: "De status wordt opnieuw gecontroleerd en bij wijziging direct verwerkt. Fiscale Lijn bewaart alleen bewijs van de verificatie.",
      },
    ],
    safeguards: [
      "Het gebruiksrecht van een individueel RB-lid wordt niet verondersteld overdraagbaar te zijn aan het platform; platformgebruik van titel of logo vereist aparte afspraken.",
      "Geen zelfverklaarde RB-status en geen statische upload van een certificaat als blijvend bewijs.",
      "Geen openbare prijsveiling, pay-to-rank of verkoop van klantleads buiten de afgesproken opdrachtflow.",
      "Menselijke eindverantwoordelijkheid, broncontrole en een zichtbare scheiding tussen AI-concept en advies van het RB-lid.",
      "Geaggregeerde inzichten voor het RB zijn niet herleidbaar tot klant, lid of kantoor zonder afzonderlijke grondslag.",
    ],
    pilot: [
      "Samen met Ledenzaken en de Commissie AI & Digitalisering de verificatie- en presentatievoorwaarden bepalen.",
      "Starten met vrijwillige leden voor omzetbelasting en loonheffingen, aansluitend op bestaande RB-specialismefilters.",
      "Meten of opdrachten beter passen, intake afneemt en leden meer specialistisch werk ontvangen.",
      "Het RB behoudt een stoprecht bij merk-, kwaliteits- of privacyrisico’s; opschaling volgt alleen na gezamenlijke evaluatie.",
    ],
    sources: [
      {
        label: "RB-lidmaatschap",
        note: "RB-titel, logo als keurmerk, ledenvoordelen, mkb-focus en Vind een RB.",
        href: "https://rb.nl/lid-worden/rb-lidmaatschap/",
      },
      {
        label: "Vind een RB",
        note: "Opt-in zoekmodule met interessegebieden en specialismefilters.",
        href: "https://rb.nl/vind-een-rb/",
      },
      {
        label: "Commissie AI & Digitalisering",
        note: "Informeren, adviseren en signaleren rond AI-toepassingen voor leden en bestuur.",
        href: "https://rb.nl/nieuws/benoemingen-leden-commissie-ai-digitalisering/",
      },
      {
        label: "Strategisch plan 2023–2027",
        note: "De RB-titel als keurmerk, ledenkansen, kwaliteit en toekomstbestendigheid.",
        href: "https://rb.nl/wp-content/uploads/Bijlage-8-Strategisch-plan-RB-2023-2027.pdf",
      },
    ],
  },
};

function ValueList({ items }: { items: Array<{ title: string; text: string }> }) {
  return (
    <div className="body-value-list">
      {items.map((item, index) => (
        <article key={item.title}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function ProfessionalBodyPitch({ body }: { body: BodyKey }) {
  const config = bodies[body];
  const otherBody = body === "nob" ? "rb" : "nob";

  return (
    <main id="main-content" className={`body-pitch body-pitch-${body}`}>
      <div className="body-concept-bar">
        <strong>Conceptvoorstel</strong>
        <span>Er bestaat nog geen samenwerking, toestemming of registerkoppeling.</span>
      </div>

      <header className="body-nav">
        <Link className="body-brand" href="/">
          <span>F</span>
          <b>fiscale lijn</b>
        </Link>
        <nav aria-label="Voorstelnavigatie">
          <a href="#waarde">Meerwaarde</a>
          <a href="#verificatie">Verificatie</a>
          <a href="#waarborgen">Waarborgen</a>
          <a href="#pilot">Pilot</a>
        </nav>
        <Link className="body-switch" href={`/partners/${otherBody}/`}>
          Voorstel voor {otherBody.toUpperCase()}
        </Link>
      </header>

      <section className="body-hero">
        <div>
          <p className="body-kicker">VOORSTEL AAN {config.name.toUpperCase()}</p>
          <h1>{config.proposition}</h1>
          <p className="body-lead">{config.context}</p>
        </div>
        <aside>
          <span>DE VRAAG AAN {config.shortName}</span>
          <strong>Ontwerp met ons een gecontroleerde ledenverificatie.</strong>
          <p>
            Met goedgekeurde formulering en uitsluitend na afzonderlijke
            toestemming: zichtbare {config.shortName}-status bij een
            geverifieerde fiscalist.
          </p>
          <dl>
            <div><dt>Toegang</dt><dd>Actieve status als harde eis</dd></div>
            <div><dt>Data</dt><dd>Minimaal en doelgebonden</dd></div>
            <div><dt>Regie</dt><dd>Voorwaarden bij {config.shortName}</dd></div>
          </dl>
        </aside>
      </section>

      <section className="body-thesis">
        <span>DE GEDEELDE KANS</span>
        <blockquote>
          Ondernemers zoeken snel de juiste diepgang. Fiscalisten hebben genoeg
          passend werk nodig om specialist te worden en te blijven. Een
          beroepsvereniging borgt kwaliteit; Fiscale Lijn organiseert de route
          van vraag naar geverifieerde specialist.
        </blockquote>
      </section>

      <section className="body-value" id="waarde">
        <div className="body-section-intro">
          <p>WAARDE VOOR DE VERENIGING</p>
          <h2>Geen logo als marketinglaag, maar kwaliteit als toegangspoort.</h2>
        </div>
        <ValueList items={config.associationValue} />
      </section>

      <section className="body-member-value">
        <div className="body-section-intro">
          <p>WAARDE VOOR LEDEN</p>
          <h2>Meer specialistisch werk. Minder ruis rondom het vak.</h2>
        </div>
        <ValueList items={config.memberValue} />
      </section>

      <section className="body-verification" id="verificatie">
        <div className="body-section-intro light">
          <p>VOORGESTELDE VERIFICATIE</p>
          <h2>De vereniging blijft de bron; het platform bewaart alleen bewijs.</h2>
        </div>
        <ol>
          {config.verification.map((step, index) => (
            <li key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{step.title}</strong><p>{step.text}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="body-safeguards" id="waarborgen">
        <div className="body-section-intro">
          <p>NIET ONDERHANDELBAAR</p>
          <h2>Merkbescherming, onafhankelijkheid en privacy worden productregels.</h2>
        </div>
        <ul>
          {config.safeguards.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="body-pilot" id="pilot">
        <div>
          <p className="body-kicker">VOORGESTELDE EERSTE STAP</p>
          <h2>Een omkeerbare pilot vóór ieder publiek keurmerkgebruik.</h2>
          <p>
            Geen brede lancering en geen technische koppeling zonder governance.
            Eerst samen bewijzen dat de route leden helpt en de kwaliteitsnorm
            versterkt.
          </p>
        </div>
        <ol>
          {config.pilot.map((item, index) => (
            <li key={item}><b>{index + 1}</b><span>{item}</span></li>
          ))}
        </ol>
      </section>

      <section className="body-sources">
        <div className="body-section-intro">
          <p>ONDERBOUWING</p>
          <h2>Gebouwd op publiek beleid van {config.shortName}, niet op aannames over toestemming.</h2>
        </div>
        <div>
          {config.sources.map((source) => (
            <a href={source.href} target="_blank" rel="noreferrer" key={source.href}>
              <span>OFFICIËLE BRON</span>
              <strong>{source.label}</strong>
              <small>{source.note}</small>
            </a>
          ))}
        </div>
        <p className="body-source-note">
          Bronnen geraadpleegd in september 2026. Publieke informatie bevestigt
          geen API-toegang of platformlicentie; beide maken deel uit van dit voorstel.
        </p>
      </section>

      <footer className="body-footer">
        <span>Fiscale Lijn · vertrouwelijk conceptvoorstel</span>
        <Link href="/investeerders/">Bekijk de bredere investeerderscase</Link>
      </footer>
    </main>
  );
}
