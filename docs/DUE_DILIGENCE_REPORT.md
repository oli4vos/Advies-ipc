# Due-diligence rapport — Fiscale Lijn MVP

Status: concept, niet gecommit  
Auditatum: 22 september 2026  
Gecontroleerde commit: `891b49f` (`Add conditional fee gate for information requests`)

> Historische momentopname. Dit rapport beschrijft commit `891b49f` en blijft bewaard als audittrail. Het is geen verklaring over de actuele `main`. Voor de huidige productrichting zie [PRODUCT-STRATEGY.md](./PRODUCT-STRATEGY.md) en voor de doelarchitectuur [ARCHITECTURE-BLUEPRINT.md](./ARCHITECTURE-BLUEPRINT.md).

## Implementatie-update 25 september 2026

Na deze audit zijn onder meer demo-identiteiten, rol- en eigendomscontroles, gescheiden klant-/adviseurresponses, extra privacygates, platformgoedkeuring voor noodzakelijke toeslagen, migraties `0004` en `0005`, uitgebreidere regressietests en een GitHub Actions-kwaliteitsworkflow toegevoegd. De publieke demo bewaart alleen fictieve status in browseropslag en markeert uploads, betalingen en AI als mock.

De hoofdconclusie blijft ongewijzigd: **geen echte klantdossiers of betaalde pilot** totdat productie-authenticatie, private documentopslag, formele expertverificatie, juridisch gevalideerde voorwaarden/facturatie, providergebonden betalingen, monitoring en een nieuwe onafhankelijke security/privacy-audit gereed zijn. Demo-bearertokens en browseropslag zijn geen productiebeveiliging.

## Executive summary

**Besluit: no-go voor echte klantdossiers, echte betalingen of een betaalde pilot.** De huidige versie is geschikt als publieke, volledig fictieve GitHub Pages-demo en als lokale ontwikkelprototype. Zij is niet geschikt om persoonsgegevens, fiscale dossiers of betalingsverplichtingen te verwerken.

De belangrijkste blokkades zijn fundamenteel en oplosbaar: er is geen authenticatie of objectautorisatie, originele casusdata en auditlogs zijn via de lokale API opvraagbaar, een klantgeplakt extern AI-antwoord wordt in de openbare jobboard-detailrespons teruggegeven, en de actuele lokale SQLite-database is als migratie `0003` gemarkeerd terwijl twee verplichte kolommen ontbreken.

Positief is dat de productrichting helder is: de kernentiteiten zijn gescheiden, de basisworkflow heeft regressietests, de publieke demo bevat een prominente waarschuwing en de GitHub Pages-deployment is herhaalbaar. De volgende bouwstap moet echter **security, privacy en workflow-integriteit** zijn; geen nieuwe productfeature.

## Scope en werkwijze

Gecontroleerd zijn alle getrackte bestanden, de lokale werkboom, de Git- en GitHub Pages-configuratie, de FastAPI-routes, modellen, migraties, tests, de statische Pages-demo en de lokale UI/API.

Niet beoordeeld: juridische contracten, beroepsaansprakelijkheid, een echte betaalprovider, externe AI-providers, echte documentopslag, productiehosting en een onafhankelijke penetratietest.

De bestaande niet-getrackte bestanden zijn alleen geïnventariseerd. Zij zijn niet geopend, gewijzigd, gecommit of verwijderd.

## Wat werkt al goed

