export function localDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1) return false
  const date = new Date(0)
  date.setHours(12, 0, 0, 0)
  date.setFullYear(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day
}

export function dateRangeForPreset(preset, today = new Date()) {
  const end = localDateString(today)
  if (preset === 'today') return { start: end, end }
  if (preset === 'last7') {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
    return { start: localDateString(start), end }
  }
  if (preset === 'thisMonth') return { start: localDateString(new Date(today.getFullYear(), today.getMonth(), 1)), end }
  if (preset === 'lastMonth') {
    return {
      start: localDateString(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      end: localDateString(new Date(today.getFullYear(), today.getMonth(), 0)),
    }
  }
  return { start: '', end: '' }
}
