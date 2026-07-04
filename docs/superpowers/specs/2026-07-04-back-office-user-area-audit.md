# TooolVibes - Audit strutturale back office e area utente

Data: 2026-07-04

Aggiornamento implementazione: dopo questo audit e' stato avviato il P0 back office.
Sono stati aggiunti dashboard generale `/admin`, area tool `/admin/tools`, nuovo tool
`/admin/tools/new`, modifica tool `/admin/tools/[id]/edit`, area articoli `/admin/articles`
e conversione suggestion -> tool da `/admin/suggestions`.

## Sintesi

Il back office esiste, ma oggi non e' ancora un back office completo di piattaforma.
E' soprattutto un pannello editoriale per blog/guide, raccolte, suggerimenti tool e affiliate.

Il punto piu' critico e' la gestione tool: il codice server e il form esistono, ma non c'e' una
route admin evidente per lista/creazione/modifica tool. Inoltre la conversione da suggerimento
approvato punta a `/admin/new`, che oggi apre il form articolo, non il form tool.

L'area utente ha una base utile: login magic link, salvataggio remoto di shortlist/confronto/note
e progressione gamification. Pero' non e' ancora una vera dashboard personale: mancano storico,
submission, preferenze, acquisti, referral e una vista dettagliata dei tool salvati.

## Fonti controllate

- Admin routes: `app/(admin)/admin/(protected)/**`
- Admin actions: `app/(admin)/admin/actions/**`
- Admin components: `components/admin/**`
- Account: `components/account/**`, `app/(marketing)/account/page.tsx`
- Gamification: `lib/gamification/**`, `components/gamification/**`
- Workspace utente: `lib/discovery/remote-workspace.ts`, `lib/discovery/local-storage.ts`
- Supabase migrations: `supabase/migrations/**`
- Public APIs: `app/api/tool-requests`, `app/api/affiliate-requests`, `app/api/waitlist`
- Shop public page: `app/(marketing)/shop/page.tsx`

## Back Office

| Area | Stato | Evidenza | Gap principale |
| --- | --- | --- | --- |
| Tool | Parziale / critico | Tabelle `tools`, azioni `createTool`, `updateTool`, `deleteTool`, `ToolForm` presenti | Manca route admin visibile per lista/nuovo/edit tool. Conversione suggestion -> tool punta alla route articolo |
| Guide e articoli | Si | `editorial_articles`, `/admin`, `/admin/new`, `/admin/[id]/edit`, `ArticleForm` | Buona base, ma sarebbe meglio separare Blog / Guide / Schede tool nella navigazione |
| Categorie | No | `tools.category` e taxonomy statica | Nessuna tabella `categories`, nessun CRUD, nessuna gestione di ordine/icone/SEO |
| Submission tool | Parziale | `tool_requests`, API pubblica, `/admin/suggestions` con stati e note | Conversione in tool rotta/scollegata; submission non collegate a utente in area account |
| Utenti | No | Auth Supabase + `viewer_profiles`, `game_profiles` | Nessuna pagina admin utenti, nessun dettaglio profilo, nessun ban/export/support |
| Punti/minigame | Parziale | `game_profiles`, `game_missions`, `badges`, `arena_battles`, `radar_predictions`, hooks/actions | Nessuna gestione admin di XP, missioni, badge, reset, reward. Manca storico run minigame |
| Richieste founder | No / da definire | Occorrenze "founder" sono editoriali o taxonomy | Manca modello dati e flusso dedicato per richieste founder |
| Sponsorship/banner/listing | No, salvo affiliate link | `affiliate_links` gestisce link outbound per tool | Nessuna inventory sponsor, placement, banner, campagne, contratti, date, impression/click |
| Prodotti digitali/shop | No | `/shop` e' pagina statica con link esterno `siteConfig.shopUrl` | Nessun catalogo prodotti, checkout, ordini, download, entitlement, acquisti in area utente |
| Affiliate program | Si parziale | `affiliate_requests`, `/admin/affiliates`, referral code, QR, email decision | Buono per candidature affiliate; non copre sponsorship commerciale |
| Raccolte/collections | Si | `collections`, `collection_tool_slots`, `/admin/collections` | Buona base editoriale; dipende da tool admin funzionante |

## Problemi strutturali trovati

1. `/admin` non e' una dashboard generale, e' "Gestione blog".
2. La navbar admin comunica "Blog", "Nuovo", "Raccolte", "Affiliati", "Link", "Suggerimenti", ma non ha "Tool", "Utenti", "Gamification", "Shop", "Sponsor".
3. Il CRUD tool sembra rimasto a meta': actions e componenti ci sono, ma le pagine non sono presenti nella route tree.
4. `/admin/suggestions` mostra "Crea tool da suggerimento" verso `/admin/new?suggestion=...`, ma `/admin/new` crea articoli.
5. Categorie e tag sono dati liberi/statici, quindi non governabili da back office.
6. La gamification e' user-facing, ma non e' amministrabile.
7. La monetizzazione e' divisa: affiliate link si', sponsorship e shop no.
8. Non esiste una vista utenti, quindi supporto e moderazione sono limitati.

## Back office target

La struttura consigliata:

- Dashboard
  - Stato generale: tool, articoli, submission, utenti, punti, sponsor, shop.
  - Alert: sync rotti, submission aperte, dati mancanti.
- Tool
  - Lista, filtri, crea, modifica, pubblica, featured, tool of week.
  - Conversione diretta da submission.
  - Campi affiliate/sponsor/listing.
