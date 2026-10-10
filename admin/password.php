<?php

declare(strict_types=1);

require __DIR__ . '/lib.php';
adminSession();
requireAdmin();

$error = '';
$message = (string)($_SESSION['password_change_success'] ?? '');
unset($_SESSION['password_change_success']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        verifyCsrf($_POST['csrf'] ?? null);
        $auth = adminAuthRecord();
        $currentPassword = (string)($_POST['current_password'] ?? '');
        $newPassword = (string)($_POST['new_password'] ?? '');
        $confirmation = (string)($_POST['confirm_password'] ?? '');

        if (!password_verify($currentPassword, $auth['password_hash'])) {
            throw new InvalidArgumentException('La password attuale non è corretta.');
        }
        if (strlen($newPassword) < 14) {
            throw new InvalidArgumentException('La nuova password deve contenere almeno 14 caratteri.');
        }
        if (hash_equals($currentPassword, $newPassword)) {
            throw new InvalidArgumentException('La nuova password deve essere diversa da quella attuale.');
        }
        if (!hash_equals($newPassword, $confirmation)) {
            throw new InvalidArgumentException('La conferma non corrisponde alla nuova password.');
        }

        $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
        if (!is_string($passwordHash)) {
            throw new RuntimeException('Impossibile generare l’hash della nuova password.');
        }
        $auth['password_hash'] = $passwordHash;
        $auth['session_version'] = bin2hex(random_bytes(32));
        writeJsonAtomic('admin-auth.json', $auth);

        $_SESSION['admin_auth_version'] = $auth['session_version'];
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        $_SESSION['password_change_success'] = 'Password aggiornata. Le altre sessioni amministratore sono state disconnesse.';
        if (!session_regenerate_id(true)) {
            $_SESSION = [];
            session_destroy();
            header('Location: login.php');
            exit;
        }
        header('Location: password.php', true, 303);
        exit;
    } catch (Throwable $exception) {
        $error = $exception->getMessage();
    }
}
?>
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cambia password | PERTEFINANZA</title>
  <script src="admin.js?v=20261010-1"></script>
  <link rel="stylesheet" href="admin.css?v=20261010-68">
</head>
<body>
  <main class="admin-shell">
    <header class="admin-topbar">
      <div class="admin-heading">
        <a class="admin-brand admin-site-brand" href="index.php" aria-label="PERTEFINANZA, area di amministrazione">
          <span class="admin-brand-copy">
            <strong class="admin-brand-name">PERTE<span>FINANZA</span></strong>
            <small>AREA DI AMMINISTRAZIONE</small>
          </span>
        </a>
      </div>
      <div class="admin-topbar-actions">
        <a class="button secondary" href="index.php">Torna al pannello</a>
        <button class="theme-toggle" type="button" aria-label="Attiva tema notte" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/></svg><span class="theme-toggle-label">Notte</span></button>
        <form method="post" action="logout.php"><input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>"><button class="button secondary" type="submit">Esci</button></form>
      </div>
    </header>
    <?php if ($message !== ''): ?><p class="notice success"><?= h($message) ?></p><?php endif; ?>
    <?php if ($error !== ''): ?><p class="notice error"><?= h($error) ?></p><?php endif; ?>
    <section class="panel admin-password-panel">
      <h1>Cambia password</h1>
      <p>La nuova password deve contenere almeno 14 caratteri.</p>
      <form class="admin-password-form" method="post" autocomplete="off">
        <input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>">
        <label>Password attuale<input type="password" name="current_password" required autocomplete="current-password"></label>
        <label>Nuova password<input type="password" name="new_password" required minlength="14" autocomplete="new-password"></label>
        <label>Conferma nuova password<input type="password" name="confirm_password" required minlength="14" autocomplete="new-password"></label>
        <button class="button" type="submit">Aggiorna password</button>
      </form>
    </section>
  </main>
</body>
</html>
