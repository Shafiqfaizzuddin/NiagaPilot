import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(100, 'Use 100 characters or fewer.'),
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
  confirmPassword: z.string().min(1, 'Confirm your password.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
})