- De publieke demo vermeldt duidelijk dat deze geen veilige opslag, authenticatie of productie-anonimisering bevat.
- Ruwe intake, externe AI-input, geanonimiseerde tekst, samenvatting, AI-output, bronnen, expertreview en provenance zijn als afzonderlijke domeinrecords gemodelleerd.
- De AI-output is als mock en concept gelabeld; bronverwijzingen zijn als demo gemarkeerd.
- De claim-, selectie-, mockbetaal-, review- en toeslagflow hebben regressietests.
- Anonimisering heeft tests voor e-mail, telefoon, postcode, BSN, KvK, IBAN, expliciet gemarkeerde werkgever en een contextueel genoemde medewerker.
- Een schone SQLite-database kan de migraties `0001 → 0003`, `0003 → 0002` en weer `0002 → 0003` uitvoeren.
- GitHub Actions bouwt en publiceert de statische frontend succesvol. De workflow voor commit `891b49f` is geslaagd.
- `npm audit --omit=dev --audit-level=high` rapporteerde geen bekende production dependencies-kwetsbaarheden.

## Bevindingen

| ID | Ernst / prioriteit | Bevinding |
| --- | --- | --- |
| DD-01 | Kritiek / P0 | Geen authenticatie of objectautorisatie; iedere lokale API-client kan dossiers, betalingen, reviews en beheeracties lezen of muteren. |
| DD-02 | Kritiek / P0 | Ruwe casusdata en auditlogs zijn zonder identiteit of eigenaarscontrole opvraagbaar. |
| DD-03 | Kritiek / P0 | Een extern AI-antwoord van de klant wordt niet geanonimiseerd en wordt door het publieke jobboard-detail teruggegeven. |
| DD-04 | Hoog / P0 | De actuele lokale database is als `0003` gemarkeerd maar mist verplichte `payments`-kolommen; migratie- en runtime-status kunnen uiteenlopen. |
| DD-05 | Hoog / P1 | Statusworkflow is verspreid, niet centraal gedefinieerd en mist onder meer `CLOSED`, `CANCELLED`, weigeren en herstelpaden. |
| DD-06 | Hoog / P1 | Fee-goedkeuring is een eenvoudige keywordregel, zonder menselijke override, fraudepreventie of inhoudelijke context. |
| DD-07 | Hoog / P1 | Betalingen zijn niet idempotent of provider-gebonden; concurrentie en dubbele verzoeken zijn niet transactioneel afgedekt. |
| DD-08 | Hoog / P1 | Trainingsdata-governance mist toestemming, bewaartermijnen, verwijdering, toegangsscope en exportbeleid. |
| DD-09 | Hoog / P1 | GitHub Actions test of bouwt de Python-backend niet; linting is niet geïnstalleerd of afdwingbaar. |
| DD-10 | Gemiddeld / P2 | Bronplicht en claim-voor-claimreview zijn niet technisch afgedwongen; definitief advies kan zonder bron worden ingediend. |
| DD-11 | Gemiddeld / P2 | Frontend is sterk geconcentreerd in één componentbestand van 2.166 regels; onderhoud- en regressierisico groeit snel. |
| DD-12 | Gemiddeld / P2 | De repository heeft belangrijke lokale, niet-getrackte architectuur- en deploymentbestanden; de GitHub-versie is niet de volledige lokale werkstaat. |

### DD-01 — Geen authenticatie of objectautorisatie

**Bewijs.** Alle routes gebruiken uitsluitend `Depends(get_session)` en geen identity-, role- of ownership-dependency. Zie [api.py](/Users/oliviervos/Library/Mobile%20Documents/com~apple~CloudDocs/AA%20Ondernemen/AI%20check%20advies%20platform/server/app/api.py:47). De OpenAPI-specificatie bevat geen `securitySchemes`.

**Reproduceerbaar.** Zonder credentials gaf `GET /api/v1/cases/{public_code}` een volledige casus terug, inclusief `original_description`. Zonder credentials gaf `GET /api/v1/admin/audit-logs` vier auditregels terug.

**Impact.** Iedereen die de backend kan bereiken kan casussen bekijken, als klant bevestigen, als beheerder publiceren, claims selecteren, mockbetalingen uitvoeren, reviews indienen en toeslagen accepteren. Ook `expert_id` in een claimrequest is niet gekoppeld aan een ingelogde actor; zie [marketplace.py](/Users/oliviervos/Library/Mobile%20Documents/com~apple~CloudDocs/AA%20Ondernemen/AI%20check%20advies%20platform/server/app/services/marketplace.py:35).

