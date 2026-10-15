export function formatCurrencyAmount(
  amount: string,
  currency: string,
  locale = "en-US",
): string {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(amount);
  if (!match || !/^[A-Za-z]{3}$/.test(currency)) {
    return `${amount} ${currency}`;
  }

  const [, sign, whole, rawFraction = ""] = match;
  if (rawFraction.length > 2) return `${amount} ${currency.toUpperCase()}`;
  const fraction = rawFraction.padEnd(2, "0").slice(0, 2);
  const currencyCode = currency.toUpperCase();
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "code",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).formatToParts(BigInt(`${sign}${whole}`));
  const decimal = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).formatToParts(1.1).find((part) => part.type === "decimal")?.value ?? ".";
  const localizedFraction = new Intl.NumberFormat(locale, {
    useGrouping: false,
    minimumIntegerDigits: 2,
    maximumFractionDigits: 0,
  }).format(BigInt(fraction));
  const lastIntegerPart = parts.findLastIndex((part) => part.type === "integer");

  if (lastIntegerPart < 0) return `${amount} ${currencyCode}`;

  parts.splice(
    lastIntegerPart + 1,
    0,
    { type: "decimal", value: decimal },
    { type: "fraction", value: localizedFraction },
  );
  return parts.map((part) => part.value).join("");
}
