# Fiscale Lijn server

Dit is de server-authoritative verticale MVP-slice. De bestaande statische GitHub Pages-demo blijft zonder backend werken; lokaal kan de frontend via deze API echte SQLite-persistentie gebruiken.

## Starten

```bash
cd server
python3 -m venv .venv
. .venv/bin/activate
pip install -e '.[dev]'
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Open daarna de frontend op poort 3001:

```bash
cd frontend
npm run dev -- --port 3001
```

De frontend kiest op `localhost` automatisch `http://localhost:8000/api/v1`. Op GitHub Pages blijft fictieve client-side demo-data actief.

## Belangrijkste endpoints

- `POST /api/v1/cases` — intake, mockstructurering, anonimisering en provenance;
- `GET /api/v1/cases/{id}` — volledige gestructureerde casus;
- `GET /api/v1/cases/{id}/anonymisation-preview` — origineel versus geanonimiseerd;
- `POST /api/v1/cases/{id}/confirm-structure` — klantbevestiging;
- `POST /api/v1/admin/cases/{id}/publish` — server-side publicatiegate;
- `GET /api/v1/jobboard` — uitsluitend gepubliceerde casussen;
- `GET /api/v1/admin/audit-logs` — metadata-auditlog zonder volledige fiscale teksten.

## Testen

```bash
cd server
. .venv/bin/activate
pytest
```

Alle analyse is lokaal en voorspelbaar. Er wordt in deze fase geen externe AI-provider, betaalprovider of documentopslag aangeroepen.

## Demo-aanmelding

De API accepteert in de lokale demo alleen een expliciete Bearer-token. Dit is
geen productie-authenticatie, maar voorkomt dat een schermrol automatisch
toegang geeft tot alle casussen. Gebruik uitsluitend lokaal:

- `Bearer demo-customer` voor de klantdemo;
- `Bearer demo-advisor` voor de adviseurdemo;
- `Bearer demo-admin` voor beheerderscontrole.

De API weigert deze demo-identiteiten buiten `local`, `test` of `demo`. Een
productie-identiteitsprovider moet deze adapter vervangen voordat een server
extern beschikbaar komt.
