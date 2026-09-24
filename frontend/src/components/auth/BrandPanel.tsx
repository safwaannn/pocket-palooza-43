import { Sparkles, ShieldCheck, Wallet } from "lucide-react";

export function BrandPanel() {
  return (
    <aside className="hidden border-r border-primary/20 bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-foreground">
          <Wallet className="h-6 w-6" />
        </div>
        <span className="font-display text-2xl font-semibold">Paisa</span>
      </div>

      <div className="max-w-lg">
        <p className="text-xs font-semibold uppercase text-accent">Quiet Wealth</p>
        <h1 className="mt-5 font-display text-5xl font-semibold leading-tight text-primary-foreground xl:text-6xl">
          Your money, reviewed with calm precision.
        </h1>
        <p className="mt-6 max-w-md text-base leading-7 text-primary-foreground/78">
          Track every transaction, review budgets, and keep your monthly cashflow in clear view.
        </p>

        <div className="mt-10 grid grid-cols-3 border-y border-primary-foreground/16">
          {[
            { label: "Income", value: "85k" },
            { label: "Budgeted", value: "12" },
            { label: "Alerts", value: "3" },
          ].map((metric, index) => (
            <div
              key={metric.label}
              className={`py-5 ${index > 0 ? "border-l border-primary-foreground/16 pl-5" : ""}`}
            >
              <p className="finance-figure text-4xl font-semibold text-accent">{metric.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase text-primary-foreground/62">
                {metric.label}
              </p>
            </div>
          ))}
        </div>

        <ul className="mt-8 space-y-3">
          {[
            { icon: Sparkles, text: "AI-assisted budgeting and insights" },
            { icon: ShieldCheck, text: "Account-scoped finance data" },
            { icon: Wallet, text: "Income, expenses, and savings in one place" },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-primary-foreground/84">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-card/10 text-accent ring-1 ring-primary-foreground/14">
                <Icon className="h-4 w-4" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-primary-foreground/58">
        &copy; {new Date().getFullYear()} Paisa. Built for quiet money habits.
      </p>
    </aside>
  );
}
