/**
 * AI Scoring Logic
 *
 * Handles OpenAI API calls and score processing
 */

import { STORAGE_KEYS } from '../config'
import {
  getLocalStorage,
  getAIConfig,
  getJobAtIndex,
  getDefaultAgentPrompt,
  extractProfileText,
  clampScore,
} from '../lib'
import { showToast, showProgressBar, hideProgressBar, updateControlBarScore } from '../ui'

/**
 * Read the system prompt (from agent or bundled file)
 */
async function readSystemPrompt(): Promise<string> {
  try {
    // Try to get from default agent first
    const agentPrompt = await getDefaultAgentPrompt()
    if (agentPrompt) return agentPrompt

    // Fallback to bundled prompt file
    const res = await fetch(chrome.runtime.getURL('dist/src/ai/system-prompt.txt'))
    if (!res.ok) throw new Error('Prompt not found')
    return await res.text()
  } catch {
    return 'You are an expert recruiter. Score candidates 0-100 based on role fit and impact profile. Return JSON with keys: score (0-100), strengths (array), weaknesses (array).'
  }
}

/**
 * Read the user prompt template
 */
async function readUserPromptTemplate(): Promise<string> {
  try {
    const res = await fetch(chrome.runtime.getURL('dist/src/ai/user-prompt-template.txt'))
    if (!res.ok) throw new Error('Template not found')
    return await res.text()
  } catch {
    return `Job Description:\n{{JOB_DESCRIPTION}}\n\nImpact Profile:\n{{IMPACT_PROFILE}}\n\nCandidate Profile:\n{{CANDIDATE_PROFILE}}\n\nRespond in strict JSON. If you return Markdown or text, still ensure a valid JSON block exists.`
  }
}

/**
 * Build the user prompt from template
 */
function buildUserPrompt(
  template: string,
  jobText: string,
  impactProfile: string,
  candidateProfile: string
): string {
  return template
    .replace('{{JOB_DESCRIPTION}}', jobText)
    .replace('{{IMPACT_PROFILE}}', impactProfile)
    .replace('{{CANDIDATE_PROFILE}}', candidateProfile)
}

/**
 * Call the OpenAI API
 */
async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userContent: string
): Promise<string> {
  const chosenModel = model || 'gpt-4o-mini'
  const payload = {
    model: chosenModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.2,
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData?.error?.message || 'OpenAI API error')
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

/**
 * Parse the AI response to extract score data
 */
interface ScoreResult {
  score: number
  strengths: string[]
  weaknesses: string[]
}

function parseScoreResponse(text: string): ScoreResult {
  const match = text?.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in response')

  const json = JSON.parse(match[0])
  return {
    score: clampScore(Number(json.score || 0)),
    strengths: Array.isArray(json.strengths) ? json.strengths : [],
    weaknesses: Array.isArray(json.weaknesses) ? json.weaknesses : [],
  }
}

/**
 * Score the current candidate
 */
export async function scoreCurrent(jobIndex?: number): Promise<void> {
  const profile = extractProfileText()
  if (!profile) {
    showToast('Cannot read profile', 'error')
    return
  }

  // Get AI config and job data
  const cfg = await getAIConfig()
  if (!cfg.apiKey) {
    showToast('AI not configured', 'error')
    return
  }

  // Determine job index
  const data = await getLocalStorage<Record<string, number>>([STORAGE_KEYS.LAST_JOB])
  const chosenIndex = typeof jobIndex === 'number'
    ? jobIndex
    : (typeof data?.[STORAGE_KEYS.LAST_JOB] === 'number' ? data[STORAGE_KEYS.LAST_JOB] : 0)

  const job = await getJobAtIndex(chosenIndex)
  if (!job || !job.text) {
    showToast('Job description missing', 'error')
    return
  }

  // Show loading state
  updateControlBarScore({ loading: true })
  showProgressBar()

  try {
    const systemPrompt = await readSystemPrompt()
    const userTemplate = await readUserPromptTemplate()
    const userPrompt = buildUserPrompt(
      userTemplate,
      job.text,
      job.impactProfile || '',
      profile
    )

    const responseText = await callOpenAI(
      cfg.apiKey,
      cfg.model || 'gpt-4o-mini',
      systemPrompt,
      userPrompt
    )

    const result = parseScoreResponse(responseText)

    updateControlBarScore({
      score: result.score,
      loading: false,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
    })

  } catch (e) {
    // Try to parse error message as JSON (sometimes the response is in the error)
    try {
      const errorMessage = (e as Error)?.message || '{}'
      if (errorMessage.includes('{')) {
        const result = parseScoreResponse(errorMessage)
        updateControlBarScore({
          score: result.score,
          loading: false,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
        })
        return
      }
    } catch {
      // Ignore parse errors
    }

    updateControlBarScore({ score: null, loading: false })
    showToast('Scoring failed', 'error')
  } finally {
    hideProgressBar()
  }
}
