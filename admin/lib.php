<?php

declare(strict_types=1);

const ADMIN_LOGIN_RATE_LIMIT_WINDOW_SECONDS = 900;
const ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;

function adminConfig(): array
{
    $path = __DIR__ . '/config.php';
    if (!is_file($path)) {
        throw new RuntimeException('Config mancante: copia config.example.php in config.php e imposta un setup_token.');
    }
    $config = require $path;
    if (!is_array($config) || !isset($config['storage_dir'], $config['site_url'])) {
        throw new RuntimeException('Configurazione admin non valida.');
    }
    return $config;
}

function storagePath(string $file = ''): string
{
    $config = adminConfig();
    $directory = rtrim((string)$config['storage_dir'], '/\\');
    if ($directory === '') {
        throw new RuntimeException('storage_dir non può essere vuoto.');
    }
    if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
        throw new RuntimeException('Impossibile creare la cartella privata di archiviazione.');
    }
    return $file === '' ? $directory : $directory . DIRECTORY_SEPARATOR . $file;
}

function adminSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    header('X-Robots-Tag: noindex, nofollow, noarchive');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: same-origin');
    $secure = isset($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off';
    session_set_cookie_params([
        'httponly' => true,
        'secure' => $secure,
        'samesite' => 'Strict',
        'path' => '/admin/',
    ]);
    if (!session_start()) {
        throw new RuntimeException('Impossibile avviare la sessione admin.');
    }
}

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function csrfToken(): string
{
    adminSession();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return (string)$_SESSION['csrf'];
}

function verifyCsrf(?string $token): void
{
    adminSession();
    if (!is_string($token) || empty($_SESSION['csrf']) || !hash_equals((string)$_SESSION['csrf'], $token)) {
        http_response_code(403);
        throw new RuntimeException('Richiesta non valida o scaduta. Ricarica la pagina e riprova.');
    }
}

function authFile(): string
{
    return storagePath('admin-auth.json');
}

