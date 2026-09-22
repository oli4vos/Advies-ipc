# Productprompt: rommel naar controleerbare fiscale casus

## Doel

Bouw de klantflow rond de realiteit dat klanten geen nette intake invullen. Ze plakken e-mails, losse notities, documenten en eerder gegenereerde AI-antwoorden. Het platform moet dit materiaal lokaal structureren en beoordelen voordat een casus op het adviseursjobboard verschijnt.

## Gewenste flow

1. De klant plakt vrijuit alles wat relevant lijkt in één groot invoerveld.
2. De klant kan optioneel documenten en een extern AI-antwoord toevoegen.
3. De lokale analyse maakt een voorstel voor titel, samenvatting, concrete vraag, tijdlijn, feiten, partijen, fiscale categorie, specialisaties en complexiteit.
4. Het systeem markeert per onderdeel de bron: klanttekst, document, extern AI-antwoord, afgeleid of onzeker.
5. Het systeem toont ontbrekende feiten, tegenstrijdigheden, privacyrisico's en onbewezen claims.
6. De klant controleert de structuur met eenvoudige acties: klopt, aanpassen, weet ik niet, niet relevant.
7. Pas na bevestiging kan de casus naar beheercontrole en het jobboard.

## Belangrijke UX-regels

- Vraag de klant niet om vooraf zelf een fiscale categorie, professionele samenvatting of complexiteit te bepalen.
- Toon geen AI-conclusie alsof die al advies is.
- Houd een extern AI-antwoord altijd apart van de platformanalyse.
- Geef elk ontbrekend feit een reden en een urgentie.
- Toon voor publicatie een duidelijk anonimiseringsvoorbeeld.
- Geef adviseurs een triagekaart met kernvraag, feiten, onzekerheden, bronnen en verwachte inspanning.
- Maak de status voor de klant concreet: wat is er gebeurd en wie moet nu iets doen?

## Acceptatiecriteria voor deze iteratie

- De intake heeft één primair vrij tekstveld.
- Een klant kan een extern AI-antwoord apart plakken.
- Na indienen ziet de klant eerst een gestructureerde casuscontrole.
- De controle toont vastgestelde feiten, ontbrekende informatie en aandachtspunten.
- De klant kan bevestigen dat de structuur klopt.
- De casus blijft tot die bevestiging in `PENDING_REVIEW`.
- De adviseur blijft alleen de geanonimiseerde, gestructureerde versie zien.

## Technische richting

Gebruik een adapter voor de lokale analyse zodat later een echte AI-provider kan worden aangesloten. Leg naast de ruwe tekst ook gestructureerde feiten vast met bron, confidence, bevestiging door klant en verplichte status. Leg tegenstrijdigheden en privacyrisico's als afzonderlijke issues vast.
