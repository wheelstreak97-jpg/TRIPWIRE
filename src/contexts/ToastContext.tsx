import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PartyPopper, CheckCircle2, AlertCircle } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'celebrate';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = nextId++;
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-toast-in flex items-center gap-3 rounded-card border px-4 py-3 text-sm font-medium shadow-lg ${
              toast.kind === 'celebrate'
                ? 'bg-safe/10 border-safe/40 text-safe'
                : toast.kind === 'error'
                  ? 'bg-urgent/10 border-urgent/40 text-urgent'
                  : 'bg-surface border-edge text-text-primary'
            }`}
            style={{ backdropFilter: 'blur(8px)' }}
          >
            {toast.kind === 'celebrate' ? (
              <PartyPopper size={18} />
            ) : toast.kind === 'error' ? (
              <AlertCircle size={18} />
            ) : (
              <CheckCircle2 size={18} className="text-safe" />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
