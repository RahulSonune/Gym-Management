export function formatMinorAmount(
  amountMinor: number,
  currency = 'INR',
  locale = 'en-IN'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function minorToMajor(amountMinor: number): number {
  return amountMinor / 100;
}
