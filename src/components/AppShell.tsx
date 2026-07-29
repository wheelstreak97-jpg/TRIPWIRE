import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  Settings,
  CreditCard,
  Zap,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/NotificationBell';

const navItems = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/subscriptions', label: 'Subscriptions', icon: ListChecks },
  { to: '/app/settings', label: 'Settings', icon: Settings },
  { to: '/app/billing', label: 'Billing', icon: CreditCard },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { organization, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (profile?.full_name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const nav = (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-btn px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-surface-hover text-text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`
          }
        >
          <Icon size={17} />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-bg">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-56 flex-col border-r border-edge bg-bg">
        <div className="flex items-center gap-2 px-6 h-16 border-b border-edge">
          <Zap size={20} className="text-safe" />
          <span className="font-display font-bold text-lg tracking-tight">Tripwire</span>
        </div>
        <div className="py-4 flex-1">{nav}</div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 mx-3 mb-4 rounded-btn px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)}>
          <aside
            className="absolute inset-y-0 left-0 w-64 bg-bg border-r border-edge flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 h-16 border-b border-edge">
              <div className="flex items-center gap-2">
                <Zap size={20} className="text-safe" />
                <span className="font-display font-bold text-lg">Tripwire</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-text-secondary hover:text-text-primary">
                <X size={20} />
              </button>
            </div>
            <div className="py-4 flex-1">{nav}</div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 mx-3 mb-4 rounded-btn px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
            >
              <LogOut size={17} />
              Sign out
            </button>
          </aside>
        </div>
      )}

      <div className="lg:pl-56">
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-8 border-b border-edge bg-bg/90 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-text-secondary hover:text-text-primary"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-medium text-text-secondary">
              {organization?.name ?? ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div
              className="flex items-center justify-center h-8 w-8 rounded-full bg-surface-hover text-xs font-semibold text-text-primary"
              title={profile?.full_name ?? ''}
            >
              {initials}
            </div>
          </div>
        </header>
        <main className="px-4 sm:px-8 py-8 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
