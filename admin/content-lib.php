<?php

declare(strict_types=1);

function cmsSectionConfig(string $section): array
{
    $sections = [
        'issuers' => ['page' => 'emittenti.html', 'start' => '<!-- STATIC-ISSUERS:START -->', 'end' => '<!-- STATIC-ISSUERS:END -->'],
        'training' => ['page' => 'formazione.html', 'start' => '<!-- STATIC-FORMATION-MODULES:START -->', 'end' => '<!-- STATIC-FORMATION-MODULES:END -->'],
        'faq' => ['page' => 'faq.html', 'start' => '<!-- STATIC-FAQ:START -->', 'end' => '<!-- STATIC-FAQ:END -->'],
        'glossary' => ['page' => 'glossario.html', 'start' => '<!-- STATIC-GLOSSARY:START -->', 'end' => '<!-- STATIC-GLOSSARY:END -->'],
        'contacts' => ['page' => 'contatti.html'],
        'transparency' => ['page' => 'index.html'],
        'disclaimer' => ['page' => 'disclaimer.html'],
    ];
    if (!isset($sections[$section])) {
        throw new InvalidArgumentException('Sezione contenuti non riconosciuta.');
    }
    return $sections[$section];
}

function cmsMarkedContent(string $html, string $start, string $end): string
{
    $pattern = '/' . preg_quote($start, '/') . '([\s\S]*?)' . preg_quote($end, '/') . '/';
    if (!preg_match($pattern, $html, $match)) {
        throw new RuntimeException('Marcatori dei contenuti mancanti nella pagina.');
    }
    return $match[1];
}

