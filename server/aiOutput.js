import { z } from 'zod'
import { ApiError } from './errors.js'

const noUnsupportedClaims = (value) => !/[0-9%]|\b(?:RM|MYR|profit|guaranteed|double|twice|half|percent|peratus|separuh)\b/i.test(value)
const narrative = (minimum, maximum) => z.string().trim().min(minimum).max(maximum).refine(noUnsupportedClaims)
const finding = z.object({
  title: narrative(3, 100),
  explanation: narrative(10, 350),
  priority: z.enum(['low', 'medium', 'high']),
  observationIds: z.array(z.string().min(1).max(80)).min(1).max(3),
}).strict()
const recommendation = z.object({
  title: narrative(3, 100),
  description: narrative(10, 350),
  reason: narrative(10, 350),
  priority: z.enum(['low', 'medium', 'high']),
  observationIds: z.array(z.string().min(1).max(80)).min(1).max(3),
}).strict()
export const briefingOutputSchema = z.object({
  headline: narrative(3, 120),
  summary: narrative(10, 500),
  keyFindings: z.array(finding).max(3),
  recommendations: z.array(recommendation).min(1).max(3),
}).strict()

export function parseBriefingOutput(raw, observations) {
  let output
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed?.recommendations)) {
      parsed.recommendations = parsed.recommendations.map((item) => {
        if (item?.description === undefined && typeof item?.explanation === 'string') {
          const { explanation, ...rest } = item
          return { ...rest, description: explanation }
        }
        return item
      })
    }
    output = briefingOutputSchema.parse(parsed)
  } catch {
    throw new ApiError(502, 'invalid_ai_response', 'The AI provider returned an invalid briefing. Please try again.')
  }
  const allowed = new Map(observations.map((item) => [item.id, item]))
  const supported = (item) => item.observationIds.every((id) => allowed.has(id))
  if (![...output.keyFindings, ...output.recommendations].every(supported)) {
    throw new ApiError(502, 'invalid_ai_response', 'The AI provider returned an unsupported recommendation. Please try again.')
  }
  const categories = ['Ingredients', 'Packaging', 'Utilities', 'Rent', 'Transportation', 'Equipment', 'Marketing']
  const referencesCategory = (text, category) => new RegExp(`\\b${category}\\b`, 'i').test(text)
  const allCategories = new Set(observations.map((item) => item.category).filter(Boolean))
  const unsupportedIn = (text, permitted) => categories.some((category) => referencesCategory(text, category) && !permitted.has(category))
  if (unsupportedIn(`${output.headline} ${output.summary}`, allCategories) ||
      [...output.keyFindings, ...output.recommendations].some((item) => {
        const permitted = new Set(item.observationIds.map((id) => allowed.get(id)?.category).filter(Boolean))
        return unsupportedIn(Object.values(item).filter((value) => typeof value === 'string').join(' '), permitted)
      })) {
    throw new ApiError(502, 'invalid_ai_response', 'The AI provider returned a claim without supporting category data.')
  }
  return output
}
