/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, LogIn, Lock } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar, NavItem } from './components/Sidebar';
import { Header } from './components/Header';
import { WalkthroughModal } from './components/common/WalkthroughModal';
import { canAccessTab, RBAC_ROLE_DEFINITIONS } from './utils/rbac';

// Views
import { DashboardView } from './views/DashboardView';
import { InventoryReceiptsView } from './views/InventoryReceiptsView';
import { LandedCostView } from './views/LandedCostView';
import { InventoryTransfersView } from './views/InventoryTransfersView';
import { InventoryIssuesView } from './views/InventoryIssuesView';
import { ProductionOrdersView } from './views/ProductionOrdersView';
import { QualityControlView } from './views/QualityControlView';
import { CustomerDeliveriesView } from './views/CustomerDeliveriesView';
import { InventoryAuditView } from './views/InventoryAuditView';
import { OdooIntegrationView } from './views/OdooIntegrationView';
import { MasterDataView } from './views/MasterDataView';
import { AuthView } from './views/AuthView';

const MainAppContent: React.FC = () => {
  const { language, currentUser, isAuthenticated } = useApp();
  const isAr = language === 'ar';

  const [currentTab, setCurrentTab] = useState<NavItem>(() => {
    // If user is authenticated, start on dashboard; otherwise start on auth
    return isAuthenticated ? 'dashboard' : 'auth';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [selectedReceiptForLandedCost, setSelectedReceiptForLandedCost] = useState<string | undefined>();

  const handleOpenLandedCostModal = (receiptId: string) => {
    setSelectedReceiptForLandedCost(receiptId);
    setCurrentTab('landed-cost');
  };

  // If user is unauthenticated, they cannot view dashboard or operations
  const isAuthRequired = currentTab !== 'auth';
  const isDenied = currentUser ? !canAccessTab(currentUser.role, currentTab) : true;

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <Header
          currentTab={currentTab}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onNavigateToAuth={() => setCurrentTab('auth')}
          onNavigate={(tab) => setCurrentTab(tab)}
        />

        {/* Scrollable View Canvas */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* 1. Unauthenticated Gateway Check: If user is not logged in and tries to access dashboard or operational views */}
            {!currentUser && currentTab !== 'auth' ? (
              <div className="max-w-md mx-auto my-12 bg-white rounded-2xl p-8 border border-slate-200 shadow-lg text-center space-y-5" id="auth-required-guard">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {isAr ? 'يجب تسجيل الدخول أولاً للوصول إلى لوحة التحكم' : 'Authentication Required'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isAr
                      ? 'لأسباب أمنية وحماية البيانات الصناعية، لا يمكن لأي مستخدم استعراض لوحة المؤشرات أو العمليات دون تسجيل الدخول والتحقق من الصلاحيات (RBAC).'
                      : 'For security and industrial compliance, dashboard analytics and operations are protected. Please sign in to verify your role and permissions.'}
                  </p>
                </div>
                <button
                  id="guard-btn-go-to-auth"
                  onClick={() => setCurrentTab('auth')}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isAr ? 'الانتقال إلى صفحة تسجيل الدخول' : 'Sign In with Credentials'}</span>
                </button>
              </div>
            ) : currentUser && !canAccessTab(currentUser.role, currentTab) ? (
              /* 2. RBAC Forbidden View: User is logged in but role lacks permission for the current tab */
              <div className="max-w-lg mx-auto my-12 bg-white rounded-2xl p-8 border border-rose-200 shadow-md text-center space-y-5" id="rbac-forbidden-guard">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                    {isAr ? 'خطأ في الصلاحيات 403 - وصول محظور' : '403 Forbidden - Role Restricted'}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {isAr ? 'ليس لديك صلاحية للوصول إلى هذا القسم' : 'Access Restricted For Your Role'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isAr
                      ? `دورك الحالي هو (${currentUser.role} - ${RBAC_ROLE_DEFINITIONS[currentUser.role]?.nameAr}). وفقاً لقواعد فصل المهام (Separation of Duties)، لا يمكنك الدخول لهذا القسم.`
                      : `Your assigned role is ${currentUser.role} (${RBAC_ROLE_DEFINITIONS[currentUser.role]?.nameEn}). By Separation of Duties, access to this tab is restricted.`}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    id="btn-rbac-back-dashboard"
                    onClick={() => setCurrentTab('dashboard')}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                  >
                    {isAr ? 'العودة للوحة المؤشرات' : 'Back to Dashboard'}
                  </button>
                  <button
                    id="btn-rbac-switch-account"
                    onClick={() => setCurrentTab('auth')}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition"
                  >
                    {isAr ? 'تبديل الحساب' : 'Switch Account'}
                  </button>
                </div>
              </div>
            ) : (
              /* 3. Authorized Views Rendering */
              <>
                {currentTab === 'dashboard' && (
                  <DashboardView
                    onNavigate={setCurrentTab}
                    onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
                  />
                )}

                {currentTab === 'receipts' && (
                  <InventoryReceiptsView onOpenLandedCostModal={handleOpenLandedCostModal} />
                )}

                {currentTab === 'landed-cost' && (
                  <LandedCostView preselectedReceiptId={selectedReceiptForLandedCost} />
                )}

                {currentTab === 'transfers' && <InventoryTransfersView />}

                {currentTab === 'issues' && <InventoryIssuesView />}

                {(currentTab === 'production' || currentTab === 'cost-adjustments') && (
                  <ProductionOrdersView
                    onNavigateToQuality={() => setCurrentTab('quality')}
                    initialTab={currentTab === 'cost-adjustments' ? 'cost-adjustments' : 'orders'}
                  />
                )}

                {currentTab === 'quality' && <QualityControlView />}

                {currentTab === 'deliveries' && <CustomerDeliveriesView />}

                {currentTab === 'reports' && <InventoryAuditView />}

                {currentTab === 'odoo-sync' && <OdooIntegrationView />}

                {(currentTab === 'master-data' || currentTab === 'users') && (
                  <MasterDataView initialTab={currentTab === 'users' ? 'users' : undefined} />
                )}

                {currentTab === 'auth' && (
                  <AuthView
                    onSuccess={() => setCurrentTab('dashboard')}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Interactive Walkthrough Tour Modal */}
      <WalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
        onNavigateTo={setCurrentTab}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
