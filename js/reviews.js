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
  const stepDownValue = Number.parseFloat(cert.stepDown) || 0;
  const stepDownStartText = formatStepDownStartMonth(cert.stepDownStartMonth);
  const issuerData = ISSUERS_DATA.find(item => item.name === cert.issuer || item.name.startsWith(`${cert.issuer} `));
  const issuerDescription = issuerData ? issuerData.description : `L'emittente ${cert.issuer} opera nel mercato dei prodotti strutturati.`;
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
  const ratingDescriptions = issuerData && issuerData.ratings
    ? Object.entries(issuerData.ratings).map(([agency, rating], index) => `${index === 0 ? 'un rating ' : ''}${rating} da parte di ${agency}`)
    : [];
  const ratingSummary = ratingDescriptions.length > 1
    ? `${ratingDescriptions.slice(0, -1).join(', ')} e ${ratingDescriptions[ratingDescriptions.length - 1]}`
    : ratingDescriptions[0] || 'un rating non disponibile';
  const ratingSentence = issuerData && issuerData.ratings
    ? `${cert.issuer} vanta ${ratingSummary}.`
    : "Il rating dell'emittente va verificato nella documentazione aggiornata del prodotto.";
  const barrierComment = `La barriera capitale al <strong>${cert.barrierCapital}</strong> (europea, con valutazione a scadenza) è relativamente profonda e lascia un margine di protezione del capitale fino a un ribasso del ${100 - capitalBarrier}% del sottostante peggiore.`;
  const couponComment = `La barriera per il pagamento del coupon mensile è fissata al ${cert.barrierCoupon}, una soglia che può consentire l'erogazione di cedole anche in presenza di ribassi importanti; questa sarà valutata mese per mese, consentendo anche il recupero di eventuali cedole non erogate, grazie all'effetto memoria, se il Worst-Of dovesse recuperare il livello barriera coupon.`;
  const underlyingProfiles = typeof UNDERLYING_PROFILES !== 'undefined' ? UNDERLYING_PROFILES : {};
  const underlyingText = cert.underlyings.map(name => `<strong>${name}</strong>: ${underlyingProfiles[name] || `${name} è esposto al ciclo economico, ai risultati societari e alla volatilità del proprio comparto.`}`).join('<br>');
  const stepDownArticle = cert.stepDown === '1%' ? "dell'" : 'del ';
  const stepDownText = `Lo <strong>Step-down</strong> ${stepDownArticle}${cert.stepDown}${stepDownStartText ? ` (${stepDownStartText})` : ''} può facilitare il rimborso anticipato se il paniere recupera e raggiunge la soglia prevista, contribuendo anche a sostenere nel tempo il valore del certificato. Tuttavia, può interrompere anzitempo il flusso cedolare potenziale.`;

  const paragraphs = [
    `Il certificato in oggetto è emesso da <strong>${cert.issuer}</strong>, ${issuerDescription.toLowerCase()} ${ratingSentence}<br>La struttura investe su ${cert.underlyings.join(', ')} e prevede un rendimento potenziale annuo del <strong>${annualYield.toFixed(2)}%</strong>, con scadenza il ${cert.expiryDate}. ${barrierComment}<br><br>${couponComment}`,
    `Il certificato investe in un paniere composto da società con caratteristiche diverse. Per i sottostanti denominati in valuta diversa dall'euro, la struttura <strong>Quanto</strong> neutralizza l'impatto diretto delle oscillazioni del cambio sull'intero payoff del certificato: sia i flussi cedolari sia la valutazione della performance dei sottostanti vengono considerati senza l'effetto della conversione valutaria. Di seguito una breve descrizione dei titoli che compongono il paniere:<br><br>${underlyingText}`,
    `${stepDownText}<br><br>Tra i vantaggi ci sono la possibilità di ottenere un flusso cedolare mensile importante, la protezione del capitale a scadenza, grazie al margine offerto dalla barriera capitale al ${cert.barrierCapital}, e la possibilità di un rimborso anticipato.<br><br>Gli svantaggi sono la struttura Worst-Of, la sospensione delle cedole sotto barriera, la perdita potenziale del capitale a scadenza, il rischio di credito di ${cert.issuer} e una liquidità che può ridursi in fasi di mercato tese.`,
    `Per farti un'idea completa prima di valutare il prodotto, verifica la <strong>Matrice Scenari di Rimborso a Scadenza</strong>, poi confronta i <strong>Punti di Forza</strong> e le <strong>Criticità e Rischi</strong>. È il modo più chiaro per capire come potrebbero cambiare cedole, rimborso e capitale in caso di rialzo, stabilità o ribasso dei singoli sottostanti.`
  ];

  const scenarios = [
    { scenario: 'Rialzista', sottostante: 'Worst-Of >= 100%', cedole: `Cedole condizionate pagate: ${annualYield.toFixed(2)}% p.a.; incluse tutte le eventuali cedole arretrate in memoria`, capitale: 'Capitale protetto e possibile rimborso nominale anticipato', rendimentoNetto: `${annualYield.toFixed(2)}% annuo lordo annualizzato` },
    { scenario: 'Stabile', sottostante: `Worst-Of tra 100% e ${highBarrier}%`, cedole: `Cedole condizionate pagate: ${annualYield.toFixed(2)}% p.a.; se la barriera coupon viene recuperata: pagamento di tutte le eventuali cedole arretrate in memoria`, capitale: 'Capitale protetto e rimborso nominale', rendimentoNetto: `${annualYield.toFixed(2)}% annuo lordo annualizzato` },
    { scenario: 'Moderat. ribassista', sottostante: highBarrier > lowBarrier ? `Worst-Of tra ${highBarrier}% e ${lowBarrier}%` : `Nessuna fascia intermedia: soglia unica al ${capitalBarrier}%`, cedole: couponBarrier === capitalBarrier ? `Cedole a rischio sotto ${couponBarrier}%; se la barriera coupon viene recuperata: pagamento di tutte le cedole arretrate in memoria` : `Cedole a rischio sotto ${couponBarrier}%; se la barriera coupon viene recuperata: pagamento di tutte le cedole arretrate in memoria`, capitale: 'Capitale protetto e rimborso nominale', rendimentoNetto: `${annualYield.toFixed(2)}% annuo lordo annualizzato (se barriera coupon non violata)` },
    { scenario: 'Ribassista', sottostante: `Worst-Of < ${lowBarrier}%`, cedole: 'Cedole non pagate finché la barriera coupon resta violata; se la barriera coupon viene recuperata: pagamento di tutte le cedole arretrate in memoria', capitale: 'Perdita proporzionale al Worst-Of sotto barriera', rendimentoNetto: 'Perdita netta sul capitale solo se le cedole incassate non compensano il ribasso del Worst-Of' }
  ];

  const pros = [];
  const cons = [];
  if (capitalBarrier <= 50) pros.push(`Barriera capitale profonda al ${cert.barrierCapital}, con protezione condizionata fino a un ribasso del ${100 - capitalBarrier}%.`);
  else cons.push(`Barriera capitale non profonda: è fissata al ${cert.barrierCapital}, quindi il margine prima della perdita del capitale è più contenuto.`);
  if (couponBarrier < 50) pros.push(`Barriera coupon vantaggiosa al ${cert.barrierCoupon}: facilita il pagamento delle cedole anche in presenza di ribassi dei sottostanti.`);
  else if (couponBarrier > 50) cons.push(`Barriera coupon al ${cert.barrierCoupon}: supera il 50% e rende più esigente la condizione per il pagamento delle cedole.`);
  if (monthlyYield >= 1.5) pros.push(`Cedola potenziale molto elevata: ${monthlyYield.toFixed(2)}% mensile, pari al ${annualYield.toFixed(2)}% annuo.`);
  else if (monthlyYield >= 1) pros.push(`Cedola potenziale interessante: ${monthlyYield.toFixed(2)}% mensile, pari al ${annualYield.toFixed(2)}% annuo.`);
  else cons.push(`Cedola potenziale contenuta: ${monthlyYield.toFixed(2)}% mensile, pari al ${annualYield.toFixed(2)}% annuo.`);
  if (annualYield > 15) cons.push(`Premio potenziale elevato: può riflettere l'esposizione a sottostanti volatili o meccanismi di protezione meno solidi.`);
  if (hasStrongRating) pros.push(`Emittente con rating investment grade di fascia A: ${ratingText}.`);
  else cons.push(`Il rating dell'emittente non è di fascia A secondo i dati disponibili: ${ratingText}.`);
  if (stepDownValue >= 1) pros.push(`Step-down del ${cert.stepDown}: più è ampio, più può facilitare l'uscita anticipata e sostenere il prezzo del certificato.`);
  else cons.push(`Step-down inferiore all'1% (${cert.stepDown}); il trigger autocall si riduce lentamente, limitando la potenziale uscita anticipata e il sostegno al prezzo del certificato.`);
  pros.push('Effetto memoria: recupero delle cedole non pagate se il Worst-Of torna sopra la barriera coupon.');
  pros.push('Struttura Quanto: flussi e rimborso in euro, senza rischio di cambio.');
  cons.push('Struttura Worst-Of: il rimborso e le cedole dipendono dal sottostante con la performance peggiore.');
  cons.push("Liquidita: anche con market maker e spread indicativo entro l'1%, possono verificarsi spread maggiori o quotazioni bid-only.");
  if (capitalBarrier !== couponBarrier) cons.push(`Barriera coupon (${cert.barrierCoupon}) e barriera capitale (${cert.barrierCapital}) sono diverse: la cedola può saltare prima della protezione del capitale.`);

  return { paragraphs, scenarios, pros, cons };
}
