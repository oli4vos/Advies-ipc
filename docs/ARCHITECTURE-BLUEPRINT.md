# Architectuurblauwdruk — Fiscaal adviesplatform

Status: richtinggevend ontwerp  
Versie: 1.3
Datum: 22 september 2026

## 1. Doel van dit document

Dit document beschrijft de samenhang van het volledige platform: productrollen, domeinen, data, statussen, frontend, backend, privacy, AI, menselijke feedback, toekomstige trainingsdata, matching, betalingen, documenten, deployment en teststrategie.

De blauwdruk maakt steeds onderscheid tussen:

- **publieke demo**: de huidige statische GitHub Pages-interface met fictieve data;
- **lokale MVP**: frontend plus lokale FastAPI-backend en SQLite;
- **productieplatform**: beveiligde hosting, echte authenticatie, database, betalingen en documentopslag.

De publieke demo mag nooit echte fiscale dossiers of persoonsgegevens verwerken.

## 2. Productdefinitie

Het platform is geen chatbot. Het is een gecontroleerde fiscale marketplace waarin:

1. een klant ongestructureerde informatie aanlevert;
2. het platform de informatie structureert en anonimiseert;
3. de klant de feitelijke structuur bevestigt;
4. een opdracht op een jobboard wordt gepubliceerd;
5. passende adviseurs een besloten aanbod doen;
6. de klant uit maximaal drie aanbevolen adviseurs kiest;
7. de gekozen adviseur de opdracht exclusief krijgt en de klant betaalt;
8. de adviseur AI-output, bronnen en feiten controleert;
9. de klant een menselijk gecontroleerd antwoord ontvangt.

De kernbelofte is: **rommelige klantinput wordt omgezet in een controleerbare fiscale casus, zonder te doen alsof AI zelfstandig fiscaal advies geeft.**

### 2.1 Juridisch en commercieel model

Het gekozen uitgangspunt is dat het platform **bemiddelaar** is en geen verstrekker van het fiscale advies.

- De overeenkomst voor het fiscale advies ontstaat tussen klant en adviseur.
- De adviseur blijft inhoudelijk verantwoordelijk voor het definitieve advies en moet passende beroepsaansprakelijkheid hebben.
- Het platform faciliteert intake, matching, selectie, betaling, facturatie, communicatie en dossierworkflow.
- Het platform mag de factuur namens de adviseur opstellen en verzenden als dit contractueel, fiscaal en administratief correct is ingericht.
- De factuur voor de adviesdienst vermeldt de adviseur als leverancier; het platform is verzendende en administratieve tussenpartij.
- De platformvergoeding wordt afzonderlijk overeengekomen en gefactureerd of als transparante application fee ingehouden.
- Het platform houdt zelf geen gelden buiten een gereguleerde betaalprovider om.

Dit model moet vóór een pilot worden gevalideerd door een Nederlandse jurist en fiscalist/accountant. De architectuur legt het bedoelde model vast, maar is geen juridisch of fiscaal advies.

## 3. Architectuurprincipes

1. **Server is gezaghebbend**  
   Statussen, betalingen, claims en definitieve adviezen worden in productie nooit uitsluitend in browserstate bewaard.

2. **Ruwe input en afgeleide informatie blijven gescheiden**  
   Originele klanttekst, gestructureerde feiten, geanonimiseerde tekst, externe AI-output en platform-AI-output zijn afzonderlijke records.

3. **Menselijke controle is een harde poort**  
   AI-output kan nooit direct als definitief fiscaal advies worden geleverd.

4. **Geen bron, geen stellige conclusie**  
   Claims hebben bronverwijzingen, zekerheidsniveau en ontbrekende feiten.

5. **Privacy by design**  
   Adviseurs zien alleen gegevens die noodzakelijk zijn voor beoordeling en uitvoering.

6. **Uitlegbare regels vóór ondoorzichtige ranking**  
   Matching, prijsindicatie en complexiteit starten met controleerbare regels.

7. **Adapters rond externe diensten**  
   AI, betalingen, opslag, authenticatie en notificaties zijn vervangbare interfaces.

8. **Modulaire monoliet vóór microservices**  
   Eén backendapplicatie met domeingrenzen is voor de eerste productfase eenvoudiger te testen, beveiligen en beheren.

9. **Python is de enige backendtaal**
   Alle server-side businesslogica, autorisatie, workflows en providerintegraties worden gebouwd in Python met FastAPI. Next.js bevat geen backendbusinesslogica en Supabase Edge Functions worden niet gebruikt.

10. **Auditbaarheid is onderdeel van het domein**
   Belangrijke wijzigingen krijgen actor, tijdstip, reden en oude/nieuwe waarde.

11. **Herkomst vóór hergebruik**
   Elk inhoudelijk artefact legt vast of het afkomstig is van een klant, expert, externe AI, platform-AI, deterministische regel of externe bron. AI-output wordt nooit overschreven door menselijke correcties: beide versies en hun onderlinge relatie blijven afzonderlijk en reproduceerbaar bewaard. Operationele feedback wordt niet automatisch trainingsdata.

11. **Demo en productie zijn verschillende risicoklassen**
    GitHub Pages is uitsluitend een publieke productdemo.

## 4. Systeemlandschap

```mermaid
flowchart LR
    C[Klant] --> FE[Next.js frontend]
    E[Fiscaal adviseur] --> FE
    A[Beheerder] --> FE

    FE --> API[FastAPI modulaire monoliet]
    API --> DB[(PostgreSQL productie<br/>SQLite lokaal)]
    API --> OBJ[(Private documentopslag)]
    API --> AI[AI-provider adapter]
    API --> PAY[Payment adapter]
    API --> AUTH[Authenticatieprovider]
    API --> MSG[Notificatie adapter]

    API --> AUDIT[Auditlog en statusgeschiedenis]

    DEMO[GitHub Pages demo] -. fictieve client-state .-> C
```

### Huidige situatie

- De live GitHub Pages-site bevat een statische Next.js-export.
- Rollen, casussen, betaling en review draaien daar in React client-state.
- Data verdwijnt bij refresh.
- Er is geen echte authenticatie, database, anonimisering of beveiligde opslag.
- De bestaande FastAPI-code is nog niet gekoppeld aan de live frontend.
- De GitHub Pages-workflow publiceert alleen de frontend.

### Doelsituatie

- Frontend consumeert uitsluitend versieerbare REST-endpoints.
- Backend valideert elke statusovergang en autorisatie.
- Database bewaart domeindata en append-only historie.
- Documenten staan privé in objectopslag; nooit in een publieke map.
- Externe diensten zijn via adapters vervangbaar.

## 5. Rollen en autorisatie

### Klant

Mag:

- eigen ruwe input en documenten aanleveren;
- eigen gestructureerde en geanonimiseerde casus controleren;
- ontbrekende vragen beantwoorden;
- eigen betaalverzoek afhandelen;
- eigen definitieve advies en historie bekijken.

Mag niet:

- andere klantcasussen zien;
- ongeanonimiseerde data van anderen zien;
- een gepubliceerde opdracht buiten gecontroleerde correctie wijzigen;
- een expertclaim of reviewstatus aanpassen.

### Adviseur

Mag:

- gepubliceerde geanonimiseerde opdrachten bekijken;
- passende opdracht accepteren;
- na betaling de toegewezen reviewomgeving gebruiken;
- ontbrekende informatie opvragen;
- een definitief advies indienen.

Mag niet:

- originele identificerende klantinput bekijken, tenzij expliciet noodzakelijk en geautoriseerd;
- niet-toegewezen betaalde dossiers openen;
- eigen betaling of platformaudit wijzigen;
- een definitief antwoord indienen zonder verplichte controles.

### Beheerder

Mag:

- anonimisering en structurering controleren;
- publicatie pauzeren, goedkeuren of sluiten;
- adviseurs en specialisaties beheren;
- testbetalingen en statussen beheren;
- auditlogs inzien.

Beheerrechten worden later opgesplitst in support, compliance en platformbeheer als het team groeit.

## 6. Domeinmodules

De backend blijft één deploybare applicatie, maar wordt intern verdeeld in modules.

### 6.1 Identity & Access

Verantwoordelijk voor:

- gebruikersidentiteit;
- rollen en permissies;
- klant- en expertprofielen;
- expertverificatie;
- sessies en auditcontext.

### 6.2 Case Intake

Verantwoordelijk voor:

- ruwe klantinput;
- externe AI-antwoorden;
- documentmetadata;
- gestructureerde feiten;
- concrete adviesvraag;
- bevestiging door de klant.

### 6.3 Privacy & Anonymisation

Verantwoordelijk voor:

- PII-detectie;
- placeholders en redacties;
- handmatige correcties;
- scheiding originele en adviseurzichtbare tekst;
- publicatieblokkade bij onopgeloste privacyrisico's.

### 6.4 Analysis & Evidence