function cmsFragmentRoot(string $html): DOMElement
{
    $document = new DOMDocument('1.0', 'UTF-8');
    $previous = libxml_use_internal_errors(true);
    $loaded = $document->loadHTML('<?xml encoding="UTF-8"><div id="cms-fragment-root">' . $html . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    libxml_use_internal_errors($previous);
    if (!$loaded) {
        throw new RuntimeException('Impossibile leggere i contenuti HTML della pagina.');
    }
    foreach ($document->getElementsByTagName('div') as $element) {
        if ($element->getAttribute('id') === 'cms-fragment-root') {
            return $element;
        }
    }
    throw new RuntimeException('Contenitore dei contenuti HTML non trovato.');
}

function cmsHasClass(DOMElement $element, string $class): bool
{
    return in_array($class, preg_split('/\s+/', trim($element->getAttribute('class'))) ?: [], true);
}

function cmsFindClass(DOMElement $root, string $tag, string $class): ?DOMElement
{
    foreach ($root->getElementsByTagName($tag) as $element) {
        if ($element instanceof DOMElement && cmsHasClass($element, $class)) {
            return $element;
        }
    }
    return null;
}

function cmsInnerHtml(DOMNode $node): string
{
    $html = '';
    foreach ($node->childNodes as $child) {
        $html .= $node->ownerDocument->saveHTML($child);
    }
    return $html;
}

function cmsText(?DOMNode $node): string
{
    if (!$node) {
        return '';
    }
    return trim(preg_replace('/\s+/u', ' ', $node->textContent ?? '') ?? '');
}

function cmsSeparateRelatedHtml(string $html): array
{
    $root = cmsFragmentRoot($html);
    $relatedNodes = [];
    foreach ($root->getElementsByTagName('*') as $element) {
        if ($element instanceof DOMElement && cmsHasClass($element, 'related-content-links')) {
            $relatedNodes[] = $element;
        }
    }
    $related = [];
    foreach ($relatedNodes as $element) {
        $related[] = $element->ownerDocument->saveHTML($element);
        $element->parentNode?->removeChild($element);
    }
    return ['content' => cmsInnerHtml($root), 'related' => implode("\n", $related)];
}

function cmsMigrateSectionItems(string $section, array $items): array
{
    foreach ($items as &$item) {
        if (!is_array($item)) {
            throw new RuntimeException('Archivio di contenuti non valido.');
        }
        if ($section === 'training' && !array_key_exists('related', $item)) {
            $separated = cmsSeparateRelatedHtml((string)($item['content'] ?? ''));
            $item['content'] = $separated['content'];
            $item['related'] = $separated['related'];
        } elseif ($section === 'faq' && !array_key_exists('related', $item)) {
            $separated = cmsSeparateRelatedHtml((string)($item['answer'] ?? ''));
            $item['answer'] = $separated['content'];
            $item['related'] = $separated['related'];
        } elseif ($section === 'glossary' && !array_key_exists('related', $item)) {
            $item['related'] = '';
        }
    }
    unset($item);
    return $items;
}

function cmsReadSection(string $section): array
{
    $config = cmsSectionConfig($section);
    $html = readProjectFile($config['page']);
    if ($section === 'contacts') {
        $header = cmsFragmentRoot(cmsMarkedContent($html, '<!-- CMS-CONTACT-HEADER:START -->', '<!-- CMS-CONTACT-HEADER:END -->'));
        $intro = cmsFragmentRoot(cmsMarkedContent($html, '<!-- CMS-CONTACT-INTRO:START -->', '<!-- CMS-CONTACT-INTRO:END -->'));
        $details = cmsFragmentRoot(cmsMarkedContent($html, '<!-- CMS-CONTACT-DETAILS:START -->', '<!-- CMS-CONTACT-DETAILS:END -->'));
        $columns = [];
        foreach ($details->getElementsByTagName('div') as $column) {
            if ($column instanceof DOMElement && cmsHasClass($column, 'contact-details-grid')) {
                foreach ($column->childNodes as $child) {
                    if ($child instanceof DOMElement && strtolower($child->tagName) === 'div') {
                        $columns[] = $child;
                    }
                }
                break;
            }
        }
        if (count($columns) !== 3) {
            throw new RuntimeException('Recapiti della pagina Contatti non riconosciuti.');
        }
        $telegramLink = cmsFindClass($columns[0], 'a', 'contact-details-link');
        $emailNode = cmsFindClass($columns[1], 'span', 'contact-details-email');
        $ownerText = cmsFindClass($columns[2], 'p', 'contact-details-text');
        $headerTitle = $header->getElementsByTagName('h1')->item(0);
        $headerDescription = $header->getElementsByTagName('p')->item(0);
        $introParagraph = $intro->getElementsByTagName('p')->item(0);
        if (!$headerTitle || !$headerDescription || !$introParagraph || !$telegramLink || !$emailNode || !$ownerText) {
            throw new RuntimeException('Contenuti della pagina Contatti non riconosciuti.');
        }
        return [[
            'id' => 'contacts',
            'title' => cmsText($headerTitle),
            'description' => cmsText($headerDescription),
            'intro' => cmsInnerHtml($introParagraph),
            'telegramTitle' => cmsText(cmsFindClass($columns[0], 'h3', 'contact-details-title')),
            'telegramDescription' => cmsText(cmsFindClass($columns[0], 'p', 'contact-details-text')),
            'telegramLabel' => cmsText($telegramLink),
            'telegramUrl' => $telegramLink->getAttribute('href'),
            'emailTitle' => cmsText(cmsFindClass($columns[1], 'h3', 'contact-details-title')),
            'emailDescription' => cmsText(cmsFindClass($columns[1], 'p', 'contact-details-text')),
            'email' => cmsText($emailNode),
            'ownerTitle' => cmsText(cmsFindClass($columns[2], 'h3', 'contact-details-title')),
            'ownerDescription' => cmsInnerHtml($ownerText),
        ]];
    }
    if ($section === 'transparency') {
        $footer = cmsFragmentRoot(cmsMarkedContent($html, '<!-- CMS-TRANSPARENCY:START -->', '<!-- CMS-TRANSPARENCY:END -->'));
        $title = cmsFindClass($footer, 'h4', 'footer-heading');
        $content = cmsFindClass($footer, 'p', 'footer-disclaimer-text');
        if (!$title || !$content) {
            throw new RuntimeException('Contenuto Trasparenza & Rischi non riconosciuto.');
        }
        return [[
            'id' => 'transparency',
            'title' => cmsText($title),
            'content' => cmsText($content),
        ]];
    }
    if ($section === 'disclaimer') {
        $header = cmsFragmentRoot(cmsMarkedContent($html, '<!-- CMS-DISCLAIMER-HEADER:START -->', '<!-- CMS-DISCLAIMER-HEADER:END -->'));
        $headerTitle = $header->getElementsByTagName('h1')->item(0);
        $headerDescription = $header->getElementsByTagName('p')->item(0);
        $dateParagraph = cmsFindClass($header, 'p', 'legal-update-date');
        if (!$headerTitle || !$headerDescription || !$dateParagraph) {
            throw new RuntimeException('Intestazione della pagina legale non riconosciuta.');
        }
        preg_match('/Ultimo aggiornamento:\s*(.*)$/u', cmsText($dateParagraph), $dateMatch);
        $items = [[
            'id' => 'page-header',
            'title' => cmsText($headerTitle),
            'description' => cmsText($headerDescription),
            'date' => trim((string)($dateMatch[1] ?? '')),
        ]];
        $root = cmsFragmentRoot(cmsMarkedContent($html, '<!-- CMS-DISCLAIMER-SECTIONS:START -->', '<!-- CMS-DISCLAIMER-SECTIONS:END -->'));
        foreach ($root->getElementsByTagName('section') as $card) {
            if (!$card instanceof DOMElement || !cmsHasClass($card, 'legal-section')) {
                continue;
            }
            $title = $card->getElementsByTagName('h2')->item(0);
            $body = cmsFindClass($card, 'div', 'legal-content');
            $id = $card->getAttribute('id');
            if ($id === '' && cmsHasClass($card, 'legal-owner-section')) {
                $id = 'legal-owner';
            }
            if (!$title || !$body || $id === '') {
                throw new RuntimeException('Una sezione legale non è riconoscibile.');
            }
            $items[] = [
                'id' => $id,
                'title' => cmsText($title),
                'content' => cmsInnerHtml($body),
                'class' => $card->getAttribute('class'),
                'bodyClass' => $body->getAttribute('class'),
            ];
        }
        return $items;
    }
    $root = cmsFragmentRoot(cmsMarkedContent($html, $config['start'], $config['end']));
    $items = [];

    if ($section === 'issuers') {
        foreach ($root->getElementsByTagName('article') as $card) {
            if (!$card instanceof DOMElement || !cmsHasClass($card, 'issuer-card')) {
                continue;
            }
            $name = cmsText(cmsFindClass($card, 'h3', 'issuer-name'));
            $description = cmsFindClass($card, 'div', 'issuer-body');
            $ratings = [];
            foreach ($card->getElementsByTagName('div') as $pill) {
                if (!$pill instanceof DOMElement || !cmsHasClass($pill, 'rating-pill')) {
                    continue;
                }
                $agency = cmsText(cmsFindClass($pill, 'span', 'rating-agency'));
                $rating = cmsText(cmsFindClass($pill, 'span', 'rating-val'));
                if ($agency !== '' && $rating !== '') {
                    $ratings[] = ['agency' => rtrim($agency, ': '), 'value' => $rating];
                }
            }
            $website = cmsFindClass($card, 'a', 'issuer-link');
            if ($name !== '') {
                $items[] = [
                    'id' => $card->getAttribute('id'),
                    'name' => $name,
                    'country' => cmsText(cmsFindClass($card, 'span', 'issuer-country')),
                    'description' => cmsText($description),
                    'ratings' => $ratings,
                    'websiteLabel' => cmsText($website),
                    'websiteUrl' => $website?->getAttribute('href') ?? '',
                ];
            }
        }
    } elseif ($section === 'training') {
        $sectionTitle = '';
        $sectionBadge = '';
        foreach ($root->childNodes as $node) {
            if (!$node instanceof DOMElement) {
                continue;
            }
            if (cmsHasClass($node, 'level-header')) {
                $heading = $node->getElementsByTagName('h2')->item(0);
                $sectionTitle = cmsText($heading);
                $badge = cmsFindClass($node, 'span', 'badge');
                $sectionBadge = cmsText($badge);
                continue;
            }
            if (!cmsHasClass($node, 'module-card')) {
                continue;
            }
            $moduleNumber = cmsText(cmsFindClass($node, 'span', 'module-number'));
            preg_match('/^Modulo\s+\d+\s*[•·]\s*(.*)$/u', $moduleNumber, $topicMatch);
            $body = cmsFindClass($node, 'div', 'module-content');
            $separated = cmsSeparateRelatedHtml(cmsInnerHtml($body ?? $node));
            $items[] = [
                'id' => $node->getAttribute('id'),
                'topic' => $topicMatch[1] ?? $moduleNumber,
                'title' => cmsText(cmsFindClass($node, 'h3', 'module-title')),
                'moduleLevel' => cmsText(cmsFindClass($node, 'span', 'badge')),
                'sectionTitle' => $sectionTitle,
                'sectionBadge' => $sectionBadge,
                'content' => $separated['content'],
                'related' => $separated['related'],
            ];
        }
    } elseif ($section === 'faq') {
        foreach ($root->getElementsByTagName('div') as $entry) {
            if (!$entry instanceof DOMElement || !cmsHasClass($entry, 'faq-item')) {
                continue;
            }
            $items[] = [
                'id' => $entry->getAttribute('id'),
                'category' => cmsText(cmsFindClass($entry, 'span', 'faq-item-category')),
                'question' => cmsText(cmsFindClass($entry, 'span', 'faq-item-question-text')),
                'answer' => '',
                'related' => '',
            ];
            $separated = cmsSeparateRelatedHtml(cmsInnerHtml(cmsFindClass($entry, 'div', 'faq-answer') ?? $entry));
            $items[array_key_last($items)]['answer'] = $separated['content'];
            $items[array_key_last($items)]['related'] = $separated['related'];
        }
    } else {
        foreach ($root->getElementsByTagName('div') as $entry) {
            if (!$entry instanceof DOMElement || !cmsHasClass($entry, 'glossary-card')) {
                continue;
            }
            $title = cmsFindClass($entry, 'div', 'glossary-card-title');
            $term = '';
            $category = '';
            if ($title) {
                foreach ($title->childNodes as $child) {
                    if (!$child instanceof DOMElement) {
                        continue;
                    }
                    if ($term === '') {
                        $term = cmsText($child);
                    } elseif (cmsHasClass($child, 'badge')) {
                        $category = cmsText($child);
                    }
                }
            }
            $example = cmsFindClass($entry, 'div', 'glossary-example');
            $related = cmsFindClass($entry, 'p', 'related-content-links');
            $items[] = [
                'id' => $entry->getAttribute('id'),
                'term' => $term,
                'category' => $category,
                'definition' => cmsInnerHtml(cmsFindClass($entry, 'div', 'glossary-card-def') ?? $entry),
                'example' => $example ? cmsInnerHtml($example) : '',
                'related' => $related ? cmsInnerHtml($related) : '',
            ];
        }
    }

    return $items;
}

function cmsPendingItemCount(string $section, array $draftItems): int
{
    if (!array_is_list($draftItems)) {
        throw new RuntimeException('Archivio della sezione non valido.');
    }
    $publishedById = [];
    foreach (cmsReadSection($section) as $item) {
        $publishedById[(string)$item['id']] = $item;
    }
    $draftById = [];
    foreach ($draftItems as $item) {
        if (!is_array($item) || !is_string($item['id'] ?? null) || $item['id'] === '') {
            throw new RuntimeException('Identificativo di contenuto non valido nella bozza.');
        }
        $draftById[$item['id']] = $item;
    }
    $comparisonValue = static function (array $item) use ($section): string {
        if ($section === 'training') {
            unset($item['sectionBadge']);
        }
        return json_encode($item, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    };
    $changes = 0;
    foreach ($draftById as $id => $item) {
        if (!isset($publishedById[$id]) || $comparisonValue($item) !== $comparisonValue($publishedById[$id])) {
            $changes++;
        }
    }
    foreach ($publishedById as $id => $_item) {
        if (!isset($draftById[$id])) {
            $changes++;
        }
    }
    return $changes;
}

function cmsAllowedHref(string $href): bool
{
    $href = trim($href);
    if ($href === '' || str_starts_with($href, '//') || str_starts_with($href, '\\\\') || preg_match('/[\x00-\x20]/', $href)) {
        return false;
    }
    $scheme = parse_url($href, PHP_URL_SCHEME);
    return $scheme === null || in_array(strtolower((string)$scheme), ['http', 'https', 'mailto'], true);
}

function cmsSanitizeNode(DOMNode $parent): void
{
    $allowedTags = ['a', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'ol', 'p', 'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul'];
    $dangerousTags = ['iframe', 'object', 'script', 'style', 'svg', 'math', 'form', 'input', 'button', 'video', 'audio'];
    $children = [];
    foreach ($parent->childNodes as $child) {
        $children[] = $child;
    }
    foreach ($children as $child) {
        if (!$child instanceof DOMElement) {
            if ($child->nodeType === XML_COMMENT_NODE) {
                $parent->removeChild($child);
            }
            continue;
        }
        $tag = strtolower($child->tagName);
        if (!in_array($tag, $allowedTags, true)) {
            if (in_array($tag, $dangerousTags, true)) {
                $parent->removeChild($child);
            } else {
                while ($child->firstChild) {
                    $parent->insertBefore($child->firstChild, $child);
                }
                $parent->removeChild($child);
            }
            continue;
        }
        $allowedAttributes = ['class', 'id', 'title', 'href', 'target', 'rel', 'colspan', 'rowspan', 'scope', 'src', 'alt', 'width', 'height'];
        $attributes = [];
        foreach ($child->attributes as $attribute) {
            $attributes[] = $attribute->name;
        }
        foreach ($attributes as $name) {
            $value = $child->getAttribute($name);
            if (!in_array(strtolower($name), $allowedAttributes, true)) {
                $child->removeAttribute($name);
            } elseif ($name === 'href' || $name === 'src') {
                if (!cmsAllowedHref($value)) {
                    $child->removeAttribute($name);
                }
            } elseif ($name === 'class') {
                $classes = preg_split('/\s+/', trim($value)) ?: [];
                $child->setAttribute('class', implode(' ', array_filter($classes, static fn($class) => preg_match('/^[A-Za-z0-9_-]+$/', $class) === 1)));
            } elseif ($name === 'id' && preg_match('/^[A-Za-z][A-Za-z0-9_-]{0,99}$/', $value) !== 1) {
                $child->removeAttribute($name);
            } elseif (in_array($name, ['width', 'height', 'colspan', 'rowspan'], true) && preg_match('/^\d{1,4}$/', $value) !== 1) {
                $child->removeAttribute($name);
            } elseif ($name === 'target' && !in_array($value, ['_blank', '_self'], true)) {
                $child->removeAttribute($name);
            }
        }
        if ($tag === 'a' && $child->getAttribute('target') === '_blank') {
            $child->setAttribute('rel', 'noopener noreferrer');
        }
        cmsSanitizeNode($child);
    }
}

function cmsSafeHtml(string $html): string
{
    if (strlen($html) > 500000) {
        throw new InvalidArgumentException('Il contenuto HTML supera la dimensione massima consentita.');
    }
    $root = cmsFragmentRoot($html);
    cmsSanitizeNode($root);
    return cmsInnerHtml($root);
}

function cmsSlug(string $value): string
{
    $ascii = function_exists('iconv') ? iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) : $value;
    $slug = strtolower((string)preg_replace('/[^a-z0-9]+/i', '-', (string)$ascii));
    $slug = trim(substr(trim($slug, '-'), 0, 100), '-');
    return $slug !== '' ? $slug : 'contenuto';
}

function cmsNewId(string $section, string $label, array $items): string
{
    if ($section === 'training') {
        $max = 0;
        foreach ($items as $item) {
            if (preg_match('/^mod(\d+)/', (string)($item['id'] ?? ''), $match)) {
                $max = max($max, (int)$match[1]);
            }
        }
        return 'mod' . ($max + 1) . '-' . bin2hex(random_bytes(3));
    }
    $prefix = ['issuers' => '', 'faq' => 'faq-', 'glossary' => 'glossary-'][$section];
    $base = $prefix . cmsSlug($label);
    $id = $base;
    $suffix = 2;
    $ids = array_column($items, 'id');
    while (in_array($id, $ids, true)) {
        $id = $base . '-' . $suffix++;
    }
    return $id;
}

function cmsInputString(mixed $value, string $label): string
{
    if (!is_string($value)) {
        throw new InvalidArgumentException('Valore non valido per ' . $label . '.');
    }
    return $value;
}

function cmsTextField(mixed $value, string $label, int $maxLength = 500): string
{
    $text = trim(cmsInputString($value, $label));
    $length = function_exists('mb_strlen')
        ? mb_strlen($text, 'UTF-8')
        : (function_exists('iconv_strlen') ? iconv_strlen($text, 'UTF-8') : strlen($text));
    if ($text === '' || $length === false || $length > $maxLength || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $text)) {
        throw new InvalidArgumentException('Inserisci un valore valido per ' . $label . '.');
    }
    return $text;
}

