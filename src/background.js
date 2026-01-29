// Badge indicator for active page state
const TARGET_URL = 'https://www.linkedin.com/talent/hire/';

function updateBadgeFor(tabId, url) {
  const active = typeof url === 'string' && url.startsWith(TARGET_URL);
  try {
    chrome.action.setBadgeText({ tabId, text: active ? 'ON' : '' }, () => {
      if (chrome.runtime.lastError) return; // Tab might be gone; ignore.
      chrome.action.setBadgeBackgroundColor({ tabId, color: active ? '#0a66c2' : '#00000000' }, () => {
        // ignore errors
      });
    });
  } catch (_) { /* ignore transient worker errors */ }
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  try {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || !tab) return;
      updateBadgeFor(tabId, tab.url);
    });
  } catch (_) {}
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    try { updateBadgeFor(tabId, tab?.url || changeInfo.url); } catch (_) {}
  }
});

// Handle shortcut to score profile
chrome.commands.onCommand.addListener((command) => {
  if (command !== 'score_profile') return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: 'LIQA_SCORE_REQUEST', shortcut: true });
  });
});