**Aanbeveling.** Bouw vóór iedere echte test een identity-context en server-side policylaag: `current_user`, role checks, eigenaarstoetsen per casus, selected-expert checks en aparte beheerpermissies. Schrijf negatieve API-tests voor iedere route.

### DD-02 — Originele dossierinhoud en auditlogs zijn openbaar voor iedere API-client

**Bewijs.** `GET /cases/{case_id}` roept `case_to_read(..., include_original=True)` aan; de anonimiseringpreview levert de ruwe tekst eveneens terug. Zie [api.py](/Users/oliviervos/Library/Mobile%20Documents/com~apple~CloudDocs/AA%20Ondernemen/AI%20check%20advies%20platform/server/app/api.py:58) en [api.py](/Users/oliviervos/Library/Mobile%20Documents/com~apple~CloudDocs/AA%20Ondernemen/AI%20check%20advies%20platform/server/app/api.py:63). Auditlogs zijn eveneens vrij beschikbaar via [api.py](/Users/oliviervos/Library/Mobile%20Documents/com~apple~CloudDocs/AA%20Ondernemen/AI%20check%20advies%20platform/server/app/api.py:195).

**Impact.** Dit is een directe datalekroute zodra de lokale API buiten de eigen laptop bereikbaar is.

**Aanbeveling.** Maak originele tekst, preview, betalingen, provenance en auditlogs standaard private. Gebruik afzonderlijke response schemas voor klant, toegewezen adviseur, beheerder en publiek jobboard.

### DD-03 — Extern AI-antwoord kan persoonsgegevens lekken naar adviseurs

**Bewijs.** Alleen `payload.description` gaat door `anonymise`; `external_ai_answer` wordt ongewijzigd opgeslagen in [cases.py](/Users/oliviervos/Library/Mobile%20Documents/com~apple~CloudDocs/AA%20Ondernemen/AI%20check%20advies%20platform/server/app/services/cases.py:144). `case_to_read` geeft dit veld altijd terug, ook wanneer `include_original=False`; zie [cases.py](/Users/oliviervos/Library/Mobile%20Documents/com~apple~CloudDocs/AA%20Ondernemen/AI%20check%20advies%20platform/server/app/services/cases.py:491). Het publieke jobboard-detail gebruikt precies die variant; zie [api.py](/Users/oliviervos/Library/Mobile%20Documents/com~apple~CloudDocs/AA%20Ondernemen/AI%20check%20advies%20platform/server/app/api.py:97).

**Reproduceerbaar.** De openbare detailrespons bevatte `external_ai_answer_public: true` en gaf ook provenance en claims terug.

**Aanvullend privacyrisico.** De lokale jobboard-smoke-test toonde een eerder gepubliceerde casus met `Jan Test` in de zichtbare samenvatting. Ook al is dit fictieve data, het bewijst dat eerder gepubliceerde records niet opnieuw worden gescand wanneer anonimisering wordt aangescherpt.

**Aanbeveling.** Anonimiseer externe AI-input met hetzelfde of een strengere proces. Bewaar de ongeredigeerde versie uitsluitend privé voor de eigenaar en geautoriseerd beheer. Maak een migratie-/quarantaineproces dat alle bestaande gepubliceerde records opnieuw scant vóór volgende publicatie.

### DD-04 — Lokale database en migratieversie zijn inconsistent

**Bewijs.** `alembic check` faalde op de actuele lokale database. De database zegt `0003`, maar `payments` bevat niet de kolommen `payment_type` en `information_request_id`; ook de index en foreign key ontbreken. De checker detecteert precies deze vier missende upgrade-operaties.

