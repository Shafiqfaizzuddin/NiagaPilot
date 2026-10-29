// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InsightsPage } from './InsightsPage'
import {
  generateBusinessBriefing, getBriefingHistory, getFinancialAnalysis,
  getSavedBusinessBriefing, testNebiusConnection,
} from '../../services/aiService'

vi.mock('../../hooks/useBusiness', () => ({ useBusiness: () => ({ activeBusiness: { id: 'shop', name: 'Amina Market' } }) }))
vi.mock('../../services/aiService', () => ({
  generateBusinessBriefing: vi.fn(), getBriefingHistory: vi.fn(), getFinancialAnalysis: vi.fn(),
  getSavedBusinessBriefing: vi.fn(), testNebiusConnection: vi.fn(),
}))
afterEach(cleanup)

const period = {
  key: 'this_month', label: 'This month', start: '2026-10-01', end: '2026-10-28',
  previousStart: '2026-09-01', previousEnd: '2026-09-28',
  timezone: 'Asia/Kuala_Lumpur', comparison: 'Same calendar days of previous month',
}
const analysis = {
  period,
  metrics: {
    revenue: { currentCents: null }, expenses: { currentCents: '2550', changePercent: null },
    cashBased: { surplusCents: null },
  },
  dataStatus: { salesAvailable: false, explanation: 'Sales tracking is unavailable.' },
}
const briefing = {
  id: 'a'.repeat(64), businessId: 'shop', period, language: 'en', generatedAt: '2026-10-28T00:00:00.000Z',
  headline: 'Review your spending', summary: 'There is limited spending history.',
  keyFindings: [], recommendations: [{
    title: 'Keep records', description: 'Record expenses consistently.',
    reason: 'More records support comparisons.', priority: 'low', observationIds: ['insufficient_data'],
  }],
  observations: [{ id: 'insufficient_data', title: 'More records are needed' }],
  model: 'nvidia/nemotron-3-super-120b-a12b', provider: 'Nebius Token Factory',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getFinancialAnalysis).mockResolvedValue({
    analysis, observations: [], businessHealth: { state: 'insufficient_data', explanation: 'Sales unavailable', informal: true },
  })
  vi.mocked(getBriefingHistory).mockResolvedValue({ items: [], nextCursor: null })
  vi.mocked(generateBusinessBriefing).mockResolvedValue({ briefing, cached: false })
  vi.mocked(getSavedBusinessBriefing).mockResolvedValue({ briefing, stale: false })
  vi.mocked(testNebiusConnection).mockResolvedValue({ response: 'Hello', model: briefing.model, durationMs: 20 })
})

describe('AI Insights page', () => {
  it('shows verified figures and generates a briefing only after a click', async () => {
    const user = userEvent.setup()
    render(<InsightsPage />)
    expect(screen.getByRole('heading', { name: 'AI Business Insights' })).toBeTruthy()
    expect(generateBusinessBriefing).not.toHaveBeenCalled()
    expect(await screen.findByText('RM25.50')).toBeTruthy()
    expect(screen.getAllByText('Unavailable')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Generate AI Insights' }))
    expect(await screen.findByText('Review your spending')).toBeTruthy()
    expect(generateBusinessBriefing).toHaveBeenCalledWith('shop', 'this_month', 'en')
  })

  it('uses the selected period and Bahasa Melayu and displays saved history', async () => {
    const user = userEvent.setup()
    vi.mocked(getBriefingHistory).mockResolvedValue({ items: [briefing], nextCursor: null })
    render(<InsightsPage />)
    await screen.findByText('Review your spending')
    await user.selectOptions(screen.getByLabelText('Analysis period'), 'last_7_days')
    await user.selectOptions(screen.getByLabelText('Language'), 'ms')
    await waitFor(() => expect(getFinancialAnalysis).toHaveBeenCalledWith('shop', 'last_7_days'))
    await user.click(screen.getByRole('button', { name: 'Generate AI Insights' }))
    expect(generateBusinessBriefing).toHaveBeenCalledWith('shop', 'last_7_days', 'ms')
    await user.click(screen.getByRole('button', { name: /Review your spending/i }))
    expect(getSavedBusinessBriefing).toHaveBeenCalledWith('shop', briefing.id)
  })

  it('shows loading and errors without inventing results', async () => {
    vi.mocked(getFinancialAnalysis).mockRejectedValue(new Error('Firestore unavailable'))
    vi.mocked(getBriefingHistory).mockResolvedValue({ items: [], nextCursor: null })
    render(<InsightsPage />)
    expect(screen.getByLabelText('Loading financial analysis')).toBeTruthy()
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Firestore unavailable')
    expect(screen.getByText('No saved briefings yet. Generate your first insights above.')).toBeTruthy()
  })
})
