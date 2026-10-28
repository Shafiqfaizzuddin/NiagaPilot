// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import App from './App'
import { useAuth } from './hooks/useAuth'
import { useBusiness } from './hooks/useBusiness'
import { useExpenses } from './hooks/useExpenses'

vi.mock('./hooks/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('./hooks/useBusiness', () => ({ useBusiness: vi.fn() }))
vi.mock('./hooks/useExpenses', () => ({ useExpenses: vi.fn() }))

const savedBusiness = {
  id: 'business-1', name: "Amina's Kitchen", category: 'Food & Beverage',
  description: '', location: 'Kuala Lumpur', currency: 'MYR',
}
let authState
let businessState

function renderRoute(path) {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
}

beforeEach(() => {
  authState = {
    currentUser: null, userProfile: null, loading: false, error: null, isFirebaseConfigured: true,
    register: vi.fn(), login: vi.fn(), logout: vi.fn(), retrySession: vi.fn(),
  }
  businessState = {
    activeBusiness: null, businessLoading: false, businessError: null,
    createActiveBusiness: vi.fn(), updateActiveBusiness: vi.fn(), refreshBusiness: vi.fn(),
  }
  vi.mocked(useAuth).mockImplementation(() => authState)
  vi.mocked(useBusiness).mockImplementation(() => businessState)
  vi.mocked(useExpenses).mockReturnValue({ expenses: [], loading: false, error: null })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('authentication routes', () => {
  it('registers valid information and opens setup', async () => {
    authState.register.mockImplementation(async () => {
      authState.currentUser = { uid: 'user-1', email: 'amina@example.com' }
      authState.userProfile = { fullName: 'Amina Hassan' }
    })
    const user = userEvent.setup()
    renderRoute('/register')
    await user.type(screen.getByLabelText('Full name'), 'Amina Hassan')
    await user.type(screen.getByLabelText('Email address'), 'amina@example.com')
    await user.type(screen.getByLabelText('Password', { exact: true }), 'securepass1')
    await user.type(screen.getByLabelText('Confirm password'), 'securepass1')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() => expect(authState.register).toHaveBeenCalledWith({
      fullName: 'Amina Hassan', email: 'amina@example.com', password: 'securepass1',
    }))
    expect(await screen.findByRole('heading', { name: 'Tell us about your business' })).toBeTruthy()
  })

  it('rejects invalid registration details', async () => {
    const user = userEvent.setup()
    renderRoute('/register')
    await user.type(screen.getByLabelText('Full name'), 'Amina')
    await user.type(screen.getByLabelText('Email address'), 'wrong-email')
    await user.type(screen.getByLabelText('Password', { exact: true }), 'securepass1')
    await user.type(screen.getByLabelText('Confirm password'), 'different')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText('Enter a valid email address.')).toBeTruthy()
    expect(screen.getByText('Passwords do not match.')).toBeTruthy()
    expect(authState.register).not.toHaveBeenCalled()
  })

  it('logs in and opens the active business dashboard', async () => {
    authState.login.mockImplementation(async () => {
      authState.currentUser = { uid: 'user-1', email: 'amina@example.com' }
      authState.userProfile = { fullName: 'Amina Hassan' }
      businessState.activeBusiness = savedBusiness
      return { user: authState.currentUser }
    })
    const user = userEvent.setup()
    renderRoute('/login')
    await user.type(screen.getByLabelText('Email address'), 'amina@example.com')
    await user.type(screen.getByLabelText('Password'), 'securepass1')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('No expenses to show yet')).toBeTruthy()
    expect(screen.getAllByText("Amina's Kitchen").length).toBeGreaterThan(0)
  })

  it('redirects an unauthenticated dashboard visit to login', async () => {
    renderRoute('/dashboard')
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeTruthy()
  })
})

describe('business routes', () => {
  beforeEach(() => {
    authState.currentUser = { uid: 'user-1', email: 'amina@example.com' }
    authState.userProfile = { fullName: 'Amina Hassan' }
  })

  it('keeps the dashboard behind business loading', async () => {
    businessState.businessLoading = true
    const view = renderRoute('/dashboard')
    expect(screen.getByText('Loading your workspace…')).toBeTruthy()
    businessState.businessLoading = false
    businessState.activeBusiness = savedBusiness
    view.rerender(<MemoryRouter initialEntries={['/dashboard']}><App /></MemoryRouter>)
    expect(await screen.findByText('No expenses to show yet')).toBeTruthy()
  })

  it('redirects users without a business to onboarding', async () => {
    renderRoute('/dashboard')
    expect(await screen.findByRole('heading', { name: 'Tell us about your business' })).toBeTruthy()
  })

  it('creates a business and opens the dashboard', async () => {
    businessState.createActiveBusiness.mockImplementation(async (values) => {
      businessState.activeBusiness = { id: 'business-1', ...values }
      return businessState.activeBusiness
    })
    const user = userEvent.setup()
    renderRoute('/business/setup')
    await user.type(screen.getByLabelText(/Business name/), "Amina's Kitchen")
    await user.selectOptions(screen.getByLabelText(/Business category/), 'Food & Beverage')
    await user.click(screen.getByRole('button', { name: 'Create business and continue' }))
    await waitFor(() => expect(businessState.createActiveBusiness).toHaveBeenCalledWith({
      name: "Amina's Kitchen", category: 'Food & Beverage',
      description: '', location: '', currency: 'MYR',
    }))
    expect(await screen.findByText('No expenses to show yet')).toBeTruthy()
  })

  it('rejects an invalid business profile', async () => {
    const user = userEvent.setup()
    renderRoute('/business/setup')
    await user.click(screen.getByRole('button', { name: 'Create business and continue' }))
    expect(await screen.findByText('Enter your business name.')).toBeTruthy()
    expect(screen.getByText('Choose a business category.')).toBeTruthy()
    expect(businessState.createActiveBusiness).not.toHaveBeenCalled()
  })

  it('loads the correct business in expenses and updates it in settings', async () => {
    businessState.activeBusiness = savedBusiness
    const user = userEvent.setup()
    const view = renderRoute('/expenses')
    expect(screen.getByText(/Track and manage your business spending/)).toBeTruthy()
    view.rerender(<MemoryRouter initialEntries={['/expenses']}><App /></MemoryRouter>)
    // Navigate using the shared sidebar.
    await user.click(screen.getAllByRole('link', { name: 'Settings' })[0])
    const name = screen.getByLabelText(/Business name/)
    await user.clear(name)
    await user.type(name, 'Amina Market')
    businessState.updateActiveBusiness.mockImplementation(async (values) => {
      businessState.activeBusiness = { ...savedBusiness, ...values }
    })
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(businessState.updateActiveBusiness).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Amina Market', currency: 'MYR' }),
    ))
    expect(await screen.findByText('Business details saved.')).toBeTruthy()
  })

  it('opens the existing expense form from the dashboard Add Expense action', async () => {
    businessState.activeBusiness = savedBusiness
    const user = userEvent.setup()
    renderRoute('/dashboard')
    await user.click(screen.getAllByRole('link', { name: 'Add Expense' })[0])
    expect(await screen.findByRole('dialog', { name: 'Add expense' })).toBeTruthy()
  })
})
