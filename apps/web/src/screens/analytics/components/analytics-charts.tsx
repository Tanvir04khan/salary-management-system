import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CurrencySalarySummary } from "../../../hooks/use-analytics";
import { formatCurrencyAmount } from "../../../utils/currency";

const chartColors = ["#4f46e5", "#0f766e", "#c2410c", "#7c3aed", "#be123c", "#0369a1"];
const moneyFormatter = (currency: string) => new Intl.NumberFormat(undefined, {
  style: "currency",
  currency,
  maximumFractionDigits: 2,
});

type CountDatum = { label: string; count: number };

export function EmploymentStatusPieChart({ title, data }: { title: string; data: CountDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ChartCard title={title} summary={data.map((item) => `${item.label}: ${item.count}`).join("; ")}>
      <ResponsiveContainer height="100%" minHeight={260} width="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="46%"
            innerRadius={58}
            outerRadius={96}
            paddingAngle={data.length > 1 ? 3 : 0}
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((item, index) => (
              <Cell key={item.label} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => {
              const count = Number(value);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return [`${count.toLocaleString()} (${percentage.toFixed(1)}%)`, String(name)];
            }}
          />
          <Legend verticalAlign="bottom" height={32} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function EmployeeCountChart({ title, data }: { title: string; data: CountDatum[] }) {
  return (
    <ChartCard title={title} summary={data.map((item) => `${item.label}: ${item.count}`).join("; ")}>
      <ResponsiveContainer height="100%" minHeight={260} width="100%">
        <BarChart data={data} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            interval={0}
            angle={-25}
            textAnchor="end"
            height={64}
            tickMargin={10}
            tick={{ fill: "#475569", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => [Number(value).toLocaleString(), "Employees"]} />
          <Bar dataKey="count" fill="#4f46e5" maxBarSize={58} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function SalaryByCurrencyChart({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string } & CurrencySalarySummary>;
}) {
  const currencies = [...new Set(rows.map((row) => row.currency))].sort();
  if (currencies.length === 0) return null;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {currencies.map((currency) => {
        const data = rows.filter((row) => row.currency === currency).map((row) => ({
          label: row.label,
          average: Number(row.averageAnnualSalary),
          exactAverage: row.averageAnnualSalary,
          employees: row.employeeCount,
        }));
        const formatter = moneyFormatter(currency);
        return (
          <ChartCard key={currency} title={`${title} · ${currency}`} summary={data.map((item) => `${item.label}: ${formatCurrencyAmount(item.exactAverage, currency)} (${item.employees} employees)`).join("; ")}>
            <ResponsiveContainer height="100%" minHeight={280} width="100%">
              <BarChart data={data} margin={{ top: 12, right: 12, bottom: 8, left: 12 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                interval={0}
                angle={-25}
                textAnchor="end"
                height={64}
                tickMargin={10}
                tick={{ fill: "#475569", fontSize: 10 }}
                tickLine={false}
              />
                <YAxis tickFormatter={(value: number) => formatter.format(value)} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} width={82} />
                <Tooltip formatter={(value) => [formatCurrencyAmount(Number(value).toFixed(2), currency), `Average annual salary (${currency})`]} labelFormatter={(label) => String(label)} />
                <Bar dataKey="average" name={`Average annual salary (${currency})`} maxBarSize={56} radius={[6, 6, 0, 0]}>
                  {data.map((item, index) => <Cell key={`${item.label}-${index}`} fill={chartColors[index % chartColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      })}
    </div>
  );
}

function ChartCard({ children, title, summary }: { children: React.ReactNode; title: string; summary: string }) {
  return (
    <section aria-label={`${title}. ${summary}`} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>
      <div className="h-[300px] min-w-0" role="img" aria-label={`${title}: ${summary}`}>
        {children}
      </div>
      <p className="sr-only">{summary}</p>
    </section>
  );
}
