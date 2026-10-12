<?php

declare(strict_types=1);

require __DIR__ . '/lib.php';
adminSession();
$error = '';
$installed = false;
try {
    $installed = isAdminInstalled();
    if ($installed && !empty($_SESSION['admin_authenticated'])) {
        header('Location: index.php');
        exit;
    }
    if ($installed && $_SERVER['REQUEST_METHOD'] === 'POST') {
        verifyCsrf($_POST['csrf'] ?? null);
        $retryAfter = adminLoginRateLimitRetryAfter();
        if ($retryAfter > 0) {
            http_response_code(429);
            header('Retry-After: ' . $retryAfter);
            $error = 'Troppi tentativi. Riprova tra ' . max(1, (int)ceil($retryAfter / 60)) . ' minuti.';
        } elseif (loginAdmin((string)($_POST['username'] ?? ''), (string)($_POST['password'] ?? ''))) {
            header('Location: index.php');
            exit;
        } else {
            adminLoginRecordFailure();
            $error = 'Credenziali non valide.';
        }
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
  <title>Accesso amministratore | PERTEFINANZA</title>
  <script src="admin.js?v=20261009-1"></script>
  <link rel="stylesheet" href="admin.css?v=20261010-71">
</head>
<body>
  <main class="admin-shell admin-auth">
    <div class="admin-auth-topbar">
      <a class="admin-brand admin-site-brand" href="../index.html" aria-label="PERTEFINANZA, area di amministrazione">
        <span class="admin-brand-copy">
          <strong class="admin-brand-name">PERTE<span>FINANZA</span></strong>
          <small>AREA DI AMMINISTRAZIONE</small>
        </span>
      </a>
      <button class="theme-toggle" type="button" aria-label="Attiva tema notte" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/></svg><span class="theme-toggle-label">Notte</span></button>
    </div>
    <h1>Accesso amministratore</h1>
    <?php if ($error !== ''): ?><p class="notice error"><?= h($error) ?></p><?php endif; ?>
    <?php if (!$installed): ?>
      <p class="notice">Il pannello non è ancora configurato. Completa prima l’<a href="setup.php">installazione</a>.</p>
    <?php else: ?>
      <form method="post">
        <input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>">
        <label>Nome utente<input name="username" required autocomplete="username"></label>
        <label>Password<input type="password" name="password" required autocomplete="current-password"></label>
        <button class="button" type="submit">Accedi</button>
      </form>
    <?php endif; ?>
  </main>
</body>
</html>