**Waarschijnlijke oorzaak.** De applicatiestart voert `Base.metadata.create_all()` uit in [main.py](/Users/oliviervos/Library/Mobile%20Documents/com~apple~CloudDocs/AA%20Ondernemen/AI%20check%20advies%20platform/server/app/main.py:14). Die helper voegt ontbrekende tabellen toe maar wijzigt bestaande tabellen niet. Daardoor kan een lokaal schema gedeeltelijk nieuw zijn terwijl de Alembic-versie handmatig of verkeerd als volledig gemigreerd staat.

**Impact.** Nieuwe toeslagbetalingen kunnen runtimefouten geven op een database die door de versieadministratie als actueel wordt beschouwd.

**Aanbeveling.** Gebruik buiten tests nooit `create_all`. Start lokaal en in productie altijd met `alembic upgrade head`; voeg een startup schema-healthcheck toe. Herstel de huidige demo-database gecontroleerd vanuit een backup of maak hem opnieuw aan, omdat dit uitsluitend fictieve demo-data betreft. Voeg `alembic check` toe aan CI.

### DD-05 — Statusmachine is niet volledig of centraal afgedwongen

**Bewijs.** `Case.status` is een vrije string in [models.py](/Users/oliviervos/Library/Mobile%20Documents/com~apple~CloudDocs/AA%20Ondernemen/AI%20check%20advies%20platform/server/app/models.py:49). De enige schema-unie bevat slechts `PENDING_REVIEW` en `PUBLISHED`; zie [schemas.py](/Users/oliviervos/Library/Mobile%20Documents/com~apple~CloudDocs/AA%20Ondernemen/AI%20check%20advies%20platform/server/app/schemas.py:300). De gevraagde statussen `DRAFT`, `ANONYMISING`, `CLOSED` en `CANCELLED` worden niet geïmplementeerd. Er is geen klantpad om een toeslag te weigeren, om een casus te annuleren of om na een antwoord formeel te sluiten.

**Impact.** Casussen kunnen operationeel vastlopen, met name na een noodzakelijke informatievraag; statusovergangen zijn lastiger te auditen en te beveiligen.

**Aanbeveling.** Definieer één status-en eventmodel met toegestane transities, actorvereisten, idempotency-key en consistente audit-eventnamen. Voeg negatieve tests toe voor alle verboden overgangen.

### DD-06 — Fee-gate is uitlegbaar maar te eenvoudig voor prijsbeslissingen

**Bewijs.** Een vraag met één keyword, zoals `factuur`, is automatisch noodzakelijk. De client levert zelf `estimated_extra_minutes`; 120 minuten produceert direct de maximumtoeslag van €50. Zie [marketplace.py](/Users/oliviervos/Library/Mobile%20Documents/com~apple~CloudDocs/AA%20Ondernemen/AI%20check%20advies%20platform/server/app/services/marketplace.py:46).

**Impact.** De regel is transparant, maar kan inhoudelijk fout classificeren en is zonder identitylaag misbruikbaar. `approved_fee_delta_cents` wordt direct gelijkgesteld aan het voorstel; er bestaat geen platform- of beheerderoverride.

**Aanbeveling.** Houd de regelengine als eerste triage, maar voeg een expliciete `PENDING_PLATFORM_REVIEW` stap toe voor iedere prijsverhoging. Baseer de toeslag op een gecatalogiseerde fact-gap en vaste prijskaart per specialisme. Een AI-classificatie mag alleen suggesties en bewijs leveren, nooit een fee zelfstandig goedkeuren.

### DD-07 — Betaling mist idempotency, providerreferentie en concurrencybescherming

**Bewijs.** `POST /cases/{id}/pay` zoekt de eerste `PENDING` betaling en markeert die betaald zonder provider payment-id, webhook, lock of idempotency-key; zie [marketplace.py](/Users/oliviervos/Library/Mobile%20Documents/com~apple~CloudDocs/AA%20Ondernemen/AI%20check%20advies%20platform/server/app/services/marketplace.py:377). De response bevat alleen de laatste betaling, zodat een basisbetaling verdwijnt uit het zicht zodra er een toeslagbetaling ontstaat; zie [cases.py](/Users/oliviervos/Library/Mobile%20Documents/com~apple~CloudDocs/AA%20Ondernemen/AI%20check%20advies%20platform/server/app/services/cases.py:502).

