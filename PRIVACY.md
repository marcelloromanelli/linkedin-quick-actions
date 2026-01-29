# Privacy Policy for LinkedIn Quick Actions

**Last updated:** January 2025

## Overview

LinkedIn Quick Actions is a browser extension that adds keyboard shortcuts and AI-powered candidate scoring to LinkedIn Recruiter. This privacy policy explains how the extension handles your data.

## Data Collection

### What We Collect
This extension does **not** collect, transmit, or store any personal data on external servers. All data stays on your device.

### What We Store Locally

The following data is stored locally in your browser using Chrome's storage APIs:

1. **Settings** (synced across devices via Chrome Sync):
   - CSS selectors for navigation buttons
   - Keyboard shortcut preferences
   - UI display preferences

2. **AI Configuration** (local storage only, not synced):
   - Your OpenAI API key
   - Selected AI model preference
   - Custom system prompts
   - Impact profile text
   - Job descriptions you add

### Data You Provide to Third Parties

When you use the AI scoring feature, the extension sends candidate profile information visible on the LinkedIn page to the OpenAI API. This transmission is:
- Initiated only when you explicitly trigger scoring (button click or keyboard shortcut)
- Or automatically if you enable the "Auto-scan" feature
- Sent directly from your browser to OpenAI's servers using your own API key
- Subject to [OpenAI's Privacy Policy](https://openai.com/privacy/)

**We do not have access to this data.** The API call goes directly from your browser to OpenAI.

## Data Sharing

We do not share any data with third parties. The extension:
- Has no analytics or tracking
- Does not transmit data to any servers we control
- Does not create user accounts

## Data Storage

- **Synced settings** use `chrome.storage.sync` and follow Chrome's sync behavior
- **Local settings** (API keys, job descriptions) use `chrome.storage.local` and remain on your device
- All data can be cleared by uninstalling the extension or clearing extension data in Chrome settings

## Permissions Explained

| Permission | Why It's Needed |
|------------|-----------------|
| `storage` | Save your settings and job descriptions locally |
| `tabs` (optional) | Test CSS selectors from the Options page |
| Host: `linkedin.com/talent/hire/*` | Run the extension only on LinkedIn Recruiter pages |
| Host: `api.openai.com/*` | Send scoring requests to OpenAI when you trigger AI features |

## Your Rights

You can:
- View all stored data via Chrome DevTools (Application > Storage)
- Delete all data by uninstalling the extension
- Disable AI features entirely by not providing an API key
- Disable auto-scan to control when profile data is sent to OpenAI

## Changes to This Policy

We may update this privacy policy occasionally. Changes will be noted in the extension's changelog.

## Contact

For questions about this privacy policy, please open an issue on our [GitHub repository](https://github.com/marcelloromanelli/linkedin-quick-actions).

---

This extension is not affiliated with LinkedIn Corporation or OpenAI.
