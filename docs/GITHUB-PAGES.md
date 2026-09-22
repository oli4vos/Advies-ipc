# GitHub Pages

## Website-URL

Na een geslaagde GitHub Actions-run is de frontend beschikbaar op:

https://oli4vos.github.io/Advies-ipc/

De repository en broncode staan op:

https://github.com/oli4vos/Advies-ipc

## Werkwijze

Elke push naar `main` start `.github/workflows/deploy-pages.yml`. Die workflow:

1. installeert de frontend-dependencies;
2. bouwt een statische Next.js-export;
3. uploadt `frontend/out` als Pages-artifact;
4. publiceert het artifact naar GitHub Pages.

## Lokaal ontwikkelen

```bash
cd frontend
npm install
npm run dev -- --port 3001
```

Open daarna http://localhost:3001.

## Belangrijke beperking

GitHub Pages draait alleen statische frontendbestanden. De huidige demo gebruikt client-side mockdata. De FastAPI-backend, SQLite-database, echte AI-provider en betalingen moeten later op een aparte backend-hostingomgeving worden geplaatst.