**Impact.** Reële betaalintegratie kan dubbele betalingen, onduidelijke totaalbedragen en betwiste betalingsstatus veroorzaken.

**Aanbeveling.** Introduceer payment intents met externe providerreferentie, unieke idempotency-key, bedrag in immutable ledgerregels, webhookverificatie, locking/version checks en een totaaloverzicht van alle betalingen/toeslagen.

### DD-08 — Trainingsdata is inhoudelijk rijk maar governance ontbreekt

**Sterk punt.** Herkomstvelden onderscheiden klant, externe AI, platform-AI, systeemregel, bron en menselijke feedback. Dit is een goede basis.

**Tekort.** Er zijn geen consentvelden, dataset-use cases, bewaartermijnen, verwijderverzoeken, legal hold, exportclassificatie, de-identificatieversie of opt-in voor trainingsgebruik. `ProvenanceRead` retourneert ook geen producer/actor-id, waardoor API-consumenten herkomst niet volledig kunnen controleren.

**Impact.** De huidige dataset mag niet automatisch als modeltrainingsdata worden behandeld.

**Aanbeveling.** Voeg vóór hergebruik een data-governancelaag toe met purpose limitation, toestemming/grondslag, privacyclassificatie, retention, erasure, reviewkwaliteit, train/eval-splits en een expliciete `eligible_for_training` beslissing per artefactversie.

### DD-09 — CI dekt alleen de statische frontenddeployment

**Bewijs.** De enige getrackte workflow is [deploy-pages.yml](/Users/oliviervos/Library/Mobile%20Documents/com~apple~CloudDocs/AA%20Ondernemen/AI%20check%20advies%20platform/.github/workflows/deploy-pages.yml:1). Deze voert `npm ci` en `npm run build` uit, maar geen Python-installatie, `pytest`, `alembic check`, formatter of beveiligingsscan. De lokale `ruff`-instelling bestaat, maar Ruff is niet geïnstalleerd in de gebruikte ontwikkelomgeving.

**Teststatus.** GitHub Pages-build: geslaagd. Backendtests: 6 geslaagd. Schone migratietest: geslaagd. Lokale TypeScript typecheck is na herhaalde lange runtime afgebroken en is dus niet als geslaagd geregistreerd.

**Aanbeveling.** Maak een getrackte CI-workflow voor backendtests, Alembic schema check op een schone database, TypeScript check, frontendbuild en dependency-audit. Laat deployment pas na die checks plaatsvinden.

### DD-10 — Bronplicht is UX, geen technische poort

**Bewijs.** De analyse maakt altijd een demo-bron aan. Een expertreview accepteert een vrij `final_answer` en reviewitems zonder bronverplichting. Er is geen validatie die een stellige conclusie blokkeert wanneer bronnen of essentiële feiten ontbreken.

**Impact.** De productbelofte “geen bron, geen stellige conclusie” kan niet worden gecontroleerd of gemeten.

**Aanbeveling.** Maak conclusies afzonderlijke records met certainty, source links en missing-fact dependencies. Vereis per definitieve conclusie minstens één bron of een expliciete `insufficient evidence` status.

### DD-11 — Frontend is functioneel maar monolithisch

**Bewijs.** [page.tsx](/Users/oliviervos/Library/Mobile%20Documents/com~apple~CloudDocs/AA%20Ondernemen/AI%20check%20advies%20platform/frontend/app/page.tsx:1) telt 2.166 regels en bevat seeddata, businesscase, routing, intake, jobboard, detail, betalingen en review in één clientcomponent.

