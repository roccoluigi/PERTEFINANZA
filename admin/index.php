<?php

declare(strict_types=1);

require __DIR__ . '/lib.php';
require __DIR__ . '/publisher.php';
require __DIR__ . '/content-lib.php';
adminSession();
requireAdmin();

$contentSectionLabels = [
    'issuers' => 'Emittenti',
    'training' => 'Formazione',
    'faq' => 'FAQ',
    'glossary' => 'Glossario',
    'contacts' => 'Contatti & Info',
    'transparency' => 'Trasparenza & Rischi',
    'disclaimer' => 'Disclaimer e Note Legali',
];
$message = '';
$error = '';
$certificates = [];
$publishedCertificates = [];
$overrides = [];
$publishedOverrides = [];
$certificateRows = [];
$pendingCount = 0;
$contentDrafts = [];
$contentPendingCounts = array_fill_keys(array_keys($contentSectionLabels), 0);
$globalPendingCount = 0;
$formCertificate = null;
$formOverride = ['paragraphs' => '', 'scenarioDescription' => '', 'scenarios' => [], 'pros' => [], 'cons' => []];
$editingIsin = strtoupper(trim((string)($_GET['isin'] ?? '')));

try {
    $certificates = loadCertificates();
    $publishedCertificates = loadPublishedCertificates();
    $overrides = loadReviewOverrides();
    $publishedOverrides = loadPublishedReviewOverrides();
    $contentDrafts = loadJson('content-drafts.json', []);
    if (!is_array($contentDrafts)) {
        throw new RuntimeException('Archivio bozze contenuti non valido.');
    }
    if ($editingIsin !== '') {
        foreach ($certificates as $certificate) {
            if (($certificate['isin'] ?? '') === $editingIsin) {
                $formCertificate = $certificate;
                $formOverride = reviewEditorialFormValues($certificate, $overrides[$editingIsin] ?? []);
                break;
            }
        }
    } elseif (isset($_GET['new'])) {
        $formCertificate = [
            'isin' => '', 'name' => '', 'issuer' => '', 'type' => 'Phoenix Memory Step Down',
            'underlyings' => [], 'annualYield' => '', 'barrierCapital' => '', 'barrierCoupon' => '',
            'stepDown' => '', 'stepDownStartMonth' => 1, 'strikeDate' => '', 'expiryDate' => '',
            'price' => 100, 'showHome' => false, 'showTopPick' => false,
        ];
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        verifyCsrf($_POST['csrf'] ?? null);
        $action = (string)($_POST['action'] ?? '');
        if ($action === 'discard_all') {
            if ($contentDrafts === [] && countPendingCertificateChanges($certificates, $publishedCertificates, $overrides, $publishedOverrides) === 0) {
                $message = 'Non ci sono modifiche in attesa da annullare.';
            } else {
                $certificates = $publishedCertificates;
                $overrides = $publishedOverrides;
                writeJsonAtomic('certificates.json', $certificates);
                writeJsonAtomic('review-overrides.json', (object)$overrides);
                writeJsonAtomic('content-drafts.json', (object)[]);
                $contentDrafts = [];
                $contentPendingCounts = array_fill_keys(array_keys($contentSectionLabels), 0);
                $editingIsin = '';
                $formCertificate = null;
                $formOverride = ['paragraphs' => '', 'scenarioDescription' => '', 'scenarios' => [], 'pros' => [], 'cons' => []];
                $message = 'Tutte le modifiche non pubblicate di certificati e contenuti sono state annullate; ripristinate le versioni online.';
            }
        } elseif ($action === 'publish_all' || $action === 'publish') {
            $hasCertificateChanges = countPendingCertificateChanges($certificates, $publishedCertificates, $overrides, $publishedOverrides) > 0;
            foreach ($contentDrafts as $sectionName => $sectionItems) {
                if (!isset($contentSectionLabels[$sectionName])) {
                    throw new InvalidArgumentException('È presente una sezione CMS non riconosciuta: ' . (string)$sectionName . '.');
                }
                if (!is_array($sectionItems)) {
                    throw new RuntimeException('Archivio della sezione CMS non valido: ' . $contentSectionLabels[$sectionName] . '.');
                }
                $contentPendingCounts[$sectionName] = cmsPendingItemCount($sectionName, $sectionItems);
            }
            $hasEditorialChanges = array_sum($contentPendingCounts) > 0;
            if (!$hasEditorialChanges && !$hasCertificateChanges) {
                $message = 'Non ci sono modifiche in attesa da pubblicare.';
            } else {
                $publishedSections = 0;
                foreach ($contentDrafts as $sectionName => $sectionItems) {
                    if ($contentPendingCounts[$sectionName] === 0) {
                        continue;
                    }
                    cmsPublishSection($sectionName, cmsMigrateSectionItems($sectionName, $sectionItems));
                    $publishedSections++;
                }
                $publishedCertificateCount = 0;
                if ($hasCertificateChanges) {
                    $result = publishSite();
                    $publishedCertificateCount = (int)$result['count'];
                    $publishedIsins = array_fill_keys(array_column(loadPublishedCertificates(), 'isin'), true);
                    foreach (array_keys($overrides) as $isin) {
                        if (!isset($publishedIsins[$isin])) unset($overrides[$isin]);
                    }
                    writeJsonAtomic('review-overrides.json', (object)$overrides);
                    $certificates = loadCertificates();
                    $publishedCertificates = loadPublishedCertificates();
                    $overrides = loadReviewOverrides();
                    $publishedOverrides = loadPublishedReviewOverrides();
                }
                if ($contentDrafts !== []) {
                    writeJsonAtomic('content-drafts.json', (object)[]);
                    $contentDrafts = [];
                    $contentPendingCounts = array_fill_keys(array_keys($contentSectionLabels), 0);
                }
                $publishedSummary = [];
                if ($hasCertificateChanges) {
                    $publishedSummary[] = $publishedCertificateCount . ' certificati online';
                }
                if ($publishedSections > 0) {
                    $publishedSummary[] = $publishedSections . ' sezioni editoriali aggiornate';
                }
                $message = 'Pubblicate tutte le modifiche: ' . implode(' e ', $publishedSummary) . '.';
            }
        } elseif ($action === 'publish_one') {
            $isin = strtoupper(trim((string)($_POST['isin'] ?? '')));
            $result = publishSite($isin);
            $message = 'Certificato ' . $isin . ' pubblicato. Le altre bozze restano in attesa.';
            $certificates = loadCertificates();
            $publishedCertificates = loadPublishedCertificates();
            $overrides = loadReviewOverrides();
            $publishedOverrides = loadPublishedReviewOverrides();
        } elseif ($action === 'save') {
            $oldIsin = strtoupper(trim((string)($_POST['old_isin'] ?? '')));
            $normalized = normalizeCertificateInput($_POST, null);
            foreach ($certificates as $certificate) {
                if (($certificate['isin'] ?? '') === $normalized['isin'] && $normalized['isin'] !== $oldIsin) {
                    throw new InvalidArgumentException('Esiste già un certificato con questo ISIN.');
                }
            }
            $updated = false;
            foreach ($certificates as $index => $certificate) {
                if (($certificate['isin'] ?? '') === $oldIsin) {
                    $certificates[$index] = $normalized;
                    $updated = true;
                    break;
                }
            }
            if (!$updated) $certificates[] = $normalized;
            if ($oldIsin !== '' && $oldIsin !== $normalized['isin']) {
                unset($overrides[$oldIsin]);
            }
            if (($_POST['editorial_changed'] ?? '') === '1') {
                $editorial = normalizeReviewOverride($_POST);
                if (reviewOverrideHasContent($editorial)) $overrides[$normalized['isin']] = $editorial;
                else unset($overrides[$normalized['isin']]);
            }
            writeJsonAtomic('certificates.json', array_values($certificates));
            writeJsonAtomic('review-overrides.json', (object)$overrides);
            header('Location: ' . ($oldIsin === ''
                ? 'index.php?saved=1'
                : 'index.php?isin=' . rawurlencode($normalized['isin']) . '&saved=1'));
            exit;
        } elseif ($action === 'delete') {
            $deleteIsin = strtoupper(trim((string)($_POST['isin'] ?? '')));
            $found = false;
            foreach ($certificates as $certificate) {
                if (($certificate['isin'] ?? '') === $deleteIsin) $found = true;
            }
            if (!$found) throw new InvalidArgumentException('Il certificato da rimuovere non è stato trovato.');
            $wasPublished = isset(array_fill_keys(array_column($publishedCertificates, 'isin'), true)[$deleteIsin]);
            $certificates = array_values(array_filter($certificates, static fn($item) => ($item['isin'] ?? '') !== $deleteIsin));
            if (!$wasPublished) unset($overrides[$deleteIsin]);
            writeJsonAtomic('certificates.json', $certificates);
            writeJsonAtomic('review-overrides.json', (object)$overrides);
            $message = $wasPublished
                ? 'Rimozione in attesa: il certificato è ancora online. Conferma “Rimuovi dal sito” nella riga oppure pubblica tutte le modifiche.'
                : 'Bozza eliminata: non era ancora pubblicata.';
            $editingIsin = '';
        } elseif ($action === 'restore') {
            $restoreIsin = strtoupper(trim((string)($_POST['isin'] ?? '')));
            $published = null;
            foreach ($publishedCertificates as $certificate) {
                if (($certificate['isin'] ?? '') === $restoreIsin) $published = $certificate;
            }
            if ($published === null) throw new InvalidArgumentException('Il certificato non risulta pubblicato e non può essere ripristinato.');
            foreach ($certificates as $certificate) {
                if (($certificate['isin'] ?? '') === $restoreIsin) throw new InvalidArgumentException('Il certificato non è in attesa di rimozione.');
            }
            $certificates[] = $published;
            if (isset($publishedOverrides[$restoreIsin])) $overrides[$restoreIsin] = $publishedOverrides[$restoreIsin];
            else unset($overrides[$restoreIsin]);
            writeJsonAtomic('certificates.json', $certificates);
            writeJsonAtomic('review-overrides.json', (object)$overrides);
            $message = 'Rimozione annullata: la versione pubblicata è stata ripristinata come bozza.';
        } elseif ($action === 'discard_changes') {
            $discardIsin = strtoupper(trim((string)($_POST['isin'] ?? '')));
            $published = null;
            foreach ($publishedCertificates as $certificate) {
                if (($certificate['isin'] ?? '') === $discardIsin) $published = $certificate;
            }
            if ($published === null) throw new InvalidArgumentException('Questo ISIN non ha una versione pubblicata da ripristinare.');
            $found = false;
            foreach ($certificates as $index => $certificate) {
                if (($certificate['isin'] ?? '') === $discardIsin) {
                    $certificates[$index] = $published;
                    $found = true;
                }
            }
            if (!$found) throw new InvalidArgumentException('Non ci sono modifiche da annullare.');
            if (isset($publishedOverrides[$discardIsin])) $overrides[$discardIsin] = $publishedOverrides[$discardIsin];
            else unset($overrides[$discardIsin]);
            writeJsonAtomic('certificates.json', array_values($certificates));
            writeJsonAtomic('review-overrides.json', (object)$overrides);
            $message = 'Modifiche non pubblicate annullate; ripristinata la versione online.';
        } elseif ($action === 'remove') {
            $removeIsin = strtoupper(trim((string)($_POST['isin'] ?? '')));
            foreach ($certificates as $certificate) {
                if (($certificate['isin'] ?? '') === $removeIsin) throw new InvalidArgumentException('Prima segna il certificato per la rimozione.');
            }
            publishSite($removeIsin);
            unset($overrides[$removeIsin]);
            writeJsonAtomic('review-overrides.json', (object)$overrides);
            $message = 'Certificato ' . $removeIsin . ' rimosso dal sito.';
            $publishedCertificates = loadPublishedCertificates();
            $certificates = loadCertificates();
            $overrides = loadReviewOverrides();
            $publishedOverrides = loadPublishedReviewOverrides();
        } else {
            throw new InvalidArgumentException('Azione admin non riconosciuta.');
        }
    }
    if (isset($_GET['saved'])) $message = 'Bozza salvata. Le modifiche pubbliche verranno applicate solo dopo la pubblicazione.';
    if ($editingIsin !== '' && $formCertificate === null) {
        $error = 'Certificato non trovato.';
    }
} catch (Throwable $exception) {
    $error = $exception->getMessage();
}