Verantwoordelijk voor:

- casussamenvatting;
- specialisatietags;
- complexiteit en tijdsinschatting;
- AI-conceptantwoord;
- claims, bronnen en zekerheid;
- ontbrekende feiten en tegenstrijdigheden.

### 6.5 Marketplace & Matching

Verantwoordelijk voor:

- jobboardquery's en filters;
- uitlegbare matchscore;
- expertvoorkeuren;
- besloten aanbiedingen van adviseurs;
- selectie van maximaal drie passende kandidaten voor de klant;
- geverifieerde reviews uit betaalde en afgeronde opdrachten;
- klantselectie en exclusieve toewijzing;
- reactietermijnen, aanbodverloop en betaal-time-outs.

De bieding is geen openbare veiling. Adviseurs zien elkaars prijs niet en kunnen elkaar niet live onderbieden. Dit beperkt een race naar de laagste prijs en houdt kwaliteit, specialisatie en betrouwbaarheid zichtbaar.

### 6.6 Payments

Verantwoordelijk voor:

- betaalverzoek na klantselectie;
- providerreferentie;
- webhookverwerking;
- idempotentie;
- refunds en mislukte betalingen;
- application fee voor het platform;
- uitbetaling aan de adviseur via de betaalprovider;
- scheiding payment status en case status;
- koppeling tussen betaaltransactie en facturen.

Het voorkeursmodel is **Mollie Connect for Platforms**: de adviseur is payment owner, terwijl het platform betalingen initieert en een application fee kan ontvangen. Dit past beter bij de rol van bemiddelaar dan Mollie Connect for Marketplaces, waarbij het platform de payment owner en eerste lijn voor refunds en disputes wordt.

### 6.7 Expert Review & Delivery

Verantwoordelijk voor:

- beoordeling per claim of onderdeel;
- correcties en toelichtingen;
- aanvullende klantvragen;
- definitief antwoord;
- levering en sluiting.

### 6.8 Documents

Verantwoordelijk voor:

- private uploads;
- malwarecontrole;
- type- en groottelimieten;
- tijdelijke downloadlinks;
- documenttoegang per rol;
- retentie en verwijdering.

### 6.9 Notifications

Verantwoordelijk voor:

- in-app notificaties;
- e-mailadapter;
- templates;
- voorkeuren;
- retries en afleverstatus.

### 6.10 Administration & Audit

Verantwoordelijk voor:

- statuscorrecties met reden;
- beheeracties;
- auditlog;
- test- en demofuncties;
- operationele dashboards.

### 6.11 Feedback, Provenance & Learning

Verantwoordelijk voor:

- ondubbelzinnige classificatie van klantinput, AI-output, menselijke feedback en externe bronnen;
- onveranderlijke versies en afleidingsrelaties tussen feiten, claims, antwoorden en correcties;
- fijnmazige expertannotaties per claim, passage, bron en ontbrekend feit;
- scheiding tussen inhoudelijke correcties, stijlwijzigingen en procesfeedback;
- adjudicatie wanneer experts elkaar tegenspreken;
- toestemming, juridische grondslag, gebruiksdoel en uitsluitingen voor hergebruik;
- tweede anonimisering en kwaliteitscontrole vóór data-export;
- reproduceerbare evaluatie- en trainingsdatasets met versies, manifesten en hashes;
- meetbare vergelijking van modelversies zonder dat productiefeedback direct een model wijzigt.

Deze module is in de operationele applicatie alleen een registratie- en selectielaag. Modeltraining gebeurt nooit in de requestflow van de FastAPI-app en krijgt later een afzonderlijke, gecontroleerde pipeline en opslagomgeving.

## 7. Kerngegevensmodel

### Identiteit

#### User

- `id`
- `email`
- `role`
- `status`
- `auth_provider_id`
- `created_at`
- `updated_at`

#### CustomerProfile

- `user_id`
- `display_name`
- `preferred_contact_method`
- `client_preferences`

#### ExpertProfile

- `user_id`
- `advisor_type`
- `experience_level`
- `minimum_fee`
- `average_response_minutes`
- `active`
- `region`
- `client_type_preferences`
- `complexity_preferences`

#### Specialization / ExpertSpecialization

Normaliseert fiscale disciplines en expertvaardigheden. Tags worden niet als vrije tekst gebruikt voor kritieke matchingregels.

### Intake en structurering

#### Case

- `id`
- `customer_id`
- `title`
- `category`
- `client_type`
- `tax_year`
- `urgency`
- `complexity`
- `estimated_minutes_min`
- `estimated_minutes_max`
- `offered_fee_cents`
- `deadline`
- `status`
- `created_at`
- `updated_at`
- `published_at`
- `claimed_at`
- `answered_at`
- `version`

`version` ondersteunt optimistic locking zodat twee acties niet stilzwijgend dezelfde status overschrijven.

#### RawCaseInput

- `case_id`
- `raw_text_encrypted`
- `submitted_by`
- `submitted_at`
- `input_version`

#### ExternalAIAnswer

- `case_id`
- `provider_label`
- `answer_text`
- `supplied_by_customer`
- `created_at`
- `assessment_status`

Dit record is nooit hetzelfde als het platform-AI-antwoord.

#### StructuredFact

- `case_id`
- `fact_type`
- `label`
- `value`
- `source_type` (`CUSTOMER_TEXT`, `DOCUMENT`, `EXTERNAL_AI`, `DERIVED`)
- `source_reference`
- `confidence`
- `customer_confirmation`
- `required_for_advice`

#### CaseIssue

- `case_id`
- `issue_type` (`MISSING_FACT`, `CONTRADICTION`, `PRIVACY_RISK`, `UNSUPPORTED_CLAIM`)
- `severity`
- `description`
- `resolution_status`
- `resolved_by`
- `resolved_at`

#### CaseSummary

- `case_id`
- `short_title`
- `summary`
- `concrete_question`
- `urgency`
- `generated_by`
- `confirmed_at`

#### AnonymizedCase

- `case_id`
- `anonymized_text`
- `redaction_map_encrypted`
- `review_status`
- `reviewed_by`
- `published_version`

De redaction map is alleen voor geautoriseerde beheerfuncties beschikbaar.

### Analyse, bronnen en herkomst

#### AIAnswer

- `id`
- `case_id`
- `ai_execution_id`
- `provider`
- `model`
- `prompt_version`
- `answer_text`
- `answer_schema_version`
- `input_snapshot_hash`
- `output_hash`
- `status`
- `generated_at`

Een AI-antwoord is immutable. Opnieuw genereren maakt een nieuw record; bestaande output wordt niet aangepast of vervangen.

#### AIClaim

- `id`
- `ai_answer_id`
- `claim_key`
- `claim_text`
- `certainty`
- `requires_missing_fact`
- `review_status`

#### Source

- `id`
- `title`
- `publisher`
- `source_type` (`LAW`, `POLICY_DECISION`, `PARLIAMENTARY_HISTORY`, `CASE_LAW`, `OFFICIAL_GUIDANCE`, `PROFESSIONAL_LITERATURE`)
- `authority_level` (`1` tot en met `6` volgens de bronhiërarchie)
- `jurisdiction`
- `citation`
- `version_or_date`
- `effective_from`
- `effective_until`
- `url`
- `retrieved_at`
- `content_hash_if_snapshotted`
- `official`
- `demo_only`
- `usage_rights_status`
- `full_text_storage_allowed`

Een URL alleen is geen stabiele bronverwijzing. Versie, geldigheidsperiode, ophaaldatum en waar toegestaan een hash van de gebruikte snapshot voorkomen dat een later gewijzigde pagina ongemerkt als hetzelfde bewijs geldt.

#### AIClaimSource

Koppelt conclusies aan één of meerdere bronnen. Zonder bron mag een claim niet als hoog-zeker worden gemarkeerd.

#### AIExecution

Legt één reproduceerbare AI-aanroep vast:

- `id`
- `case_id`
- `task_type` (`STRUCTURE`, `CLASSIFY`, `SUMMARISE`, `DRAFT`, `ASSESS_EXTERNAL`, `REDACT_SUGGESTION`)
- `provider`
- `model`
- `model_version_if_available`
- `prompt_template_id`
- `prompt_version`
- `parameters_json`
- `input_artifact_refs`
- `input_snapshot_hash`
- `output_schema_version`
- `output_hash`
- `started_at`
- `completed_at`
- `status`
- `cost_units`
- `retention_policy_applied`

De volledige prompt hoeft niet in gewone operationele logging te staan. Een beveiligde prompttemplate plus versie, inputreferenties en hashes maken de run reproduceerbaar zonder fiscale inhoud in logs te kopiëren.

#### ProvenanceRecord

Geeft elk inhoudelijk domeinobject een uniform herkomstlabel:

