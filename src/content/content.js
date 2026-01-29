(() => {
  const DEFAULT_SELECTORS = {
    // Prefer stable data-test selectors from Recruiter slide-in UI
    next: 'nav[data-test-ts-pagination] a[rel="next"], a[data-test-pagination-next]',
    prev: 'nav[data-test-ts-pagination] a[rel="prev"], a[data-test-pagination-previous]',
    // Save/Hide use data-live-test in the current UI; keep tight, editable defaults.
    // Target save within the main profile container to avoid right-rail similar profiles
    save: '[data-live-test-profile-container] button[data-live-test-save-to-first-stage], [data-live-test-profile-container] [data-live-test-component="save-to-pipeline-btn"] .save-to-pipeline__button',
    // Hide scoped to main profile area to avoid other hides in right rail
    hide: '[data-live-test-profile-container] button[data-live-test-component="hide-btn"]',
  };

  const STORAGE_KEY = 'liqa-selectors-v1';
  const SETTINGS_KEY = 'liqa-settings-v1';
  const MODAL_NOTE_ID = 'liqa-hint';

  function getSelectors() {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get([STORAGE_KEY], (data) => {
          const saved = data && data[STORAGE_KEY];
          resolve({ ...DEFAULT_SELECTORS, ...(saved || {}) });
        });
      } catch (e) {
        resolve(DEFAULT_SELECTORS);
      }
    });
  }

  function getSettings() {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get([SETTINGS_KEY], (data) => {
          const defaults = { hotkeysEnabled: true };
          resolve({ ...defaults, ...(data?.[SETTINGS_KEY] || {}) });
        });
      } catch (e) {
        resolve({ hotkeysEnabled: true });
      }
    });
  }

  const AREAS = {
    header: '[data-test-pagination-header]',
    main: '[data-live-test-profile-container]',
  };

  // Track last scored URL so autoscan doesn't re-run on the same candidate
  let lastScoredUrl = '';

  function pickArea(kind) {
    if (kind === 'next' || kind === 'prev') return AREAS.header;
    if (kind === 'save' || kind === 'hide') return AREAS.main;
    return null;
  }

  function queryWithin(selector, areaSelector) {
    if (areaSelector) {
      const area = document.querySelector(areaSelector);
      if (area) return area.querySelector(selector);
    }
    return document.querySelector(selector);
  }

  function clickFirst(selector, areaSelector) {
    const el = queryWithin(selector, areaSelector);
    if (el) {
      // brief neon pulse to confirm
      pulseOverlay(el, 800);
      el.click();
      return true;
    }
    return false;
  }

  function removeScoreOverlay() {
    try { window.postMessage({ type: 'LIQA_SCORE_OVERLAY_CLOSE' }, '*'); } catch (_) {}
    hideProgressBar?.();
    // Remove black box overlay
    try { document.getElementById('liqa-score')?.remove(); } catch (_) {}
    // Clean up any previously injected React overlay remnants if present
    try { document.getElementById('liqa-overlay-root')?.remove(); } catch (_) {}
    try { document.getElementById('liqa-overlay-script')?.remove(); } catch (_) {}
    try { document.getElementById('liqa-overlay-css')?.remove(); } catch (_) {}
  }

  function showToast(text, kind) {
    if (!text) return;
    let node = document.getElementById(MODAL_NOTE_ID);
    if (!node) {
      node = document.createElement('div');
      node.id = MODAL_NOTE_ID;
      Object.assign(node.style, {
        position: 'fixed',
        top: '12px',
        right: '12px',
        background: 'rgba(32, 33, 36, 0.92)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 2147483647,
        boxShadow: '0 4px 16px rgba(0,0,0,.3)',
        transition: 'opacity 160ms ease'
      });
      document.documentElement.appendChild(node);
    }
    node.textContent = text;
    // Color hint for success/error
    if (kind === 'error') {
      node.style.background = 'rgba(176, 0, 32, 0.92)';
    } else if (kind === 'ok') {
      node.style.background = 'rgba(7, 127, 50, 0.92)';
    } else {
      node.style.background = 'rgba(32, 33, 36, 0.92)';
    }
    node.style.opacity = '1';
    clearTimeout(node._t);
    node._t = setTimeout(() => (node.style.opacity = '0'), 1200);
  }

  // Neon pulse highlight (for tests)
  function ensurePulseStyles() {
    if (document.getElementById('liqa-style-pulse')) return;
    const st = document.createElement('style');
    st.id = 'liqa-style-pulse';
    st.textContent = `
      @keyframes liqa-pulse {
        0% { box-shadow: 0 0 0 2px rgba(0,255,153,.8), 0 0 10px 2px rgba(0,255,153,.6); }
        50% { box-shadow: 0 0 0 2px rgba(0,255,153,1), 0 0 24px 10px rgba(0,255,153,.95); }
        100% { box-shadow: 0 0 0 2px rgba(0,255,153,.8), 0 0 10px 2px rgba(0,255,153,.6); }
      }
    `;
    document.documentElement.appendChild(st);
  }

  function pulseOverlay(el, durationMs = 1800) {
    ensurePulseStyles();
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    const pad = 4;
    const o = document.createElement('div');
    Object.assign(o.style, {
      position: 'fixed',
      top: `${Math.max(0, r.top - pad)}px`,
      left: `${Math.max(0, r.left - pad)}px`,
      width: `${Math.max(0, r.width + pad * 2)}px`,
      height: `${Math.max(0, r.height + pad * 2)}px`,
      border: '2px solid #00ff99',
      borderRadius: '8px',
      pointerEvents: 'none',
      zIndex: 2147483647,
      animation: 'liqa-pulse 900ms ease-in-out infinite',
      boxSizing: 'border-box',
    });
    document.documentElement.appendChild(o);
    setTimeout(() => o.remove(), durationMs);
  }

  function onKeydown(selectors, e) {
    // Ignore if typing in inputs or editable areas
    const target = e.target;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return;
    }

    const key = e.key.toLowerCase();
    // Prefer actions when the Recruiter slide-in is open to avoid accidental triggers
    const inSlideIn = !!document.querySelector('.base-slidein__modal--open,[data-test-base-slidein]');
    if (key === 'd') {
      // Hide AI score overlay when navigating to next
      removeScoreOverlay();
      const area = pickArea('next');
      if (!inSlideIn && !queryWithin(selectors.next, area)) return showToast('Next not available', 'error');
      if (clickFirst(selectors.next, area)) showToast('Next candidate ▶', 'ok'); else showToast('Next button not found', 'error');
    } else if (key === 'a') {
      // Hide AI score overlay when navigating to previous
      removeScoreOverlay();
      const area = pickArea('prev');
      if (!inSlideIn && !queryWithin(selectors.prev, area)) return showToast('Previous not available', 'error');
      if (clickFirst(selectors.prev, area)) showToast('Previous candidate ◀', 'ok'); else showToast('Previous button not found', 'error');
    } else if (key === 's') {
      const area = pickArea('save');
      if (!inSlideIn && !queryWithin(selectors.save, area)) return showToast('Save not available', 'error');
      if (clickFirst(selectors.save, area)) showToast('Saved ✓', 'ok'); else showToast('Save button not found', 'error');
    } else if (key === 'w') {
      const area = pickArea('hide');
      // Prefer hide button in the same action group as Save
      let clicked = false;
      try {
        const areaNode = document.querySelector(area || '');
        const saveBtn = areaNode ? areaNode.querySelector(selectors.save) : document.querySelector(selectors.save);
        if (saveBtn) {
          const group = saveBtn.closest('.shared-action-buttons, .profile-item-actions, .profile-item-actions__act');
          const hideBtn = group ? group.querySelector('button[data-live-test-component="hide-btn"]') : null;
          if (hideBtn) {
            pulseOverlay(hideBtn, 800);
            hideBtn.click();
            showToast('Hidden ✕', 'ok');
            clicked = true;
          }
        }
      } catch (_) {}
      if (!clicked) {
        if (!inSlideIn && !queryWithin(selectors.hide, area)) return showToast('Hide not available', 'error');
        if (clickFirst(selectors.hide, area)) showToast('Hidden ✕', 'ok'); else showToast('Hide button not found', 'error');
      }
    } else if (key === 'q') {
      // Quick AI evaluation
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch (_) {}
      removeScoreOverlay();
      // Use last selected job index if available
      try {
        chrome.storage.local.get(['liqa-last-job-index'], (d)=>{
          const idx = typeof d?.['liqa-last-job-index'] === 'number' ? d['liqa-last-job-index'] : 0;
          scoreCurrent(idx);
        })
      } catch (_) { scoreCurrent(0); }
    }
  }

  let detach = null;
  async function init() {
    const [selectors, settings] = await Promise.all([getSelectors(), getSettings()]);
    const handler = (e) => {
      if (!settings.hotkeysEnabled) return;
      onKeydown(selectors, e);
    };
    window.addEventListener('keydown', handler, true);
    detach = () => window.removeEventListener('keydown', handler, true);

    // Watch for selector changes and rebind
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync' || !changes[STORAGE_KEY]) return;
        const nextSelectors = { ...DEFAULT_SELECTORS, ...(changes[STORAGE_KEY].newValue || {}) };
        if (detach) detach();
        const newHandler = (e) => {
          if (!settings.hotkeysEnabled) return;
          onKeydown(nextSelectors, e);
        };
        window.addEventListener('keydown', newHandler, true);
        detach = () => window.removeEventListener('keydown', newHandler, true);
        showToast('Selectors updated');
      });
    } catch (_) {}

    // Hotkey enable/disable live updates
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync' || !changes[SETTINGS_KEY]) return;
        const { newValue } = changes[SETTINGS_KEY];
        const enabled = newValue?.hotkeysEnabled !== false;
        settings.hotkeysEnabled = enabled;
        showToast(enabled ? 'Hotkeys enabled' : 'Hotkeys disabled');
      });
    } catch (_) {}
  }

  // Optional on-page legend shown when slide-in is open
  function ensureLegend() {
    try {
      chrome.storage.sync.get([SETTINGS_KEY], (data) => {
        const enabled = (data?.[SETTINGS_KEY]?.legendEnabled) !== false;
        if (!enabled) return;
        if (!document.querySelector('.base-slidein__modal--open,[data-test-base-slidein]')) return;
        if (document.getElementById('liqa-legend')) return;
        const box = document.createElement('div');
        box.id = 'liqa-legend';
        Object.assign(box.style, {
          position: 'fixed', bottom: '12px', right: '12px',
          background: 'rgba(32,33,36,.9)', color: '#fff', padding: '6px 8px',
          borderRadius: '8px', fontSize: '12px', zIndex: 2147483647,
          display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.3)'
        });
        const span = (t) => { const s = document.createElement('span'); s.textContent = t; s.style.opacity = '.9'; return s; };
        const k = (t) => { const s = document.createElement('span'); s.textContent = t; s.style.fontFamily = 'ui-monospace,Menlo,monospace'; s.style.background = 'rgba(255,255,255,.1)'; s.style.padding = '1px 4px'; s.style.borderRadius = '4px'; s.style.border = '1px solid rgba(255,255,255,.2)'; return s; };
        box.append(k('A'), span('Prev'), k('D'), span('Next'), k('S'), span('Save'), k('W'), span('Hide'), k('Q'), span('Score'));
        document.documentElement.appendChild(box);
      });
    } catch (_) {}
  }

  // Observe slide-in open/close to show legend
  const mo = new MutationObserver(() => { ensureLegend(); injectEvaluateCTA(); });
  try {
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true });
  } catch (_) {}

  // Receive selector test messages from options page
  try {
    chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
      if (msg?.type !== 'LIQA_TEST_SELECTOR') return;
      const { kind } = msg;
      (async () => {
        let sel = (typeof msg.selector === 'string' && msg.selector.trim()) ? msg.selector.trim() : '';
        if (!sel) {
          try {
            const all = await getSelectors();
            sel = all?.[kind] || '';
          } catch (_) {}
        }
        if (!sel) {
          showToast(`No selector configured for ${kind}`, 'error');
          return;
        }
        try {
          const nodes = Array.from(document.querySelectorAll(sel));
          if (!nodes.length) { showToast(`No match for ${kind}`, 'error'); return; }
          nodes.slice(0, 6).forEach((el) => pulseOverlay(el, 2000));
          showToast(`Matched ${nodes.length} for ${kind}`, 'ok');
        } catch (e) {
          showToast('Invalid selector syntax', 'error');
        }
      })();
      // No async response needed; do not return true.
    });
  } catch (_) {}

  // ----- AI scoring overlay -----
  const AI_CFG_KEY = 'liqa-ai-config-v1';
  const JOBS_INDEX_KEY = 'liqa-jobs-index-v1';
  const JOB_PREFIX = 'liqa-job-';
  const LAST_JOB_KEY = 'liqa-last-job-index';

  // Minimal, CSS-free fallback overlay styled inline (similar to legend/pulse overlays)
  function ensureBasicScoreOverlay() {
    if (document.getElementById('liqa-score')) return;
    const wrap = document.createElement('div');
    wrap.id = 'liqa-score';
    Object.assign(wrap.style, {
      position: 'fixed', top: '64px', right: '16px',
      background: 'rgba(32,33,36,.96)', color: '#fff',
      borderRadius: '12px', padding: '12px 14px',
      width: '360px', maxWidth: 'min(92vw, 420px)',
      boxShadow: '0 12px 32px rgba(0,0,0,.45)',
      zIndex: 2147483647, fontSize: '12px', lineHeight: '1.5'
    });
    const header = document.createElement('div');
    header.style.display = 'flex'; header.style.justifyContent = 'space-between'; header.style.alignItems = 'center'; header.style.marginBottom = '6px';
    const title = document.createElement('div'); title.textContent = 'Match Score: …'; title.style.fontSize = '14px'; title.style.fontWeight = '600';
    const close = document.createElement('button'); close.textContent = '×'; Object.assign(close.style, {
      background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.2)', width: '22px', height: '22px',
      borderRadius: '999px', cursor: 'pointer', lineHeight: '18px'
    });
    close.addEventListener('click', () => removeScoreOverlay());
    header.append(title, close);

    const barOuter = document.createElement('div');
    Object.assign(barOuter.style, { height: '8px', borderRadius: '999px', overflow: 'hidden', background: 'rgba(255,255,255,.08)', marginBottom: '8px' });
    const barInner = document.createElement('div'); Object.assign(barInner.style, { height: '100%', width: '0%', background: '#ef4444', transition: 'width .25s ease' });
    barOuter.appendChild(barInner);

    const strengthsT = document.createElement('div'); strengthsT.textContent = 'Strengths'; strengthsT.style.fontWeight = '600'; strengthsT.style.margin = '6px 0 2px';
    const strengths = document.createElement('ul'); strengths.style.margin = '0 0 6px 18px'; strengths.style.padding = '0'; strengths.style.listStyle = 'disc';
    const weaknessesT = document.createElement('div'); weaknessesT.textContent = 'Weaknesses'; weaknessesT.style.fontWeight = '600'; weaknessesT.style.margin = '6px 0 2px';
    const weaknesses = document.createElement('ul'); weaknesses.style.margin = '0 0 0 18px'; weaknesses.style.padding = '0'; weaknesses.style.listStyle = 'disc';

    wrap.append(header, barOuter, strengthsT, strengths, weaknessesT, weaknesses);
    document.documentElement.appendChild(wrap);

    // Store nodes for updates
    wrap.__liqa = { title, barInner, strengths, weaknesses };
  }

  // Listen to overlay update messages and apply to fallback UI as well
  window.addEventListener('message', (e) => {
    if (e?.data?.type !== 'LIQA_SCORE_OVERLAY_UPDATE') return;
    const box = document.getElementById('liqa-score');
    if (!box || !box.__liqa) return;
    const { title, barInner, strengths, weaknesses } = box.__liqa;
    const sc = e.data.score;
    if (typeof sc !== 'undefined') {
      const n = Math.max(0, Math.min(100, Number(sc)));
      title.textContent = `Match Score: ${Number.isFinite(n) ? n : '…'}`;
      barInner.style.width = `${Number.isFinite(n) ? n : 0}%`;
      // color ramp
      barInner.style.background = n>=70 ? '#16a34a' : n>=40 ? '#f59e0b' : '#ef4444';
    }
    if (Array.isArray(e.data.strengths)) {
      while (strengths.firstChild) strengths.removeChild(strengths.firstChild);
      e.data.strengths.forEach((t)=>{ const li=document.createElement('li'); li.textContent=t; strengths.appendChild(li); });
    }
    if (Array.isArray(e.data.weaknesses)) {
      while (weaknesses.firstChild) weaknesses.removeChild(weaknesses.firstChild);
      e.data.weaknesses.forEach((t)=>{ const li=document.createElement('li'); li.textContent=t; weaknesses.appendChild(li); });
    }
  });
  function extractProfileText() {
    const container = document.querySelector('[data-live-test-profile-container]');
    if (!container) return '';
    // Grab meaningful text chunks
    const selectors = [
      '.pagination-header__header-text',
      '[data-test-row-lockup-full-name]',
      '[data-test-row-lockup-headline]',
      '[data-test-summary-card-text]',
      '[data-test-position-list-container]',
      '[data-test-education-item]'
    ];
    const texts = [];
    selectors.forEach((sel) => container.querySelectorAll(sel).forEach((n) => texts.push(n.innerText || '')));
    return texts.filter(Boolean).join('\n\n');
  }

  // Resolve overlay asset filenames from built index so we don't hardcode hashes
  let __liqaOverlayAssets = null;
  async function resolveOverlayAssets() {
    if (__liqaOverlayAssets) return __liqaOverlayAssets;
    try {
      const url = chrome.runtime.getURL('dist/src/overlay/index.html');
      const res = await fetch(url);
      const html = await res.text();
      const cssMatch = html.match(/href=\"..\/..\/assets\/([^\"]+\.css)\"/);
      const jsMatch = html.match(/src=\"..\/..\/assets\/([^\"]+overlay-[^\"]+\.js)\"/);
      const css = cssMatch ? `dist/assets/${cssMatch[1]}` : 'dist/assets/button-DC1B905R.css';
      const js = jsMatch ? `dist/assets/${jsMatch[1]}` : 'dist/assets/overlay-_ecWJeN1.js';
      __liqaOverlayAssets = { css, js };
    } catch (_) {
      __liqaOverlayAssets = { css: 'dist/assets/button-DC1B905R.css', js: 'dist/assets/overlay-_ecWJeN1.js' };
    }
    return __liqaOverlayAssets;
  }

  async function ensureScoreOverlay() {
    // Per request, keep only the inline black box overlay; do not inject React bundle
    ensureBasicScoreOverlay();
    return document.getElementById('liqa-score');
  }

  async function readSystemPrompt() {
    try {
      // Prefer user-configured systemPrompt; fallback to bundled prompt file
      const cfg = await new Promise((resolve)=> chrome.storage.local.get(['liqa-ai-config-v1'], d=> resolve(d?.['liqa-ai-config-v1'] || {})))
      const user = (cfg && typeof cfg.systemPrompt === 'string' && cfg.systemPrompt.trim()) ? cfg.systemPrompt : ''
      if (user) return user
      const res = await fetch(chrome.runtime.getURL('dist/src/ai/system-prompt.txt'));
      if (!res.ok) throw new Error('Prompt not found');
      return await res.text();
    } catch (_) {
      // Load fallback prompt from file
      try {
        const res = await fetch(chrome.runtime.getURL('dist/src/ai/fallback-prompt.txt'));
        if (res.ok) return await res.text();
      } catch (_) {}
      return 'You are an expert recruiter. Score candidates 0-100 based on role fit and impact profile. Return JSON with keys: score (0-100), strengths (array), weaknesses (array).';
    }
  }

  async function readUserPromptTemplate() {
    try {
      const res = await fetch(chrome.runtime.getURL('dist/src/ai/user-prompt-template.txt'));
      if (!res.ok) throw new Error('Template not found');
      return await res.text();
    } catch (_) {
      return `Job Description:\n{{JOB_DESCRIPTION}}\n\nImpact Profile:\n{{IMPACT_PROFILE}}\n\nCandidate Profile:\n{{CANDIDATE_PROFILE}}\n\nRespond in strict JSON. If you return Markdown or text, still ensure a valid JSON block exists.`;
    }
  }

  function buildUserPrompt(template, jobText, impactProfile, candidateProfile) {
    return template
      .replace('{{JOB_DESCRIPTION}}', jobText)
      .replace('{{IMPACT_PROFILE}}', impactProfile)
      .replace('{{CANDIDATE_PROFILE}}', candidateProfile);
  }

  async function callOpenAI(apiKey, model, systemPrompt, userContent) {
    const chosenModel = model || 'gpt-4o-mini';
    const payload = {
      model: chosenModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.2
    };
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('OpenAI error');
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    return text;
  }

  function showProgressBar() {
    if (document.getElementById('liqa-progress')) return;
    const bar = document.createElement('div');
    bar.id = 'liqa-progress';
    const css = document.createElement('style');
    css.id = 'liqa-progress-style';
    css.textContent = `
      @keyframes liqa-rainbow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    Object.assign(bar.style, {
      position: 'fixed', top: '0', left: '0', right: '0', height: '8px',
      background: 'linear-gradient(90deg, #ff3d71, #ffa000, #ffd600, #00e676, #00b0ff, #7c4dff)',
      backgroundSize: '400% 100%',
      animation: 'liqa-rainbow 2s ease-in-out infinite',
      zIndex: 2147483647
    });
    document.documentElement.appendChild(css);
    document.documentElement.appendChild(bar);
  }

  function hideProgressBar() {
    document.getElementById('liqa-progress')?.remove();
    document.getElementById('liqa-progress-style')?.remove();
  }

  // Quick in-page button to trigger scoring without opening popup
  function injectEvaluateCTA() {
    // Prefer putting the CTA near the header actions; fallback to floating
    const header = document.querySelector('[data-test-pagination-header]');
    if (header && !document.getElementById('liqa-eval-cta')) {
      const btn = document.createElement('button');
      btn.id = 'liqa-eval-cta';
      btn.textContent = 'Evaluate Fit';
      btn.setAttribute('aria-label', 'Evaluate candidate fit');
      Object.assign(btn.style, {
        marginLeft: '8px', padding: '8px 12px', borderRadius: '999px',
        border: '1px solid rgba(255,255,255,.16)',
        background: 'linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02))',
        color: 'inherit', fontSize: '12px', cursor: 'pointer'
      });
      btn.addEventListener('click', () => scoreCurrent());
      header.appendChild(btn);
      // Remove floating if exists
      document.getElementById('liqa-score-btn')?.remove();
      return;
    }
    // Fallback floating pill if header not present
    ensureScoreButton();
  }

  function ensureScoreButton() {
    const slideOpen = !!document.querySelector('.base-slidein__modal--open,[data-test-base-slidein]');
    const existing = document.getElementById('liqa-score-btn');
    if (!slideOpen) { existing?.remove(); return; }
    const legend = document.getElementById('liqa-legend');
    const offsetPx = legend ? (legend.getBoundingClientRect().height + 24) : 16;
    if (existing) {
      existing.style.bottom = offsetPx + 'px';
      return;
    }
    const btn = document.createElement('button');
    btn.id = 'liqa-score-btn';
    btn.textContent = 'AI Score';
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: offsetPx + 'px',
      right: '16px',
      padding: '8px 12px',
      borderRadius: '999px',
      border: '1px solid rgba(255,255,255,.2)',
      background: 'rgba(32,33,36,.92)',
      color: '#fff',
      fontSize: '12px',
      zIndex: 2147483647,
      boxShadow: '0 4px 16px rgba(0,0,0,.3)',
      cursor: 'pointer'
    });
    btn.title = 'Score this candidate (Cmd/Ctrl+Shift+F)';
    btn.addEventListener('click', () => scoreCurrent());
    document.documentElement.appendChild(btn);
  }

  async function scoreCurrent(jobIndex) {
    const profile = extractProfileText();
    if (!profile) { showToast('Cannot read profile', 'error'); return; }
    chrome.storage.local.get([AI_CFG_KEY, JOBS_INDEX_KEY, LAST_JOB_KEY], async (data) => {
      const cfg = data?.[AI_CFG_KEY] || {};
      const apiKey = cfg.apiKey;
      const impact = cfg.impactProfile || '';
      const index = data?.[JOBS_INDEX_KEY] || [];
      const chosen = typeof jobIndex === 'number' ? jobIndex : (typeof data?.[LAST_JOB_KEY] === 'number' ? data[LAST_JOB_KEY] : 0);
      const idxEntry = index[chosen];
      if (!apiKey || !idxEntry) { showToast('AI not configured', 'error'); return; }
      const jobKey = JOB_PREFIX + idxEntry.id;
      const jobData = await new Promise((resolve) => chrome.storage.local.get([jobKey], (d) => resolve(d?.[jobKey])));
      const job = jobData || { name: idxEntry.name || 'Job', text: '' };
      if (!job.text) { showToast('Job description missing', 'error'); return; }

      // Ensure at least a minimal styled overlay exists; also attempt React bundle
      ensureBasicScoreOverlay();
      await ensureScoreOverlay();
      window.postMessage({ type: 'LIQA_SCORE_OVERLAY_UPDATE', score: '…' }, '*');
      showProgressBar();

      const sys = await readSystemPrompt();
      const userTemplate = await readUserPromptTemplate();
      const user = buildUserPrompt(userTemplate, job.text, impact, profile);
      try {
        const text = await callOpenAI(apiKey, (cfg.model || 'gpt-4o-mini'), sys, user);
        // Try to parse JSON from content; if not available, attempt to coerce
        const match = text && text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('No JSON found');
        const json = JSON.parse(match[0]);
        const score = Math.max(0, Math.min(100, Number(json.score || 0)));
        window.postMessage({ type: 'LIQA_SCORE_OVERLAY_UPDATE', score, strengths: json.strengths || [], weaknesses: json.weaknesses || [] }, '*');
      } catch (e) {
        try {
          // Attempt a fallback structure if provider returned direct JSON object
          const data = JSON.parse(e?.message || '{}');
          if (data && typeof data.score !== 'undefined') {
            const score = Math.max(0, Math.min(100, Number(data.score || 0)));
            window.postMessage({ type: 'LIQA_SCORE_OVERLAY_UPDATE', score, strengths: data.strengths || [], weaknesses: data.weaknesses || [] }, '*');
          } else {
            window.postMessage({ type: 'LIQA_SCORE_OVERLAY_UPDATE', score: 'error' }, '*');
            showToast('Scoring failed', 'error');
          }
        } catch (_) {
          window.postMessage({ type: 'LIQA_SCORE_OVERLAY_UPDATE', score: 'error' }, '*');
          showToast('Scoring failed', 'error');
        }
      } finally {
        hideProgressBar();
      }
    });
  }

  // Auto-scan profiles
  let autoscanTimer = null;
  function maybeAutoScan() {
    // Throttle to avoid running during rapid DOM mutations/navigation
    if (autoscanTimer) return;
    autoscanTimer = setTimeout(() => { autoscanTimer = null; _maybeAutoScanCore(); }, 150);
  }

  function _maybeAutoScanCore() {
    const slideOpen = !!document.querySelector('.base-slidein__modal--open,[data-test-base-slidein]');
    if (!slideOpen) return;
    const url = location.href;
    if (url === lastScoredUrl) return;
    try {
      if (!chrome?.runtime?.id || !chrome?.storage?.local?.get) return;
      chrome.storage.local.get(['liqa-ai-config-v1'], (data) => {
        const cfg = data?.['liqa-ai-config-v1'] || {};
        if (cfg.autoScan) {
          lastScoredUrl = url;
          scoreCurrent();
        }
      });
    } catch (_) { /* ignore invalidated context */ }
  }
  const autoMo = new MutationObserver(() => maybeAutoScan());
  try { autoMo.observe(document.documentElement, { subtree: true, childList: true, attributes: true }); } catch (_) {}

  // Also hide overlay when user clicks paginator
  document.addEventListener('click', (e) => {
    const t = (e.target && (e.target.closest?.('a[rel="next"],a[rel="prev"],a[data-test-pagination-next],a[data-test-pagination-previous]')));
    if (t) {
      removeScoreOverlay();
      // force autoscan to consider new candidate
      lastScoredUrl = '';
    }
  }, true);

  // command from popup/background to score
  try {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg?.type === 'LIQA_SCORE_REQUEST') {
        const idx = typeof msg.jobIndex === 'number' ? msg.jobIndex : 0;
        scoreCurrent(idx);
      }
    });
  } catch (_) {}

  // Delay a bit to avoid interfering with site boot
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 500);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
  }
})();
