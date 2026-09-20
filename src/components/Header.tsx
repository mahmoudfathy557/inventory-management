import React from 'react';
import {
  Menu,
  Languages,
  Shield,
  RotateCcw,
  RefreshCw,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenWalkthroughModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenWalkthroughModal }) => {
  const { language, setLanguage, currentUser, setCurrentUser, users, resetToSampleMVP, odooConfig } = useApp();
  const isAr = language === 'ar';

  const roleLabels: Record<string, { ar: string; en: string; color: string }> = {
    ADMIN: { ar: 'مدير النظام', en: 'System Admin', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    INVENTORY_USER: { ar: 'أمين المستودع', en: 'Inventory Manager', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    PRODUCTION_USER: { ar: 'مهندس الإنتاج', en: 'Production Engineer', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    QUALITY_USER: { ar: 'مدير الجودة', en: 'Quality Inspector', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    FINANCE_USER: { ar: 'محاسب التكاليف', en: 'Cost Accountant', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    MANAGEMENT_USER: { ar: 'الإدارة العليا', en: 'Executive Management', color: 'bg-slate-100 text-slate-800 border-slate-300' }
  };

  const currentRole = roleLabels[currentUser.role] || roleLabels.ADMIN;

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs">
      {/* Left / Right Start: Sidebar Toggle & Page Title info */}
      <div className="flex items-center gap-3">
        <button
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 font-mono text-[11px]">
            <span className="font-semibold text-slate-700">EGP</span>
            <span className="text-slate-400">|</span>
            <span>{isAr ? 'العملة الأساسية: جنيه مصري' : 'Base: Egyptian Pound'}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{isAr ? 'متوسط التكلفة المتحرك' : 'Moving Average Cost'}</span>
          </div>
        </div>
      </div>

      {/* Action Center: Walkthrough, User Switcher, Language Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sample MVP Walkthrough Button */}
        {onOpenWalkthroughModal && (
          <button
            id="btn-walkthrough-demo"
            onClick={onOpenWalkthroughModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs hover:from-blue-700 hover:to-indigo-700 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAr ? 'سيناريو الدورة المعيارية' : 'MVP Flow Demo'}</span>
            <span className="sm:hidden">{isAr ? 'الدورة' : 'Demo'}</span>
          </button>
        )}

        {/* Reset Data Button */}
        <button
          id="btn-reset-data"
          onClick={() => {
            if (confirm(isAr ? 'هل تريد استعادة البيانات المعيارية النموذجية؟' : 'Reset to default sample data?')) {
              resetToSampleMVP();
            }
          }}
          title={isAr ? 'استعادة بيانات النموذج المعياري' : 'Reset sample data'}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200 text-xs flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Language Switcher */}
        <button
          id="btn-lang-toggle"
          onClick={() => setLanguage(isAr ? 'en' : 'ar')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
        >
          <Languages className="w-3.5 h-3.5 text-slate-500" />
          <span>{isAr ? 'English' : 'عربي'}</span>
        </button>

        {/* Active User Switcher */}
        <div className="flex items-center gap-2 border-r pr-2 border-slate-200">
          <div className="hidden lg:flex flex-col text-right">
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
        </div>
      </div>
    </header>
  );
};