function withAdminLoginRateLimitData(callable $callback): mixed
{
    $clientAddress = (string)($_SERVER['REMOTE_ADDR'] ?? '');
    if (filter_var($clientAddress, FILTER_VALIDATE_IP) === false || ($packedAddress = inet_pton($clientAddress)) === false) {
        throw new RuntimeException('Impossibile determinare l’indirizzo IP del client.');
    }
    $clientKey = hash('sha256', $packedAddress);
    $path = storagePath('login-rate-limit.json');
    $handle = fopen($path, 'c+');
    if ($handle === false) {
        throw new RuntimeException('Impossibile aprire l’archivio dei tentativi di accesso.');
    }
    if (!flock($handle, LOCK_EX)) {
        fclose($handle);
        throw new RuntimeException('Impossibile bloccare l’archivio dei tentativi di accesso.');
    }

    try {
        rewind($handle);
        $contents = stream_get_contents($handle);
        if ($contents === false) {
            throw new RuntimeException('Impossibile leggere l’archivio dei tentativi di accesso.');
        }
        $attemptsByClient = $contents === ''
            ? []
            : json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($attemptsByClient)) {
            throw new RuntimeException('Archivio dei tentativi di accesso non valido.');
        }

        $now = time();
        $cutoff = $now - ADMIN_LOGIN_RATE_LIMIT_WINDOW_SECONDS;
        foreach ($attemptsByClient as $key => $timestamps) {
            if (!is_string($key) || preg_match('/\A[a-f0-9]{64}\z/', $key) !== 1 || !is_array($timestamps) || !array_is_list($timestamps)) {
                throw new RuntimeException('Archivio dei tentativi di accesso non valido.');
            }
            $recentTimestamps = [];
            foreach ($timestamps as $timestamp) {
                if (!is_int($timestamp)) {
                    throw new RuntimeException('Archivio dei tentativi di accesso non valido.');
                }
                if ($timestamp > $cutoff && $timestamp <= $now) {
                    $recentTimestamps[] = $timestamp;
                }
            }
            if ($recentTimestamps === []) {
                unset($attemptsByClient[$key]);
            } else {
                $attemptsByClient[$key] = $recentTimestamps;
            }
        }

        $result = $callback($attemptsByClient, $now, $clientKey);
        $json = json_encode($attemptsByClient, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        rewind($handle);
        if (!ftruncate($handle, 0)) {
            throw new RuntimeException('Impossibile aggiornare l’archivio dei tentativi di accesso.');
        }
        $offset = 0;
        while ($offset < strlen($json)) {
            $written = fwrite($handle, substr($json, $offset));
            if ($written === false || $written === 0) {
                throw new RuntimeException('Impossibile aggiornare l’archivio dei tentativi di accesso.');
            }
            $offset += $written;
        }
        if (!fflush($handle)) {
            throw new RuntimeException('Impossibile salvare l’archivio dei tentativi di accesso.');
        }
        chmod($path, 0640);

        return $result;
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

function adminLoginRateLimitRetryAfter(): int
{
    return withAdminLoginRateLimitData(
        static function (array &$attemptsByClient, int $now, string $clientKey): int {
            $timestamps = $attemptsByClient[$clientKey] ?? [];
            if (count($timestamps) < ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS) {
                return 0;
            }
            return max(1, $timestamps[0] + ADMIN_LOGIN_RATE_LIMIT_WINDOW_SECONDS - $now);
        }
    );
}

function adminLoginRecordFailure(): void
{
    withAdminLoginRateLimitData(
        static function (array &$attemptsByClient, int $now, string $clientKey): void {
            $attemptsByClient[$clientKey] ??= [];
            $attemptsByClient[$clientKey][] = $now;
        }
    );
}

function adminLoginClearFailures(): void
{
    withAdminLoginRateLimitData(
        static function (array &$attemptsByClient, int $now, string $clientKey): void {
            unset($attemptsByClient[$clientKey]);
        }
    );
}

function isAdminInstalled(): bool
{
    return is_file(authFile());
}

function requireAdmin(): void
{
    adminSession();
    if (empty($_SESSION['admin_authenticated'])) {
        header('Location: login.php');
        exit;
    }
    if (!is_file(authFile())) {
        $_SESSION = [];
        session_destroy();
        header('Location: login.php');
        exit;
    }
    $auth = adminAuthRecord();
    $sessionVersion = (string)($auth['session_version'] ?? '');
    if (!hash_equals((string)($_SESSION['admin_auth_version'] ?? ''), $sessionVersion)) {
        $_SESSION = [];
        session_destroy();
        header('Location: login.php');
        exit;
    }
}

function adminAuthRecord(): array
{
    $auth = loadJson('admin-auth.json', null);
    if (!is_array($auth) || !is_string($auth['username'] ?? null) || !is_string($auth['password_hash'] ?? null)) {
        throw new RuntimeException('Archivio credenziali admin non valido.');
    }
    return $auth;
}

function loginAdmin(string $username, string $password): bool
{
    if (!is_file(authFile())) {
        return false;
    }
    $auth = adminAuthRecord();
    if (!hash_equals((string)$auth['username'], $username) || !password_verify($password, (string)$auth['password_hash'])) {
        return false;
    }
    adminLoginClearFailures();
    adminSession();
    session_regenerate_id(true);
    $_SESSION['admin_authenticated'] = true;
    $_SESSION['admin_auth_version'] = (string)($auth['session_version'] ?? '');
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return true;
}

function loadJson(string $file, mixed $default): mixed
{
    $path = storagePath($file);
    if (!is_file($path)) {
        return $default;
    }
    $contents = file_get_contents($path);
    if ($contents === false) {
        throw new RuntimeException('Impossibile leggere ' . $file . '.');
    }
    try {
        return json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $error) {
        throw new RuntimeException('JSON non valido in ' . $file . '.', 0, $error);
    }
}

function writeJsonAtomic(string $file, mixed $value): void
{
    $path = storagePath($file);
    $json = json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . PHP_EOL;
    $temporary = $path . '.' . bin2hex(random_bytes(8)) . '.tmp';
    if (file_put_contents($temporary, $json, LOCK_EX) === false) {
        throw new RuntimeException('Impossibile scrivere il file temporaneo per ' . $file . '.');
    }
    if (!rename($temporary, $path)) {
        unlink($temporary);
        throw new RuntimeException('Impossibile aggiornare in modo sicuro ' . $file . '.');
    }
    @chmod($path, 0640);
}

function loadCertificates(): array
{
    $certificates = loadJson('certificates.json', []);
    if (!is_array($certificates) || !array_is_list($certificates)) {
        throw new RuntimeException('L’archivio certificati deve essere una lista JSON.');
    }
    return $certificates;
}

function loadReviewOverrides(): array
{
    $overrides = loadJson('review-overrides.json', []);
    if (!is_array($overrides)) {
        throw new RuntimeException('L’archivio delle modifiche editoriali deve essere un oggetto JSON.');
    }
    return $overrides;
}

function loadPublishedReviewOverrides(): array
{
    $overrides = loadJson('published-review-overrides.json', []);
    if (!is_array($overrides)) {
        throw new RuntimeException('L’archivio dei testi editoriali pubblicati deve essere un oggetto JSON.');
    }
    return $overrides;
}

function normalizeCertificateInput(array $input, ?array $existing = null): array
{
    $isin = trim((string)($input['isin'] ?? ''));
    $name = trim((string)($input['name'] ?? ''));
    $issuer = trim((string)($input['issuer'] ?? ''));
    $type = trim((string)($input['type'] ?? ''));
    $underlyingInput = $input['underlyings'] ?? '';
    $underlyings = is_array($underlyingInput)
        ? $underlyingInput
        : (preg_split('/[\r\n,;]+/u', (string)$underlyingInput, -1, PREG_SPLIT_NO_EMPTY) ?: []);
    $underlyings = array_values(array_unique(array_filter(array_map('trim', $underlyings), static fn($value) => $value !== '')));
    $annualYield = filter_var($input['annualYield'] ?? null, FILTER_VALIDATE_FLOAT);
    $barrierCapital = normalizePercent($input['barrierCapital'] ?? '');
    $barrierCoupon = normalizePercent($input['barrierCoupon'] ?? '');
    $stepDown = normalizePercent($input['stepDown'] ?? '');
    $month = filter_var($input['stepDownStartMonth'] ?? null, FILTER_VALIDATE_INT);
    $strikeDate = trim((string)($input['strikeDate'] ?? ''));
    $expiryDate = trim((string)($input['expiryDate'] ?? ''));
    $price = filter_var($input['price'] ?? null, FILTER_VALIDATE_FLOAT);

    if (!validIsin($isin)) {
        throw new InvalidArgumentException('L’ISIN deve contenere 12 caratteri: solo lettere maiuscole e numeri.');
    }
    if ($name === '' || strlen($name) > 180 || preg_match('/[<>]/u', $name)) {
        throw new InvalidArgumentException('Inserisci un nome valido, massimo 180 caratteri.');
    }
    if ($issuer === '' || strlen($issuer) > 100 || preg_match('/[<>]/u', $issuer)) {
        throw new InvalidArgumentException('Inserisci un emittente valido.');
    }
    if ($type === '' || strlen($type) > 100 || preg_match('/[<>]/u', $type)) {
        throw new InvalidArgumentException('Inserisci una tipologia valida.');
    }
    if (count($underlyings) < 1 || count($underlyings) > 12) {
        throw new InvalidArgumentException('Inserisci da 1 a 12 sottostanti.');
    }
    foreach ($underlyings as $underlying) {
        if (strlen($underlying) > 80 || preg_match('/[<>]/u', $underlying)) {
            throw new InvalidArgumentException('Ogni sottostante deve essere lungo al massimo 80 caratteri.');
        }
    }
    if ($annualYield === false || $annualYield <= 0 || $annualYield > 1000) {
        throw new InvalidArgumentException('Il rendimento annuo deve essere un numero positivo e inferiore a 1000.');
    }
    if ($barrierCapital === null || $barrierCoupon === null || $stepDown === null) {
        throw new InvalidArgumentException('Barriere e step-down devono essere percentuali numeriche valide.');
    }
    if ($month === false || $month < 0 || $month > 6) {
        throw new InvalidArgumentException('Il mese di avvio dello step-down deve essere tra 0 e 6.');
    }
    if (!validItalianDate($strikeDate) || !validItalianDate($expiryDate)) {
        throw new InvalidArgumentException('Le date devono essere nel formato GG/MM/AAAA.');
    }
    $strikeDateValue = DateTimeImmutable::createFromFormat('!d/m/Y', $strikeDate);
    $expiryDateValue = DateTimeImmutable::createFromFormat('!d/m/Y', $expiryDate);
    if ($strikeDateValue === false || $expiryDateValue === false || $expiryDateValue <= $strikeDateValue) {
        throw new InvalidArgumentException('La data di scadenza deve essere successiva alla data strike.');
    }
    if ($price === false || $price <= 0) {
        throw new InvalidArgumentException('Il prezzo deve essere un numero positivo.');
    }

    return [
        'isin' => $isin,
        'name' => $name,
        'issuer' => $issuer,
        'type' => $type,
        'underlyings' => $underlyings,
        'annualYield' => (float)$annualYield,
        'barrierCapital' => formatPercent($barrierCapital),
        'barrierCoupon' => formatPercent($barrierCoupon),
        'stepDown' => formatPercent($stepDown),
        'stepDownStartMonth' => $month,
        'strikeDate' => $strikeDate,
        'expiryDate' => $expiryDate,
        'price' => (float)$price,
        'showHome' => !empty($input['showHome']),
        'showTopPick' => !empty($input['showTopPick']),
        'belowPar' => !empty($input['belowPar']),
    ];
}

function normalizePercent(mixed $value): ?float
{
    $text = str_replace(',', '.', trim(str_replace('%', '', (string)$value)));
    if ($text === '' || !is_numeric($text)) {
        return null;
    }
    $number = (float)$text;
    return $number >= 0 && $number <= 100 ? $number : null;
}

function validIsin(string $isin): bool
{
    return preg_match('/^[A-Z0-9]{12}$/', $isin) === 1;
}

function formatPercent(float $value): string
{
    return rtrim(rtrim(number_format($value, 2, '.', ''), '0'), '.') . '%';
}

function validItalianDate(string $date): bool
{
    if (!preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $date, $matches)) {
        return false;
    }
    return checkdate((int)$matches[2], (int)$matches[1], (int)$matches[3]);
}

function adminChangeCountLabel(int $count): string
{
    return $count . ' ' . ($count === 1 ? 'modifica in attesa' : 'modifiche in attesa');
}

function sanitizeEditorialInlineHtml(string $html): string
{
    $allowed = strip_tags($html, '<strong><b><em><i><u><br>');
    $tokens = preg_split('/(<\/?(?:strong|b|em|i|u|br)\b[^>]*>)/i', $allowed, -1, PREG_SPLIT_DELIM_CAPTURE) ?: [];
    $result = '';
    $openTags = [];
    foreach ($tokens as $token) {
        if (!preg_match('/^<(\/?)(strong|b|em|i|u|br)\b[^>]*>$/i', $token, $match)) {
            $result .= $token;
            continue;
        }
        $tag = strtolower($match[2]);
        if ($tag === 'b') $tag = 'strong';
        if ($tag === 'i') $tag = 'em';
        if ($tag === 'br') {
            $result .= '<br>';
        } elseif ($match[1] === '/') {
            if ($openTags !== [] && end($openTags) === $tag) {
                array_pop($openTags);
                $result .= '</' . $tag . '>';
            }
        } else {
            $openTags[] = $tag;
            $result .= '<' . $tag . '>';
        }
    }
    while ($openTags !== []) $result .= '</' . array_pop($openTags) . '>';
    return trim($result);
}

function normalizeEditorialParagraphs($value): array
{
    if (is_string($value)) {
        $blocks = preg_replace('/<\/(?:p|div)\s*>/i', "\n\n", $value);
        $blocks = preg_replace('/<(?:p|div)\b[^>]*>/i', '', (string)$blocks);
        $items = preg_split('/\R(?:[ \t]*\R)+/u', trim((string)$blocks)) ?: [];
    } elseif (is_array($value)) {
        $items = $value;
    } elseif ($value === null) {
        $items = [];
    } else {
        throw new InvalidArgumentException('Il formato dei paragrafi editoriali non è valido.');
    }
    $paragraphs = [];
    foreach ($items as $item) {
        if (!is_scalar($item)) throw new InvalidArgumentException('Il formato dei paragrafi editoriali non è valido.');
        $html = sanitizeEditorialInlineHtml((string)$item);
        if (trim(strip_tags($html)) !== '') $paragraphs[] = $html;
    }
    return array_values($paragraphs);
}

function editorialParagraphFormatFromHtml(string $html): array
{
    $fontSize = '(?:[8-9]|[1-6][0-9]|7[0-2])(?:\.5)?';
    $lineHeight = '(?:1(?:\.[0-9]{1,2})?|2(?:\.(?:[0-4][0-9]?|5(?:0)?))?)';
    $pattern = '/<div\b(?=[^>]*\bclass="cms-rich-format")(?=[^>]*\bstyle="font-size:\s*(' . $fontSize . ')px;\s*line-height:\s*(' . $lineHeight . ')\s*;?")[^>]*>/i';
    if (preg_match($pattern, $html, $match) === 1) {
        return ['paragraphFontSize' => $match[1], 'paragraphLineHeight' => $match[2]];
    }
    return ['paragraphFontSize' => null, 'paragraphLineHeight' => null];
}

function normalizeEditorialFormatValue(mixed $value, string $label, string $pattern): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    if (!is_scalar($value)) {
        throw new InvalidArgumentException('Il formato di ' . $label . ' non è valido.');
    }
    $value = trim((string)$value);
    if (preg_match($pattern, $value) !== 1) {
        throw new InvalidArgumentException('Il formato di ' . $label . ' non è valido.');
    }
    return $value;
}

