// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { SalesPage } from './SalesPage'
import { useBusiness } from '../../hooks/useBusiness'
import { useSales } from '../../hooks/useSales'
import { createSale, deleteSale, updateSale } from '../../services/saleService'

vi.mock('../../hooks/useBusiness', () => ({ useBusiness: vi.fn() }))
vi.mock('../../hooks/useSales', () => ({ useSales: vi.fn() }))
vi.mock('../../services/saleService', () => ({ createSale: vi.fn(), deleteSale: vi.fn(), updateSale: vi.fn() }))

const lunch = { id: 'sale-1', businessId: 'shop', description: 'Lunch orders', amountCents: 2550, transactionDate: '2026-10-28', paymentMethod: 'Cash', customer: 'Amina', notes: '' }
let state
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useBusiness).mockReturnValue({ activeBusiness: { id: 'shop', name: 'Amina Market' } })
  state = { sales: [], loading: false, error: null }
  vi.mocked(useSales).mockImplementation(() => state)
  vi.mocked(createSale).mockResolvedValue('new-sale')
  vi.mocked(updateSale).mockResolvedValue(undefined)
  vi.mocked(deleteSale).mockResolvedValue(undefined)
})
afterEach(cleanup)

describe('sales tracker interactions', () => {
  it('adds a valid sale and rejects invalid money', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><SalesPage /></MemoryRouter>)
    expect(screen.getByText('No sales recorded yet.')).toBeTruthy()
    await user.click(screen.getAllByRole('button', { name: 'Add Sale' })[0])
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText(/Sale description/), 'Lunch orders')
    await user.type(within(dialog).getByLabelText(/Amount/), '2.345')
    await user.click(within(dialog).getByRole('button', { name: 'Save sale' }))
    expect(await within(dialog).findByText('Enter a positive RM amount with up to two decimal places.')).toBeTruthy()
    expect(createSale).not.toHaveBeenCalled()
    await user.clear(within(dialog).getByLabelText(/Amount/))
    await user.type(within(dialog).getByLabelText(/Amount/), '25.50')
    await user.click(within(dialog).getByRole('button', { name: 'Save sale' }))
    await waitFor(() => expect(createSale).toHaveBeenCalledWith('shop', expect.objectContaining({ amount: '25.50', description: 'Lunch orders' })))
    expect(await screen.findByText('Sale added.')).toBeTruthy()
  })

  it('edits and deletes with confirmation and supports cancel', async () => {
    state.sales = [lunch]
    const user = userEvent.setup()
    render(<MemoryRouter><SalesPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: 'Edit Lunch orders' }))
    const dialog = screen.getByRole('dialog')
    await user.clear(within(dialog).getByLabelText(/Amount/))
    await user.type(within(dialog).getByLabelText(/Amount/), '30.00')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(updateSale).toHaveBeenCalledWith('shop', 'sale-1', expect.objectContaining({ amount: '30.00' })))
    expect(createSale).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Delete Lunch orders' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }))
    expect(deleteSale).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Delete Lunch orders' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete sale' }))
    await waitFor(() => expect(deleteSale).toHaveBeenCalledWith('shop', 'sale-1'))
  })

  it('filters sales and shows permission errors', async () => {
    state.sales = [lunch, { ...lunch, id: 'sale-2', description: 'Tea', paymentMethod: 'E-Wallet' }]
    const user = userEvent.setup()
    const view = render(<MemoryRouter><SalesPage /></MemoryRouter>)
    await user.type(screen.getByRole('textbox', { name: 'Search sales' }), 'tea')
    expect(screen.getByText('1 shown')).toBeTruthy()
    await user.selectOptions(screen.getByLabelText('Payment method'), 'Cash')
    expect(screen.getByText('No sales match your filters.')).toBeTruthy()
    state = { sales: [], loading: false, error: { code: 'permission-denied' } }
    view.rerender(<MemoryRouter><SalesPage /></MemoryRouter>)
    expect(screen.getByText(/do not have permission to view these sales/)).toBeTruthy()
  })
})
