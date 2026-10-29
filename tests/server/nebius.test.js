import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { callNemotron } from '../../server/nebius.js'

beforeEach(() => {
  vi.stubEnv('NEBIUS_API_KEY', 'server-only-key')
  vi.stubEnv('NEBIUS_MODEL', 'nvidia/nemotron-3-super-120b-a12b')
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('Nebius client', () => {
  it('sends a bounded request and validates a completion', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: 'Hello!' } }] }) })
    vi.stubGlobal('fetch', fetchMock)
    expect(await callNemotron([{ role: 'user', content: 'Hello' }], 1200)).toBe('Hello!')
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/v1/chat/completions'), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer server-only-key' }),
      body: expect.stringContaining('"max_tokens":1200'),
    }))
  })

  it('uses the Nemotron non-reasoning prompt mode for short responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: 'Hello!' } }] }) })
    vi.stubGlobal('fetch', fetchMock)
    await callNemotron([{ role: 'system', content: 'Introduce yourself.' }], 100)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.messages[0].content).toBe('/no_think\nIntroduce yourself.')
  })

  it('handles provider failure, invalid response, and missing key without revealing secrets', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    await expect(callNemotron([], 100)).rejects.toMatchObject({ code: 'nebius_auth_failed', status: 502 })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [] }) }))
    await expect(callNemotron([], 100)).rejects.toMatchObject({ code: 'invalid_ai_response' })
    vi.stubEnv('NEBIUS_API_KEY', '')
    await expect(callNemotron([], 100)).rejects.toMatchObject({ code: 'ai_not_configured', status: 503 })
  })

  it('separates model, rate-limit, and network failures without leaking provider responses', async () => {
    for (const [status, code] of [[404, 'model_unavailable'], [429, 'provider_rate_limited'], [500, 'provider_error']]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status, text: async () => 'secret provider details' }))
      await expect(callNemotron([], 100)).rejects.toMatchObject({ code })
    }
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failed with sensitive details')))
    await expect(callNemotron([], 100)).rejects.toMatchObject({ code: 'provider_network_error' })
  })

  it('rejects a non-Nebius URL before sending the API key', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('NEBIUS_BASE_URL', 'https://example.com/v1/')
    await expect(callNemotron([], 100)).rejects.toMatchObject({ code: 'ai_not_configured' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('times out a stalled provider request', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn((_, options) => new Promise((_, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('aborted')))
    })))
    const pending = expect(callNemotron([], 100)).rejects.toMatchObject({ code: 'provider_timeout', status: 504 })
    await vi.advanceTimersByTimeAsync(15_000)
    await pending
  })
})