try {
    $draftByIsin = [];
    foreach ($certificates as $certificate) $draftByIsin[(string)$certificate['isin']] = $certificate;
    $publishedByIsin = [];
    foreach ($publishedCertificates as $certificate) $publishedByIsin[(string)$certificate['isin']] = $certificate;
    foreach ($certificates as $certificate) {
        $isin = (string)$certificate['isin'];
        if (!isset($publishedByIsin[$isin])) {
            $status = 'new';
        } else {
            $sameCertificate = certificatesAreEqual($certificate, $publishedByIsin[$isin]);
            $sameOverride = reviewOverridesAreEqual($overrides[$isin] ?? [], $publishedOverrides[$isin] ?? []);
            $status = $sameCertificate && $sameOverride ? 'published' : 'modified';
        }
        $certificateRows[] = ['certificate' => $certificate, 'status' => $status];
        if ($status !== 'published') $pendingCount++;
    }
    foreach ($publishedCertificates as $certificate) {
        $isin = (string)$certificate['isin'];
        if (!isset($draftByIsin[$isin])) {
            $certificateRows[] = ['certificate' => $certificate, 'status' => 'removal'];
            $pendingCount++;
        }
    }
    $pendingCount = countPendingCertificateChanges($certificates, $publishedCertificates, $overrides, $publishedOverrides);
} catch (Throwable $exception) {
    if ($error === '') $error = $exception->getMessage();
}

