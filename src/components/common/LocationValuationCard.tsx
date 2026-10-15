import React from 'react';
import { Lock, AlertOctagon, CheckCircle2, TrendingUp, Warehouse as WhIcon, Sparkles } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { Language } from '../../types';

interface LocationValuationCardProps {
  language: Language;
  locationName: string;
  itemUOM: string;
  currentOnHand: number;
  currentValue: number;
  currentMAC: number;
  transactionQuantity: number;
  direction: 'INCOMING' | 'OUTGOING' | 'TRANSFER' | 'VALUATION_ONLY';
  unitCost: number;
  isCostLocked: boolean;
  lockReason?: string;
  projectedNewOnHand?: number;
  projectedNewValue?: number;
  projectedNewMAC?: number;
  showProjections?: boolean;
}

export const LocationValuationCard: React.FC<LocationValuationCardProps> = ({
  language,
  locationName,
  itemUOM,
  currentOnHand,
  currentValue,
  currentMAC,
  transactionQuantity,
  direction,
  unitCost,
  isCostLocked,
  lockReason,
  projectedNewOnHand,
  projectedNewValue,
  projectedNewMAC,
  showProjections = true
}) => {
  const isAr = language === 'ar';
  const isOutgoing = direction === 'OUTGOING' || direction === 'TRANSFER';
  const isInsufficient = isOutgoing && transactionQuantity > currentOnHand;

  return (
    <div className={`p-4 rounded-xl border text-xs space-y-3 transition-all ${
      isInsufficient
        ? 'bg-rose-50/90 border-rose-300 text-rose-900 shadow-xs'
        : 'bg-slate-50 border-slate-200 text-slate-800'
    }`}>
      {/* Header with Location & Lock status */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs text-slate-700">
            <WhIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block">{locationName}</span>
            <span className="text-[10px] text-slate-500">
              {isAr ? 'طبقة تقييم المستودع المستقلة (Location Valuation Layer)' : 'Independent Warehouse Valuation Layer'}
            </span>
          </div>
        </div>

        {isCostLocked && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-[11px]">
            <Lock className="w-3 h-3 text-amber-700" />
            <span>
              {lockReason || (isAr ? 'متوسط تكلفة الموقع مقفل آلياً (SAP MAC Locked)' : 'System-calculated MAC (Locked)')}
            </span>
          </div>
        )}
      </div>

      {/* Current Balances Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="p-2 bg-white rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 block mb-0.5">
            {isAr ? 'الرصيد الفعلي الحالي' : 'Current On-Hand'}
          </span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {formatNumber(currentOnHand, language)} <span className="text-[10px] text-slate-500">{itemUOM}</span>
          </span>
        </div>

        <div className="p-2 bg-white rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 block mb-0.5">
            {isAr ? 'الرصيد المتاح للصرف' : 'Available Qty'}
          </span>
          <span className={`font-mono font-bold text-sm ${currentOnHand <= 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            {formatNumber(Math.max(0, currentOnHand), language)} <span className="text-[10px] text-slate-500">{itemUOM}</span>
          </span>
        </div>

        <div className="p-2 bg-white rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 block mb-0.5">
            {isAr ? 'متوسط تكلفة الموقع (MAC)' : 'Location MAC'}
          </span>
          <span className="font-mono font-bold text-blue-700 text-sm">
            {formatCurrency(currentMAC, language)}
          </span>
        </div>

        <div className="p-2 bg-white rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 block mb-0.5">
            {isAr ? 'إجمالي قيمة المخزون' : 'Inventory Value'}
          </span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {formatCurrency(currentValue, language)}
          </span>
        </div>
      </div>

      {/* Insufficient Stock Alert */}
      {isInsufficient && (
        <div className="p-3 bg-rose-100 rounded-lg border border-rose-300 text-rose-900 flex items-start gap-2 text-xs">
          <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">
              {isAr ? 'عجز في رصيد الموقع - لا يمكن ترحيل الحركة' : 'Insufficient Stock Error'}
            </span>
            <span className="text-[11px] leading-relaxed">
              {isAr
                ? `الرصيد المتاح في الموقع (${formatNumber(currentOnHand, language)} ${itemUOM}) أقل من الكمية المطلوبة (${formatNumber(transactionQuantity, language)} ${itemUOM}). وفقاً لمعايير SAP B1، يمنع النظام الحركات التي تسبب رصيداً سالباً.`
                : `Insufficient stock at the selected location. Available: ${formatNumber(currentOnHand, language)} ${itemUOM}, Requested: ${formatNumber(transactionQuantity, language)} ${itemUOM}. Negative inventory is not permitted.`}
            </span>
          </div>
        </div>
      )}

      {/* Real-Time Projections After Movement */}
      {showProjections && !isInsufficient && transactionQuantity > 0 && projectedNewOnHand !== undefined && (
        <div className="pt-2 border-t border-slate-200/60 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-600 font-semibold">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{isAr ? 'الأثر المتوقع على الموقع بعد الترحيل:' : 'Projected Post-Movement Balances:'}</span>
            </span>
            <span className="font-mono font-bold text-slate-900">
              {isAr ? 'قيمة الحركة:' : 'Movement Value:'} {formatCurrency(transactionQuantity * unitCost, language)}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white/80 rounded-lg border border-slate-200 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 mr-1">{isAr ? 'الرصيد المتبقي:' : 'New Qty:'}</span>
              <span className="font-bold text-slate-900">{formatNumber(projectedNewOnHand, language)} {itemUOM}</span>
            </div>
            <div>
              <span className="text-slate-500 mr-1">{isAr ? 'القيمة الجديدة:' : 'New Value:'}</span>
              <span className="font-bold text-slate-900">{formatCurrency(projectedNewValue || 0, language)}</span>
            </div>
            <div>
              <span className="text-slate-500 mr-1">{isAr ? 'متوسط التكلفة بعد الترحيل:' : 'New MAC:'}</span>
              <span className="font-bold text-blue-700">{formatCurrency(projectedNewMAC || 0, language)}</span>
              {isOutgoing && (
                <span className="text-[10px] text-slate-400 ml-1 font-sans">
                  ({isAr ? 'ثابت لا يتغير بالحركات الصادرة' : 'unchanged on issue'})
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