- `id`
- `case_id`
- `entity_type`
- `entity_id`
- `entity_version`
- `origin_type` (`CUSTOMER`, `EXPERT`, `PLATFORM_AI`, `EXTERNAL_AI`, `SYSTEM_RULE`, `ADMIN`, `IMPORTED_SOURCE`)
- `producer_user_id` indien menselijk;
- `ai_execution_id` indien door platform-AI gemaakt;
- `external_provider_label` indien extern aangeleverd;
- `creation_method` (`CREATED`, `EXTRACTED`, `DERIVED`, `CORRECTED`, `VERIFIED`, `IMPORTED`)
- `schema_version`
- `content_hash`
- `created_at`

`origin_type` zegt **wie of wat de inhoud produceerde**. Dit is iets anders dan `source_type`, dat zegt **welk bewijs een claim ondersteunt**.

#### ArtifactLineage

- `parent_provenance_id`
- `child_provenance_id`
- `relation_type` (`DERIVED_FROM`, `CORRECTS`, `VERIFIES`, `CONTRADICTS`, `CITES`, `SUMMARISES`, `SUPERSEDES`)
- `created_at`

Hiermee blijft bijvoorbeeld traceerbaar dat een definitieve expertpassage een specifieke AI-claim corrigeert, die claim is afgeleid uit drie bevestigde feiten en wordt ondersteund door twee bronversies.

#### HumanFeedbackAnnotation

De kleinste betekenisvolle eenheid van expertfeedback:

- `id`
- `case_id`
- `review_id`
- `expert_id`
- `target_entity_type`
- `target_entity_id`
- `target_entity_version`
- `target_claim_id` indien van toepassing;
- `text_span_start` en `text_span_end` indien passagegericht;
- `annotation_type` (`CORRECT`, `PARTIALLY_CORRECT`, `INCORRECT`, `UNSUPPORTED`, `MISSING_INFORMATION`, `OUTDATED_SOURCE`, `IRRELEVANT`, `STYLE_ONLY`)
- `severity`
- `rationale`
- `corrected_text`
- `expert_confidence`
- `created_at`
- `supersedes_annotation_id`
- `adjudication_status` (`UNREVIEWED`, `AGREED`, `DISPUTED`, `ADJUDICATED`, `REJECTED`)

Een correctie zonder rationale kan bruikbaar zijn voor de klant, maar is niet automatisch geschikt als kwaliteitslabel. `STYLE_ONLY` wordt strikt gescheiden van fiscaal-inhoudelijke fouten zodat een model niet leert dat twee equivalente formuleringen inhoudelijk tegenstrijdig zijn.

#### FeedbackSourceLink

- `annotation_id`
- `source_id`
- `source_version_or_date`
- `support_type` (`SUPPORTS_CORRECTION`, `REFUTES_ORIGINAL`, `CONTEXT_ONLY`)
- `pinpoint_reference`
- `verified_by_expert`

#### FeedbackAdjudication

- `id`
- `annotation_id`
- `adjudicator_expert_id`
- `decision`
- `rationale`
- `decided_at`

Adjudicatie is nodig bij conflicterende expertlabels, complexe of risicovolle onderwerpen en voorbeelden die in een gouden evaluatieset terechtkomen. De auteur van een annotatie mag deze niet zelf adjudiceren.

#### DataUsePermission

- `id`
- `case_id`
- `subject_type` (`CUSTOMER_CONTENT`, `EXPERT_FEEDBACK`, `DOCUMENT`, `EXTERNAL_AI_CONTENT`)
- `subject_id`
- `purpose` (`SERVICE_DELIVERY`, `QUALITY_ANALYSIS`, `EVALUATION`, `MODEL_TRAINING`)
- `status` (`ALLOWED`, `DENIED`, `WITHDRAWN`, `NOT_APPLICABLE`, `PENDING_LEGAL_REVIEW`)
- `legal_basis_reference`
- `terms_version`
- `granted_by_user_id`
- `granted_at`
- `withdrawn_at`
- `recorded_by`

Toestemming voor dienstverlening impliceert nooit toestemming voor modeltraining. Ook contractuele rechten van de expert en gebruiksrechten op externe AI-output en bronmateriaal worden afzonderlijk beoordeeld.

#### DatasetSnapshot

- `id`
- `name`
- `purpose` (`EVALUATION`, `PROMPT_REGRESSION`, `RANKING_EVALUATION`, `FINE_TUNING`)
- `dataset_version`
- `selection_policy_version`
- `schema_version`
- `created_by`
- `approved_by`
- `created_at`
- `manifest_hash`
- `storage_location`
- `status` (`DRAFT`, `VALIDATING`, `APPROVED`, `RETIRED`, `REVOKED`)

#### DatasetItem

- `dataset_snapshot_id`
- `source_entity_refs`
- `source_version_refs`
- `input_payload`
- `expected_output`
- `label_set`
- `split` (`TRAIN`, `VALIDATION`, `TEST`, `GOLDEN`)
- `inclusion_reason`
- `deidentification_run_id`
- `quality_status`
- `content_hash`
- `revoked_at`

Een datasetitem is een afgeleid, opnieuw geanonimiseerd exportobject en geen directe kopie van een operationeel dossier. Dezelfde casus mag niet over train-, validatie- en testsets lekken; splitsing gebeurt daarom op `case_id` of een nog grovere klantgroep.

### Marketplace, betaling en review

#### ExpertOffer

- `id`
- `case_id`
- `expert_id`
- `fee_cents`
- `estimated_delivery_at`
- `short_motivation`
- `match_score_snapshot`
- `terms_version`
- `status` (`SUBMITTED`, `SHORTLISTED`, `SELECTED`, `DECLINED`, `WITHDRAWN`, `EXPIRED`)
- `expires_at`
- `created_at`

Aanbiedingen zijn besloten. Een adviseur ziet niet de prijs of motivatie van andere adviseurs.

#### CaseAssignment

- `case_id`
- `offer_id`
- `expert_id`
- `selected_by_customer_at`
- `payment_due_at`
- `status` (`PENDING_PAYMENT`, `ACTIVE`, `EXPIRED`, `CANCELLED`, `COMPLETED`)

Er bestaat maximaal één actieve assignment per casus. Selectie gebeurt atomair; bij uitblijven van betaling verloopt de assignment standaard na 24 uur.

#### ExpertReviewAggregate

- `expert_id`
- `specialization_id`
- `verified_review_count`
- `average_score`
- `completion_rate`
- `on_time_rate`
- `complaint_rate`

Alleen reviews uit betaalde, geleverde opdrachten tellen mee. De selectie toont zowel score als aantal reviews; één vijfsterrenreview mag niet hetzelfde gewicht krijgen als een langdurig trackrecord.

#### Payment

- `case_id`
- `customer_id`
- `amount_cents`
- `currency`
- `provider`
- `provider_reference`
- `connected_merchant_id`
- `application_fee_cents`
- `status`
- `idempotency_key`
- `paid_at`
- `refunded_at`

#### Invoice

- `case_id`
- `advisor_id`
- `customer_id`
- `invoice_number`
- `supplier_legal_name`
- `supplier_vat_number`
- `subtotal_cents`
- `vat_cents`
- `total_cents`
- `issued_by_platform_on_behalf_of_advisor`
- `pdf_storage_key`
- `issued_at`
- `credit_note_for_invoice_id`

De adviseur is leverancier van de adviesdienst. Het platform kan de factuur namens de adviseur genereren en verzenden op basis van een expliciete overeenkomst en correcte factuurgegevens.

#### ExpertReview

- `case_id`
- `expert_id`
- `overall_status`
- `current_final_answer_revision_id`
- `customer_explanation`
- `submitted_at`

#### FinalAnswerRevision

- `id`
- `review_id`
- `revision_number`
- `answer_text`
- `created_by_expert_id`
- `based_on_ai_answer_id`
- `content_hash`
- `created_at`
- `submitted_at`
- `supersedes_revision_id`

Ook het menselijke eindantwoord is versioned en immutable. Een correctie na levering maakt een nieuwe revisie met reden en audit event; het reeds geleverde antwoord wordt niet stilzwijgend aangepast.

#### ExpertReviewItem

- `review_id`
- `claim_id`
- `claim_version`
- `assessment`
- `explanation`
- `correction`
- `source_verified`
- `feedback_annotation_id`

`ExpertReviewItem` bestuurt de operationele reviewworkflow. De gekoppelde `HumanFeedbackAnnotation` bevat het duurzame, fijnmazige kwaliteitslabel voor analyse en eventueel later hergebruik. Zo blijft de leveringsflow eenvoudig zonder trainingslogica in reviewrecords te mengen.

### Ondersteunende data

#### CaseDocument

- documentmetadata en private storage key;
- geen publiek bestandspad;
- toegang en retentie apart vastgelegd.

#### CaseStatusHistory

Append-only historie van statusovergangen.

#### AuditLog

