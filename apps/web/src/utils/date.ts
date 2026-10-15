const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function formatDateOnly(value: string | null, locale = "en-US"): string {
  if (!value) return "—";
  if (!DATE_ONLY_PATTERN.test(value)) return value;

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return value;

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateTime(value: string | Date | null, locale = "en-US"): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
