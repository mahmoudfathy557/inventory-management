import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Printer,
  Ban,
  Calculator,
  X,
  CheckCircle,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../components/common/ConfirmDialog';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusChip } from '../components/common/StatusChip';
import { DocumentPrintModal } from '../components/common/DocumentPrintModal';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { LandedCost } from '../types';
import { usePerceivedLoading } from '../hooks/usePerceivedLoading';

interface LandedCostViewProps {
  preselectedReceiptId?: string;
}

export const LandedCostView: React.FC<LandedCostViewProps> = ({ preselectedReceiptId }) => {
  const { isLoading } = usePerceivedLoading(180);
  const {
    language,
    landedCosts,
    receipts,
    addLandedCost,
    cancelTransaction,
    rawMaterials,
    products,
    currencies,
    currentUser,
    getExchangeRateForDate
  } = useApp();
  const confirm = useConfirm();
  const isAr = language === 'ar';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [printCost, setPrintCost] = useState<LandedCost | null>(null);

  // Form states
  const [costDate, setCostDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedReceiptId, setSelectedReceiptId] = useState(
    preselectedReceiptId || receipts[0]?.id || ''
  );
  const [costType, setCostType] = useState('مصاريف تخليص جمركي ونقل (Customs & Freight)');
  const [amount, setAmount] = useState(10000);
  const [currency, setCurrency] = useState('EGP');
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [allocationMethod, setAllocationMethod] = useState('تخصيص مباشر على إذن الاستلام (Direct Receipt Allocation)');
  const [notes, setNotes] = useState('');

  const selectedReceipt = receipts.find(r => r.id === selectedReceiptId);
  const relatedItem = rawMaterials.find(m => m.id === selectedReceipt?.itemId || m.code === selectedReceipt?.itemCode) ||
                      products.find(p => p.id === selectedReceipt?.itemId || p.code === selectedReceipt?.itemCode);

  const amountEGP = amount * exchangeRate;
  const activeUom = selectedReceipt?.uom || (isAr ? 'كجم' : 'KG');
  
  // Real quantities & values retrieved dynamically from target inventory receipt
  const currentItemQty = selectedReceipt ? selectedReceipt.quantity : 1;
  const currentItemVal = selectedReceipt ? (selectedReceipt.totalValueEGP + (selectedReceipt.landedCostAllocatedEGP || 0)) : 0;
  const currentMAC = currentItemQty > 0 ? currentItemVal / currentItemQty : 0;

  // Rule 13: Value increases by amountEGP, Quantity DOES NOT increase!
  const simulatedNewVal = currentItemVal + amountEGP;
  const simulatedNewMAC = currentItemQty > 0 ? simulatedNewVal / currentItemQty : currentMAC;

  const handleCurrencyChange = (newCurr: string) => {
    setCurrency(newCurr);
    if (newCurr === 'EGP') {
      setExchangeRate(1.0);
    } else {
      const lookup = getExchangeRateForDate(newCurr, costDate);
      setExchangeRate(lookup.rate);
    }
  };

  const handleDateChange = (newDate: string) => {
    setCostDate(newDate);
    if (currency !== 'EGP') {
      const lookup = getExchangeRateForDate(currency, newDate);
      setExchangeRate(lookup.rate);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceipt || amountEGP <= 0) return;

    addLandedCost({
      date: costDate || new Date().toISOString().split('T')[0],
      originalReceiptId: selectedReceipt.id,
      originalReceiptNumber: selectedReceipt.receiptNumber,
      itemId: selectedReceipt.itemId,
      itemName: selectedReceipt.itemName,
      costType,
      amount,
      currency,
      exchangeRate,
      amountEGP,
      allocationMethod,
      notes: notes || `إضافة تكاليف ${costType} على الإذن ${selectedReceipt.receiptNumber}`,
      createdBy: currentUser?.fullName || 'System User'
    });

    setIsCreateOpen(false);
  };

  const columns: Column<LandedCost>[] = [
    {
      key: 'landedCostNumber',
      headerAr: 'رقم السند',
      headerEn: 'Doc Number',
      render: lc => (
        <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
          {lc.landedCostNumber}
        </span>
      ),
      exportValue: lc => lc.landedCostNumber
    },
    {
      key: 'date',
      headerAr: 'التاريخ',
      headerEn: 'Date',
      render: lc => <span className="font-mono text-slate-700">{lc.date}</span>,
      exportValue: lc => lc.date
    },
    {
      key: 'originalReceiptNumber',
      headerAr: 'إذن الاستلام الأصلي',
      headerEn: 'Original Receipt',
      render: lc => (
        <span className="font-mono text-blue-600 font-semibold">{lc.originalReceiptNumber}</span>
      ),
      exportValue: lc => lc.originalReceiptNumber
    },
    {
      key: 'itemName',
      headerAr: 'الصنف المستفيد',
      headerEn: 'Allocated Item',
      render: lc => <span className="font-semibold text-slate-800">{lc.itemName}</span>,
      exportValue: lc => lc.itemName
    },
    {
      key: 'costType',
      headerAr: 'نوع المصروف',
      headerEn: 'Cost Type',
      render: lc => <span className="text-slate-700">{lc.costType}</span>,
      exportValue: lc => lc.costType
    },
    {
      key: 'amountEGP',
      headerAr: 'المبلغ المضاف (EGP)',
      headerEn: 'Landed Amount (EGP)',
      render: lc => (
        <span className="font-mono font-bold text-emerald-700">
          +{formatCurrency(lc.amountEGP, language)}
        </span>
      ),
      exportValue: lc => lc.amountEGP
    },
    {
      key: 'allocationMethod',
      headerAr: 'طريقة التوزيع',
      headerEn: 'Allocation',
      render: lc => <span className="text-slate-500 text-[11px]">{lc.allocationMethod}</span>,
      exportValue: lc => lc.allocationMethod
    },
    {
      key: 'status',
      headerAr: 'الحالة',
      headerEn: 'Status',
      render: lc => <StatusChip status={lc.status} size="sm" />,
      exportValue: lc => lc.status
    },
    {
      key: 'actions',
      headerAr: 'الإجراءات',
      headerEn: 'Actions',
      sortable: false,
      render: lc => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => setPrintCost(lc)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-blue-600"
            title={isAr ? 'طباعة سند تكلفة الإنزال' : 'Print Voucher'}
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          {lc.status === 'POSTED' && (
            <button
              onClick={async () => {
                const ok = await confirm({
                  title: isAr ? 'تأكيد الإلغاء' : 'Confirm Cancellation',
                  message: isAr ? 'هل تريد إلغاء وعكس تكلفة الإنزال هذه؟' : 'Cancel this landed cost?',
                  confirmLabel: isAr ? 'تأكيد الإلغاء' : 'Confirm',
                  icon: Ban,
                  variant: 'danger',
                });
                if (ok) {
                  cancelTransaction('تكلفة إنزال', lc.landedCostNumber, 'إلغاء مصروف إنزال خطأ');
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
    <div className="space-y-5" id="view-landed-cost">
      {/* Title & Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {isAr ? 'تكلفة الإنزال (Landed Cost) - زيادة القيمة دون زيادة الكمية' : 'Landed Costs & Freight Allocation'}
          </h2>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'وفقاً للبند 13: تضاف مصاريف الجمارك والشحن والتخليص والمناولة إلى قيمة المخزون وتحدث متوسط التكلفة مع بقاء الكمية ثابتة'
              : 'Add inventory value (customs, freight, handling) without increasing physical quantity, updating Moving Average Cost.'}
          </p>
        </div>

        <button
          id="btn-add-landed-cost"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إضافة تكلفة إنزال جديدة' : 'New Landed Cost'}</span>
        </button>
      </div>

      {/* Proof Box Example from Spec */}
      <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-950 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-200 text-purple-800">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold">
              {isAr ? 'قاعدة معيار تكلفة الإنزال المطبقة (Section 13):' : 'Section 13 Mathematical Rule:'}
            </div>
            <div className="text-purple-800 mt-0.5 font-mono">
              1,000 KG @ 100,000 EGP (100 EGP/KG) + 10,000 EGP Landed Cost ➔ 1,000 KG @ 110,000 EGP (110 EGP/KG). Quantity must not increase.
            </div>
          </div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        id="landed-cost-table"
        data={landedCosts}
        columns={columns}
        keyExtractor={lc => lc.id}
        searchFields={['landedCostNumber', 'originalReceiptNumber', 'itemName', 'costType']}
        titleAr="سجل أذونات تكاليف الإنزال المعتمدة"
        titleEn="Landed Cost Register"
        exportFileName="Landed_Costs"
        isLoading={isLoading}
      />

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm">
                  {isAr ? 'إضافة تكلفة إنزال على إذن استلام مخزني' : 'Allocate Landed Cost'}
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
              {/* Target Receipt */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'إذن الاستلام المخزني المستهدف *' : 'Target Inventory Receipt *'}
                </label>
                <select
                  value={selectedReceiptId}
                  onChange={e => setSelectedReceiptId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white font-mono"
                  required
                >
                  {receipts
                    .filter(r => r.status === 'POSTED')
                    .map(r => (
                      <option key={r.id} value={r.id}>
                        {r.receiptNumber} - {r.itemName} ({r.quantity} {r.uom}) - {formatCurrency(r.totalValueEGP, language)}
                      </option>
                    ))}
                </select>
              </div>

              {/* Cost Type & Allocation Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'نوع المصروف *' : 'Cost Type *'}
                  </label>
                  <select
                    value={costType}
                    onChange={e => setCostType(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="مصاريف تخليص جمركي (Customs Clearance)">تخليص جمركي (Customs Clearance)</option>
                    <option value="رسوم وضريبة جمركية (Customs Duties)">رسوم جمركية (Customs Duties)</option>
                    <option value="شحن ونقل مبرد (Freight & Transportation)">شحن ونقل مبرد (Freight & Transportation)</option>
                    <option value="رسوم ميناء ومناولة (Port & Handling)">رسوم ميناء ومناولة (Port & Handling)</option>
                    <option value="مصاريف تفريغ وتخزين (Storage & Offloading)">تفريغ وتخزين (Storage & Offloading)</option>
                    <option value="تكاليف إنزال أخرى (Other Landed Costs)">تكاليف إنزال أخرى (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'طريقة التوزيع *' : 'Allocation Method *'}
                  </label>
                  <select
                    value={allocationMethod}
                    onChange={e => setAllocationMethod(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="تخصيص مباشر على إذن الاستلام">تخصيص مباشر على إذن الاستلام</option>
                    <option value="توزيع نسبي حسب القيمة (By Value)">توزيع نسبي حسب القيمة (By Value)</option>
                    <option value="توزيع نسبي حسب الوزن والكمية (By Qty)">توزيع نسبي حسب الوزن (By Qty)</option>
                  </select>
                </div>
              </div>

              {/* Date, Amount, Currency & Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'تاريخ التكلفة *' : 'Cost Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={costDate}
                    onChange={e => handleDateChange(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'مبلغ التكلفة *' : 'Amount *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-200 font-mono font-bold text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'العملة' : 'Currency'}
                  </label>
                  <select
                    value={currency}
                    onChange={e => handleCurrencyChange(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold"
                  >
                    {currencies.map(c => (
                      <option key={c.id} value={c.code}>
                        {c.nameAr} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isAr ? 'سعر الصرف (EGP)' : 'Rate'}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={exchangeRate}
                    onChange={e => setExchangeRate(parseFloat(e.target.value) || 1)}
                    disabled={currency === 'EGP'}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs font-bold text-emerald-800 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isAr ? 'ملاحظات وتفاصيل الفاتورة' : 'Notes'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={isAr ? 'رقم بوليصة الشحن، شهادة الإفراج الجمركي...' : 'Bill of lading, clearance ref'}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>

              {/* Proof Box inside form */}
              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 font-mono space-y-1.5">
                <div className="text-[11px] font-bold text-purple-900 font-sans">
                  {isAr ? 'أثر التعديل على الصنف والمخزون:' : 'Valuation Impact:'}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-purple-200">
                  <div>
                    <span className="text-slate-500 font-sans">{isAr ? 'الكمية الثابتة:' : 'Quantity:'}</span>
                    <div className="font-bold text-slate-900">{formatNumber(currentItemQty, language)} {activeUom}</div>
                    <div className="text-[10px] text-emerald-700 font-sans">{isAr ? 'لا تزيد إطلاقاً' : 'Fixed'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans">{isAr ? 'القيمة الجديدة:' : 'New Value:'}</span>
                    <div className="font-bold text-purple-900">{formatCurrency(simulatedNewVal, language)}</div>
                    <div className="text-[10px] text-purple-700 font-sans">+{formatCurrency(amountEGP, language)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans">{isAr ? 'متوسط التكلفة الجديد:' : 'New MAC:'}</span>
                    <div className="font-bold text-blue-700 text-xs">{formatCurrency(simulatedNewMAC, language)} / {activeUom}</div>
                    <div className="text-[10px] text-slate-500 font-sans">{isAr ? 'السابق: ' : 'Was: '} {formatCurrency(currentMAC, language)}</div>
                  </div>
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
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  {isAr ? 'ترحيل تكلفة الإنزال' : 'Post Landed Cost'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {printCost && (
        <DocumentPrintModal
          isOpen={true}
          onClose={() => setPrintCost(null)}
          titleAr="سند اعتماد تكلفة إنزال إضافية (Landed Cost)"
          titleEn="Landed Cost Official Voucher"
          documentNumber={printCost.landedCostNumber}
          documentDate={printCost.date}
          status={printCost.status}
          createdBy={printCost.createdBy}
          createdDate={printCost.createdDate}
          notes={printCost.notes}
          details={[
            { labelAr: 'إذن الاستلام الأصلي', labelEn: 'Original Receipt', value: printCost.originalReceiptNumber },
            { labelAr: 'الصنف المستفيد', labelEn: 'Beneficiary Item', value: printCost.itemName },
            { labelAr: 'نوع المصروف', labelEn: 'Cost Type', value: printCost.costType },
            { labelAr: 'طريقة التوزيع', labelEn: 'Allocation Method', value: printCost.allocationMethod }
          ]}
          financialSummary={[
            { labelAr: 'مبلغ تكلفة الإنزال المعتمد', labelEn: 'Allocated Landed Cost', value: printCost.amountEGP }
          ]}
        />
      )}
    </div>
  );
};
