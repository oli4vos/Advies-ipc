# UX-audit: van AI-demo naar begrijpelijke belastinghulp

Datum: 28 september 2026  
Scope: publieke klantflow, intake, anonimisering, adviseursflow en demo-navigatie.

## Samenvatting

De inhoudelijke productkeuze is onderscheidend: een ondernemer mag rommelige input, documenten of een eerder AI-antwoord aanleveren en krijgt daarna een controleerbare route naar menselijke fiscale expertise. De interface laat dat al zien, maar toont te veel van de interne werking voordat de gebruiker zijn eerste vraag heeft gesteld.

De belangrijkste UX-beslissing is daarom:

> De klant hoeft niet te begrijpen hoe het platform werkt om te kunnen starten. De klant hoeft alleen te weten wat de volgende veilige stap is.

De primaire klantflow wordt:

1. vertel wat er speelt;
2. voeg alleen toe wat al beschikbaar is;
3. controleer de voorgestelde structuur en anonimisering;
4. kies gratis routecheck of passende menselijke controle;
5. ontvang een antwoord met bronnen, onzekerheden en actie.

Adviseurs, beheerders en demo-bediening blijven beschikbaar, maar worden niet langer als primaire klantnavigatie gepresenteerd.

## Kritische bevindingen

### P0 — De demo vertelt over zichzelf voordat de klant kan beginnen

De bovenkant bevatte tegelijk de publieke-demo-waarschuwing, opslagwaarschuwing, rolwisselaar, resetknop, rolprogressie en hoofdnav. Dat is handig voor een interne demo, maar het voelt voor een ondernemer als een producttestomgeving. Het vertroebelt de vraag: “Kan ik hier veilig mijn probleem neerleggen?”

Besluit: demo-bediening blijft bestaan voor evaluatie, maar wordt visueel secundair. De klantflow krijgt één duidelijke eerste CTA.

### P0 — De intake vraagt te vroeg om structuur die het product juist zou moeten maken

De klant komt na de vrije tekst direct langs titel, categorie, kernvraag, jaar en klanttype. Dat ondermijnt de belofte “u hoeft de juiste categorie niet te kennen”.

Besluit: vrije tekst is het primaire invoerpunt. Titel, categorie, kernvraag, jaar en klanttype staan achter progressive disclosure onder “Meer details toevoegen”.

### P1 — Te veel gelijkwaardige kaarten en statusinformatie

De homepage bevat meerdere secties met routekaarten, situaties, processtappen, serviceniveaus, kwaliteitsbewijzen en demo-casussen. Los zijn die begrijpelijk; samen concurreren ze om aandacht. Een eerste bezoeker hoeft niet tegelijk de volledige bedrijfslogica, prijsarchitectuur en demo-data te verwerken.

Besluit: de eerste viewport verkoopt alleen het probleem, de gratis eerste stap en menselijke controle. De rest ondersteunt die belofte lager op de pagina.

### P1 — “AI” moet als inputtype worden behandeld, niet als productpersoonlijkheid

De mogelijkheid om een elders gegenereerd AI-antwoord te plakken is inhoudelijk sterk. Het moet echter duidelijk blijven dat dit klantinput is en geen platformconclusie. Dat onderscheid is in de intake al aanwezig en moet ook in detail- en reviewweergaven consequent blijven.

Besluit: labels blijven “eerder AI-antwoord / klantinput”; nooit “AI-advies” als dit nog niet door een specialist is gecontroleerd.

### P1 — Vertrouwen komt uit bewijs, niet uit decoratie

De relevante vertrouwenssignalen zijn: wat wordt gecontroleerd, wie verantwoordelijk is, welke bron is gebruikt, wat nog onzeker is en wanneer de klant moet handelen. Bewegende statusbadges, extra gradients, meer pillen of meer dashboards voegen hier weinig aan toe.

Besluit: rustige typografie, duidelijke volgorde, expliciete onzekerheid en één betekenisvolle statusbeweging. Geen decoratieve AI-animaties.

## Reddit-signalen en vertaling naar dit product