function cmsComparable(string $value): string
{
    return function_exists('mb_strtolower') ? mb_strtolower($value, 'UTF-8') : strtolower($value);
}

function cmsRequiredHtml(mixed $value, string $label): string
{
    $html = cmsSafeHtml(cmsInputString($value, $label));
    if (trim(html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8')) === '') {
        throw new InvalidArgumentException('Inserisci un contenuto per ' . $label . '.');
    }
    return $html;
}

function cmsNormalizeForm(string $section, array $input, array $items, ?array $existing): array
{
    $id = $existing['id'] ?? cmsNewId($section, (string)($input['name'] ?? $input['question'] ?? $input['term'] ?? ''), $items);
    if (!is_string($id) || preg_match('/^[A-Za-z][A-Za-z0-9_-]{0,254}$/', $id) !== 1) {
        throw new InvalidArgumentException('Identificativo interno non valido.');
    }

    if ($section === 'transparency') {
        if ($existing === null || ($existing['id'] ?? '') !== 'transparency') {
            throw new InvalidArgumentException('La sezione Trasparenza & Rischi non può essere aggiunta o rimossa.');
        }
        return [
            'id' => 'transparency',
            'title' => cmsTextField($input['title'] ?? '', 'titolo Trasparenza & Rischi', 120),
            'content' => cmsTextField($input['content'] ?? '', 'testo Trasparenza & Rischi', 2000),
        ];
    }

    if ($section === 'contacts') {
        $telegramUrl = trim(cmsInputString($input['telegramUrl'] ?? '', 'URL Telegram'));
        if (!filter_var($telegramUrl, FILTER_VALIDATE_URL) || strtolower((string)parse_url($telegramUrl, PHP_URL_SCHEME)) !== 'https' || strtolower((string)parse_url($telegramUrl, PHP_URL_HOST)) !== 't.me') {
            throw new InvalidArgumentException('Inserisci un URL Telegram valido (https://t.me/...).');
        }
        $email = cmsTextField($input['email'] ?? '', 'email', 254);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Inserisci un indirizzo email valido.');
        }
        return [
            'id' => 'contacts',
            'title' => cmsTextField($input['title'] ?? '', 'titolo della pagina', 180),
            'description' => cmsTextField($input['description'] ?? '', 'introduzione della pagina', 1000),
            'intro' => cmsRequiredHtml($input['intro'] ?? '', 'introduzione al modulo di contatto'),
            'telegramTitle' => cmsTextField($input['telegramTitle'] ?? '', 'titolo Telegram', 120),
            'telegramDescription' => cmsTextField($input['telegramDescription'] ?? '', 'descrizione Telegram', 500),
            'telegramLabel' => cmsTextField($input['telegramLabel'] ?? '', 'testo del collegamento Telegram', 120),
            'telegramUrl' => $telegramUrl,
            'emailTitle' => cmsTextField($input['emailTitle'] ?? '', 'titolo email', 120),
            'emailDescription' => cmsTextField($input['emailDescription'] ?? '', 'descrizione email', 500),
            'email' => $email,
            'ownerTitle' => cmsTextField($input['ownerTitle'] ?? '', 'titolo del titolare', 120),
            'ownerDescription' => cmsRequiredHtml($input['ownerDescription'] ?? '', 'dati del titolare'),
        ];
    }

    if ($section === 'disclaimer') {
        if ($existing === null) {
            throw new InvalidArgumentException('Le sezioni legali esistenti non possono essere sostituite.');
        }
        if ($existing['id'] === 'page-header') {
            return [
                'id' => 'page-header',
                'title' => cmsTextField($input['title'] ?? '', 'titolo del disclaimer', 180),
                'description' => cmsTextField($input['description'] ?? '', 'introduzione del disclaimer', 1200),
                'date' => cmsTextField($input['date'] ?? '', 'data di aggiornamento', 80),
            ];
        }
        return [
            'id' => $existing['id'],
            'title' => cmsTextField($input['title'] ?? '', 'titolo della sezione legale', 300),
            'content' => cmsRequiredHtml($input['content'] ?? '', 'il contenuto legale'),
            'class' => $existing['class'],
            'bodyClass' => $existing['bodyClass'],
        ];
    }

    if ($section === 'issuers') {
        $ratings = [];
        $ratingLines = preg_split('/\r\n|\r|\n/', cmsInputString($input['ratings'] ?? '', 'rating')) ?: [];
        foreach ($ratingLines as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }
            $parts = preg_split('/\s*\|\s*/', $line, 2) ?: [];
            if (count($parts) !== 2) {
                throw new InvalidArgumentException('Inserisci ogni rating nel formato Agenzia | Valore.');
            }
            $ratings[] = [
                'agency' => cmsTextField($parts[0], 'agenzia di rating', 80),
                'value' => cmsTextField($parts[1], 'valore del rating', 40),
            ];
        }
        if (count($ratings) > 8) {
            throw new InvalidArgumentException('Sono consentite al massimo 8 agenzie di rating.');
        }
        $url = trim(cmsInputString($input['websiteUrl'] ?? '', 'URL del sito ufficiale'));
        if ($url !== '' && (!filter_var($url, FILTER_VALIDATE_URL) || !in_array(strtolower((string)parse_url($url, PHP_URL_SCHEME)), ['http', 'https'], true))) {
            throw new InvalidArgumentException('Inserisci un URL ufficiale valido (http o https).');
        }
        return [
            'id' => $id,
            'name' => cmsTextField($input['name'] ?? '', 'nome emittente', 120),
            'country' => cmsTextField($input['country'] ?? '', 'paese e descrizione', 200),
            'description' => cmsTextField($input['description'] ?? '', 'descrizione', 4000),
            'ratings' => $ratings,
            'websiteLabel' => $url === '' ? '' : cmsTextField($input['websiteLabel'] ?? '', 'testo del collegamento', 180),
            'websiteUrl' => $url,
        ];
    }

    if ($section === 'training') {
        return [
            'id' => $id,
            'topic' => cmsTextField($input['topic'] ?? '', 'argomento del modulo', 120),
            'title' => cmsTextField($input['title'] ?? '', 'titolo del capitolo', 220),
            'moduleLevel' => cmsTextField($input['moduleLevel'] ?? '', 'livello del capitolo', 80),
            'sectionTitle' => cmsTextField($input['sectionTitle'] ?? '', 'titolo del livello', 180),
            'content' => cmsRequiredHtml($input['content'] ?? '', 'il capitolo'),
            'related' => cmsSafeHtml((string)($existing['related'] ?? '')),
        ];
    }

    if ($section === 'faq') {
        return [
            'id' => $id,
            'category' => cmsTextField($input['category'] ?? '', 'categoria FAQ', 100),
            'question' => cmsTextField($input['question'] ?? '', 'domanda', 400),
            'answer' => cmsRequiredHtml($input['answer'] ?? '', 'la risposta'),
            'related' => cmsSafeHtml((string)($existing['related'] ?? '')),
        ];
    }

    return [
        'id' => $id,
        'term' => cmsTextField($input['term'] ?? '', 'termine', 160),
        'category' => cmsTextField($input['category'] ?? '', 'categoria del glossario', 100),
        'definition' => cmsRequiredHtml($input['definition'] ?? '', 'la definizione'),
        'example' => cmsSafeHtml(cmsInputString($input['example'] ?? '', 'esempio')),
        'related' => cmsSafeHtml((string)($existing['related'] ?? '')),
    ];
}

