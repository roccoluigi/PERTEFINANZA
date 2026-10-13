# Recensioni statiche

Questa cartella contiene le pagine HTML delle recensioni statiche. Il nome di ogni file segue il formato `recensione-<ISIN>.html`.

## Generare una recensione

Per creare o aggiornare la pagina di un solo certificato, sostituisci `<ISIN>` con il suo codice:

```powershell
node scripts/generate-review.mjs <ISIN>
```

L’ISIN deve essere presente in `js/data-certificates.js`. Il comando crea la pagina oppure sovrascrive quella già esistente, quindi aggiorna l’elenco delle recensioni statiche e i collegamenti della home.

Esempio:

```powershell
node scripts/generate-review.mjs DE000BD54H77
```

## Generare tutte le recensioni

Per creare o aggiornare una pagina per ciascun certificato presente in `js/data-certificates.js`, esegui:

```powershell
node scripts/generate-review.mjs --all
```

Le pagine esistenti vengono sovrascritte e quelle mancanti vengono create. Le modifiche manuali alle pagine sovrascritte vanno perse. Il comando non elimina le pagine dei certificati che non sono più presenti nei dati.

## Generare solo le recensioni mancanti

Per creare soltanto le pagine che non esistono ancora, confrontando gli ISIN in `js/data-certificates.js` con i file di questa cartella, esegui:

```powershell
node scripts/generate-review.mjs --missing
```

Le pagine già presenti vengono mantenute senza sovrascriverle. Al termine, il comando aggiorna l’elenco delle recensioni statiche e i collegamenti della home. Per aggiornare anche le pagine esistenti, usa `--all`.

## Origine dei dati

Le caratteristiche dei certificati provengono da `js/data-certificates.js`. Le valutazioni e le descrizioni degli emittenti vengono lette dalle relative schede HTML in `emittenti.html`.

## Aggiungere o rimuovere pagine manualmente

Se crei o elimini manualmente una pagina HTML in questa cartella, aggiorna l’elenco delle recensioni statiche e i collegamenti della home:

```powershell
node scripts/generate-review.mjs --sync
```

Se modifichi soltanto il contenuto di una pagina già esistente, non è necessario eseguire la sincronizzazione.

Dopo aver eliminato una pagina statica, i collegamenti per quell’ISIN rimandano alla recensione dinamica. Il comando `--sync` aggiorna l’elenco e i collegamenti, ma non ricrea la pagina eliminata.
