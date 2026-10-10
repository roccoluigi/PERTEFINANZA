<?php

declare(strict_types=1);

require __DIR__ . '/lib.php';
require __DIR__ . '/publisher.php';
require __DIR__ . '/content-lib.php';
adminSession();
requireAdmin();

$sections = [
    'issuers' => ['title' => 'Emittenti'],
    'training' => ['title' => 'Formazione'],
    'faq' => ['title' => 'FAQ'],
    'glossary' => ['title' => 'Glossario'],
    'contacts' => ['title' => 'Contatti & Info'],
    'disclaimer' => ['title' => 'Disclaimer e Note Legali'],
];
$section = (string)($_GET['section'] ?? 'issuers');
$message = '';
$error = '';
$drafts = [];
$items = [];
$editingId = trim((string)($_GET['edit'] ?? ''));
$isNew = isset($_GET['new']);
$formItem = null;

function cmsRatingText(array $ratings): string
{
    return implode("\n", array_map(static fn($rating) => (string)$rating['agency'] . ' | ' . (string)$rating['value'], $ratings));
}

function cmsEditor(string $name, string $label, string $html): string
{
    $html = cmsSafeHtml($html);
    $safeName = h($name);
    return '<div class="cms-rich-field"><span class="cms-field-label">' . h($label) . '</span>'
        . '<div class="rich-text-editor" data-rich-editor><div class="rich-text-toolbar" role="toolbar" aria-label="Formattazione">'
        . '<button type="button" data-rich-command="bold" aria-label="Grassetto" title="Grassetto"><strong>B</strong></button>'
        . '<button type="button" data-rich-command="italic" aria-label="Corsivo" title="Corsivo"><em>I</em></button>'
        . '<button type="button" data-rich-command="underline" aria-label="Sottolineato" title="Sottolineato"><u>U</u></button>'
        . '</div><div class="rich-text-content cms-rich-content" contenteditable="true" role="textbox" aria-label="' . h($label) . '" aria-multiline="true" data-rich-content data-placeholder="Scrivi il contenuto">' . $html . '</div>'
        . '<input type="hidden" name="' . $safeName . '" value="' . h($html) . '" data-rich-input></div></div>';
}

function cmsFormValue(array $item, string $key): string
{
    $value = $item[$key] ?? '';
    return is_string($value) ? $value : '';
}

