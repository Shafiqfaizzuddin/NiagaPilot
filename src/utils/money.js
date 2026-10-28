const MAX_AMOUNT_CENTS = 99_999_999_999n

export function parseRinggitToCents(input) {
  if (typeof input !== 'string' || !/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(input.trim())) {
    throw new Error('Enter an amount in RM with up to two decimal places.')
  }
  const [ringgit, sen = ''] = input.trim().split('.')
  const cents = BigInt(ringgit) * 100n + BigInt(sen.padEnd(2, '0'))
  if (cents <= 0n) throw new Error('Amount must be greater than zero.')
  if (cents > MAX_AMOUNT_CENTS) throw new Error('Amount is too large.')
  return Number(cents)
}

export function formatMYR(amountCents) {
  const cents = BigInt(amountCents)
  const sign = cents < 0n ? '-' : ''
  const absolute = cents < 0n ? -cents : cents
  const whole = new Intl.NumberFormat('en-MY', { maximumFractionDigits: 0 }).format(absolute / 100n)
  return `${sign}RM${whole}.${String(absolute % 100n).padStart(2, '0')}`
}

export function centsToRinggitInput(amountCents) {
  const cents = BigInt(amountCents)
  return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`
}
