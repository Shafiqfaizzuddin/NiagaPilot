import { Beef, Box, BusFront, CircleEllipsis, Lightbulb, Megaphone, Store, Wrench } from 'lucide-react'

export const EXPENSE_CATEGORIES = [
  { value: 'Ingredients', icon: Beef, color: '#059669' },
  { value: 'Packaging', icon: Box, color: '#0d9488' },
  { value: 'Utilities', icon: Lightbulb, color: '#d97706' },
  { value: 'Rent', icon: Store, color: '#4f46e5' },
  { value: 'Transportation', icon: BusFront, color: '#0284c7' },
  { value: 'Equipment', icon: Wrench, color: '#7c3aed' },
  { value: 'Marketing', icon: Megaphone, color: '#db2777' },
  { value: 'Other', icon: CircleEllipsis, color: '#64748b' },
]

export const EXPENSE_CATEGORY_VALUES = EXPENSE_CATEGORIES.map(({ value }) => value)
export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'E-Wallet', 'Debit/Credit Card', 'Other']

export function categoryConfig(value) {
  return EXPENSE_CATEGORIES.find((category) => category.value === value) || EXPENSE_CATEGORIES.at(-1)
}
