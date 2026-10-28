import { z } from 'zod'
import { EXPENSE_CATEGORY_VALUES, PAYMENT_METHODS } from '../config/expenseCategories'
import { isValidDateString } from '../utils/localDates'
import { parseRinggitToCents } from '../utils/money'

export const expenseFormSchema = z.object({
  description: z.string().trim().min(1, 'Enter a description.').max(120, 'Keep the description under 120 characters.'),
  amount: z.string().trim().refine((value) => {
    try { parseRinggitToCents(value); return true } catch { return false }
  }, 'Enter a positive RM amount with up to two decimal places.'),
  category: z.enum(EXPENSE_CATEGORY_VALUES, { error: 'Choose a category.' }),
  transactionDate: z.string().refine(isValidDateString, 'Choose a valid date.'),
  paymentMethod: z.union([z.enum(PAYMENT_METHODS), z.literal('')]),
  merchant: z.string().trim().max(120, 'Keep the merchant under 120 characters.'),
  notes: z.string().trim().max(500, 'Keep notes under 500 characters.'),
})

export function toExpenseFields(input) {
  const values = expenseFormSchema.parse(input)
  return {
    description: values.description,
    amountCents: parseRinggitToCents(values.amount),
    category: values.category,
    transactionDate: values.transactionDate,
    paymentMethod: values.paymentMethod,
    merchant: values.merchant,
    notes: values.notes,
  }
}
