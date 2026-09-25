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

De publieke site demonstreert de MKB-eerst klantreis: vrije belastingvraag, gratis routecheck, privacybevestiging, vaste demoprijs, expertsuggestie, mockbetaling en gecontroleerd eindantwoord. De adviseur-, beheer- en investeerdersomgevingen zijn via de demorol of footer bereikbaar, maar staan buiten de primaire klantnavigatie.

## Lokaal ontwikkelen

```bash
cd frontend
npm install
npm run dev -- --port 3001
```

Open daarna http://localhost:3001.

Gebruik Node.js 20 of nieuwer. Op machines met meerdere Node-installaties moet `node -v` in de map `frontend` ook daadwerkelijk versie 20 of hoger tonen.

## Belangrijke beperking

GitHub Pages draait alleen statische frontendbestanden. De huidige demo gebruikt client-side mockdata en browseropslag voor continuïteit na refresh. Dat is geen veilige dossieropslag: voer uitsluitend fictieve gegevens in. Bestandsinhoud wordt niet geüpload; de demo bewaart alleen lokale bestandsmetadata.

De FastAPI-backend, database, productie-authenticatie, private documentopslag, echte AI-provider en providergebonden betalingen moeten op een aparte beveiligde omgeving worden geplaatst. GitHub Pages mag ook later nooit echte belastingdossiers verwerken.
