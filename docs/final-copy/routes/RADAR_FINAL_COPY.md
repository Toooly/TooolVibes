# RADAR FINAL COPY V2

> Stato: **RADAR FINAL COPY V2** (2026-08-03).
> Sorgente canonica: `TOOOLVIBES — RADAR FINAL COPY V2` (contratto utente).
> Quando in conflitto con `RADAR_FINAL_COPY`, Master Copy Deck, manifest o
> vecchi Copy ID, prevale la V2.

## 1. Denominazione

- **Nome pubblico**: Radar
- **Route**: `/radar`
- **Fonte dati**: Product Hunt (GraphQL OAuth via
  `app/api/product-hunt/route.ts`)

## 2. Hero

| Slot | Copy |
|---|---|
| Eyebrow desktop | Segnali da Product Hunt · dati reali |
| Eyebrow mobile | Product Hunt · dati reali |
| H1 | Segui i lanci. Individua i segnali da approfondire. |
| Lede | Il Radar raccoglie i lanci di Product Hunt, li organizza per periodo e ti aiuta a individuare quelli da approfondire. Nessun dato simulato. |
| Provenance | Fonte: Product Hunt. Disponibilità e frequenza di aggiornamento dipendono dalla fonte. |

## 3. Stato dati (5 stati display)

| Stato | Status label | Stage title | Stage body |
|---|---|---|---|
| loading | Connessione a Product Hunt | Aggiornamento del Radar | Stiamo recuperando i segnali da Product Hunt. I risultati compariranno appena saranno disponibili. |
| live | Dati aggiornati | (dinamico: Segnali di oggi / Segnali degli ultimi 7 giorni / Segnali degli ultimi 30 giorni) | Ordinati in base ai dati disponibili da Product Hunt. Apri un lancio per verificarlo alla fonte. |
| empty | Nessun segnale disponibile | Nessun segnale disponibile | Product Hunt non ha restituito dati per questo periodo. Prova un altro intervallo oppure riprova tra poco. |
| stale | Aggiornamento non recente | I dati potrebbero non essere aggiornati | L'ultimo aggiornamento risale al ${updatedAt}. Puoi consultare i risultati disponibili oppure riprovare. |
| error | Dati non disponibili | Non riusciamo ad aggiornare il Radar | La connessione a Product Hunt non è disponibile in questo momento. Non mostriamo dati simulati o risultati precedenti come se fossero aggiornati. |

`missing-token` mappa a `error` per il display (stesso copy utente).
`fixture` resta `QA FIXTURE` come segnale di debug dev-only, mai visibile
in produzione (gated da `process.env.NODE_ENV === "development"` +
`TOOOLVIBES_RADAR_QA_FIXTURE=1`).

### Vincoli

- Non mostrare `LIVE` come badge: il live è "Dati aggiornati".
- "LIVE" è bandito per scelta editoriale (V2 §3).
- Non presentare dati stale come live.
- Non cancellare dati stale automaticamente.

## 4. Periodo (rolling, API = window 24h / 7d / 30d)

| Key | Label | H2 live |
|---|---|---|
| day | Oggi | Segnali di oggi |
| week | Ultimi 7 giorni | Segnali degli ultimi 7 giorni |
| month | Ultimi 30 giorni | Segnali degli ultimi 30 giorni |

Aria-label: "Mostra i segnali di [Periodo]".

## 5. Vista

| Key | Label | Aria-label |
|---|---|---|
| nodes | Mappa | Visualizza i segnali sulla mappa del Radar |
| table | Elenco | Visualizza i segnali in elenco |

`Radar` → `Mappa` (la mappa è una vista, non il nome della feature).
`Tabella` → `Elenco` (desktop: tabella; mobile: card).

## 6. Loading (1 solo blocco, no duplicazioni)

- Title: "Aggiornamento del Radar"
- Body: "Stiamo recuperando i segnali da Product Hunt. I risultati
  compariranno appena saranno disponibili."
- Screen reader: "Aggiornamento del Radar in corso."

`loading.tsx` non ha H1: il blocco di loading è unico e non duplica
l'H1 hydrated. La canvas/strumento mostra solo "Aggiornamento in corso"
(aria-hidden) senza ripetere il paragrafo.

## 7. Status rail (4 dt/dd pair)

| Etichetta | Valore |
|---|---|
| Stato | statusLabel dello stato corrente |
| Ultimo aggiornamento | formatUtcTimeLabel(updatedAt) o "—" |
| Segnali disponibili | signalCount o "—" |
| Periodo | rangeLabel |

Su mobile (≤ 47.99rem): 2x2 grid.

## 8. Empty / Stale / Error state panel

- Title (state.stageTitle)
- Body (state.stageBody)
- CTA primaria: "Riprova" / "Aggiorna i dati"
- CTA secondaria: "Vai al catalogo"
- Stale: badge "Aggiornamento non recente" sopra il title

`role="alert"` per error, `role="status" aria-live="polite"` per gli altri.

## 9. Mappa (region aria)