function cmsRenderIssuers(array $items): array
{
    $cards = '';
    $toc = '';
    foreach ($items as $item) {
        $id = h((string)$item['id']);
        $name = h((string)$item['name']);
        $cards .= '<article class="issuer-card" id="' . $id . '">' . "\n";
        $cards .= '<div class="issuer-header"><div class="issuer-title-box"><div><h3 class="issuer-name">' . $name . '</h3><span class="issuer-country">' . h((string)$item['country']) . '</span></div></div>';
        $cards .= '<div class="ratings-badge-group">';
        foreach ($item['ratings'] as $rating) {
            $cards .= '<div class="rating-pill"><span class="rating-agency">' . h((string)$rating['agency']) . ':</span> <span class="rating-val">' . h((string)$rating['value']) . '</span></div>';
        }
        $cards .= '</div></div><div class="issuer-body">' . h((string)$item['description']) . '</div>';
        if (($item['websiteUrl'] ?? '') !== '') {
            $cards .= '<div class="issuer-footer"><a href="' . h((string)$item['websiteUrl']) . '" target="_blank" rel="noopener noreferrer" class="issuer-link">' . h((string)$item['websiteLabel']) . '</a></div>';
        }
        $cards .= '</article>' . "\n";
        $toc .= '<a href="#' . $id . '" class="toc-issuer-btn">' . $name . '</a>' . "\n";
    }
    return ['cards' => $cards, 'toc' => $toc];
}