**Impact.** Nieuwe state-overgangen vergroten de kans op onbedoelde UI-regressies. De GitHub Pages-fallback en de lokale servermodus kunnen bovendien uit elkaar lopen.

**Aanbeveling.** Splits in route-/featurecomponenten: `intake`, `case-detail`, `jobboard`, `review`, `admin`, `businesscase`, `api-client` en gedeelde status-/badgecomponenten. Houd demo-data expliciet gescheiden van serverdata.

### DD-12 — Repository is niet de volledige lokale werkstaat

**Bewijs.** Niet-getrackt zijn onder meer `.env.example`, `.github/workflows/ci.yml`, `README.md`, `backend/`, `docker-compose.yml`, `docs/README.md`, `fly.toml`, `frontend/Dockerfile`, `frontend/app/chat/`, `frontend/app/components/`, `frontend/app/hooks/` en `frontend/tailwind.config.js`.

**Impact.** Een clone van GitHub reproduceert mogelijk niet de lokale ontwikkeling. Er bestaan bovendien twee mogelijke backendlocaties (`server/` getrackt en `backend/` lokaal), wat de bron van waarheid onduidelijk maakt.

**Aanbeveling.** Vergelijk deze bestanden later bewust met de getrackte architectuur. Kies één canonieke backend, één README en één CI-pad. Commit alleen na gerichte review; de bestanden zijn tijdens deze audit ongemoeid gelaten.

## Privacybeoordeling

De huidige regex-anonimisering is een bruikbare demo-voorfilter, geen productie-anonimisering. Namen worden alleen in een beperkt aantal tekstcontexten herkend; bedrijfsnamen alleen na een expliciet label. Andere Nederlandse of buitenlandse naamvormen, adressen, bedrijfsnamen en gevoelige gegevens kunnen doorheen komen. De zichtbare lokale jobboard-casus met `Jan Test` laat ook zien dat reeds gepubliceerde data actief moet worden herzien wanneer regels veranderen.

Documentupload is in de getrackte backend niet geïmplementeerd. Dat voorkomt nu een extra opslagrisico, maar betekent dat de productbelofte hierover niet kan worden getest.

**Privacybesluit:** uitsluitend fictieve data blijven gebruiken. Geen echte persoonsgegevens invoeren totdat DD-01 t/m DD-04 zijn opgelost en een privacy-/securityreview is uitgevoerd.

## Status- en betaalflowbeoordeling

| Stap | Huidige beoordeling |
| --- | --- |
| Intake → structureren → publiceren | Functioneel getest, maar onbeveiligd. |
| Claim → klantkeuze → basisbetaling | Functioneel getest, maar onbeveiligd en niet idempotent. |
| Review → definitief antwoord | Functioneel getest, maar bron- en actorcontrole ontbreekt. |
| Aanvullende informatie → toeslag | Functioneel getest op noodzakelijke/niet-noodzakelijke regel, maar menselijke prijsgoedkeuring, weigeren en conflictpad ontbreken. |
| Afsluiten / annuleren | Niet geïmplementeerd. |

## AI en rule-engine

De keuze dat AI geen fee zelfstandig wijzigt is juist. De huidige rule-engine is alleen geschikt als uitlegbare demo-triage. Zij moet later achter een interface komen die ten minste `suggestion`, `confidence`, `evidence`, `policy_version` en `human_decision` vastlegt.

Een AI-classificatie mag helpen om een ontbrekend feit te herkennen, maar mag niet zelfstandig:

- een opdrachtprijs verhogen;
- een casus publiceren;
- een definitief fiscaal antwoord leveren;
- bronstatus of juridische zekerheid opwaarderen;
- persoonsgegevens vrijgeven.

## Deployment en operationele beoordeling

De Pages-site op `https://oli4vos.github.io/Advies-ipc/` leverde tijdens de audit HTTP 200 en geen console-errors in de gecontroleerde pagina. De site toont terecht de publieke-demo-waarschuwing. GitHub Pages is echter uitsluitend een client-side demonstratie; FastAPI, SQLite, authenticatie en betaling draaien daar niet.

