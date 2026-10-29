import { afterEach, describe, expect, it, vi } from 'vitest'
import { testNebiusConnection, getBriefingHistory } from './aiService'

vi.mock('../config/firebase', () => ({ auth: { currentUser: { getIdToken: vi.fn().mockResolvedValue('firebase-id-token') } } }))
afterEach(() => vi.unstubAllGlobals())

describe('AI frontend service', () => {
  it('calls the relative Vercel route with a Firebase ID token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      success: true, model: 'nvidia/nemotron-3-super-120b-a12b', response: 'Hello', durationMs: 30, businessId: 'shop',
    }) })
    vi.stubGlobal('fetch', fetchMock)
    expect((await testNebiusConnection('shop')).response).toBe('Hello')
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/test', expect.objectContaining({
      method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer firebase-id-token' }),
      body: expect.stringContaining('"businessId":"shop"'),
    }))
  })

  it('shows a safe server error and handles expired sessions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: { message: 'Please wait.' } }) }))
    await expect(testNebiusConnection('shop')).rejects.toThrow('Please wait.')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) }))
    await expect(testNebiusConnection('shop')).rejects.toThrow('session has expired')
  })

  it('identifies a missing API route and missing backend settings', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, headers: { get: () => 'text/html' } }))
    await expect(testNebiusConnection('shop')).rejects.toThrow('AI API route was not found')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => { throw new Error('HTML response') } }))
    await expect(testNebiusConnection('shop')).rejects.toThrow('AI API route was not found')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({
      error: { code: 'server_not_configured', message: 'Firebase Admin is not configured for this environment.' },
    }) }))
    await expect(testNebiusConnection('shop')).rejects.toThrow('Firebase Admin is not configured')
  })

  it('does not add an AI request ID to history reads', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [], nextCursor: null }) })
    vi.stubGlobal('fetch', fetchMock)
    expect(await getBriefingHistory('shop')).toEqual({ items: [], nextCursor: null })
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toEqual({ businessId: 'shop' })
  })
})
