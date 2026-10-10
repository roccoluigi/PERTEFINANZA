// Genera testi, scenari e pro/contro coerenti con i dati del certificato selezionato.

function formatStepDownStartMonth(month) {
  const monthNumber = Number(month);
  return Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 6
    ? `dal ${monthNumber}° mese`
    : '';
}

function buildGeneratedReviewContent(cert) {
  // I contenuti sono calcolati dai parametri del prodotto, così la scheda resta aggiornata
  // quando cambia il certificato senza duplicare testi nelle pagine HTML.
  const capitalBarrier = parseFloat(cert.barrierCapital) || 0;
  const couponBarrier = Number.parseFloat(cert.barrierCoupon) || capitalBarrier;
  const annualYield = Number(cert.annualYield) || 0;
  const monthlyYield = annualYield / 12;
  const highBarrier = Math.max(capitalBarrier, couponBarrier);
  const lowBarrier = Math.min(capitalBarrier, couponBarrier);
  const moderateRangeBreaksCapitalBarrier = capitalBarrier > lowBarrier;
  const stepDownValue = Number.parseFloat(cert.stepDown) || 0;
  const stepDownStartText = formatStepDownStartMonth(cert.stepDownStartMonth);
  const issuerData = typeof ISSUERS_DATA !== 'undefined'
    ? ISSUERS_DATA.find(item => item.name === cert.issuer || item.name.startsWith(`${cert.issuer} `))
    : null;
  const issuerDescription = issuerData ? issuerData.description : `L'emittente ${cert.issuer} opera nel mercato dei prodotti strutturati.`;
  const issuerDescriptionStart = issuerDescriptionWithoutName(cert.issuer, issuerDescription)
    .replace(/^un['’]\s*/i, '');
  const lowercaseIssuerDescriptionStart = issuerDescriptionStart.charAt(0).toLowerCase() + issuerDescriptionStart.slice(1);
  const ratingEntries = issuerData && issuerData.ratings
    ? Object.entries(issuerData.ratings).filter(([, rating]) => rating && rating.toLowerCase() !== 'non rated')
    : issuerData
      ? [
          ['S&P', issuerData.ratingSP],
          ["Moody's", issuerData.ratingMoodys],
          ['Fitch', issuerData.ratingFitch]
        ].filter(([, rating]) => rating && rating.toLowerCase() !== 'non rated')
      : [];
  const hasStrongRating = ratingEntries.some(([, rating]) => /^A/i.test(rating));
  const ratingText = ratingEntries.length > 0
    ? ratingEntries.map(([agency, rating]) => `${agency}: ${rating}`).join(' · ')
    : 'Rating non disponibile nel database';
  const ratingDescriptions = ratingEntries.map(([agency, rating], index) => `${rating} ${index === 0 ? 'da parte di' : 'da'} ${agency}`);
  const ratingSummary = ratingDescriptions.length > 1
    ? `${ratingDescriptions.slice(0, -1).join(', ')} e ${ratingDescriptions[ratingDescriptions.length - 1]}`
    : ratingDescriptions[0];
  const ratingSentence = ratingEntries.length === 1
    ? `${ratingEntries[0][0]} assegna all'emittente un rating di credito pari ad ${ratingEntries[0][1]}. Poiché il rating può cambiare, è opportuno verificarne il valore più aggiornato sul sito dell'agenzia e nella documentazione ufficiale del prodotto.`
    : ratingEntries.length > 1
      ? `Le agenzie assegnano all'emittente i seguenti rating di credito: ${ratingSummary}. Poiché queste valutazioni possono cambiare, è opportuno verificarne i valori più recenti sui siti delle agenzie e nella documentazione ufficiale del prodotto.`
      : `Le valutazioni delle agenzie sulla solidità creditizia dell'emittente non sono disponibili: è opportuno verificarne i valori più recenti sui siti delle agenzie e nella documentazione ufficiale del prodotto.`;
  const barrierComment = `La barriera capitale europea al <strong>${cert.barrierCapital}</strong> è osservata a scadenza e corrisponde a una soglia pari al ${capitalBarrier}% dei livelli iniziali (buffer del ${100 - capitalBarrier}%). Il buffer è condizionato e non limita la perdita massima: se alla scadenza il Worst-of chiude sotto barriera, il rimborso segue la sua performance finale. Per esempio, se il Worst-of chiudesse a ${capitalBarrier - 5}% (5 punti percentuali sotto la barriera), il rimborso sarebbe pari al ${capitalBarrier - 5}% dell'importo investito, con una perdita del ${100 - (capitalBarrier - 5)}% prima di considerare gli eventuali premi già incassati.`;
  const couponComment = `Il pagamento della cedola mensile è condizionato al rispetto della barriera coupon del ${cert.barrierCoupon} a ogni data di osservazione. Se il Worst-of non raggiunge questa soglia, la cedola non viene pagata. Grazie all'<strong>effetto memoria</strong>, le cedole sospese possono essere recuperate in una successiva data di osservazione solo se il Worst-of torna almeno al ${cert.barrierCoupon}.`;
  const underlyingProfiles = typeof UNDERLYING_PROFILES !== 'undefined' ? UNDERLYING_PROFILES : {};
  const underlyingParagraphs = cert.underlyings.map(name => `<strong>${name}</strong>: ${underlyingProfiles[name] || `${name} è esposto al ciclo economico, ai risultati societari e alla volatilità del proprio comparto.`}`);
  const stepDownAmount = stepDownValue.toLocaleString('it-IT', { maximumFractionDigits: 2 });
  const stepDownUnit = stepDownValue === 1 ? 'punto percentuale' : 'punti percentuali';
  const stepDownText = stepDownValue > 0
    ? `Lo <strong>Step-down</strong> riduce la soglia di rimborso anticipato di ${stepDownAmount} ${stepDownUnit} a ogni osservazione mensile${stepDownStartText ? `, a partire ${stepDownStartText}` : ''}. Se il Worst-of raggiunge la soglia e sono soddisfatte le altre condizioni contrattuali, il prodotto può rimborsare anticipatamente il nominale; la cedola del periodo e quelle eventualmente in memoria spettano solo se rispettano le rispettive condizioni. L'uscita anticipata interrompe l'esposizione al certificato e le cedole future, riducendo il guadagno potenziale rispetto al proseguimento fino a scadenza e introducendo il rischio di reinvestimento. A parità di altre condizioni, uno Step-down più rapido può aumentare la probabilità di rimborso anticipato e contribuire a sostenere le quotazioni, ma l'effetto sul prezzo non è automatico né garantito.`
    : `Il prodotto non prevede uno Step-down: la soglia di rimborso anticipato non si riduce nel tempo, secondo i dati disponibili.`;

  const paragraphs = [
    `Il presente certificato di investimento è emesso da <strong>${cert.issuer}</strong>, ${lowercaseIssuerDescriptionStart} ${ratingSentence}`,
    `La scadenza teorica del certificato è fissata per il ${cert.expiryDate}. Il rendimento potenziale annuo lordo è pari al <strong>${annualYield.toFixed(2)}%</strong> e, poiché presuppone il pagamento di tutte le cedole condizionate previste, non è garantito.`,
    barrierComment,
    couponComment,
    `I sottostanti possono seguire dinamiche diverse. La struttura <strong>Worst-of</strong> fa dipendere cedole e rimborso dal sottostante con la performance peggiore: il buon andamento degli altri non compensa automaticamente un forte ribasso del Worst-of. Di seguito una breve descrizione di ciascun sottostante:`,
    ...underlyingParagraphs,
    `La struttura <strong>Quanto</strong>, secondo le condizioni del prodotto, neutralizza l'effetto diretto del cambio sulle componenti previste dal contratto; non elimina i rischi legati ai sottostanti, all'emittente o al mercato.`,
    stepDownText,
    `Tra gli elementi potenzialmente favorevoli figurano le cedole mensili lorde, l'eventuale recupero delle cedole in memoria quando si verificano le condizioni contrattuali e la possibilità di rimborso anticipato. La barriera capitale offre un buffer condizionato, ma non elimina il rischio di perdita. Tra le criticità rientrano la dipendenza dal Worst-of, la possibile sospensione delle cedole, il rischio di credito dell'emittente e la liquidità: in fasi di mercato tese, la vendita anticipata può avvenire a prezzi sfavorevoli. Il rimborso anticipato può inoltre interrompere le cedole future e richiedere il reinvestimento del capitale.`
  ];

  const scenarios = [
    { scenario: 'Rialzista', sottostante: 'Worst-Of >= 100%', cedole: `Cedole condizionate pagate: ${annualYield.toFixed(2)}% p.a.; incluse tutte le eventuali cedole arretrate in memoria`, capitale: 'Capitale protetto e possibile rimborso nominale anticipato', rendimentoNetto: `${annualYield.toFixed(2)}% annuo lordo annualizzato` },
    { scenario: 'Stabile', sottostante: `Worst-Of tra 100% e ${highBarrier}%`, cedole: `Cedole condizionate pagate: ${annualYield.toFixed(2)}% p.a.; se la barriera coupon viene recuperata: pagamento di tutte le eventuali cedole arretrate in memoria`, capitale: 'Capitale protetto e rimborso nominale', rendimentoNetto: `${annualYield.toFixed(2)}% annuo lordo annualizzato` },
    { scenario: 'Moderat. ribassista', sottostante: highBarrier > lowBarrier ? `Worst-Of tra ${highBarrier}% e ${lowBarrier}%` : `Nessuna fascia intermedia: soglia unica al ${capitalBarrier}%`, cedole: couponBarrier === capitalBarrier ? `Cedole a rischio sotto ${couponBarrier}%; se la barriera coupon viene recuperata: pagamento di tutte le cedole arretrate in memoria` : `Cedole a rischio sotto ${couponBarrier}%; se la barriera coupon viene recuperata: pagamento di tutte le cedole arretrate in memoria`, capitale: moderateRangeBreaksCapitalBarrier ? 'Rimborso proporzionale al Worst-Of: barriera capitale violata' : 'Capitale protetto e rimborso nominale', rendimentoNetto: moderateRangeBreaksCapitalBarrier ? 'Perdita sul capitale a scadenza, eventualmente attenuata dalle cedole incassate' : `${annualYield.toFixed(2)}% annuo lordo annualizzato (se barriera coupon non violata)` },
    { scenario: 'Ribassista', sottostante: `Worst-Of < ${lowBarrier}%`, cedole: 'Cedole non pagate finché la barriera coupon resta violata; se la barriera coupon viene recuperata: pagamento di tutte le cedole arretrate in memoria', capitale: 'Perdita proporzionale al Worst-Of sotto barriera', rendimentoNetto: 'Perdita netta sul capitale solo se le cedole incassate non compensano il ribasso del Worst-Of' }
  ];

  const pros = [];
  const cons = [];
  if (capitalBarrier <= 50) pros.push(`Barriera capitale al ${cert.barrierCapital}: buffer condizionato del ${100 - capitalBarrier}% rispetto ai livelli iniziali, con osservazione a scadenza.`);
  else cons.push(`Barriera capitale al ${cert.barrierCapital}: offre un buffer condizionato del ${100 - capitalBarrier}%, ma non è particolarmente difensiva e non limita la perdita in caso di violazione a scadenza.`);
  cons.push(`Rischio di perdita del capitale: se alla data finale il Worst-of è sotto la barriera capitale, il rimborso può ridursi in funzione della sua performance, secondo i termini del prodotto.`);
  if (couponBarrier <= 50) pros.push(`Barriera coupon al ${cert.barrierCoupon}: la soglia consente il pagamento della cedola anche con il Worst-of in ribasso, se resta sopra barriera alle date di osservazione.`);
  else cons.push(`Barriera coupon al ${cert.barrierCoupon}: la cedola richiede che il Worst-of rispetti la soglia a ogni data di osservazione; sotto barriera può non essere pagata.`);
  if (monthlyYield >= 1) pros.push(`Cedola potenziale mensile lorda del ${monthlyYield.toFixed(2)}%, pari al ${annualYield.toFixed(2)}% annuo lordo, subordinata alle condizioni del prodotto.`);
  else cons.push(`Cedola potenziale mensile lorda contenuta (${monthlyYield.toFixed(2)}%); il pagamento resta subordinato alle condizioni del prodotto.`);
  if (annualYield > 15) cons.push(`Rendimento potenziale lordo elevato (${annualYield.toFixed(2)}% annuo): non è garantito e va valutato insieme ai rischi di barriera, sottostanti ed emittente.`);
  if (hasStrongRating) pros.push(`Tra i rating riportati nel database figura almeno un giudizio in fascia A (${ratingText}); i rating possono variare e non eliminano il rischio di credito.`);
  else cons.push(`Rating dell'emittente: ${ratingText}; verifica gli aggiornamenti più recenti e considera il rischio di credito.`);
  if (stepDownValue > 0) {
    pros.push(`Step-down di ${stepDownAmount} ${stepDownUnit} per osservazione: può aumentare la probabilità di rimborso anticipato, senza garantirlo.`);
    cons.push('Il rimborso anticipato interrompe le cedole future e può comportare il rischio di reinvestire il capitale a condizioni meno favorevoli.');
  }
  pros.push('Effetto memoria: possibilità di recuperare le cedole non pagate solo se si verificano le condizioni contrattuali previste.');
  pros.push("Struttura Quanto: copertura dell'effetto diretto del cambio sulle componenti previste dal contratto, senza eliminare gli altri rischi del prodotto.");
  cons.push('Struttura Worst-of: il risultato dipende dal sottostante con la performance peggiore; gli altri sottostanti non compensano automaticamente un suo forte ribasso.');
  cons.push('Rischio di liquidità: in fasi di mercato tese la vendita anticipata può avvenire a prezzi sfavorevoli o con spread più ampi.');
  if (capitalBarrier !== couponBarrier) cons.push(`Barriera coupon (${cert.barrierCoupon}) e barriera capitale (${cert.barrierCapital}) sono diverse: la cedola può saltare prima della protezione del capitale.`);

  return { paragraphs, scenarios, pros, cons };
}
