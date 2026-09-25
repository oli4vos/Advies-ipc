# Oprichterscontext — Fiscale Lijn

Status: richtinggevend voor product-, data- en go-to-marketbesluiten<br>
Bron: beantwoording door oprichter, 25 september 2026<br>
Gebruik: toekomstige agents lezen dit naast `AGENTS.md`, `PRODUCT-STRATEGY.md` en `ARCHITECTURE-BLUEPRINT.md` voordat zij keuzes maken die scope, prijs, vertrouwen, data of groei raken.

Dit document is geen juridisch, fiscaal of privacyadvies. Waar visie raakt aan regelgeving staat de benodigde validatie expliciet vermeld.

## Samenvatting in één zin

Maak deskundig belastingadvies bereikbaar als een gerichte, menselijk gecontroleerde specialistische dienst: niet als vervanging van een vaste adviseur, maar als een betrouwbaar antwoord op een afgebakende vraag.

## De visie van de oprichter

### 1. Eindbeeld

Start met het MKB en ontwikkel door naar kleine én grotere ondernemingen. Niet elk bedrijf heeft doorlopend een brede fiscalist of een kostbaar adviestraject nodig. Een onderneming moet voor een specifieke vraag snel bij de inhoudelijk juiste specialist uitkomen, een antwoord krijgen waarop zij kan terugvallen en onnodige meetings, intake en hoge facturen vermijden.

**Ontwerpimplicatie:** optimaliseer voor afgebakende specialistvragen, niet voor een virtuele full-service adviespraktijk. Behoud een duidelijke doorverwijzing voor werk dat niet verantwoord begrensd kan worden.

### 2. Eerste klant

De eerste betalende klant is de middelgrote zzp'er of mkb-onderneming met redelijk wat omzet en bestedingsruimte: professioneel genoeg om zekerheid te waarderen, maar vaak te klein om voor elke vraag een groot kantoor in te schakelen.

**Ontwerpimplicatie:** vermijd zowel consumenten-taal die te simplistisch voelt als enterpriseprocessen met lange onboarding. Communiceer de zakelijke uitkomst, het risico, de actie en de verantwoordelijke specialist.

### 3. Belofte en probleem

De drempel om goed fiscaal advies te krijgen is te hoog. Het aanbod moet daarom luiden: een goed, door een mens gecontroleerd belastingadvies op een concrete vraag. Het product verkoopt in de eerste plaats **zekerheid**, niet “goedkope AI”.

Een eindantwoord moet voldoende comfort bieden om een handeling, aangifte of aftrekpost uit te voeren en om de onderbouwing bij een eventuele controle te begrijpen.

**Ontwerpimplicatie:** een antwoord zonder bron, voorwaarden, onzekerheden, actie en reikwijdte is geen afgerond product. Vermijd absolute claims als “controleproof” of een garantie op een fiscale uitkomst.

### 4. Eerste inhoudelijke scope

De eerste onderwerpen zijn:

- btw-vraagstukken;
- aftrekposten en zakelijke kosten;
- loonheffingen.

Op termijn kunnen alle belastingmiddelen volgen. Zeer complexe dossiers, zeer grote organisaties of dossiers met bijvoorbeeld honderdduizenden documenten horen niet in de gestandaardiseerde route. Zij worden warm doorverwezen naar passende fiscalisten of samenwerkende advieskantoren.

**Ontwerpimplicatie:** bouw vroeg een expliciete `OUT_OF_SCOPE`/doorverwijsuitkomst met reden, in plaats van moeilijke casussen toch als korte vraag te prijzen.

### 5. Prijs en marketplace

De pilot mag met heldere pakket- of vaste prijzen werken, omdat scope en klantvertrouwen dan eenvoudiger zijn. De langetermijnambitie is prijsdifferentiatie op basis van complexiteit, benodigde tijd, urgentie en vraag/aanbod: een specialist moet eerlijk voor het werk worden beloond en de klant moet minder betalen dan in een traditioneel traject dankzij voorbereiding door AI.

Dit is nadrukkelijk **geen openbare race naar de laagste prijs**. Adviseurs mogen niet elkaars prijzen zien of live onderbieden. De klant krijgt een begrijpelijk totaalbedrag en een passend aanbod; de platformlogica moet kwaliteit, expertise, verwachte tijd en zekerheid voorop zetten.

**Ontwerpimplicatie:** implementeer eerst uitlegbare prijsbanden, minimumprijzen en een scopecontract. Voeg pas later besloten biedingen of dynamische prijsdifferentiatie toe, met kwaliteits- en fairness-guardrails.

### 6. Expertkwaliteit

Voor productie moet een fiscale expert ten minste actief aangesloten zijn bij de Nederlandse Orde van Belastingadviseurs (NOB) of het Register Belastingadviseurs (RB). Daarnaast zijn identiteit, onderwerpcompetentie, relevante ervaring en beroepsaansprakelijkheid te verifiëren.

