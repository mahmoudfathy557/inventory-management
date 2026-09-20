import React from 'react';
import {
  Menu,
  Languages,
  LogIn,
  LogOut
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNavigateToAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onNavigateToAuth }) => {
  const { language, setLanguage, currentUser, setCurrentUser, logout, users } = useApp();
  const isAr = language === 'ar';

  const roleLabels: Record<string, { ar: string; en: string; color: string }> = {
    ADMIN: { ar: 'مدير النظام', en: 'System Admin', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    INVENTORY_USER: { ar: 'أمين المستودع', en: 'Inventory Manager', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    PRODUCTION_USER: { ar: 'مهندس الإنتاج', en: 'Production Engineer', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    QUALITY_USER: { ar: 'مدير الجودة', en: 'Quality Inspector', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    FINANCE_USER: { ar: 'محاسب التكاليف', en: 'Cost Accountant', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    MANAGEMENT_USER: { ar: 'الإدارة العليا', en: 'Executive Management', color: 'bg-slate-100 text-slate-800 border-slate-300' }
  };

  const currentRole = currentUser
    ? roleLabels[currentUser.role] || roleLabels.ADMIN
    : null;

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-2xs">
      {/* Left / Right Start: Sidebar Toggle & Currency info */}
      <div className="flex items-center gap-3">
        <button
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-xs text-slate-600 font-mono">
          <span className="font-bold text-slate-800">EGP</span>
          <span className="text-slate-300">|</span>
          <span className="font-sans text-[11px] text-slate-500">{isAr ? 'العملة الأساسية: جنيه مصري' : 'Base: Egyptian Pound'}</span>
        </div>
      </div>

      {/* Action Center: Language Toggle, Quick User Switcher, Auth/Logout */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Language Switcher */}
        <button
          id="btn-lang-toggle"
          onClick={() => setLanguage(isAr ? 'en' : 'ar')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          title={isAr ? 'Switch to English' : 'التحويل للغة العربية'}
        >
          <Languages className="w-3.5 h-3.5 text-slate-500" />
          <span>{isAr ? 'English' : 'عربي'}</span>
        </button>

        {/* Authenticated User Quick Switcher & Logout */}
        {currentUser && currentRole ? (
          <div className="flex items-center gap-2 border-slate-200">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {currentUser.fullName}
              </span>
              <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border self-end ${currentRole.color}`}>
                {isAr ? currentRole.ar : currentRole.en}
              </span>
            </div>

            <select
              id="select-active-user"
              aria-label={isAr ? 'تبديل المستخدم الحالي' : 'Switch active user'}
              value={currentUser.id}
              onChange={(e) => {
                const selected = users.find(u => u.id === e.target.value);
                if (selected) setCurrentUser(selected);
              }}
              className="text-xs py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({roleLabels[u.role]?.[isAr ? 'ar' : 'en'] || u.role})
                </option>
              ))}
            </select>

            <button
              id="btn-header-logout"
              onClick={() => {
                if (confirm(isAr ? `هل تريد بالتأكيد تسجيل الخروج (${currentUser.fullName})؟` : `Are you sure you want to log out (${currentUser.fullName})?`)) {
                  logout();
                  if (onNavigateToAuth) onNavigateToAuth();
                }
              }}
              title={isAr ? 'تسجيل الخروج من الجلسة' : 'Sign Out / Logout'}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">{isAr ? 'خروج' : 'Logout'}</span>
            </button>
          </div>
        ) : (
          <button
            id="btn-open-jwt-auth"
            onClick={() => {
              if (onNavigateToAuth) onNavigateToAuth();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
