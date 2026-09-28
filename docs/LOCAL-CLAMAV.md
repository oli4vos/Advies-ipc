# Lokale ClamAV-scan

De productieachtige uploadflow kan lokaal ClamAV gebruiken zonder cloud- of
API-kosten. De Python-backend praat via het lokale `INSTREAM`-protocol met een
ClamAV-daemon. De bestanden verlaten de machine niet.

## Starten

```bash
docker compose -f docker-compose.clamav.yml up -d
```

Wacht bij de eerste start totdat ClamAV zijn virusdatabase heeft geladen. Stel
daarna voor de lokale backend in:

```bash
export FISCALE_MALWARE_SCANNER=clamav
export FISCALE_CLAMAV_HOST=127.0.0.1
export FISCALE_CLAMAV_PORT=3310
```

Als ClamAV niet bereikbaar is, wordt een upload geweigerd met status
`UNAVAILABLE`; bestanden worden nooit downloadbaar gemaakt. De standaard
`mock-local`-scanner blijft alleen bedoeld voor unit-tests en ontwikkeling
zonder Docker.

Gebruik het EICAR-testbestand uitsluitend in een lokale testomgeving. Het is
geen malware, maar een gestandaardiseerde antivirus-teststring.
