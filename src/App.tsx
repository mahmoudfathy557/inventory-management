/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar, NavItem } from './components/Sidebar';
import { Header } from './components/Header';
import { WalkthroughModal } from './components/common/WalkthroughModal';

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

const MainAppContent: React.FC = () => {
  const { language } = useApp();
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [selectedReceiptForLandedCost, setSelectedReceiptForLandedCost] = useState<string | undefined>();

  const handleOpenLandedCostModal = (receiptId: string) => {
    setSelectedReceiptForLandedCost(receiptId);
    setCurrentTab('landed-cost');
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
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
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onOpenWalkthroughModal={() => setIsWalkthroughOpen(true)}
        />

        {/* Scrollable View Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
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
