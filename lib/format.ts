export interface CurrencyConfig {
  code: string
  locale: string
  decimals: number
  symbol: string
}

export interface FormatCurrencyOptions {
  currency?: string
  locale?: string
  decimals?: number
  isPrivacy?: boolean
}

export const CURRENCY_PRESETS: Record<string, CurrencyConfig> = {
  IDR: { code: 'IDR', locale: 'id-ID', decimals: 0, symbol: 'Rp' },
  USD: { code: 'USD', locale: 'en-US', decimals: 2, symbol: '$' },
  EUR: { code: 'EUR', locale: 'de-DE', decimals: 2, symbol: '€' },
  SGD: { code: 'SGD', locale: 'en-SG', decimals: 2, symbol: 'S$' },
  MYR: { code: 'MYR', locale: 'ms-MY', decimals: 2, symbol: 'RM' },
  JPY: { code: 'JPY', locale: 'ja-JP', decimals: 0, symbol: '¥' },
  GBP: { code: 'GBP', locale: 'en-GB', decimals: 2, symbol: '£' },
  AUD: { code: 'AUD', locale: 'en-AU', decimals: 2, symbol: 'A$' },
}

/**
 * Get currency symbol based on currency code
 */
export function getCurrencySymbol(currencyCode = 'IDR'): string {
  if (CURRENCY_PRESETS[currencyCode]) {
    return CURRENCY_PRESETS[currencyCode].symbol
  }

  try {
    const formatter = new Intl.NumberFormat('en', { style: 'currency', currency: currencyCode })
    const parts = formatter.formatToParts(0)
    const symbolPart = parts.find((p) => p.type === 'currency')

    return symbolPart ? symbolPart.value : currencyCode
  } catch {
    return currencyCode
  }
}

/**
 * Format number to currency dynamically
 */
export function formatCurrency(
  amount: number,
  optionsOrPrivacy: FormatCurrencyOptions | boolean
): string {
  const options: FormatCurrencyOptions =
    typeof optionsOrPrivacy === 'boolean'
      ? { isPrivacy: optionsOrPrivacy }
      : (optionsOrPrivacy ?? {});

  const { currency = 'IDR', isPrivacy = false } = options

  const preset = CURRENCY_PRESETS[currency]
  const locale = options.locale ?? preset?.locale ?? 'id-ID'
  const decimals = options.decimals ?? preset?.decimals ?? 0
  const symbol = preset?.symbol ?? getCurrencySymbol(currency)

  if (isPrivacy) {
    return `${symbol} •••••••`
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    return `${symbol} ${amount.toLocaleString()}`;
  }
}

/**
 * Format date to shorter locale date string
 */
export function formatDate(date: string | Date, locale = 'id-ID'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}
