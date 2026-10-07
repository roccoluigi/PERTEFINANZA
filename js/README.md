FILE JAVASCRIPT DEL SITO

Questa cartella contiene il codice interattivo, i dati dei certificati e le funzioni usate per creare le recensioni.

FILE E FUNZIONI

app.js
Gestisce le funzioni interattive del sito: navigazione, menu, tema, catalogo e filtri, ricerca di FAQ e glossario, condivisione e copia degli ISIN. Nelle recensioni statiche lascia intatto il contenuto HTML e attiva controlli come il selettore del certificato.

data-certificates.js
Contiene i dati dei certificati, tra cui ISIN, emittente, sottostanti, barriere, rendimenti e scadenze. È usato dal catalogo, da alcuni widget e dal generatore delle recensioni.

data-review-pages.js
Elenca gli ISIN che hanno una recensione statica. app.js usa l'elenco per collegare ogni certificato alla pagina statica, quando disponibile. Il generatore aggiorna questo file: non modificarlo a mano.

data-underlyings.js
Contiene brevi descrizioni dei sottostanti, usate per comporre il testo delle recensioni.

reviews.js
Genera il testo della recensione, gli scenari e gli elenchi di punti di forza e criticità usando i dati di un certificato. Serve alla pagina dinamica di ripiego e al generatore. Le recensioni statiche contengono già il testo generato e non caricano questo file.

RECENSIONI STATICHE

Le recensioni sono file HTML nella cartella recensioni/. Rating e descrizioni degli emittenti sono letti dalle schede HTML in emittenti.html.

Per generare una recensione per ogni certificato, eseguire:

node scripts/generate-review.mjs --all

Per generare una sola recensione:

node scripts/generate-review.mjs <ISIN>

Se si aggiunge o rimuove manualmente una pagina HTML, aggiornare l'elenco e i collegamenti con:

node scripts/generate-review.mjs --sync

FAQ E GLOSSARIO

I contenuti sono già presenti in faq.html e glossario.html. I file dati e lo script che li generava sono stati rimossi: per modificarli, intervenire direttamente nei rispettivi HTML.