function cmsRenderTraining(array $items): array
{
    $modules = '';
    $toc = '';
    $groups = [];
    foreach ($items as $item) {
        preg_match('/^mod(\d+)/', (string)$item['id'], $numberMatch);
        $groups[(string)$item['sectionTitle']][] = (int)($numberMatch[1] ?? 0);
    }
    $lastSection = null;
    foreach ($items as $item) {
        $section = (string)$item['sectionTitle'];
        if ($section !== $lastSection) {
            $numbers = array_values(array_unique($groups[$section]));
            sort($numbers, SORT_NUMERIC);
            $formattedNumbers = array_map(static fn($number) => sprintf('%02d', $number), $numbers);
            $isRange = count($numbers) > 1 && $numbers === range($numbers[0], $numbers[array_key_last($numbers)]);
            $groupLabel = $isRange
                ? 'Moduli ' . $formattedNumbers[0] . ' - ' . $formattedNumbers[array_key_last($formattedNumbers)]
                : (count($numbers) === 1 ? 'Modulo ' : 'Moduli ') . implode(', ', $formattedNumbers);
            $modules .= '<div class="level-header"><h2>' . h($section) . '</h2><span class="badge badge-primary">' . h($groupLabel) . '</span></div>' . "\n";
            $lastSection = $section;
        }
        preg_match('/^mod(\d+)/', (string)$item['id'], $numberMatch);
        $number = (int)($numberMatch[1] ?? 0);
        $modules .= '<article class="module-card" id="' . h((string)$item['id']) . '"><div class="module-header"><span class="module-number">Modulo ' . $number . ' • ' . h((string)$item['topic']) . '</span><span class="badge badge-primary">' . h((string)$item['moduleLevel']) . '</span></div>';
        $modules .= '<h3 class="module-title">' . h((string)$item['title']) . '</h3><div class="module-content">' . (string)$item['content'] . (string)($item['related'] ?? '') . '</div></article>' . "\n";
        $toc .= '<a href="#' . h((string)$item['id']) . '" class="toc-item"><span class="toc-badge">' . h(sprintf('%02d', $number)) . '</span> ' . h((string)$item['title']) . '</a>' . "\n";
    }
    return ['modules' => $modules, 'toc' => $toc];
}