De lokale UI bevatte bij de smoke-test acht zichtbare casussen: serverpersistente records worden naast frontend seeddata getoond. Dit is nuttig voor ontwikkeling, maar niet deterministisch voor een demo en vergroot het risico dat oude testdata terugkeert.

## Uitgevoerde controles

| Controle | Resultaat |
| --- | --- |
| Git status en remote | `main` is gelijk aan `origin/main`; 12 bestaande niet-getrackte groepen geïnventariseerd. |
| Backendtests | 6 geslaagd. |
| Python compileall | Geslaagd. |
| Schone SQLite-migratie upgrade/downgrade/upgrade | Geslaagd. |
| Alembic check op actuele lokale database | Mislukt: actuele schema-drift op `payments`. |
| GitHub Pages-build voor `891b49f` | Geslaagd. |
| npm production dependency-audit | 0 kwetsbaarheden. |
| Lokale TypeScript check | Niet afgerond; proces bleef hangen en is afgebroken. |
| Lokale Ruff-check | Niet beschikbaar in de gebruikte Pythonomgeving. |
| Browser smoke-test publieke demo | Geen console errors; demo-waarschuwing zichtbaar. |
| Browser smoke-test lokale jobboard | Geen console errors; oude gepubliceerde testcasus bevatte zichtbare naam. |
| Anonieme API-read test | Originele casus, externe AI-input en auditlog waren zonder credentials opvraagbaar. |

## Herstelvolgorde

### Bouwblok 1 — P0 security, privacy en migratiegezondheid

1. Verwijder `create_all` uit de runtime en herstel de lokale demo-database via een gecontroleerde migratie of heropbouw.
2. Voeg identity-context, roles en objectautorisatie toe.
3. Maak publiek-, klant-, expert- en beheerresponse schemas strikt verschillend.
4. Verwijder originele tekst, externe AI-input, auditlog en betalingsinformatie uit publieke routes.
5. Anonimiseer externe AI-input en voer een her-anonimiseringsscan uit op bestaande demo-records.
6. Voeg CI toe voor Python, migraties, frontendtypecheck en frontendbuild.

### Bouwblok 2 — Transacties en gecontroleerde workflow

1. Centraliseer statusovergangen in één policy/state-machine.
2. Voeg `CANCELLED`, `CLOSED`, fee-weigering en herstelpaden toe.
3. Voeg idempotency-keys, optimistic locking en een payment-ledger toe.
4. Toon basisfee, toeslagen en totaalbedrag afzonderlijk aan klant en beheerder.

### Bouwblok 3 — Datagovernance en advieskwaliteit

1. Voeg consent, retention, verwijdering en trainingsgeschiktheid toe.
2. Maak claims, bronnen, onzekerheid en expertcorrecties volledig koppelbaar.
3. Blokkeer definitieve conclusies zonder bron of expliciete onzekerheidsstatus.
4. Splits de frontend in featurecomponenten en maak demo-state resetbaar/deterministisch.

## Go/no-go

| Gebruikssituatie | Oordeel |
| --- | --- |
| Publieke fictieve GitHub Pages-pitch | **Go**, mits de bestaande waarschuwing zichtbaar blijft. |
| Lokale interne productdemo met uitsluitend fictieve data | **Voorwaardelijke go**, na herstel van de lokale migratiedrift. |
| Test met echte persoonsgegevens of echte fiscale dossiers | **No-go**. |
| Betaalde pilot of echte betaalprovider | **No-go**. |
| Hergebruik voor modeltraining | **No-go** totdat governance en toestemming zijn geïmplementeerd. |

De eerstvolgende implementatie moet daarom niet een nieuwe marketplacefunctie zijn, maar **bouwblok 1: security, privacy en migratiegezondheid**.
