import React from 'react';
import {
  LayoutDashboard,
  PackagePlus,
  ArrowRightLeft,
  Factory,
  CheckCircle2,
  SendHorizontal,
  DollarSign,
  Database,
  FileSpreadsheet,
  RefreshCw,
  Users,
  Layers,
  ChevronRight,
  Sparkles,
  LucideIcon,
  LogIn,
  LogOut,
  KeyRound,
  Shield,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { canAccessTab, RBAC_ROLE_DEFINITIONS } from '../utils/rbac';
import { UserRole } from '../types';
import { PWAInstallButton } from './common/PWAInstallButton';

export type NavItem =
  | 'dashboard'
  | 'receipts'
  | 'landed-cost'
  | 'transfers'
  | 'issues'
  | 'production'
  | 'quality'
  | 'deliveries'
  | 'cost-adjustments'
  | 'master-data'
  | 'reports'
  | 'odoo-sync'
  | 'users'
  | 'auth';

interface SidebarMenuItem {
  id: NavItem;
  labelAr: string;
  labelEn: string;
  icon: LucideIcon;
  highlight?: boolean;
  statusDot?: boolean;
  badge?: string | number;
  badgeColor?: string;
}

interface SidebarMenuGroup {
  labelAr: string;
  labelEn: string;
  items: SidebarMenuItem[];
}

interface SidebarProps {
  currentTab: NavItem;
  setCurrentTab: (tab: NavItem) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, isOpen, setIsOpen }) => {
  const { language, productionOrders, odooConfig, currentUser, logout } = useApp();
  const isAr = language === 'ar';

  const pendingQualityCount = productionOrders.filter(
    o => o.status === 'PENDING_QUALITY' || o.qualityStatus === 'PENDING'
  ).length;

  const menuGroups: SidebarMenuGroup[] = [
    {
      labelAr: 'نظرة عامة',
      labelEn: 'Overview',
      items: [
        {
          id: 'dashboard',
          labelAr: 'لوحة التحكم والمؤشرات',
          labelEn: 'Dashboard & KPIs',
          icon: LayoutDashboard
        }
      ]
    },
    {
      labelAr: 'العمليات المخزنية',
      labelEn: 'Inventory Operations',
      items: [
        {
          id: 'receipts',
          labelAr: 'إذن إضافة مخزني (استلام)',
          labelEn: 'Inventory Receipts',
          icon: PackagePlus
        },
        {
          id: 'landed-cost',
          labelAr: 'تكلفة الإنزال (Landed Cost)',
          labelEn: 'Landed Costs',
          icon: DollarSign
        },
        {
          id: 'transfers',
          labelAr: 'التحويل بين المخازن والمواقع',
          labelEn: 'Stock Transfers',
          icon: ArrowRightLeft
        },
        {
          id: 'issues',
          labelAr: 'إذن صرف مخزني عام',
          labelEn: 'Inventory Issues',
          icon: Layers
        },
        {
          id: 'deliveries',
          labelAr: 'صرف وتسليم بضاعة للعميل',
          labelEn: 'Customer Deliveries',
          icon: SendHorizontal
        }
      ]
    },
    {
      labelAr: 'دورة الإنتاج والتصنيع',
      labelEn: 'Production & Manufacturing',
      items: [
        {
          id: 'production',
          labelAr: 'أوامر الإنتاج وصرف الخامات',
          labelEn: 'Production Orders',
          icon: Factory,
          badge: productionOrders.length
        },
        {
          id: 'quality',
          labelAr: 'فحص واعتماد الجودة',
          labelEn: 'Quality Approvals',
          icon: CheckCircle2,
          badge: pendingQualityCount > 0 ? pendingQualityCount : undefined,
          badgeColor: 'bg-amber-500 text-white'
        },
        {
          id: 'cost-adjustments',
          labelAr: 'تعديلات التكاليف وأثر المبيعات',
          labelEn: 'Cost Bridge & COGS Impact',
          icon: Sparkles,
          highlight: true
        }
      ]
    },
    {
      labelAr: 'التقارير والتدقيق',
      labelEn: 'Reports & Audits',
      items: [
        {
          id: 'reports',
          labelAr: 'تقارير المخزون والتدقيق العام',
          labelEn: 'Inventory & Audit Reports',
          icon: FileSpreadsheet
        }
      ]
    },
    {
      labelAr: 'الربط والتكامل',
      labelEn: 'Integrations',
      items: [
        {
          id: 'odoo-sync',
          labelAr: 'تكامل نظام أودو (Odoo Sync)',
          labelEn: 'Odoo ERP Integration',
          icon: RefreshCw,
          statusDot: odooConfig.isConnected
        }
      ]
    },
    {
      labelAr: 'التهيئة والإدارة',
      labelEn: 'Administration',
      items: [
        {
          id: 'master-data',
          labelAr: 'البيانات الأساسية (Master Data)',
          labelEn: 'Master Data & BOMs',
          icon: Database
        },
        {
          id: 'users',
          labelAr: 'المستخدمين والصلاحيات',
          labelEn: 'Users & Permissions',
          icon: Users
        },
        {
          id: 'auth',
          labelAr: 'تسجيل الدخول / إنشاء حساب',
          labelEn: 'Sign In / Register',
          icon: KeyRound,
          highlight: true
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile/Tablet Backdrop overlay */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-25 lg:hidden transition-opacity duration-200"
          aria-label={isAr ? 'إغلاق القائمة الجانبية' : 'Close Sidebar Overlay'}
        />
      )}

      <aside
        className={`fixed inset-y-0 ${isAr ? 'right-0' : 'left-0'} z-30 w-72 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : isAr ? 'translate-x-full' : '-translate-x-full'
        } border-${isAr ? 'l' : 'r'} border-slate-800 shadow-2xl shrink-0`}
      >
        {/* Brand Header & Close Button */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 shrink-0">
              <Factory className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm text-white tracking-wide truncate">
                {isAr ? 'نظام المخزون والإنتاج' : 'Manufacturing Control'}
              </h1>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {isAr ? 'متوسط التكلفة + تكامل أودو' : 'Moving Avg Cost & Odoo'}
              </p>
            </div>
          </div>

          {/* Close Sidebar Button (Mobile/Tablet and interactive toggle) */}
          <button
            id="btn-close-sidebar"
            onClick={() => setIsOpen(false)}
            aria-label={isAr ? 'إغلاق القائمة الجانبية' : 'Close Sidebar'}
            title={isAr ? 'إغلاق القائمة الجانبية' : 'Close Sidebar'}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {menuGroups.map((group, idx) => {
          // Filter items based on RBAC if user logged in, else only show auth
          const allowedItems = group.items.filter(item => {
            if (!currentUser) return item.id === 'auth';
            return canAccessTab(currentUser.role, item.id);
          });

          if (allowedItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {isAr ? group.labelAr : group.labelEn}
              </div>
              {allowedItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => {
                      setCurrentTab(item.id);
                      if (window.innerWidth < 1024) {
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    } ${item.highlight ? 'ring-1 ring-amber-500/30 text-amber-300' : ''}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.statusDot !== undefined && (
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.statusDot ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                          }`}
                          title={item.statusDot ? 'متصل بأودو' : 'غير متصل'}
                        />
                      )}
                      {item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.badgeColor || 'bg-slate-700 text-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Odoo Connection Quick Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2.5">
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                odooConfig.isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
              }`}
            />
            <div className="text-[11px]">
              <div className="font-semibold text-slate-200">
                {odooConfig.isConnected ? 'Odoo ERP متصل' : 'Odoo ERP غير متصل'}
              </div>
              <div className="text-slate-400 font-mono text-[10px] truncate max-w-[130px]">
                {odooConfig.database || 'odoo_db'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setCurrentTab('odoo-sync')}
            className="px-2 py-1 text-[10px] font-bold bg-blue-600/80 hover:bg-blue-600 text-white rounded-md"
          >
            {isAr ? 'إدارة' : 'Manage'}
          </button>
        </div>

        {/* PWA Install Promotion / Standalone Status */}
        <PWAInstallButton variant="sidebar" />

        {/* User Account & Logout Card */}
        {currentUser ? (
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-blue-400 font-mono">
                  {currentUser.role}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                id="sidebar-btn-open-auth"
                onClick={() => setCurrentTab('auth')}
                title={isAr ? 'صفحة تسجيل الدخول / تبديل الحساب' : 'Login / Switch Account'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <KeyRound className="w-4 h-4" />
              </button>
              <button
                id="sidebar-btn-logout"
                onClick={() => {
                  if (confirm(isAr ? `هل تريد تسجيل خروج ${currentUser.fullName}؟` : `Sign out ${currentUser.fullName}?`)) {
                    logout();
                    setCurrentTab('auth');
                  }
                }}
                title={isAr ? 'تسجيل الخروج' : 'Sign Out / Logout'}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-900/40 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'غير مسجل الدخول' : 'Unauthenticated'}</span>
            </div>
            <button
              id="sidebar-btn-login-prompt"
              onClick={() => setCurrentTab('auth')}
              className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm"
            >
              {isAr ? 'دخول' : 'Sign In'}
            </button>
          </div>
        )}
      </div>
    </aside>
  </>
);
};