- actor;
- actie;
- objecttype en object-id;
- oude en nieuwe waarde waar passend;
- reden;
- request/correlation id;
- timestamp.

Auditlogs bevatten geen volledige fiscale teksten of documenten.

#### Notification

Bevat kanaal, template, geadresseerde, afleverstatus en retry-informatie.

## 8. Relaties op hoofdlijnen

```mermaid
erDiagram
    USER ||--o| CUSTOMER_PROFILE : has
    USER ||--o| EXPERT_PROFILE : has
    CUSTOMER_PROFILE ||--o{ CASE : submits
    CASE ||--o{ RAW_CASE_INPUT : versions
    CASE ||--o{ STRUCTURED_FACT : contains
    CASE ||--o{ CASE_ISSUE : flags
    CASE ||--|| CASE_SUMMARY : summarizes
    CASE ||--|| ANONYMIZED_CASE : publishes
    CASE ||--o{ EXTERNAL_AI_ANSWER : receives
    CASE ||--o{ AI_EXECUTION : processes
    AI_EXECUTION ||--o{ AI_ANSWER : produces
    CASE ||--o{ AI_ANSWER : generates
    AI_ANSWER ||--o{ AI_CLAIM : contains
    AI_CLAIM }o--o{ SOURCE : supported_by
    CASE ||--o{ PROVENANCE_RECORD : traces
    PROVENANCE_RECORD ||--o{ ARTIFACT_LINEAGE : parent_or_child
    CASE ||--o{ EXPERT_OFFER : receives
    EXPERT_PROFILE ||--o{ EXPERT_OFFER : submits
    CASE ||--o| CASE_ASSIGNMENT : assigned_through
    EXPERT_OFFER ||--o| CASE_ASSIGNMENT : selected_as
    CASE ||--o{ PAYMENT : paid_through
    CASE ||--o{ INVOICE : invoiced_through
    CASE ||--o{ EXPERT_REVIEW : reviewed_in
    EXPERT_REVIEW ||--o{ EXPERT_REVIEW_ITEM : contains
    EXPERT_REVIEW ||--o{ FINAL_ANSWER_REVISION : versions
    EXPERT_REVIEW_ITEM ||--o| HUMAN_FEEDBACK_ANNOTATION : materializes
    HUMAN_FEEDBACK_ANNOTATION }o--o{ SOURCE : justified_by
    HUMAN_FEEDBACK_ANNOTATION ||--o{ FEEDBACK_ADJUDICATION : adjudicated_in
    CASE ||--o{ DATA_USE_PERMISSION : governs
    DATASET_SNAPSHOT ||--o{ DATASET_ITEM : freezes
    CASE ||--o{ CASE_DOCUMENT : attaches
    CASE ||--o{ CASE_STATUS_HISTORY : records
    USER ||--o{ AUDIT_LOG : acts
```

## 9. Casusstatusmachine

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> ANONYMISING: klant dient in
    ANONYMISING --> PENDING_REVIEW: structuur en redactie gereed
    PENDING_REVIEW --> PUBLISHED: klant en/of beheer bevestigt
    PENDING_REVIEW --> DRAFT: correctie nodig
    PUBLISHED --> CLAIMED: klant selecteert aanbod
    CLAIMED --> AWAITING_PAYMENT: exclusieve assignment + betaalverzoek
    AWAITING_PAYMENT --> PAID: betaalwebhook bevestigd
    AWAITING_PAYMENT --> PUBLISHED: betaling verloopt / claim vrijgegeven
    PAID --> IN_REVIEW: adviseur start
    IN_REVIEW --> NEEDS_INFORMATION: extra feiten nodig
    NEEDS_INFORMATION --> IN_REVIEW: klant antwoordt
    IN_REVIEW --> ANSWER_SUBMITTED: adviseur dient in
    ANSWER_SUBMITTED --> DELIVERED: levering bevestigd
    DELIVERED --> CLOSED: administratief gesloten
    DRAFT --> CANCELLED
    PENDING_REVIEW --> CANCELLED
    PUBLISHED --> CANCELLED
    AWAITING_PAYMENT --> CANCELLED
