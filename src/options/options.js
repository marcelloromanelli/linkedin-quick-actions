const STORAGE_KEY = 'liqa-selectors-v1';
const SETTINGS_KEY = 'liqa-settings-v1';
const AI_CFG_KEY = 'liqa-ai-config-v1';
const JOBS_INDEX_KEY = 'liqa-jobs-index-v1';
const JOB_PREFIX = 'liqa-job-';
const LAST_JOB_KEY = 'liqa-last-job-index';

const DEFAULTS = {
  next: 'nav[data-test-ts-pagination] a[rel="next"], a[data-test-pagination-next]',
  prev: 'nav[data-test-ts-pagination] a[rel="prev"], a[data-test-pagination-previous]',
  // Restrict save to main profile area to avoid Similar Profiles
  save: '[data-live-test-profile-container] button[data-live-test-save-to-first-stage], [data-live-test-profile-container] [data-live-test-component="save-to-pipeline-btn"] .save-to-pipeline__button',
  // Restrict hide to main profile action group
  hide: '[data-live-test-profile-container] button[data-live-test-component="hide-btn"]',
};

function $id(id) { return document.getElementById(id); }

function load() {
  chrome.storage.sync.get([STORAGE_KEY, SETTINGS_KEY], (data) => {
    const saved = data && data[STORAGE_KEY];
    const vals = { ...DEFAULTS, ...(saved || {}) };
    $id('next').value = vals.next || '';
    $id('prev').value = vals.prev || '';
    $id('save').value = vals.save || '';
    $id('hide').value = vals.hide || '';
    const settings = data?.[SETTINGS_KEY] || { hotkeysEnabled: true, legendEnabled: true };
    $id('hotkeysEnabled').checked = settings.hotkeysEnabled !== false;
    $id('legendEnabled').checked = settings.legendEnabled !== false;

    // AI (from local storage)
    chrome.storage.local.get([AI_CFG_KEY, JOBS_INDEX_KEY], (ldata) => {
  const cfg = ldata?.[AI_CFG_KEY] || { apiKey: '', impactProfile: '', autoScan: false, model: 'gpt-5-medium', systemPrompt: '' };
      $id('apiKey').value = cfg.apiKey || '';
      $id('impactProfile').value = cfg.impactProfile || '';
      $id('autoScan').checked = !!cfg.autoScan;
      // Models
      initModelSelect(cfg);
      const index = ldata?.[JOBS_INDEX_KEY] || [];
      loadAndRenderJobs(index);
    });
  });
}

function save() {
  const payload = {
    next: $id('next').value.trim(),
    prev: $id('prev').value.trim(),
    save: $id('save').value.trim(),
    hide: $id('hide').value.trim(),
  };
  const settings = {
    hotkeysEnabled: $id('hotkeysEnabled').checked,
    legendEnabled: $id('legendEnabled').checked,
  };
  chrome.storage.sync.set({ [STORAGE_KEY]: payload, [SETTINGS_KEY]: settings }, () => {
    showToast('Saved');
  });
}

function resetDefaults() {
  chrome.storage.sync.set({ [STORAGE_KEY]: DEFAULTS, [SETTINGS_KEY]: { hotkeysEnabled: true, legendEnabled: true } }, () => {
    load();
    showToast('Defaults restored');
  });
}

// Testing helpers: send a message to active tab to highlight matches
function sendTestMessage(kind) {
  // Find a Recruiter tab to target, even if Options window is active
  chrome.tabs.query({ url: ["https://www.linkedin.com/talent/hire/*"] }, (tabs) => {
    if (!tabs || !tabs.length) return showToast('Open a LinkedIn Recruiter tab to test');
    // Prefer active tab in last focused window
    const activeTab = tabs.find((t) => t.active) || tabs[0];
    chrome.storage.sync.get([STORAGE_KEY], (data) => {
      const cfg = { ...DEFAULTS, ...(data?.[STORAGE_KEY] || {}) };
      // Try to ping content script; if missing, inject it on-demand
      chrome.tabs.sendMessage(activeTab.id, { type: 'LIQA_TEST_SELECTOR', kind, selector: cfg[kind] }, () => {
        if (!chrome.runtime.lastError) return; // success
        // Inject content script dynamically
        try {
          chrome.scripting.executeScript(
            { target: { tabId: activeTab.id }, files: ['src/content/content.js'] },
            () => {
              if (chrome.runtime.lastError) {
                showToast('Injection failed. Try reloading the tab.');
                return;
              }
              // Retry after injection
              chrome.tabs.sendMessage(activeTab.id, { type: 'LIQA_TEST_SELECTOR', kind, selector: cfg[kind] });
            }
          );
        } catch (e) {
          showToast('Cannot inject script. Check extension permissions.');
        }
      });
    });
  });
}

