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
        $attempts = (int)($_SESSION['login_attempts'] ?? 0);
        if ($attempts >= 8) {
            throw new RuntimeException('Troppi tentativi. Chiudi e riapri il browser prima di riprovare.');
        }
        if (loginAdmin((string)($_POST['username'] ?? ''), (string)($_POST['password'] ?? ''))) {
            unset($_SESSION['login_attempts']);
            header('Location: index.php');
            exit;
        }
        $_SESSION['login_attempts'] = $attempts + 1;
        $error = 'Credenziali non valide.';
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
