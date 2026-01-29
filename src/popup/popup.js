const SETTINGS_KEY = 'liqa-settings-v1';
const STORAGE_KEY = 'liqa-selectors-v1';
const AI_CFG_KEY = 'liqa-ai-config-v1';
const JOBS_INDEX_KEY = 'liqa-jobs-index-v1';
const JOB_PREFIX = 'liqa-job-';
const LAST_JOB_KEY = 'liqa-last-job-index';

function $id(id) { return document.getElementById(id); }

function load() {
  chrome.storage.sync.get([SETTINGS_KEY], (data) => {
    const enabled = (data?.[SETTINGS_KEY]?.hotkeysEnabled) !== false;
    $id('hotkeysEnabled').checked = enabled;
    $id('status').textContent = enabled ? 'On' : 'Off';
    $id('hotkeysChip').textContent = enabled ? 'Hotkeys On' : 'Hotkeys Off';
    $id('hotkeysChip').className = enabled ? 'chip ok' : 'chip off';
  });
  // Page state
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    const activeOnPage = !!(tab && tab.url && tab.url.startsWith('https://www.linkedin.com/talent/hire/'));
    $id('activeChip').textContent = activeOnPage ? 'Active' : 'Inactive';
    $id('activeChip').className = activeOnPage ? 'chip ok' : 'chip off';
    // Disable tests when not on target URL
    ['testNext','testPrev','testSave','testHide','testAll'].forEach((id) => {
      $id(id).disabled = !activeOnPage;
    });
  });
  // Load jobs
  chrome.storage.local.get([JOBS_INDEX_KEY, LAST_JOB_KEY], (data) => {
    const index = data?.[JOBS_INDEX_KEY] || [];
    if (!index.length) { $id('jobSelect').innerHTML = ''; return; }
    const keys = index.map((j) => JOB_PREFIX + j.id);
    chrome.storage.local.get(keys, (rows) => {
      const jobs = keys.map((k, i) => rows[k] || { id: index[i].id, name: index[i].name, text: '' });
      const sel = $id('jobSelect');
      sel.innerHTML = '';
      jobs.forEach((j, i) => {
        const o = document.createElement('option');
        o.value = String(i); o.textContent = j.name || `Job ${i+1}`;
        sel.appendChild(o);
      });
      const last = typeof data?.[LAST_JOB_KEY] === 'number' ? data[LAST_JOB_KEY] : 0;
      if (jobs[last]) sel.value = String(last);
    });
  });
}

function save(enabled) {
  chrome.storage.sync.set({ [SETTINGS_KEY]: { hotkeysEnabled: enabled } }, () => {
    $id('status').textContent = enabled ? 'On' : 'Off';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  load();
  $id('hotkeysEnabled').addEventListener('change', (e) => save(e.target.checked));
  $id('openOptions').addEventListener('click', () => chrome.runtime.openOptionsPage());
  const test = (kind) => {
    chrome.tabs.query({ url: ["https://www.linkedin.com/talent/hire/*"] }, (tabs) => {
      if (!tabs || !tabs.length) return;
      const tab = tabs.find((t) => t.active) || tabs[0];
      chrome.storage.sync.get([STORAGE_KEY], (data) => {
        const cfg = data?.[STORAGE_KEY] || {};
        const selector = cfg[kind];
        chrome.tabs.sendMessage(tab.id, { type: 'LIQA_TEST_SELECTOR', kind, selector }, () => {
          if (!chrome.runtime.lastError) return;
          // Try inject then retry
          chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['src/content/content.js'] }, () => {
            if (chrome.runtime.lastError) return; // give up silently in popup
            chrome.tabs.sendMessage(tab.id, { type: 'LIQA_TEST_SELECTOR', kind, selector });
          });
        });
      });
    });
  };
  const testAll = () => {
    ['next','prev','save','hide'].forEach((k, i) => setTimeout(() => test(k), i * 120));
  };
  $id('testNext').addEventListener('click', () => test('next'));
  $id('testPrev').addEventListener('click', () => test('prev'));
  $id('testSave').addEventListener('click', () => test('save'));
  $id('testHide').addEventListener('click', () => test('hide'));
  $id('testAll').addEventListener('click', testAll);
  $id('scoreNow').addEventListener('click', () => scoreCurrent());
  $id('jobSelect').addEventListener('change', (e) => {
    const idx = Number(e.target.value || '0');
    chrome.storage.local.set({ [LAST_JOB_KEY]: idx });
  });
});

function scoreCurrent() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    chrome.storage.local.get([AI_CFG_KEY, JOBS_INDEX_KEY], (data) => {
      const cfg = data?.[AI_CFG_KEY] || {};
      const index = data?.[JOBS_INDEX_KEY] || [];
      const idx = Number($id('jobSelect').value || '0');
      if (!cfg.apiKey || !index[idx]) return;
      chrome.tabs.sendMessage(tab.id, { type: 'LIQA_SCORE_REQUEST', jobIndex: idx }, () => {
        if (!chrome.runtime.lastError) return;
        // Inject content script then retry
        chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['src/content/content.js'] }, () => {
          if (chrome.runtime.lastError) return;
          chrome.tabs.sendMessage(tab.id, { type: 'LIQA_SCORE_REQUEST', jobIndex: idx });
        });
      });
    });
  });
}