try {
    if (!isset($sections[$section])) {
        throw new InvalidArgumentException('Sezione contenuti non riconosciuta.');
    }
    $drafts = loadJson('content-drafts.json', []);
    if (!is_array($drafts)) {
        throw new RuntimeException('Archivio bozze contenuti non valido.');
    }
    $items = array_key_exists($section, $drafts) ? $drafts[$section] : cmsReadSection($section);
    if (!is_array($items) || !array_is_list($items)) {
        throw new RuntimeException('Archivio della sezione non valido.');
    }
    $items = cmsMigrateSectionItems($section, $items);

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        verifyCsrf($_POST['csrf'] ?? null);
        $action = (string)($_POST['action'] ?? '');
        if ($action === 'save_content_draft') {
            $oldId = trim((string)($_POST['old_id'] ?? ''));
            $existingIndex = null;
            $existing = null;
            if ($oldId !== '') {
                foreach ($items as $index => $item) {
                    if (($item['id'] ?? '') === $oldId) {
                        $existingIndex = $index;
                        $existing = $item;
                        break;
                    }
                }
                if ($existing === null) {
                    throw new InvalidArgumentException('Il contenuto da modificare non è stato trovato.');
                }
            }
            if (in_array($section, ['contacts', 'disclaimer'], true) && $existing === null) {
                throw new InvalidArgumentException('Gli elementi di questa pagina non possono essere aggiunti.');
            }
            $updated = cmsNormalizeForm($section, $_POST, $items, $existing);
            foreach ($items as $item) {
                if (($item['id'] ?? '') !== $oldId && ($item['id'] ?? '') === $updated['id']) {
                    throw new InvalidArgumentException('Esiste già un elemento con questo identificativo.');
                }
                $uniqueField = ['issuers' => 'name', 'training' => 'title', 'faq' => 'question', 'glossary' => 'term', 'contacts' => 'title', 'disclaimer' => 'title'][$section];
                if (($item['id'] ?? '') !== $oldId && cmsComparable((string)($item[$uniqueField] ?? '')) === cmsComparable((string)$updated[$uniqueField])) {
                    throw new InvalidArgumentException('Esiste già un elemento con lo stesso nome o titolo.');
                }
            }
            if ($existingIndex === null) {
                $items[] = $updated;
            } else {
                $items[$existingIndex] = $updated;
            }
            $drafts[$section] = array_values($items);
            writeJsonAtomic('content-drafts.json', (object)$drafts);
            header('Location: content.php?section=' . rawurlencode($section) . '&edit=' . rawurlencode($updated['id']) . '&saved=1');
            exit;
        }
        if ($action === 'delete_content_draft') {
            if (in_array($section, ['contacts', 'disclaimer'], true)) {
                throw new InvalidArgumentException('Gli elementi di questa pagina non possono essere eliminati.');
            }
            $deleteId = trim((string)($_POST['id'] ?? ''));
            $filtered = array_values(array_filter($items, static fn($item) => ($item['id'] ?? '') !== $deleteId));
            if (count($filtered) === count($items)) {
                throw new InvalidArgumentException('Il contenuto da eliminare non è stato trovato.');
            }
            $items = $filtered;
            $drafts[$section] = $items;
            writeJsonAtomic('content-drafts.json', (object)$drafts);
            header('Location: content.php?section=' . rawurlencode($section) . '&deleted=1');
            exit;
        }
        throw new InvalidArgumentException('Azione contenuti non riconosciuta.');
    }

    if (isset($_GET['saved'])) {
        $message = 'Bozza salvata. Le modifiche diventano pubbliche solo quando pubblichi questa sezione.';
    } elseif (isset($_GET['deleted'])) {
        $message = 'Elemento rimosso dalla bozza. La versione online non cambia finché non pubblichi.';
    }

    if ($editingId !== '') {
        foreach ($items as $item) {
            if (($item['id'] ?? '') === $editingId) {
                $formItem = $item;
                break;
            }
        }
        if ($formItem === null) {
            $error = 'Elemento non trovato.';
        }
    } elseif ($isNew) {
        $formItem = match ($section) {
            'issuers' => ['name' => '', 'country' => '', 'description' => '', 'ratings' => [], 'websiteLabel' => '', 'websiteUrl' => ''],
            'training' => ['topic' => '', 'title' => '', 'moduleLevel' => 'Livello Base', 'sectionTitle' => 'Nuovo livello', 'content' => ''],
            'faq' => ['category' => '', 'question' => '', 'answer' => '<p></p>'],
            'glossary' => ['term' => '', 'category' => '', 'definition' => '<p></p>', 'example' => '', 'related' => ''],
            'contacts', 'disclaimer' => throw new InvalidArgumentException('Gli elementi di questa pagina non possono essere aggiunti.'),
        };
    }
} catch (Throwable $exception) {
    $error = $exception->getMessage();
    if (isset($_POST['action']) && $_POST['action'] === 'save_content_draft') {
        $formItem = $_POST;
        foreach (['answer', 'content', 'definition', 'example', 'related'] as $field) {
            if (isset($formItem[$field])) {
                $formItem[$field] = (string)$formItem[$field];
            }
        }
    }
}

