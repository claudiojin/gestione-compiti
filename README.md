# Task Pilot

Task Pilot è un task manager locale costruito con Next.js 16, Prisma e SQLite. Permette di catturare rapidamente attività, calcolare le priorità con AI e ottenere ogni mattina un piano guidato dall'assistente.

## Requisiti

- Node.js 20+
- pnpm (raccomandato) / npm / yarn
- Chiave API OpenAI (per funzioni AI)

## Setup

1. Installa le dipendenze:
   ```bash
   pnpm install
   ```
2. Copia il template degli environment:
   ```bash
   cp .env.example .env
   ```
3. Modifica `.env` inserendo:
   - `DATABASE_URL` (già impostato per SQLite locale)
   - `OPENAI_API_KEY` (obbligatoria per piano AI e priorità avanzate)
   - opzionali `OPENAI_MODEL`, `OPENAI_WHISPER_MODEL`
4. Esegui le migration Prisma:
   ```bash
   pnpm prisma migrate dev
   ```
5. Avvia l’ambiente di sviluppo:
   ```bash
   pnpm dev
   ```

L’app è raggiungibile su [http://localhost:3000](http://localhost:3000).

## Funzionalità chiave

- **Dashboard oggi**: due liste (attive + completate) con note inline e switch di stato.
- **Coaching AI**: suggerimenti personalizzati e piano prioritario sulla pagina “Piano di oggi”.
- **Note rapide**: aggiunte sia dalla barra rapida sia dall’editor interno della scheda.
- **Rigenera piano**: bottone “Rigenera piano AI” richiama `/api/tasks/today` e `/api/tasks` per aggiornare piano, consigli e liste.
- **Cron giornaliero**: può essere abilitato/disabilitato con `CRON_ENABLED` (default `true`).

## Script utili

| Comando                     | Descrizione                              |
| --------------------------- | ---------------------------------------- |
| `pnpm dev`                  | Avvia Next.js con Turbopack              |
| `pnpm build`                | Build di produzione                      |
| `pnpm start`                | Serve la build                           |
| `pnpm lint`                 | Analisi statiche ESLint                  |
| `pnpm prisma migrate dev`   | Applica le migration al DB locale        |

## AI e Privacy

- Nessun dato viene inviato ad OpenAI se `OPENAI_API_KEY` non è impostata.
- Il piano giornaliero viene generato on-demand e non è persistito.
- Per ambienti offline è possibile affidarsi alle logiche di fallback (calcolo locale di priorità e suggerimenti statici).

## Struttura principali directory

```
app/
  page.tsx            # Dashboard con liste attive/completate
  today/page.tsx      # Piano di oggi con coach AI
  api/tasks/          # API RESTful per CRUD task
lib/
  ai.ts               # Integrazione OpenAI + fallback locali
  tasks.ts            # Servizi Prisma per Task
  priority.ts         # Calcolo priorità locale
components/
  task-card.tsx       # Card interattiva con note e stato
  add-task-bar.tsx    # Barra rapida bottom sheet
```

## Deployment

Per deploy su Vercel o ambienti server:

1. Configura le variabili ambiente elencate in `.env.example`.
2. Assicurati che Prisma possa accedere a SQLite (o cambia `DATABASE_URL` verso Postgres/Prisma Accelerate).
3. Imposta `CRON_ENABLED` su `false` in ambienti serverless dove il cron non può girare persistentemente.

## Note

- L’app è pensata per uso personale/local-first: i dati risiedono nella `prisma/dev.db`.
- Supporta già importi via API (`POST /api/tasks`) e future integrazioni voice con Whisper.
