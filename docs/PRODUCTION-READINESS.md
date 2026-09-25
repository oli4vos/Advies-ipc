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