if (!isset($sections[$section])) {
    $section = 'issuers';
}
$labels = ['issuers' => 'Emittenti', 'training' => 'Formazione', 'faq' => 'FAQ', 'glossary' => 'Glossario', 'contacts' => 'Contatti & Info', 'disclaimer' => 'Disclaimer e Note Legali'];
$itemLabelKey = ['issuers' => 'name', 'training' => 'title', 'faq' => 'question', 'glossary' => 'term', 'contacts' => 'title', 'disclaimer' => 'title'][$section] ?? 'name';
$hasDraft = isset($drafts[$section]);
$fixedContentSection = in_array($section, ['contacts', 'disclaimer'], true);
$sectionPendingCounts = array_fill_keys(array_keys($labels), 0);
$certPendingCount = 0;
$globalPendingCount = 0;
try {
    foreach ($drafts as $draftSection => $draftItems) {
        if (!isset($labels[$draftSection]) || !is_array($draftItems)) {
            throw new RuntimeException('Archivio delle bozze editoriali non valido.');
        }
        $sectionPendingCounts[$draftSection] = cmsPendingItemCount($draftSection, $draftItems);
    }
    $certPendingCount = countPendingCertificateChanges(
        loadCertificates(),
        loadPublishedCertificates(),
        loadReviewOverrides(),
        loadPublishedReviewOverrides()
    );
    $globalPendingCount = $certPendingCount + array_sum($sectionPendingCounts);
} catch (Throwable $exception) {
    if ($error === '') {
        $error = $exception->getMessage();
    }
    $globalPendingCount = 0;
}
?>
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Gestione contenuti | PERTEFINANZA</title>
  <script src="admin.js?v=20261010-1"></script>
  <link rel="stylesheet" href="admin.css?v=20261010-18">
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
        <form method="post" action="index.php"><input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>"><input type="hidden" name="action" value="publish_all"><button class="button" type="submit" <?= $globalPendingCount === 0 ? 'disabled' : '' ?> onclick="return confirm('Pubblicare tutte le modifiche in attesa di certificati e di tutte le sezioni editoriali?')">Pubblica tutte le modifiche</button></form>
        <button class="theme-toggle" type="button" aria-label="Attiva tema notte" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/></svg><span class="theme-toggle-label">Notte</span></button>
        <form method="post" action="logout.php"><input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>"><button class="button secondary" type="submit">Esci</button></form>
      </div>
    </header>
    <nav class="cms-tabs" aria-label="Sezioni del pannello">
      <a href="index.php">Certificati<?php if ($certPendingCount > 0): ?><span class="cms-change-count" aria-label="<?= $certPendingCount ?> modifiche in attesa" title="<?= $certPendingCount ?> modifiche in attesa"><?= $certPendingCount ?></span><?php endif; ?></a>
      <?php foreach ($labels as $key => $label): ?>
        <a class="<?= $section === $key ? 'active' : '' ?>" href="content.php?section=<?= h($key) ?>"<?= $section === $key ? ' aria-current="page"' : '' ?>><?= h($label) ?><?php if ($sectionPendingCounts[$key] > 0): ?><span class="cms-change-count" aria-label="<?= $sectionPendingCounts[$key] ?> modifiche in attesa" title="<?= $sectionPendingCounts[$key] ?> modifiche in attesa"><?= $sectionPendingCounts[$key] ?></span><?php endif; ?></a>
      <?php endforeach; ?>
    </nav>
    <?php if ($message !== ''): ?><p class="notice success"><?= h($message) ?></p><?php endif; ?>
    <?php if ($error !== ''): ?><p class="notice error"><?= h($error) ?></p><?php endif; ?>
    <div class="admin-grid cms-grid">
      <section class="panel">
        <div class="panel-heading"><div><h2><?= h($labels[$section]) ?></h2><span class="panel-heading-count"><?= count($items) ?> elementi<?= $hasDraft ? ' · bozza in attesa di pubblicazione' : '' ?></span></div><?php if (!$fixedContentSection): ?><a class="button secondary" href="content.php?section=<?= h($section) ?>&amp;new=1">+ Aggiungi</a><?php endif; ?></div>
        <div class="cms-item-list">
          <?php foreach ($items as $item): ?>
            <div class="cms-item-row<?= ($item['id'] ?? '') === $editingId ? ' selected' : '' ?>">
              <a href="content.php?section=<?= h($section) ?>&amp;edit=<?= rawurlencode((string)$item['id']) ?>">
                <strong><?= h((string)($item[$itemLabelKey] ?? 'Senza titolo')) ?></strong>
                <small><?= h((string)$item['id']) ?></small>
              </a>
              <?php if (($item['id'] ?? '') === $editingId): ?><span class="cms-editing-badge">In modifica</span><?php endif; ?>
            </div>
          <?php endforeach; ?>
        </div>
      </section>
      <section class="panel">
        <?php if (is_array($formItem)): ?>
          <h2><?= $isNew ? 'Nuovo elemento' : 'Modifica elemento' ?></h2>
          <form method="post" class="cms-editor-form">
            <input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>">
            <input type="hidden" name="action" value="save_content_draft">
            <input type="hidden" name="old_id" value="<?= h($editingId) ?>">
            <?php if ($section === 'contacts'): ?>
              <p class="cms-editor-help">Il modulo email e i suoi campi restano invariati. I recapiti aggiornano anche gli indirizzi email visibili nella pagina.</p>
              <label>Titolo della pagina<input name="title" required maxlength="180" value="<?= h(cmsFormValue($formItem, 'title')) ?>"></label>
              <label>Introduzione della pagina<textarea name="description" required maxlength="1000"><?= h(cmsFormValue($formItem, 'description')) ?></textarea></label>
              <?= cmsEditor('intro', 'Testo introduttivo del modulo', cmsFormValue($formItem, 'intro')) ?>
              <label>Titolo del recapito Telegram<input name="telegramTitle" required maxlength="120" value="<?= h(cmsFormValue($formItem, 'telegramTitle')) ?>"></label>
              <label>Descrizione Telegram<input name="telegramDescription" required maxlength="500" value="<?= h(cmsFormValue($formItem, 'telegramDescription')) ?>"></label>
              <label>Testo del collegamento Telegram<input name="telegramLabel" required maxlength="120" value="<?= h(cmsFormValue($formItem, 'telegramLabel')) ?>"></label>
              <label>URL Telegram<input type="url" name="telegramUrl" required value="<?= h(cmsFormValue($formItem, 'telegramUrl')) ?>"></label>
              <label>Titolo del recapito email<input name="emailTitle" required maxlength="120" value="<?= h(cmsFormValue($formItem, 'emailTitle')) ?>"></label>
              <label>Descrizione email<input name="emailDescription" required maxlength="500" value="<?= h(cmsFormValue($formItem, 'emailDescription')) ?>"></label>
              <label>Indirizzo email<input type="email" name="email" required maxlength="254" value="<?= h(cmsFormValue($formItem, 'email')) ?>"></label>
              <label>Titolo dei dati del titolare<input name="ownerTitle" required maxlength="120" value="<?= h(cmsFormValue($formItem, 'ownerTitle')) ?>"></label>
              <?= cmsEditor('ownerDescription', 'Dati e descrizione del titolare', cmsFormValue($formItem, 'ownerDescription')) ?>
            <?php elseif ($section === 'disclaimer' && $editingId === 'page-header'): ?>
              <label>Titolo della pagina<input name="title" required maxlength="180" value="<?= h(cmsFormValue($formItem, 'title')) ?>"></label>
              <label>Introduzione<textarea name="description" required maxlength="1200"><?= h(cmsFormValue($formItem, 'description')) ?></textarea></label>
              <label>Data di aggiornamento<input name="date" required maxlength="80" value="<?= h(cmsFormValue($formItem, 'date')) ?>"></label>
            <?php elseif ($section === 'disclaimer'): ?>
              <label>Titolo della sezione<input name="title" required maxlength="300" value="<?= h(cmsFormValue($formItem, 'title')) ?>"></label>
              <?= cmsEditor('content', 'Testo della sezione legale', cmsFormValue($formItem, 'content')) ?>
            <?php elseif ($section === 'issuers'): ?>
              <label>Nome emittente<input name="name" required maxlength="120" value="<?= h(cmsFormValue($formItem, 'name')) ?>"></label>
              <label>Paese e descrizione breve<input name="country" required maxlength="200" value="<?= h(cmsFormValue($formItem, 'country')) ?>"></label>
              <label>Descrizione<textarea name="description" required maxlength="4000"><?= h(cmsFormValue($formItem, 'description')) ?></textarea></label>
              <label>Rating (un’agenzia per riga, formato Agenzia | Valore)<textarea name="ratings" placeholder="S&amp;P | A+&#10;Moody's | A1"><?= h(isset($formItem['ratings']) && is_array($formItem['ratings']) ? cmsRatingText($formItem['ratings']) : (string)($formItem['ratings'] ?? '')) ?></textarea></label>
              <label>Testo del collegamento al sito ufficiale<input name="websiteLabel" maxlength="180" value="<?= h(cmsFormValue($formItem, 'websiteLabel')) ?>"></label>
              <label>URL del sito ufficiale<input type="url" name="websiteUrl" value="<?= h(cmsFormValue($formItem, 'websiteUrl')) ?>"></label>
            <?php elseif ($section === 'training'): ?>
              <label>Argomento sintetico<input name="topic" required maxlength="120" value="<?= h(cmsFormValue($formItem, 'topic')) ?>"></label>
              <label>Titolo del capitolo<input name="title" required maxlength="220" value="<?= h(cmsFormValue($formItem, 'title')) ?>"></label>
              <label>Livello del capitolo<input name="moduleLevel" required maxlength="80" value="<?= h(cmsFormValue($formItem, 'moduleLevel')) ?>"></label>
              <label>Titolo del livello<input name="sectionTitle" required maxlength="180" value="<?= h(cmsFormValue($formItem, 'sectionTitle')) ?>"></label>
              <?= cmsEditor('content', 'Contenuto del capitolo', cmsFormValue($formItem, 'content')) ?>
            <?php elseif ($section === 'faq'): ?>
              <label>Categoria<input name="category" required maxlength="100" value="<?= h(cmsFormValue($formItem, 'category')) ?>"></label>
              <label>Domanda<input name="question" required maxlength="400" value="<?= h(cmsFormValue($formItem, 'question')) ?>"></label>
              <?= cmsEditor('answer', 'Risposta', cmsFormValue($formItem, 'answer')) ?>
            <?php else: ?>
              <label>Parola o locuzione<input name="term" required maxlength="160" value="<?= h(cmsFormValue($formItem, 'term')) ?>"></label>
              <label>Categoria<input name="category" required maxlength="100" value="<?= h(cmsFormValue($formItem, 'category')) ?>"></label>
              <?= cmsEditor('definition', 'Definizione', cmsFormValue($formItem, 'definition')) ?>
              <?= cmsEditor('example', 'Esempio pratico (facoltativo)', cmsFormValue($formItem, 'example')) ?>
            <?php endif; ?>
            <div class="admin-actions cms-form-actions">
              <button class="button" type="submit">Salva bozza</button>
              <a class="button secondary" href="content.php?section=<?= h($section) ?>">Annulla</a>
              <?php if (!$fixedContentSection && !$isNew && $editingId !== ''): ?>
                <button class="button danger" type="submit" form="cms-delete-form" onclick="return confirm('Rimuovere questo elemento dalla bozza? I collegamenti interni alla pagina potrebbero dover essere aggiornati.')">Elimina</button>
              <?php endif; ?>
            </div>
          </form>
          <?php if (!$fixedContentSection && !$isNew && $editingId !== ''): ?>
            <form id="cms-delete-form" method="post" class="cms-hidden-form"><input type="hidden" name="csrf" value="<?= h(csrfToken()) ?>"><input type="hidden" name="action" value="delete_content_draft"><input type="hidden" name="id" value="<?= h($editingId) ?>"></form>
          <?php endif; ?>
        <?php else: ?>
          <h2>Seleziona un elemento</h2>
          <div class="cms-editor-help">
            <p>Scegli un elemento dall’elenco o aggiungine uno nuovo. Il salvataggio crea una bozza; per pubblicare o annullare le modifiche usa i comandi globali nell’header.</p>
            <p>Quando modifichi il testo, puoi usare i pulsanti di formattazione. I contenuti HTML vengono filtrati per rimuovere codice attivo non sicuro. Gli approfondimenti e i relativi collegamenti sono conservati ma non vengono mostrati nell’editor.</p>
          </div>
        <?php endif; ?>
      </section>
    </div>
    <p class="admin-footer">Controlla contenuti, rating e collegamenti prima della pubblicazione.</p>
  </main>
</body>
</html>