- Editoriale
  - Blog, guide, schede tool.
  - Stati, featured, media, SEO.
- Raccolte
  - Collections, slot tool, accesso premium, ordine.
- Categorie
  - Categorie, tag, icone, slug, ordine, colore, SEO.
- Submission
  - Tool request, founder request, partnership request.
  - Stati, note, conversione a tool/articolo/lead.
- Utenti
  - Lista utenti, profilo, email, workspace, punti, badge, submission, acquisti.
- Gamification
  - Profili gioco, missioni, badge, leaderboard, regole XP, reward.
  - Storico minigame e override manuale.
- Monetizzazione
  - Affiliate links.
  - Sponsorship/banner/listing placements.
  - Campagne, date, status, CTA, asset.
- Shop
  - Prodotti digitali, ordini, download, entitlement, coupon.

## Area Utente

### Stato attuale

Presente:

- Login/registrazione via magic link.
- Collegamento della selezione locale all'account.
- Tool salvati/confronto/note tramite workspace.
- Pannello gamification base: livello, XP, reward, missioni e Vibe Rush.
- Stato account e logout.

Mancante:

- Profilo utente modificabile.
- Lista reale dei tool salvati dentro account, non solo contatori.
- Tool consigliati/personalizzati.
- Storico minigame/run e punti guadagnati.
- Storico attivita'.
- Submission inviate dall'utente.
- Referral.
- Preferenze.
- Acquisti shop / download digitali.
- Badge dettagliati e reward riscattabili.

### Area utente target

La nuova area dovrebbe diventare una dashboard di ritorno, non solo una pagina login.

Sezioni consigliate:

1. Overview
   - Email/profilo, livello, XP, prossima azione consigliata.
   - CTA: continua confronto, gioca, apri salvati.

2. Tool salvati
   - Lista tool salvati con note, priorita', motivazione salvataggio.
   - Azioni rapide: confronta, sposta in top, rimuovi, apri scheda.

3. Consigliati
   - Tool suggeriti in base a categorie salvate, confronti e note.
   - Non deve sembrare una lista generica.

4. Progressi
   - XP, livello, badge, streak, missioni.
   - Reward disponibili e reward gia' riscattati.

5. Storico minigame
   - Run Vibe Rush, Arena, Radar.
   - Score, XP, data, modalita', reward.

6. Submission
   - Tool suggeriti, stato, note admin pubblicabili, data.
   - Eventuale CTA "completa info" o "tool approvato".

7. Referral / founder
   - Codice referral, link, inviti, stato richiesta founder se introdotta.

8. Preferenze
   - Interessi, categorie, newsletter, privacy, notifiche.

9. Acquisti
   - Prodotti digitali comprati, download, ricevute, accessi premium.

## Modelli dati mancanti consigliati

- `account_profiles`
  - user_id, display_name, first_name, last_name, role, avatar_url, preferences jsonb.

- `user_activity_events`
  - user_id, type, entity_type, entity_id, metadata, created_at.

- `minigame_runs`
  - user_id, game_key, mode, score, xp_awarded, rank, metadata, created_at.

- `categories`
  - slug, label, description, icon, color, sort_order, seo fields, status.

- `founder_requests`
  - user_id/email, company, need, budget/timing, status, admin_notes.

- `sponsorship_placements`
  - placement_key, title, page, status, asset_url, target_url, date range.

- `sponsorship_campaigns`
  - sponsor, campaign, placements, pricing/status, reporting fields.

- `shop_products`
  - slug, title, description, price, currency, file/access metadata, status.

- `shop_orders`
  - user_id/email, product_id, provider, provider_order_id, status, paid_at.

- `user_referrals`
  - user_id, code, referred_email/user_id, status, reward metadata.

## Priorita' consigliate

### P0 - Riparare back office base

1. Creare una vera dashboard admin generale.
2. Ripristinare route Tool:
   - `/admin/tools`
   - `/admin/tools/new`
   - `/admin/tools/[id]/edit`
3. Spostare articoli su:
   - `/admin/articles`
   - `/admin/articles/new`
   - `/admin/articles/[id]/edit`
4. Correggere conversione suggestion -> tool.
5. Aggiornare navbar admin.

### P1 - Rendere area utente una dashboard

1. Aggiungere overview piu' compatta e orientata al ritorno.
2. Mostrare lista tool salvati reale.
3. Aggiungere tab Progressi con badge/XP/storico missioni.
4. Aggiungere submission inviate.
5. Introdurre `minigame_runs` per storico e trasparenza punti.

### P2 - Gestione piattaforma

1. Admin utenti.
2. Admin categorie.
3. Admin gamification.
4. Preferenze account.
5. Attivita' recente.

### P3 - Monetizzazione

1. Sponsorship/banner/listing.
2. Prodotti digitali/shop.
3. Acquisti in area utente.
4. Referral strutturato.

## Decisione operativa consigliata

Il prossimo lavoro dovrebbe partire dal P0, perche' senza Tool admin funzionante il back office non e'
ancora affidabile come centro di controllo.

Prima slice consigliata:

- Creare `/admin/tools` con lista tool e azioni rapide.
- Creare `/admin/tools/new` usando `ToolForm` e `createToolFormAction`.
- Creare `/admin/tools/[id]/edit` usando `ToolForm` e `updateToolFormAction`.
- Cambiare `/admin/suggestions` da `/admin/new?suggestion=...` a `/admin/tools/new?suggestion=...`.
- Lasciare `/admin` come dashboard generale e spostare blog sotto `/admin/articles`.