```

### Regels

- Statusovergangen gebeuren via domeincommands, niet via een generieke `PATCH status`.
- Elke overgang heeft actor, reden, timestamp en toegestane vorige status.
- Meerdere adviseurs mogen besloten aanbiedingen doen zolang de casus `PUBLISHED` is.
- De klant ziet maximaal drie door matching en minimumkwaliteit geselecteerde kandidaten.
- De selectie van één aanbod en het aanmaken van de exclusieve assignment gebeuren atomair.
- De assignment verloopt standaard na 24 uur zonder betaling; de klant kan daarna een ander aanbod kiezen.
- Adviseurs zien elkaars aanbod niet en reviews zijn alleen geverifieerd na betaalde, afgeronde opdrachten.
- `PAID` wordt alleen gezet na een geldige providerwebhook of expliciete mockactie in een testomgeving.
- `ANSWER_SUBMITTED` vereist afgeronde reviewchecks en een definitief antwoord.
- Correcties achteraf maken een nieuwe versie; historie wordt niet overschreven.

## 10. Intake- en analysepipeline

```mermaid
flowchart TD
    R[Ruwe tekst, documenten en extern AI-antwoord] --> V[Bestand- en inputvalidatie]
    V --> P[PII-detectie en privacyrisico's]
    P --> X[Feiten, datums, bedragen en partijen extraheren]
    X --> I[Tegenstrijdigheden en ontbrekende feiten bepalen]
    I --> T[Fiscale tags, complexiteit en tijd schatten]
    T --> S[Samenvatting en concrete vraag voorstellen]
    S --> C[Klant controleert feiten]
    C -->|correctie| X
    C -->|bevestigd| H[Beheer/privacy-gate]
    H --> J[Publicatie op jobboard]
```

### Belangrijke grens

De klant bevestigt feiten en context, niet de fiscale conclusie. Een adviseur bevestigt of corrigeert de fiscale analyse.

### AI-adapter

```text
AIProvider
├── structure_case(input) -> StructuredCaseResult
├── classify_case(input) -> ClassificationResult
├── draft_answer(input, sources) -> DraftAnswerResult
└── assess_external_answer(input) -> ExternalAnswerAssessment
```

Implementaties:

- `MockAIProvider`: voorspelbare seed-output voor demo en tests;
- toekomstige productieprovider achter dezelfde interface.

Elke uitvoer bewaart provider, model, promptversie en generatiecontext.

## 11. Anonimiseringsarchitectuur

De eerste laag is deterministisch en lokaal/server-side:

- e-mailadressen;
- telefoonnummers;
- postcodes en adressen;
- BSN-achtige nummers;
- KvK-nummers;
- IBAN's;
- expliciet gelabelde namen en bedrijfsnamen.

Daarna kan een AI-laag contextuele entiteiten voorstellen. AI-redacties worden niet automatisch vertrouwd bij hoge risico's.

### Redactieobject

```json
{
  "start": 18,
  "end": 34,
  "entity_type": "PERSON",
  "replacement": "[PERSOON]",
  "confidence": 0.98,
  "detector": "regex_or_ner",
  "review_status": "PENDING"
}
```

### Publicatie-gate

Publicatie wordt geblokkeerd wanneer:

- een hoog risico niet is opgelost;
- origineel en geanonimiseerd document onvoldoende gescheiden zijn;
- noodzakelijke fiscale informatie per ongeluk is verwijderd;
- de klant de feitelijke samenvatting nog niet heeft bevestigd.

## 12. Matching en prijsindicatie

De eerste matching is regelgebaseerd.

Voorbeeldweging:

| Factor | Gewicht |
|---|---:|
| Hoofdcategorie | 30 |
| Specialisatietags | 25 |
| Type klant | 10 |
| Complexiteitsvoorkeur | 10 |
| Belastingjaar/actualiteit | 5 |
| Urgentie versus beschikbaarheid | 10 |
| Geschatte tijd versus voorkeur | 10 |

De UI toont naast het percentage de bijdragende regels. Hardcoded percentages zijn alleen toegestaan in seed-data die expliciet als demo is gemarkeerd.

De vergoeding wordt niet direct door de matchscore bepaald. Een aparte prijsregel gebruikt onder andere complexiteit, geschatte tijd, urgentie en platformmarge.

### 12.1 Besloten aanbod- en selectieflow

1. De casus wordt gepubliceerd met een indicatieve prijsband en maximale reactietermijn.
2. Passende adviseurs kunnen één besloten aanbod doen met prijs, levertijd en korte motivatie.
3. Het platform filtert op harde eisen en toont maximaal drie kandidaten.
4. De klant vergelijkt specialisatie, geverifieerde reviews, voltooiingspercentage, levertijd en totaalprijs.
5. De klant selecteert één adviseur; dit maakt een exclusieve assignment.
6. De klant krijgt 24 uur om te betalen.
7. Bij tijdige betaling wordt de assignment actief; anders vervalt deze en kan de klant opnieuw kiezen.

Er is geen openbare biedhistorie, geen live onderbieding en geen vrije onderhandelingschat. Het platform toont een prijsband en kan een minimumprijs per complexiteitsklasse afdwingen. Zo blijft de flow goedkoop in support en wordt prijsdumping beperkt.

### 12.2 Reviews

- Alleen klanten van betaalde en geleverde opdrachten kunnen reviewen.
- Eén opdracht levert maximaal één actieve review op.
- De review wordt gekoppeld aan relevante specialisaties.
- De score toont altijd het aantal geverifieerde reviews.
- Klachten, refunds en gegronde correcties beïnvloeden interne kwaliteitsmonitoring.
- Adviseurs kunnen feitelijke onjuistheden melden, maar reviews niet zelf verwijderen.

## 13. Bron- en bewijsmodel

Bronhiërarchie:

1. wet- en regelgeving;
2. beleidsbesluiten;
3. parlementaire geschiedenis;
4. jurisprudentie;
5. officiële uitvoeringsinformatie;
6. vakliteratuur en commentaar.

Per conclusie worden vastgelegd:

- claim;
- bron;
- bronsoort;
- datum of versie;
- zekerheid;
- relevante ontbrekende feiten;
- verificatiestatus door adviseur.

Demo-bronnen krijgen `demo_only = true` en worden zichtbaar als niet juridisch gecontroleerd gemarkeerd.

### 13.1 Feedback-, provenance- en leerlaag

#### Vier begrippen die nooit door elkaar mogen lopen

| Begrip | Betekenis | Voorbeeld |
|---|---|---|
| Origin | Wie of wat produceerde de inhoud? | `PLATFORM_AI`, `EXPERT`, `CUSTOMER` |
| Evidence source | Waarop rust de inhoudelijke conclusie? | wetsartikel, besluit, arrest, handboek |
| Feedback label | Wat vindt een expert van een specifieke output? | `INCORRECT`, `OUTDATED_SOURCE` |
| Lineage | Uit welke versie is dit artefact afgeleid? | expertcorrectie corrigeert AI-claim versie 3 |

Iedere inhoudelijke component draagt deze vier dimensies waar relevant. Alleen een vrij tekstveld “opmerking adviseur” is onvoldoende: daarmee zijn fouten later niet betrouwbaar te tellen, reproduceren of gebruiken voor evaluatie.

#### Canonieke classificatie van content

| Contentklasse | Producent | Mag definitief advies worden? | Standaard trainingsgeschikt? |
|---|---|---:|---:|
| Ruwe klantinput | Klant | Nee | Nee |
| Extern AI-antwoord | Externe AI, aangeleverd door klant | Nee | Nee |
| Platform-AI-output | Platform-AI-run | Nee | Nee |
| Deterministische afleiding | Regelengine | Nee | Nee |
| Geïmporteerde bronmetadata | Bronnenpipeline of beheerder | Nee | Nee |
| Expertfeedback | Geverifieerde adviseur | Nee, is beoordeling | Nee |
| Definitief expertantwoord | Geverifieerde adviseur | Ja, na workflow-gates | Nee, tenzij afzonderlijk toegestaan en goedgekeurd |
| Geadjudiceerd kwaliteitslabel | Onafhankelijke beoordelaar | Niet klantgericht | Kandidaat voor evaluatie of training |

“Standaard trainingsgeschikt: nee” is bewust. Geschiktheid ontstaat pas na doelbinding, rechtencontrole, tweede anonimisering, kwaliteitsselectie en expliciete datasetgoedkeuring.

#### Review op atomair niveau

De reviewinterface toont een antwoord in genummerde claims of secties. Een expert kan per eenheid:

- een classificatielabel kiezen;
- de ernst en het eigen zekerheidsniveau aangeven;
- een inhoudelijke reden vastleggen;
- gecorrigeerde tekst schrijven;
- één of meer actuele bronnen koppelen met pinpointreferentie;
- aangeven welk ontbrekend feit het oordeel kan veranderen;
- markeren dat een wijziging uitsluitend stijl of leesbaarheid betreft.

Het systeem bewaart daarbij altijd:

1. de exacte AI-output vóór menselijke wijziging;
2. de model-, prompt- en inputsnapshot die deze output maakte;
3. de exacte doelclaim of tekstspan waarop feedback is gegeven;
4. het expertlabel, de correctie en onderbouwing;
5. de resulterende definitieve antwoordversie;
6. eventuele latere correctie, betwisting of adjudicatie.

#### Leerdata-pipeline

```mermaid
flowchart LR
    O[Operationele casusdata] --> F[Toestemming, rechten en doelbinding]
    F -->|niet toegestaan| X[Uitsluiten]
    F -->|toegestaan| D[Tweede de-identificatie]
    D --> Q[Schema-, bron- en kwaliteitsvalidatie]
    Q --> A{Adjudicatie nodig?}
    A -->|ja| J[Onafhankelijke expert beoordeelt]
    A -->|nee| S[Selectiebeleid toepassen]
    J --> S
    S --> E[Immutable dataset snapshot]
    E --> G[Golden/testset]
    E --> T[Train/validatieset]
    G --> R[Model- en promptregressietests]
    T --> M[Afzonderlijke trainingsomgeving]
    M --> R
    R -->|goedgekeurd| P[Modelversie kandidaat voor release]
```

De standaardvolgorde is **eerst evalueren, pas later eventueel trainen**. In de eerste productfasen wordt expertfeedback gebruikt voor foutanalyse, prompts, regels en regressietests. Fine-tuning wordt pas overwogen wanneer er voldoende kwalitatief consistente, juridisch bruikbare en geadjudiceerde data is.

#### Datasetregels

- operationele PostgreSQL-tabellen zijn nooit rechtstreeks de trainingsbron;
- exports draaien als expliciete, geautoriseerde jobs buiten de gebruikersrequest;
- elke export gebruikt een versioned selection policy en een versioned schema;
- persoonsgegevens, vrije documenttekst en klantidentificatoren worden opnieuw gecontroleerd;
- externe AI-antwoorden en auteursrechtelijk bronmateriaal worden standaard uitgesloten;
- train-, validatie-, test- en golden sets zijn op casus- of klantgroep gescheiden;
- een golden set wordt niet gebruikt om een model te trainen;
- een datasetmanifest bevat aantallen per categorie, label, bronsoort en kwaliteitsstatus;
- iedere rij is terug te leiden naar toegestane bronversies zonder deze informatie aan modelgebruikers te tonen;
- intrekking of verwijdering markeert afgeleide items als revoked en activeert een impactanalyse op datasets en modellen;
- een datasetversie wordt nooit stilzwijgend aangepast; correcties maken een nieuwe snapshot;
- productiepromotie vereist een vergelijking met de vaste golden set en vooraf bepaalde kwaliteitsdrempels.

#### Kwaliteitsmetingen

De leerlaag rapporteert minimaal:

- percentage AI-claims correct, gedeeltelijk correct en onjuist;
- unsupported-claim rate en outdated-source rate;
- ontbrekende-feiten-rate per fiscale categorie;
- expert agreement en aantal geadjudiceerde conflicten;
- correctiegrootte, apart voor inhoud en stijl;
- prestaties per model, promptversie, specialisatie en complexiteitsklasse;
- broncoverage en aandeel claims met geverifieerde primaire bron;
- privacyfilter-fouten en geblokkeerde datasetitems;
- verschil tussen offline evaluatie en uitkomsten in echte reviews.

Deze metrics worden geaggregeerd. Operationele dashboards tonen geen volledige fiscale inhoud of persoonsgegevens.

#### Governance en rollen

- een adviseur kan alleen annoteren binnen een aan hem toegewezen, betaalde casus;
- alleen geverifieerde senior experts of aangewezen kwaliteitsbeheerders mogen adjudiceren;
- datasetbouwers zien standaard gedeïdentificeerde data en geen klantidentiteit;
- goedkeuring van een dataset vereist een andere actor dan de maker;
- modelrelease en datasetgoedkeuring zijn afzonderlijke bevoegdheden;
- toegang tot learning exports, snapshots en manifesten wordt apart geaudit;
- hergebruik voor een nieuw doel vereist een nieuwe toestemming/rechtenbeoordeling;
- experts en klanten krijgen in voorwaarden transparantie over eventueel hergebruik en intrekking.

#### Technische scheiding

De operationele FastAPI-app schrijft provenance, annotaties en permissions naar PostgreSQL. Een latere Python learning pipeline leest uitsluitend goedgekeurde records via een beperkte service-identiteit en schrijft gedeïdentificeerde snapshots naar een afzonderlijke private opslaglocatie. De productieapp heeft geen schrijfrechten op goedgekeurde datasets en de trainingsomgeving heeft geen algemene toegang tot ruwe klantdossiers.

## 14. API-ontwerp

Basis: `/api/v1` met JSON REST-resources en OpenAPI-documentatie.

### Intake

```text
POST   /cases
GET    /cases/{case_id}
POST   /cases/{case_id}/inputs
POST   /cases/{case_id}/documents
POST   /cases/{case_id}/structure
POST   /cases/{case_id}/confirm-structure
GET    /cases/{case_id}/anonymisation-preview
POST   /cases/{case_id}/confirm-anonymisation
```

### Jobboard en matching

```text
GET    /jobboard
GET    /jobboard/{case_id}
GET    /jobboard/{case_id}/match
POST   /jobboard/{case_id}/offers
GET    /cases/{case_id}/offer-shortlist
POST   /cases/{case_id}/select-offer
POST   /offers/{offer_id}/withdraw
POST   /assignments/{assignment_id}/expire   # systeem/admin
```

### Betaling

```text
POST   /cases/{case_id}/payment-intent
POST   /payments/webhooks/{provider}
GET    /cases/{case_id}/payment
POST   /cases/{case_id}/mock-payment   # alleen test/demo
```

### Review en levering

```text
GET    /cases/{case_id}/review
PUT    /cases/{case_id}/review/items/{item_id}
POST   /cases/{case_id}/review/annotations
PUT    /review/annotations/{annotation_id}
POST   /cases/{case_id}/information-requests
POST   /cases/{case_id}/final-answer
POST   /cases/{case_id}/deliver
```

### Feedback en learning governance

```text
GET    /cases/{case_id}/provenance
GET    /review/annotations/{annotation_id}/lineage
POST   /review/annotations/{annotation_id}/adjudicate   # senior expert
GET    /admin/learning/quality-metrics
POST   /admin/datasets/candidates                       # selectiepreview
POST   /admin/datasets                                  # maakt draft snapshot
POST   /admin/datasets/{dataset_id}/validate
POST   /admin/datasets/{dataset_id}/approve             # vier-ogenprincipe
POST   /admin/datasets/{dataset_id}/revoke
GET    /admin/datasets/{dataset_id}/manifest
```

Datasetendpoints leveren nooit ruwe klantdossiers. Exportjobs zijn asynchroon, gebruiken een beperkte service-identiteit en registreren selectiebeleid, toestemming, de-identificatie en contenthashes.

### Beheer

```text
GET    /admin/cases
POST   /admin/cases/{case_id}/publish
POST   /admin/cases/{case_id}/pause
POST   /admin/cases/{case_id}/close
GET    /admin/audit-logs
GET    /admin/experts
PUT    /admin/experts/{expert_id}
```

Commands ondersteunen een idempotency key bij claim, betaling, webhook en levering.

## 15. Frontendarchitectuur

### Doelstructuur

```text
frontend/
├── app/
│   ├── (public)/
│   ├── customer/
│   │   ├── cases/
│   │   └── intake/
│   ├── expert/
│   │   ├── jobboard/
│   │   └── reviews/
│   ├── admin/
│   │   ├── quality/
│   │   └── datasets/
│   └── api-client/
├── components/
│   ├── case/
│   ├── status/
│   ├── evidence/
│   ├── feedback/
│   ├── provenance/
│   └── forms/
├── lib/
│   ├── api/
│   ├── auth/
│   ├── validation/
│   └── formatting/
└── types/
```

### State

- serverdata via een query/cachelaag;
- formulierstate lokaal per wizardstap;
- rol en sessie via authcontext;
- geen volledige domeindatabase in React `useState`;
- updates via servercommands en invalidatie van relevante queries.

### UX-staten

Elke kernpagina ondersteunt:

- loading/skeleton;
- empty state;
- inline validation;
- fout met herstelactie;
- autorisatiefout;
- verlopen claim/betaling;
- succesvolle bevestiging.

## 16. Backendstructuur

De backend is blijvend Python-gebaseerd. De richtstack is:

- Python 3.12 of hoger;
- FastAPI voor HTTP en OpenAPI;
- Pydantic voor request-, response- en configuratievalidatie;
- SQLAlchemy 2 voor persistence;
- Alembic voor databasemigraties;
- pytest voor unit- en integratietests;
- httpx voor externe providers;
- structlog of standaard JSON-logging;
- een Python-worker pas wanneer achtergrondtaken aantoonbaar nodig zijn.

JavaScript/TypeScript wordt alleen in de frontend gebruikt. Databasefuncties en triggers mogen technische invarianten bewaken, maar bevatten geen primaire marketplace-, betaal- of reviewbusinesslogica.

```text
backend/app/
├── api/v1/
├── core/
│   ├── config.py
│   ├── database.py
│   ├── security.py
│   └── logging.py
├── domains/
│   ├── identity/
│   ├── cases/
│   ├── anonymisation/
│   ├── analysis/
│   ├── provenance/
│   ├── feedback/
│   ├── datasets/
│   ├── marketplace/
│   ├── payments/
│   ├── reviews/
│   ├── documents/
│   └── notifications/
├── adapters/
│   ├── ai/
│   ├── auth/
│   ├── payments/
│   ├── storage/
│   └── email/
├── models/
├── schemas/
├── repositories/
├── services/
└── tests/
```

Wanneer de gecontroleerde learning loop wordt geactiveerd, komt daarnaast een apart Python-package of een afzonderlijke private repository:

```text
learning/
├── policies/          # versioned selectie- en uitsluitregels
├── deidentification/  # tweede privacycontrole
├── datasets/          # manifests en schemas, geen data in Git
├── evaluations/       # golden-set regressies en metrics
├── training/          # optioneel en pas in fase 4
├── registry/          # dataset-, prompt- en modelmetadata
└── tests/
```

De code mag in dezelfde repository starten, maar operationele secrets, ruwe exports en datasetbestanden blijven strikt buiten Git en buiten de frontenddeployment.

Businessregels leven in domeinservices, niet in routehandlers. Routehandlers doen authenticatie, validatie, command-aanroep en response mapping.

## 17. Transacties en betrouwbaarheid

- Claim en statusovergang gebeuren in één databasetransactie.
- Webhooks worden onder idempotency key verwerkt.
- Externe events worden eerst opgeslagen en daarna verwerkt.
- Notificaties gebruiken later een outboxpatroon om verlies tussen databasecommit en e-mail te voorkomen.
- Lange AI- of documenttaken kunnen later naar een workerqueue; de eerste MVP mag synchroon werken zolang time-outs begrensd zijn.

## 18. Privacy en beveiliging

### Minimumeisen vóór echte gebruikers

- HTTPS;
- sterke authenticatie en sessiebeveiliging;
- rol- en objectniveau-autorisatie;
- encryptie van gevoelige velden en opslag;
- private documenten met tijdelijke URLs;
- secrets buiten Git;
- dependency- en malwarecontrole;
- rate limiting;
- beveiligde logging zonder fiscale teksten;
- backup- en herstelprocedure;
- dataretentie en verwijderflow;
- verwerkersovereenkomsten met providers;
- privacyverklaring en gebruiksvoorwaarden;
- beoordeling van beroepsaansprakelijkheid en platformrol.

### Aanvullende eisen voor feedback- en trainingsgebruik

- leg per gebruiksdoel vast welke toestemming, overeenkomst of andere grondslag van toepassing is;
- voer vóór structureel hergebruik een privacy- en rechtenbeoordeling uit;
- behandel expertcorrecties als mogelijk intellectueel werk en regel hergebruik contractueel;
- neem klantdocumenten, externe AI-output en volledige bronteksten niet standaard over in datasets;
- voer een tweede PII- en geheimhoudingscontrole uit, onafhankelijk van de jobboardanonimisering;
- pseudonieme IDs en hashes mogen geen eenvoudige terugkoppeling naar een gebruiker mogelijk maken buiten de afgeschermde lineage-service;
- scheid bewaartermijnen voor operationele dossiers, annotaties, auditlogs en afgeleide datasets;
- documenteer hoe verwijdering of intrekking doorwerkt naar exports, actieve datasets en reeds getrainde modellen;
- verstuur geen trainingsdata naar een modelprovider zonder afzonderlijke provider-, regio- en retentiecontrole;
- log datasettoegang als metadata, nooit als volledige inhoudelijke payload.

### Verboden in de publieke demo

- echte namen;
- BSN, IBAN, KvK of adressen;
- echte loonstroken, aangiften of facturen;
- klantcommunicatie;
- productiecredentials;
- providerwebhooks of echte betalingen.

## 19. Deploymentmodel

### Publieke demo

```text
GitHub main
  -> GitHub Actions
  -> npm ci
  -> Next.js static export
  -> GitHub Pages
```

URL: `https://oli4vos.github.io/Advies-ipc/`

### Lokale MVP

```text
Next.js localhost:3001
FastAPI localhost:8000
SQLite lokaal
lokale/private documentmap
mock AI en mock payment adapters
```

### Productie

Gekozen lean pilotopzet:

- **Supabase in een expliciete EU-regio (Frankfurt)** voor PostgreSQL, Auth en private Storage;
- **één kleine Fly.io Machine in Amsterdam** voor FastAPI en de statisch gebouwde frontend onder hetzelfde domein;
- **Mollie Connect for Platforms** voor betaling, adviseur-onboarding en application fees;
- **OpenAI API via een EU-project** alleen voor afgebakende analysefuncties, na goedkeuring van passende dataretentiecontroles;
- GitHub Actions voor build en deployment;
- GitHub Pages blijft uitsluitend de gratis publieke demo.

De productiefrontend wordt als static export vanuit dezelfde Fly.io-app geserveerd. Dit voorkomt een extra frontendhost, vereenvoudigt cookies en CORS en houdt de providerlijst klein.

### 19.1 Waarom deze providerkeuze

#### Supabase

Supabase combineert Auth, PostgreSQL en private objectopslag. Daardoor zijn geen losse auth-, database- en storageleveranciers nodig. Het project wordt aan een specifieke EU-regio gekoppeld; een algemene regio is niet voldoende voor een harde datalocatiekeuze. Autorisatie blijft dubbel uitgevoerd: Row Level Security in Supabase en objectautorisatie in FastAPI. Supabase is infrastructuur, niet de applicatiebackend: geen Edge Functions en geen primaire businesslogica in database-triggers.

#### Fly.io Amsterdam

De Python/FastAPI-backend is de enige applicatiebackend. Eén kleine machine in regio `ams` is voldoende voor de pilot en serveert ook de statische frontend. Schalen, aparte Python-workers en redundante machines worden pas toegevoegd na aantoonbare belasting of beschikbaarheidseisen.

#### Mollie Connect for Platforms

De adviseur blijft payment owner en wordt door Mollie als merchant geverifieerd. Het platform initieert de betaling en ontvangt een application fee. Dit beperkt eigen payment-compliance en sluit beter aan op de rol van bemiddelaar. Het platform bouwt geen eigen wallet of escrowadministratie.

#### OpenAI EU-project

AI wordt alleen gebruikt na deterministische privacyfilters en alleen voor structurering, classificatie, vergelijking en conceptgeneratie. Voor echte fiscale data is een EU-project met regionale verwerking plus de vereiste dataretentieafspraken een go-livevoorwaarde. Zonder die afspraken blijft de mockprovider actief.

### 19.2 Lean kosten- en supportregels

1. Geen Kubernetes, microservices, Redis, Elasticsearch of vector database in de pilot.
2. Eén PostgreSQL-database; flexibele analysevelden mogen eerst in gevalideerde `JSONB` staan.
3. Geen realtime chat. Aanvullende vragen gebruiken gestructureerde berichten en templates.
4. Geen losse e-mailprovider in de eerste besloten pilot; gebruik in-app notificaties en bestaande domein-SMTP waar verantwoord.
5. AI draait alleen op expliciete workflowmomenten en nooit bij elke toetsaanslag of pageview.
6. Gebruik goedkope modellen voor extractie/classificatie en een sterker model alleen voor het conceptantwoord.
7. Cache AI-resultaten op inputhash en promptversie; dezelfde invoer wordt niet onnodig opnieuw verwerkt.
8. Hanteer budgetlimieten per casus, per gebruiker en per maand met een kill switch.
9. Documenten worden niet standaard door AI verwerkt; alleen relevante tekstfragmenten na privacycontrole.
10. Biedingen hebben vaste velden, maximaal drie kandidaten en geen vrije onderhandelingschat.
11. Support wordt beperkt met duidelijke statussen, automatische herinneringen, vervaltermijnen en herstelacties.
12. Voeg pas een externe dienst toe wanneer deze aantoonbaar goedkoper is dan zelf beheren inclusief beveiliging en support.

### 19.3 Kostenopschaling

De pilot begint met minimale capaciteit. Opschaling gebeurt op meetpunten:

- tweede app-instance pas bij beschikbaarheids- of capaciteitsproblemen;
- achtergrondworker pas wanneer AI/documenttaken HTTP-time-outs veroorzaken;
- aparte zoekdienst pas wanneer PostgreSQL-filters aantoonbaar onvoldoende zijn;
- betaalde monitoring pas wanneer logs en uptimechecks onvoldoende zijn;
- e-mailprovider pas bij volume, afleverproblemen of compliance-eisen.

## 20. Configuratie

Voorziene variabelen:

```text
APP_ENV
API_BASE_URL
DATABASE_URL
AUTH_PROVIDER
AUTH_CLIENT_ID
AUTH_CLIENT_SECRET
AI_PROVIDER
AI_MODEL
AI_API_KEY
LEARNING_EXPORTS_ENABLED
DATASET_STORAGE_BUCKET
DATASET_KMS_KEY_ID
DATASET_MIN_AGREEMENT_SCORE
PAYMENT_PROVIDER
PAYMENT_API_KEY
PAYMENT_WEBHOOK_SECRET
STORAGE_PROVIDER
STORAGE_BUCKET
STORAGE_REGION
EMAIL_PROVIDER
EMAIL_API_KEY
SENTRY_DSN
```

Demo- en productieconfiguratie mogen niet dezelfde credentials of databases gebruiken.
`LEARNING_EXPORTS_ENABLED` staat standaard uit en kan niet via de publieke frontend worden gewijzigd. Het inschakelen van modeltraining is een afzonderlijke releasebeslissing en niet slechts een configuratiewijziging.

## 21. Teststrategie

### Unit tests

- anonymisatiepatronen en false positives;
- statustransities;
- matchingregels;
- prijsregels;
- bronzekerheid;
- reviewvereisten;
- herkomstclassificatie en verplichte provenancevelden;
- immutable AI-output en versiegebonden annotaties;
- onderscheid tussen inhoudelijke correctie en `STYLE_ONLY`;
- dataset eligibility op basis van doel en permission;
- train/validatie/test-splitsing zonder casus- of klantlekkage;
- idempotency.

### Integratietests

- API plus database;
- claimconcurrentie;
- payment webhook;
- documentautorisatie;
- auditlog na commands;
- AI-run → claim → expertannotatie → definitief antwoord lineage;
- intrekking waardoor afgeleide datasetitems worden gemarkeerd;
- vier-ogen-goedkeuring van dataset snapshots;
- geblokkeerde export van ruwe documenten en externe AI-output;
- adapters met testimplementaties.

### End-to-end

1. klant plakt rommelige casus;
2. structuur en privacypreview verschijnen;
3. klant bevestigt;
4. beheer publiceert;
5. adviseur filtert en claimt;
6. klant betaalt;
7. adviseur controleert claims en bronnen;
8. inhoudelijke labels, correcties en bronverwijzingen worden afzonderlijk opgeslagen;
9. ontbrekende informatie wordt opgevraagd;
10. adviseur levert;
11. klant ziet antwoord en volledige historie;
12. beheer ziet lineage, maar een casus zonder learning-permission verschijnt niet als datasetkandidaat.

### Evaluatie- en datasettests

- exact dezelfde selectiepolicy levert bij dezelfde input hetzelfde manifest op;
- elk datasetitem heeft geldige bronversies, provenance en contenthash;
- een golden item kan niet tegelijk in `TRAIN` voorkomen;
- conflicterende expertlabels worden niet automatisch als waarheid geëxporteerd;
- ingetrokken items verdwijnen uit nieuwe snapshots en geven impactwaarschuwingen voor bestaande snapshots;
- de-identificatie wordt getest met synthetische PII en fiscale documentpatronen;
- model- en promptkandidaten moeten vooraf vastgelegde kwaliteitsdrempels halen zonder kritieke categorieën te verslechteren;
- metrics worden uitgesplitst per fiscale specialisatie en complexiteit om gemiddelde scores niet misleidend te maken.

### Niet-functioneel

- toegankelijkheid;
- mobiel gedrag;
- autorisatietests;
- dependency scanning;
- back-up restore test;
- performance van jobboardfilters;
- logging zonder privacygevoelige payloads.

## 22. Git- en releaseproces

Elke functionele aanpassing krijgt een aparte commit.

Aanbevolen proces:

1. wijziging in de iCloud-projectmap;
2. alleen relevante bestanden stagen;
3. diff en tests controleren;
4. één logisch onderwerp committen;
5. push naar GitHub;
6. GitHub Actions laten bouwen;
7. live GitHub Pages-smoketest uitvoeren;
8. volgende wijziging pas daarna starten.

Commitvoorbeelden:

```text
Fix new-case data isolation
Add anonymisation preview
Require payment before expert review
Document production deployment boundaries
```

Op termijn:

- branch protection op `main`;
- vereiste CI-checks;
- pull requests voor risicovolle wijzigingen;
- automatische dependency updates;
- tagged releases voor staging en productie.

## 23. Gefaseerde realisatie

### Fase 0 — Publieke productdemo

- fictieve data;
- statische GitHub Pages-site;
- klikbare rollen en kernflow;
- harde waarschuwing tegen echte gegevens.

### Fase 1 — Lokale persistente MVP

- FastAPI koppelen;
- SQLite-schema en migraties;
- echte statuscommands;
- regelgebaseerde anonimisering;
- mock AI/payment/storage adapters;
- immutable AI-runs, claimversies en basis-provenance;
- gestructureerde expertannotaties naast het definitieve antwoord;
- API- en E2E-tests.

### Fase 2 — Besloten pilot

- echte authenticatie;
- PostgreSQL;
- private objectopslag;
- expertverificatie;
- echte payment sandbox;
- stagingomgeving;
- quality dashboards op geaggregeerde expertfeedback;
- data-use permissions en tweede de-identificatie als dry run;
- versioned evaluatieset met uitsluitend synthetische of expliciet toegestane pilotdata;
- privacy- en juridische review.

### Fase 3 — Productie

- live betalingen;
- gecontroleerde AI-provider;
- prompt- en modelregressietests tegen een goedgekeurde golden set;
- operationele monitoring;
- incident- en herstelprocedures;
- retentie en verwijdering;
- schaalbare notificaties;
- uitbreiding fiscale disciplines.

### Fase 4 — Gecontroleerde learning loop

- alleen starten nadat volume, labelconsistentie, rechten en de-identificatie aantoonbaar voldoende zijn;
- onafhankelijke datasetgoedkeuring en periodieke herbeoordeling;
- afzonderlijke Python learning pipeline en private datasetopslag;
- fine-tuning alleen wanneer deze aantoonbaar beter presteert dan prompt-, bron- of regelverbeteringen;
- model registry met dataset-, code-, prompt- en evaluatieversies;
- gefaseerde release met rollback naar de vorige modelversie;
- continue controle op kwaliteitsverschillen tussen fiscale categorieën en klanttypen.

## 24. Architectuurbeslissingen

### Vastgelegd

- modulaire monoliet;
- REST API;
- Next.js frontend;
- Python/FastAPI als enige backendstack voor alle businesslogica;
- geen Node-backend en geen Supabase Edge Functions;
- juridisch model: platform is bemiddelaar; klant en adviseur sluiten de adviesovereenkomst;
- facturatie: platform genereert en verzendt namens adviseur, adviseur blijft leverancier;
- besloten aanbiedingen met maximaal drie kandidaten, gevolgd door klantselectie;
- exclusieve assignment na selectie, standaard 24 uur betaaltermijn;
- alleen geverifieerde reviews uit betaalde, afgeronde opdrachten;
- SQLite lokaal, Supabase PostgreSQL in Frankfurt voor pilot/productie;
- Supabase Auth en private Storage om leveranciers en beheerlast te consolideren;
- Fly.io Amsterdam voor één FastAPI-instance en statische productiefrontend;
- Mollie Connect for Platforms; adviseur blijft payment owner;
- OpenAI EU-project alleen na passende dataretentieafspraken, anders mock-AI;
- adapters voor externe providers;
- AI-output is immutable en elke run bewaart model-, prompt-, schema- en inputversies;
- klantinput, externe AI, platform-AI, systeemregels, bronnen en expertfeedback hebben afzonderlijke origin-classificaties;
- expertfeedback wordt atomair opgeslagen per claim of passage en blijft gescheiden van het definitieve antwoord;
- operationele feedback wordt nooit automatisch trainingsdata;
- evaluatie en promptverbetering gaan vóór eventuele fine-tuning;
- datasets zijn gedeïdentificeerde, immutable snapshots met manifest, hashes en vier-ogen-goedkeuring;
- golden/testdata wordt niet als trainingsdata gebruikt en datasplitsing gebeurt minimaal op casusniveau;
- regelgebaseerde matching;
- append-only status- en auditgeschiedenis;
- GitHub Pages uitsluitend voor fictieve frontenddemo;
- één logisch onderwerp per commit;
- lean pilot zonder microservices, Kubernetes, Redis, vector database of realtime chat.

### Nog te beslissen

1. Welke minimumvoorwaarden gelden voor beroepsaansprakelijkheidsverzekering en vakbekwaamheid van adviseurs?
2. Wie draagt welk risico bij refund, no-show, deadlineoverschrijding of een ondeugdelijk antwoord?
3. Mag een klant altijd vrij kiezen uit drie kandidaten of mag één duidelijke topmatch direct worden voorgesteld?
4. Welke minimum- en maximumprijzen gelden per complexiteitsklasse om prijsdumping te voorkomen?
5. Welke contractuele volmacht is nodig om facturen namens adviseurs op te stellen en te verzenden?
6. Hoe worden correcties en creditnota's administratief afgehandeld?
7. Welke fiscale bronnen mogen juridisch en commercieel worden ontsloten?
8. Welke adviseurs mogen meedoen en hoe wordt hun vakbekwaamheid geverifieerd?
9. Welke retentietermijnen gelden voor casussen, documenten, betalingen en auditlogs?
10. Welke beschikbaarheidsdoelstelling rechtvaardigt later redundante hosting?
11. Onder welke juridische grondslag en voorwaarden mogen klantinhoud en expertcorrecties per gebruiksdoel worden hergebruikt?
12. Krijgen experts een opt-out, vergoeding of andere afspraak voor hergebruik van hun inhoudelijke correcties?
13. Welke minimale expert agreement en adjudicatiescore maken een label geschikt voor de golden set of training?
14. Wie mag dataset snapshots en nieuwe modelversies onafhankelijk goedkeuren?
15. Welke verwijderstrategie geldt voor datasets en modellen nadat toestemming of rechten worden ingetrokken?

## 25. Definitie van productiegeschikt

Het platform is pas geschikt voor echte casussen als minimaal is voldaan aan:

- backend is server-authoritative;
- echte authenticatie en objectautorisatie werken;
- anonimisering is getest en heeft een menselijke gate;
- documenten zijn privé en gecontroleerd;
- betaling en webhooks zijn idempotent;
- alle statusovergangen zijn gevalideerd en gelogd;
- AI-output is traceerbaar en menselijk gecontroleerd;
- AI-, klant-, bron- en expertcontent zijn ondubbelzinnig geclassificeerd en geversioneerd;
- expertcorrecties verwijzen naar de exacte beoordeelde claim- of passageversie;
- bronnen zijn actueel en verifieerbaar;
- privacy-, contract- en aansprakelijkheidsdocumenten zijn beoordeeld;
- monitoring, backups en incidentherstel zijn ingericht;
- kritieke klant-, expert- en beheerflows hebben end-to-end-tests.

Voordat operationele data voor evaluatie of training wordt gebruikt, gelden aanvullend: vastgelegde gebruiksrechten per doel, tweede de-identificatie, datasetmanifest, onafhankelijke goedkeuring, splitsingscontrole, intrekkingsprocedure en reproduceerbare kwaliteitsevaluatie. Zonder deze extra gates blijft feedback uitsluitend operationele kwaliteitsinformatie.

Tot dat moment blijft de GitHub Pages-versie een publieke demonstratie met uitsluitend fictieve data.

## 26. Officiële referenties bij providerkeuzes

- [Mollie Connect-overzicht](https://docs.mollie.com/docs/connect-overview) — verschil tussen Platforms en Marketplaces, payment ownership, application fees, routing en aansprakelijkheid.
- [Mollie merchant onboarding](https://docs.mollie.com/docs/connect-onboard-merchants) — OAuth, Client Links en KYB-onboarding van adviseurs.
- [Mollie payments verwerken](https://docs.mollie.com/docs/connect-process-payments) — payment owner en tokenmodel voor Connect for Platforms.
- [Supabase-regio's](https://supabase.com/docs/guides/platform/regions) — keuze van een specifieke EU-regio en betekenis voor datalocatie.
- [Supabase Auth](https://supabase.com/docs/guides/auth) — JWT-authenticatie en integratie met Row Level Security.
- [Supabase security](https://supabase.com/docs/guides/security) — gedeelde verantwoordelijkheid, EU-hosting en DPA.
- [Fly.io-regio's](https://fly.io/docs/reference/regions/) — beschikbaarheid van regio `ams` in Amsterdam.
- [OpenAI API data controls](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint) — EU data residency, regionale verwerking en vereisten voor ZDR/Modified Abuse Monitoring.
- [Belastingdienst modelovereenkomst bemiddeling](https://download.belastingdienst.nl/belastingdienst/docs/alg_model_bemid_abu_dv10351z2ed.pdf) — voorbeeld waarin een bemiddelaar namens een opdrachtnemer factureert; toepassing op dit platform vereist eigen juridische en fiscale toetsing.
