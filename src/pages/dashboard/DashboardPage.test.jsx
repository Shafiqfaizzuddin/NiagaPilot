// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { DashboardPage } from './DashboardPage'
import { useAuth } from '../../hooks/useAuth'
import { useBusiness } from '../../hooks/useBusiness'
import { useExpenses } from '../../hooks/useExpenses'
import { localDateString } from '../../utils/localDates'

vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../../hooks/useBusiness', () => ({ useBusiness: vi.fn() }))
vi.mock('../../hooks/useExpenses', () => ({ useExpenses: vi.fn() }))
vi.mock('recharts', () => ({ ResponsiveContainer: ({ children }) => <div>{children}</div>, BarChart: ({ children }) => <div>{children}</div>, Bar: () => null, CartesianGrid: () => null, XAxis: () => null, YAxis: () => null, PieChart: ({ children }) => <div>{children}</div>, Pie: ({ children }) => <div>{children}</div>, Cell: () => null, Tooltip: () => null }))

const now = new Date()
const currentDate = localDateString(new Date(now.getFullYear(), now.getMonth(), 15))
const previousDate = localDateString(new Date(now.getFullYear(), now.getMonth() - 1, 15))
const ingredient = { id: 'a', businessId: 'business-1', description: 'Cooking Oil', category: 'Ingredients', amountCents: 2500, transactionDate: currentDate }
const rent = { id: 'b', businessId: 'business-1', description: 'Shop Rent', category: 'Rent', amountCents: 5000, transactionDate: previousDate }
let expenseState

function renderDashboard() { return render(<MemoryRouter><DashboardPage /></MemoryRouter>) }
function card(label) { return screen.getByText(label).closest('section') }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuth).mockReturnValue({ userProfile: { fullName: 'Amina Hassan' } })
  vi.mocked(useBusiness).mockReturnValue({ activeBusiness: { id: 'business-1', name: 'Amina Market' } })
  expenseState = { expenses: [], loading: false, error: null }
  vi.mocked(useExpenses).mockImplementation(() => expenseState)
})
afterEach(cleanup)

describe('live expense dashboard', () => {
  it('renders real business-scoped totals, category percentages, and recent transactions', () => {
    expenseState.expenses = [ingredient, rent]
    renderDashboard()
    expect(useExpenses).toHaveBeenCalledWith('business-1')
    expect(useExpenses).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('heading', { name: /Good (morning|afternoon|evening), Amina!/ })).toBeTruthy()
    expect(screen.getByText('Amina Market')).toBeTruthy()
    expect(within(card('Total Expenses')).getByText('RM75.00')).toBeTruthy()
    expect(within(card('Expenses This Month')).getByText('RM25.00')).toBeTruthy()
    expect(within(card('Expenses Last Month')).getByText('RM50.00')).toBeTruthy()
    expect(within(card('Number of Transactions')).getByText('2')).toBeTruthy()
    expect(screen.getByText('Expenses decreased by 50.0% compared to last month.')).toBeTruthy()
    expect(screen.getByText('33.3%')).toBeTruthy()
    expect(screen.getByText('66.7%')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'View All Expenses' }).getAttribute('href')).toBe('/expenses')
    expect(screen.getByText('No expenses recorded in this period.')).toBeTruthy()
  })

  it('recalculates after add, edit, and delete snapshots without another data source', () => {
    expenseState.expenses = [ingredient]
    const view = renderDashboard()
    expect(within(card('Total Expenses')).getByText('RM25.00')).toBeTruthy()
    expenseState = { expenses: [ingredient, rent], loading: false, error: null }
    view.rerender(<MemoryRouter><DashboardPage /></MemoryRouter>)
    expect(within(card('Total Expenses')).getByText('RM75.00')).toBeTruthy()
    expenseState = { expenses: [{ ...ingredient, amountCents: 3000 }, rent], loading: false, error: null }
    view.rerender(<MemoryRouter><DashboardPage /></MemoryRouter>)
    expect(within(card('Total Expenses')).getByText('RM80.00')).toBeTruthy()
    expenseState = { expenses: [rent], loading: false, error: null }
    view.rerender(<MemoryRouter><DashboardPage /></MemoryRouter>)
    expect(within(card('Total Expenses')).getByText('RM50.00')).toBeTruthy()
  })

  it('changes the trend period and keeps responsive layout classes', async () => {
    expenseState.expenses = [ingredient, rent]
    const user = userEvent.setup()
    const view = renderDashboard()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Trend period' }), 'thisMonth')
    expect(screen.getByRole('img', { name: 'Daily expense trend, This Month' })).toBeTruthy()
    expect(view.container.querySelector('.sm\\:grid-cols-2')).toBeTruthy()
    expect(view.container.querySelector('.xl\\:grid-cols-4')).toBeTruthy()
  })

  it('handles empty, loading, and permission-denied states', () => {
    const view = renderDashboard()
    expect(screen.getByText('No expenses to show yet')).toBeTruthy()
    expect(screen.getByText('No comparable previous-period expenses')).toBeTruthy()
    expenseState = { expenses: [], loading: true, error: null }
    view.rerender(<MemoryRouter><DashboardPage /></MemoryRouter>)
    expect(screen.getByLabelText('Loading dashboard expenses')).toBeTruthy()
    expenseState = { expenses: [], loading: false, error: { code: 'permission-denied' } }
    view.rerender(<MemoryRouter><DashboardPage /></MemoryRouter>)
    expect(screen.getByText(/do not have permission to load/)).toBeTruthy()
  })
})
