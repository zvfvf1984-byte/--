(function () {
  'use strict';

  const state = {
    categoryId: 'all',
    lastIndex: -1,
    currentAffirmation: null,
    isAnimating: false,
  };

  const els = {
    categoryGrid: document.getElementById('category-grid'),
    resultCard: document.getElementById('result-card'),
    resultPlaceholder: document.getElementById('result-placeholder'),
    resultContent: document.getElementById('result-content'),
    resultCategory: document.getElementById('result-category'),
    resultText: document.getElementById('result-text'),
    resultHint: document.getElementById('result-hint'),
    btnGenerate: document.getElementById('btn-generate'),
    btnRegenerate: document.getElementById('btn-regenerate'),
    btnCopy: document.getElementById('btn-copy'),
    copyLabel: document.getElementById('copy-label'),
    embedHint: document.getElementById('embed-hint'),
    embedDialog: document.getElementById('embed-dialog'),
    embedCode: document.getElementById('embed-code'),
    btnCopyEmbed: document.getElementById('btn-copy-embed'),
  };

  function getCategory(id) {
    return AFFIRMATION_CATEGORIES.find((cat) => cat.id === id);
  }

  function renderCategories() {
    els.categoryGrid.innerHTML = AFFIRMATION_CATEGORIES.map(
      (cat) => `
        <button
          type="button"
          class="category-chip${cat.id === state.categoryId ? ' active' : ''}"
          role="tab"
          aria-selected="${cat.id === state.categoryId}"
          data-category="${cat.id}"
        >
          <span class="chip-icon" aria-hidden="true">${cat.icon}</span>
          <span class="chip-label">${cat.label}</span>
        </button>
      `
    ).join('');

    els.categoryGrid.querySelectorAll('.category-chip').forEach((chip) => {
      chip.addEventListener('click', () => selectCategory(chip.dataset.category));
    });
  }

  function selectCategory(id) {
    if (state.categoryId === id) return;
    state.categoryId = id;
    state.lastIndex = -1;
    renderCategories();
  }

  function pickAffirmation() {
    const category = getCategory(state.categoryId);

    if (state.categoryId === 'all') {
      const pool = category.affirmations;
      let index;
      do {
        index = Math.floor(Math.random() * pool.length);
      } while (pool.length > 1 && index === state.lastIndex);

      state.lastIndex = index;
      const item = pool[index];
      const sourceCat = getCategory(item.categoryId);
      return {
        text: item.text,
        categoryId: item.categoryId,
        categoryLabel: item.categoryLabel,
        hint: randomFrom(sourceCat.hints),
      };
    }

    const pool = category.affirmations;
    let index;
    do {
      index = Math.floor(Math.random() * pool.length);
    } while (pool.length > 1 && index === state.lastIndex);

    state.lastIndex = index;
    return {
      text: pool[index],
      categoryId: category.id,
      categoryLabel: category.label,
      hint: randomFrom(category.hints),
    };
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function setButtonsState(hasResult) {
    els.btnRegenerate.classList.toggle('hidden', !hasResult);
    els.btnCopy.classList.toggle('hidden', !hasResult);
    els.btnRegenerate.disabled = state.isAnimating;
    els.btnCopy.disabled = state.isAnimating || !hasResult;
    els.btnGenerate.disabled = state.isAnimating;
  }

  async function animateAffirmation(data) {
    state.isAnimating = true;
    setButtonsState(true);

    const isFirstReveal = els.resultContent.classList.contains('hidden');

    if (!isFirstReveal) {
      els.resultContent.classList.add('is-leaving');
      await wait(280);
      els.resultContent.classList.remove('is-leaving');
    } else {
      els.resultPlaceholder.classList.add('is-leaving');
      await wait(220);
      els.resultPlaceholder.classList.add('hidden');
      els.resultPlaceholder.classList.remove('is-leaving');
      els.resultContent.classList.remove('hidden');
    }

    els.resultCategory.textContent = data.categoryLabel;
    els.resultText.textContent = data.text;
    els.resultHint.textContent = data.hint;

    els.resultContent.classList.remove('is-entering');
    void els.resultContent.offsetWidth;
    els.resultContent.classList.add('is-entering');

    await wait(650);
    els.resultContent.classList.remove('is-entering');
    state.isAnimating = false;
    setButtonsState(true);
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function generate() {
    if (state.isAnimating) return;

    const data = pickAffirmation();
    state.currentAffirmation = data;
    await animateAffirmation(data);
  }

  async function copyAffirmation() {
    if (!state.currentAffirmation) return;

    const text = `«${state.currentAffirmation.text}» — ${state.currentAffirmation.categoryLabel}`;

    try {
      await navigator.clipboard.writeText(text);
      els.copyLabel.textContent = 'Скопировано!';
      els.btnCopy.classList.add('is-success');
      setTimeout(() => {
        els.copyLabel.textContent = 'Скопировать';
        els.btnCopy.classList.remove('is-success');
      }, 2000);
    } catch {
      els.copyLabel.textContent = 'Не удалось';
      setTimeout(() => {
        els.copyLabel.textContent = 'Скопировать';
      }, 2000);
    }
  }

  function openEmbedDialog(e) {
    e.preventDefault();
    const snippet = `<!-- Генератор аффирмаций -->
<iframe
  src="${window.location.href.replace(/\/[^/]*$/, '/index.html')}"
  title="Генератор аффирмаций"
  width="100%"
  height="720"
  style="border:0;border-radius:24px;max-width:560px;"
  loading="lazy"
></iframe>`;
    els.embedCode.textContent = snippet;
    els.embedDialog.showModal();
  }

  async function copyEmbedCode() {
    try {
      await navigator.clipboard.writeText(els.embedCode.textContent);
      els.btnCopyEmbed.textContent = 'Скопировано!';
      setTimeout(() => {
        els.btnCopyEmbed.textContent = 'Скопировать код';
      }, 2000);
    } catch {
      els.btnCopyEmbed.textContent = 'Ошибка копирования';
    }
  }

  function init() {
    renderCategories();
    setButtonsState(false);

    els.btnGenerate.addEventListener('click', generate);
    els.btnRegenerate.addEventListener('click', generate);
    els.btnCopy.addEventListener('click', copyAffirmation);
    els.embedHint.addEventListener('click', openEmbedDialog);
    els.btnCopyEmbed.addEventListener('click', copyEmbedCode);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
