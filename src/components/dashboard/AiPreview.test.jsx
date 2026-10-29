// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AiPreview } from './AiPreview'
import { getBriefingHistory } from '../../services/aiService'

vi.mock('../../services/aiService', () => ({ getBriefingHistory: vi.fn() }))
afterEach(cleanup)
beforeEach(() => vi.clearAllMocks())

describe('dashboard AI preview', () => {
  it('shows an honest empty state without generating a briefing', async () => {
    vi.mocked(getBriefingHistory).mockResolvedValue({ items: [], nextCursor: null })
    render(<MemoryRouter><AiPreview businessId="shop" /></MemoryRouter>)
    expect(await screen.findByText(/No AI briefing yet/)).toBeTruthy()
    expect(screen.getByRole('link', { name: /View AI Insights/ }).getAttribute('href')).toBe('/ai-insights')
  })

  it('shows the latest saved headline', async () => {
    vi.mocked(getBriefingHistory).mockResolvedValue({ items: [{
      id: 'one', headline: 'Review spending', summary: 'A saved summary',
      period: { label: 'This month' }, generatedAt: '2026-10-28T00:00:00Z',
    }], nextCursor: null })
    render(<MemoryRouter><AiPreview businessId="shop" /></MemoryRouter>)
    expect(await screen.findByText('Review spending')).toBeTruthy()
  })
})
