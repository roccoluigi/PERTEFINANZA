(() => {
  const root = document.documentElement;
  let savedTheme = 'light';

  try {
    savedTheme = localStorage.getItem('pertefinanza-theme') || 'light';
  } catch (error) {
    console.warn('Impossibile leggere la preferenza del tema dal browser.', error);
  }

  const applyTheme = (isDark) => {
    root.dataset.theme = isDark ? 'dark' : 'light';
    document.querySelectorAll('.theme-toggle').forEach((toggle) => {
      toggle.setAttribute('aria-label', isDark ? 'Attiva tema giorno' : 'Attiva tema notte');
      toggle.setAttribute('aria-pressed', String(isDark));
      const label = toggle.querySelector('.theme-toggle-label');
      const icon = toggle.querySelector('svg');
      if (label) label.textContent = isDark ? 'Giorno' : 'Notte';
      if (icon) {
        icon.innerHTML = isDark
          ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>'
          : '<path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/>';
      }
    });
  };

  applyTheme(savedTheme === 'dark');
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(root.dataset.theme === 'dark');
    document.querySelectorAll('.theme-toggle').forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const isDark = root.dataset.theme !== 'dark';
        applyTheme(isDark);
        try {
          localStorage.setItem('pertefinanza-theme', isDark ? 'dark' : 'light');
        } catch (error) {
          console.warn('Impossibile salvare la preferenza del tema nel browser.', error);
        }
      });
    });
    const markEditorialChanged = () => {
      const changed = document.querySelector('input[name="editorial_changed"]');
      if (changed) changed.value = '1';
    };

    document.addEventListener('input', (event) => {
      if (event.target.matches('[data-review-text]')) markEditorialChanged();
    });

    document.querySelectorAll('[data-rich-editor]').forEach((editor) => {
      const content = editor.querySelector('[data-rich-content]');
      const value = editor.querySelector('[data-rich-input]');
      const syncValue = () => {
        if (content && value) value.value = content.innerHTML;
      };
      if (!content || !value) return;
      content.addEventListener('input', syncValue);
      editor.closest('form')?.addEventListener('submit', syncValue);
      editor.querySelectorAll('[data-rich-command]').forEach((button) => {
        button.addEventListener('mousedown', (event) => event.preventDefault());
        button.addEventListener('click', () => {
          const previousHtml = content.innerHTML;
          content.focus();
          document.execCommand(button.dataset.richCommand, false);
          syncValue();
          if (content.innerHTML !== previousHtml) markEditorialChanged();
        });
      });
    });

    document.querySelectorAll('[data-editorial-list]').forEach((list) => {
      const items = list.querySelector('[data-editorial-items]');
      if (!items) return;
      const renumber = () => {
        items.querySelectorAll('.editorial-list-item').forEach((row, index) => {
          const number = row.querySelector('.editorial-item-number');
          if (number) number.textContent = `Punto ${index + 1}`;
          const textarea = row.querySelector('textarea');
          if (textarea) {
            const label = list.dataset.listName === 'pros' ? 'Punti di forza' : 'Criticità e rischi';
            textarea.setAttribute('aria-label', `${label} - punto ${index + 1}`);
          }
        });
      };
      list.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) return;
        const addButton = event.target.closest('[data-add-editorial-item]');
        if (addButton) {
          const row = document.createElement('div');
          row.className = 'editorial-list-item';
          const heading = document.createElement('div');
          heading.className = 'editorial-item-heading';
          const number = document.createElement('span');
          number.className = 'editorial-item-number';
          const label = list.dataset.listName === 'pros' ? 'Punti di forza' : 'Criticità e rischi';
          const textarea = document.createElement('textarea');
          textarea.name = `${list.dataset.listName}[]`;
          textarea.maxLength = 2000;
          textarea.setAttribute('data-review-text', '');
          textarea.setAttribute('aria-label', `${label} - punto ${items.children.length + 1}`);
          const removeButton = document.createElement('button');
          removeButton.type = 'button';
          removeButton.className = 'button secondary editorial-remove-item';
          removeButton.textContent = 'Rimuovi';
          removeButton.setAttribute('data-remove-editorial-item', '');
          heading.append(number, removeButton);
          row.append(heading, textarea);
          items.append(row);
          renumber();
          textarea.focus();
          markEditorialChanged();
          return;
        }
        const removeButton = event.target.closest('[data-remove-editorial-item]');
        if (removeButton) {
          removeButton.closest('.editorial-list-item')?.remove();
          renumber();
          markEditorialChanged();
        }
      });
    });
  });
})();
