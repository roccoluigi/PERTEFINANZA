// Dati statici PERTEFINANZA

const GLOSSARY_DATA = [
  {
    term: "Airbag (Meccanismo e Fattore)",
    category: "Protezione",
    definition: "Clausola accessoria di protezione che interviene a scadenza se viene violata la barriera del capitale. Nei certificati standard, se il sottostante peggiore perde il 55% a fronte di una barriera al 60%, l'investitore subisce una perdita del 55%. Con l'Airbag, la perdita a scadenza viene ricalcolata rapportando il valore finale del sottostante non allo strike iniziale (100%), bensì al livello della barriera (Fattore Airbag = 100 / Livello Barriera). Questo attenua drasticamente la perdita in conto capitale in caso di crollo dei mercati.",
    example: "Con strike 100€ e barriera Airbag al 50% (Fattore Airbag = 2), se a scadenza il titolo quota 40€ (-60%), il certificato non rimborsa 40€ ma 40 x 2 = 80€, limitando la perdita a soli 20€ (-20%) anziché al -60% del titolo."
  },
  {
    term: "Autocallability (Rimborso Anticipato Automatico)",
    category: "Meccanismo",
    definition: "Condizione contrattuale che prevede la chiusura anticipata obbligatoria del certificato a determinate date di osservazione prefissate. Se tutti i sottostanti del paniere quotano a un valore pari o superiore al livello trigger di autocall (solitamente fissato al 100% dello strike iniziale o a livelli inferiori nei modelli Step-Down), l'emittente rimborsa all'investitore il valore nominale (tipicamente 100€ o 1.000€) più la cedola del periodo e tutte le eventuali cedole precedentemente trattenute in memoria.",
    example: "Al 6° mese, se tutti i titoli sono pari o sopra il 100% dello strike iniziale, il certificato si estingue rimborsando 100€ + la cedola mensile. L'investitore incassa il capitale e cessa ogni esposizione sul prodotto."
  },
  {
    term: "Barriera Capitale Discreta (all'Europea)",
    category: "Protezione",
    definition: "Livello percentuale del valore iniziale (es. 50%, 60% dello strike) rilevato esclusivamente alla data di valutazione finale del certificato (scadenza). Eventuali crolli del sottostante al di sotto della barriera durante la vita del prodotto non producono alcun effetto sulla protezione del capitale, purché alla data di fixing finale il prezzo del titolo sia tornato al di sopra di tale livello.",
    example: "Se un'azione scende del 60% durante il secondo anno di vita del prodotto ma all'ultimo giorno di quotazione recupera e chiude al -35% (sopra una barriera fissata al -40%), il capitale viene rimborsato integralmente a 100 euro."
  },
  {
    term: "Barriera Capitale Continua (all'Americana)",
    category: "Protezione",
    definition: "Soglia di protezione monitorata in modo continuativo durante l'intero orario di negoziazione di ogni giorno di borsa aperta per tutta la durata del certificato. Se il sottostante tocca o oltrepassa la barriera anche solo per una frazione di secondo (evento 'touch'), la garanzia del capitale decade definitivamente per il resto della vita del certificato, trasformando lo strumento in una replica lineare del titolo fino a scadenza.",
    example: "Un picco improvviso di volatilità intraday che porti il titolo a toccare la barriera invalida permanentemente la protezione, anche se il giorno dopo il titolo rimbalza e sale del 20%. Rischio di Gap Down: la barriera continua è esposta anche alle aperture in gap. Se un titolo chiude sopra barriera ma riapre il giorno successivo con un calo del 15% al di sotto di essa, ad esempio dopo un profit warning notturno, la barriera può essere infranta all'apertura a prezzi già penalizzati, senza la possibilità di gestire l'uscita durante la seduta precedente."
  },
  {
    term: "Barriera Cedola (Trigger Cedolare)",
    category: "Rendimento",
    definition: "Livello percentuale prefissato (spesso compreso tra il 50% e il 70% dello strike iniziale) che il peggiore dei sottostanti deve rispettare a ciascuna data di osservazione periodica per dare diritto all'incasso della cedola contrattuale. Spesso coincide con la barriera capitale, ma in molte strutture 'Low Barrier' la barriera cedolare può essere posizionata a un livello differente.",
    example: "Con barriera cedola al 60%, se alla data di rilevazione mensile tutti i titoli quotano almeno al 61% dello strike, la cedola viene erogata; se anche uno solo quota al 58%, la cedola non viene distribuita in quel mese (ma può andare a memoria)."
  },
  {
    term: "Bid-Only (Status di Negoziazione)",
    category: "Mercati & Liquidità",
    definition: "Particolare condizione operativa in cui il Liquidity Provider (Market Maker) dell'emittente espone sul book di negoziazione unicamente proposte di acquisto (Bid/Denaro) e non più proposte di vendita (Ask/Lettera). Questo si verifica quando l'emittente ha esaurito i certificati emessi (size interamente collocata), quando si avvicina la scadenza, o per specifiche decisioni di risk management. Gli investitori possono continuare a vendere le proprie quote alla banca emittente, ma non possono acquistarne di nuove sul book (salvo che altri investitori privati espongano offerte in lettera).",
    example: "In un certificato in Bid-Only, se l'emittente compra a 102€, puoi monetizzare la tua posizione vendendola al Market Maker. Se un privato mette in vendita a 102.50€, puoi comprare solo da lui entro i limiti del Virtual Offer Price fissato dal mercato."
  },
  {
    term: "Bonus Cap (Certificato)",
    category: "Tipologia",
    definition: "Struttura a capitale condizionatamente protetto appartenente alla classificazione ACEPI che riconosce a scadenza un premio prefissato (il 'Bonus') se il sottostante non viola mai la barriera durante la vita del certificato (solitamente barriera continua americana). La presenza del 'Cap' stabilisce il rendimento massimo ottenibile dall'investitore in caso di forte rialzo del titolo sottostante.",
    example: "Bonus Cap a 115€ con barriera continua al 70%. Se il titolo non tocca mai il -30%, il certificato rimborsa 115€ a scadenza. Se la barriera viene infranta, rimborsa la performance lineare del sottostante fino al valore massimo del Cap."
  },
  {
    term: "Buffer (Cuscinetto dalla Barriera)",
    category: "Parametri & Greche",
    definition: "Distanza percentuale che separa la quotazione corrente del sottostante (in particolare del titolo 'Worst-Of') dal livello della barriera capitale o cedolare. Rappresenta l'indicatore fondamentale per valutare il margine di sicurezza immediato del certificato.",
    example: "Se un titolo ha strike 20€ e barriera al 60% (12€), e attualmente quota 16€, il Buffer dalla barriera è pari a: (16 - 12) / 16 = 25%. Il titolo può ancora perdere il 25% dal prezzo attuale prima di raggiungere la barriera."
  },
  {
    term: "Cash Collect (Famiglia)",
    category: "Tipologia",
    definition: "La macrofamiglia di certificati a capitale condizionatamente protetto più scambiata in Italia. È strutturata per erogare flussi cedolari periodici (mensili, trimestrali o semestrali) vincolati al mancato superamento al ribasso di una barriera di prezzo, con rimborso integrale del valore nominale a scadenza in caso di tenuta del livello barriera.",
    example: "Comprende le varianti Phoenix Memory, Fixed Cash Collect, Step-Down, Airbag e Softcallable, ideate per estrarre rendimento in scenari di mercato rialzisti, laterali o moderatamente calanti."
  },
  {
    term: "Cedola Incondizionata (Fixed)",
    category: "Rendimento",
    definition: "Premio periodico garantito che viene pagato all'investitore indipendentemente dall'andamento di mercato dei titoli sottostanti. Anche in caso di crollo drastico o violazione delle barriere durante la vita del prodotto, l'emittente è obbligato a erogare la cedola pattuita alle date di stacco stabilite.",
    example: "Un certificato con cedola fissa dello 0.70% mensile pagherà sempre tale importo ogni mese per tutta la sua durata; solo il rimborso del capitale a scadenza finale resterà condizionato al rispetto della barriera."
  },
  {
    term: "Classificazione ACEPI",
    category: "Normativa & KID",
    definition: "La mappa e tassonomia ufficiale redatta dall'Associazione Italiana Certificati e Prodotti di Investimento. Suddivide i prodotti in 5 macrocategorie: 1) Certificati a Capitale Protetto (garantito al 100%); 2) Certificati a Capitale Condizionatamente Protetto (Cash Collect, Express, Bonus); 3) Certificati a Capitale Non Protetto (Benchmark, Outperformance); 4) Certificati a Leva (Leva Fissa e Leva Variabile Turbo/MiniFuture); 5) Credit Linked Notes.",
    example: "La mappa ACEPI standardizza la nomenclatura commerciale dei vari emittenti bancari, consentendo agli investitori di confrontare oggettivamente le caratteristiche strutturali dei prodotti."
  },
  {
    term: "Delta (Greca del Certificato)",
    category: "Parametri & Greche",
    definition: "Rapporto che esprime la sensibilità del prezzo del certificato al variare di un euro (o di un punto percentuale) del prezzo del sottostante. Un certificato con sottostante sopra strike ha solitamente un Delta basso (il prezzo oscilla poco al muoversi del titolo), mentre un certificato con sottostanti vicini o sotto la barriera ha un Delta vicino a 1, replicando fedelmente le oscillazioni azionarie.",
    example: "Se un certificato ha un Delta di 0.35, ad un aumento dell'1% del titolo peggiore corrisponde un aumento teorico stimato dello 0.35% nel prezzo del certificato sul secondario."
  },
  {
    term: "Discount Certificate (a Sconto)",
    category: "Tipologia",
    definition: "Certificato a capitale non protetto acquistato a un prezzo sensibilmente inferiore (a sconto) rispetto al valore di mercato corrente dell'azione o dell'indice sottostante. Prevede un tetto massimo di rimborso (Cap) che limita il guadagno potenziale in cambio dello sconto iniziale, che funge da cuscinetto protettivo contro ribassi moderati.",
    example: "Se un'azione quota 100€, il Discount Certificate viene emesso a 85€ con Cap a 100€. Se a scadenza il titolo quota 100€ o più, rimborsa 100€ (+17.6% di guadagno); l'investitore è in utile per qualsiasi valore del titolo superiore a 85€."
  },
  {
    term: "Dividend Risk (Rischio Dividendi)",
    category: "Parametri & Greche",
    definition: "Rischio legato alle variazioni delle stime sui dividendi futuri distribuiti dai titoli sottostanti. Gli emittenti utilizzano i dividendi attesi per acquistare le opzioni che finanziano le cedole e le barriere protettive (l'investitore in certificati non incassa i dividendi ordinari delle azioni). Se una società annuncia a sorpresa un dividendo straordinario o molto più alto del previsto, il prezzo del certificato cala sul mercato secondario; se il dividendo viene tagliato, il prezzo del certificato tende ad apprezzarsi.",
    example: "Nei basket su titoli bancari o utility (generosi distributori di dividendi), una modifica delle politiche di payout incide direttamente sulla curva dei prezzi dei certificati sul secondario."
  },
  {
    term: "Effetto Magnet (Trigger Adattivo)",
    category: "Meccanismo",
    definition: "Meccanismo innovativo introdotto nei Cash Collect di ultima generazione dove la soglia di autocall per il rimborso anticipato non è fissa, ma si adatta dinamicamente verso il basso, 'attratta' dal livello calante del sottostante Worst-Of fino a un valore minimo consentito. Questo aumenta considerevolmente la probabilità statistica di chiudere l'investimento in anticipo con profitto anche in mercati laterali o ribassisti.",
    example: "Se il peggior titolo perde il 15%, il trigger di rimborso anticipato si abbassa automaticamente dall'iniziale 100% all'85% dello strike, permettendo al certificato di rimborsare anticipatamente a 100€ + cedola senza dover attendere un recupero del titolo."
  },
  {
    term: "Effetto Memoria",
    category: "Rendimento",
    definition: "Caratteristica contrattuale che consente di non perdere definitivamente i premi periodici non distribuiti a causa del temporaneo superamento al ribasso della barriera cedola. Tutte le cedole non incassate vengono accantonate virtualmente in memoria e vengono accreditate integralmente alla prima data di rilevazione in cui tutti i titoli del basket tornano a quotare sopra la barriera.",
    example: "Se per 4 mesi consecutivi un titolo quota sotto barriera, non viene pagato alcun importo. Se al 5° mese il titolo risale sopra la soglia, l'investitore incassa in un'unica soluzione la cedola del 5° mese più le 4 cedole arretrate."
  },
  {
    term: "EuroTLX / Cert-X e SeDeX",
    category: "Mercati & Liquidità",
    definition: "I due mercati telematici multilaterali e regolamentati di Borsa Italiana dedicati alla negoziazione di certificati e covered warrant. Prevedono la presenza di un Market Maker (Specialist) soggetto agli obblighi di quotazione previsti dal regolamento del mercato, dal segmento e dalle condizioni dello specifico strumento: spread denaro-lettera, quantità minime e finestre temporali possono essere definiti o modificati secondo le regole applicabili.",
    example: "Gli orari di negoziazione tipici su SeDeX ed EuroTLX vanno dalle 09:05 alle 17:30. La presenza del Market Maker non garantisce però l'esecuzione in qualsiasi momento: durante fasi di stress possono verificarsi sospensioni, spread più ampi o assenza temporanea di quotazioni."
  },
  {
    term: "Ex-Date (Data di Stacco della Cedola)",
    category: "Rendimento",
    definition: "Il giorno di borsa aperta a partire dal quale il certificato quota sul mercato 'senza diritto alla cedola' (ex-coupon). Chi acquista il certificato il giorno della Ex-Date o successivamente non riceverà il premio in corso di distribuzione; per avere diritto all'incasso della cedola occorre acquistare il certificato almeno il giorno precedente la Ex-Date (cum-date). Nel giorno di Ex-Date il prezzo del certificato tipicamente scende di un importo pari all'ammontare della cedola staccata.",
    example: "Se la Ex-Date è il 14 maggio, l'ultimo giorno utile per acquistare il certificato e incassare la cedola è il 13 maggio. Acquistando il 14 maggio non si riceverà l'accredito."
  },
  {
    term: "Express Certificate",
    category: "Tipologia",
    definition: "Certificato a capitale condizionatamente protetto strutturato specificamente per sfruttare l'autocallability precoce: ad ogni data periodica di verifica, se il sottostante quota sopra lo strike iniziale, il prodotto viene rimborsato a 100 euro più un premio progressivamente cumulato che aumenta proporzionalmente al passare del tempo.",
    example: "Se al 1° anno il titolo è sopra strike rimborsa 100€ + 8€ di premio; se non rimborsa e passa al 2° anno, rimborserà 100€ + 16€, e così via, offrendo rendimenti cumulativi attraenti."
  },
  {
    term: "KID (Key Information Document ex Regolamento PRIIPs)",
    category: "Normativa & KID",
    definition: "Documento informativo standardizzato a livello europeo di massimo 3 pagine, obbligatorio per legge prima della sottoscrizione o dell'acquisto di qualsiasi certificato. Riporta in modo sintetico e trasparente l'indicatore sintetico di rischio (SRI) su scala da 1 a 7, i quattro scenari di performance probabilistici (favorevole, moderato, sfavorevole, stress), i costi d'ingresso e correnti, e le informazioni sulla liquidabilità dello strumento.",
    example: "Il KID permette di comprendere immediatamente se il certificato ha costi impliciti elevati (es. 2.5% annuo) o se espone a scenari di stress con perdita totale del capitale."
  },
  {
    term: "Liquidity Provider / Market Maker (Specialist)",
    category: "Mercati & Liquidità",
    definition: "L'intermediario finanziario o la divisione trading dell'emittente bancario che, secondo le regole del mercato e le condizioni dello specifico strumento, espone proposte di acquisto (Bid) e di vendita (Ask). Il suo compito è favorire la liquidità, ma non garantisce in ogni momento un prezzo vicino al valore teorico: in fasi di elevata volatilità può ampliare lo spread, ridurre le quantità o sospendere temporaneamente le quotazioni.",
    example: "Se un investitore vuole vendere 500 pezzi di un certificato, il Market Maker può facilitare l'esecuzione attraverso il prezzo Bid esposto. In fasi di stress, tuttavia, lo spread Denaro-Lettera può aumentare sensibilmente: acquistare o vendere sul secondario comporta quindi uno slippage, cioè un costo implicito di transazione, superiore rispetto ai periodi di stabilità."
  },
  {
    term: "Lock-In (Meccanismo di Consolidamento)",
    category: "Meccanismo",
    definition: "Condizione contrattuale presente in alcune tipologie di Cash Collect che 'blocca' definitivamente il pagamento di tutte le cedole future trasformandole da condizionate a incondizionate (fisse) se a una determinata data di rilevazione tutti i sottostanti raggiungono un livello di prezzo prestabilito (Trigger Lock-In, ad esempio il 105% dello strike iniziale).",
    example: "Una volta verificatosi l'evento Lock-In, anche se in seguito i sottostanti dovessero crollare sotto la barriera cedola, tutte le cedole rimanenti fino a scadenza verranno pagate con certezza matematica."
  },
  {
    term: "Low Barrier / Deep Barrier (Barriera Profonda)",
    category: "Protezione",
    definition: "Definizione attribuita a certificati di investimento dotati di una barriera capitale particolarmente conservativa, collocata al 40%, 45% o 50% del valore iniziale dei sottostanti. Queste strutture offrono un margine di protezione straordinariamente elevato, proteggendo il capitale da cali del mercato fino al 50% o 60% dal livello iniziale.",
    example: "Un certificato con barriera al 40% su Eni (strike 15€) tutela il capitale fino a un ribasso del titolo fino a 6.00€ a scadenza."
  },
  {
    term: "Maxi Cedola (Maxi Coupon)",
    category: "Fiscalità",
    definition: "Certificato di investimento a capitale condizionatamente protetto che eroga nei primi mesi di vita un'unica cedola iniziale molto elevata (solitamente tra il 10% e il 30% del valore nominale), seguita successivamente da cedole periodiche più contenute. Può essere valutato da investitori che intendono compensare minusvalenze fiscali in scadenza, ma non crea un extra-rendimento automatico: la distribuzione anticipata modifica il prezzo e il profilo di rischio del certificato.",
    example: "Fisica del prezzo all'Ex-Date: l'incasso della Maxi Cedola non costituisce un guadagno netto autonomo. Alla data di stacco, il prezzo teorico del certificato si riduce in misura prossima all'importo lordo distribuito, a parità delle altre condizioni. L'operazione trasforma una quota di valore del prodotto in un reddito diverso potenzialmente utile a compensare minusvalenze, ma il prezzo potrebbe non recuperare sul mercato secondario il valore staccato."
  },
  {
    term: "Minusvalenze e Zainetto Fiscale (TUIR)",
    category: "Fiscalità",
    definition: "Le perdite finanziarie realizzate dalla vendita o chiusura di strumenti finanziari vengono registrate dall'intermediario nello 'zainetto fiscale' dell'investitore. In base al Testo Unico delle Imposte sui Redditi (TUIR), queste perdite possono essere compensate esclusivamente con plusvalenze classificate come 'redditi diversi' realizzate nell'anno in corso o nei 4 anni solari successivi. I proventi dei certificati (capital gain e cedole) sono qualificati come redditi diversi e sono pienamente compensabili.",
    example: "Una minusvalenza di 1.000€ generata a marzo 2024 può essere compensata con cedole o plusvalenze da certificati fino al 31 dicembre 2028. Senza compensazione, allo scadere dei 4 anni il credito fiscale viene cancellato definitivamente."
  },
  {
    term: "Opzione Quanto (Neutralizzazione Rischio Cambio)",
    category: "Protezione",
    definition: "Caratteristica strutturale fondamentale per i certificati emessi in Euro che hanno come sottostanti azioni o indici denominati in una valuta estera (es. Dollaro USA, Yen giapponese, Franco svizzero). L'opzione Quanto fissa il tasso di cambio a un valore costante pari a 1, neutralizzando completamente le fluttuazioni valutarie: il rendimento e il rimborso del certificato dipendono unicamente dalla performance percentuale del titolo, senza alcun impatto dovuto all'apprezzamento o deprezzamento dell'Euro rispetto alla valuta estera.",
    example: "Se un certificato su Tesla e Apple (titoli in USD) ha l'opzione Quanto, un crollo del dollaro del 15% non diminuirà né il valore del rimborso né l'importo delle cedole erogate in euro."
  },
  {
    term: "Payment Date (Data di Pagamento)",
    category: "Rendimento",
    definition: "La data ufficiale in cui l'importo della cedola staccata o il rimborso del capitale a scadenza viene effettivamente accreditato sul conto corrente dell'investitore (data valuta contabile). Cade solitamente alcuni giorni lavorativi dopo la Ex-Date e la Record Date.",
    example: "Se la Ex-Date cade il 14 del mese e la Record Date il 15, la Payment Date sarà indicativamente fissata tra il 16 e il 20 del mese a seconda del calendario di regolamento bancario Target2."
  },
  {
    term: "Phoenix Memory",
    category: "Tipologia",
    definition: "La variante più celebre ed efficiente della famiglia Cash Collect. Combina barriere cedolari condizionate con l'Effetto Memoria per il recupero dei premi arretrati e clausole di Autocallability periodica (spesso con meccanismo Step-Down) per il rimborso anticipato a 100 euro.",
    example: "Rappresenta oltre il 60% dei volumi complessivi di certificati scambiati sul mercato italiano SeDeX ed EuroTLX."
  },
  {
    term: "Record Date (Data di Registrazione)",
    category: "Rendimento",
    definition: "La data in cui l'intermediario finanziario e la clearing house (Monte Titoli / Euronext Securities Milan) fotografano le posizioni contabili dei conti deposito per stabilire chi ha ufficialmente diritto a percepire la cedola in distribuzione. Cade esattamente il giorno lavorativo successivo alla Ex-Date (regolamento T+2 rispetto alla data di contrattazione).",
    example: "Chi possiede il certificato al termine della seduta precedente la Ex-Date risulta registrato come avente diritto nella Record Date e riceverà regolarmente l'accredito."
  },
  {
    term: "Redditi Diversi vs Redditi di Capitale",
    category: "Fiscalità",
    definition: "Distinzione cardine del sistema tributario italiano (D.P.R. 917/1986). I 'Redditi di Capitale' (cedole di obbligazioni, dividendi azionari, proventi di ETF e fondi comuni) sono sempre tassati al 26% e NON possono essere usati per compensare le minusvalenze. I 'Redditi Diversi' (plusvalenze su azioni, derivati, proventi e cedole dei certificati) riflettono un'incertezza sul capitale e POSSONO essere utilizzati per compensare le minusvalenze pregresse accumulate nello zainetto fiscale.",
    example: "Un dividendo di un ETF azionario viene tassato al 26% anche se hai 10.000€ di minusvalenze; una cedola di un certificato Cash Collect azzera 260€ di imposta compensando direttamente le perdite pregresse."
  },
  {
    term: "Rischio Emittente e Bail-In",
    category: "Rischi",
    definition: "Il rischio legato alla solvibilità creditizia della banca che ha emesso il certificato. I certificati sono titoli di debito chirografari privi di garanzia reale: in caso di dissesto dell'emittente o avvio della risoluzione bancaria europea (Direttiva BRRD - Bail-In), l'investitore rischia la svalutazione o il mancato rimborso del certificato, anche se tutti i titoli sottostanti quotano ben al di sopra delle barriere protettive. I certificati NON beneficiano della garanzia del Fondo Interbancario di Tutela dei Depositi (FITD).",
    example: "Per questo motivo è fondamentale monitorare il rating delle agenzie internazionali (S&P, Moody's, Fitch) e diversificare il portafoglio tra più banche emittenti."
  },
  {
    term: "Softcallable / Callable (Facoltà dell'Emittente)",
    category: "Meccanismo",
    definition: "Certificato a capitale condizionatamente protetto in cui la decisione di procedere al rimborso anticipato prima della scadenza naturale NON è automatica (come negli Autocallable), bensì è lasciata alla facoltà discrezionale dell'emittente bancario. La banca richiamerà il certificato se per lei risulterà finanziariamente conveniente rifinanziarsi a tassi più bassi sul mercato. Per compensare l'investitore di questa incertezza e del rischio di richiamo nei momenti favorevoli, i certificati Softcallable offrono solitamente cedole periodiche sensibilmente più alte rispetto a strutture equivalenti tradizionali.",
    example: "Un certificato Softcallable può offrire una cedola del 13% annuo rispetto all'10% di un Autocallable tradizionale: l'extra-rendimento del 3% ripaga l'investitore della facoltà discrezionale concessa all'emittente."
  },
  {
    term: "Spread Denaro-Lettera (Bid-Ask)",
    category: "Mercati & Liquidità",
    definition: "La differenza percentuale tra il prezzo a cui il Market Maker è disposto ad acquistare il certificato (Bid/Denaro) e il prezzo a cui è disposto a venderlo (Ask/Lettera). Rappresenta il costo implicito immediato per la negoziazione sul mercato secondario.",
    example: "Se il book quota Denaro 99.50€ e Lettera 100.50€, lo spread è pari all'1% (1€). Sui mercati SeDeX ed EuroTLX le regole di Borsa Italiana impongono spread massimi vincolanti per tutelare i risparmiatori."
  },
  {
    term: "Step-Down (Autocall Decrescente)",
    category: "Meccanismo",
    definition: "Clausola contrattuale che riduce progressivamente nel tempo il livello trigger necessario per far scattare il rimborso anticipato (Autocall) ad ogni successiva data di osservazione (ad es. 100% per i primi 6 mesi, poi 95%, 90%, 85%, fino all'80% dello strike iniziale). Questa caratteristica aumenta considerevolmente le probabilità che il certificato rimborsi anticipatamente a 100€ + cedole anche in presenza di mercati azionari discendenti.",
    example: "Se un titolo perde il 15% ed è sceso a quota 85€, un certificato tradizionale non rimborsa in anticipo. Con uno Step-Down all'85%, il certificato scatta in autocall rimborsando 100 euro e chiudendo la posizione in guadagno."
  },
  {
    term: "Strike Price (Prezzo di Esercizio Iniziale)",
    category: "Meccanismo",
    definition: "Il prezzo ufficiale di chiusura registrato dal titolo o indice sottostante alla data di fissazione iniziale (Fixing Date). Tutti i livelli percentuali del certificato (barriera capitale al 50%, barriera cedola al 60%, livelli di autocall al 100%) vengono calcolati in valore assoluto moltiplicando la percentuale per il prezzo di Strike.",
    example: "Se Eni registra uno strike di 14.00€ alla data iniziale, una barriera al 60% corrisponderà esattamente a 8.40€ (14 x 0.60)."
  },
  {
    term: "Twin Win",
    category: "Tipologia",
    definition: "Particolare struttura a capitale condizionatamente protetto appartenente alla classificazione ACEPI che consente all'investitore di guadagnare sia in caso di rialzo sia in caso di ribasso del sottostante a scadenza, purché non venga mai violata la barriera prefissata. In caso di ribasso contenuto sopra barriera, la variazione negativa del titolo viene trasformata specularmente in rendimento positivo.",
    example: "Se a scadenza il titolo ha perso il 25% ma la barriera era fissata al 40%, il certificato Twin Win rimborsa 100€ + il 25% di rendimento positivo, chiudendo a 125€."
  },
  {
    term: "Vega e Volatilità Implicita",
    category: "Parametri & Greche",
    definition: "Il Vega misura la sensibilità del prezzo del certificato al variare della volatilità implicita attesa sui mercati finanziari. Nei certificati a capitale condizionatamente protetto (come i Cash Collect), un forte aumento improvviso della volatilità generale tende a far scendere il prezzo del certificato sul mercato secondario, poiché aumenta matematicamente la probabilità statistica che i sottostanti possano raggiungere e rompere la barriera a scadenza.",
    example: "Durante le fasi di panico di borsa (es. aumento dell'indice VIX), il prezzo di un certificato può flettere temporaneamente anche se i titoli sono ancora ampiamente sopra barriera."
  },
  {
    term: "Virtual Offer Price (VOP)",
    category: "Mercati & Liquidità",
    definition: "Prezzo massimo teorico calcolato automaticamente dai sistemi di Borsa Italiana (SeDeX ed EuroTLX) quando un certificato entra in stato di 'Bid-Only' (ossia quando il Market Maker è presente solo in denaro). Il VOP impedisce che ordini di vendita da parte di investitori privati vengano inseriti a prezzi irragionevolmente alti o fuori mercato, proteggendo gli altri risparmiatori da esecuzioni anomale.",
    example: "Se il Market Maker è in acquisto a 100€, il circuito di borsa imposta un VOP (es. a 101.50€): nessun privato potrà inserire una proposta di vendita al di sopra di tale limite virtuale."
  },
  {
    term: "Worst-Of (Meccanismo del Paniere)",
    category: "Meccanismo",
    definition: "Formula contrattuale tipica dei certificati multi-sottostante in cui la misurazione delle barriere, il pagamento delle cedole periodiche e il rimborso del capitale a scadenza dipendono esclusivamente dalla performance percentuale del titolo che ha registrato il calo maggiore (o il rialzo minore) rispetto al proprio strike iniziale tra tutti i componenti del basket.",
    example: "In un basket composto da Intesa (+15%), UniCredit (+8%) e Stellantis (-20%), Stellantis è il titolo Worst-Of: tutte le verifiche su barriere, cedole e rimborsi terranno conto esclusivamente del -20% di Stellantis, ignorando i rialzi degli altri due titoli."
  },
  {
    term: "Ask e Bid (Lettera e Denaro)",
    category: "Mercati & Liquidità",
    definition: "Il Bid è il prezzo al quale il mercato, normalmente tramite il Market Maker, è disposto ad acquistare il certificato; l'Ask è il prezzo al quale è disposto a venderlo. La differenza tra i due valori è lo spread denaro-lettera. Prima di inserire un ordine è importante controllare prezzo, quantità disponibili e validità della quotazione.",
    example: "Con Bid a 98,50 euro e Ask a 99,20 euro, chi acquista deve considerare il prezzo in lettera, mentre chi vende normalmente considera il prezzo in denaro."
  },
  {
    term: "Prezzo Sotto la Pari",
    category: "Mercati & Liquidità",
    definition: "Un certificato quota sotto la pari quando il suo prezzo di mercato è inferiore al valore nominale, spesso pari a 100 euro o 1.000 euro. La differenza può offrire un potenziale margine di recupero verso il nominale, ma non rappresenta un rendimento garantito: il prezzo incorpora aspettative, rischio emittente, distanza dalle barriere, volatilità e durata residua.",
    example: "Un certificato nominale da 100 euro quotato a 96 euro può sembrare conveniente, ma deve essere valutato insieme alla distanza dalla barriera, alle cedole ancora pagabili e alla solidità dell'emittente."
  },
  {
    term: "Valore Nominale",
    category: "Parametri & Greche",
    definition: "Importo di riferimento utilizzato per calcolare rimborso, cedole e livelli economici del certificato. Il valore nominale non coincide necessariamente con il prezzo di acquisto sul mercato secondario e non costituisce una garanzia autonoma di rimborso.",
    example: "Un prodotto con nominale di 1.000 euro può essere acquistato a 980 euro o 1.020 euro sul mercato secondario; cedole e rimborso seguono comunque le condizioni previste dai Final Terms."
  },
  {
    term: "Fixing e Data di Valutazione",
    category: "Meccanismo",
    definition: "Il fixing è la rilevazione ufficiale del valore del sottostante in una data stabilita nei Final Terms. Le date di valutazione possono servire a determinare il pagamento della cedola, il superamento del trigger di autocall o il rispetto della barriera a scadenza. Il metodo di rilevazione e la fonte del prezzo devono essere verificati nella documentazione del prodotto.",
    example: "Una barriera europea può essere verificata solo alla data di valutazione finale, mentre una barriera continua può essere monitorata durante tutta la vita del certificato."
  },
  {
    term: "Trigger Cedolare",
    category: "Rendimento",
    definition: "Livello percentuale che deve essere rispettato dal sottostante o dal paniere alla data di osservazione perché la cedola condizionata venga pagata. Il trigger cedolare può coincidere con la barriera capitale, ma può anche essere fissato a un livello diverso. Il contratto specifica inoltre se il premio non pagato viene perso o memorizzato.",
    example: "Con trigger cedolare al 60%, se il Worst-Of rileva al 58% alla data prevista, la cedola non viene pagata, salvo che il prodotto preveda memoria o altre clausole specifiche."
  },
  {
    term: "Trigger Autocall",
    category: "Meccanismo",
    definition: "Livello che tutti i sottostanti, oppure il sottostante previsto dal contratto, devono raggiungere alla data di osservazione perché si attivi il rimborso anticipato automatico. Il trigger può essere fisso o decrescente tramite Step-Down e il rimborso può includere la cedola del periodo secondo quanto indicato nei Final Terms.",
    example: "Se il trigger autocall è al 90% e il Worst-Of quota al 92% nella data di osservazione, la condizione può essere soddisfatta; occorre comunque verificare le regole specifiche del certificato."
  },
  {
    term: "Distanza dalla Barriera",
    category: "Rischi",
    definition: "Misura percentuale della distanza tra il valore corrente del sottostante Worst-Of e la barriera. È un indicatore utile per leggere il margine di sicurezza attuale, ma non misura da solo la probabilità di rimborso: durata residua, volatilità, correlazione e modalità di osservazione restano determinanti.",
    example: "Se il Worst-Of quota 80 e la barriera è a 60, la distanza corrente è del 25% rispetto al prezzo del sottostante: una perdita superiore potrebbe portare al livello barriera."
  },
  {
    term: "Parità e Valore di Rimborso",
    category: "Parametri & Greche",
    definition: "La parità confronta il valore teorico del sottostante o del paniere con il valore nominale del certificato secondo il rapporto di conversione previsto. Nei certificati a capitale condizionatamente protetto, il valore di rimborso dipende dalle clausole del prodotto e non segue necessariamente in modo lineare il prezzo del sottostante.",
    example: "Due certificati sullo stesso titolo possono avere prezzi diversi perché differiscono per nominale, rapporto di conversione, cedole, barriera, scadenza e rischio emittente."
  },
  {
    term: "Durata Residua",
    category: "Rischi",
    definition: "Tempo che intercorre tra la data di osservazione e la scadenza o la prossima data di rimborso anticipato. Una durata maggiore lascia più tempo al sottostante per raggiungere una barriera, ma può anche offrire più date di osservazione e più premi potenziali: il suo effetto deve essere letto insieme a struttura e scenari del KID.",
    example: "Un certificato con barriera profonda ma scadenza lunga non è automaticamente meno rischioso di uno con durata breve: il tempo di esposizione è una variabile essenziale."
  },
  {
    term: "Rischio di Liquidità",
    category: "Rischi",
    definition: "Rischio di non riuscire a vendere il certificato rapidamente o a un prezzo vicino al valore teorico. La presenza del Market Maker non elimina il rischio: possono verificarsi sospensioni, ampliamenti dello spread, assenza temporanea di quotazioni o limiti operativi previsti dal mercato e dalla documentazione del prodotto.",
    example: "Prima di vendere, confronta il prezzo Bid, la quantità disponibile e lo spread; non considerare il prezzo teorico come garanzia del prezzo effettivamente eseguibile."
  },
  {
    term: "Rating dell'Emittente",
    category: "Rischi",
    definition: "Valutazione del merito creditizio dell'emittente assegnata da un'agenzia di rating. È un'informazione utile per il rischio di credito, ma non è una garanzia di solvibilità né sostituisce la lettura del KID, dei Final Terms e delle condizioni applicabili al certificato.",
    example: "A parità di sottostanti e struttura, due certificati emessi da banche diverse possono avere prezzi e rendimenti differenti anche per il diverso rischio di credito percepito dal mercato."
  },
  {
    term: "Final Terms (Condizioni Definitive)",
    category: "Normativa & KID",
    definition: "Documento che completa il prospetto di base e contiene le condizioni specifiche della singola emissione: sottostanti, strike, barriere, date, cedole, trigger, modalità di rimborso, eventi straordinari e soggetti coinvolti. In caso di differenze tra una descrizione divulgativa e la documentazione ufficiale, fanno fede i documenti dell'emittente e del mercato.",
    example: "Per verificare se una barriera è europea o continua, non è sufficiente il nome commerciale: occorre controllare la sezione dedicata alle modalità di osservazione nei Final Terms."
  }
];