function normalizeReviewOverride(array $input): array
{
    foreach (['lead', 'note', 'scenarioDescription'] as $field) {
        if (isset($input[$field]) && !is_scalar($input[$field])) {
            throw new InvalidArgumentException('Il formato dei testi editoriali non è valido.');
        }
    }
    $lead = trim((string)($input['lead'] ?? ''));
    $note = trim((string)($input['note'] ?? ''));
    $scenarioDescription = trim((string)($input['scenarioDescription'] ?? ''));
    $normalizeList = static function ($value): array {
        if (is_string($value)) {
            $items = preg_split('/\R/u', trim($value)) ?: [];
        } elseif (is_array($value)) {
            $items = $value;
        } elseif ($value === null) {
            $items = [];
        } else {
            throw new InvalidArgumentException('Il formato dei testi editoriali non è valido.');
        }
        $items = array_map(static function ($item): string {
            if (!is_scalar($item)) throw new InvalidArgumentException('Il formato dei testi editoriali non è valido.');
            return trim((string)$item);
        }, $items);
        return array_values(array_filter($items, static fn($item) => $item !== ''));
    };
    $paragraphs = normalizeEditorialParagraphs($input['paragraphs'] ?? null);
    $paragraphFormat = is_string($input['paragraphs'] ?? null)
        ? editorialParagraphFormatFromHtml($input['paragraphs'])
        : ['paragraphFontSize' => null, 'paragraphLineHeight' => null];
    $paragraphFontSize = normalizeEditorialFormatValue(
        $input['paragraphFontSize'] ?? $paragraphFormat['paragraphFontSize'],
        'la dimensione del testo',
        '/^(?:[8-9]|[1-6][0-9]|7[0-2])(?:\.5)?$/'
    );
    $paragraphLineHeight = normalizeEditorialFormatValue(
        $input['paragraphLineHeight'] ?? $paragraphFormat['paragraphLineHeight'],
        'l’interlinea',
        '/^(?:1(?:\.[0-9]{1,2})?|2(?:\.(?:[0-4][0-9]?|5(?:0)?))?)$/'
    );
    if (($paragraphFontSize === null) !== ($paragraphLineHeight === null)) {
        throw new InvalidArgumentException('Dimensione del testo e interlinea devono essere impostate insieme.');
    }
    $pros = $normalizeList($input['pros'] ?? null);
    $cons = $normalizeList($input['cons'] ?? null);
    $scenarios = [];
    if (array_key_exists('scenarios', $input)) {
        if (!is_array($input['scenarios']) || count($input['scenarios']) > 8) {
            throw new InvalidArgumentException('La matrice degli scenari non è valida.');
        }
        foreach ($input['scenarios'] as $row) {
            if (!is_array($row) || count($row) !== 5) {
                throw new InvalidArgumentException('Ogni scenario deve contenere cinque testi.');
            }
            $scenarios[] = array_map(static function ($cell): string {
                if (!is_scalar($cell)) throw new InvalidArgumentException('Il testo degli scenari non è valido.');
                return trim((string)$cell);
            }, array_values($row));
        }
    }
    $paragraphLength = array_sum(array_map('strlen', $paragraphs));
    $prosLength = array_sum(array_map('strlen', $pros));
    $consLength = array_sum(array_map('strlen', $cons));
    $scenarioLength = array_sum(array_map(static fn($row) => array_sum(array_map('strlen', $row)), $scenarios));
    if (array_key_exists('fullText', $input) && !in_array($input['fullText'], [true, false, 0, 1, '0', '1'], true)) {
        throw new InvalidArgumentException('Lo stato dei testi editoriali non è valido.');
    }
    if (strlen($lead) > 2000 || strlen($note) > 5000 || strlen($scenarioDescription) > 2000 ||
        $paragraphLength > 30000 || $prosLength > 8000 || $consLength > 8000 || $scenarioLength > 20000) {
        throw new InvalidArgumentException('I testi editoriali superano la lunghezza massima consentita.');
    }
    $hasFullText = array_key_exists('fullText', $input)
        ? in_array($input['fullText'], [true, 1, '1'], true)
        : array_key_exists('paragraphs', $input) || array_key_exists('scenarioDescription', $input) ||
            array_key_exists('pros', $input) || array_key_exists('cons', $input) ||
            array_key_exists('scenarios', $input);
    return [
        'lead' => $lead,
        'note' => $note,
        'fullText' => $hasFullText,
        'paragraphs' => $paragraphs,
        'paragraphFontSize' => $paragraphFontSize,
        'paragraphLineHeight' => $paragraphLineHeight,
        'scenarioDescription' => $scenarioDescription,
        'scenarios' => $scenarios,
        'pros' => $pros,
        'cons' => $cons,
    ];
}

function reviewOverrideHasContent(array $override): bool
{
    $override = normalizeReviewOverride($override);
    return $override['fullText'] || $override['lead'] !== '' || $override['note'] !== '' ||
        $override['paragraphs'] !== [] || $override['scenarioDescription'] !== '' ||
        $override['pros'] !== [] || $override['cons'] !== [];
}
