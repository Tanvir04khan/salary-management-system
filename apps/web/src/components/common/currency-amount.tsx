import { formatCurrencyAmount } from "../../utils/currency";

type CurrencyAmountProps = {
  amount: string | null;
  currency: string | null;
  locale?: string;
};

export function CurrencyAmount({ amount, currency, locale }: CurrencyAmountProps) {
  if (amount === null || currency === null) return <span>—</span>;
  return <span>{formatCurrencyAmount(amount, currency, locale)}</span>;
}
