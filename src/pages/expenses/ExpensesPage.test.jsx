// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { ExpensesPage } from './ExpensesPage'
import { useBusiness } from '../../hooks/useBusiness'
import { useExpenses } from '../../hooks/useExpenses'
import { createExpense, deleteExpense, updateExpense } from '../../services/expenseService'

vi.mock('../../hooks/useBusiness', () => ({ useBusiness: vi.fn() }))
vi.mock('../../hooks/useExpenses', () => ({ useExpenses: vi.fn() }))
vi.mock('../../services/expenseService', () => ({ createExpense: vi.fn(), deleteExpense: vi.fn(), updateExpense: vi.fn() }))
vi.mock('recharts', () => ({ ResponsiveContainer: ({ children }) => <div>{children}</div>, PieChart: ({ children }) => <div>{children}</div>, Pie: ({ children }) => <div>{children}</div>, Cell: () => null, Tooltip: () => null }))

const oil = { id: 'expense-1', businessId: 'business-1', description: 'Cooking Oil', category: 'Ingredients', amountCents: 2550, transactionDate: '2026-10-28', paymentMethod: 'Cash', merchant: 'Market A', notes: 'weekly stock' }
const rent = { id: 'expense-2', businessId: 'business-1', description: 'Shop Rent', category: 'Rent', amountCents: 100000, transactionDate: '2026-09-15', paymentMethod: 'Bank Transfer', merchant: 'Landlord', notes: '' }
let expenseState

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useBusiness).mockReturnValue({ activeBusiness: { id: 'business-1', name: 'Amina Market' } })
  expenseState = { expenses: [], loading: false, error: null }
  vi.mocked(useExpenses).mockImplementation(() => expenseState)
  vi.mocked(createExpense).mockResolvedValue('expense-new')
  vi.mocked(updateExpense).mockResolvedValue(undefined)
  vi.mocked(deleteExpense).mockResolvedValue(undefined)
})
afterEach(cleanup)

describe('expense tracker interactions', () => {
  it('adds a valid expense and rejects an invalid amount', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><ExpensesPage /></MemoryRouter>)
    expect(screen.getByText('No expenses recorded yet.')).toBeTruthy()
    await user.click(screen.getAllByRole('button', { name: 'Add Expense' })[0])
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText(/Description/), 'Cooking Oil')
    await user.type(within(dialog).getByLabelText(/Amount/), '2.345')
    await user.selectOptions(within(dialog).getByLabelText(/Category/), 'Ingredients')
    await user.click(within(dialog).getByRole('button', { name: 'Save expense' }))
    expect(await within(dialog).findByText('Enter a positive RM amount with up to two decimal places.')).toBeTruthy()
    expect(createExpense).not.toHaveBeenCalled()
    await user.clear(within(dialog).getByLabelText(/Amount/))
    await user.type(within(dialog).getByLabelText(/Amount/), '25.50')
    await user.click(within(dialog).getByRole('button', { name: 'Save expense' }))
    await waitFor(() => expect(createExpense).toHaveBeenCalledWith('business-1', expect.objectContaining({ description: 'Cooking Oil', amount: '25.50', category: 'Ingredients' })))
    expect(await screen.findByText('Expense added.')).toBeTruthy()
  })

  it('edits an existing expense rather than creating another', async () => {
    expenseState.expenses = [oil]
    const user = userEvent.setup()
    render(<MemoryRouter><ExpensesPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: 'Edit Cooking Oil' }))
    const dialog = screen.getByRole('dialog')
    await user.clear(within(dialog).getByLabelText(/Amount/))
    await user.type(within(dialog).getByLabelText(/Amount/), '30.00')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(updateExpense).toHaveBeenCalledWith('business-1', 'expense-1', expect.objectContaining({ amount: '30.00' })))
    expect(createExpense).not.toHaveBeenCalled()
    expect(await screen.findByText('Expense updated.')).toBeTruthy()
  })

  it('requires confirmation, supports cancel, and deletes the selected expense', async () => {
    expenseState.expenses = [oil]
    const user = userEvent.setup()
    render(<MemoryRouter><ExpensesPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: 'Delete Cooking Oil' }))
    expect(screen.getByText(/This cannot be undone/)).toBeTruthy()
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }))
    expect(deleteExpense).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Delete Cooking Oil' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete expense' }))
    await waitFor(() => expect(deleteExpense).toHaveBeenCalledWith('business-1', 'expense-1'))
    expect(await screen.findByText('Expense deleted.')).toBeTruthy()
  })

  it('searches, filters category and local dates, and clears filters', async () => {
    expenseState.expenses = [oil, rent]
    const user = userEvent.setup()
    render(<MemoryRouter><ExpensesPage /></MemoryRouter>)
    await user.type(screen.getByRole('textbox', { name: 'Search expenses' }), 'market')
    expect(screen.getByText('1 shown')).toBeTruthy()
    await user.clear(screen.getByRole('textbox', { name: 'Search expenses' }))
    await user.selectOptions(screen.getByLabelText('Filter by category'), 'Rent')
    expect(screen.getByText('1 shown')).toBeTruthy()
    await user.selectOptions(screen.getByLabelText('Filter by date'), 'today')
    expect(screen.getByText('No expenses match your filters.')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Clear Filters' }))
    expect(screen.getByText('2 shown')).toBeTruthy()
  })

  it('shows loading and permission errors', () => {
    expenseState.loading = true
    const view = render(<MemoryRouter><ExpensesPage /></MemoryRouter>)
    expect(screen.getByLabelText('Loading expenses')).toBeTruthy()
    expenseState = { expenses: [], loading: false, error: { code: 'permission-denied' } }
    view.rerender(<MemoryRouter><ExpensesPage /></MemoryRouter>)
    expect(screen.getByText(/do not have permission to view/)).toBeTruthy()
  })
})
