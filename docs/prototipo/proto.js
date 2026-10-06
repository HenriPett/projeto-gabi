// Protótipo estático — comportamento mínimo para validar interação. Não é código de produção.
(function () {
  const sprite = `
  <svg xmlns="http://www.w3.org/2000/svg" style="display:none">
    <symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></symbol>
    <symbol id="i-arrow-down" viewBox="0 0 24 28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v22M5 17l7 7 7-7"/></symbol>
    <symbol id="i-ext" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4 10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></symbol>
    <symbol id="i-trophy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 20h8"/></symbol>
    <symbol id="i-warn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20L12 3zM12 10v4M12 17.5v.01"/></symbol>
    <symbol id="i-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/></symbol>
    <symbol id="i-star" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></symbol>
    <symbol id="i-coin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/></symbol>
    <symbol id="i-book" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13"/></symbol>
    <symbol id="i-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
    <symbol id="i-layers" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5zM3 13l9 5 9-5"/></symbol>
    <symbol id="i-air" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7"/></symbol>
    <symbol id="i-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/></symbol>
    <symbol id="i-hand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11V5a1.5 1.5 0 0 1 3 0v5M10 10V4a1.5 1.5 0 0 1 3 0v6M13 10V5a1.5 1.5 0 0 1 3 0v6M16 11V8a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2.5-4a1.5 1.5 0 0 1 2.5-1.7L7 14"/></symbol>
    <symbol id="i-tooth" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 5c-2-2-7-2-7 3 0 3 1.5 4 2 7s1 6 2.5 6S11 15 12 15s1 6 2.5 6S16.5 18 17 15s2-4 2-7c0-5-5-5-7-3z"/></symbol>
    <symbol id="bottle" viewBox="0 0 80 140"><rect x="30" y="4" width="20" height="22" rx="3" fill="#5E2280"/><rect x="26" y="24" width="28" height="10" rx="2" fill="#4A1A63"/><path d="M20 40c0-4 4-6 8-6h24c4 0 8 2 8 6v88c0 5-4 8-8 8H28c-4 0-8-3-8-8z" fill="#fff" stroke="#B9A0D6" stroke-width="2"/><rect x="20" y="62" width="40" height="44" fill="#EFE8F7"/><rect x="26" y="72" width="28" height="4" rx="2" fill="#5E2280"/><rect x="26" y="82" width="20" height="3" rx="1.5" fill="#B9A0D6"/><rect x="26" y="90" width="24" height="3" rx="1.5" fill="#B9A0D6"/></symbol>
  </svg>`;
  document.body.insertAdjacentHTML('afterbegin', sprite);

  const header = document.querySelector('[data-header]');
  if (header) {
    header.outerHTML = `
    <a class="skip" href="#main">Pular para o conteúdo</a>
    <div class="proto-flag">PROTÓTIPO — todos os produtos, preços e protocolos aqui são <strong>fictícios</strong>. Spec: DESIGN.md</div>
    <header class="header">
      <div class="container header__inner">
        <div class="header__row">
          <a class="logo" href="index.html"><span class="logo__mark" aria-hidden="true">SA</span>Sistemas Adesivos</a>
          <a class="btn btn--secondary compare-link" href="comparar.html" style="min-height:36px;font-size:13px">Comparar (<span data-cmp-count>0</span>)</a>
        </div>
        <div class="search" role="search">
          <label for="q" class="sr-only">Pesquisar sistema, marca ou produto</label>
          <svg class="search__icon" aria-hidden="true"><use href="#i-search"/></svg>
          <input id="q" type="search" placeholder="Pesquisar sistema, marca ou produto" autocomplete="off"
            role="combobox" aria-expanded="false" aria-controls="search-listbox" aria-autocomplete="list">
          <kbd class="search__kbd" aria-hidden="true">/</kbd>
          <ul class="suggest" id="search-listbox" role="listbox" aria-label="Sugestões"></ul>
        </div>
        <nav class="header__nav" aria-label="Principal">
          <a href="index.html#classificacao">Classificação</a>
          <a href="comparar.html">Comparar (<span data-cmp-count>0</span>)</a>
          <a href="index.html#guia">Guia</a>
        </nav>
      </div>
    </header>`;
  }

  // Busca com sugestões (dados fictícios)
  const data = [
    { t: 'Categorias', items: [['Convencionais › 2 passos', 'categoria.html'], ['Convencionais › 3 passos', 'categoria.html'], ['Autocondicionantes › 1 passo', 'categoria.html'], ['Universais › Condicionamento seletivo', 'universal.html']] },
    { t: 'Produtos', items: [['Adesivo Exemplo A — Fabricante 1', 'produto.html'], ['Adesivo Exemplo B — Fabricante 2', 'produto.html'], ['Universal Exemplo U — Fabricante 3', 'universal.html']] },
    { t: 'Componentes', items: [['MDP — 4 produtos', 'categoria.html'], ['HEMA — 9 produtos', 'categoria.html']] },
  ];
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const input = document.getElementById('q');
  const box = document.getElementById('search-listbox');
  let active = -1;
  function render() {
    const q = norm(input.value.trim());
    active = -1;
    if (!q) { box.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); return; }
    let html = '', i = 0;
    data.forEach(g => {
      const hits = g.items.filter(([l]) => norm(l).includes(q));
      if (!hits.length) return;
      html += `<li class="suggest__grp" role="presentation">${g.t}</li>`;
      hits.forEach(([l, h]) => {
        const n = norm(l), k = n.indexOf(q);
        const lab = l.slice(0, k) + '<mark>' + l.slice(k, k + q.length) + '</mark>' + l.slice(k + q.length);
        html += `<li role="option" id="opt-${i++}" aria-selected="false"><a class="suggest__item" href="${h}" tabindex="-1">${lab}</a></li>`;
      });
    });
    box.innerHTML = html || `<li class="suggest__item" role="option" aria-disabled="true">Nada encontrado para “${input.value}”. Tente o nome comercial, o fabricante, “MDP” ou “2 passos”.</li>`;
    box.classList.add('open'); input.setAttribute('aria-expanded', 'true');
  }
  if (input) {
    input.addEventListener('input', render);
    input.addEventListener('keydown', e => {
      const opts = [...box.querySelectorAll('[role=option][id]')];
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (!opts.length) return;
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
        opts.forEach((o, j) => o.setAttribute('aria-selected', j === active));
        opts.forEach((o, j) => o.firstChild.setAttribute('aria-selected', j === active));
        input.setAttribute('aria-activedescendant', opts[active].id);
      } else if (e.key === 'Enter' && active >= 0) { location.href = opts[active].firstChild.href; }
      else if (e.key === 'Escape') { input.value = ''; render(); }
    });
    document.addEventListener('click', e => { if (!e.target.closest('.search')) { box.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', e => { if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); input.focus(); } });
  }

  // Comparação (persistida em localStorage, protegido)
  const KEY = 'proto-compare';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };
  const tray = document.querySelector('.tray');
  function sync() {
    const sel = read();
    document.querySelectorAll('[data-cmp]').forEach(b => {
      const on = sel.includes(b.dataset.cmp);
      b.setAttribute('aria-pressed', on);
      b.querySelector('span').textContent = on ? '✓' : '+';
      b.closest('.pcard')?.classList.toggle('is-selected', on);
    });
    document.querySelectorAll('[data-cmp-count]').forEach(n => n.textContent = sel.length);
    if (tray) {
      tray.classList.toggle('open', sel.length > 0);
      tray.querySelector('.tray__thumbs').innerHTML = sel.map(() => '<span><svg width="16" height="28"><use href="#bottle"/></svg></span>').join('');
      tray.querySelector('.tray__count').textContent = `${sel.length} de 4 selecionados`;
      const go = tray.querySelector('.btn');
      if (sel.length < 2) { go.setAttribute('aria-disabled', 'true'); go.textContent = 'Selecione mais 1'; }
      else { go.removeAttribute('aria-disabled'); go.textContent = 'Comparar'; }
    }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-cmp]'); if (!b) return;
    let sel = read(); const id = b.dataset.cmp;
    if (sel.includes(id)) sel = sel.filter(x => x !== id);
    else if (sel.length >= 4) { document.getElementById('live').textContent = 'Limite de 4 produtos na comparação'; return; }
    else sel.push(id);
    write(sel); sync();
    document.getElementById('live').textContent = `${sel.length} produtos na comparação`;
  });
  document.addEventListener('click', e => { const a = e.target.closest('[aria-disabled="true"]'); if (a) e.preventDefault(); });
  sync();

  // Seletor de estratégia (universal.html)
  const radios = [...document.querySelectorAll('[role=radio]')];
  function choose(r, focus) {
    if (r.getAttribute('aria-disabled') === 'true') return;
    radios.forEach(x => { x.setAttribute('aria-checked', x === r); x.tabIndex = x === r ? 0 : -1; });
    document.querySelectorAll('[data-strategy-panel]').forEach(p => p.hidden = p.dataset.strategyPanel !== r.dataset.value);
    document.querySelectorAll('[data-path]').forEach(p => p.classList.toggle('is-current', p.dataset.path === r.dataset.value));
    const live = document.getElementById('usage-live');
    if (live) live.textContent = `Protocolo: ${r.textContent.trim()}, ${document.querySelector(`[data-strategy-panel="${r.dataset.value}"]`).querySelectorAll('.ustep').length} etapas`;
    try { history.replaceState(null, '', '?estrategia=' + r.dataset.value); } catch {}
    if (focus) r.focus();
  }
  radios.forEach(r => {
    r.addEventListener('click', () => choose(r));
    r.addEventListener('keydown', e => {
      if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
      e.preventDefault();
      const en = radios.filter(x => x.getAttribute('aria-disabled') !== 'true');
      const i = en.indexOf(r); choose(en[(i + (e.key === 'ArrowRight' ? 1 : -1) + en.length) % en.length], true);
    });
  });

  // Destacar diferenças (comparar.html)
  const diff = document.getElementById('only-diff');
  if (diff) diff.addEventListener('click', () => {
    const on = diff.getAttribute('aria-pressed') !== 'true';
    diff.setAttribute('aria-pressed', on);
    document.querySelector('.cmp').classList.toggle('only-diff', on);
  });
})();
