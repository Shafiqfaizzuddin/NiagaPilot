import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'

function renderRoute(path) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider><App /></AuthProvider>
    </MemoryRouter>,
  )
}

describe('page routes', () => {
  it('renders the shared navigation and honest dashboard empty state', () => {
    const html = renderRoute('/dashboard')
    expect(html).toContain('Main navigation')
    expect(html).toContain('No expenses to show yet')
    expect(html).toContain('Firebase isn’t configured.')
  })

  it('renders the expense and settings foundations', () => {
    expect(renderRoute('/expenses')).toContain('Your expense list is empty')
    expect(renderRoute('/settings')).toContain('No account connected')
  })

  it('keeps sales and AI insights as placeholders', () => {
    expect(renderRoute('/sales')).toContain('Sales tracking')
    expect(renderRoute('/insights')).toContain('AI-powered financial recommendations are planned')
  })
})
