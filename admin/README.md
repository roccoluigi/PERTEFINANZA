# Pannello di amministrazione PERTEFINANZA

Il pannello, realizzato in PHP 8.1 o versioni successive, permette di gestire i certificati, le relative schede e i contenuti del sito. Sul server non serve Node.js; è necessario installare le dipendenze PHP indicate nel file `composer.json`.

## Installazione sul server Aruba

1. Carica la cartella `admin/` nella stessa cartella pubblica del sito. Mantieni accanto anche le cartelle e i file del sito, tra cui `js/`, `css/`, `recensione.html`, `index.html`, `sitemap.xml` e `recensioni/`.
2. Crea `admin/config.php` direttamente sul server. Imposta `site_url` con l’indirizzo HTTPS pubblico del sito e `storage_dir` con il percorso di una cartella privata scrivibile da PHP. Se il pannello non è ancora stato configurato, aggiungi un `setup_token` casuale di almeno 32 caratteri. Dopo la prima configurazione, rimuovi il token. Non caricare né condividere `config.php`.
3. Se vuoi conservare i dati fuori dalla cartella pubblica, imposta `storage_dir` su una cartella privata e copiali al suo interno: `certificates.json`, `review-overrides.json` e `published-review-overrides.json`, che si trovano in `admin/private/`. Se usi invece la cartella predefinita, conserva `admin/private/.htaccess` per impedirne l’accesso pubblico.
4. Consenti a PHP di scrivere nell’archivio privato, nei file JavaScript dei dati, in `sitemap.xml`, nelle pagine HTML del sito e nella cartella `recensioni/`. Il pannello aggiorna questi file quando pubblica le modifiche.
5. Per la posta elettronica Aruba, imposta in `config.php` il server SMTP `smtps.aruba.it`, la porta `465`, la cifratura `ssl`, l’indirizzo completo come nome utente e la password della casella. Se richiesto dal gestore, usa `info@pertefinanza.it` come mittente e destinatario. Per caselle di altri gestori, inserisci i relativi parametri SMTP. Non salvare credenziali nei file pubblici o nel repository.
6. Dalla cartella principale del sito, installa le dipendenze PHP con:

   ```powershell
   composer install --no-dev
   ```

   Carica sul server anche la cartella `vendor/` generata da Composer.
7. Apri `/admin/setup.php`, inserisci il token e crea il nome utente e la password. La password deve contenere almeno 14 caratteri.
8. Dopo la configurazione, rimuovi `setup_token` da `config.php` e conserva una copia sicura del file di configurazione.
9. Accedi al pannello da `/admin/`.

## Gestione dei contenuti

Dal pannello dei certificati apri **Gestione contenuti** per modificare emittenti, formazione, FAQ, glossario, Contatti & Info, Trasparenza, rischi e avvertenze, e Disclaimer e Note Legali.

Le sezioni **Emittenti**, **Formazione**, **FAQ** e **Glossario** permettono di aggiungere, modificare e rimuovere elementi. I contenuti formattati conservano paragrafi e collegamenti consentiti. Gli approfondimenti e i relativi collegamenti non compaiono nei campi di modifica di Formazione, FAQ e Glossario: vengono mantenuti automaticamente nelle pagine pubblicate.

**Contatti & Info** permette di modificare testi e recapiti, senza sostituire i campi o il funzionamento del modulo di contatto. **Trasparenza, rischi e avvertenze** contiene due elementi distinti:

- il titolo e il testo informativo mostrati nel piè di pagina di tutte le pagine;
- l’avvertenza breve mostrata sotto ogni scheda prodotto.

**Disclaimer e Note Legali** permette di modificare i titoli, i testi e la data di aggiornamento. Le sezioni legali non possono essere aggiunte, rimosse o riordinate, così gli ancoraggi usati dai collegamenti interni restano validi.

I numeri accanto alle voci del menu indicano quanti elementi sono diversi dalla versione pubblicata. **Pubblica tutte le modifiche** è disattivato quando non ci sono modifiche in attesa.

**Salva bozza** conserva le modifiche nell’archivio privato senza aggiornare il sito pubblico. I comandi nell’intestazione pubblicano o annullano insieme le modifiche di tutte le sezioni e dei certificati: non è possibile pubblicare o annullare una singola sezione. Ogni pubblicazione crea una copia di sicurezza delle pagine HTML aggiornate. Prima di rimuovere un elemento, controlla i collegamenti interni che lo citano.

## Gestione dei certificati

