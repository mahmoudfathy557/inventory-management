import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Printer,
  Ban,
  X,
  RotateCw,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusChip } from '../components/common/StatusChip';
import { DocumentPrintModal } from '../components/common/DocumentPrintModal';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { CustomerDelivery } from '../types';

export const CustomerDeliveriesView: React.FC = () => {
  const {
    language,
    customerDeliveries,
    addCustomerDelivery,
    cancelTransaction,
    products,
    warehouses,
    customers,
    currentUser
  } = useApp();
  const isAr = language === 'ar';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [printDelivery, setPrintDelivery] = useState<CustomerDelivery | null>(null);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(
    warehouses.find(w => w.type === 'FINISHED_GOODS')?.id || 'wh-fg'
  );
  const [quantity, setQuantity] = useState(400);
  const [sellingPrice, setSellingPrice] = useState(180);
  const [salesOrderRef, setSalesOrderRef] = useState('SO-2026-089');
  const [notes, setNotes] = useState('');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const selectedProduct = products.find(p => p.id === selectedProductId);

  // Moving Average Cost of FG (e.g. 122.222 EGP)
  const currentMAC = selectedProduct?.movingAverageCost || 122.222;
  const totalCostEGP = quantity * currentMAC;
  const totalRevenueEGP = quantity * sellingPrice;
  const grossProfitEGP = totalRevenueEGP - totalCostEGP;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedCustomer || quantity <= 0) return;
    if (quantity > (selectedProduct.currentQty || 0)) {
      return;
    }

    addCustomerDelivery({
      date: new Date().toISOString().split('T')[0],
      customerId: selectedCustomer.id,
      customerName: isAr ? selectedCustomer.nameAr : selectedCustomer.nameEn,
      warehouseId: selectedWarehouseId,
      productId: selectedProduct.id,
      productCode: selectedProduct.code,
      productName: selectedProduct.nameAr,
      quantity,
      uom: selectedProduct.defaultUOM || 'KG',
      movingAverageCostEGP: currentMAC,
      totalDeliveryValueEGP: totalCostEGP,
      sellingPriceEGP: sellingPrice,
      reference: salesOrderRef,
      notes: notes || 'صرف بضاعة تامة للعميل وفق أمر التوريد',
      createdBy: currentUser.fullName,
      odooSynced: true
    });

    setIsCreateOpen(false);
  };

  const columns: Column<CustomerDelivery>[] = [
    {
      key: 'deliveryNumber',
      headerAr: 'رقم إذن التسليم',
      headerEn: 'Delivery No',
      render: d => (
        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {d.deliveryNumber}
        </span>
      ),
      exportValue: d => d.deliveryNumber
    },
    {
      key: 'date',
      headerAr: 'التاريخ',
      headerEn: 'Date',
      render: d => <span className="font-mono text-slate-700">{d.date}</span>,
      exportValue: d => d.date
    },
    {
      key: 'customerName',
      headerAr: 'العميل',
      headerEn: 'Customer',
      render: d => (
        <div>
          <div className="font-semibold text-slate-900">{d.customerName}</div>
          <div className="text-[11px] text-slate-500 font-mono">{d.reference}</div>
        </div>
      ),
      exportValue: d => d.customerName
    },
    {
      key: 'productName',
      headerAr: 'المنتج التام',
      headerEn: 'Product',
      render: d => <span className="font-medium text-slate-800">{d.productName}</span>,
      exportValue: d => d.productName
    },
    {
      key: 'quantity',
      headerAr: 'الكمية المسلمة',
      headerEn: 'Delivered Qty',
      render: d => (
        <span className="font-mono font-bold text-rose-700">
          -{formatNumber(d.quantity, language)} {d.uom}
        </span>
      ),
      exportValue: d => d.quantity
    },
    {
      key: 'movingAverageCostEGP',
      headerAr: 'متوسط التكلفة (COGS)',
      headerEn: 'Unit MAC',
      render: d => <span className="font-mono">{formatCurrency(d.movingAverageCostEGP, language)}</span>,
      exportValue: d => d.movingAverageCostEGP
    },
    {
      key: 'totalDeliveryValueEGP',
      headerAr: 'تكلفة البضاعة المباعة',
      headerEn: 'Total COGS',
      render: d => (
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(d.totalDeliveryValueEGP, language)}
        </span>
      ),
      exportValue: d => d.totalDeliveryValueEGP
    },
    {
      key: 'sellingPriceEGP',
      headerAr: 'إجمالي القيمة البيعية',
      headerEn: 'Sales Revenue',
      render: d => (
        <span className="font-mono font-bold text-emerald-700">
          {formatCurrency((d.sellingPriceEGP || 0) * d.quantity, language)}
        </span>
      ),
      exportValue: d => (d.sellingPriceEGP || 0) * d.quantity
    },
    {
      key: 'odooSynced',
      headerAr: 'حالة أودو',
      headerEn: 'Odoo Sync',
      render: d => (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit">
          <RotateCw className="w-3 h-3 text-blue-600" />
          <span>{d.odooSynced ? 'SYNCED' : 'PENDING'}</span>
        </span>
      ),
      exportValue: d => d.odooSynced ? 'SYNCED' : 'PENDING'
    },
    {
      key: 'status',
      headerAr: 'الحالة',
      headerEn: 'Status',
      render: d => <StatusChip status={d.status} size="sm" />,
      exportValue: d => d.status
    },
    {
      key: 'actions',
      headerAr: 'الإجراءات',
      headerEn: 'Actions',
      sortable: false,
      render: d => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => setPrintDelivery(d)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-blue-600"
            title={isAr ? 'طباعة إذن تسليم العميل' : 'Print Delivery Note'}
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          {d.status === 'POSTED' && (
            <button
              onClick={() => {
                if (confirm(isAr ? 'هل تريد إلغاء وعكس إذن التسليم هذا؟' : 'Cancel this delivery note?')) {
                  cancelTransaction('إذن تسليم عميل', d.deliveryNumber, 'إلغاء إذن تسليم عميل وعكس المخزون');
                }
              }}
              className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600"
              title={isAr ? 'إلغاء وعكس' : 'Cancel / Reverse'}
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5" id="view-customer-deliveries">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {isAr ? 'صرف وتسليم بضاعة للعملاء (Customer Deliveries & COGS)' : 'Customer Deliveries'}
          </h2>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'وفقاً للبند 25 و26: تخفيض مخزون المنتجات التامة المعتمدة باستخدام متوسط التكلفة المتحرك الفعلي وحساب تكلفة البضاعة المباعة (COGS) والمزامنة مع أودو'
              : 'Issue finished goods to customers, track COGS at moving average cost, and sync delivery status with Odoo.'}
          </p>
        </div>

        <button
          id="btn-new-delivery"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إصدار إذن تسليم عميل جديد' : 'New Delivery Note'}</span>
        </button>
      </div>

      <DataTable
        id="deliveries-table"
        data={customerDeliveries}
        columns={columns}
        keyExtractor={d => d.id}
        searchFields={['deliveryNumber', 'customerName', 'productName', 'reference']}
        titleAr="سجل أذونات تسليم العملاء"
        titleEn="Customer Deliveries Register"
        exportFileName="Customer_Deliveries"
      />

      {/* Modal: Create Delivery */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">
                  {isAr ? 'إصدار إذن تسليم بضاعة تامة لعميل' : 'New Customer Delivery Note'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'العميل المستلم *' : 'Customer *'}
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    required
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nameAr} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'المنتج التام المصروف *' : 'Finished Product *'}
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    required
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nameAr} - رصيد: {p.currentQty} {p.defaultUOM} (متوسط: {formatCurrency(p.movingAverageCost, language)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity & Selling Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? `الكمية المسلمة (${selectedProduct?.defaultUOM || 'KG'}) *` : 'Delivered Qty *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={quantity}
                    onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                    className={`w-full p-2 rounded-lg border font-mono font-bold ${
                      quantity > (selectedProduct?.currentQty || 0)
                        ? 'border-rose-300 bg-rose-50/50 text-rose-700'
                        : 'border-slate-200'
                    }`}
                    required
                  />
                  <div className="flex items-center justify-between text-[11px] mt-1">
                    <span className="text-slate-500">{isAr ? 'الرصيد المتاح:' : 'Available Stock:'}</span>
                    <span className={`font-mono font-bold ${
                      quantity > (selectedProduct?.currentQty || 0) ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {formatNumber(selectedProduct?.currentQty || 0, language)} {selectedProduct?.defaultUOM || 'KG'}
                    </span>
                  </div>
                  {quantity > (selectedProduct?.currentQty || 0) && (
                    <div className="text-[10px] text-rose-600 font-bold mt-0.5">
                      {isAr ? '⚠️ الكمية المطلوبة تتجاوز الرصيد المتاح بالمستودع' : '⚠️ Exceeds available stock'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'سعر بيع الوحدة (EGP) *' : 'Selling Price (EGP) *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'رقم أمر البيع / المرجع' : 'Sales Order Ref'}
                  </label>
                  <input
                    type="text"
                    value={salesOrderRef}
                    onChange={e => setSalesOrderRef(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'المستودع المصدر' : 'Warehouse'}
                  </label>
                  <select
                    value={selectedWarehouseId}
                    onChange={e => setSelectedWarehouseId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {warehouses
                      .filter(w => w.type === 'FINISHED_GOODS')
                      .map(w => (
                        <option key={w.id} value={w.id}>
                          {w.nameAr}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Live Financial Breakdown */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-mono space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="font-sans text-slate-600">{isAr ? 'تكلفة البضاعة المباعة (COGS):' : 'Cost of Goods Sold (COGS):'}</span>
                  <span className="font-bold">{formatCurrency(totalCostEGP, language)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-slate-600">{isAr ? 'إجمالي إيراد البيع:' : 'Sales Revenue:'}</span>
                  <span className="font-bold text-slate-900">{formatCurrency(totalRevenueEGP, language)}</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200 pt-1">
                  <span className="font-sans text-slate-700 font-bold">{isAr ? 'مجمل الربح التقديري:' : 'Estimated Gross Margin:'}</span>
                  <span className="font-bold text-emerald-800 font-sans">
                    +{formatCurrency(grossProfitEGP, language)} ({((grossProfitEGP / (totalRevenueEGP || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isAr ? 'ترحيل إذن التسليم ومزامنة أودو' : 'Post & Sync Odoo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Delivery Voucher */}
      {printDelivery && (
        <DocumentPrintModal
          isOpen={true}
          onClose={() => setPrintDelivery(null)}
          titleAr="إذن تسليم بضاعة رسمية للعميل (Delivery Note)"
          titleEn="Official Customer Delivery Note"
          documentNumber={printDelivery.deliveryNumber}
          documentDate={printDelivery.date}
          status={printDelivery.status}
          createdBy={printDelivery.createdBy}
          notes={printDelivery.notes}
          details={[
            { labelAr: 'العميل المستلم', labelEn: 'Customer Name', value: printDelivery.customerName },
            { labelAr: 'رقم أمر البيع', labelEn: 'Sales Order Ref', value: printDelivery.reference || '-' },
            { labelAr: 'المنتج المسلم', labelEn: 'Delivered Product', value: printDelivery.productName },
            { labelAr: 'الكمية المسلمة', labelEn: 'Delivered Qty', value: `${printDelivery.quantity} ${printDelivery.uom}` },
            { labelAr: 'سعر الوحدة البيعي', labelEn: 'Unit Selling Price', value: formatCurrency(printDelivery.sellingPriceEGP || 0, language) }
          ]}
          financialSummary={[
            { labelAr: 'إجمالي قيمة الفاتورة البيعية', labelEn: 'Invoice Value', value: (printDelivery.sellingPriceEGP || 0) * printDelivery.quantity },
            { labelAr: 'تكلفة البضاعة المباعة (COGS)', labelEn: 'Cost of Goods Sold', value: printDelivery.totalDeliveryValueEGP }
          ]}
        />
      )}
    </div>
  );
};
