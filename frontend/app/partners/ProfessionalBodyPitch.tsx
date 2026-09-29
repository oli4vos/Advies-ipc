import Link from "next/link";
import "./partner-pitch.css";

type BodyKey = "nob" | "rb";

type BodyConfig = {
  key: BodyKey;
  name: string;
  shortName: string;
  proposition: string;
  context: string;
  ask: string;
  evidence: Array<{ label: string; value: string; text: string }>;
  associationValue: Array<{ title: string; text: string }>;
  memberValue: Array<{ title: string; text: string }>;
  verification: Array<{ title: string; text: string }>;
  safeguards: string[];
  pilot: string[];
  economics?: {
    title: string;
    figures: Array<{ label: string; value: string }>;
    note: string;
  };
  sources: Array<{ label: string; note: string; href: string }>;
};

const bodies: Record<BodyKey, BodyConfig> = {
  nob: {
    key: "nob",
    name: "Nederlandse Orde van Belastingadviseurs",
    shortName: "NOB",
    proposition:
      "Maak professionele kwaliteit zichtbaar wanneer een ondernemer een specialist kiest.",
    context:
      "AI versnelt fiscaal werk, maar professioneel oordeel blijft mensenwerk. Fiscale Lijn wil samen met de NOB toetsen hoe onafhankelijkheid, deskundigheid, vertrouwelijkheid en menselijke eindverantwoordelijkheid aantoonbaar blijven in een digitale adviesketen.",
    ask:
      "Ontwerp met ons een besloten proef waarin NOB-status gecontroleerd wordt en beroepsregels zichtbaar doorwerken in iedere opdracht.",
    evidence: [
      {
        label: "AANLEIDING",
        value: "AI is praktijk",
        text: "De NOB concludeerde in september 2026 dat AI een vaste plek heeft in de fiscale praktijk en dat leden behoefte hebben aan concrete handvatten en casuïstiek.",
      },
      {
        label: "KADER",
        value: "Onafhankelijkheid eerst",
        text: "Nieuwe samenwerkingsvormen worden onder de algemene onafhankelijkheidsnorm beoordeeld. Dat opent een gesprek, maar is geen goedkeuring van dit platform.",
      },
      {
        label: "VOORSTEL",
        value: "Klein en omkeerbaar",
        text: "Een proef met vrijwillige zelfstandigen en kleine kantoren, zonder logo of publieke keurmerkclaim en met een gezamenlijk stoprecht.",
      },
    ],
    associationValue: [
      {
        title: "Kwaliteit zichtbaar op het beslismoment",
        text: "De status van een NOB-lid wordt gecontroleerd voordat een ondernemer een specialist kiest — niet alleen achteraf in een profieltekst.",
      },
      {
        title: "Nieuwe inzichten voor beroepsontwikkeling",
        text: "Samengevoegde signalen die niet tot klanten te herleiden zijn, tonen welke specialismen, ontbrekende feiten en AI-risico’s in de praktijk terugkeren.",
      },
      {
        title: "Praktijkkennis over verantwoorde AI",
        text: "De proef laat concreet zien waar AI-concepten worden gecorrigeerd en welke waarborgen leden nodig hebben, zonder klantdossiers automatisch als trainingsdata te gebruiken.",
      },
    ],
    memberValue: [
      {
        title: "Meer werk binnen de eigen diepgang",
        text: "Leden ontvangen afgebakende casussen die passen bij hun gekozen specialisme, ervaring en beschikbare tijd.",
      },
      {
        title: "Minder onbetaalde voorbereiding",
        text: "Feiten, documenten, ontbrekende informatie, afbakening en indicatieve vergoeding zijn vóór aanvaarding gestructureerd.",
      },
      {
        title: "Professionele autonomie blijft leidend",
        text: "Het lid kan weigeren, aanvullende informatie vragen en iedere AI-conclusie corrigeren. Betalen voor een hogere plaats is niet mogelijk en er is geen druk om een bepaald oordeel te geven.",
      },
    ],
    verification: [
      {
        title: "Toestemming van het lid",
        text: "De fiscalist vraagt de controle aan en stemt expliciet in met controle van uitsluitend de noodzakelijke lidmaatschapsstatus.",
      },
      {
        title: "Status uit een NOB-beheerde bron",
        text: "Voorkeur: een beperkte technische koppeling met het register. Een beveiligde handmatige controle is geschikt voor de eerste proef als zo'n koppeling nog niet bestaat.",
      },
      {
        title: "Minimale terugmelding",
        text: "Alleen actief, type lidmaatschap, datum van controle en eventueel toegestane praktijkstatus — geen opleidingsdossier, details over permanente educatie of disciplinaire informatie.",
      },
      {
        title: "Intrekking werkt direct door",
        text: "Een verlopen, geschorste of ingetrokken status blokkeert nieuwe opdrachten en verwijdert de NOB-vermelding volgens gezamenlijke afspraken.",
      },
    ],
    safeguards: [
      "Geen NOB-logo, woordmerk of suggestie van goedkeuring zonder afzonderlijke schriftelijke toestemming.",
      "Transparante platformvergoeding; geen betaling aan de NOB voor doorverwijzingen en geen commerciële beïnvloeding van het inhoudelijke oordeel.",
      "Menselijke eindcontrole, aantoonbare bronbeoordeling en expliciete onzekerheden bij ieder advies.",
      "Vertrouwelijke klantgegevens niet gebruiken voor het trainen van AI-modellen zonder aparte wettelijke grondslag, een duidelijk doel en toestemming.",
      "De NOB krijgt een vast meldpunt, informatie voor controles en een snelle route voor misbruik van de ledenstatus.",
    ],
    pilot: [
      "20–30 vrijwillige zelfstandige leden en kleine kantoren die bevoegd en verzekerd zijn om opdrachten aan te nemen.",
      "Drie maanden, met omzetbelasting en loonheffingen als afgebakende eerste onderwerpen.",
      "Meten: passendheid, bespaarde intaketijd, klantbegrip, correcties op AI-uitvoer en kwaliteits- of privacysignalen.",
      "Na een gezamenlijk feitenrapport: stoppen, aanpassen, beperkt verlengen of pas dan een volgende samenwerkingsfase bespreken.",
    ],
    sources: [
      {
        label: "NOB-lidmaatschap",
        note: "Professionele erkenning, ethische normen, permanente educatie en jaarlijkse toetsing.",
        href: "https://www.nob.net/lidmaatschap/",
      },
      {
        label: "Statuten en reglementen",
        note: "Actuele Code of Conduct, PE-reglement, tuchtrecht en onafhankelijkheidsstatuut.",
        href: "https://www.nob.net/over-de-nob/statuten-en-reglementen-nob/",
      },
      {
        label: "NOB over AI en samenwerking",
        note: "Onafhankelijkheid, deskundigheid, zorgvuldigheid, menselijke eindcontrole en geheimhouding.",
        href: "https://www.nob.net/actueel/vijf-vragen-aan-erik-berk-over-de-aanpassing-van-de-code-of-conduct-en-de-handreiking-van-het-kantoorhandboek/",
      },
      {
        label: "Impact van AI in de fiscale praktijk",
        note: "Onderzoek uit 2026 naar gebruik, kansen en behoefte aan praktische ondersteuning.",
        href: "https://www.nob.net/actueel/de-impact-van-ai-binnen-de-fiscale-dienstverlening/",
      },
    ],
  },
  rb: {
    key: "rb",
    name: "Register Belastingadviseurs",
    shortName: "RB",
    proposition:
      "Maak van professionele vindbaarheid een stroom van passende opdrachten.",
    context:
      "Vind een RB helpt ondernemers een gekwalificeerde adviseur vinden. Fiscale Lijn kan daar een veilige opdrachtlaag aan toevoegen: de belastingvraag is al geordend, afgebakend en geprijsd voordat een vrijwillig RB-lid beslist of die past.",
    ask:
      "Toets met ons of vrijwillige RB-leden via een besloten proef aantoonbaar meer passend specialistisch mkb-werk krijgen.",
    evidence: [
      {
        label: "BESTAANDE BASIS",
        value: "Vind een RB",
        text: "Het RB laat leden nu al vrijwillig vindbaar zijn op interessegebied en specialisme. Fiscale Lijn vervangt dit niet, maar voegt een afgebakende opdracht toe.",
      },
      {
        label: "LEDENWAARDE",
        value: "Van profiel naar werk",
        text: "De klantvraag, privacycontrole, ontbrekende feiten, tijd en vergoeding zijn vooraf zichtbaar. Het lid ontvangt geen vrijblijvende contactlijst.",
      },
      {
        label: "INNOVATIE",
        value: "Veilige praktijkproef",
        text: "De Commissie AI & Digitalisering kan meedenken over menselijke controle en leerpunten uit echte mkb-vragen, zonder AI het eindoordeel te geven.",
      },
    ],
    associationValue: [
      {
        title: "Van vindbaarheid naar passende opdrachten",
        text: "De bestaande specialisme-indeling wordt niet alleen een zoekfilter, maar een gecontroleerde route van concrete mkb-vraag naar passend RB-lid.",
      },
      {
        title: "Meer aantoonbare ledenwaarde",
        text: "Leden krijgen een extra kanaal voor betaald specialistisch werk, zonder zelf brede marketing of langdurige klantenwerving te organiseren.",
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
        text: "Vraaginvoer, privacycontrole, ordening, ontbrekende feiten, keuze van een specialist en betaling worden vóór de inhoudelijke beoordeling georganiseerd.",
      },
      {
        title: "Geen race naar de laagste prijs",
        text: "Kwalificatie, inhoudelijke aansluiting, afbakening en kwaliteit wegen zwaarder dan prijs. Adviseurs zien geen openbare biedingen van concurrenten.",
      },
    ],
    verification: [
      {
        title: "Vrijwillige deelname door het RB-lid",
        text: "De fiscalist kiest voor deelname en machtigt Fiscale Lijn om actieve RB- of RBc-status en toegestane profielvelden te controleren.",
      },
      {
        title: "Aansluiten op gegevens van het RB",
        text: "Een beperkte controle kan voortbouwen op Mijn RB en Vind een RB, zonder het volledige ledenbestand te kopiëren.",
      },
      {
        title: "Specialismen door het lid bevestigd",
        text: "RB-status is de harde toegangseis; specialismen worden gekoppeld aan de onderwerpenindeling van het RB en onderbouwd met ervaring en voorkeuren.",
      },
      {
        title: "Periodieke en gebeurtenisgestuurde controle",
        text: "De status wordt opnieuw gecontroleerd en bij wijziging direct verwerkt. Fiscale Lijn bewaart alleen bewijs van die controle.",
      },
    ],
    safeguards: [
      "We nemen niet aan dat het gebruiksrecht van een individueel RB-lid ook voor het platform geldt; gebruik van titel of logo door het platform vereist aparte afspraken.",
      "Geen zelfverklaarde RB-status en geen eenmalig toegevoegd certificaat als blijvend bewijs.",
      "Geen openbare prijsveiling, geen betaling voor een hogere plaats en geen verkoop van contactgegevens buiten de afgesproken werkwijze voor opdrachten.",
      "Menselijke eindverantwoordelijkheid, broncontrole en een zichtbare scheiding tussen AI-concept en advies van het RB-lid.",
      "Samengevoegde inzichten voor het RB zijn niet herleidbaar tot klant, lid of kantoor zonder afzonderlijke wettelijke grondslag.",
    ],
    pilot: [
      "20–30 vrijwillige RB-leden die aantoonbaar bevoegd en verzekerd zijn om opdrachten aan te nemen.",
      "Drie maanden, met omzetbelasting en loonheffingen als afgebakende eerste onderwerpen.",
      "Meten: betaalde conversie, passendheid, bespaarde intaketijd, aanvullende ledenomzet, klantbegrip en kwaliteits- of privacysignalen.",
      "Het RB houdt een stoprecht; merkgebruik en een vaste registerkoppeling vragen na de evaluatie een afzonderlijk besluit.",
    ],
    economics: {
      title: "Vijf passende opdrachten kunnen de jaarcontributie rekenkundig evenaren.",
      figures: [
        { label: "Opdrachtprijs", value: "€200" },
        { label: "Platformvergoeding (18%)", value: "€36" },
        { label: "Omzet adviseur per opdracht", value: "€164" },
        { label: "Vijf opdrachten", value: "€820" },
      ],
      note: "Illustratie, geen rendementsbelofte. Het RB publiceert voor 2026 een reguliere contributie van €815 exclusief btw. De berekening houdt geen rekening met arbeid, andere kosten of belasting van de adviseur.",
    },
    sources: [
      {
        label: "RB-lidmaatschap",
        note: "RB-titel, logo als keurmerk, ledenvoordelen, mkb-focus en Vind een RB.",
        href: "https://rb.nl/lid-worden/rb-lidmaatschap/",
      },
      {
        label: "Vind een RB",
        note: "Vrijwillige zoekfunctie met interessegebieden en filters voor specialismen.",
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
        <span>Er bestaat nog geen samenwerking, toestemming of technische koppeling met het register.</span>
      </div>

      <header className="body-nav">
        <Link className="body-brand" href="/">
          <span>F</span>
          <b>fiscale lijn</b>
        </Link>
        <nav aria-label="Voorstelnavigatie">
          <a href="#waarde">Meerwaarde</a>
          <a href="#kwaliteit">Kwaliteitsmodel</a>
          <a href="#verificatie">Controle lidmaatschap</a>
          <a href="#pilot">Proef</a>
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
          <strong>{config.ask}</strong>
          <p>
            Geen brede samenwerking vooraf. Eerst samen vaststellen of het model
            leden helpt, ondernemers duidelijkheid geeft en de professionele norm
            aantoonbaar beschermt.
          </p>
          <dl>
            <div><dt>Duur</dt><dd>3 maanden</dd></div>
            <div><dt>Deelnemers</dt><dd>20–30 vrijwillige adviseurs</dd></div>
            <div><dt>Onderwerpen</dt><dd>Btw en loonheffingen</dd></div>
          </dl>
        </aside>
      </section>

      <section className="body-thesis">
        <span>DE GEDEELDE KANS</span>
        <blockquote>
          De beroepsvereniging bepaalt de professionele norm. Fiscale Lijn zet
          een ongestructureerde belastingvraag om in een afgebakende opdracht.
          De adviseur blijft onafhankelijk en eindverantwoordelijk.
        </blockquote>
      </section>

      <section className="body-evidence" aria-label={`Aanleiding voor het voorstel aan ${config.shortName}`}>
        {config.evidence.map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.text}</p>
          </article>
        ))}
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

      <section className="body-quality" id="kwaliteit">
        <div className="body-section-intro light">
          <p>DRIE ZICHTBARE KWALITEITSLAGEN</p>
          <h2>Geen ondoorzichtige score die bepaalt wie de beste fiscalist is.</h2>
          <p className="body-quality-intro">
            Een klant moet begrijpen wat door de vereniging is bevestigd, wat
            op het platform is aangetoond en wat eerdere klanten hebben ervaren.
          </p>
        </div>
        <div className="body-quality-grid">
          <article>
            <b>01</b>
            <span>BRON: {config.shortName}</span>
            <h3>Geverifieerde beroepsstatus</h3>
            <p>Actieve status en controledatum. Alleen {config.shortName} bepaalt wat die status inhoudt.</p>
          </article>
          <article>
            <b>02</b>
            <span>BRON: FISCALE LIJN</span>
            <h3>Ervaring per specialisme</h3>
            <p>Aantoonbaar afgeronde opdrachten per onderwerp. Geen algemene kwaliteitsclaim namens de vereniging.</p>
          </article>
          <article>
            <b>03</b>
            <span>BRON: ECHTE KLANT</span>
            <h3>Geverifieerde klantervaring</h3>
            <p>Alleen na afgerond werk, met uitleg over berekening en recht op reactie. Geen tuchtrechtelijk oordeel.</p>
          </article>
        </div>
      </section>

      <section className="body-verification" id="verificatie">
        <div className="body-section-intro light">
          <p>VOORGESTELDE CONTROLE VAN LIDMAATSCHAP</p>
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

      {config.economics ? (
        <section className="body-economics">
          <div>
            <p className="body-kicker">REKENVOORBEELD LEDENWAARDE</p>
            <h2>{config.economics.title}</h2>
            <p>{config.economics.note}</p>
          </div>
          <dl>
            {config.economics.figures.map((figure) => (
              <div key={figure.label}>
                <dt>{figure.label}</dt>
                <dd>{figure.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className="body-path">
        <div className="body-section-intro">
          <p>SAMENWERKING IN FASEN</p>
          <h2>Iedere stap is afzonderlijk en omkeerbaar.</h2>
        </div>
        <div className="body-path-steps">
          <article>
            <span>FASE 1</span>
            <h3>Status controleren</h3>
            <p>Een afgesproken ledenvermelding, minimale controle en intrekkingsroute. Nog geen logo of publieke goedkeuringsclaim.</p>
          </article>
          <article>
            <span>FASE 2</span>
            <h3>Vrijwillig ledenvoordeel</h3>
            <p>Deelnemende leden ontvangen passende opdrachten. We meten waarde, kwaliteit en risico’s voordat we opschalen.</p>
          </article>
          <article>
            <span>FASE 3</span>
            <h3>Innovatie en kwaliteit</h3>
            <p>Alleen na nieuwe afspraken: gezamenlijke standaarden, audits en eventueel afzonderlijke toestemming voor merkgebruik.</p>
          </article>
        </div>
      </section>

      <section className="body-pilot" id="pilot">
        <div>
          <p className="body-kicker">VOORGESTELDE EERSTE STAP</p>
          <h2>Drie maanden om de waarde én de risico’s te meten.</h2>
          <p>
            Geen brede lancering en geen technische koppeling zonder duidelijke afspraken over toezicht en besluitvorming.
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
          geen samenwerking, technische registertoegang of toestemming voor
          merkgebruik. Feiten, voorstellen en nog te toetsen aannames zijn daarom
          bewust van elkaar gescheiden.
        </p>
      </section>

      <footer className="body-footer">
        <span>Fiscale Lijn · vertrouwelijk conceptvoorstel</span>
        <Link href="/investeerders/">Bekijk het bredere voorstel voor investeerders</Link>
      </footer>
    </main>
  );
}