Een WO-master kan een relevant kwaliteitssignaal zijn, maar is niet de enige toelatingsroute wanneer actieve NOB- of RB-registratie aanwezig is.

**Ontwerpimplicatie:** ontwerp onboarding met bewijsstatus en herverificatie, niet met een vrijblijvende profieltekst. Demo-accounts blijven zichtbaar fictief.

### 7. Rol van platform, AI en mens

Het platform is bemiddelaar en servicepartij: het structureert de vraag, geeft mogelijk gratis AI-oriëntatie, anonimiseert, matcht, faciliteert betaling/facturatie en ontvangt een platformvergoeding. De relevante specialist geeft het betaalde inhoudelijke eindadvies binnen de afgesproken scope.

Voor elk inhoudelijk oordeel moet zichtbaar zijn wie of wat de bron is. Gratis AI-hulp mag richting geven, maar kan geen betaald of definitief expertadvies suggereren. De human in the loop en eerlijke communicatie over beperkingen van zowel AI als mensen mogen nooit verdwijnen.

**Validatie vóór betaalde pilot:** contractmodel, facturatie/btw, aansprakelijkheid, beroepsregels, klachten, betaling en de precieze scheiding tussen platformdienst en adviesdienst.

### 8. Data, feedback en toekomstige AI-propositie

Het platform moet gestructureerde, gevalideerde feedback en antwoorden kunnen verzamelen, zodat productverbetering mogelijk is en op langere termijn een verrijkte AI-propositie voor adviseurs (bijvoorbeeld een MCP-integratie) kan ontstaan. De gewenste dataherkomst is altijd duidelijk: klantinput, geanonimiseerde versie, externe AI, platform-AI, bron, menselijke feedback, eindantwoord en validatiestatus.

Een grote verzameling gevalideerde casuïstiek is strategisch waardevol, maar geen automatisch recht op trainingsdata, fine-tuning of verkoop. Hergebruik vereist per doel een privacy- en contractueel toetsbare grondslag, tweede de-identificatie, kwaliteitsselectie, toegangscontrole en menselijke goedkeuring. Een MCP mag uitsluitend goedgekeurde, toegestane kennis ontsluiten en nooit ruwe dossiers.

**Ontwerpimplicatie:** provenance, versies, toestemming/rechtsgrond, bewaartermijn, de-identificatiestatus, kwaliteitslabel en export-goedkeuring zijn eersteklas datavelden; geen achteraf toegevoegde metadata.

### 9. Go-to-market en timing

Waarschijnlijke acquisitiekanalen zijn boekhouders, salarisadministrateurs, NOB/RB en later softwarepartners. Plan de lancering rond periodes waarin fiscale vragen pieken. De grootste operationele uitdaging is een betrouwbare pool gekwalificeerde experts; expertwerving en -activatie verdienen minstens evenveel aandacht als klantacquisitie.

**Ontwerpimplicatie:** valideer de supply side vroeg met een kleine, geverifieerde expertgroep en partnerpilot, vóór brede vraaggeneratie.

### 10. Ondernemersambitie en stuurgetallen

Dit moet een schaalbare venture worden die vanaf het begin professioneel, due-diligence- en verkoopklaar wordt opgezet. Pre-seedfinanciering kan nodig zijn om gefocust te bouwen.

De vroege succesmetingen zijn:

1. aantal betaalde vragen;
2. gebruik en tractie van de gratis route;
3. terugkerende klanten;
4. klanttevredenheid en vertrouwen;
5. beschikbaarheid, kwaliteit en retentie van experts.

Doorlooptijd en marge worden gemeten, maar zijn in de eerste fase niet het primaire optimalisatiedoel. Gebruik ze om het aanbod later gezond te schalen.

### 11. Niet-onderhandelbare waarden en merktoon

- menselijke controle op betaald eindadvies;
- geen loze beloften of verzwegen onzekerheid;
- geruststellend en toegankelijk, zonder de inhoud te versimpelen;
- kwaliteit en zekerheid boven prijsdumping;
- transparantie over wat AI wel en niet doet.

## Beslisregels voor agents

Wanneer een voorstel botst met deze regels, kies dan voor: afgebakende scope, gekwalificeerde menselijke controle, bron- en herkomsttransparantie, privacybescherming en een begrijpelijke zakelijke klantreis.

Escaleren naar de producteigenaar voordat je beslist over:

- een andere klantgroep of inhoudelijke launchscope;
- een publieke bieding, prijsveiling of prijsmechanisme zonder kwaliteitsgrenzen;
- claims over kwaliteit, compliance, aansprakelijkheid of resultaat;
- hergebruik, verkoop, training of MCP-toegang voor dossierdata;
- versoepeling van de experttoelating;
- een betaalde flow zonder gevalideerd juridisch/facturatiemodel.
