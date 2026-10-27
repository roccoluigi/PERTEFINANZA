# File JavaScript del sito

Questa cartella contiene il codice interattivo e i dati usati dal sito.

## File principali

### `app.js`

Gestisce le funzioni interattive del sito: menu e navigazione, tema, catalogo e filtri, ricerca nelle FAQ e nel glossario, condivisione e copia degli ISIN. Dopo una copia riuscita invia a Meta Pixel l’evento personalizzato `CopyISIN`, con ISIN e superficie (`home`, `widget`, `catalog` o `technical_sheet`), solo se il consenso marketing è attivo. Nelle recensioni statiche conserva il contenuto HTML e attiva i controlli, come il selettore del certificato.

### `data-certificates.js`

Contiene i dati dei certificati, tra cui ISIN, emittente, sottostanti, barriere, rendimenti e scadenze. Il catalogo, alcuni riquadri informativi e il publisher PHP del CMS usano questi dati.

### `data-issuers.js`

Contiene le descrizioni brevi e i rating disponibili degli emittenti, derivati dai profili in `emittenti.html`. Le anteprime delle schede usano questi dati; il publisher PHP del CMS aggiorna il file. Non modificarlo a mano.

### `data-review-pages.js`

Elenca gli ISIN per i quali esiste una recensione statica. `app.js` usa l’elenco per collegare ogni certificato alla relativa pagina, se disponibile. Il publisher PHP del CMS aggiorna questo file: non modificarlo a mano.

### `data-underlyings.js`

Contiene brevi descrizioni dei sottostanti, usate per comporre il testo delle recensioni.

### `reviews.js`

Genera il testo della recensione dinamica di ripiego, gli scenari e gli elenchi dei punti di forza e delle criticità a partire dai dati di un certificato. Le recensioni statiche contengono già il testo generato e non caricano questo file.

## Recensioni statiche

Le recensioni statiche sono file HTML nella cartella `recensioni/`. Il publisher PHP del CMS le genera e aggiorna, insieme all’elenco delle recensioni e ai collegamenti della home, quando pubblichi i certificati.

## FAQ e glossario

I contenuti delle FAQ e del glossario si trovano direttamente in `faq.html` e `glossario.html`. Non ci sono file dati né script dedicati per generarli: per modificarli, intervieni nelle rispettive pagine HTML.
