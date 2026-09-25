# Productstrategie en beslislog — Fiscale Lijn

Status: richtinggevend en bindend voor de MVP

Versie: 1.0

Datum: 25 september 2026

## 1. Kernbesluit

De langetermijnmissie is kwalitatief belastingadvies toegankelijker maken. De eerste doelgroep is echter bewust smaller: **Nederlandse mkb-ondernemers, eenmanszaken, bv's en werkgevers met een concrete, afgebakende belastingvraag**.

We beginnen niet met “belastingadvies voor iedereen” als marktboodschap. Dat is sympathiek maar te breed voor productontwerp, acquisitie, expertmatching en kwaliteitsbeheersing. Eerst bewijzen we één herhaalbare route voor het mkb; particuliere onderwerpen volgen pas nadat kwaliteit, liquiditeit en unit economics zijn aangetoond.

## 2. Waarom het mkb eerst

- De pijn is concreet en tijdgebonden: btw-aangifte, factuur, loonrun, brief of deadline.
- De ondernemer heeft vaak al een boekhouder, software-uitvoer, document of AI-antwoord, maar mist specialistische bevestiging.
- Kleine vragen passen slecht in traditionele adviestrajecten met hoge intakekosten.
- Zakelijke vragen zijn vaker af te bakenen in scope, behandeltijd en vaste prijs.
- Distributie kan lean via boekhouders, salarisadministrateurs, ondernemersnetwerken en softwarepartners.

De eerste wedge is **btw/facturen en werkgevers-/loonvragen**. Daarna volgen winst en inkomstenbelasting, bv/vennootschapsbelasting en internationaal ondernemen. Consumententhema's zoals eigen woning, scheiding en schenken blijven in het datamodel mogelijk, maar zijn geen primaire acquisitieboodschap.

## 3. Klantprobleem en taal

De klant denkt niet: “ik heb een fiscale casus voor een jobboard.” De klant denkt:

> Ik heb een belastingprobleem in mijn bedrijf. Wat moet ik doen, wanneer moet dat, wat kost hulp en wie is verantwoordelijk?

Daarom gelden deze taalregels:

| Klantomgeving | Adviseur/admin/intern |
| --- | --- |
| belastingvraag | fiscale casus |
| specialist | fiscaal adviseur / expert |
| vaste prijs | vergoeding / opdrachtwaarde |
| vraag voorleggen | casus publiceren |
| aanvullende informatie | information request |
| mijn vragen | casusdossier |

De klant hoeft nooit zelf de juiste belastingcategorie te kennen. “Ik weet het niet” is een volwaardige keuze en triggert triage.

## 4. Dienstenladder

### 4.1 Gratis routecheck

Doel: de vraag begrijpelijk maken en voorkomen dat iemand betaalt voor hulp die niet nodig is.

Output:

- samenvatting en concrete vraag;
- vermoedelijk onderwerp en urgentie;
- ontbrekende informatie;
- privacy-/anonimiseringscontrole;
- advies om zelf/gratis verder te gaan of een specialist in te schakelen.

### 4.2 Korte belastingcheck

Voor één afgebakende vraag. Werkhypothese voor de demo: vanaf €49 exclusief btw. Dit is geen definitieve prijslijst.

Output:

- controle door een passende specialist;
- vaste scope en prijs vooraf;
- één noodzakelijke verduidelijkingsronde;
- bronnen, onzekerheden en actieplan.

### 4.3 Specialistisch advies

Voor hoger risico, meer feiten of een korte deadline. De klant ontvangt eerst scope, specialist en vaste totaalprijs. Meerwerk kan alleen na platformcontrole van de noodzaak en expliciet klantakkoord.

## 5. Marketplace zonder marktplaatsfrictie

Het jobboard is essentieel voor adviseurs, maar onzichtbaar als mechaniek in de primaire klantreis.

Besluit voor de eerste MVP:

1. adviseurs kunnen passend werk vinden en interesse tonen;
2. het platform adviseert de klant standaard één topmatch met een uitlegbare reden;
3. maximaal twee alternatieven kunnen worden getoond als er werkelijk keuze is;
4. adviseurs zien elkaars aanbod niet en kunnen elkaar niet live onderbieden;
5. prijsdumping wordt begrensd door minimumprijzen en kwaliteitsdrempels;
6. de klant kiest en betaalt pas nadat scope, totaalprijs en verantwoordelijkheid duidelijk zijn.

Dit combineert concurrentie aan de aanbodzijde met weinig keuzestress aan de klantzijde.

