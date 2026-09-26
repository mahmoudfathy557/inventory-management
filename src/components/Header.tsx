import React, { useState, useEffect } from 'react';
import {
  Menu,
  Languages,
  LogIn,
  LogOut,
  Search,
  Command,
  ChevronDown,
  Shield,
  Coins
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useConfirm } from './common/ConfirmDialog';
import { NavItem } from './Sidebar';
import { GlobalSearchModal } from './common/GlobalSearchModal';
import { NotificationCenter } from './common/NotificationCenter';
import { PWAInstallButton } from './common/PWAInstallButton';
import { OfflineSyncStatusBadge } from './common/OfflineSyncStatusBadge';
import { OfflineStatusBanner } from './common/OfflineStatusBanner';
import { CompanyLogo } from './common/CompanyLogo';

interface HeaderProps {
  currentTab?: NavItem;
  onToggleSidebar: () => void;
  onNavigateToAuth?: () => void;
  onNavigate?: (tab: NavItem) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab = 'dashboard',
  onToggleSidebar,
  onNavigateToAuth,
  onNavigate
}) => {
  const { language, setLanguage, currentUser, logout } = useApp();
  const confirm = useConfirm();
  const isAr = language === 'ar';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global Keyboard Shortcut: Cmd+K or Ctrl+K or '/' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const roleLabels: Record<string, { ar: string; en: string; color: string }> = {
    ADMIN: { ar: 'مدير النظام', en: 'System Admin', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    INVENTORY_USER: { ar: 'أمين المستودع', en: 'Inventory Manager', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    PRODUCTION_USER: { ar: 'مهندس الإنتاج', en: 'Production Engineer', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    QUALITY_USER: { ar: 'مدير الجودة', en: 'Quality Inspector', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    FINANCE_USER: { ar: 'محاسب التكاليف', en: 'Cost Accountant', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    MANAGEMENT_USER: { ar: 'الإدارة العليا', en: 'Executive Management', color: 'bg-slate-100 text-slate-800 border-slate-300' }
  };

  const tabTitles: Record<string, { ar: string; en: string }> = {
    dashboard: { ar: 'لوحة التحكم', en: 'Dashboard' },
    receipts: { ar: 'إذن استلام', en: 'Receipts' },
    'landed-cost': { ar: 'تكاليف الإنزال', en: 'Landed Cost' },
    transfers: { ar: 'تحويل مخزني', en: 'Transfers' },
    issues: { ar: 'صرف خامات', en: 'Material Issues' },
    production: { ar: 'أوامر الإنتاج', en: 'Work Orders' },
    quality: { ar: 'فحص الجودة', en: 'Quality Check' },
    deliveries: { ar: 'تسليم عملاء', en: 'Deliveries' },
    'cost-adjustments': { ar: 'جرد وتكلفة', en: 'Inventory Audit' },
    'master-data': { ar: 'البيانات الأساسية', en: 'Master Data' },
    reports: { ar: 'التقارير والأستاذ', en: 'Reports & Ledger' },
    'odoo-sync': { ar: 'تكامل أودو ERP', en: 'Odoo ERP Sync' },
    users: { ar: 'الصلاحيات', en: 'User RBAC' },
    auth: { ar: 'تسجيل الدخول', en: 'Authentication' }
  };

  const currentRole = currentUser
    ? roleLabels[currentUser.role] || roleLabels.ADMIN
    : null;

  return (
    <>
      <div className="sticky top-0 z-20 flex flex-col shadow-2xs max-w-full">
        <header className="bg-white/95 backdrop-blur border-b border-slate-200 px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-2.5 w-full max-w-full">
          {/* Left Start: Sidebar Toggle, View Title & Desktop Currency info */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
            <button
              id="btn-toggle-sidebar"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs shrink-0 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Brand Watermark */}
            <div className="hidden lg:flex items-center gap-1.5 ltr:pr-1 rtl:pl-1">
              <CompanyLogo className="w-6 h-6" showText={true} light={false} />
              <span className="text-slate-300 ltr:ml-2 rtl:mr-2">|</span>
            </div>

            {/* Mobile & Tablet View Title Pill */}
            <div className="lg:hidden px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-800 text-xs font-extrabold whitespace-nowrap truncate max-w-[90px] min-[390px]:max-w-[120px] sm:max-w-[160px] md:max-w-[200px]">
              {isAr ? tabTitles[currentTab]?.ar || 'ريمكس' : tabTitles[currentTab]?.en || 'Remix ERP'}
            </div>

            {/* Desktop Base Currency Pill (XL screens) */}
            <div className="hidden xl:flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-600 font-mono">
              <span className="font-bold text-slate-800">EGP</span>
              <span className="text-slate-300">|</span>
              <span className="font-sans text-[11px] text-slate-500">
                {isAr ? 'العملة: جنيه مصري' : 'Base: EGP'}
              </span>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="flex-1 max-w-[150px] sm:max-w-[200px] md:max-w-[280px] lg:max-w-md mx-auto flex items-center justify-center min-w-0 px-0.5">
            {/* Tablet & Desktop Search Input Trigger */}
            <button
              id="btn-header-global-search"
              onClick={() => setIsSearchOpen(true)}
              className="w-full hidden sm:flex items-center justify-between gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 transition shadow-2xs cursor-pointer group text-start min-w-0"
              title={isAr ? 'البحث السريع (Ctrl+K)' : 'Quick Search (Ctrl+K)'}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
                <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 truncate">
                  {isAr ? 'بحث سريع...' : 'Quick Search...'}
                </span>
              </div>

              <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-500 group-hover:text-slate-700 shadow-2xs shrink-0">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </button>

            {/* Mobile-Only Search Icon Trigger */}
            <button
              id="btn-header-mobile-search"
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer shrink-0 min-h-[38px] min-w-[38px] bg-slate-50"
              title={isAr ? 'البحث السريع' : 'Quick Search'}
              aria-label="Quick Search"
            >
              <Search className="w-4 h-4 text-slate-700" />
            </button>
          </div>

          {/* Right Action Center */}
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
            {/* Offline Sync Status Badge (Tablet & Desktop) */}
            <div className="hidden sm:block">
              <OfflineSyncStatusBadge />
            </div>

            {/* PWA Install Button (XL Desktop screens) */}
            <div className="hidden xl:block">
              <PWAInstallButton variant="header" />
            </div>

            {/* Notification Center Trigger (All Screens) */}
            <NotificationCenter onNavigate={onNavigate} />

            {/* Language Switcher (Tablet & Desktop) */}
            <button
              id="btn-lang-toggle"
              onClick={() => setLanguage(isAr ? 'en' : 'ar')}
              className="hidden sm:flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              title={isAr ? 'Switch to English' : 'التحويل للغة العربية'}
            >
              <Languages className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>

            {/* Authenticated User / Options Trigger */}
            {currentUser && currentRole ? (
              <div className="flex items-center gap-1">
                {/* Tablet & Desktop User Tag & Logout Button */}
                <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-6 h-6 rounded-lg bg-blue-600/10 border border-blue-600/20 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <div className="flex flex-col text-start min-w-0">
                      <span className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[80px] md:max-w-[120px]">
                        {currentUser.fullName}
                      </span>
                      <span className={`hidden lg:inline-block text-[10px] font-medium px-1 py-0.2 rounded border self-start ${currentRole.color}`}>
                        {isAr ? currentRole.ar : currentRole.en}
                      </span>
                    </div>
                  </div>

                  <button
                    id="btn-header-logout"
                    onClick={async () => {
                      const ok = await confirm({
                        title: isAr ? 'تسجيل الخروج' : 'Sign Out',
                        message: isAr
                          ? `هل تريد بالتأكيد تسجيل الخروج (${currentUser.fullName})؟`
                          : `Are you sure you want to log out (${currentUser.fullName})?`,
                        confirmLabel: isAr ? 'خروج' : 'Logout',
                        icon: LogOut,
                        variant: 'danger',
                      });
                      if (ok) {
                        logout();
                        if (onNavigateToAuth) onNavigateToAuth();
                      }
                    }}
                    title={isAr ? 'تسجيل الخروج من الجلسة' : 'Sign Out / Logout'}
                    className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="hidden md:inline">{isAr ? 'خروج' : 'Logout'}</span>
                  </button>
                </div>

                {/* Mobile-Only Quick Options Dropdown Toggle Button (< sm) */}
                <button
                  id="btn-mobile-user-options-toggle"
                  onClick={() => setIsMobileMenuOpen(prev => !prev)}
                  className="sm:hidden p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 flex items-center gap-1 cursor-pointer transition shrink-0 min-h-[38px]"
                  aria-label="User Options"
                >
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-2xs shrink-0">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            ) : (
              <button
                id="btn-open-jwt-auth"
                onClick={() => {
                  if (onNavigateToAuth) onNavigateToAuth();
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer shrink-0 min-h-[38px]"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
                <span className="sm:hidden">{isAr ? 'دخول' : 'Login'}</span>
              </button>
            )}
          </div>
        </header>

        {/* Mobile Quick Action Tools & User Options Dropdown Sheet */}
        {isMobileMenuOpen && (
          <div
            id="mobile-header-options-sheet"
            className="sm:hidden bg-slate-900 text-white border-b border-slate-800 p-3.5 space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-xl"
          >
            {/* User Profile Summary */}
            {currentUser && currentRole && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[10px] text-sky-400 font-medium mt-0.5 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-sky-400" />
                      <span>{isAr ? currentRole.ar : currentRole.en}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                    id="btn-mobile-sheet-logout"
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      const ok = await confirm({
                        title: isAr ? 'تسجيل الخروج' : 'Sign Out',
                        message: isAr
                          ? `هل تريد بالتأكيد تسجيل الخروج (${currentUser.fullName})؟`
                          : `Are you sure you want to log out (${currentUser.fullName})?`,
                        confirmLabel: isAr ? 'خروج' : 'Logout',
                        icon: LogOut,
                        variant: 'danger',
                      });
                      if (ok) {
                        logout();
                        if (onNavigateToAuth) onNavigateToAuth();
                      }
                    }}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isAr ? 'خروج' : 'Logout'}</span>
                </button>
              </div>
            )}

            {/* Mobile Actions Toolbar Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Language Switcher */}
              <button
                type="button"
                id="btn-mobile-sheet-lang"
                onClick={() => {
                  setLanguage(isAr ? 'en' : 'ar');
                  setIsMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between text-slate-200 hover:text-white transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-sky-400" />
                  <span>{isAr ? 'اللغة' : 'Language'}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold text-[10px] uppercase font-mono">
                  {isAr ? 'English' : 'العربية'}
                </span>
              </button>

              {/* Currency Info */}
              <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between text-slate-200">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'العملة' : 'Currency'}</span>
                </div>
                <span className="font-mono font-bold text-amber-300 text-xs">EGP</span>
              </div>
            </div>

            {/* Offline Sync Status & PWA Install in Mobile Sheet */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <OfflineSyncStatusBadge />
              <PWAInstallButton variant="header" />
            </div>
          </div>
        )}

        {/* Persistent Offline Status & Sync Banner at bottom of Header */}
        <OfflineStatusBanner />
      </div>

      {/* Global Command-Palette Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
      />
    </>
  );
};