function showToast(text) {
  const t = $id('toast');
  t.textContent = text;
  t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(() => (t.style.opacity = '0'), 1200);
}

document.addEventListener('DOMContentLoaded', () => {
  load();
  $id('saveBtn').addEventListener('click', save);
  $id('reset').addEventListener('click', resetDefaults);
  $id('testNext').addEventListener('click', () => sendTestMessage('next'));
  $id('testPrev').addEventListener('click', () => sendTestMessage('prev'));
  $id('testSave').addEventListener('click', () => sendTestMessage('save'));
  $id('testHide').addEventListener('click', () => sendTestMessage('hide'));
  $id('addJob').addEventListener('click', addJob);
  $id('saveAI').addEventListener('click', saveAI);
  if ($id('loadDefaultPrompt')) {
    $id('loadDefaultPrompt').addEventListener('click', async () => {
      try {
        const res = await fetch(chrome.runtime.getURL('src/ai/prompt.txt'));
        const text = await res.text();
        $id('systemPrompt').value = text;
        showToast('Default prompt loaded');
      } catch (_) { showToast('Failed to load default prompt', 'error'); }
    });
  }
});

// ----- AI UI helpers -----
function renderJobs(jobs) {
  const root = $id('jobs');
  root.innerHTML = '';
  jobs.forEach((j, idx) => {
    const tr = document.createElement('tr');
    const tdName = document.createElement('td'); tdName.style.padding = '6px'; tdName.textContent = j.name || '';
    const tdPreview = document.createElement('td'); tdPreview.style.padding = '6px'; tdPreview.style.maxWidth = '480px'; tdPreview.style.whiteSpace = 'nowrap'; tdPreview.style.overflow = 'hidden'; tdPreview.style.textOverflow = 'ellipsis'; tdPreview.textContent = (j.text || '').replace(/\s+/g,' ').slice(0, 200);
    const tdAct = document.createElement('td'); tdAct.style.padding = '6px'; tdAct.style.textAlign = 'right';
    const edit = document.createElement('button'); edit.textContent = 'Edit'; edit.style.marginRight = '6px';
    const del = document.createElement('button'); del.textContent = 'Delete';
    edit.addEventListener('click', () => {
      $id('jobName').value = j.name || '';
      $id('jobText').value = j.text || '';
      tr.dataset.editing = 'true';
      tr.dataset.index = String(idx);
    });
    del.addEventListener('click', () => removeJob(idx));
    tdAct.append(edit, del);
    tr.append(tdName, tdPreview, tdAct);
    root.append(tr);
  });
}