function cmsRenderFaq(array $items): string
{
    $html = '';
    foreach ($items as $item) {
        $id = h((string)$item['id']);
        $questionId = $id . '-question';
        $answerId = $id . '-answer';
        $html .= '<div class="faq-item active" id="' . $id . '"><div class="faq-item-header"><button type="button" class="faq-question" id="' . $questionId . '" aria-expanded="true" aria-controls="' . $answerId . '"><span class="faq-question-content"><span class="badge badge-primary faq-item-category">' . h((string)$item['category']) . '</span><span class="faq-item-question-text">' . h((string)$item['question']) . '</span></span><svg class="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg></button></div>';
        $html .= '<div class="faq-answer" id="' . $answerId . '" role="region" aria-labelledby="' . $questionId . '">' . (string)$item['answer'] . (string)($item['related'] ?? '') . '</div></div>' . "\n";
    }
    return $html;
}

function cmsRenderGlossary(array $items): string
{
    $html = '';
    foreach ($items as $item) {
        $html .= '<div class="glossary-card" id="' . h((string)$item['id']) . '"><div class="glossary-card-title"><span>' . h((string)$item['term']) . '</span><span class="badge badge-primary">' . h((string)$item['category']) . '</span></div>';
        $html .= '<div class="glossary-card-def">' . (string)$item['definition'] . '</div>';
        if ((string)$item['example'] !== '') {
            $html .= '<div class="glossary-example">' . (string)$item['example'] . '</div>';
        }
        if ((string)$item['related'] !== '') {
            $html .= '<p class="related-content-links">' . (string)$item['related'] . '</p>';
        }
        $html .= '</div>' . "\n";
    }
    return $html;
}

