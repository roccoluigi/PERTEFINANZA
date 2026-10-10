<?php

declare(strict_types=1);

require __DIR__ . '/lib.php';
adminSession();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Metodo non consentito.');
}
verifyCsrf($_POST['csrf'] ?? null);
$_SESSION = [];
session_destroy();
header('Location: login.php');
