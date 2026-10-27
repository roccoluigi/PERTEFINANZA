# Recensioni statiche

Questa cartella contiene le pagine HTML statiche delle recensioni. Le nuove recensioni usano una cartella con URL leggibile, nel formato `<emittente>-cash-collect-<ISIN>/index.html`; le recensioni pubblicate in precedenza possono mantenere il file `recensione-<ISIN>.html`. Il CMS conserva gli URL storici anche quando si modificano le recensioni.

## Gestione delle recensioni

Le recensioni vengono create e aggiornate dal CMS quando si pubblicano i certificati. La pubblicazione aggiorna anche l’elenco delle recensioni statiche e i collegamenti della home. Per aggiungere, modificare o rimuovere una recensione, usa il CMS invece di intervenire direttamente sui file HTML.

## Origine dei dati

Le pagine HTML sono generate dal publisher PHP del CMS a partire dai certificati pubblicati.
