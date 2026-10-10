<?php

declare(strict_types=1);

function projectPath(string $relative): string
{
    return dirname(__DIR__) . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relative);
}

function readProjectFile(string $relative): string
{
    $contents = file_get_contents(projectPath($relative));
    if ($contents === false) {
        throw new RuntimeException('Impossibile leggere ' . $relative . '.');
    }
    return $contents;
}

function sourceArray(string $relative, string $declaration): array
{
    $source = readProjectFile($relative);
    $source = preg_replace('/^\s*\/\/[^\r\n]*(?:\r?\n|$)/', '', $source, 1);
    $source = preg_replace('/^\s*(?:const|let|var)\s+' . preg_quote($declaration, '/') . '\s*=\s*/', '', $source, 1);
    $source = preg_replace('/;\s*$/', '', (string)$source);
    $source = preg_replace_callback(
        '/(^|[{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)\s*:/m',
        static fn($match) => $match[1] . '"' . $match[2] . '":',
        (string)$source
    );
    try {
        $decoded = json_decode((string)$source, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $error) {
        throw new RuntimeException('Impossibile leggere i dati da ' . $relative . '.', 0, $error);
    }
    if (!is_array($decoded)) {
        throw new RuntimeException('Formato dati non valido in ' . $relative . '.');
    }
    return $decoded;
}

function decodeJsString(string $value): string
{
    $decoded = json_decode('"' . $value . '"');
    return is_string($decoded) ? $decoded : $value;
}

function loadUnderlyingProfiles(): array
{
    $source = readProjectFile('js/data-underlyings.js');
    if (!preg_match('/const\s+UNDERLYING_PROFILES\s*=\s*\{([\s\S]*?)\};/m', $source, $object)) {
        throw new RuntimeException('Archivio dei profili sottostanti non trovato.');
    }
    preg_match_all('/(?:"([^"]+)"|([A-Za-z0-9_]+))\s*:\s*"((?:\\\\.|[^"\\\\])*)"\s*,?/s', $object[1], $matches, PREG_SET_ORDER);
    $profiles = [];
    foreach ($matches as $match) {
        $profiles[$match[1] !== '' ? $match[1] : $match[2]] = decodeJsString($match[3]);
    }
    return $profiles;
}

function plainHtml(string $html): string
{
    return trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8')) ?? '');
}

function loadIssuerProfiles(): array
{
    $html = readProjectFile('emittenti.html');
    preg_match_all('/<article\b([^>]*\bclass=["\'][^"\']*\bissuer-card\b[^"\']*["\'][^>]*)>([\s\S]*?)<\/article>/i', $html, $cards, PREG_SET_ORDER);
    $issuers = [];
    foreach ($cards as $cardMatch) {
        $card = $cardMatch[2];
        if (!preg_match('/<h3\b[^>]*class=["\'][^"\']*\bissuer-name\b[^"\']*["\'][^>]*>([\s\S]*?)<\/h3>/i', $card, $nameMatch)) {
            continue;
        }
        $name = plainHtml($nameMatch[1]);
        if (!preg_match('/<div\b[^>]*class=["\'][^"\']*\bissuer-body\b[^"\']*["\'][^>]*>([\s\S]*?)<\/div>/i', $card, $bodyMatch)) {
            continue;
        }
        $description = plainHtml($bodyMatch[1]);
        $ratings = [];
        preg_match_all('/<div\b[^>]*class=["\'][^"\']*\brating-pill\b[^"\']*["\'][^>]*>([\s\S]*?)<\/div>/i', $card, $pills);
        foreach ($pills[1] as $pill) {
            if (
                preg_match('/<span\b[^>]*class=["\'][^"\']*\brating-agency\b[^"\']*["\'][^>]*>([\s\S]*?)<\/span>/i', $pill, $agencyMatch)
                && preg_match('/<span\b[^>]*class=["\'][^"\']*\brating-val\b[^"\']*["\'][^>]*>([\s\S]*?)<\/span>/i', $pill, $ratingMatch)
            ) {
                $agency = rtrim(plainHtml($agencyMatch[1]), ': ');
                $rating = plainHtml($ratingMatch[1]);
                if ($agency !== '' && $rating !== '' && strtolower($rating) !== 'n.d.' && strtolower($rating) !== 'non rated') {
                    $ratings[$agency] = $rating;
                }
            }
        }
        $id = preg_match('/\bid=["\']([^"\']+)["\']/i', $cardMatch[1], $idMatch) ? $idMatch[1] : '';
        $issuers[$name] = ['id' => $id, 'description' => $description, 'ratings' => $ratings];
    }
    if ($issuers === []) {
        throw new RuntimeException('Nessun profilo emittente trovato in emittenti.html.');
    }
    return $issuers;
}

function findIssuerProfile(string $issuer, array $profiles): ?array
{
    foreach ($profiles as $name => $profile) {
        if ($name === $issuer || str_starts_with($name, $issuer . ' ')) {
            return $profile;
        }
    }
    return null;
}

function issuerDescriptionStart(string $issuer, ?array $profile): string
{
    $description = $profile['description'] ?? "L'emittente {$issuer} opera nel mercato dei prodotti strutturati.";
    $description = preg_replace('/^' . preg_quote($issuer, '/') . '\s*/iu', '', $description) ?? $description;
    $description = preg_replace('/^\([^)]*\)\s*/u', '', $description) ?? $description;
    $description = preg_replace('/^,\s*|^è\s+/iu', '', $description) ?? $description;
    $description = preg_replace("/^un['’]\\s*/iu", '', $description) ?? $description;
    $description = trim($description);
    return $description === '' ? $description : strtolower(substr($description, 0, 1)) . substr($description, 1);
}

function issuerRatings(?array $profile): array
{
    if (!$profile || !is_array($profile['ratings'] ?? null)) {
        return [];
    }
    return $profile['ratings'];
}

function formatEditorialParagraph(string $text): string
{
    return nl2br(h($text));
}

function reviewMarkupToEditorHtml(string $markup): string
{
    return '<p>' . sanitizeEditorialInlineHtml($markup) . '</p>';
}

function generateReviewData(array $certificate, ?array $issuerProfile, array $underlyingProfiles, array $override = []): array
{
    $capital = (float)parsePercentValue($certificate['barrierCapital']);
    $coupon = (float)parsePercentValue($certificate['barrierCoupon']);
    $annual = (float)$certificate['annualYield'];
    $monthly = $annual / 12;
    $step = (float)parsePercentValue($certificate['stepDown']);
    $high = max($capital, $coupon);
    $low = min($capital, $coupon);
    $ratings = issuerRatings($issuerProfile);
    $ratingNames = array_keys($ratings);
    $ratingValues = array_values($ratings);
    $ratingText = $ratings === []
        ? 'Rating non disponibile nel database'
        : implode(' · ', array_map(static fn($agency, $rating) => $agency . ': ' . $rating, $ratingNames, $ratingValues));
    if (count($ratings) === 1) {
        $agency = $ratingNames[0];
        $ratingSentence = $agency . " assegna all'emittente un rating di credito pari ad " . $ratingValues[0] . '. Poiché il rating può cambiare, è opportuno verificarne il valore più aggiornato sul sito dell’agenzia e nella documentazione ufficiale del prodotto.';
    } elseif (count($ratings) > 1) {
        $parts = [];
        foreach ($ratings as $agency => $rating) {
            $parts[] = $rating . ' ' . (count($parts) === 0 ? 'da parte di ' : 'da ') . $agency;
        }
        $last = array_pop($parts);
        $summary = $parts === [] ? $last : implode(', ', $parts) . ' e ' . $last;
        $ratingSentence = 'Le agenzie assegnano all’emittente i seguenti rating di credito: ' . $summary . '. Poiché queste valutazioni possono cambiare, è opportuno verificarne i valori più recenti sui siti delle agenzie e nella documentazione ufficiale del prodotto.';
    } else {
        $ratingSentence = 'Le valutazioni delle agenzie sulla solidità creditizia dell’emittente non sono disponibili: è opportuno verificarne i valori più recenti sui siti delle agenzie e nella documentazione ufficiale del prodotto.';
    }
    $barrierComment = "La barriera capitale europea al <strong>{$certificate['barrierCapital']}</strong> è osservata a scadenza e corrisponde a una soglia pari al {$capital}% dei livelli iniziali (buffer del " . (100 - $capital) . '%). Il buffer è condizionato e non limita la perdita massima: se alla scadenza il Worst-of chiude sotto barriera, il rimborso segue la sua performance finale. Per esempio, se il Worst-of chiudesse a ' . ($capital - 5) . '% (5 punti percentuali sotto la barriera), il rimborso sarebbe pari al ' . ($capital - 5) . '% dell’importo investito, con una perdita del ' . (100 - ($capital - 5)) . '% prima di considerare gli eventuali premi già incassati.';
    $couponComment = "Il pagamento della cedola mensile è condizionato al rispetto della barriera coupon del {$certificate['barrierCoupon']} a ogni data di osservazione. Se il Worst-of non raggiunge questa soglia, la cedola non viene pagata. Grazie all’<strong>effetto memoria</strong>, le cedole sospese possono essere recuperate in una successiva data di osservazione solo se il Worst-of torna almeno al {$certificate['barrierCoupon']}.";
    $stepMonth = (int)$certificate['stepDownStartMonth'];
    $stepMonthText = $stepMonth >= 1 && $stepMonth <= 6 ? "dal {$stepMonth}° mese" : '';
    $stepLabel = rtrim(rtrim(number_format($step, 2, ',', ''), '0'), ',');
    $stepUnit = $step == 1.0 ? 'punto percentuale' : 'punti percentuali';
    $stepText = $step > 0
        ? "Lo <strong>Step-down</strong> riduce la soglia di rimborso anticipato di {$stepLabel} {$stepUnit} a ogni osservazione mensile" . ($stepMonthText !== '' ? ", a partire {$stepMonthText}" : '') . ". Se il Worst-of raggiunge la soglia e sono soddisfatte le altre condizioni contrattuali, il prodotto può rimborsare anticipatamente il nominale; la cedola del periodo e quelle eventualmente in memoria spettano solo se rispettano le rispettive condizioni. L’uscita anticipata interrompe l’esposizione al certificato e le cedole future, riducendo il guadagno potenziale rispetto al proseguimento fino a scadenza e introducendo il rischio di reinvestimento. A parità di altre condizioni, uno Step-down più rapido può aumentare la probabilità di rimborso anticipato e contribuire a sostenere le quotazioni, ma l’effetto sul prezzo non è automatico né garantito."
        : 'Il prodotto non prevede uno Step-down: la soglia di rimborso anticipato non si riduce nel tempo, secondo i dati disponibili.';

    $paragraphs = [
        'Il presente certificato di investimento è emesso da <strong>' . h((string)$certificate['issuer']) . '</strong>, ' . h(issuerDescriptionStart((string)$certificate['issuer'], $issuerProfile)) . ' ' . h($ratingSentence),
        'La scadenza teorica del certificato è fissata per il ' . h((string)$certificate['expiryDate']) . '. Il rendimento potenziale annuo lordo è pari al <strong>' . number_format($annual, 2, '.', '') . '%</strong> e, poiché presuppone il pagamento di tutte le cedole condizionate previste, non è garantito.',
        $barrierComment,
        $couponComment,
        'I sottostanti possono seguire dinamiche diverse. La struttura <strong>Worst-of</strong> fa dipendere cedole e rimborso dal sottostante con la performance peggiore: il buon andamento degli altri non compensa automaticamente un forte ribasso del Worst-of. Di seguito una breve descrizione di ciascun sottostante:',
    ];
    foreach ($certificate['underlyings'] as $name) {
        $profile = $underlyingProfiles[$name] ?? "{$name} è esposto al ciclo economico, ai risultati societari e alla volatilità del proprio comparto.";
        $paragraphs[] = '<strong>' . h((string)$name) . '</strong>: ' . h((string)$profile);
    }
    $paragraphs[] = 'La struttura <strong>Quanto</strong>, secondo le condizioni del prodotto, neutralizza l’effetto diretto del cambio sulle componenti previste dal contratto; non elimina i rischi legati ai sottostanti, all’emittente o al mercato.';
    $paragraphs[] = $stepText;
    $paragraphs[] = 'Tra gli elementi potenzialmente favorevoli figurano le cedole mensili lorde, l’eventuale recupero delle cedole in memoria quando si verificano le condizioni contrattuali e la possibilità di rimborso anticipato. La barriera capitale offre un buffer condizionato, ma non elimina il rischio di perdita. Tra le criticità rientrano la dipendenza dal Worst-of, la possibile sospensione delle cedole, il rischio di credito dell’emittente e la liquidità: in fasi di mercato tese, la vendita anticipata può avvenire a prezzi sfavorevoli. Il rimborso anticipato può inoltre interrompere le cedole future e richiedere il reinvestimento del capitale.';
    $stepText = preg_replace('/<[^>]+>/', '', $stepText) ?? $stepText;

    $scenarios = [
        ['Rialzista', 'Worst-Of >= 100%', "Cedole condizionate pagate: " . number_format($annual, 2, '.', '') . '% p.a.; incluse tutte le eventuali cedole arretrate in memoria', 'Capitale protetto e possibile rimborso nominale anticipato', number_format($annual, 2, '.', '') . '% annuo lordo annualizzato'],
        ['Stabile', "Worst-Of tra 100% e {$high}%", 'Cedole condizionate pagate: ' . number_format($annual, 2, '.', '') . '% p.a.; se la barriera coupon viene recuperata: pagamento di tutte le eventuali cedole arretrate in memoria', 'Capitale protetto e rimborso nominale', number_format($annual, 2, '.', '') . '% annuo lordo annualizzato'],
        ['Moderat. ribassista', $high > $low ? "Worst-Of tra {$high}% e {$low}%" : "Nessuna fascia intermedia: soglia unica al {$capital}%", "Cedole a rischio sotto {$coupon}%; se la barriera coupon viene recuperata: pagamento di tutte le cedole arretrate in memoria", $capital > $low ? 'Rimborso proporzionale al Worst-Of: barriera capitale violata' : 'Capitale protetto e rimborso nominale', $capital > $low ? 'Perdita sul capitale a scadenza, eventualmente attenuata dalle cedole incassate' : number_format($annual, 2, '.', '') . '% annuo lordo annualizzato (se barriera coupon non violata)'],
        ['Ribassista', "Worst-Of < {$low}%", 'Cedole non pagate finché la barriera coupon resta violata; se la barriera coupon viene recuperata: pagamento di tutte le cedole arretrate in memoria', 'Perdita proporzionale al Worst-Of sotto barriera', 'Perdita netta sul capitale solo se le cedole incassate non compensano il ribasso del Worst-of'],
    ];
    $pros = [];
    $cons = [];
    if ($capital <= 50) $pros[] = "Barriera capitale al {$certificate['barrierCapital']}: buffer condizionato del " . (100 - $capital) . '% rispetto ai livelli iniziali, con osservazione a scadenza.';
    else $cons[] = "Barriera capitale al {$certificate['barrierCapital']}: offre un buffer condizionato del " . (100 - $capital) . '%, ma non è particolarmente difensiva e non limita la perdita in caso di violazione a scadenza.';
    $cons[] = 'Rischio di perdita del capitale: se alla data finale il Worst-of è sotto la barriera capitale, il rimborso può ridursi in funzione della sua performance, secondo i termini del prodotto.';
    if ($coupon <= 50) $pros[] = "Barriera coupon al {$certificate['barrierCoupon']}: la soglia consente il pagamento della cedola anche con il Worst-of in ribasso, se resta sopra barriera alle date di osservazione.";
    else $cons[] = "Barriera coupon al {$certificate['barrierCoupon']}: la cedola richiede che il Worst-of rispetti la soglia a ogni data di osservazione; sotto barriera può non essere pagata.";
    if ($monthly >= 1) $pros[] = 'Cedola potenziale mensile lorda del ' . number_format($monthly, 2, '.', '') . '%, pari al ' . number_format($annual, 2, '.', '') . '% annuo lordo, subordinata alle condizioni del prodotto.';
    else $cons[] = 'Cedola potenziale mensile lorda contenuta (' . number_format($monthly, 2, '.', '') . '%); il pagamento resta subordinato alle condizioni del prodotto.';
    if ($annual > 15) $cons[] = 'Rendimento potenziale lordo elevato (' . number_format($annual, 2, '.', '') . '% annuo): non è garantito e va valutato insieme ai rischi di barriera, sottostanti ed emittente.';
    $strongRating = false;
    foreach ($ratings as $rating) if (preg_match('/^A/i', (string)$rating)) $strongRating = true;
    if ($strongRating) $pros[] = "Tra i rating riportati nel database figura almeno un giudizio in fascia A ({$ratingText}); i rating possono variare e non eliminano il rischio di credito.";
    else $cons[] = "Rating dell’emittente: {$ratingText}; verifica gli aggiornamenti più recenti e considera il rischio di credito.";
    if ($step > 0) {
        $pros[] = "Step-down di {$stepLabel} {$stepUnit} per osservazione: può aumentare la probabilità di rimborso anticipato, senza garantirlo.";
        $cons[] = 'Il rimborso anticipato interrompe le cedole future e può comportare il rischio di reinvestire il capitale a condizioni meno favorevoli.';
    }
    $pros[] = 'Effetto memoria: possibilità di recuperare le cedole non pagate solo se si verificano le condizioni contrattuali previste.';
    $pros[] = 'Struttura Quanto: copertura dell’effetto diretto del cambio sulle componenti previste dal contratto, senza eliminare gli altri rischi del prodotto.';
    $cons[] = 'Struttura Worst-of: il risultato dipende dal sottostante con la performance peggiore; gli altri sottostanti non compensano automaticamente un suo forte ribasso.';
    $cons[] = 'Rischio di liquidità: in fasi di mercato tese la vendita anticipata può avvenire a prezzi sfavorevoli o con spread più ampi.';
    if ($capital !== $coupon) $cons[] = "Barriera coupon ({$certificate['barrierCoupon']}) e barriera capitale ({$certificate['barrierCapital']}) sono diverse: la cedola può saltare prima della protezione del capitale.";

    $override = normalizeReviewOverride($override);
    if ($override['fullText']) {
        $paragraphs = $override['paragraphs'];
        $scenarios = $override['scenarios'];
    } else {
        if ($override['lead'] !== '') $paragraphs[0] = nl2br(h($override['lead']));
        if ($override['note'] !== '') $paragraphs[] = nl2br(h($override['note']));
    }
    if ($override['fullText']) {
        $pros = $override['pros'];
        $cons = $override['cons'];
    }
    $scenarioDescription = $override['fullText']
        ? $override['scenarioDescription']
        : 'Simulazione teorica del pay-off a scadenza, con i livelli espressi in rapporto agli strike iniziali dei sottostanti, fissati al momento del fixing del prodotto.';
    return [
        'paragraphs' => $paragraphs,
        'scenarios' => $scenarios,
        'pros' => $pros,
        'cons' => $cons,
        'ratings' => $ratingText,
        'stepMonth' => $stepMonthText,
        'scenarioDescription' => $scenarioDescription,
    ];
}

function parsePercentValue(string $value): float
{
    return (float)str_replace(',', '.', str_replace('%', '', $value));
}

function reviewEditorialFormValues(array $certificate, array $override = []): array
{
    $issuerProfiles = loadIssuerProfiles();
    $underlyingProfiles = loadUnderlyingProfiles();
    $issuerProfile = findIssuerProfile((string)$certificate['issuer'], $issuerProfiles);
    $data = generateReviewData($certificate, $issuerProfile, $underlyingProfiles, $override);
    return [
        'paragraphs' => implode('', array_map('reviewMarkupToEditorHtml', $data['paragraphs'])),
        'scenarioDescription' => $data['scenarioDescription'],
        'scenarios' => $data['scenarios'],
        'pros' => $data['pros'],
        'cons' => $data['cons'],
    ];
}

function renderReviewContent(array $certificate, array $certificates, array $issuerProfiles, array $underlyingProfiles, array $overrides): string
{
    $issuerProfile = findIssuerProfile((string)$certificate['issuer'], $issuerProfiles);
    $data = generateReviewData($certificate, $issuerProfile, $underlyingProfiles, $overrides[$certificate['isin']] ?? []);
    $isin = h((string)$certificate['isin']);
    $name = h((string)$certificate['name']);
    $issuer = h((string)$certificate['issuer']);
    $yield = number_format((float)$certificate['annualYield'], 2, '.', '');
    $monthly = number_format((float)$certificate['annualYield'] / 12, 2, '.', '');
    $stepMonth = $data['stepMonth'] !== '' ? '<br><small>' . h($data['stepMonth']) . '</small>' : '';
    $scenarioDescription = h($data['scenarioDescription']);
    $options = '';
    foreach ($certificates as $item) {
        $options .= '<option value="' . h((string)$item['isin']) . '"' . ($item['isin'] === $certificate['isin'] ? ' selected' : '') . '>' . h((string)$item['isin'] . ' - ' . (string)$item['name']) . '</option>';
    }
    $summary = '';
    foreach ($data['paragraphs'] as $paragraph) $summary .= '<p>' . $paragraph . '</p>';
    $scenarioRows = '';
    foreach ($data['scenarios'] as $index => $scenario) {
        $scenarioRows .= '<tr class="scenario-row scenario-row-' . ($index + 1) . '"><td data-label="Scenario"><strong>' . formatEditorialParagraph($scenario[0]) . '</strong></td><td data-label="Sottostanti">' . formatEditorialParagraph($scenario[1]) . '</td><td data-label="Cedole">' . formatEditorialParagraph($scenario[2]) . '</td><td data-label="Rimborso capitale">' . formatEditorialParagraph($scenario[3]) . '</td><td data-label="Esito finanziario"><strong class="scenario-result">' . formatEditorialParagraph($scenario[4]) . '</strong></td></tr>';
    }
    $pros = implode('', array_map(static fn($text) => '<li>' . h($text) . '</li>', $data['pros']));
    $cons = implode('', array_map(static fn($text) => '<li>' . h($text) . '</li>', $data['cons']));
    $base = h((string)$certificate['isin']);
    $underlyings = h(implode(', ', $certificate['underlyings']));
    $shareText = rawurlencode($certificate['name'] . "\nRendimento potenziale annuo " . number_format((float)$certificate['annualYield'], 2, ',', '') . '% · barriera capitale ' . $certificate['barrierCapital']);
    $pageUrl = 'https://pertefinanza.it/recensioni/recensione-' . rawurlencode($certificate['isin']) . '.html#review-overview';
    $encodedUrl = rawurlencode($pageUrl);
    ob_start();
    ?>
    <div class="review-toolbar">
      <div class="review-toolbar-group"><select id="review-isin-picker" class="form-control review-isin-picker" aria-label="Cambia Certificato"><?= $options ?></select></div>
      <a href="../certificati.html" class="btn btn-sm btn-secondary">← Torna al Catalogo</a>
    </div>
    <div class="review-sticky-header"><div class="review-isin-row">
      <button type="button" class="review-isin-copy" data-copy-isin="<?= $base ?>" title="Copia ISIN"><span class="cert-isin-copy-label">ISIN</span><span><?= $base ?></span></button>
      <nav class="review-section-links" aria-label="Sezioni della scheda tecnica"><a href="#review-overview">Riepilogo<br>certificato</a><a href="#review-scenarios">Matrice<br>scenari</a><a href="#review-pros-cons">Punti di forza<br>e criticità</a></nav>
      <details class="content-share"><summary class="share-button share-trigger" title="Condividi: <?= $name ?>" aria-label="Condividi: <?= $name ?>">Condividi</summary><div class="share-menu-options"><a class="share-menu-item share-whatsapp" href="https://wa.me/?text=<?= $shareText ?>%20<?= $encodedUrl ?>" target="_blank" rel="noopener noreferrer">WhatsApp</a><a class="share-menu-item share-telegram" href="https://t.me/share/url?url=<?= $encodedUrl ?>&amp;text=<?= $shareText ?>" target="_blank" rel="noopener noreferrer">Telegram</a><button type="button" class="share-menu-item share-copy" data-copy-share-url="<?= h($pageUrl) ?>">Copia link</button></div></details>
    </div></div>
    <div class="review-hero">
      <h1 class="review-title">Analisi del certificato <?= $name ?></h1>
      <p class="review-title-isin">ISIN: <strong><?= $base ?></strong></p>
      <div class="review-summary-text"><?= $summary ?></div>
      <div class="review-overview" id="review-overview"><div class="review-overview-heading"><h2>Riepilogo certificato</h2></div><div class="review-overview-grid">
        <div class="meta-box review-overview-item review-overview-item-wide"><span class="meta-box-label">Emittente e rating</span><span class="meta-box-value meta-box-value-small review-issuer-value"><?= $issuer ?></span><small class="meta-box-detail"><?= h($data['ratings']) ?></small></div>
        <div class="meta-box review-overview-item review-overview-item-wide"><span class="meta-box-label">Basket</span><span class="meta-box-value meta-box-value-small review-underlyings-value"><?= $underlyings ?></span></div>
        <div class="meta-box review-overview-item review-overview-highlight"><span class="meta-box-label">Rend. pot. annuo</span><span class="meta-box-value"><?= $yield ?>%</span></div>
        <div class="meta-box review-overview-item review-overview-highlight"><span class="meta-box-label">Rend. pot. mensile</span><span class="meta-box-value review-monthly-yield-value"><?= $monthly ?>%</span></div>
        <div class="meta-box review-overview-item"><span class="meta-box-label">Barriera capitale</span><span class="meta-box-value review-capital-barrier-value"><?= h((string)$certificate['barrierCapital']) ?> · Europea</span><small class="meta-box-detail">Osservazione a scadenza</small></div>
        <div class="meta-box review-overview-item"><span class="meta-box-label">Barriera coupon</span><span class="meta-box-value"><?= h((string)$certificate['barrierCoupon']) ?></span><small class="meta-box-detail">Effetto memoria: presente</small></div>
        <div class="meta-box review-overview-item"><span class="meta-box-label">Rischio cambio</span><span class="meta-box-value">Assente</span><small class="meta-box-detail">Struttura Quanto</small></div>
        <div class="meta-box review-overview-item"><span class="meta-box-label">Step-down</span><span class="meta-box-value meta-box-value-small"><?= h((string)$certificate['stepDown']) ?><?= $stepMonth ?></span></div>
        <div class="meta-box review-overview-item"><span class="meta-box-label">Emissione</span><span class="meta-box-value meta-box-value-small review-date-value"><?= h((string)$certificate['strikeDate']) ?></span></div>
        <div class="meta-box review-overview-item"><span class="meta-box-label">Scadenza</span><span class="meta-box-value meta-box-value-small review-date-value"><?= h((string)$certificate['expiryDate']) ?></span></div>
      </div></div>
      <div class="card scenario-card review-scenarios-card" id="review-scenarios"><div class="scenario-card-heading"><h2>Matrice Scenari di Rimborso a Scadenza</h2></div><p class="scenario-description"><?= $scenarioDescription ?></p><div class="table-responsive scenario-table-wrap"><table class="scenario-table"><thead><tr><th>Scenario di Mercato</th><th>Stato Sottostanti</th><th>Cedole Spettanti</th><th>Rimborso Capitale</th><th>Esito Finanziario</th></tr></thead><tbody><?= $scenarioRows ?></tbody></table></div></div>
      <div class="pros-cons-grid" id="review-pros-cons"><div class="pros-box"><h3 class="pros-title">Punti di Forza</h3><ul><?= $pros ?></ul></div><div class="cons-box"><h3 class="cons-title">Criticità e Rischi</h3><ul><?= $cons ?></ul></div></div>
      <div class="review-disclaimer"><p><strong>Avvertenza importante:</strong> le informazioni riportate hanno finalità esclusivamente informative e non costituiscono consulenza finanziaria, raccomandazione personalizzata o invito all’investimento. I certificati sono strumenti complessi e comportano rischi, inclusa la possibile perdita del capitale e il rischio emittente. Prima di assumere qualsiasi decisione, leggi il KID e la documentazione ufficiale del prodotto e valuta attentamente la tua situazione finanziaria.</p><a href="../disclaimer.html" class="btn btn-secondary btn-sm">Disclaimer e Note Legali</a></div>
    </div>
    <?php
    return (string)ob_get_clean();
}

function replaceMeta(string $html, string $attribute, string $name, string $value): string
{
    $pattern = '/(<meta\s+' . preg_quote($attribute, '/') . '=["\']' . preg_quote($name, '/') . '["\']\s+content=["\'])[^"\']*(["\'][^>]*>)/i';
    $updated = preg_replace_callback($pattern, static fn($m) => $m[1] . h($value) . $m[2], $html, 1, $count);
    if ($count !== 1) throw new RuntimeException('Meta tag non trovato: ' . $name);
    return (string)$updated;
}

function buildReviewPage(string $template, array $certificate, string $markup): string
{
    $isin = (string)$certificate['isin'];
    $title = (string)$certificate['name'] . ' (' . $isin . ') | PERTEFINANZA';
    $description = 'Analisi del certificato ' . $certificate['name'] . ' (ISIN ' . $isin . '), emesso da ' . $certificate['issuer'] . ': struttura, scenari, barriere e rischi.';
    if (!preg_match('/<meta\s+property=["\']og:url["\']\s+content=["\']([^"\']+)["\']/i', $template, $original)) {
        throw new RuntimeException('URL Open Graph non trovato nel template recensione.');
    }
    $canonical = rtrim($GLOBALS['adminSiteUrl'], '/') . '/recensioni/recensione-' . rawurlencode($isin) . '.html';
    $pattern = '/(<main\b[^>]*\bid=["\']review-content-area["\'][^>]*>)[\s\S]*?(<\/main>)/i';
    $html = preg_replace_callback($pattern, static function ($match) use ($isin, $markup) {
        $opening = preg_replace('/\sdata-review-isin=["\'][^"\']*["\']/', '', $match[1]);
        $opening = preg_replace('/>$/', ' data-review-isin="' . h($isin) . '">', (string)$opening);
        return $opening . "\n" . $markup . "\n" . $match[2];
    }, $template, 1, $count);
    if ($count !== 1) throw new RuntimeException('Contenitore recensione non trovato nel template.');
    $html = preg_replace('/<title>[\s\S]*?<\/title>/i', '<title>' . h($title) . '</title>', (string)$html, 1);
    $html = replaceMeta((string)$html, 'name', 'description', $description);
    $html = replaceMeta((string)$html, 'property', 'og:title', $title);
    $html = replaceMeta((string)$html, 'property', 'og:description', $description);
    $html = replaceMeta((string)$html, 'property', 'og:url', $canonical);
    $html = replaceMeta((string)$html, 'name', 'twitter:title', $title);
    $html = replaceMeta((string)$html, 'name', 'twitter:description', $description);
    $canonicalTag = '<link rel="canonical" href="' . h($canonical) . '">';
    $html = preg_replace('/<link\s+rel=["\']canonical["\'][^>]*>/i', $canonicalTag, (string)$html, 1, $canonicalCount);
    if ($canonicalCount !== 1) throw new RuntimeException('Canonical non trovato nel template.');
    $html = preg_replace('/css\/style\.css\?v=[^"\']+/', 'css/style.css?v=20261009-5', (string)$html);
    $html = preg_replace('/js\/app\.js\?v=[^"\']+/', 'js/app.js?v=20261009-3', (string)$html);
    $html = preg_replace('/^\s*<script\s+src=["\']js\/(?:data-certificates|data-issuers|data-underlyings|reviews)\.js(?:\?[^"\']*)?["\']><\/script>\s*$/im', '', (string)$html);
    return (string)preg_replace_callback('/\b(href|src)=(["\'])(.*?)\2/i', static function ($match) {
        $value = $match[3];
        if ($value === '' || preg_match('/^(?:[a-z][a-z\d+.-]*:|\/\/|\/|#|\?|\.\.\/)/i', $value)) return $match[0];
        return $match[1] . '=' . $match[2] . '../' . $value . $match[2];
    }, (string)$html);
}

function renderHomeCards(array $certificates): string
{
    $visible = array_values(array_filter($certificates, static fn($certificate) => !empty($certificate['showHome'])));
    usort($visible, static fn($a, $b) => (!empty($b['showTopPick']) <=> !empty($a['showTopPick'])));
    $issuerProfiles = loadIssuerProfiles();
    $html = '';
    foreach ($visible as $certificate) {
        $href = 'recensioni/recensione-' . rawurlencode((string)$certificate['isin']) . '.html';
        $profile = findIssuerProfile((string)$certificate['issuer'], $issuerProfiles);
        $issuer = h((string)$certificate['issuer']);
        $issuerSlug = function_exists('iconv')
            ? (iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', (string)$certificate['issuer']) ?: (string)$certificate['issuer'])
            : (string)$certificate['issuer'];
        $anchor = strtolower((string)preg_replace('/[^a-z0-9]+/i', '-', $issuerSlug));
        $anchor = trim($anchor, '-');
        if (!empty($profile['id'])) $anchor = (string)$profile['id'];
        $preview = 'Il presente certificato di investimento è emesso da <strong><a href="emittenti.html#' . h($anchor) . '">' . $issuer . '</a></strong>, ' . h(rtrim(issuerDescriptionStart((string)$certificate['issuer'], $profile), '.!?'));
        $ratings = issuerRatings($profile);
        if (count($ratings) === 1) {
            $agency = (string)array_key_first($ratings);
            $preview .= '. ' . h($agency . " assegna all’emittente un rating di credito pari ad " . reset($ratings) . '.');
        } elseif (count($ratings) > 1) {
            $ratingParts = [];
            foreach ($ratings as $agency => $rating) $ratingParts[] = (string)$rating . ' da parte di ' . $agency;
            $last = array_pop($ratingParts);
            $ratingSummary = $ratingParts === [] ? $last : implode(', ', $ratingParts) . ' e ' . $last;
            $preview .= '. Le agenzie assegnano all’emittente i seguenti rating di credito: ' . h($ratingSummary) . '.';
        }
        $preview .= '. La struttura investe su:<span class="certificate-preview-underlyings" aria-label="Sottostanti">';
        foreach ($certificate['underlyings'] as $index => $underlying) {
            if ($index > 0) $preview .= ' <span class="certificate-preview-separator" aria-hidden="true">·</span> ';
            $preview .= '<span class="certificate-preview-underlying"><strong>' . h((string)$underlying) . '</strong></span>';
        }
        $monthly = number_format((float)$certificate['annualYield'] / 12, 2, '.', '');
        $preview .= '</span> e prevede un rendimento potenziale mensile del <strong>' . $monthly . '%</strong> (con effetto memoria), con scadenza il ' . h((string)$certificate['expiryDate']) . '. La barriera capitale è posta al <strong>' . h((string)$certificate['barrierCapital']) . '</strong> (europea, con valutazione a scadenza).';
        $placeholder = $certificate['type'] === 'Phoenix Memory Step Down' ? ' home-certificate-type-placeholder' : '';
        $annual = number_format((float)$certificate['annualYield'], 2, '.', '');
        $html .= '<article class="card card-hover home-certificate-card"><div class="home-certificate-head"><div><span class="badge badge-primary' . $placeholder . '">' . h((string)$certificate['type']) . '</span><h3>' . h((string)$certificate['name']) . '</h3><div class="home-certificate-isin"><button type="button" class="cert-isin-copy" data-copy-isin="' . h((string)$certificate['isin']) . '" title="Copia ISIN">ISIN: <strong>' . h((string)$certificate['isin']) . '</strong></button><a href="' . h($href) . '" class="btn btn-sm btn-primary home-certificate-tech-button">SCHEDA TECNICA →</a></div><div class="home-certificate-summary"><div class="certificate-preview">' . $preview . '</div></div></div><div class="home-certificate-metrics"><div class="home-certificate-metric"><span>REND. POT. ANNUO</span><strong>' . $annual . '%</strong></div><div class="home-certificate-metric home-certificate-stepdown"><span>Step-down</span><strong>' . h((string)$certificate['stepDown']) . '</strong></div><div class="home-certificate-metric home-certificate-barrier"><span>Barriera capitale</span><strong>' . h((string)$certificate['barrierCapital']) . '</strong></div><div class="home-certificate-metric home-certificate-barrier"><span>Barriera coupon</span><strong>' . h((string)$certificate['barrierCoupon']) . '</strong></div><div class="home-certificate-metric home-certificate-date"><span>Emissione</span><strong>' . h((string)$certificate['strikeDate']) . '</strong></div><div class="home-certificate-metric home-certificate-date"><span>Scadenza</span><strong>' . h((string)$certificate['expiryDate']) . '</strong></div></div></div></article>';
    }
    return $html;
}

function loadPublishedCertificates(): array
{
    $certificates = sourceArray('js/data-certificates.js', 'CERTIFICATES_DATA');
    if (!array_is_list($certificates)) {
        throw new RuntimeException('I dati pubblicati devono essere una lista di certificati.');
    }
    return array_map(static fn($certificate) => normalizeCertificateInput($certificate, $certificate), $certificates);
}

function certificatesAreEqual(array $first, array $second): bool
{
    return json_encode(
        normalizeCertificateInput($first, $first),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
    ) === json_encode(
        normalizeCertificateInput($second, $second),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
    );
}

function reviewOverridesAreEqual(array $first, array $second): bool
{
    return json_encode(
        normalizeReviewOverride($first),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
    ) === json_encode(
        normalizeReviewOverride($second),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
    );
}

function countPendingCertificateChanges(array $drafts, array $published, array $overrides, array $publishedOverrides): int
{
    $draftByIsin = [];
    $publishedByIsin = [];
    $pendingIsins = [];
    foreach ($drafts as $certificate) {
        $draftByIsin[(string)$certificate['isin']] = $certificate;
    }
    foreach ($published as $certificate) {
        $publishedByIsin[(string)$certificate['isin']] = $certificate;
    }
    foreach ($draftByIsin as $isin => $certificate) {
        if (!isset($publishedByIsin[$isin]) || !certificatesAreEqual($certificate, $publishedByIsin[$isin])) {
            $pendingIsins[$isin] = true;
        }
    }
    foreach ($publishedByIsin as $isin => $_certificate) {
        if (!isset($draftByIsin[$isin])) {
            $pendingIsins[$isin] = true;
        }
    }
    foreach (array_unique(array_merge(array_keys($overrides), array_keys($publishedOverrides))) as $isin) {
        if (!reviewOverridesAreEqual($overrides[$isin] ?? [], $publishedOverrides[$isin] ?? [])) {
            $pendingIsins[(string)$isin] = true;
        }
    }
    return count($pendingIsins);
}

function updateReviewPicker(string $html, array $certificates, string $selectedIsin): string
{
    $options = '';
    foreach ($certificates as $certificate) {
        $options .= '<option value="' . h((string)$certificate['isin']) . '"' . ($certificate['isin'] === $selectedIsin ? ' selected' : '') . '>' . h((string)$certificate['isin'] . ' - ' . (string)$certificate['name']) . '</option>';
    }
    $pattern = '/(<select\b[^>]*\bid=["\']review-isin-picker["\'][^>]*>)[\s\S]*?(<\/select>)/i';
    return (string)preg_replace_callback($pattern, static fn($match) => $match[1] . $options . $match[2], $html, 1);
}

function publishSite(?string $onlyIsin = null): array
{
    $config = adminConfig();
    $GLOBALS['adminSiteUrl'] = (string)$config['site_url'];
    $draftCertificates = loadCertificates();
    $draftOverrides = loadReviewOverrides();
    $previousPublishedOverrides = loadPublishedReviewOverrides();
    $publishedCertificates = loadPublishedCertificates();
    $publishedOverrides = [];
    foreach ($previousPublishedOverrides as $isin => $override) {
        if (!is_array($override)) throw new RuntimeException('Archivio dei testi editoriali pubblicati non valido.');
        $publishedOverrides[strtoupper((string)$isin)] = normalizeReviewOverride($override);
    }
    $normalizedDrafts = [];
    $draftByIsin = [];
    foreach ($draftCertificates as $certificate) {
        if (!is_array($certificate)) throw new RuntimeException('Archivio certificati non valido.');
        $normalized = normalizeCertificateInput($certificate, $certificate);
        if (isset($draftByIsin[$normalized['isin']])) throw new RuntimeException('ISIN duplicato: ' . $normalized['isin']);
        $draftByIsin[$normalized['isin']] = $normalized;
        $normalizedDrafts[] = $normalized;
    }
    $publishedByIsin = [];
    foreach ($publishedCertificates as $index => $certificate) {
        if (isset($publishedByIsin[$certificate['isin']])) throw new RuntimeException('ISIN duplicato nei dati pubblicati: ' . $certificate['isin']);
        $publishedByIsin[$certificate['isin']] = $index;
    }

    if ($onlyIsin !== null) {
        $onlyIsin = strtoupper(trim($onlyIsin));
        if (!validIsin($onlyIsin)) throw new InvalidArgumentException('ISIN non valido per la pubblicazione.');
        $draftCertificate = $draftByIsin[$onlyIsin] ?? null;
        $publishedIndex = $publishedByIsin[$onlyIsin] ?? null;
        if ($draftCertificate === null && $publishedIndex === null) {
            throw new InvalidArgumentException('Il certificato non è presente né nelle bozze né tra quelli pubblicati.');
        }
        if ($draftCertificate === null) {
            unset($publishedCertificates[$publishedIndex]);
            $publishedCertificates = array_values($publishedCertificates);
            unset($publishedOverrides[$onlyIsin]);
        } else {
            if ($publishedIndex === null) {
                $publishedCertificates[] = $draftCertificate;
            } else {
                $publishedCertificates[$publishedIndex] = $draftCertificate;
            }
            $override = $draftOverrides[$onlyIsin] ?? [];
            if (is_array($override)) {
                $normalizedOverride = normalizeReviewOverride($override);
                if (reviewOverrideHasContent($normalizedOverride)) {
                    $publishedOverrides[$onlyIsin] = $normalizedOverride;
                } else {
                    unset($publishedOverrides[$onlyIsin]);
                }
            } else {
                throw new RuntimeException('Modifica editoriale non valida per ' . $onlyIsin . '.');
            }
        }
    } else {
        $publishedCertificates = $normalizedDrafts;
        $publishedOverrides = [];
        foreach ($publishedCertificates as $certificate) {
            $isin = $certificate['isin'];
            if (isset($draftOverrides[$isin])) {
                if (!is_array($draftOverrides[$isin])) throw new RuntimeException('Modifica editoriale non valida per ' . $isin . '.');
                $override = normalizeReviewOverride($draftOverrides[$isin]);
                if (reviewOverrideHasContent($override)) $publishedOverrides[$isin] = $override;
            }
        }
    }

    $issuerProfiles = loadIssuerProfiles();
    $underlyingProfiles = loadUnderlyingProfiles();
    $template = readProjectFile('recensione.html');
    $files = [];
    $existingPages = glob(projectPath('recensioni/recensione-*.html')) ?: [];
    $wanted = [];
    foreach ($publishedCertificates as $certificate) {
        $isin = $certificate['isin'];
        if (isset($wanted[$isin])) throw new RuntimeException('ISIN duplicato: ' . $isin);
        $wanted[$isin] = true;
        $markup = renderReviewContent($certificate, $publishedCertificates, $issuerProfiles, $underlyingProfiles, $publishedOverrides);
        $files['recensioni/recensione-' . $isin . '.html'] = buildReviewPage($template, $certificate, $markup);
    }
    $dataJson = json_encode($publishedCertificates, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $files['js/data-certificates.js'] = "// Dataset locale dei certificati, caricato prima di app.js nelle pagine che lo usano.\n\nconst CERTIFICATES_DATA = " . $dataJson . ";\n";
    $isins = array_keys($wanted);
    sort($isins, SORT_STRING);
    $manifest = 'window.STATIC_REVIEW_ISINS = Object.freeze(' . json_encode($isins, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . ");\n";
    $files['js/data-review-pages.js'] = $manifest;
    $manifestVersion = substr(hash('sha256', $manifest), 0, 12);
    $siteRoot = dirname(__DIR__);
    $htmlPaths = array_merge(glob($siteRoot . DIRECTORY_SEPARATOR . '*.html') ?: [], array_values(array_filter($existingPages, static fn($path) => is_file($path))));
    foreach (array_keys($files) as $relative) {
        if (str_starts_with($relative, 'recensioni/') && str_ends_with(strtolower($relative), '.html')) {
            $htmlPaths[] = projectPath($relative);
        }
    }
    foreach (array_unique($htmlPaths) as $path) {
        $relative = ltrim(str_replace($siteRoot, '', $path), DIRECTORY_SEPARATOR);
        $relative = str_replace(DIRECTORY_SEPARATOR, '/', $relative);
        $content = isset($files[$relative]) ? $files[$relative] : file_get_contents($path);
        if (!is_string($content)) throw new RuntimeException('Impossibile leggere ' . $relative . '.');
        $manifestPath = str_starts_with($relative, 'recensioni/') ? '../js/data-review-pages.js' : 'js/data-review-pages.js';
        $pattern = '/(<script\s+src=["\'])' . preg_quote($manifestPath, '/') . '(?:\?v=[^"\']*)?(["\'][^>]*>\s*<\/script>)/i';
        $updated = preg_replace($pattern, '$1' . $manifestPath . '?v=' . $manifestVersion . '$2', $content, 1, $scriptCount);
        if ($scriptCount !== 1) throw new RuntimeException('Include manifest non trovato in ' . $relative . '.');
        $selectedIsin = preg_match('/^recensioni\/recensione-([A-Z0-9]{12})\.html$/i', $relative, $match)
            ? strtoupper($match[1])
            : '';
        $updated = updateReviewPicker((string)$updated, $publishedCertificates, $selectedIsin);
        $files[$relative] = $updated;
    }
    $index = $files['index.html'] ?? readProjectFile('index.html');
    $indexUpdated = preg_replace_callback('/(<!-- STATIC-HOME-CERTIFICATES:START -->)[\s\S]*?(<!-- STATIC-HOME-CERTIFICATES:END -->)/', static fn($m) => $m[1] . "\n" . renderHomeCards($publishedCertificates) . "\n" . $m[2], $index, 1, $markerCount);
    if ($markerCount !== 1) throw new RuntimeException('Marcatori delle schede statiche non trovati in index.html.');
    $files['index.html'] = (string)$indexUpdated;

    $sitemap = readProjectFile('sitemap.xml');
    $sitemap = preg_replace('/\s*<url>\s*<loc>[^<]*\/recensioni\/recensione-[A-Z0-9]{12}\.html<\/loc>\s*<\/url>/i', '', $sitemap);
    $reviewUrls = '';
    foreach ($isins as $isin) $reviewUrls .= "  <url>\n    <loc>" . rtrim((string)$config['site_url'], '/') . '/recensioni/recensione-' . $isin . ".html</loc>\n  </url>\n";
    $sitemap = preg_replace('/<\/urlset>\s*$/', $reviewUrls . '</urlset>' . PHP_EOL, (string)$sitemap, 1, $sitemapCount);
    if ($sitemapCount !== 1) throw new RuntimeException('Formato sitemap non valido.');
    $files['sitemap.xml'] = (string)$sitemap;

    foreach ($existingPages as $path) {
        $name = basename($path);
        if (preg_match('/^recensione-([A-Z0-9]{12})\.html$/i', $name, $match) && !isset($wanted[strtoupper($match[1])])) {
            $files['recensioni/' . $name] = null;
        }
    }

    $backupDir = storagePath('backups') . DIRECTORY_SEPARATOR . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(3));
    if (!mkdir($backupDir, 0750, true) && !is_dir($backupDir)) throw new RuntimeException('Impossibile creare il backup della pubblicazione.');
    $before = [];
    foreach ($files as $relative => $content) {
        $path = projectPath($relative);
        $before[$relative] = is_file($path) ? file_get_contents($path) : null;
        if ($before[$relative] === false) throw new RuntimeException('Impossibile leggere il file esistente ' . $relative . '.');
        if (is_string($before[$relative])) {
            $backupPath = $backupDir . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relative);
            if (!is_dir(dirname($backupPath)) && !mkdir(dirname($backupPath), 0750, true) && !is_dir(dirname($backupPath))) throw new RuntimeException('Impossibile creare una cartella di backup.');
            if (file_put_contents($backupPath, $before[$relative], LOCK_EX) === false) throw new RuntimeException('Impossibile salvare il backup di ' . $relative . '.');
        }
    }
    $hadPublishedOverrideFile = is_file(storagePath('published-review-overrides.json'));
    $backupOverridePath = $backupDir . DIRECTORY_SEPARATOR . 'published-review-overrides.json';
    if ($hadPublishedOverrideFile) {
        $oldOverrideJson = file_get_contents(storagePath('published-review-overrides.json'));
        if ($oldOverrideJson === false || file_put_contents($backupOverridePath, $oldOverrideJson, LOCK_EX) === false) {
            throw new RuntimeException('Impossibile salvare il backup delle personalizzazioni pubblicate.');
        }
    }
    try {
        foreach ($files as $relative => $content) {
            $path = projectPath($relative);
            if ($content === null) {
                if (is_file($path) && !unlink($path)) throw new RuntimeException('Impossibile rimuovere la recensione ' . $relative . '.');
                continue;
            }
            $directory = dirname($path);
            if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) throw new RuntimeException('Impossibile creare la cartella ' . $relative . '.');
            $temporary = $path . '.' . bin2hex(random_bytes(5)) . '.tmp';
            if (file_put_contents($temporary, $content, LOCK_EX) === false || !rename($temporary, $path)) {
                if (is_file($temporary)) unlink($temporary);
                throw new RuntimeException('Impossibile pubblicare ' . $relative . '.');
            }
        }
        writeJsonAtomic('published-review-overrides.json', (object)$publishedOverrides);
    } catch (Throwable $error) {
        foreach ($before as $relative => $content) {
            $path = projectPath($relative);
            if ($content === null) {
                if (is_file($path)) unlink($path);
            } else {
                $temporary = $path . '.' . bin2hex(random_bytes(5)) . '.restore';
                if (file_put_contents($temporary, $content, LOCK_EX) !== false) rename($temporary, $path);
            }
        }
        if ($hadPublishedOverrideFile) {
            writeJsonAtomic('published-review-overrides.json', $previousPublishedOverrides);
        } elseif (is_file(storagePath('published-review-overrides.json'))) {
            unlink(storagePath('published-review-overrides.json'));
        }
        throw new RuntimeException('Pubblicazione annullata; i file sono stati ripristinati. ' . $error->getMessage(), 0, $error);
    }
    return ['count' => count($publishedCertificates), 'published_isin' => $onlyIsin, 'backup' => $backupDir];
}
