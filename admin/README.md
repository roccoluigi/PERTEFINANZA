# Pannello admin PERTEFINANZA

Dashboard autonoma in PHP 8.1+ per creare e modificare certificati, salvare bozze e pubblicare le relative schede statiche. Sul server non servono Node.js o dipendenze esterne.

## Installazione su Aruba

1. Carica la cartella `admin/` nella stessa document root del sito, mantenendo accanto le cartelle e i file del sito (`js/`, `css/`, `recensione.html`, `index.html`, `sitemap.xml` e `recensioni/`).
2. Copia `admin/config.example.php` in `admin/config.php` e sostituisci `setup_token` con un valore casuale personale di almeno 32 caratteri. Non caricare né condividere `config.php`.
3. Per mantenere i dati fuori dalla document root, imposta `storage_dir` in `config.php` su una cartella privata scrivibile accessibile a PHP e copia in tale cartella `certificates.json`, `review-overrides.json` e `published-review-overrides.json` dalla cartella `admin/private/`. Se non puoi usare una cartella esterna, lascia lo storage predefinito e conserva `admin/private/.htaccess`.
4. Verifica che PHP possa scrivere nello storage, in `js/data-certificates.js`, `index.html`, `sitemap.xml` e nella cartella `recensioni/`.
5. Apri `/admin/setup.php`, inserisci il token di installazione e crea username e password. La password deve essere lunga almeno 14 caratteri.
6. A installazione conclusa, elimina `setup_token` da `config.php` e conserva una copia di backup sicura della configurazione.
7. Accedi da `/admin/`.

## Gestione contenuti

Dal pannello certificati apri **Gestione contenuti** per modificare emittenti e rating, capitoli di formazione, FAQ, termini del glossario, Contatti & Info, Trasparenza & Rischi e Disclaimer e Note Legali. Le prime quattro sezioni consentono di aggiungere, modificare o rimuovere elementi; i testi formattati mantengono paragrafi e collegamenti consentiti. Gli approfondimenti non compaiono nei campi di modifica di Formazione, FAQ e Glossario: vengono conservati automaticamente e restano nelle pagine pubblicate.

Contatti & Info consente di modificare testi e recapiti, senza esporre o sostituire i campi e il comportamento del modulo email. Trasparenza & Rischi modifica il titolo e il testo mostrati nel footer di tutte le pagine del sito. Disclaimer e Note Legali consente di modificare titoli, testi e data di aggiornamento; le sezioni legali non possono essere aggiunte, rimosse o riordinate, così restano validi gli ancoraggi usati dai collegamenti del sito.

I badge accanto alle voci del menu indicano quanti elementi risultano modificati, aggiunti o rimossi rispetto alla versione pubblicata. **Pubblica tutte le modifiche** resta disattivato quando non ci sono differenze in attesa.

**Salva bozza** conserva le modifiche nell’archivio privato senza cambiare la pagina pubblica. I comandi globali nell’header pubblicano o annullano le modifiche di tutte le sezioni CMS e dei certificati insieme; non ci sono comandi di pubblicazione o annullamento per la singola sezione. Ogni pubblicazione crea una copia di backup delle pagine HTML sostituite. Prima di eliminare elementi, verifica i collegamenti interni che li citano.

## Uso

- **Nuovo ISIN** crea una bozza dopo la validazione del formato e della cifra di controllo ISIN.
- **Modifica** consente di aggiornare dati del prodotto, sottostanti e visibilità in home. Mostra inoltre tutto il testo della scheda: introduzione e analisi, descrizione e celle della matrice, punti di forza e criticità.
- I contatori accanto a **In home** e **Top Picks** mostrano quante schede sono selezionate per ciascuna area. Non c’è un limite massimo: vengono mostrate tutte le schede selezionate.
- Ogni scheda nell’elenco indica se è inclusa in **Home** e/o in **Top Picks**.
- Il testo principale può essere formattato selezionando le parole e usando i pulsanti grassetto, corsivo e sottolineato; non occorre scrivere marcatori o HTML. Punti di forza e criticità sono modificabili punto per punto, aggiungendo o rimuovendo singole voci.
- I dati finanziari si modificano nei relativi campi: cambiare il testo non aggiorna i dati e occorre verificare la coerenza delle percentuali e delle condizioni riportate nella matrice.
- **Salva bozza** non modifica il sito pubblico. Per una scheda nuova o modificata, usa **Pubblica scheda** o **Pubblica modifiche** nella sua riga: le altre bozze restano in attesa.
- **Annulla tutte le modifiche** nell’header ripristina i certificati e i contenuti pubblicati di tutte le sezioni, elimina le nuove schede non pubblicate e annulla le rimozioni in attesa. Le bozze editoriali vengono scartate.
- **Segna per rimozione** conserva la pagina online finché non scegli **Rimuovi dal sito**; puoi annullare la rimozione prima di confermarla.
- **Pubblica tutte le modifiche** nell’header applica tutte le nuove schede, le modifiche e le rimozioni in attesa, oltre alle bozze di tutte le sezioni editoriali.
- Ogni pubblicazione sincronizza dati JavaScript, pagine statiche, schede in home, manifest e sitemap, e crea un backup dei file sostituiti.
- Il comando **Notte/Giorno** usa la stessa preferenza salvata dal sito pubblico e vale anche nelle altre pagine PERTEFINANZA aperte nello stesso browser.

Il pannello deve essere usato con HTTPS sul sito pubblico. La cartella `/admin/` è esclusa dalla scansione tramite `robots.txt`; questa impostazione non sostituisce autenticazione e protezione dei dati.

## Test locale

Per provare il pannello senza pubblicare sul sito online:

1. Configura `admin/config.php` come sopra e usa una copia separata del sito come area di staging.
2. Avvia PHP dalla cartella radice della copia:

   ```powershell
   php -S 127.0.0.1:8080
   ```

3. Apri `http://127.0.0.1:8080/admin/setup.php`, completa l’installazione e poi verifica login, salvataggio bozze e pubblicazione.
4. Dopo il login, usa **Gestione contenuti** o apri `http://127.0.0.1:8080/admin/content.php` per provare le sezioni editoriali.

Una pubblicazione aggiorna i file dello staging: non effettuare il test sulla copia di produzione.
