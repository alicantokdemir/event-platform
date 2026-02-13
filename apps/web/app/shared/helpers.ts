function toDollarsString(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function centsToDollars(cents: number): string {
  if (!cents) return '';
  return toDollarsString(cents);
}

export function dollarsToCents(value: string): number {
  const dollars = Number(value);
  if (!Number.isFinite(dollars) || value.trim() === '') return 0;
  return Math.round(dollars * 100);
}

export function formatCurrencyCents(cents: number): string {
  return `$${toDollarsString(cents)}`;
}

export function formatNullable<T>(
  value: T | null,
  formatter: (item: T) => string,
  fallback = '—',
): string {
  if (value === null) return fallback;
  return formatter(value);
}