- Region aria-label: "Mappa dei segnali Product Hunt per il periodo selezionato"
- Ogni nodo: "[rank]. [name], [N] voti su Product Hunt. Apri il lancio."
- Se votes assenti: "Dato non disponibile"

## 10. Elenco

- Eyebrow: "Elenco dei segnali"
- H2: "Tutti i segnali del periodo"
- Colonne desktop: Posizione / Lancio / Voti / Commenti / Product Hunt
- CTA: "Apri su Product Hunt" — aria: "Apri [NOME] su Product Hunt in una nuova scheda"
- Fallback descrizione: "Descrizione non disponibile."

## 11. Segnale selezionato

Omesso in V2: la pagina non ha un pannello di dettaglio laterale.
Aggiungere solo se esiste interazione reale (click su nodo → side panel
con CTA "Apri su Product Hunt" e, se esiste relazione con il catalogo,
"Apri la scheda TooolVibes").

## 12. Retry / Refresh

- default: "Aggiorna i dati"
- loading: "Aggiornamento in corso…"
- aria-label: "Aggiorna i dati del Radar"
- `canRetry` = error | stale | empty | missing-token

Il button è disabilitato durante il fetch.

## 13. Provenance section (footer del Radar)

- Label: "Informazioni sui dati"
- Body: "I dati provengono da Product Hunt e vengono organizzati per
  periodo da TooolVibes. Disponibilità, completezza e frequenza di
  aggiornamento dipendono dalla fonte."
- Link: "Visita Product Hunt" (target="_blank", rel="noopener noreferrer")

## 14. SEO

| Slot | Value |
|---|---|
| Title source | Radar Product Hunt |
| Title rendered | Radar Product Hunt \| TooolVibes (template `%s \| TooolVibes`) |
| Description | Segui i lanci di Product Hunt, organizzati per periodo. Consulta la mappa o l'elenco e individua i segnali da approfondire. |
| OG title | Radar TooolVibes · Segnali da Product Hunt |
| OG description | Lanci reali organizzati per periodo, con mappa, elenco e collegamento alla fonte. Nessun dato simulato. |
| Social excerpt | Segui i lanci di Product Hunt e individua i segnali da approfondire. |

## 15. Accessibilità

- Un solo H1 nel DOM hydrated.
- Un solo blocco loading visibile (no duplicazione).
- Period control = `role="group"` con aria-labelledby.
- View control = `role="group"` con aria-labelledby.
- Periodo e vista usano `aria-pressed` (segmented control).
- Cambio periodo / vista non sposta il focus.
- Stato comunicato con `aria-live="polite"`.
- Errori con `role="alert"`.
- Nodi mappa: `aria-label` per ogni nodo.
- Righe elenco: `aria-label` per ogni riga.
- Nessun dato comunicato solo via colore.

## 16. Vincoli copy

NON usare (V2 vieta):

- "Migliori su Product Hunt" / "I più rilevanti" / "Vincitori" / "Trend da non perdere" /
  "Trend migliori" senza metodologia documentata.
- "LIVE" come badge / status label.
- "Aggiornamento in tempo reale" / "dati completi" / "classifica verificata" /
  "rilevanza editoriale" se non dimostrati.
- Pillole / label come "Migliori su Product Hunt oggi" / "Classifica verificabile"
  / "Senza il caos" / "non hype da inseguire".
- Status "ULTIMA SYNC" / "OFFLINE" / "IN PAUSA" / "NESSUN SEGNALE"
  (label legacy, sostituiti dai 5 label V2).
- "Aggiorna ora" (rinominato "Aggiorna i dati" o "Riprova").
- Periodi "Giorno / Settimana / Mese" (rinominati "Oggi / Ultimi 7 giorni / Ultimi 30 giorni").
- Vista "Radar" (rinominata "Mappa").
- Vista "Tabella" (rinominata "Elenco").

## 17. File scope

- `app/(marketing)/radar/page.tsx` — SEO V2
- `app/(marketing)/radar/loading.tsx` — blocco unico, no H1
- `components/radar/radar-experience.tsx` — UI V2
- `lib/radar/radar-ui-model.ts` — STATE_COPY V2, RADAR_RANGE_OPTIONS V2
- `styles/radar.css` — selettori V2 (eyebrow split, status rail, state panel, provenance)
- `__tests__/lib/radar/radar-ui-model.test.ts` — test label V2
- `__tests__/components/radar/radar-experience.test.tsx` — test V2

## 18. Stato non visibile al pubblico

- `fixture` → "QA FIXTURE" (dev-only, mai in produzione)
- `missing-token` → "Dati non disponibili" (alias error per display)
- Tutti gli altri stati sono pubblici.

## 19. Contratto dati (B36 / FLOW-606)

Invariato. `payload.stale: true` quando il server ri-serve l'ultima
classifica reale dopo un errore live. `source: "qa-fixture"` solo in dev.
`source: "product-hunt-stale"` quando il server fallback esplicito.
`source: "product-hunt-live"` quando il server ha risposto OK.
`source: "none"` quando non c'è dato reale.