function addJob() {
  const name = $id('jobName').value.trim();
  const text = $id('jobText').value.trim();
  if (!name || !text) { showToast('Provide name and JD text'); return; }
  chrome.storage.local.get([JOBS_INDEX_KEY], (data) => {
    const index = data?.[JOBS_INDEX_KEY] || [];
    const rows = Array.from(($id('jobs').querySelectorAll('tr')));
    const tr = rows.find((r) => r.dataset.editing === 'true');
    if (tr) {
      const idx = Number(tr.dataset.index);
      const jobId = tr.dataset.jobId;
      const jobKey = JOB_PREFIX + jobId;
      index[idx].name = name;
      chrome.storage.local.set({ [jobKey]: { id: jobId, name, text } }, () => {
        chrome.storage.local.set({ [JOBS_INDEX_KEY]: index }, () => {
          loadAndRenderJobs(index);
          $id('jobName').value = '';
          $id('jobText').value = '';
          tr.dataset.editing = 'false';
          tr.dataset.index = '';
          tr.dataset.jobId = '';
          showToast('Job updated');
        });
      });
    } else {
      const jobId = String(Date.now());
      const jobKey = JOB_PREFIX + jobId;
      const newIndex = [...index, { id: jobId, name }];
      chrome.storage.local.set({ [jobKey]: { id: jobId, name, text } }, () => {
        chrome.storage.local.set({ [JOBS_INDEX_KEY]: newIndex }, () => {
          loadAndRenderJobs(newIndex);
          $id('jobName').value = '';
          $id('jobText').value = '';
          showToast('Job saved');
        });
      });
    }
  });
}

function removeJob(idx) {
  chrome.storage.local.get([JOBS_INDEX_KEY], (data) => {
    const index = data?.[JOBS_INDEX_KEY] || [];
    const job = index[idx];
    if (!job) return;
    const jobKey = JOB_PREFIX + job.id;
    index.splice(idx, 1);
    chrome.storage.local.remove([jobKey], () => {
      chrome.storage.local.set({ [JOBS_INDEX_KEY]: index }, () => {
        loadAndRenderJobs(index);
        showToast('Job removed');
      });
    });
  });
}

function saveAI() {
  const apiKey = $id('apiKey').value.trim();
  const impactProfile = $id('impactProfile').value.trim();
  const systemPrompt = ($id('systemPrompt')?.value || '').trim();
  const autoScan = $id('autoScan').checked;
  const model = ($id('modelCustom').value.trim()) || ($id('modelSelect').value || 'gpt-5-medium');
  chrome.storage.local.get([AI_CFG_KEY], (data) => {
  const cfg = data?.[AI_CFG_KEY] || { apiKey: '', impactProfile: '', autoScan: false, model: 'gpt-5-medium', systemPrompt: '' };
    cfg.apiKey = apiKey; cfg.impactProfile = impactProfile; cfg.systemPrompt = systemPrompt; cfg.autoScan = autoScan; cfg.model = model;
    chrome.storage.local.set({ [AI_CFG_KEY]: cfg }, () => showToast('AI settings saved'));
  });
}

function initModelSelect(cfg) {
  const select = $id('modelSelect');
  const custom = $id('modelCustom');
  select.innerHTML = '';
  const defaults = ['gpt-5-mini', 'gpt-5-medium', 'gpt-5-large'];
  defaults.forEach((m) => {
    const o = document.createElement('option'); o.value = m; o.textContent = m; select.appendChild(o);
  });
  if (cfg?.model && !defaults.includes(cfg.model)) {
    const o = document.createElement('option'); o.value = cfg.model; o.textContent = cfg.model; select.appendChild(o);
  }
  select.value = cfg.model || 'gpt-5-medium';
  custom.value = '';
  $id('refreshModels').onclick = () => refreshModels();
}

function refreshModels() {
  const apiKey = $id('apiKey').value.trim();
  if (!apiKey) { showToast('Enter API key first'); return; }
  fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  }).then((r) => r.json()).then((data) => {
    const models = (data?.data || []).map((m) => m.id).filter((id) => /gpt|o\d/i.test(id));
    const select = $id('modelSelect');
    select.innerHTML = '';
    models.forEach((m) => { const o = document.createElement('option'); o.value = m; o.textContent = m; select.appendChild(o); });
    showToast('Models refreshed');
  }).catch(() => showToast('Failed to fetch models'));
}

function loadAndRenderJobs(index) {
  const keys = (index || []).map((j) => JOB_PREFIX + j.id);
  if (!keys.length) { renderJobs([]); return; }
  chrome.storage.local.get(keys, (data) => {
    const jobs = keys.map((k, i) => data[k] || { id: index[i].id, name: index[i].name, text: '' });
    renderJobs(jobs);
  });
}