function cmsReplaceMarked(string $html, string $start, string $end, string $replacement): string
{
    $pattern = '/' . preg_quote($start, '/') . '[\s\S]*?' . preg_quote($end, '/') . '/';
    $updated = preg_replace_callback($pattern, static fn() => $start . "\n" . $replacement . "\n" . $end, $html, 1, $count);
    if ($count !== 1) {
        throw new RuntimeException('Impossibile aggiornare il blocco contenuti della pagina.');
    }
    return (string)$updated;
}

function cmsTransparencyPagePaths(): array
{
    $pages = [
        'index.html',
        'certificati.html',
        'emittenti.html',
        'formazione.html',
        'faq.html',
        'glossario.html',
        'contatti.html',
        'disclaimer.html',
        'recensione.html',
    ];
    $reviewPages = glob(projectPath('recensioni/recensione-*.html'));
    if ($reviewPages === false) {
        throw new RuntimeException('Impossibile individuare le schede recensione da aggiornare.');
    }
    foreach ($reviewPages as $reviewPage) {
        $pages[] = 'recensioni/' . basename($reviewPage);
    }
    return $pages;
}

function cmsPublishTransparency(array $item): string
{
    $item = cmsNormalizeForm('transparency', $item, [$item], $item);
    $replacement = '<h4 class="footer-heading">' . h((string)$item['title']) . '</h4>'
        . "\n" . '<p class="footer-disclaimer-text">' . h((string)$item['content']) . '</p>';
    $prepared = [];
    foreach (cmsTransparencyPagePaths() as $relative) {
        $original = readProjectFile($relative);
        $updated = cmsReplaceMarked(
            $original,
            '<!-- CMS-TRANSPARENCY:START -->',
            '<!-- CMS-TRANSPARENCY:END -->',
            $replacement
        );
        $prepared[$relative] = ['original' => $original, 'updated' => $updated];
    }

    $backupDirectory = storagePath('backups') . DIRECTORY_SEPARATOR . 'content-' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(3));
    if (!mkdir($backupDirectory, 0750, true) && !is_dir($backupDirectory)) {
        throw new RuntimeException('Impossibile creare il backup della sezione Trasparenza & Rischi.');
    }
    foreach ($prepared as $relative => $file) {
        $backupPath = $backupDirectory . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relative);
        if (!is_dir(dirname($backupPath)) && !mkdir(dirname($backupPath), 0750, true) && !is_dir(dirname($backupPath))) {
            throw new RuntimeException('Impossibile creare il backup di ' . $relative . '.');
        }
        if (file_put_contents($backupPath, $file['original'], LOCK_EX) === false) {
            throw new RuntimeException('Impossibile salvare il backup di ' . $relative . '.');
        }
    }

    $published = [];
    try {
        foreach ($prepared as $relative => $file) {
            $path = projectPath($relative);
            $temporary = $path . '.' . bin2hex(random_bytes(5)) . '.tmp';
            if (file_put_contents($temporary, $file['updated'], LOCK_EX) === false || !rename($temporary, $path)) {
                if (is_file($temporary)) {
                    unlink($temporary);
                }
                throw new RuntimeException('Impossibile pubblicare ' . $relative . '.');
            }
            $published[] = $relative;
        }
    } catch (Throwable $error) {
        $restoreErrors = [];
        foreach (array_reverse($published) as $relative) {
            $path = projectPath($relative);
            $temporary = $path . '.' . bin2hex(random_bytes(5)) . '.restore';
            if (file_put_contents($temporary, $prepared[$relative]['original'], LOCK_EX) === false || !rename($temporary, $path)) {
                if (is_file($temporary)) {
                    unlink($temporary);
                }
                $restoreErrors[] = $relative;
            }
        }
        if ($restoreErrors !== []) {
            throw new RuntimeException('Pubblicazione incompleta; ripristino non riuscito per: ' . implode(', ', $restoreErrors) . '.', 0, $error);
        }
        throw new RuntimeException('Pubblicazione annullata; tutte le pagine sono state ripristinate. ' . $error->getMessage(), 0, $error);
    }
    return $backupDirectory;
}

