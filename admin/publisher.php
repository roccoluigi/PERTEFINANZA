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
        $previewDescription = '';
        if (preg_match('/\bdata-preview-description=["\']([^"\']+)["\']/i', $cardMatch[1], $previewMatch)) {
            $previewDescription = html_entity_decode($previewMatch[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }
        if ($previewDescription === '') {
            $sentences = preg_split('/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ])/u', $description, 2);
            $previewDescription = $sentences[0] ?? $description;
        }
        $ratings = [];
        preg_match_all('/<div\b[^>]*class=["\'][^"\']*\brating-pill\b[^"\']*["\'][^>]*>([\s\S]*?)<\/div>/i', $card, $pills);
        foreach ($pills[1] as $pill) {
            if (
                preg_match('/<span\b[^>]*class=["\'][^"\']*\brating-agency\b[^"\']*["\'][^>]*>([\s\S]*?)<\/span>/i', $pill, $agencyMatch)
                && preg_match('/<span\b[^>]*class=["\'][^"\']*\brating-val\b[^"\']*["\'][^>]*>([\s\S]*?)<\/span>/i', $pill, $ratingMatch)
            ) {
                $agency = rtrim(plainHtml($agencyMatch[1]), ': ');
                $rating = plainHtml($ratingMatch[1]);
                if ($agency !== '' && $rating !== '' && !preg_match('/^(?:n\.d\.|non rated|not rated|n\/a|[-—])$/iu', $rating)) {
                    $ratings[$agency] = $rating;
                }
            }
        }
        $id = preg_match('/\bid=["\']([^"\']+)["\']/i', $cardMatch[1], $idMatch) ? $idMatch[1] : '';
        $issuers[$name] = [
            'id' => $id,
            'description' => $description,
            'previewDescription' => $previewDescription,
            'ratings' => $ratings,
        ];
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
    $description = $profile['previewDescription'] ?? $profile['description'] ?? "L'emittente {$issuer} opera nel mercato dei prodotti strutturati.";
    $sentences = preg_split('/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ])/u', $description, 2);
    $description = $sentences[0] ?? $description;
    $description = preg_replace('/^' . preg_quote($issuer, '/') . '\s*/iu', '', $description) ?? $description;
    $description = preg_replace('/^\([^)]*\)\s*/u', '', $description) ?? $description;
    $description = preg_replace('/^,\s*|^è\s+/iu', '', $description) ?? $description;
    $description = preg_replace("/^un['’]\\s*/iu", '', $description) ?? $description;
    $description = trim(preg_replace('/[.!?]+$/u', '', $description) ?? $description);
    return $description === '' ? $description : strtolower(substr($description, 0, 1)) . substr($description, 1);
}

function issuerRatings(?array $profile): array
{
    if (!$profile || !is_array($profile['ratings'] ?? null)) {
        return [];
    }
    return $profile['ratings'];
}

function issuerRatingSentence(?array $profile): string
{
    $ratings = issuerRatings($profile);
    if ($ratings === []) {
        return '';
    }
    $parts = [];
    foreach ($ratings as $agency => $rating) {
        $parts[] = h((string)$agency) . ' <strong>' . h((string)$rating) . '</strong>';
    }
    if (count($parts) === 1) {
        $agency = array_key_first($ratings);
        $rating = reset($ratings);
        return h((string)$agency) . " assegna all'emittente un rating <strong>" . h((string)$rating) . '</strong>.';
    }
    $last = array_pop($parts);
    return 'I rating assegnati dalle maggiori agenzie sono: ' . implode(', ', $parts) . ' e ' . $last . '.';
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
        ? 'non disponibile tra le fonti consultate'
        : implode(' · ', array_map(static fn($agency, $rating) => $agency . ': ' . $rating, $ratingNames, $ratingValues));
    $ratingSentence = issuerRatingSentence($issuerProfile);
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
        'Il certificato in oggetto è emesso da <strong>' . h((string)$certificate['issuer']) . '</strong>, ' . h(issuerDescriptionStart((string)$certificate['issuer'], $issuerProfile)) . '.' . ($ratingSentence !== '' ? ' ' . $ratingSentence : ''),
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
    if ($capital <= 50) $pros[] = "Barriera capitale al {$certificate['barrierCapital']}: protezione a scadenza fino a un ribasso del " . (100 - $capital) . '% per ogni sottostante.';
    else $cons[] = "Barriera capitale al {$certificate['barrierCapital']}: offre un buffer condizionato del " . (100 - $capital) . '%, ma non è particolarmente difensiva e non limita la perdita in caso di violazione a scadenza.';
    $cons[] = 'Rischio di perdita del capitale: se alla data finale il Worst-of è sotto la barriera capitale, il rimborso può ridursi in funzione della sua performance, secondo i termini del prodotto.';
    if ($coupon <= 50) $pros[] = "Barriera coupon al {$certificate['barrierCoupon']}: la soglia consente il pagamento della cedola anche con il Worst-of in ribasso, se resta sopra barriera alle date di osservazione.";
    if ($monthly >= 1) $pros[] = 'Cedola potenziale mensile lorda del ' . number_format($monthly, 2, '.', '') . '%, pari al ' . number_format($annual, 2, '.', '') . '% annuo lordo, subordinata alle condizioni del prodotto.';
    else $cons[] = 'Cedola potenziale mensile lorda contenuta (' . number_format($monthly, 2, '.', '') . '%); il pagamento resta subordinato alle condizioni del prodotto.';
    $strongRating = null;
    foreach ($ratings as $agency => $rating) {
        if (preg_match('/^A/i', (string)$rating)) {
            $strongRating = [$agency, $rating];
            break;
        }
    }
    if ($strongRating !== null) {
        [$strongAgency, $strongRatingValue] = $strongRating;
        $ratingBand = preg_match('/^Aa/i', (string)$strongRatingValue) ? 'Aa' : 'A';
        $pros[] = 'Rating elevato dell’emittente: ' . $strongAgency . ' ' . $strongRatingValue . ' (fascia ' . $ratingBand . ').';
    } else {
        $cons[] = "Rating dell’emittente: {$ratingText}; verifica gli aggiornamenti più recenti e considera il rischio di credito.";
    }
    if ($step > 0) {
        $pros[] = "Step-down di {$stepLabel} {$stepUnit} per osservazione: può aumentare la probabilità di rimborso anticipato e contribuire a sostenere il prezzo del prodotto.";
    }
    $pros[] = 'Effetto memoria: le cedole non pagate possono essere recuperate se, a una successiva data di osservazione, il Worst-of raggiunge nuovamente la barriera coupon.';
    $pros[] = 'Struttura Quanto: protegge dall’effetto diretto del cambio sia il capitale sia le cedole.';
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
        'paragraphFontSize' => $override['paragraphFontSize'],
        'paragraphLineHeight' => $override['paragraphLineHeight'],
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

function reviewSlugForCertificate(array $certificate): string
{
    $issuer = (string)$certificate['issuer'];
    $asciiIssuer = function_exists('iconv')
        ? (iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $issuer) ?: $issuer)
        : $issuer;
    $issuerSlug = strtolower(trim((string)preg_replace('/[^a-z0-9]+/i', '-', $asciiIssuer), '-'));
    if ($issuerSlug === '') $issuerSlug = 'emittente';
    return $issuerSlug . '-cash-collect-' . rawurlencode((string)$certificate['isin']);
}

function defaultReviewUrl(array $certificate, string $siteUrl): string
{
    return rtrim($siteUrl, '/') . '/recensioni/' . reviewSlugForCertificate($certificate) . '.html';
}

function reviewUrlMatchesSite(string $reviewUrl, string $siteUrl): bool
{
    $reviewParts = parse_url($reviewUrl);
    $siteParts = parse_url($siteUrl);
    if (!is_array($reviewParts) || !is_array($siteParts)) return false;
    return strtolower((string)($reviewParts['scheme'] ?? '')) === strtolower((string)($siteParts['scheme'] ?? 'https'))
        && strtolower((string)($reviewParts['host'] ?? '')) === strtolower((string)($siteParts['host'] ?? ''))
        && (int)($reviewParts['port'] ?? 443) === (int)($siteParts['port'] ?? 443);
}

function reviewUrlForCertificate(array $certificate, array $override, string $siteUrl, bool $preserveLegacy = false): string
{
    $customUrl = trim((string)($override['url'] ?? ''));
    if ($customUrl !== '') {
        $normalized = normalizeReviewOverride(['url' => $customUrl])['url'];
        if (!reviewUrlMatchesSite($normalized, $siteUrl)) {
            throw new InvalidArgumentException('L’URL della recensione deve appartenere al dominio configurato per il sito.');
        }
        return $normalized;
    }
    if ($preserveLegacy) {
        return rtrim($siteUrl, '/') . '/recensioni/recensione-' . rawurlencode((string)$certificate['isin']) . '.html';
    }
    return defaultReviewUrl($certificate, $siteUrl);
}

function reviewUrlToRelativePath(string $reviewUrl): string
{
    $path = parse_url($reviewUrl, PHP_URL_PATH);
    if (!is_string($path) || !str_starts_with($path, '/recensioni/')) {
        throw new InvalidArgumentException('Il percorso URL della recensione non è valido.');
    }
    $relative = 'recensioni/' . ltrim(substr($path, strlen('/recensioni/')), '/');
    if (preg_match('/^recensioni\/[a-z0-9-]+\/$/i', $relative)) return $relative . 'index.html';
    if (!preg_match('/^recensioni\/[a-z0-9-]+\.html$/i', $relative)) {
        throw new InvalidArgumentException('Il percorso URL della recensione non è valido.');
    }
    return $relative;
}

function reviewAssetPrefix(string $relativePath): string
{
    return str_repeat('../', substr_count(trim(str_replace('\\', '/', dirname($relativePath)), '/'), '/') + 1);
}

function reviewEditorialFormValues(array $certificate, array $override = [], string $siteUrl = '', bool $isPublished = false): array
{
    $reviewUrl = reviewUrlForCertificate($certificate, $override, $siteUrl, $isPublished && empty($override['url']));
    $storedUrl = trim((string)($override['url'] ?? ''));
    $storedUrlParts = parse_url($storedUrl);
    if (
        $storedUrl !== ''
        && is_array($storedUrlParts)
        && reviewUrlMatchesSite($storedUrl, $siteUrl)
        && strtolower((string)($storedUrlParts['path'] ?? '')) === strtolower('/recensioni/' . reviewSlugForCertificate($certificate) . '/')
    ) {
        $reviewUrl = defaultReviewUrl($certificate, $siteUrl);
    }
    $issuerProfiles = loadIssuerProfiles();
    $underlyingProfiles = loadUnderlyingProfiles();
    $issuerProfile = findIssuerProfile((string)$certificate['issuer'], $issuerProfiles);
    $data = generateReviewData($certificate, $issuerProfile, $underlyingProfiles, $override);
    $paragraphHtml = implode('', array_map('reviewMarkupToEditorHtml', $data['paragraphs']));
    if ($data['paragraphFontSize'] !== null && $data['paragraphLineHeight'] !== null) {
        $paragraphHtml = '<div class="cms-rich-format" style="font-size: ' . h($data['paragraphFontSize']) . 'px; line-height: ' . h($data['paragraphLineHeight']) . '">' . $paragraphHtml . '</div>';
    }
    return [
        'url' => $reviewUrl,
        'paragraphs' => $paragraphHtml,
        'scenarioDescription' => $data['scenarioDescription'],
        'scenarios' => $data['scenarios'],
        'pros' => $data['pros'],
        'cons' => $data['cons'],
    ];
}

function renderReviewContent(array $certificate, array $certificates, array $issuerProfiles, array $underlyingProfiles, array $overrides, string $reviewDisclaimer, string $reviewUrl): string
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
    if ($data['paragraphFontSize'] !== null && $data['paragraphLineHeight'] !== null) {
        $summary = '<div class="review-summary-format" style="font-size: ' . h($data['paragraphFontSize']) . 'px; line-height: ' . h($data['paragraphLineHeight']) . '">' . $summary . '</div>';
    }
    $scenarioRows = '';
    foreach ($data['scenarios'] as $index => $scenario) {
        $scenarioRows .= '<tr class="scenario-row scenario-row-' . ($index + 1) . '"><td data-label="Scenario"><strong>' . formatEditorialParagraph($scenario[0]) . '</strong></td><td data-label="Sottostanti">' . formatEditorialParagraph($scenario[1]) . '</td><td data-label="Cedole">' . formatEditorialParagraph($scenario[2]) . '</td><td data-label="Rimborso capitale">' . formatEditorialParagraph($scenario[3]) . '</td><td data-label="Esito finanziario"><strong class="scenario-result">' . formatEditorialParagraph($scenario[4]) . '</strong></td></tr>';
    }
    $pros = implode('', array_map(static fn($text) => '<li>' . h($text) . '</li>', $data['pros']));
    $cons = implode('', array_map(static fn($text) => '<li>' . h($text) . '</li>', $data['cons']));
    $base = h((string)$certificate['isin']);
    $underlyings = h(implode(', ', $certificate['underlyings']));
    $shareText = rawurlencode($certificate['name'] . "\nRendimento potenziale annuo " . number_format((float)$certificate['annualYield'], 2, ',', '') . '% · barriera capitale ' . $certificate['barrierCapital']);
    $pageUrl = $reviewUrl . '#review-start';
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
      <details class="content-share"><summary class="share-button share-trigger" title="Condividi: <?= $name ?>" aria-label="Condividi: <?= $name ?>"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"></path></svg></summary><div class="share-menu-options"><a class="share-menu-item share-whatsapp" href="https://wa.me/?text=<?= $shareText ?>%20<?= $encodedUrl ?>" target="_blank" rel="noopener noreferrer">WhatsApp</a><a class="share-menu-item share-telegram" href="https://t.me/share/url?url=<?= $encodedUrl ?>&amp;text=<?= $shareText ?>" target="_blank" rel="noopener noreferrer">Telegram</a><button type="button" class="share-menu-item share-copy" data-copy-share-url="<?= h($pageUrl) ?>">Copia link</button></div></details>
    </div></div>
    <div class="review-hero" id="review-start">
      <h1 class="review-title">Analisi del certificato <?= $name ?></h1>
      <div class="review-title-meta">
        <p class="review-title-isin">ISIN: <strong><?= $base ?></strong></p>
        <?php if (!empty($certificate['belowPar'])): ?><span class="badge badge-below-par">Sotto la pari</span><?php endif; ?>
      </div>
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
      <div class="review-disclaimer"><?= $reviewDisclaimer ?><a href="../disclaimer.html" class="btn btn-secondary btn-sm">Disclaimer e Note Legali</a></div>
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

function buildReviewPage(string $template, array $certificate, string $markup, string $canonical, string $relativePath): string
{
    $isin = (string)$certificate['isin'];
    $title = (string)$certificate['name'] . ' (' . $isin . ') | PERTEFINANZA';
    $description = 'Analisi del certificato ' . $certificate['name'] . ' (ISIN ' . $isin . '), emesso da ' . $certificate['issuer'] . ': struttura, scenari, barriere e rischi.';
    if (!preg_match('/<meta\s+property=["\']og:url["\']\s+content=["\']([^"\']+)["\']/i', $template, $original)) {
        throw new RuntimeException('URL Open Graph non trovato nel template recensione.');
    }
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
    $html = preg_replace('/css\/style\.css\?v=[^"\']+/', 'css/style.css?v=20261021-2', (string)$html);
    $html = preg_replace('/js\/app\.js\?v=[^"\']+/', 'js/app.js?v=20261028-multi-agency-ratings', (string)$html);
    $html = preg_replace('/^\s*<script\s+src=["\']js\/(?:data-underlyings|reviews)\.js(?:\?[^"\']*)?["\']><\/script>\s*$/im', '', (string)$html);
    $assetPrefix = reviewAssetPrefix($relativePath);
    return (string)preg_replace_callback('/\b(href|src)=(["\'])(.*?)\2/i', static function ($match) use ($assetPrefix) {
        $value = $match[3];
        if ($value === '' || preg_match('/^(?:[a-z][a-z\d+.-]*:|\/\/|\/|#|\?)/i', $value)) return $match[0];
        if (str_starts_with($value, '../')) $value = substr($value, 3);
        return $match[1] . '=' . $match[2] . $assetPrefix . $value . $match[2];
    }, (string)$html);
}

function renderHomeCards(array $certificates, array $reviewPaths): string
{
    $visible = array_values(array_filter($certificates, static fn($certificate) => !empty($certificate['showHome'])));
    usort($visible, static function ($a, $b): int {
        $belowParPriority = !empty($b['belowPar']) <=> !empty($a['belowPar']);
        return $belowParPriority !== 0
            ? $belowParPriority
            : (!empty($b['showTopPick']) <=> !empty($a['showTopPick']));
    });
    $issuerProfiles = loadIssuerProfiles();
    $html = '';
    foreach ($visible as $certificate) {
        $href = 'recensioni/' . ($reviewPaths[(string)$certificate['isin']] ?? ('recensione-' . rawurlencode((string)$certificate['isin']) . '.html'));
        $profile = findIssuerProfile((string)$certificate['issuer'], $issuerProfiles);
        $issuer = h((string)$certificate['issuer']);
        $issuerSlug = function_exists('iconv')
            ? (iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', (string)$certificate['issuer']) ?: (string)$certificate['issuer'])
            : (string)$certificate['issuer'];
        $anchor = strtolower((string)preg_replace('/[^a-z0-9]+/i', '-', $issuerSlug));
        $anchor = trim($anchor, '-');
        if (!empty($profile['id'])) $anchor = (string)$profile['id'];
        $preview = 'Il certificato in oggetto è emesso da <strong><a href="emittenti.html#' . h($anchor) . '">' . $issuer . '</a></strong>, ' . h(issuerDescriptionStart((string)$certificate['issuer'], $profile)) . '.';
        $ratingSentence = issuerRatingSentence($profile);
        if ($ratingSentence !== '') $preview .= ' ' . $ratingSentence;
        $preview .= ' La struttura investe su:<span class="certificate-preview-underlyings" aria-label="Sottostanti">';
        foreach ($certificate['underlyings'] as $index => $underlying) {
            if ($index > 0) $preview .= ' <span class="certificate-preview-separator" aria-hidden="true">·</span> ';
            $preview .= '<span class="certificate-preview-underlying"><strong>' . h((string)$underlying) . '</strong></span>';
        }
        $monthly = number_format((float)$certificate['annualYield'] / 12, 2, '.', '');
        $preview .= '</span> e prevede un rendimento potenziale mensile del <strong>' . $monthly . '%</strong> (con effetto memoria), con scadenza il ' . h((string)$certificate['expiryDate']) . '. La barriera capitale è posta al <strong>' . h((string)$certificate['barrierCapital']) . '</strong> (europea, con valutazione a scadenza).';
        $placeholder = $certificate['type'] === 'Phoenix Memory Step Down' ? ' home-certificate-type-placeholder' : '';
        $belowParBadge = !empty($certificate['belowPar']) ? '<span class="badge badge-below-par home-certificate-below-par">Sotto la pari</span>' : '';
        $annual = number_format((float)$certificate['annualYield'], 2, '.', '');
        $html .= '<article class="card card-hover home-certificate-card"><div class="home-certificate-head"><div><span class="badge badge-primary' . $placeholder . '">' . h((string)$certificate['type']) . '</span><div class="home-certificate-title-row"><h3>' . h((string)$certificate['name']) . '</h3></div><div class="home-certificate-isin"><button type="button" class="cert-isin-copy" data-copy-isin="' . h((string)$certificate['isin']) . '" title="Copia ISIN">ISIN: <strong>' . h((string)$certificate['isin']) . '</strong></button><a href="' . h($href) . '" class="btn btn-sm btn-primary home-certificate-tech-button">SCHEDA TECNICA →</a></div><div class="home-certificate-summary"><div class="certificate-preview">' . $preview . '</div></div></div><div class="home-certificate-metrics">' . $belowParBadge . '<div class="home-certificate-metric"><span>REND. POT. ANNUO</span><strong>' . $annual . '%</strong></div><div class="home-certificate-metric home-certificate-stepdown"><span>Step-down</span><strong>' . h((string)$certificate['stepDown']) . '</strong></div><div class="home-certificate-metric home-certificate-barrier"><span>Barriera capitale</span><strong>' . h((string)$certificate['barrierCapital']) . '</strong></div><div class="home-certificate-metric home-certificate-barrier"><span>Barriera coupon</span><strong>' . h((string)$certificate['barrierCoupon']) . '</strong></div><div class="home-certificate-metric home-certificate-date"><span>Emissione</span><strong>' . h((string)$certificate['strikeDate']) . '</strong></div><div class="home-certificate-metric home-certificate-date"><span>Scadenza</span><strong>' . h((string)$certificate['expiryDate']) . '</strong></div></div></div></article>';
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

function publicSitemapBaseUrl(string $siteUrl): string
{
    $parts = parse_url(trim($siteUrl));
    if (!is_array($parts) || strtolower((string)($parts['scheme'] ?? '')) !== 'https'
        || empty($parts['host']) || isset($parts['user']) || isset($parts['pass'])
        || isset($parts['query']) || isset($parts['fragment'])
        || !in_array($parts['path'] ?? '', ['', '/'], true)
        || (isset($parts['port']) && $parts['port'] !== 443)) {
        throw new RuntimeException('Per rigenerare la sitemap, imposta site_url in config.php su un indirizzo HTTPS pubblico, ad esempio https://www.pertefinanza.it.');
    }

    $host = strtolower(rtrim((string)$parts['host'], '.'));
    $ip = filter_var($host, FILTER_VALIDATE_IP);
    if ($ip !== false) {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            throw new RuntimeException('site_url non può puntare a localhost o a un indirizzo IP privato.');
        }
    } elseif (!str_contains($host, '.') || preg_match('/(?:^|\.)(?:localhost|local|test|invalid|example)$/i', $host)
        || filter_var($host, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) === false) {
        throw new RuntimeException('site_url deve indicare un dominio pubblico valido, non localhost o un host di test.');
    }

    return 'https://' . $host;
}

function buildReviewSitemap(array $reviewUrls, string $siteUrl): string
{
    $sitemap = readProjectFile('sitemap.xml');
    $sitemap = str_replace(["\r\n", "\r"], "\n", $sitemap);
    $sitemap = preg_replace('/\s*<url>\s*<loc>[^<]*\/recensioni\/(?:[a-z0-9-]+\.html|[a-z0-9-]+\/)<\/loc>\s*<\/url>/i', '', $sitemap);
    if (!is_string($sitemap)) throw new RuntimeException('Impossibile aggiornare gli URL delle recensioni nella sitemap.');

    $reviewEntries = '';
    foreach ($reviewUrls as $reviewUrl) {
        if (!is_string($reviewUrl) || !reviewUrlMatchesSite($reviewUrl, $siteUrl)) {
            throw new RuntimeException('URL recensione non valido nell’archivio pubblicato.');
        }
        $reviewEntries .= "  <url>\n    <loc>" . h($reviewUrl) . "</loc>\n  </url>\n";
    }
    $sitemap = preg_replace('/<\/urlset>\s*$/', $reviewEntries . '</urlset>' . "\n", $sitemap, 1, $sitemapCount);
    if (!is_string($sitemap) || $sitemapCount !== 1) throw new RuntimeException('Formato sitemap non valido.');
    return $sitemap;
}

function regenerateSitemap(): array
{
    $config = adminConfig();
    $siteUrl = publicSitemapBaseUrl((string)$config['site_url']);
    $publishedCertificates = loadPublishedCertificates();
    $isins = array_map(static fn($certificate) => (string)$certificate['isin'], $publishedCertificates);
    if (count(array_unique($isins)) !== count($isins)) throw new RuntimeException('ISIN duplicati nei dati pubblicati.');
    $publishedOverrides = loadPublishedReviewOverrides();
    $reviewUrls = [];
    foreach ($publishedCertificates as $certificate) {
        $isin = (string)$certificate['isin'];
        $override = $publishedOverrides[$isin] ?? [];
        if (!is_array($override)) throw new RuntimeException('Modifica editoriale non valida per ' . $isin . '.');
        $reviewUrls[] = reviewUrlForCertificate($certificate, $override, $siteUrl, empty($override['url']));
    }
    sort($reviewUrls, SORT_STRING);

    $targetPath = projectPath('sitemap.xml');
    $previous = readProjectFile('sitemap.xml');
    $updated = buildReviewSitemap($reviewUrls, $siteUrl);
    if ($updated === $previous) return ['count' => count($reviewUrls), 'changed' => false];

    $backupDir = storagePath('backups') . DIRECTORY_SEPARATOR . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(3));
    if (!mkdir($backupDir, 0750, true) && !is_dir($backupDir)) throw new RuntimeException('Impossibile creare il backup della sitemap.');
    if (file_put_contents($backupDir . DIRECTORY_SEPARATOR . 'sitemap.xml', $previous, LOCK_EX) === false) {
        throw new RuntimeException('Impossibile salvare il backup della sitemap.');
    }

    $temporary = $targetPath . '.' . bin2hex(random_bytes(5)) . '.tmp';
    if (file_put_contents($temporary, $updated, LOCK_EX) === false || !rename($temporary, $targetPath)) {
        if (is_file($temporary)) unlink($temporary);
        throw new RuntimeException('Impossibile aggiornare sitemap.xml.');
    }
    return ['count' => count($reviewUrls), 'changed' => true];
}

function publishSite(?string $onlyIsin = null): array
{
    $config = adminConfig();
    $GLOBALS['adminSiteUrl'] = (string)$config['site_url'];
    $draftCertificates = loadCertificates();
    $draftOverrides = loadReviewOverrides();
    $previousPublishedOverrides = loadPublishedReviewOverrides();
    $publishedCertificates = loadPublishedCertificates();
    $originalPublishedCertificates = $publishedCertificates;
    $publishedOverrides = [];
    foreach ($previousPublishedOverrides as $isin => $override) {
        if (!is_array($override)) throw new RuntimeException('Archivio dei testi editoriali pubblicati non valido.');
        $publishedOverrides[strtoupper((string)$isin)] = normalizeReviewOverride($override);
    }
    $originalPublishedOverrides = $publishedOverrides;
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
    $reviewDisclaimer = '';
    foreach (cmsReadSection('transparency') as $transparencyItem) {
        if (($transparencyItem['id'] ?? '') === 'product-warning') {
            $reviewDisclaimer = cmsSafeHtml((string)$transparencyItem['content']);
            break;
        }
    }
    if ($reviewDisclaimer === '') {
        throw new RuntimeException('Avvertenza breve delle schede prodotto non disponibile.');
    }
    $wanted = [];
    $reviewUrlsByIsin = [];
    $reviewPathsByIsin = [];
    $reviewIsinByRelativePath = [];
    $reviewRouteKeys = [];
    foreach ($publishedCertificates as $certificate) {
        $isin = $certificate['isin'];
        if (isset($wanted[$isin])) throw new RuntimeException('ISIN duplicato: ' . $isin);
        $wanted[$isin] = true;
        $override = $publishedOverrides[$isin] ?? [];
        $preserveLegacy = isset($publishedByIsin[$isin]) && empty($override['url']);
        $reviewUrl = reviewUrlForCertificate($certificate, $override, (string)$config['site_url'], $preserveLegacy);
        $relativePath = reviewUrlToRelativePath($reviewUrl);
        $routeKey = strtolower($relativePath);
        if (isset($reviewRouteKeys[$routeKey])) {
            throw new RuntimeException('URL recensione duplicato: ' . $reviewUrl);
        }
        $reviewRouteKeys[$routeKey] = true;
        $reviewUrlsByIsin[$isin] = $reviewUrl;
        $reviewPathsByIsin[$isin] = substr($relativePath, strlen('recensioni/'));
        $reviewIsinByRelativePath[$relativePath] = $isin;
        $markup = renderReviewContent($certificate, $publishedCertificates, $issuerProfiles, $underlyingProfiles, $publishedOverrides, $reviewDisclaimer, $reviewUrl);
        $files[$relativePath] = buildReviewPage($template, $certificate, $markup, $reviewUrl, $relativePath);
    }
    $dataJson = json_encode($publishedCertificates, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $files['js/data-certificates.js'] = "// Dataset locale dei certificati, caricato prima di app.js nelle pagine che lo usano.\n\nconst CERTIFICATES_DATA = " . $dataJson . ";\n";
    $issuerData = [];
    foreach ($issuerProfiles as $name => $profile) {
        $issuerData[] = [
            'name' => $name,
            'id' => $profile['id'],
            'description' => $profile['description'],
            'previewDescription' => $profile['previewDescription'],
            'ratings' => $profile['ratings'],
        ];
    }
    $issuerDataJson = json_encode($issuerData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $files['js/data-issuers.js'] = "// Dataset locale degli emittenti, derivato dai profili in emittenti.html.\n\nconst ISSUERS_DATA = " . $issuerDataJson . ";\n";
    $issuerDataVersion = substr(hash('sha256', $files['js/data-issuers.js']), 0, 12);
    $isins = array_keys($wanted);
    sort($isins, SORT_STRING);
    $manifestPaths = [];
    foreach ($isins as $isin) $manifestPaths[$isin] = $reviewPathsByIsin[$isin];
    $manifest = 'window.STATIC_REVIEW_ISINS = Object.freeze(' . json_encode($isins, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . ");\n"
        . 'window.STATIC_REVIEW_PATHS = Object.freeze(' . json_encode($manifestPaths, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . ");\n";
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
        if (
            preg_match('/^google[a-f0-9]+\.html$/i', basename($path))
            && trim($content) === 'google-site-verification: ' . basename($path)
        ) {
            continue;
        }
        $assetPrefix = str_starts_with($relative, 'recensioni/') ? reviewAssetPrefix($relative) : '';
        $manifestPath = $assetPrefix . 'js/data-review-pages.js';
        $pattern = '/(<script\s+src=["\'])' . preg_quote($manifestPath, '/') . '(?:\?v=[^"\']*)?(["\'][^>]*>\s*<\/script>)/i';
        $updated = preg_replace($pattern, '$1' . $manifestPath . '?v=' . $manifestVersion . '$2', $content, 1, $scriptCount);
        if ($scriptCount !== 1) throw new RuntimeException('Include manifest non trovato in ' . $relative . '.');
        $appPath = $assetPrefix . 'js/app.js';
        $appPattern = '/(<script\s+src=["\'])' . preg_quote($appPath, '/') . '(?:\?v=[^"\']*)?(["\'][^>]*>\s*<\/script>)/i';
        $updated = preg_replace($appPattern, '$1' . $appPath . '?v=20261028-multi-agency-ratings$2', (string)$updated, 1, $appScriptCount);
        if ($appScriptCount > 1) throw new RuntimeException('Include app non univoco in ' . $relative . '.');
        if (
            in_array($relative, ['index.html', 'certificati.html', 'recensione.html'], true)
            || str_starts_with($relative, 'recensioni/')
        ) {
            $issuerDataPath = $assetPrefix . 'js/data-issuers.js';
            $issuerPattern = '/(<script\s+src=["\'])' . preg_quote($issuerDataPath, '/') . '(?:\?v=[^"\']*)?(["\'][^>]*>\s*<\/script>)/i';
            $updated = preg_replace($issuerPattern, '$1' . $issuerDataPath . '?v=' . $issuerDataVersion . '$2', (string)$updated, 1, $issuerScriptCount);
            if ($issuerScriptCount !== 1) throw new RuntimeException('Include dati emittenti non trovato in ' . $relative . '.');
        }
        $selectedIsin = $reviewIsinByRelativePath[$relative] ?? (preg_match('/^recensioni\/recensione-([A-Z0-9]{12})\.html$/i', $relative, $match)
            ? strtoupper($match[1])
            : '');
        $updated = updateReviewPicker((string)$updated, $publishedCertificates, $selectedIsin);
        $files[$relative] = cmsEnsureConsentAssets((string)$updated, $relative);
    }
    $index = $files['index.html'] ?? readProjectFile('index.html');
    $indexUpdated = preg_replace_callback('/(<!-- STATIC-HOME-CERTIFICATES:START -->)[\s\S]*?(<!-- STATIC-HOME-CERTIFICATES:END -->)/', static fn($m) => $m[1] . "\n" . renderHomeCards($publishedCertificates, $reviewPathsByIsin) . "\n" . $m[2], $index, 1, $markerCount);
    if ($markerCount !== 1) throw new RuntimeException('Marcatori delle schede statiche non trovati in index.html.');
    $files['index.html'] = (string)$indexUpdated;

    $files['sitemap.xml'] = buildReviewSitemap(array_values($reviewUrlsByIsin), publicSitemapBaseUrl((string)$config['site_url']));

    $nextReviewPaths = array_fill_keys(array_keys($reviewIsinByRelativePath), true);
    foreach ($originalPublishedCertificates as $previousCertificate) {
        $previousIsin = (string)$previousCertificate['isin'];
        $previousOverride = $originalPublishedOverrides[$previousIsin] ?? [];
        $previousUrl = reviewUrlForCertificate($previousCertificate, $previousOverride, (string)$config['site_url'], empty($previousOverride['url']));
        $previousPath = reviewUrlToRelativePath($previousUrl);
        if (!isset($nextReviewPaths[$previousPath])) $files[$previousPath] = null;
    }
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
