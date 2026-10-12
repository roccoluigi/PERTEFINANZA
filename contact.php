<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\Exception as MailerException;
use PHPMailer\PHPMailer\PHPMailer;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

function contactResponse(int $status, string $message): never
{
    http_response_code($status);
    echo json_encode(['message' => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function contactPostString(string $key): string
{
    $value = $_POST[$key] ?? '';
    return is_string($value) ? trim($value) : '';
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    contactResponse(405, 'Metodo di richiesta non consentito.');
}

$contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 20000) {
    contactResponse(413, 'Il messaggio è troppo grande.');
}

$name = contactPostString('name');
$email = contactPostString('email');
$subjectKey = contactPostString('subject');
$message = contactPostString('message');
$consent = contactPostString('consent');
$website = contactPostString('website');

$subjects = [
    'richiesta-didattica' => 'Quesito didattico o richiesta chiarimenti',
    'segnalazione-isin' => 'Segnalazione nuovo certificato / ISIN',
    'collaborazione' => 'Proposta di partnership o collaborazione',
    'altro' => 'Altro motivo',
];

if ($website !== '') {
    contactResponse(400, 'Richiesta non valida.');
}
if (
    $name === ''
    || strlen($name) > 240
    || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || strlen($email) > 254
    || !isset($subjects[$subjectKey])
    || $message === ''
    || strlen($message) > 10000
    || $consent !== '1'
) {
    contactResponse(422, 'Controlla i campi obbligatori e riprova.');
}

$origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
if ($origin !== '') {
    $originHost = parse_url($origin, PHP_URL_HOST);
    $requestHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
    if (!is_string($originHost) || strtolower($originHost) !== strtolower(explode(':', $requestHost)[0])) {
        contactResponse(403, 'Origine della richiesta non valida.');
    }
}

session_set_cookie_params([
    'httponly' => true,
    'secure' => isset($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off',
    'samesite' => 'Lax',
    'path' => '/',
]);
if (!session_start()) {
    error_log('Contact form: unable to start rate-limit session.');
    contactResponse(503, 'Servizio temporaneamente non disponibile. Riprova più tardi.');
}
if (isset($_SESSION['contact_last_sent']) && time() - (int)$_SESSION['contact_last_sent'] < 60) {
    session_write_close();
    contactResponse(429, 'Hai inviato un messaggio da poco. Attendi un minuto prima di riprovare.');
}

require_once __DIR__ . '/admin/lib.php';
try {
    $config = adminConfig();
} catch (RuntimeException $exception) {
    error_log('Contact form configuration error: ' . $exception->getMessage());
    contactResponse(503, 'Il servizio di invio non è ancora configurato. Scrivi a info@pertefinanza.it.');
}
$smtp = $config['contact_smtp'] ?? null;
if (
    !is_array($smtp)
    || !isset($smtp['host'], $smtp['port'], $smtp['encryption'], $smtp['username'], $smtp['password'], $smtp['from_address'], $smtp['to_address'])
    || !is_string($smtp['host'])
    || $smtp['host'] === ''
    || !is_numeric($smtp['port'])
    || (int)$smtp['port'] < 1
    || (int)$smtp['port'] > 65535
    || !in_array($smtp['encryption'], ['tls', 'ssl'], true)
    || !is_string($smtp['username'])
    || $smtp['username'] === ''
    || !is_string($smtp['password'])
    || $smtp['password'] === ''
    || !is_string($smtp['from_address'])
    || !filter_var($smtp['from_address'], FILTER_VALIDATE_EMAIL)
    || !is_string($smtp['to_address'])
    || !filter_var($smtp['to_address'], FILTER_VALIDATE_EMAIL)
) {
    error_log('Contact form: SMTP settings are missing or invalid in admin/config.php.');
    contactResponse(503, 'Il servizio di invio non è ancora configurato. Scrivi a info@pertefinanza.it.');
}

$autoload = __DIR__ . '/vendor/autoload.php';
if (!is_file($autoload)) {
    error_log('Contact form: Composer dependencies are missing.');
    contactResponse(503, 'Il servizio di invio non è ancora configurato. Scrivi a info@pertefinanza.it.');
}
require_once $autoload;

$mailer = new PHPMailer(true);
try {
    $mailer->isSMTP();
    $mailer->Host = $smtp['host'];
    $mailer->Port = (int)$smtp['port'];
    $mailer->SMTPAuth = true;
    $mailer->Username = $smtp['username'];
    $mailer->Password = $smtp['password'];
    $mailer->SMTPSecure = $smtp['encryption'] === 'ssl'
        ? PHPMailer::ENCRYPTION_SMTPS
        : PHPMailer::ENCRYPTION_STARTTLS;
    $mailer->Timeout = 15;
    $mailer->CharSet = PHPMailer::CHARSET_UTF8;
    $mailer->setFrom($smtp['from_address'], 'PERTEFINANZA - Contatti');
    $mailer->addAddress($smtp['to_address']);
    $mailer->addReplyTo($email, $name);
    $mailer->Subject = '[PERTEFINANZA] ' . $subjects[$subjectKey];
    $mailer->Body = "Nome: {$name}\nEmail: {$email}\nOggetto: {$subjects[$subjectKey]}\n\n{$message}";
    $mailer->send();
} catch (MailerException $exception) {
    error_log('Contact form SMTP send failed: ' . $exception->getMessage());
    session_write_close();
    contactResponse(502, 'Non è stato possibile inviare il messaggio. Riprova più tardi o scrivi a info@pertefinanza.it.');
}

$_SESSION['contact_last_sent'] = time();
session_write_close();
contactResponse(200, 'Messaggio inviato correttamente. Grazie per averci contattato.');
