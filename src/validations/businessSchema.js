import { z } from 'zod'

export const BUSINESS_CATEGORIES = [
  'Food & Beverage',
  'Retail',
  'Online Business',
  'Services',
  'Agriculture',
  'Other',
]

export const businessSchema = z.object({
  name: z.string().trim().min(1, 'Enter your business name.').max(100, 'Use 100 characters or fewer.'),
  category: z.enum(BUSINESS_CATEGORIES, { error: 'Choose a business category.' }),
  description: z.string().trim().max(500, 'Use 500 characters or fewer.'),
  location: z.string().trim().max(120, 'Use 120 characters or fewer.'),
  currency: z.literal('MYR', { error: 'Currency must be MYR.' }),
})