try {
    foreach ($contentDrafts as $sectionName => $sectionItems) {
        if (!isset($contentSectionLabels[$sectionName]) || !is_array($sectionItems)) {
            throw new RuntimeException('Archivio delle bozze editoriali non valido.');
        }
        $contentPendingCounts[$sectionName] = cmsPendingItemCount($sectionName, $sectionItems);
    }
    $globalPendingCount = $pendingCount + array_sum($contentPendingCounts);
} catch (Throwable $exception) {
    $contentPendingCounts = array_fill_keys(array_keys($contentSectionLabels), 0);
    $globalPendingCount = 0;
    if ($error === '') {
        $error = $exception->getMessage();
    }
}

function inputValue(array $certificate, string $key): string
{
    $value = $certificate[$key] ?? '';
    if (is_array($value)) return implode("\n", array_map('strval', $value));
    return (string)$value;
}

$homeCertificateCount = count(array_filter($certificates, static fn($certificate) => !empty($certificate['showHome'])));
$topPickCertificateCount = count(array_filter($certificates, static fn($certificate) => !empty($certificate['showTopPick'])));
?>
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pannello admin | PERTEFINANZA</title>
  <script src="admin.js?v=20261010-1"></script>
  <link rel="stylesheet" href="admin.css?v=20261010-31">