function cmsPublishSection(string $section, array $items): string
{
    $config = cmsSectionConfig($section);
    if ($section === 'transparency') {
        if (count($items) !== 1) {
            throw new InvalidArgumentException('La sezione Trasparenza & Rischi non può essere aggiunta o rimossa.');
        }
        return cmsPublishTransparency($items[0]);
    }
    $originalHtml = readProjectFile($config['page']);
    $html = $originalHtml;
    if ($section === 'issuers' && $items === []) {
        throw new InvalidArgumentException('È necessario mantenere almeno un emittente.');
    }
    if ($section === 'contacts') {
        if (count($items) !== 1 || ($items[0]['id'] ?? '') !== 'contacts') {
            throw new InvalidArgumentException('La scheda Contatti non può essere aggiunta o rimossa.');
        }
        $item = $items[0];
        $header = '<h1 class="page-header-title">' . h((string)$item['title']) . '</h1><p class="page-header-desc">' . h((string)$item['description']) . '</p>';
        $details = '<div class="contact-details-grid">'
            . '<div><h3 class="contact-details-title">' . h((string)$item['telegramTitle']) . '</h3><p class="contact-details-text">' . h((string)$item['telegramDescription']) . '</p><a href="' . h((string)$item['telegramUrl']) . '" target="_blank" rel="noopener noreferrer" class="contact-details-link">' . h((string)$item['telegramLabel']) . '</a></div>'
            . '<div><h3 class="contact-details-title">' . h((string)$item['emailTitle']) . '</h3><p class="contact-details-text">' . h((string)$item['emailDescription']) . '</p><span class="contact-details-email">' . h((string)$item['email']) . '</span></div>'
            . '<div><h3 class="contact-details-title">' . h((string)$item['ownerTitle']) . '</h3><p class="contact-details-text">' . (string)$item['ownerDescription'] . '</p></div>'
            . '</div>';
        $html = cmsReplaceMarked($html, '<!-- CMS-CONTACT-HEADER:START -->', '<!-- CMS-CONTACT-HEADER:END -->', $header);
        $html = cmsReplaceMarked($html, '<!-- CMS-CONTACT-INTRO:START -->', '<!-- CMS-CONTACT-INTRO:END -->', '<p class="contact-intro">' . (string)$item['intro'] . '</p>');
        $html = cmsReplaceMarked($html, '<!-- CMS-CONTACT-DETAILS:START -->', '<!-- CMS-CONTACT-DETAILS:END -->', $details);
        $current = cmsReadSection('contacts')[0]['email'];
        $html = str_replace((string)$current, (string)$item['email'], $html);
    } elseif ($section === 'disclaimer') {
        $currentItems = cmsReadSection('disclaimer');
        $expectedIds = array_column($currentItems, 'id');
        if (array_column($items, 'id') !== $expectedIds) {
            throw new InvalidArgumentException('Le sezioni e gli ancoraggi legali non possono essere aggiunti, rimossi o riordinati.');
        }
        $header = array_shift($items);
        $headerHtml = '<h1 class="page-header-title">' . h((string)$header['title']) . '</h1><p class="page-header-desc">' . h((string)$header['description']) . '</p><p class="legal-update-date"><strong>Ultimo aggiornamento:</strong> ' . h((string)$header['date']) . '</p>';
        $html = cmsReplaceMarked($html, '<!-- CMS-DISCLAIMER-HEADER:START -->', '<!-- CMS-DISCLAIMER-HEADER:END -->', $headerHtml);
        $sectionsHtml = '';
        foreach ($items as $item) {
            $sectionsHtml .= '<section class="' . h((string)$item['class']) . '" id="' . h((string)$item['id']) . '"><h2 class="card-title">' . h((string)$item['title']) . '</h2><div class="' . h((string)$item['bodyClass']) . '">' . (string)$item['content'] . '</div></section>' . "\n";
        }
        $html = cmsReplaceMarked($html, '<!-- CMS-DISCLAIMER-SECTIONS:START -->', '<!-- CMS-DISCLAIMER-SECTIONS:END -->', $sectionsHtml);
        $html = str_replace((string)$currentItems[0]['date'], (string)$header['date'], $html);
    } elseif ($section === 'issuers') {
        $rendered = cmsRenderIssuers($items);
        $html = cmsReplaceMarked($html, '<!-- STATIC-ISSUERS:START -->', '<!-- STATIC-ISSUERS:END -->', $rendered['cards']);
        $html = cmsReplaceMarked($html, '<!-- STATIC-ISSUER-TOC:START -->', '<!-- STATIC-ISSUER-TOC:END -->', $rendered['toc']);
        $html = preg_replace('/Indice Rapido Emittenti Monitorati \(\d+ Istituti\):/', 'Indice Rapido Emittenti Monitorati (' . count($items) . ' Istituti):', $html, 1, $count);
        if ($count !== 1) {
            throw new RuntimeException('Titolo dell’indice emittenti non trovato.');
        }
        $html = preg_replace('/sui \d+ principali emittenti/', 'sui ' . count($items) . ' principali emittenti', $html, 1);
    } elseif ($section === 'training') {
        $rendered = cmsRenderTraining($items);
        $html = cmsReplaceMarked($html, '<!-- STATIC-FORMATION-MODULES:START -->', '<!-- STATIC-FORMATION-MODULES:END -->', $rendered['modules']);
        $html = cmsReplaceMarked($html, '<!-- STATIC-FORMATION-TOC:START -->', '<!-- STATIC-FORMATION-TOC:END -->', $rendered['toc']);
        $html = preg_replace('/Indice del Percorso Formativo \(\d+ Moduli\)/', 'Indice del Percorso Formativo (' . count($items) . ' Moduli)', $html, 1, $count);
        if ($count !== 1) {
            throw new RuntimeException('Titolo dell’indice formazione non trovato.');
        }
    } elseif ($section === 'faq') {
        $html = cmsReplaceMarked($html, $config['start'], $config['end'], cmsRenderFaq($items));
    } else {
        $html = cmsReplaceMarked($html, $config['start'], $config['end'], cmsRenderGlossary($items));
        $html = preg_replace('/\d+ termini disponibili/', count($items) . ' termini disponibili', $html, 1, $count);
        if ($count !== 1) {
            throw new RuntimeException('Contatore glossario non trovato.');
        }
    }

    $path = projectPath($config['page']);
    $backupDirectory = storagePath('backups') . DIRECTORY_SEPARATOR . 'content-' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(3));
    if (!mkdir($backupDirectory, 0750, true) && !is_dir($backupDirectory)) {
        throw new RuntimeException('Impossibile creare il backup della pagina.');
    }
    if (file_put_contents($backupDirectory . DIRECTORY_SEPARATOR . basename($path), $originalHtml, LOCK_EX) === false) {
        throw new RuntimeException('Impossibile salvare il backup della pagina.');
    }
    $temporary = $path . '.' . bin2hex(random_bytes(5)) . '.tmp';
    if (file_put_contents($temporary, $html, LOCK_EX) === false || !rename($temporary, $path)) {
        if (is_file($temporary)) {
            unlink($temporary);
        }
        throw new RuntimeException('Impossibile pubblicare la pagina.');
    }
    return $backupDirectory;
}
