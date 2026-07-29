import { Link } from 'react-router-dom';
import { Zap, Bell, ListChecks, Flame, ArrowRight, Check } from 'lucide-react';
import { PLANS, PLAN_ORDER } from '@/lib/billing';

const demoRows = [
  { vendor: 'Salesforce', cost: '$1,250/mo', days: 4, pct: 8, state: 'urgent' as const, label: 'Act now' },
  { vendor: 'Figma', cost: '$144/mo', days: 18, pct: 45, state: 'soon' as const, label: 'Renewing soon' },
  { vendor: 'AWS Support', cost: '$500/mo', days: 61, pct: 85, state: 'safe' as const, label: 'Tracked' },
];

const stateBar = { safe: 'bg-safe', soon: 'bg-soon', urgent: 'bg-urgent' };
const stateText = {
  safe: 'text-safe border-safe/40 bg-safe/10',
  soon: 'text-soon border-soon/40 bg-soon/10',
  urgent: 'text-urgent border-urgent/40 bg-urgent/10',
};

const steps = [
  {
    icon: ListChecks,
    title: 'Track every contract',
    body: 'Add each subscription with its renewal date, cost, and cancellation notice window. Takes seconds per vendor.',
  },
  {
    icon: Flame,
    title: 'Watch the fuses burn',
    body: 'Every contract gets a fuse bar that depletes toward renewal — green, amber, red. One glance tells you what needs attention.',
  },
  {
    icon: Bell,
    title: 'Act before it fires',
    body: 'Cancel, renegotiate, or renew on your terms — before the auto-renewal, not after the invoice.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-edge bg-bg/90 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-safe" />
            <span className="font-display font-bold text-lg tracking-tight">Tripwire</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-btn px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-btn bg-safe px-4 py-2 text-sm font-semibold text-bg hover:bg-safe/90 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-8 pt-20 pb-16 text-center">
        <p className="font-mono text-xs text-safe mb-4 tracking-widest uppercase">
          Renewal tracking for ops & finance teams
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
          Never get blindsided by a renewal again.
        </h1>
        <p className="text-text-secondary text-lg mt-6 max-w-xl mx-auto">
          Tripwire puts a fuse on every subscription and vendor contract — and it goes off
          before the renewal fires, not after.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-btn bg-safe px-6 py-3 text-sm font-semibold text-bg hover:bg-safe/90 transition-colors"
          >
            Start tracking free
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-16 max-w-2xl mx-auto rounded-card border border-edge bg-surface p-4 sm:p-6 text-left shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-text-secondary">Upcoming renewals</span>
            <span className="font-mono text-xs text-text-secondary">$1,894/mo tracked</span>
          </div>
          <div className="flex flex-col gap-3">
            {demoRows.map((row) => (
              <div key={row.vendor} className="rounded-card border border-edge bg-bg px-4 py-3.5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium text-sm">{row.vendor}</span>
                    <span
                      className={`inline-flex items-center rounded-btn border px-2 py-0.5 text-xs font-medium ${stateText[row.state]}`}
                    >
                      {row.label}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-text-secondary">
                    {row.cost} · {row.days}d
                  </div>
                </div>
                <div className="mt-2.5 h-1.5 w-full rounded-full bg-edge overflow-hidden">
                  <div
                    className={`fuse-fill h-full rounded-full ${stateBar[row.state]} ${row.state === 'urgent' ? 'pulse-urgent' : ''}`}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-edge">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="rounded-card border border-edge bg-surface p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-btn bg-safe/10 text-safe">
                    <Icon size={18} />
                  </span>
                  <span className="font-mono text-xs text-text-secondary">0{i + 1}</span>
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-edge">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20">
          <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-3">Pricing</h2>
          <p className="text-text-secondary text-center mb-12">
            It pays for itself the first time it catches a forgotten renewal.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLAN_ORDER.map((key, i) => {
              const plan = PLANS[key];
              return (
              <div
                key={plan.name}
                className={`rounded-card border p-6 flex flex-col ${
                  i === 1 ? 'border-safe/50 bg-safe/5' : 'border-edge bg-surface'
                }`}
              >
                <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                <div className="font-mono text-2xl font-semibold mb-1">
                  {plan.price}
                  <span className="text-sm text-text-secondary">/mo</span>
                </div>
                <p className="text-xs text-text-secondary mb-4">{plan.limitLabel}</p>
                <ul className="flex flex-col gap-2 text-sm text-text-secondary flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check size={15} className="text-safe mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className={`rounded-btn px-4 py-2 text-sm font-semibold text-center transition-colors ${
                    i === 1
                      ? 'bg-safe text-bg hover:bg-safe/90'
                      : 'border border-edge text-text-primary hover:border-text-secondary'
                  }`}
                >
                  Get started
                </Link>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-edge">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4">
            Set the tripwire before the next invoice lands.
          </h2>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-btn bg-safe px-6 py-3 text-sm font-semibold text-bg hover:bg-safe/90 transition-colors"
          >
            Start tracking free
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-edge">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex items-center justify-between text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-safe" />
            Tripwire
          </div>
          <span className="font-mono">Never miss a renewal.</span>
        </div>
      </footer>
    </div>
  );
}
