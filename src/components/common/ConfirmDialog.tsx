import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title: string;
  message?: string;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  icon?: LucideIcon;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used within a ConfirmProvider');
  return confirm;
}

const variantStyles: Record<ConfirmVariant, { badge: string; button: string }> = {
  danger: {
    badge: 'bg-rose-50 text-rose-600',
    button: 'bg-rose-600 hover:bg-rose-700',
  },
  warning: {
    badge: 'bg-amber-50 text-amber-600',
    button: 'bg-amber-500 hover:bg-amber-600',
  },
  info: {
    badge: 'bg-blue-50 text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const { language } = useApp();
  const isAr = language === 'ar';

  const confirm = useCallback((options: ConfirmOptions) => {
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    return new Promise<boolean>(resolve => {
      resolveRef.current = resolve;
      setPending({ ...options });
    });
  }, []);

  const close = useCallback((value: boolean) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setPending(null);
    if (resolve) resolve(value);
  }, []);

  useEffect(() => {
    if (!pending) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [pending, close]);

  useEffect(() => {
    if (pending) confirmButtonRef.current?.focus();
  }, [pending]);

  const Icon = pending?.icon ?? AlertTriangle;
  const styles = variantStyles[pending?.variant ?? 'danger'];

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => close(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={pending.title}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${styles.badge}`}>
                <Icon className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => close(false)}
                aria-label={isAr ? 'إغلاق' : 'Close'}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{pending.title}</h3>
              {pending.message && (
                <p className="text-xs text-slate-500 mt-1">{pending.message}</p>
              )}
              {pending.itemName && (
                <div className="mt-2 p-2 bg-slate-50 rounded-lg text-xs font-mono font-bold text-slate-800 border border-slate-200">
                  {pending.itemName}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => close(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                {pending.cancelLabel ?? (isAr ? 'إلغاء' : 'Cancel')}
              </button>
              <button
                type="button"
                ref={confirmButtonRef}
                onClick={() => close(true)}
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition ${styles.button}`}
              >
                {pending.confirmLabel ?? (isAr ? 'تأكيد' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
