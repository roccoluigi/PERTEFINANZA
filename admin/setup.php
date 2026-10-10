<?php

declare(strict_types=1);

require __DIR__ . '/lib.php';
adminSession();

$error = '';
$complete = false;
try {
    $config = adminConfig();
    if (isAdminInstalled()) {
        http_response_code(404);
        exit('Installazione già completata.');
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        verifyCsrf($_POST['csrf'] ?? null);
        $setupToken = (string)($config['setup_token'] ?? '');
        $submittedToken = (string)($_POST['setup_token'] ?? '');
        $username = trim((string)($_POST['username'] ?? ''));
        $password = (string)($_POST['password'] ?? '');
        if (strlen($setupToken) < 32 || str_contains($setupToken, 'REPLACE-WITH-')) {
            throw new RuntimeException('Imposta prima un setup_token personale di almeno 32 caratteri in config.php.');
        }
        if (!hash_equals($setupToken, $submittedToken)) {
            throw new InvalidArgumentException('Token di installazione non valido.');
        }
        if (!preg_match('/^[A-Za-z0-9._@-]{4,64}$/', $username)) {
            throw new InvalidArgumentException('Scegli un nome utente tra 4 e 64 caratteri (lettere, numeri, punto, trattino o underscore).');
        }
        if (strlen($password) < 14) {
            throw new InvalidArgumentException('La password deve contenere almeno 14 caratteri.');
        }
        writeJsonAtomic('admin-auth.json', [
            'username' => $username,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        ]);
        $complete = true;
    }
} catch (Throwable $exception) {
    $error = $exception->getMessage();
}
?>
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Configura il pannello | PERTEFINANZA</title>
  <script src="admin.js?v=20261009-1"></script>
  <link rel="stylesheet" href="admin.css?v=20261009-1">
</head>
<body>
  <main class="admin-shell admin-auth">
    <div class="admin-auth-topbar">
      <a class="admin-brand" href="../index.html">
        <span class="admin-brand-mark" aria-hidden="true">PF</span>
        <span class="admin-brand-copy"><strong>PERTEFINANZA</strong><small>Area riservata</small></span>
      </a>
      <button class="theme-toggle" type="button" aria-label="Attiva tema notte" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/></svg><span class="theme-toggle-label">Notte</span></button>
    </div>
    <h1>Configura il pannello</h1>
    <?php if ($complete): ?>
      <p class="notice success">Installazione completata. Rimuovi subito <code>setup_token</code> da <code>config.php</code>.</p>
      <a class="button" href="login.php">Vai al login</a>
    <?php else: ?>
      <p>Il token serve solo per creare il primo account amministratore.</p>
      <?php if ($error !== ''): ?><p class="notice error"><?= h($error) ?></p><?php endif; ?>
      <form method="post" autocomplete="off">
        <input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>">
        <label>Token di installazione<input type="password" name="setup_token" required autocomplete="one-time-code"></label>
        <label>Nome utente<input name="username" required minlength="4" maxlength="64" autocomplete="username"></label>
        <label>Password (almeno 14 caratteri)<input type="password" name="password" required minlength="14" autocomplete="new-password"></label>
        <button class="button" type="submit">Crea account amministratore</button>
      </form>
    <?php endif; ?>
  </main>
</body>
</html>
