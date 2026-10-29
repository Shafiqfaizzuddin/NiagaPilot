import { z } from 'zod'
import { PAYMENT_METHODS } from '../config/expenseCategories'
import { isValidDateString } from '../utils/localDates'
import { parseRinggitToCents } from '../utils/money'

export const saleFormSchema = z.object({
  description: z.string().trim().min(1, 'Enter a description.').max(120),
  amount: z.string().trim().refine((value) => {
    try { parseRinggitToCents(value); return true } catch { return false }
  }, 'Enter a positive RM amount with up to two decimal places.'),
  transactionDate: z.string().refine(isValidDateString, 'Choose a valid date.'),
  paymentMethod: z.union([z.enum(PAYMENT_METHODS), z.literal('')]),
  customer: z.string().trim().max(120, 'Keep the customer under 120 characters.'),
  notes: z.string().trim().max(500, 'Keep notes under 500 characters.'),
})

export function toSaleFields(input) {
  const value = saleFormSchema.parse(input)
  return {
    description: value.description,
    amountCents: parseRinggitToCents(value.amount),
    transactionDate: value.transactionDate,
    paymentMethod: value.paymentMethod,
    customer: value.customer,
    notes: value.notes,
  }
}
