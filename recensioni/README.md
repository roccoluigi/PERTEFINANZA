RECENSIONI STATICHE

In questa cartella trovi le pagine HTML delle recensioni. Ogni file ha il nome:

recensione-ISIN.html

GENERARE UNA RECENSIONE

Per creare o rigenerare la pagina di un solo certificato:

node scripts/generate-review.mjs <ISIN>

L'ISIN deve essere presente in js/data-certificates.js. Il comando crea la pagina, oppure sovrascrive quella esistente, e aggiorna automaticamente l'indice dei link.

Esempio:

node scripts/generate-review.mjs DE000BD54H77

GENERARE TUTTE LE RECENSIONI

Per creare o rigenerare una pagina per ogni certificato presente in js/data-certificates.js:

node scripts/generate-review.mjs --all

Le pagine già esistenti vengono sovrascritte; quelle mancanti vengono create. Le eventuali modifiche manuali alle pagine rigenerate vengono perse. Il comando non elimina i file relativi a certificati che non sono più nei dati.

GENERARE SOLO LE RECENSIONI MANCANTI

Per creare solo le pagine non ancora presenti, confrontando gli ISIN in js/data-certificates.js con i file nella cartella recensioni:

node scripts/generate-review.mjs --missing

Le pagine già esistenti vengono saltate e non sovrascritte. Al termine, l'indice delle recensioni statiche e i collegamenti in home vengono sincronizzati. Per aggiornare anche le pagine esistenti usa --all.

DA DOVE ARRIVANO I DATI

Le caratteristiche dei certificati provengono da js/data-certificates.js. Rating e descrizioni degli emittenti vengono letti dalle schede HTML in emittenti.html.

AGGIUNGERE O ELIMINARE PAGINE A MANO

Se crei o elimini manualmente un file HTML in questa cartella, aggiorna l'indice e i collegamenti della home con:

node scripts/generate-review.mjs --sync

Se modifichi solo il contenuto di una pagina già esistente, non serve eseguire il sync.

Dopo aver eliminato una pagina, i link per quell'ISIN tornano alla recensione dinamica; il comando non ricrea la pagina statica.