## 6. Kwaliteitsbelofte

Een overtuigende tekst is geen bewijs van kwaliteit. Voor productie bestaat kwaliteit uit:

- geverifieerde identiteit;
- relevante opleiding, registratie of aantoonbare vakbekwaamheid;
- passende onderwerpservaring en afgeronde vergelijkbare opdrachten;
- beroepsaansprakelijkheidsverzekering;
- geverifieerde reviews na betaalde opdrachten;
- brononderbouwing en zichtbare geldigheidsdatum;
- expliciete onzekerheid en ontbrekende feiten;
- een klachten- en herbeoordelingsroute.

De vaste structuur van ieder eindantwoord is:

1. kort antwoord;
2. wat dit voor de onderneming betekent;
3. wat de ondernemer nu moet doen;
4. deadline;
5. onzekerheden en ontbrekende informatie;
6. bronnen;
7. wanneer extra hulp nodig is.

## 7. Juridische en commerciële rol

Het gekozen werkmodel is bemiddeling:

- Fiscale Lijn organiseert intake, anonimisering, matching, betaling, facturatie en kwaliteitsworkflow.
- De klant sluit de adviesopdracht met de gekozen specialist.
- De specialist is verantwoordelijk voor het eindadvies binnen de afgesproken scope.
- Het platform factureert of incasseert namens de specialist via een gereguleerde betaalprovider en ontvangt een transparante platformvergoeding.

Dit model is een productbesluit onder voorbehoud. Voor een betaalde pilot moeten een Nederlandse jurist en fiscalist/accountant ten minste voorwaarden, informatieplichten, facturatie, btw, aansprakelijkheid, klachten, refunds en de betaalproviderconstructie valideren.

## 8. Privacy, AI en trainingsdata

- Een klant mag vrije tekst, documenten en een elders gegenereerd AI-antwoord aanleveren.
- Externe AI-output blijft als `CUSTOMER_SUPPLIED_EXTERNAL_AI` herkenbaar en wordt nooit stilzwijgend platformadvies.
- Origineel, geanonimiseerd dossier, platform-AI, bronnen, expertfeedback en eindadvies zijn afzonderlijke, versioned artefacten.
- De klant keurt de adviseurzichtbare anonimisering goed vóór publicatie.
- AI ondersteunt structurering, risicosignalering, bronvoorstel en controle, maar levert nooit zonder menselijk akkoord het eindadvies.
- Operationele feedback wordt niet automatisch trainingsdata. Hergebruik vereist een vastgelegd doel, rechtsgrond/toestemming, tweede de-identificatie, kwaliteitsselectie en datasetgoedkeuring.

## 9. Lean operatie

De service moet lage externe en supportkosten houden zonder kwaliteitsverlies:

- vrije intake in plaats van een lang formulier;
- deterministische regels vóór dure AI-runs;
- AI alleen voor taken waar het aantoonbaar tijd bespaart;
- maximum van één standaard verduidelijkingsronde in de korte check;
- vaste antwoordtemplates en kwaliteitschecks;
- self-service status en notificaties;
- geen open onderhandelingschat;
- modulair Python-backend en vervangbare providers;
- partnerdistributie vóór brede betaalde acquisitie.

Lean betekent niet dat privacy, aansprakelijkheid of broncontrole worden overgeslagen.

## 10. Demo versus productie

De GitHub Pages-site is een publieke, fictieve productdemo. Browseropslag, mockbetaling, demo-identiteiten en lokale bestandsmetadata mogen functionaliteit laten ervaren, maar worden altijd als demo gemarkeerd.

Voor productie zijn minimaal nodig: echte authenticatie en objectautorisatie, PostgreSQL, private documentopslag met malwarecontrole, betrouwbare anonimisering, formele expertverificatie, juridische documenten, payment webhooks, monitoring en incidentprocessen.

## 11. Besluiten die nog openstaan

- definitieve merknaam;
- definitieve prijspunten en minimumprijzen per complexiteit;
- exacte kwalificatie-eisen per specialisme;
- keuze en juridische inrichting van betaalprovider/facturatie;
- servicelevels, klachtenregeling en restitutiebeleid;
- voorwaarden en opt-out voor hergebruik van expertfeedback;
- pilotkanaal: boekhouder, salarisadministrateur, softwarepartner of directe acquisitie.

Nieuwe agents mogen deze punten niet stilzwijgend invullen. Als een wijziging één van deze beslissingen raakt, moet dit document worden bijgewerkt met datum, keuze en rationale.
