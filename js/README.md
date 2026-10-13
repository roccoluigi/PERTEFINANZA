# File JavaScript del sito

Questa cartella contiene il codice interattivo, i dati dei certificati e le funzioni usate per generare le recensioni.

## File principali

### `app.js`

Gestisce le funzioni interattive del sito: menu e navigazione, tema, catalogo e filtri, ricerca nelle FAQ e nel glossario, condivisione e copia degli ISIN. Nelle recensioni statiche conserva il contenuto HTML e attiva i controlli, come il selettore del certificato.

### `data-certificates.js`

Contiene i dati dei certificati, tra cui ISIN, emittente, sottostanti, barriere, rendimenti e scadenze. Il catalogo, alcuni riquadri informativi e i generatori di recensioni usano questi dati.

### `data-review-pages.js`

Elenca gli ISIN per i quali esiste una recensione statica. `app.js` usa l’elenco per collegare ogni certificato alla relativa pagina, se disponibile. I generatori aggiornano questo file: non modificarlo a mano.

### `data-underlyings.js`

Contiene brevi descrizioni dei sottostanti, usate per comporre il testo delle recensioni.

### `reviews.js`

Genera il testo della recensione, gli scenari e gli elenchi dei punti di forza e delle criticità a partire dai dati di un certificato. È usato dalla pagina dinamica di ripiego e dal generatore. Le recensioni statiche contengono già il testo generato e non caricano questo file.

## Recensioni statiche

Le recensioni statiche sono file HTML nella cartella `recensioni/`. Il generatore legge i dati dei certificati da `data-certificates.js` e le valutazioni e descrizioni degli emittenti dalle schede HTML di `emittenti.html`.

Per generare o aggiornare tutte le recensioni:

```powershell
node scripts/generate-review.mjs --all
```

Per generare una sola recensione, sostituisci `<ISIN>` con il codice del certificato:

```powershell
node scripts/generate-review.mjs <ISIN>
```

Se aggiungi o rimuovi manualmente una pagina HTML, aggiorna l’elenco delle recensioni statiche e i collegamenti della home:

```powershell
node scripts/generate-review.mjs --sync
```

## FAQ e glossario

I contenuti delle FAQ e del glossario si trovano direttamente in `faq.html` e `glossario.html`. Non ci sono file dati né script dedicati per generarli: per modificarli, intervieni nelle rispettive pagine HTML.
