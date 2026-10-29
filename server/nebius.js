import { ApiError } from './errors.js'

const DEFAULT_BASE_URL = 'https://api.tokenfactory.us-central1.nebius.com/v1/'
const DEFAULT_MODEL = 'nvidia/nemotron-3-super-120b-a12b'
const TIMEOUT_MS = 15_000

export function nebiusModel() {
  return process.env.NEBIUS_MODEL || DEFAULT_MODEL
}

function endpoint() {
  let url
  try { url = new URL(process.env.NEBIUS_BASE_URL || DEFAULT_BASE_URL) } catch {
    throw new ApiError(503, 'ai_not_configured', 'The AI provider URL is invalid.')
  }
  if (url.protocol !== 'https:' || !/^api\.tokenfactory(?:\.[a-z0-9-]+)?\.nebius\.com$/.test(url.hostname) ||
      url.pathname !== '/v1/' || url.search || url.hash || url.username || url.password) {
    throw new ApiError(503, 'ai_not_configured', 'The AI provider URL must be a Nebius Token Factory endpoint.')
  }
  return new URL('chat/completions', url).toString()
}

export async function callNemotron(messages, maxTokens) {
  const key = process.env.NEBIUS_API_KEY
  const model = nebiusModel()
  if (!key?.trim()) throw new ApiError(503, 'ai_not_configured', 'Nebius is not configured for this environment. Add NEBIUS_API_KEY to the server settings.')
  if (!/^nvidia\/[A-Za-z0-9_.-]+$/.test(model)) throw new ApiError(503, 'ai_not_configured', 'The configured NVIDIA model ID is invalid.')
  const url = endpoint()
  const providerMessages = model === 'nvidia/nemotron-3-super-120b-a12b'
    ? messages.map((message, index) => index === 0 && message.role === 'system'
      ? { ...message, content: `/no_think\n${message.content}` }
      : message)
    : messages
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: providerMessages, max_tokens: Math.min(Math.max(1, maxTokens), 1200), temperature: 0.2, stream: false, ...(model === DEFAULT_MODEL ? { chat_template_kwargs: { enable_thinking: false } } : {}) }),
      signal: controller.signal,
    })
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new ApiError(502, 'nebius_auth_failed', 'Nebius rejected the API credentials. Check the server-side API key.')
      if (response.status === 404) throw new ApiError(502, 'model_unavailable', 'The configured NVIDIA model is unavailable in Nebius. Check NEBIUS_MODEL.')
      if (response.status === 429) throw new ApiError(429, 'provider_rate_limited', 'Nebius is rate limiting AI requests. Please try again later.')
      throw new ApiError(502, 'provider_error', 'The AI provider is unavailable. Please try again later.')
    }
    const payload = await response.json()
    const content = payload?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim() || content.length > 16_000) {
      throw new ApiError(502, 'invalid_ai_response', 'The AI provider returned an invalid response.')
    }
    return content.trim()
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (controller.signal.aborted) throw new ApiError(504, 'provider_timeout', 'The AI provider took too long. Please try again.')
    throw new ApiError(502, 'provider_network_error', 'Could not connect to Nebius. Check the server connection and try again.')
  } finally {
    clearTimeout(timer)
  }
}
