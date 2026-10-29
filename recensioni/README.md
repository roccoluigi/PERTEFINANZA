# Recensioni statiche

Questa cartella contiene le pagine HTML statiche delle recensioni. Le nuove recensioni create dal CMS usano un file con URL leggibile, nel formato `<emittente>-cash-collect-<ISIN>.html`. Le recensioni già pubblicate possono mantenere il percorso precedente nella propria cartella `index.html` oppure il file storico `recensione-<ISIN>.html`, finché l’URL non viene modificato nel CMS.

## Gestione delle recensioni

Le recensioni vengono create e aggiornate dal CMS quando si pubblicano i certificati. La pubblicazione aggiorna anche l’elenco delle recensioni statiche e i collegamenti della home. Per aggiungere, modificare o rimuovere una recensione, usa il CMS invece di intervenire direttamente sui file HTML.

## Origine dei dati

Le pagine HTML sono generate dal publisher PHP del CMS a partire dai certificati pubblicati.
