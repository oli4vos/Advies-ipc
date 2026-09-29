# Partnerstrategie NOB en RB

Status: concept op basis van publiek beschikbare informatie, geraadpleegd in september 2026. Er is nog geen samenwerking, toestemming voor merkgebruik of toegang tot ledenregisters.

## Strategische keuze

Fiscale Lijn vraagt niet om een vrijblijvend logo. Het voorstel is dat een
actueel NOB- of RB-lidmaatschap een harde toegangseis wordt voor betaald
specialistisch platformwerk. De beroepsvereniging blijft eigenaar van de
kwaliteitsnorm en bron van de status; het platform organiseert intake,
matching, betaling, reviewworkflow en controleerbare presentatie aan de klant.

De gezamenlijke waardepropositie is:

> Ondernemers krijgen snel toegang tot aantoonbaar gekwalificeerde diepgang.
> Fiscalisten krijgen genoeg passend werk om specialist te worden en te
> blijven. De beroepsvereniging ziet haar kwaliteitsnorm terug op het moment
> waarop de klant kiest.

## Belangrijk onderscheid tussen NOB en RB

### NOB

De NOB communiceert over professionele erkenning, universitaire toelating,
beroepsopleiding, permanente educatie, jaarlijkse e-learning en
self-assessment, onafhankelijkheid, geheimhouding en tuchtrecht. In 2026 is de
toelichting op de Code of Conduct aangepast voor technologie en AI, met nadruk
op onafhankelijkheid, deskundigheid, zorgvuldigheid, menselijke beoordeling en
vertrouwelijkheid.

In de onderzochte publieke informatie is geen openbaar ledenregister,
verificatie-API of algemeen platformrecht voor gebruik van het NOB-logo
gevonden. De NOB-pitch vraagt daarom primair om:

1. een goedgekeurde formulering voor geverifieerd lidmaatschap;
2. een minimale verificatieservice of beveiligde pilotcontrole;
3. een intrekkings- en misbruikprotocol;
4. pas daarna, en afzonderlijk, toestemming voor een visueel merk.

### RB

Het RB noemt de RB-titel expliciet een keurmerk en noemt gebruik van het
RB-logo als voordeel van het reguliere lidmaatschap. `Vind een RB` is een
publieke opt-in zoekmodule met interessegebieden en specialismen. Het RB heeft
ook een Commissie AI & Digitalisering, die het bestuur en leden adviseert over
toepassing en impact van AI.

Het recht van een individueel lid om het RB-logo te gebruiken wordt niet
verondersteld overdraagbaar te zijn aan Fiscale Lijn. De RB-pitch vraagt daarom
om aparte platformafspraken en een beperkte koppeling die actieve RB/RBc-status
en toegestane profielvelden controleert zonder het ledenbestand te kopiëren.

## Minimale verificatiearchitectuur

De technische laag moet via één adapter werken, zodat per beroepsvereniging
een andere verificatiemethode mogelijk is:

```text
Expert vraagt verificatie aan
→ expliciete toestemming en identiteitstoets
→ ProfessionalBodyVerificationProvider.verify()
→ bron: handmatige verenigingscontrole of beperkte API
→ minimale statusresponse
→ ondertekend verificatiebewijs met geldigheidsduur
→ periodieke en gebeurtenisgestuurde hercontrole
→ directe blokkade bij verlopen, geschorste of ingetrokken status
```

Minimale velden:

- vereniging;
- lidmaatschapstype;
- actieve/inactieve status;
- geverifieerde naam of stabiele pseudonieme identifier;
- verificatietijdstip;
- geldig-tot of volgende controledatum;
- bron en verificatiemethode;
- toegestane publieke formulering;
- reden van blokkade, zonder meer detail dan noodzakelijk.

Geen opslag van PE-dossiers, opleidingsdocumenten, tuchtinformatie of volledige
ledenregisters tenzij daar later een aantoonbare noodzaak en rechtsgrond voor
bestaat.

## Governancevoorwaarden

- geen logo of keurmerkclaim vóór schriftelijke toestemming;
- geen zelfverklaarde ledenstatus;
- geen betaling aan de beroepsvereniging per aangebrachte opdracht;
- transparante platformvergoeding en geen pay-to-rank;
- de adviseur houdt volledige inhoudelijke onafhankelijkheid;
- een AI-concept is nooit het eindadvies;
- klantdata worden niet voor training gebruikt zonder aparte doelbinding en
  grondslag;
- snelle merkintrekking en blokkade van nieuwe opdrachten;
- periodieke auditrapportage met geaggregeerde kwaliteits- en gebruikssignalen;
- een gezamenlijke klachten- en escalatieroute.

## Voorgestelde pilot

Begin met een kleine besloten groep vrijwillige leden en twee afgebakende
specialismen: omzetbelasting en loonheffingen. Meet vóór opschaling:

- passendheid van gematchte opdrachten;
- afname van onbetaalde intake;
- doorlooptijd zonder kwaliteitsverlies;
- ervaren waarde voor leden;
- klantbegrip van rol, keurmerk en verantwoordelijkheid;
- onafhankelijkheids-, privacy- en merkrisico’s;
- het aandeel casussen dat buiten scope wordt geplaatst.

De beroepsvereniging houdt een stoprecht. Een succesvolle pilot geeft geen
automatisch recht op merkgebruik of structurele registertoegang.

## Officiële bronnen

### NOB

- [Lidmaatschap](https://www.nob.net/lidmaatschap/)
- [Statuten en reglementen](https://www.nob.net/over-de-nob/statuten-en-reglementen-nob/)
- [Aanpassing Code of Conduct voor AI en samenwerking](https://www.nob.net/actueel/vijf-vragen-aan-erik-berk-over-de-aanpassing-van-de-code-of-conduct-en-de-handreiking-van-het-kantoorhandboek/)
- [NOB over ledentoezicht en self-assessment](https://www.nob.net/actueel/nob-2024/)

### RB

- [RB-lidmaatschap](https://rb.nl/lid-worden/rb-lidmaatschap/)
- [Vind een RB](https://rb.nl/vind-een-rb/)
- [Commissie AI & Digitalisering](https://rb.nl/nieuws/benoemingen-leden-commissie-ai-digitalisering/)
- [Strategisch plan 2023–2027](https://rb.nl/wp-content/uploads/Bijlage-8-Strategisch-plan-RB-2023-2027.pdf)
