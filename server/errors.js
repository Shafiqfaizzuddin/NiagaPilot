export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function sendError(response, error) {
  if (error instanceof ApiError) {
    return response.status(error.status).json({ error: { code: error.code, message: error.message } })
  }
  return response.status(500).json({ error: { code: 'internal_error', message: 'The request could not be completed. Please try again.' } })
}