De terugkerende community-feedback is niet dat AI nooit voor interfaces mag worden gebruikt, maar dat ongefilterde output snel herkenbaar wordt door steeds dezelfde componenten: badges, chips, kaarten, kleurverlopen, veel widgets en een generieke SaaS-opbouw. Zie onder meer [r/webdesign: Website was called generic](https://www.reddit.com/r/webdesign/comments/1twmqmn/website_was_called_generic/) en [r/UXDesign: Is the new normal of our work just fixing ai slop?](https://www.reddit.com/r/UXDesign/comments/1ujv3ol/is_the_new_normal_of_our_work_just_fixing_ai_slop/).

De praktische regels voor dit project zijn:

- eerst één heldere taak, daarna pas mogelijkheden;
- geen badges gebruiken om ontbrekende productbeslissingen te maskeren;
- kaarten alleen gebruiken wanneer de gebruiker echt iets moet vergelijken;
- copy schrijven vanuit de klantvraag, niet vanuit platformonderdelen;
- variatie en persoonlijkheid uit de inhoud halen, niet uit willekeurige visuele effecten;
- menselijke review op de laatste 30%: betekenis, prioriteit, uitzonderingen en foutafhandeling.

Dat sluit aan bij de observatie dat AI goed is voor verkenning en varianten, maar dat de laatste verfijning en het “waarom” menselijke productbeslissingen nodig hebben. Zie [r/UXDesign: Designers using AI for UI/UX](https://www.reddit.com/r/UXDesign/comments/1v9s61c/designers_using_ai_for_uiux_whats_actually/) en [r/web_design: What makes a website feel human instead of AI-generated?](https://www.reddit.com/r/web_design/comments/1vxra9d/what_makes_a_website_feel_human_instead_of/).

## Doel-flow voor de MVP

### Klant

`Homepage → vrije vraag → optionele bestanden/AI-input → structuur + anonimiseren → expliciet akkoord → routecheck → prijs/specialist → betaling → gecontroleerd antwoord`

Elke stap moet één primaire actie hebben. Teruggaan mag altijd zonder data kwijt te raken. De gebruiker ziet steeds:

- waar hij is;
- wat al is verwerkt;
- wat nog van hem nodig is;
- wat gratis is en wat betaald kan worden;
- wie verantwoordelijk is voor het definitieve antwoord.

### Adviseur

`Opdrachten → compacte kaart → passendheid + ontbrekende gegevens → interesse/claim → review → eindantwoord`

De jobboard-kaart blijft compact. De adviseur hoeft geen volledig dossier te openen om te beslissen of de vraag past.

### Beheerder

`Controle → anonimisering → publicatie → auditlog`

Beheerfuncties mogen uitgebreid zijn, maar horen niet in de klantflow te lekken.

## UX-acceptatiecriteria

- Een nieuwe klant begrijpt binnen vijf seconden wat de eerste stap is.
- De klant hoeft geen fiscale categorie te kiezen om te beginnen.
- De eerste intakeweergave bevat maximaal één verplichte inhoudelijke vraag.
- Optionele metadata is vindbaar maar niet dominant.
- Een eerder AI-antwoord kan worden toegevoegd en blijft zichtbaar als klantinput.
- Voor publicatie ziet de klant origineel en geanonimiseerd naast elkaar en moet hij expliciet akkoord geven.
- Elke betaalde route legt prijs, scope, verantwoordelijke specialist en onzekerheden uit.
- De demo-bediening is beschikbaar voor testers, maar is niet de visuele hoofdboodschap.
- De flow werkt met toetsenbord, duidelijke focus states, mobiele breedte en `prefers-reduced-motion`.
- Er is geen console-error tijdens homepage, intake, anonimiseringscontrole, jobboard en review.

## Volgende UX-blokken

1. Intake progressive disclosure en demo-controls secundair maken — uitgevoerd.
2. Iedere casus openen met één prominente beslissing of vervolgstap — uitgevoerd.
3. Prijsroutes vervangen door één rustige, vergelijkbare routelijst — uitgevoerd.
4. Adviseursoordelen als expliciete, machineleesbare classificatie vastleggen — uitgevoerd.
5. Prijs, scope en eventuele extra vragen in één akkoordmoment samenbrengen.
6. Loading-, netwerkfout- en herstelstates voor API-acties expliciet ontwerpen.
7. Een vijf-gebruikers test uitvoeren met middelgrote ondernemers en adviseurs; meten waar iemand twijfelt, niet alleen of iemand kan klikken.
8. Pas na die test extra visuele polish of animaties toevoegen.

## Implementatiebeslissingen uit de tweede UX-iteratie

- De casusdetailpagina begint met een beslisbalk die status, kerngegevens en maximaal één primaire actie combineert.
- De statusgeschiedenis is beschikbaar via progressive disclosure en concurreert niet meer met de actuele taak.
- De drie serviceniveaus zijn geen losse prijstegels meer, maar één redactionele routevergelijking.
- De adviseur kiest nu expliciet uit `CORRECT`, `PARTIALLY_CORRECT`, `INCORRECT`, `INSUFFICIENT_SUPPORT` en `MISSING_INFORMATION`. Dit oordeel wordt als gestructureerd review-item opgeslagen.
- Een definitief antwoord kan pas worden ingediend nadat oordeel, toelichting, antwoord en alle controlepunten compleet zijn.
- De hoofdnavigatie toont de actieve omgeving en de merklink is volledig toetsenbordbedienbaar.
- De publieke site heeft een eigen favicon, social metadata en een herstelbare 404-pagina.

## Wat we bewust niet doen

- Geen chatbot-interface als primaire ingang.
- Geen AI-copilot die zonder bron of menselijke controle stellige fiscale conclusies presenteert.
- Geen extra dashboardkaarten zonder concrete beslissing.
- Geen brede registratie- of 2FA-flow voordat de kernwaarde met echte gebruikerstests is gevalideerd.
- Geen echte persoonsgegevens of documenten in de publieke GitHub Pages-demo.
