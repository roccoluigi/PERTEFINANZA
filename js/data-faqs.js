// Dataset locale delle FAQ, consumato dal renderer dell'accordion in app.js.

const FAQS_DATA = [
  {
    category: "Basi & Funzionamento",
    question: "Cosa sono esattamente i certificati di investimento e come si collocano nella classificazione ACEPI?",
    answer: "I certificati di investimento (investment certificates) sono strumenti finanziari derivati cartolarizzati emessi da banche di primaria caratura internazionale e negoziati sui mercati regolamentati e MTF di Borsa Italiana (SeDeX ed EuroTLX/Cert-X). Nella classificazione ufficiale ACEPI (Associazione Italiana Certificati e Prodotti di Investimento), i prodotti si dividono in quattro macrocategorie principali: 1) Capitale Protetto (protezione del 100% a scadenza); 2) Capitale Condizionatamente Protetto (come Cash Collect, Phoenix Memory, Express, Bonus e Airbag, dove la restituzione del capitale è vincolata al mancato superamento di una soglia barriera); 3) Capitale Non Protetto (Benchmark o Discount); 4) Certificati a Leva (Leva Fissa e Turbo). Rappresentano strumenti ibridi che combinano una componente obbligazionaria a tasso zero (zero-coupon bond) con una o più componenti opzionali asimmetriche."
  },
  {
    category: "Basi & Funzionamento",
    question: "Cosa significa esattamente 'Capitale Condizionatamente Protetto' e cosa accade se la barriera viene infranta?",
    answer: "Significa che il capitale investito (solitamente 100€ o 1.000€ per certificato) è garantito al 100% a scadenza unicamente se, alla data di rilevazione finale, il titolo peggiore del paniere (Worst-Of) quota a un livello pari o superiore alla barriera stabilita all'emissione (ad esempio al 50% o 60% del valore iniziale). Se a scadenza la barriera risulta violata, la protezione condizionata decade completamente e l'investitore subisce una perdita sul capitale proporzionale al calo percentuale registrato dal peggiore dei sottostanti rispetto al suo strike iniziale, esattamente come se avesse acquistato direttamente l'azione il primo giorno senza percepire dividendi (a meno che non sia presente un meccanismo Airbag che attenui il crollo)."
  },
  {
    category: "Basi & Funzionamento",
    question: "Come si legge una scheda di certificato prima di acquistare?",
    answer: "Parti da emittente, valuta e valore nominale; verifica poi sottostanti, strike, barriera capitale, barriera cedolare, modalità di osservazione, date di valutazione, trigger autocall, step-down, memoria, scadenza e costi. Infine confronta prezzo Bid e Ask sul mercato e leggi KID e Final Terms. Una cedola elevata non è sufficiente per giudicare un prodotto: va considerata insieme alla probabilità e alle conseguenze degli scenari sfavorevoli."
  },
  {
    category: "Rischi & Dinamiche di Prezzo",
    question: "Perché un certificato può quotare sotto la pari anche se la barriera non è stata violata?",
    answer: "Il prezzo sul mercato secondario incorpora molte variabili oltre al livello corrente del sottostante: volatilità implicita, tassi, dividendi attesi, correlazione del paniere, distanza dalla barriera, durata residua, probabilità di autocall e rischio emittente. Una barriera ancora integra non garantisce quindi un prezzo pari al nominale né un rimborso futuro integrale."
  },
  {
    category: "Mercati & Liquidità",
    question: "Qual è la differenza tra prezzo teorico e prezzo realmente eseguibile?",
    answer: "Il prezzo teorico è una stima del valore del prodotto elaborata secondo un modello; il prezzo realmente eseguibile è quello disponibile sul book, in particolare il Bid per la vendita e l'Ask per l'acquisto, tenendo conto di quantità e spread. In presenza di mercato poco liquido o di quotazioni assenti, l'esecuzione può essere difficoltosa o avvenire a condizioni meno favorevoli."
  },
  {
    category: "Meccanismi & Cedole",
    question: "La barriera capitale e la barriera coupon sono sempre uguali?",
    answer: "No. Sono clausole indipendenti e possono avere livelli o modalità di osservazione differenti. La barriera capitale stabilisce la condizione per il rimborso del nominale a scadenza; la barriera coupon condiziona il pagamento delle cedole. Per conoscere l'effetto di una violazione e l'eventuale memoria occorre leggere le condizioni specifiche del certificato."
  },
  {
    category: "Rischi & Dinamiche di Prezzo",
    question: "Che cosa significa che il certificato dipende dal Worst-Of?",
    answer: "Significa che, in base alla clausola contrattuale, le verifiche principali possono dipendere dal sottostante che ha ottenuto la performance peggiore rispetto al proprio strike. Il rialzo degli altri titoli non compensa automaticamente la debolezza del Worst-Of. Per questo è importante valutare qualità, volatilità e correlazione di ogni componente del paniere."
  },
  {
    category: "Normativa & KID",
    question: "Dove trovo le informazioni definitive se una pagina web non coincide con il prodotto?",
    answer: "La fonte primaria è la documentazione ufficiale dell'emittente e del mercato: KID, Prospetto di Base, Final Terms, eventuali avvisi di rettifica e scheda di negoziazione. Per le condizioni contrattuali specifiche fanno riferimento soprattutto i Final Terms, letti insieme al Prospetto di Base; il KID sintetizza le informazioni chiave ma non sostituisce questi documenti. Le pagine divulgative e il materiale pubblicitario possono contenere dati sintetici o non aggiornati e non costituiscono la documentazione contrattuale su cui fondare un reclamo. In caso di discrepanza, sospendi l'ordine e verifica la versione ufficiale più recente presso l'emittente, il mercato e il tuo intermediario."
  },
  {
    category: "Basi & Funzionamento",
    question: "Come viene calcolato il rimborso finale a scadenza con un esempio numerico reale?",
    answer: "Ipotizziamo un certificato emesso a 100€ sul titolo Eni con strike 14.00€ e barriera capitale europea al 60% (pari a 8.40€). A scadenza possono verificarsi due scenari alternativi: 1) Scenario Sopra Barriera: se Eni quota 10.00€ (-28.6% dallo strike iniziale), poiché 10.00€ è superiore a 8.40€, il certificato rimborsa il 100% del capitale nominale (100€) più l'ultima cedola e tutte le cedole in memoria. 2) Scenario Sotto Barriera: se Eni quota 7.00€ (-50% dallo strike), la barriera è violata. Il rimborso finale sarà pari a: 100€ x (7.00 / 14.00) = 50.00€. L'investitore subisce una perdita del 50% sul capitale, parzialmente attenuata unicamente dalle eventuali cedole incassate durante la vita del prodotto."
  },
  {
    category: "Basi & Funzionamento",
    question: "Che cos'è la clausola Worst-Of e perché aumenta sensibilmente il rischio del portafoglio?",
    answer: "La clausola Worst-Of stabilisce che, nei certificati emessi su un paniere di più titoli (ad esempio 3 o 4 azioni), il pagamento delle cedole e il rimborso del capitale a scadenza sono determinati unicamente dall'andamento del titolo che ha registrato la peggiore performance percentuale rispetto al proprio livello di fixing iniziale. Anche se 3 titoli su 4 sono saliti del 50%, se il quarto titolo crolla del 55% e infrange la barriera a scadenza, il certificato subirà una decurtazione del 55% sul capitale nominale. La clausola Worst-Of consente all'emittente di offrire cedole mensili a doppia cifra (fino al 10-14% p.a.), ma espone l'investitore alla correlazione tra titoli e al rischio del titolo 'anello debole' del basket."
  },
  {
    category: "Meccanismi & Cedole",
    question: "Come funziona in dettaglio l'Effetto Memoria sulle cedole?",
    answer: "L'Effetto Memoria è una delle caratteristiche contrattuali più vantaggiose dei certificati Phoenix. Se a una determinata data di osservazione periodica (mensile o trimestrale) uno dei sottostanti si trova al di sotto della barriera cedolare, la cedola non viene pagata, ma non viene nemmeno persa per sempre: viene registrata e 'congelata' nella memoria del prodotto. Se a qualsiasi data di osservazione successiva tutti i sottostanti del paniere tornano a quotare sopra la barriera cedola, l'investitore riceve in un unico accredito la cedola del periodo in corso sommata a tutte le cedole rimaste accumulate in memoria nei mesi precedenti."
  },
  {
    category: "Meccanismi & Cedole",
    question: "Qual è la differenza fondamentale tra certificati Autocallable e Softcallable?",
    answer: "Nei certificati Autocallable tradizionali, il rimborso anticipato a 100€ è un automatismo vincolante: se a una data di verifica tutti i titoli sono pari o sopra il livello di trigger prefissato (es. 100%), il prodotto si chiude obbligatoriamente. Nei certificati Softcallable (chiamati anche semplicemente Callable), il rimborso anticipato NON è automatico, ma rappresenta una facoltà discrezionale riservata all'emittente bancario. La banca deciderà se richiamare o meno il certificato in base ai tassi di mercato e alla convenienza del proprio desk di derivati. Per remunerare l'investitore di questa incertezza e del rischio di veder richiamato il titolo nei momenti migliori, i certificati Softcallable riconoscono cedole periodiche sensibilmente più elevate (solitamente 1.5% - 3% in più su base annua rispetto a un Autocallable tradizionale)."
  },
  {
    category: "Meccanismi & Cedole",
    question: "Cos'è il meccanismo Step-Down e perché è così ricercato dagli investitori?",
    answer: "Il meccanismo Step-Down prevede che la soglia di prezzo richiesta per far scattare il rimborso anticipato (Autocall) diminuisca progressivamente nel tempo ad ogni successiva data di rilevazione (ad esempio partendo dal 100% dello strike iniziale al sesto mese, per poi scendere del 1% al mese o del 5% a semestre: 95%, 90%, 85%, fino al 75% o 70%). Questo accorgimento tecnico aumenta drasticamente le probabilità statistiche di chiusura anticipata dell'investimento con rimborso a 100€ + cedole anche in scenari di mercato azionario laterale o moderatamente ribassista, riducendo l'orizzonte temporale effettivo dell'investimento."
  },
  {
    category: "Meccanismi & Cedole",
    question: "Come funziona la protezione Airbag e come si calcola l'attenuazione della perdita?",
    answer: "Nei certificati Airbag, se a scadenza la barriera protettiva viene violata, la perdita non viene commisurata partendo dal 100% del valore iniziale (strike), bensì partendo dal livello della barriera stessa. Il fattore Airbag è pari a: 100 / Livello Barriera in %. Ad esempio, con barriera al 60%, il fattore Airbag è 1.666; con barriera al 50%, il fattore Airbag è 2. Se a scadenza il peggior titolo perde il 50% con barriera al 50%, un certificato tradizionale rimborsa 50€ (perdita del 50%); la struttura Airbag moltiplica la quotazione finale (50% dello strike) per il fattore Airbag (2), rimborsando 100€ (nessuna perdita sul capitale!). Se il titolo crollasse del 60%, l'Airbag rimborserebbe: 40 x 2 = 80€ (perdita limitata al 20% anziché al 60%)."
  },
  {
    category: "Meccanismi & Cedole",
    question: "Quali sono le 4 date chiave per incassare la cedola e quando conviene comprare il certificato?",
    answer: "Il ciclo cedolare comprende normalmente 4 date: 1) Data di Valutazione (Fixing Date): il giorno in cui si rilevano i prezzi ufficiali dei sottostanti per verificare le condizioni della cedola; 2) Data di Stacco (Ex-Date): il giorno dal quale il certificato quota senza il diritto alla cedola; 3) Record Date: la data in cui il sistema di regolamento identifica gli aventi diritto, secondo quanto previsto dai Final Terms; 4) Payment Date: il giorno dell'effettivo accredito. Nel regime ordinario di regolamento T+2, l'acquisto deve essere eseguito entro l'ultimo giorno cum-date indicato dal mercato e dalla documentazione del prodotto, normalmente precedente alla Ex-Date. Non è però corretto applicare automaticamente la stessa sequenza a ogni emissione: date, calendario e modalità di regolamento vanno verificati nei Final Terms e presso l'intermediario."
  },
  {
    category: "Fiscalità & Minusvalenze",
    question: "Perché i certificati consentono di compensare le minusvalenze pregresse mentre ETF e fondi comuni no?",
    answer: "In base al Testo Unico delle Imposte sui Redditi (TUIR - D.P.R. 917/1986), il legislatore tributario italiano suddivide i proventi finanziari in due categorie non comunicanti: 'Redditi di Capitale' (interessi obbligazionari, dividendi azionari, cedole e capital gain di ETF e fondi comuni), i quali scontano sempre la ritenuta del 26% (o 12.5% su titoli di stato) e non possono MAI essere compensati con perdite pregresse; e 'Redditi Diversi' (plusvalenze su azioni, derivati e certificati d'investimento). Poiché nei certificati esiste un'intrinseca incertezza sul rimborso del capitale, l'Agenzia delle Entrate classifica sia il guadagno di capitale (capital gain) che le cedole periodiche condizionate come redditi diversi. Ciò consente di utilizzare i guadagni e i premi per azzerare le minusvalenze registrate nello zainetto fiscale nei 4 anni solari precedenti."
  },
  {
    category: "Fiscalità & Minusvalenze",
    question: "Come si differenzia la compensazione fiscale tra i principali intermediari bancari (Fineco, Directa, Webank, Banca Sella)?",
    answer: "La contabilizzazione può variare in base al regime fiscale, alle procedure dell'intermediario e alla natura del certificato. In una modalità assimilabile alla compensazione immediata, il provento fiscalmente rilevante viene registrato già al momento dell'accredito e può ridurre subito le minusvalenze disponibili. In una modalità differita, invece, la cedola può incidere sul valore fiscale della posizione e la compensazione effettiva emergere alla vendita o al rimborso. Le associazioni tra singoli broker e metodo non devono essere date per definitive: Fineco, Directa, Webank, Banca Sella e gli altri intermediari possono aggiornare le proprie procedure o applicare regole diverse a seconda del prodotto. Prima di pianificare il recupero, chiedi una conferma scritta al tuo intermediario e controlla l'estratto dello zainetto fiscale, soprattutto se le minusvalenze scadono il 31 dicembre."
  },
  {
    category: "Fiscalità & Minusvalenze",
    question: "Come funziona la strategia della Maxi Cedola a fine anno per recuperare le minusvalenze in scadenza?",
    answer: "Le minusvalenze accumulate nello zainetto fiscale hanno una validità di 4 anni solari oltre all'anno di formazione: le minusvalenze realizzate nel 2022, ad esempio, scadono improrogabilmente il 31 dicembre 2026. Per evitare di perdere definitivamente il credito d'imposta del 26%, molti risparmiatori acquistano tra ottobre e dicembre certificati con 'Maxi Cedola' (premi unici tra il 10% e il 30% erogati a breve distanza dall'emissione). L'incasso del maxipremio genera un reddito diverso che va a compensare e cancellare le minusvalenze in scadenza. Attenzione: dopo lo stacco della maxi cedola, il prezzo del certificato scende sul mercato secondario di un importo proporzionale al dividendo staccato, generando una nuova minusvalenza che avrà tuttavia validità per altri 4 anni, 'allungando' di fatto la vita del credito fiscale."
  },
  {
    category: "Fiscalità & Minusvalenze",
    question: "I certificati sono soggetti alla Tobin Tax italiana (Financial Transaction Tax)?",
    answer: "I certificati negoziati sui mercati SeDeX ed EuroTLX godono di un regime di favore rispetto all'acquisto diretto di azioni italiane. Sui certificati non si applica la Tobin Tax proporzionale dello 0.10% tipica delle compravendite azionarie. Ai sensi dell'art. 1, comma 492 della Legge 228/2012, i certificati sono assoggettati alla Tobin Tax per strumenti derivati, che prevede una tassazione in misura fissa parametrata al nozionale scambiato: per la fascia retail (fino a 50.000€ di controvalore su mercati regolamentati), la tassa ammonta a importi irrisori (spesso compresi tra 0.01€ e pochi centesimi per eseguito), rendendo l'operatività estremamente efficiente rispetto alle azioni dirette."
  },
  {
    category: "Rischi & Dinamiche di Prezzo",
    question: "In che modo dividendi stimati e volatilità (Vega) influenzano il prezzo del certificato sul mercato secondario?",
    answer: "I certificati incorporano componenti opzionali e il loro prezzo riflette le dinamiche delle 'greche' finanziarie: 1) Dividendi (Dividend Risk): chi acquista un certificato non riceve i dividendi ordinari pagati dalle società sottostanti; questi dividendi stimati vengono incassati implicitamente dall'emittente per pagare le cedole e comprare le opzioni di protezione. Se le società aumentano a sorpresa i dividendi attesi futuri, il prezzo del certificato sul mercato secondario cala; se i dividendi vengono tagliati, il certificato sale. 2) Volatilità (Vega): nei Cash Collect e Bonus Cap, un aumento generalizzato della volatilità implicita fa scendere il prezzo del certificato, perché aumenta la probabilità statistica che il sottostante tocchi o infranga la barriera di protezione; viceversa, mercati azionari calmi e poco volatili tendono a far salire le quotazioni del certificato."
  },
  {
    category: "Rischi & Dinamiche di Prezzo",
    question: "Cosa significa quando un certificato entra in modalità 'Bid-Only' sul SeDeX o EuroTLX? Posso ancora venderlo?",
    answer: "Quando un certificato è in 'Bid-Only', il Liquidity Provider (Market Maker) dell'emittente espone sul book di negoziazione soltanto il prezzo di acquisto (Bid/Denaro) e non offre più il prezzo di vendita (Ask/Lettera). Questo si verifica tipicamente quando l'ammontare di titoli emesso è stato interamente collocato e acquistato dal mercato (prodotto 'sold out'), oppure in prossimità della scadenza o per ragioni interne di copertura del rischio. Conseguenza pratica: puoi SEMPRE vendere i tuoi certificati al Market Maker incassando il denaro, ma né tu né altri investitori potete acquistare nuove quote dall'emittente. Per evitare speculazioni, Borsa Italiana calcola un Virtual Offer Price (VOP) che pone un tetto massimo alle proposte di vendita tra investitori privati."
  },
  {
    category: "Rischi & Dinamiche di Prezzo",
    question: "Che cos'è l'opzione Quanto e cosa succede se compro un certificato su titoli americani non-quanto?",
    answer: "L'opzione Quanto è una clausola contrattuale che protegge l'investitore europeo dal rischio di cambio. Se un certificato è emesso in Euro ma i titoli sottostanti sono quotati in valuta estera (es. Apple, Tesla o Nvidia scambiate in Dollari USA), la presenza della dicitura 'Quanto' garantisce che il cambio EUR/USD venga convenzionalmente fissato a 1 per tutta la vita del prodotto: né il capitale a scadenza né le cedole risentiranno delle fluttuazioni valutarie. Se invece il certificato NON è Quanto, l'investitore è esposto al rischio di cambio: anche se i titoli tech salgono, un deprezzamento del dollaro rispetto all'euro ridurrebbe proporzionalmente sia l'importo delle cedole che il valore di rimborso finale."
  },
  {
    category: "Rischi & Dinamiche di Prezzo",
    question: "I certificati sono protetti dal Fondo Interbancario di Tutela dei Depositi (FITD)?",
    answer: "Assolutamente NO. Il Fondo Interbancario di Tutela dei Depositi garantisce unicamente i depositi bancari, i conti correnti e i conti di deposito fino a un massimo di 100.000€ per singolo depositante. I certificati di investimento sono tecnicamente obbligazioni strutturate chirografarie non garantite (senior unsecured). In caso di dissesto, insolvenza o apertura della procedura di bail-in nei confronti della banca emittente (es. BNP Paribas, UniCredit, Leonteq, ecc.), l'investitore rischia la perdita parziale o totale del capitale, indipendentemente dal fatto che i titoli sottostanti si trovino o meno sopra le barriere protettive. Per questo motivo, su PERTEFINANZA monitoriamo costantemente il rating creditizio degli emittenti."
  },
  {
    category: "Rischi & Dinamiche di Prezzo",
    question: "Come si legge l'indicatore sintetico di rischio (SRI da 1 a 7) nel KID e dove si trovano i costi impliciti?",
    answer: "Il KID (Key Information Document) sintetizza il profilo di rischio con l'indicatore SRI (Summary Risk Indicator) su una scala da 1 (rischio minimo, es. titoli di stato a brevissimo termine) a 7 (rischio massimo, es. derivati speculativi o criptovalute). I certificati a capitale condizionatamente protetto si attestano tipicamente tra il livello 4 (rischio medio) e il livello 6 (rischio elevato per titoli volatili o basket Worst-Of ampi). Per quanto riguarda i costi, a differenza degli ETF che applicano un TER annuo visibile, i certificati incorporano costi di strutturazione e collocamento impliciti (visibili nella 'Tabella dei Costi' del KID, solitamente compresi tra l'1.5% e il 3.5% una tantum sul prezzo di emissione); chi acquista sul mercato secondario dopo l'emissione compra a prezzi di mercato che scontano già tali costi."
  },
  {
    category: "Rischi & Dinamiche di Prezzo",
    question: "Cosa accade a un certificato in caso di operazioni societarie straordinarie (OPA, aumenti di capitale, spin-off)?",
    answer: "In presenza di operazioni societarie sul capitale di uno dei titoli sottostanti (Corporate Actions), come offerte pubbliche di acquisto (OPA), raggruppamenti, scissioni (spin-off) o aumenti di capitale a pagamento, le regole dei mercati e i regolamenti degli emittenti prevedono l'applicazione del 'Fattore di Rettifica K' stabilito dalle autorità di borsa (Euronext / Borsa Italiana). Il prezzo di strike iniziale e la barriera del certificato vengono ricalcolati moltiplicandoli per il fattore K al fine di neutralizzare l'evento straordinario e garantire che l'operazione non arrechi né un ingiusto vantaggio né un danno economico all'investitore."
  }
];
