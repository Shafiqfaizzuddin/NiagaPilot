import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiHandler } from '../../server/request.js'
import { getAdminServices } from '../../server/admin.js'

vi.mock('../../server/admin.js', () => ({ getAdminServices: vi.fn() }))

function response() {
  return {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }
}

const request = (authorization = 'Bearer valid-token', body = { businessId: 'owned-business' }) => ({
  method: 'POST', headers: { authorization }, body,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getAdminServices).mockReturnValue({
    auth: { verifyIdToken: vi.fn().mockResolvedValue({ uid: 'owner' }) },
    db: { doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ exists: true, id: 'owned-business', data: () => ({ name: 'Shop' }) }) }) },
  })
})

describe('protected Vercel request', () => {
  it('verifies the Firebase token and owned business before running the action', async () => {
    const action = vi.fn().mockResolvedValue({ ok: true })
    const res = response()
    await apiHandler(action)(request(), res)
    const services = vi.mocked(getAdminServices).mock.results[0].value
    expect(services.auth.verifyIdToken).toHaveBeenCalledWith('valid-token', true)
    expect(services.db.doc).toHaveBeenCalledWith('users/owner/businesses/owned-business')
    expect(action).toHaveBeenCalledWith(expect.objectContaining({ uid: 'owner', business: { id: 'owned-business', name: 'Shop' } }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('rejects missing and invalid Firebase tokens', async () => {
    const action = vi.fn()
    const missing = response()
    await apiHandler(action)(request(''), missing)
    expect(missing.status).toHaveBeenCalledWith(401)
    expect(getAdminServices).not.toHaveBeenCalled()
    vi.mocked(getAdminServices).mockReturnValue({ auth: { verifyIdToken: vi.fn().mockRejectedValue(new Error('invalid')) }, db: {} })
    const invalid = response()
    await apiHandler(action)(request(), invalid)
    expect(invalid.status).toHaveBeenCalledWith(401)
    expect(action).not.toHaveBeenCalled()
  })

  it('rejects a business outside the authenticated user path', async () => {
    const services = vi.mocked(getAdminServices)()
    services.db.doc().get.mockResolvedValue({ exists: false })
    vi.mocked(getAdminServices).mockReturnValue(services)
    const res = response()
    await apiHandler(vi.fn())(request(), res)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: 'business_forbidden' }) })
  })

  it('rejects oversized or non-POST requests', async () => {
    const tooLarge = response()
    await apiHandler(vi.fn())({ ...request(), headers: { ...request().headers, 'content-length': '9000' } }, tooLarge)
    expect(tooLarge.status).toHaveBeenCalledWith(413)
    const wrongMethod = response()
    await apiHandler(vi.fn())({ ...request(), method: 'GET' }, wrongMethod)
    expect(wrongMethod.status).toHaveBeenCalledWith(405)
  })
})