- **Nuovo ISIN** crea una bozza dopo aver verificato il formato e la cifra di controllo dell’ISIN.
- **Modifica** permette di aggiornare i dati del prodotto, i sottostanti e la visibilità nella home. Mostra anche l’URL della recensione, modificabile, e tutti i testi della scheda: introduzione e analisi, descrizione e celle della matrice, punti di forza e criticità. Le nuove URL seguono il formato `/recensioni/<emittente>-cash-collect-<ISIN>/`.
- I contatori accanto a **In home** e **Top Picks** indicano quanti certificati sono selezionati per ciascuna area. Non c’è un limite massimo: vengono mostrati tutti quelli selezionati.
- Ogni scheda dell’elenco indica se il certificato è incluso in **Home** e/o in **Top Picks**.
- Per formattare il testo principale, seleziona le parole e usa i pulsanti per il grassetto, il corsivo e la sottolineatura. Non occorre inserire marcatori o codice HTML. I punti di forza e le criticità si modificano uno alla volta: puoi aggiungere o rimuovere singole voci.
- I dati finanziari hanno campi dedicati. Una modifica al testo descrittivo non aggiorna quei dati: verifica che percentuali e condizioni della matrice siano coerenti.
- **Salva bozza** non aggiorna il sito pubblico. Per pubblicare una scheda nuova o modificata, usa **Pubblica scheda** o **Pubblica modifiche** nella relativa riga; le altre bozze restano in attesa.
- **Segna per rimozione** mantiene la pagina online finché non confermi con **Rimuovi dal sito**. Puoi annullare la rimozione prima di confermarla.
- **Pubblica tutte le modifiche** nell’intestazione applica tutte le nuove schede, le modifiche e le rimozioni in attesa, oltre alle bozze dei contenuti.
- Ogni pubblicazione aggiorna i dati JavaScript, le pagine statiche, le schede in home, l’elenco delle recensioni statiche e la mappa del sito; crea inoltre una copia di sicurezza dei file aggiornati.
- Ogni pubblicazione mantiene aggiornati gli asset per il consenso e Meta Pixel su tutte le pagine pubbliche interessate. Le nuove recensioni ereditano l’inclusione dal modello `recensione.html`; le nuove pagine create al di fuori del CMS devono includere gli asset di consenso nel proprio `<head>`.
- **Rigenera sitemap**, nella sezione Certificati, aggiorna soltanto `sitemap.xml` usando le schede già pubblicate. Il comando crea una copia di sicurezza e richiede che `site_url` contenga il dominio pubblico HTTPS.
- Il comando **Notte/Giorno** usa la stessa preferenza salvata dal sito e la applica anche alle altre pagine PERTEFINANZA aperte nello stesso browser.
- **Cambia password**, nell’intestazione, richiede la password attuale e una nuova password confermata di almeno 14 caratteri. Dopo il cambio, le altre sessioni amministrative vengono disconnesse.

## Sicurezza e modulo di contatto

Usa il pannello e il modulo di contatto tramite HTTPS. L’accesso viene bloccato dopo cinque tentativi errati dallo stesso indirizzo IP nell’arco di 15 minuti; il conteggio è condiviso tra le sessioni e salvato nell’archivio privato, che deve quindi essere scrivibile da PHP.

Il pannello legge l’indirizzo del visitatore da `REMOTE_ADDR`. Se il sito usa un proxy, configura il server per fornire l’indirizzo del visitatore in modo attendibile: non fidarti di intestazioni inoltrate che non siano state verificate. La cartella `/admin/` è esclusa dalla scansione tramite `robots.txt`, ma questa impostazione non sostituisce l’autenticazione né la protezione dei dati.

Il modulo di contatto invia i messaggi tramite SMTP senza salvarli sul server. Il server non può confermare che il messaggio sia stato letto o recapitato alla casella finale.

## Prova in un ambiente separato

Per provare il pannello senza modificare il sito pubblico, usa una copia separata del sito.

1. Configura `admin/config.php` come descritto sopra e prepara la copia come ambiente di prova.
2. Dalla cartella principale della copia, installa le dipendenze:

   ```powershell
   composer install
   ```

3. Avvia il server PHP dalla stessa cartella:

   ```powershell
   php -S 127.0.0.1:8080
   ```

4. Apri `http://127.0.0.1:8080/admin/setup.php`, completa la configurazione e verifica l’accesso, il salvataggio delle bozze e la pubblicazione.
5. Dopo aver effettuato l’accesso, apri **Gestione contenuti** oppure visita `http://127.0.0.1:8080/admin/content.php` per provare le sezioni editoriali.

La pubblicazione aggiorna i file della copia di prova. Non effettuare questi test sulla copia di produzione.
