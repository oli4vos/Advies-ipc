# Productie-readiness

## Doel

De lokale MVP en GitHub Pages-demo mogen niet worden verward met een omgeving
waarin echte fiscale casussen, persoonsgegevens, documenten of betalingen veilig
kunnen worden verwerkt. Dit document beschrijft wat nu technisch is afgedekt en
wat nog nodig is voordat een beperkte betaalde pilot kan starten.

## Nu geïmplementeerd

- Productie/staging start fail-closed als PostgreSQL, private storage, expliciete
  hosts/CORS of OIDC-instellingen ontbreken.
- Demo-Bearer-tokens werken uitsluitend in `local`, `test` en `demo`.
- Productie-authenticatie heeft een OIDC-adapter die JWT-signaturen, issuer,
  audience, vervaldatum en subject controleert. Rollen worden alleen uit
  vertrouwde claims gelezen.
- Gebruikers worden op de identity-provider-subjectwaarde gekoppeld via
  migratie `0006_identity_provider_binding`.
- Publieke API-documentatie wordt in staging/productie uitgeschakeld.
- Trusted hosts, standaard security headers en een request-limiet zijn actief.
- `/health` en `/ready` maken verschil tussen procesgezondheid en
  database-readiness.
- De bestaande audit- en statuslaag blijft onderdeel van de domeinflow.
- De publieke GitHub Pages-site blijft een fictieve, client-side demo met een
  expliciete fictieve-data-gate; hij is geen productiefrontend.
- `server/` is de canonieke FastAPI-backend voor deze repository. Losse,
  niet-getrackte backend/deploymentconcepten in de werkmap zijn niet gevalideerd
  en mogen niet als productiepad worden geactiveerd zonder aparte review.
- De casus-analyse loopt via een providergrens met de lokale deterministische
  rule-engine als standaard. Er wordt zonder expliciete providerimplementatie
  geen externe AI-call gedaan en dus geen AI-kosten gemaakt.
- OIDC-sessies voor `ADMIN` en `ADVISOR` vereisen server-side een bevestigde
  MFA-assurance claim (`aal2`). Dit is de afdwingingslaag; het koppelen van een
  echte identity-provider en TOTP-enrollment blijft een aparte configuratie- en
  acceptatietaak.

## Kostenloze uitvoeringsroute

De MVP wordt in deze volgorde technisch opgebouwd zonder betaalde API-calls:

1. **Lokaal betrouwbaar maken.** SQLite, de mockprovider, fictieve demo-accounts
   en de bestaande API-tests blijven de standaard voor ontwikkeling.
2. **Providergrenzen sluiten.** AI-output komt alleen via
   `server/app/services/ai_provider.py`; een toekomstige provider moet dezelfde
   analyse-uitkomst, provenance, privacytests en kostenlimieten respecteren.
3. **Auth voorbereiden.** De backend vertrouwt geen frontendrol. In productie
   komen rollen uit een geverifieerde OIDC-claim en krijgen adviseurs/beheerders
   alleen toegang met `aal2`.
4. **Staging zonder klantdata.** Gebruik PostgreSQL, een test-identity-provider
   en private opslag met synthetische casussen. Test eigenaarschap, MFA,
   anonimisering, statusovergangen en herstel voordat een betaalde pilot start.
5. **Pas daarna externe diensten activeren.** Eerst een providerbudget en
   dataverwerkingsovereenkomst vastleggen; daarna kan een AI-adapter worden
   toegevoegd zonder de domeinworkflow te wijzigen.

De lokale mockprovider is daarmee geen tijdelijke losse demo-code, maar het
kostenloze contract waarmee alle toekomstige AI-providers vooraf getest worden.

## Nog verplicht vóór echte klantdata

### P0 — infrastructuur en toegang

1. Maak een aparte production/staging identity-provider aan en configureer
   OIDC-claims voor `CUSTOMER`, `ADVISOR` en `ADMIN`. Test account recovery,
   MFA, sessie-expiratie en offboarding.
2. Provision PostgreSQL met encrypted backups, least-privilege credentials,
   TLS en een gecontroleerd migratieproces.
3. Kies private object storage voor documenten met short-lived signed URLs,
   malware-scan, type/size allowlist en retention/deletion jobs. Nooit publieke
   bucket-URLs gebruiken.
4. Plaats de API achter TLS, een WAF/reverse proxy en rate limiting. De huidige
   requestlimiet is geen vervanging voor abuse-preventie op meerdere replicas.
5. Voeg secrets management, structured logs, uptime/latency/error monitoring,
   alerts en een incident/runbook toe.

### P0 — privacy en fiscale kwaliteit

1. Leg verwerkingsdoelen, grondslagen, bewaartermijnen, verwijdering,
   subverwerkers en verwerkersovereenkomsten vast; voer een DPIA uit waar nodig.
2. Laat expertidentiteit, NOB/RB-status, beroepsaansprakelijkheid,
   bevoegdheid en belangenconflicten handmatig verifiëren voordat een expert
   betaalde opdrachten ziet.
3. Maak een gecontroleerde bronlaag: bronversie, datum, conclusie, onzekerheid
   en ontbrekende feiten moeten aan het antwoord gekoppeld blijven.
4. Houd klantinput, extern aangeleverde AI-output, platform-AI,
   expertcorrecties en definitief antwoord als afzonderlijke provenance-lagen.
   Gebruik trainingsdata alleen na tweede anonimisering, expliciete toestemming
   of andere gedocumenteerde grondslag, kwaliteitslabel en opt-out.

### P1 — geldstromen en operationele volledigheid

1. Integreer pas na juridische/boekhoudkundige beoordeling een betaalprovider
   met webhook-signature verification, idempotency keys, refunds, chargebacks,
   ledger en reconciliation.
2. Voeg voorwaarden, privacyverklaring, cookie-/analyticskeuzes,
   aansprakelijkheidsgrenzen, facturatie en klachten-/geschilproces toe.
3. Voeg cancel/close/refund/conflict workflows, optimistic locking en
   notificatieherstel toe.
4. Voer een onafhankelijke security review uit en test backups, restore,
   autorisatie per object, PII leakage, uploadmisbruik en rate-limit bypass.

## Staging-gate

Een staging-release is pas geslaagd wanneer alle volgende controles groen zijn:

```bash
cd server
pip install -e '.[dev]'
alembic upgrade head
alembic check
pytest
python -m compileall -q app migrations
```

Daarnaast moet met een echte test-identity-provider worden vastgesteld dat:

- een klant alleen eigen casussen ziet;
- een adviseur uitsluitend geanonimiseerde gepubliceerde casussen ziet;
- een niet-geselecteerde adviseur geen review- of klantinformatie kan lezen;
- een beheerder elke publicatie- en statuswijziging terug kan vinden;
- verlopen, verkeerde audience/issuer en verkeerd ondertekende tokens worden
  geweigerd;
- `/docs` en `/openapi.json` niet publiek beschikbaar zijn;
- `/ready` faalt wanneer de database niet beschikbaar is.

## Bewuste grens

Deze commit maakt de backend production-aware en voorkomt een gevaarlijke
half-productieconfiguratie. Hij maakt nog geen productieplatform op zichzelf:
provideraccounts, private storage, juridische basis, monitoring, expert-KYC en
betalingen vereisen externe keuzes en mogen niet met fictieve defaults worden
geactiveerd.