</head>
<body>
  <main class="admin-shell">
    <header class="admin-topbar">
      <div class="admin-heading">
        <a class="admin-brand admin-site-brand" href="index.php" aria-label="PERTEFINANZA, area di amministrazione, vai a Certificati">
          <span class="admin-brand-copy">
            <strong class="admin-brand-name">PERTE<span>FINANZA</span></strong>
            <small>AREA DI AMMINISTRAZIONE</small>
          </span>
        </a>
      </div>
      <div class="admin-topbar-actions">
        <form method="post" action="index.php"><input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>"><input type="hidden" name="action" value="discard_all"><button class="button secondary" type="submit" <?= $globalPendingCount === 0 ? 'disabled' : '' ?> onclick="return confirm('Annullare tutte le modifiche non pubblicate di certificati e contenuti? Le nuove schede verranno eliminate, le modifiche scartate e le rimozioni annullate.')">Annulla tutte le modifiche</button></form>
        <form method="post" action="index.php"><input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>"><input type="hidden" name="action" value="publish_all"><button class="button cms-publish-all" type="submit" <?= $globalPendingCount === 0 ? 'disabled' : '' ?> onclick="return confirm('Pubblicare tutte le modifiche in attesa di certificati e di tutte le sezioni editoriali?')">Pubblica tutte le modifiche</button></form>
        <button class="theme-toggle" type="button" aria-label="Attiva tema notte" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/></svg><span class="theme-toggle-label">Notte</span></button>
        <form method="post" action="logout.php"><input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>"><button class="button secondary" type="submit">Esci</button></form>
      </div>
    </header>
    <nav class="cms-tabs" aria-label="Sezioni del pannello">
      <a class="active" href="index.php" aria-current="page">Certificati<?php if ($pendingCount > 0): ?><span class="cms-change-count" aria-label="<?= $pendingCount ?> modifiche in attesa" title="<?= $pendingCount ?> modifiche in attesa"><?= $pendingCount ?></span><?php endif; ?></a>
      <?php foreach ($contentSectionLabels as $key => $label): ?>
        <a href="content.php?section=<?= h($key) ?>"><?= h($label) ?><?php if ($contentPendingCounts[$key] > 0): ?><span class="cms-change-count" aria-label="<?= $contentPendingCounts[$key] ?> modifiche in attesa" title="<?= $contentPendingCounts[$key] ?> modifiche in attesa"><?= $contentPendingCounts[$key] ?></span><?php endif; ?></a>
      <?php endforeach; ?>
    </nav>
    <?php if ($message !== ''): ?><p class="notice success"><?= h($message) ?></p><?php endif; ?>
    <?php if ($error !== ''): ?><p class="notice error"><?= h($error) ?></p><?php endif; ?>
    <div class="admin-grid">
      <section class="panel">
        <div class="panel-heading">
          <div>
            <h2>Certificati</h2>
            <span class="panel-heading-count"><?= count($certificateRows) ?> schede · <?= $pendingCount ?> modifiche in attesa</span>
            <div class="certificate-visibility-counts" aria-label="Certificati per sezione">
              <span class="certificate-visibility-count"><span>In home</span><strong><?= $homeCertificateCount ?></strong></span>
              <span class="certificate-visibility-count"><span>Top Picks</span><strong><?= $topPickCertificateCount ?></strong></span>
            </div>
          </div>
          <a class="button secondary" href="index.php?new=1">+ Nuovo ISIN</a>
        </div>
        <div class="certificate-list">
          <?php foreach ($certificateRows as $row): $certificate = $row['certificate']; $isin = (string)$certificate['isin']; ?>
            <article class="certificate-row certificate-row-<?= h($row['status']) ?>">
              <div class="certificate-row-heading">
                <div class="certificate-row-info">
                  <strong><?= h((string)$certificate['name']) ?></strong>
                  <small><?= h($isin) ?> · <?= h((string)$certificate['issuer']) ?> · <?= number_format((float)$certificate['annualYield'], 2, ',', '') ?>% annuo</small>
                </div>
                <?php
                  $statusLabels = ['new' => 'Nuovo · non pubblicato', 'modified' => 'Modifiche in bozza', 'published' => 'Pubblicato', 'removal' => 'Rimozione in attesa'];
                ?>
                <div class="certificate-row-status">
                  <span class="status-pill status-<?= h($row['status']) ?>"><?= h($statusLabels[$row['status']] ?? 'Stato non disponibile') ?></span>
                  <div class="certificate-visibility-tags" aria-label="Visibilità nelle sezioni">
                    <span class="status-pill status-visibility<?= !empty($certificate['showHome']) ? ' is-selected' : '' ?>">Home: <?= !empty($certificate['showHome']) ? 'sì' : 'no' ?></span>
                    <span class="status-pill status-visibility<?= !empty($certificate['showTopPick']) ? ' is-selected' : '' ?>">Top Picks: <?= !empty($certificate['showTopPick']) ? 'sì' : 'no' ?></span>
                  </div>
                </div>
              </div>
              <div class="row-actions">
                <?php if ($row['status'] !== 'removal'): ?>
                  <a href="index.php?isin=<?= rawurlencode($isin) ?>">Modifica</a>
                <?php endif; ?>
                <?php if (in_array($row['status'], ['new', 'modified'], true)): ?>
                  <form method="post" onsubmit="return confirm('Pubblicare solo questa scheda? Le altre modifiche resteranno in attesa.')"><input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>"><input type="hidden" name="action" value="publish_one"><input type="hidden" name="isin" value="<?= h($isin) ?>"><button class="button" type="submit"><?= $row['status'] === 'new' ? 'Pubblica scheda' : 'Pubblica modifiche' ?></button></form>
                <?php endif; ?>
                <?php if ($row['status'] === 'modified'): ?>
                  <form method="post" onsubmit="return confirm('Annullare le modifiche non pubblicate e ripristinare la versione online?')"><input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>"><input type="hidden" name="action" value="discard_changes"><input type="hidden" name="isin" value="<?= h($isin) ?>"><button class="button secondary" type="submit">Annulla modifiche</button></form>
                <?php endif; ?>
                <?php if ($row['status'] === 'published'): ?>
                  <form method="post" onsubmit="return confirm('Segnare questa scheda per la rimozione? Resterà online finché non confermi la rimozione o pubblichi tutte le modifiche.')"><input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>"><input type="hidden" name="action" value="delete"><input type="hidden" name="isin" value="<?= h($isin) ?>"><button class="button danger certificate-mark-removal" type="submit">Segna per rimozione</button></form>
                <?php elseif ($row['status'] === 'new'): ?>
                  <form method="post" onsubmit="return confirm('Eliminare questa bozza non ancora pubblicata?')"><input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>"><input type="hidden" name="action" value="delete"><input type="hidden" name="isin" value="<?= h($isin) ?>"><button class="button danger" type="submit">Elimina bozza</button></form>
                <?php elseif ($row['status'] === 'modified'): ?>
                  <form method="post" onsubmit="return confirm('Segnare questa scheda per la rimozione dal sito?')"><input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>"><input type="hidden" name="action" value="delete"><input type="hidden" name="isin" value="<?= h($isin) ?>"><button class="button danger certificate-mark-removal" type="submit">Segna per rimozione</button></form>
                <?php elseif ($row['status'] === 'removal'): ?>
                  <form method="post" onsubmit="return confirm('Rimuovere dal sito la scheda <?= h($isin) ?> e toglierla da home, cataloghi, sitemap e manifest?')"><input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>"><input type="hidden" name="action" value="remove"><input type="hidden" name="isin" value="<?= h($isin) ?>"><button class="button danger" type="submit">Rimuovi dal sito</button></form>
                  <form method="post"><input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>"><input type="hidden" name="action" value="restore"><input type="hidden" name="isin" value="<?= h($isin) ?>"><button class="button secondary" type="submit">Annulla rimozione</button></form>
                <?php endif; ?>
              </div>
            </article>
          <?php endforeach; ?>
        </div>
      </section>
      <?php if (is_array($formCertificate)): ?>
      <section class="panel">
        <h2><?= $editingIsin === '' ? 'Nuovo certificato' : 'Modifica certificato' ?></h2>
        <form method="post" class="certificate-editor-form">
          <input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>"><input type="hidden" name="action" value="save">
          <input type="hidden" name="old_isin" value="<?= h($editingIsin) ?>">
          <input type="hidden" name="editorial_changed" value="0">
          <label>ISIN<input name="isin" required maxlength="12" pattern="[A-Za-z0-9]{12}" value="<?= h(inputValue($formCertificate, 'isin')) ?>" <?= $editingIsin !== '' ? 'readonly' : '' ?>></label>
          <label>Nome del certificato<input name="name" required maxlength="180" value="<?= h(inputValue($formCertificate, 'name')) ?>"></label>
          <div class="form-grid">
            <label>Emittente<input name="issuer" required maxlength="100" value="<?= h(inputValue($formCertificate, 'issuer')) ?>"></label>
            <label>Tipologia<input name="type" required maxlength="100" value="<?= h(inputValue($formCertificate, 'type')) ?>"></label>
            <label>Rendimento annuo (%)<input name="annualYield" type="number" min="0.01" max="1000" step="0.01" required value="<?= h(inputValue($formCertificate, 'annualYield')) ?>"></label>
            <label>Prezzo di emissione<input name="price" type="number" min="0.01" step="0.01" required value="<?= h(inputValue($formCertificate, 'price')) ?>"></label>
            <label>Barriera capitale (%)<input name="barrierCapital" type="number" min="0" max="100" step="0.01" required value="<?= h(rtrim(inputValue($formCertificate, 'barrierCapital'), '%')) ?>"></label>
            <label>Barriera coupon (%)<input name="barrierCoupon" type="number" min="0" max="100" step="0.01" required value="<?= h(rtrim(inputValue($formCertificate, 'barrierCoupon'), '%')) ?>"></label>
            <label>Step-down (%)<input name="stepDown" type="number" min="0" max="100" step="0.01" required value="<?= h(rtrim(inputValue($formCertificate, 'stepDown'), '%')) ?>"></label>
            <label>Avvio step-down (mese 0-6)<input name="stepDownStartMonth" type="number" min="0" max="6" step="1" required value="<?= h(inputValue($formCertificate, 'stepDownStartMonth')) ?>"></label>
            <label>Data strike/fixing<input name="strikeDate" placeholder="GG/MM/AAAA" pattern="\d{2}/\d{2}/\d{4}" required value="<?= h(inputValue($formCertificate, 'strikeDate')) ?>"></label>
            <label>Data scadenza<input name="expiryDate" placeholder="GG/MM/AAAA" pattern="\d{2}/\d{2}/\d{4}" required value="<?= h(inputValue($formCertificate, 'expiryDate')) ?>"></label>
          </div>
          <label>Sottostanti (uno per riga)<textarea name="underlyings" required><?= h(inputValue($formCertificate, 'underlyings')) ?></textarea></label>
          <div class="checkbox-row"><label><input type="checkbox" name="showHome" value="1" <?= !empty($formCertificate['showHome']) ? 'checked' : '' ?>> Mostra in home</label><label><input type="checkbox" name="showTopPick" value="1" <?= !empty($formCertificate['showTopPick']) ? 'checked' : '' ?>> Evidenzia come selezione</label></div>
          <?php if ($editingIsin !== ''): ?>
          <hr>
          <h3>Testo completo della scheda</h3>
          <p class="editorial-help">Puoi modificare introduzione, analisi, scenari, punti di forza e criticità. Seleziona il testo e usa i pulsanti per grassetto, corsivo e sottolineato. Le modifiche testuali non cambiano i dati finanziari: ricontrolla che percentuali e condizioni restino coerenti con i campi del certificato.</p>
          <div class="editorial-field-label">Introduzione e analisi</div>
          <div class="rich-text-editor" data-rich-editor>
            <div class="rich-text-toolbar" role="toolbar" aria-label="Formattazione del testo">
              <button type="button" data-rich-command="bold" aria-label="Grassetto" title="Grassetto"><strong>B</strong></button>
              <button type="button" data-rich-command="italic" aria-label="Corsivo" title="Corsivo"><em>I</em></button>
              <button type="button" data-rich-command="underline" aria-label="Sottolineato" title="Sottolineato"><u>U</u></button>
            </div>
            <div class="rich-text-content review-copy-main" contenteditable="true" role="textbox" aria-label="Introduzione e analisi" aria-multiline="true" data-rich-content data-review-text data-placeholder="Salva prima i dati del certificato per generare il testo completo"><?= $formOverride['paragraphs'] ?? '' ?></div>
            <input type="hidden" name="paragraphs" value="<?= h((string)($formOverride['paragraphs'] ?? '')) ?>" data-rich-input>
          </div>
          <label>Descrizione della matrice degli scenari<textarea name="scenarioDescription" maxlength="2000" data-review-text><?= h((string)($formOverride['scenarioDescription'] ?? '')) ?></textarea></label>
          <?php $scenarioColumnLabels = ['Scenario', 'Stato sottostanti', 'Cedole spettanti', 'Rimborso capitale', 'Esito finanziario']; ?>
          <div class="editorial-scenarios">
            <strong>Testi della matrice degli scenari</strong>
            <?php foreach (($formOverride['scenarios'] ?? []) as $scenarioIndex => $scenario): ?>
              <div class="editorial-scenario-row">
                <span>Scenario <?= $scenarioIndex + 1 ?></span>
                <div class="editorial-scenario-grid">
                  <?php foreach ($scenarioColumnLabels as $columnIndex => $columnLabel): ?>
                    <label><?= h($columnLabel) ?><textarea name="scenarios[<?= $scenarioIndex ?>][<?= $columnIndex ?>]" maxlength="2000" data-review-text><?= h((string)($scenario[$columnIndex] ?? '')) ?></textarea></label>
                  <?php endforeach; ?>
                </div>
              </div>
            <?php endforeach; ?>
          </div>
          <div class="editorial-list-grid">
            <?php foreach (['pros' => 'Punti di forza', 'cons' => 'Criticità e rischi'] as $listName => $listTitle): ?>
              <?php $listItems = $formOverride[$listName] ?? []; if ($listItems === []) $listItems = ['']; ?>
              <section class="editorial-list" data-editorial-list data-list-name="<?= h($listName) ?>">
                <div class="editorial-list-heading"><h4><?= h($listTitle) ?></h4><span>Ogni punto è separato</span></div>
                <div data-editorial-items>
                  <?php foreach ($listItems as $itemIndex => $item): ?>
                    <div class="editorial-list-item">
                      <div class="editorial-item-heading">
                        <span class="editorial-item-number">Punto <?= $itemIndex + 1 ?></span>
                        <button class="button secondary editorial-remove-item" type="button" data-remove-editorial-item>Rimuovi</button>
                      </div>
                      <textarea aria-label="<?= h($listTitle . ' - punto ' . ($itemIndex + 1)) ?>" name="<?= h($listName) ?>[]" maxlength="2000" data-review-text><?= h((string)$item) ?></textarea>
                    </div>
                  <?php endforeach; ?>
                </div>
                <button class="button secondary editorial-add-item" type="button" data-add-editorial-item>+ Aggiungi punto</button>
              </section>
            <?php endforeach; ?>
          </div>
          <?php endif; ?>
          <div class="admin-actions"><button class="button" type="submit">Salva bozza</button><a class="button secondary" href="index.php">Annulla</a></div>
        </form>
      </section>
      <?php else: ?>
      <section class="panel">
        <h2>Seleziona un certificato</h2>
        <div class="editorial-help">
          <p>Scegli una scheda dall’elenco oppure seleziona <strong>+ Nuovo ISIN</strong>. La recensione, inclusi analisi, scenari, punti di forza e criticità, viene generata automaticamente dai dati del certificato. Il salvataggio crea una bozza: la pagina pubblica cambia solo dopo aver selezionato <strong>Pubblica modifiche</strong> o <strong>Pubblica tutte le modifiche</strong>.</p>
          <p>Se vuoi personalizzare la recensione generata, usa <strong>Modifica</strong> sulla scheda dopo averla salvata. I testi vengono filtrati per rimuovere codice attivo non sicuro; controlla sempre la coerenza tra i dati del certificato e l’analisi prima della pubblicazione.</p>
        </div>
      </section>
      <?php endif; ?>
    </div>
    <p class="admin-footer">Dati finanziari e testi vanno verificati sulla documentazione ufficiale prima della pubblicazione.</p>
  </main>
</body>
</html>
