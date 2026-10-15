import React, { useState, useEffect } from 'react';
import {
  Ban,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Layers,
  Building2,
  Package,
  Calendar,
  FileText,
  DollarSign,
  Scale,
  Link as LinkIcon,
  HelpCircle,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CancellationPreview, DependentDocInfo } from '../../services/transactionCancellationService';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface SafeTransactionCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: string;
  documentNumber: string;
  onSuccess?: (reversalDocNumber?: string) => void;
}

export const SafeTransactionCancelModal: React.FC<SafeTransactionCancelModalProps> = ({
  isOpen,
  onClose,
  documentType,
  documentNumber,
  onSuccess
}) => {
  const { language, inspectCancellation, cancelTransaction, deleteDraftTransaction, currentUser } = useApp();
  const isAr = language === 'ar';

  const [preview, setPreview] = useState<CancellationPreview | null>(null);
  const [reason, setReason] = useState('');
  const [cascade, setCascade] = useState(true);
  const [stepConfirmed, setStepConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick select reasons
  const quickReasons = isAr
    ? [
        'خطأ في إدخال الكمية',
        'خطأ في السعر أو التكلفة',
        'تعديل خطة التشغيل',
        'مرتجع معتمد من الإدارة',
        'إدخال مستند مكرر عن طريق الخطأ'
      ]
    : [
        'Incorrect Quantity Entry',
        'Cost/Pricing Error',
        'Production Plan Revision',
        'Authorized Management Return',
        'Accidental Duplicate Posting'
      ];

  useEffect(() => {
    if (isOpen && documentNumber) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setReason('');
      setStepConfirmed(false);
      try {
        const p = inspectCancellation(documentType, documentNumber);
        setPreview(p);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error inspecting transaction');
      }
    }
  }, [isOpen, documentType, documentNumber]);

  if (!isOpen) return null;

  const isDraft = preview?.isDraft;
  const isCancelled = preview?.isCancelled;
  const isHighConsequence = (preview?.transactedTotalValue || 0) > 10000 || (preview?.dependencies?.length || 0) > 0;
  const requiresTwoStep = !isDraft && isHighConsequence;

  const handleAction = async () => {
    if (!preview) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (isDraft) {
        const res = await deleteDraftTransaction(preview.documentType, preview.documentNumber);
        setSuccessMsg(res.message);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1200);
      } else {
        if (!reason.trim()) {
          setErrorMsg(isAr ? 'يرجى كتابة سبب الإلغاء والعكس.' : 'Please provide a cancellation reason.');
          setIsSubmitting(false);
          return;
        }

        const res = await cancelTransaction(preview.documentType, preview.documentNumber, reason, { cascade });
        setSuccessMsg(res.message);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess(res.reversalNumber);
        }, 1400);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col text-xs animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDraft
            ? 'bg-amber-500 text-white'
            : isCancelled
            ? 'bg-slate-800 text-white'
            : 'bg-rose-600 text-white'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-xs">
              {isDraft ? <Trash2 className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">
                  {isDraft
                    ? (isAr ? 'حذف مسودة العملية (غير مرحلة)' : 'Delete Draft Transaction')
                    : isCancelled
                    ? (isAr ? 'تفاصيل إلغاء وعكس العملية' : 'Transaction Reversal Audit')
                    : (isAr ? 'إلغاء وعكس العملية المستندية' : 'Cancel Transaction & Reverse Ledger')}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-black/20 text-white">
                  {preview?.documentNumber || documentNumber}
                </span>
              </div>
              <p className="text-[11px] text-white/80 mt-0.5">
                {isDraft
                  ? (isAr ? 'حذف المسودة آمن ولا ينشئ قيوداً عكسية لعدم ترحيلها' : 'Draft has not posted any stock or ledger movements')
                  : (isAr ? 'إلغاء آمن مع الحفاظ على الأثر الرقابي وإعادة احتساب التكلفة' : 'Safe reversal with audit trail and MAC recalculation')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition text-white/90 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Status Banners */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs font-semibold leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-xs font-bold">{successMsg}</div>
            </div>
          )}

          {preview && (
            <>
              {/* Document Overview Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 block">{isAr ? 'نوع المستند' : 'Document Type'}</span>
                  <span className="font-bold text-slate-800">{isAr ? preview.documentTypeAr : preview.documentTypeEn}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">{isAr ? 'تاريخ الحركة' : 'Posting Date'}</span>
                  <span className="font-mono text-slate-800">{preview.documentDate || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">{isAr ? 'الحالة الحالية' : 'Current Status'}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    preview.isCancelled
                      ? 'bg-rose-100 text-rose-700'
                      : preview.isDraft
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {preview.currentStatus}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">{isAr ? 'قيمة العملية' : 'Transaction Value'}</span>
                  <span className="font-bold text-blue-700 font-mono">
                    {formatCurrency(preview.transactedTotalValue, language)}
                  </span>
                </div>
              </div>

              {/* Safety Evaluation Banner */}
              {preview.isCancelled ? (
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 flex items-center gap-2.5">
                  <Ban className="w-5 h-5 text-slate-500 shrink-0" />
                  <div>
                    <div className="font-bold text-xs">{isAr ? 'هذه العملية ملغاة بالفعل' : 'Transaction Already Cancelled'}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {isAr
                        ? 'تم تسجيل قيد عكسي معتمد وتحديث الأرصدة مسبقاً. لا توجد عمليات أخرى مطلوبة.'
                        : 'A ledger reversal entry has already been created. No further action can be taken.'}
                    </div>
                  </div>
                </div>
              ) : !preview.canExecute ? (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-rose-700">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>{isAr ? 'عملية الإلغاء محظورة رقابياً' : 'Cancellation Blocked by Integrity Rules'}</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-1 pt-1">
                    {(isAr ? preview.blockingReasonsAr : preview.blockingReasonsEn).map((reason, idx) => (
                      <li key={idx} className="leading-relaxed">{reason}</li>
                    ))}
                  </ul>
                </div>
              ) : preview.warningsAr.length > 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>{isAr ? 'تنبيهات محاسبية قبل الاعتماد' : 'Valuation & Accounting Notices'}</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pt-0.5">
                    {(isAr ? preview.warningsAr : preview.warningsEn).map((w, idx) => (
                      <li key={idx} className="leading-relaxed">{w}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="text-xs font-semibold">
                    {isAr
                      ? 'العملية آمنة تماماً: تم التحقق من عدم وجود رصيد سالب أو تعارض في التكاليف.'
                      : 'Operation is completely safe: verified no negative stock or costing conflicts.'}
                  </div>
                </div>
              )}

              {/* Location Stock & Valuation Before/After Impact Card */}
              {preview.primaryImpact && (
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
                  <div className="p-2.5 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-400" />
                      <span className="font-bold">
                        {preview.primaryImpact.warehouseName}
                      </span>
                      <span className="text-slate-400">({preview.primaryImpact.warehouseId})</span>
                    </div>
                    <div className="text-xs text-slate-300 font-mono">
                      {preview.primaryImpact.itemName} ({preview.primaryImpact.itemCode})
                    </div>
                  </div>

                  <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-100">
                    {/* Quantity */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">
                        {isAr ? 'كمية المخزون' : 'Stock Quantity'}
                      </span>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{isAr ? 'الرصيد الحالي:' : 'Current:'}</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatNumber(preview.primaryImpact.currentOnHand, language)} {preview.primaryImpact.uom}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{isAr ? 'أثر العكس:' : 'Reversal Effect:'}</span>
                        <span className={`font-mono font-bold ${
                          preview.primaryImpact.qtyDelta > 0
                            ? 'text-emerald-600'
                            : preview.primaryImpact.qtyDelta < 0
                            ? 'text-rose-600'
                            : 'text-slate-500'
                        }`}>
                          {preview.primaryImpact.qtyDelta > 0 ? `+${preview.primaryImpact.qtyDelta}` : preview.primaryImpact.qtyDelta} {preview.primaryImpact.uom}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="font-bold text-slate-900">{isAr ? 'الرصيد بعد العكس:' : 'Post Balance:'}</span>
                        <span className={`font-mono font-bold ${preview.primaryImpact.postOnHand < 0 ? 'text-rose-600' : 'text-blue-700'}`}>
                          {formatNumber(preview.primaryImpact.postOnHand, language)} {preview.primaryImpact.uom}
                        </span>
                      </div>
                    </div>

                    {/* Inventory Value */}
                    <div className="space-y-1 sm:pr-3">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">
                        {isAr ? 'قيمة المخزون' : 'Inventory Value'}
                      </span>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{isAr ? 'القيمة الحالية:' : 'Current Value:'}</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatCurrency(preview.primaryImpact.currentValue, language)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{isAr ? 'تغير القيمة:' : 'Value Delta:'}</span>
                        <span className={`font-mono font-bold ${
                          preview.primaryImpact.valueDelta > 0
                            ? 'text-emerald-600'
                            : preview.primaryImpact.valueDelta < 0
                            ? 'text-rose-600'
                            : 'text-slate-500'
                        }`}>
                          {preview.primaryImpact.valueDelta > 0 ? `+${formatCurrency(preview.primaryImpact.valueDelta, language)}` : formatCurrency(preview.primaryImpact.valueDelta, language)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="font-bold text-slate-900">{isAr ? 'القيمة بعد العكس:' : 'Post Value:'}</span>
                        <span className="font-mono font-bold text-blue-700">
                          {formatCurrency(preview.primaryImpact.postValue, language)}
                        </span>
                      </div>
                    </div>

                    {/* Moving Average Cost */}
                    <div className="space-y-1 sm:pr-3">
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">
                        {isAr ? 'متوسط التكلفة المتحرك (MAC)' : 'Moving Avg Cost'}
                      </span>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{isAr ? 'التكلفة الحالية:' : 'Current MAC:'}</span>
                        <span className="font-mono font-bold text-slate-800">
                          {preview.primaryImpact.currentMAC.toFixed(3)} ج.م
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{isAr ? 'التكلفة المعاد احتسابها:' : 'Recomputed MAC:'}</span>
                        <span className="font-mono font-bold text-purple-700">
                          {preview.primaryImpact.postMAC.toFixed(3)} ج.م
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="text-[11px] text-slate-500">{isAr ? 'فرق التكلفة:' : 'Cost Variance:'}</span>
                        <span className="font-mono text-[11px] text-slate-700">
                          {(preview.primaryImpact.postMAC - preview.primaryImpact.currentMAC).toFixed(3)} ج.م
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Secondary Warehouse Impact (For Transfers) */}
              {preview.secondaryImpact && (
                <div className="rounded-xl border border-sky-200 overflow-hidden bg-sky-50/50 shadow-xs">
                  <div className="p-2.5 bg-sky-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-400" />
                      <span className="font-bold">
                        {preview.secondaryImpact.warehouseName} ({isAr ? 'مستودع الصرف الأصلي - استعادة الرصيد' : 'Original Source Wh - Stock Restored'})
                      </span>
                    </div>
                  </div>
                  <div className="p-3 grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">{isAr ? 'الكمية المسترجعة' : 'Restored Qty'}</span>
                      <span className="font-mono font-bold text-emerald-700">
                        +{preview.secondaryImpact.qtyDelta} {preview.secondaryImpact.uom}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">{isAr ? 'الرصيد بعد الاستعادة' : 'Post On-Hand'}</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatNumber(preview.secondaryImpact.postOnHand, language)} {preview.secondaryImpact.uom}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">{isAr ? 'متوسط التكلفة' : 'Location MAC'}</span>
                      <span className="font-mono font-bold text-slate-800">
                        {preview.secondaryImpact.postMAC.toFixed(3)} ج.م
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dependent Documents Section */}
              {preview.dependencies.length > 0 && (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                      <span>{isAr ? 'المستندات والعمليات المرتبطة' : 'Linked Dependent Documents'}</span>
                      <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px]">
                        {preview.dependencies.length}
                      </span>
                    </div>
                    {preview.canCascadeAll && (
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={cascade}
                          onChange={e => setCascade(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{isAr ? 'إلغاء وعكس المستندات المرتبطة آلياً' : 'Cascade cancel linked documents'}</span>
                      </label>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {preview.dependencies.map((dep: DependentDocInfo) => (
                      <div
                        key={dep.id}
                        className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600 px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-[11px]">
                            {dep.documentNumber}
                          </span>
                          <span className="text-slate-700 font-semibold">
                            {isAr ? dep.documentTypeAr : dep.documentTypeEn}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {isAr ? dep.impactDescriptionAr : dep.impactDescriptionEn}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reason Input (Mandatory for posted cancellations) */}
              {!isDraft && !isCancelled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>{isAr ? 'سبب الإلغاء والعكس (إلزامي للرقابة) *' : 'Cancellation Reason (Required for Audit) *'}</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {reason.length}/200 {isAr ? 'حرف' : 'chars'}
                    </span>
                  </div>

                  {/* Quick Reason Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {quickReasons.map(qr => (
                      <button
                        key={qr}
                        type="button"
                        onClick={() => setReason(qr)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition ${
                          reason === qr
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {qr}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder={
                      isAr
                        ? 'اكتب شرحاً دقيقاً لسبب إلغاء هذه الحركة وأسباب تعديل الأرصدة المخزنية...'
                        : 'Explain why this transaction is being reversed and how balances should adjust...'
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 h-20 resize-none"
                    maxLength={250}
                    required
                  />
                </div>
              )}

              {/* Two-step explicit confirmation for high-consequence cancellations */}
              {requiresTwoStep && !isCancelled && preview.canExecute && (
                <div className="p-3 rounded-xl bg-slate-900 text-white space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stepConfirmed}
                      onChange={e => setStepConfirmed(e.target.checked)}
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <div className="text-[11px] leading-relaxed">
                      <span className="font-bold block text-white">
                        {isAr ? 'إقرار وتأكيد خطوة الإلغاء المالي الرقابي:' : 'Explicit Confirmation of Financial Reversal:'}
                      </span>
                      <span className="text-slate-300">
                        {isAr
                          ? `أؤكد بصفتي (${currentUser?.fullName}) رغبتي في تسجيل قيد عكسي معتمد لمستند بقيمة (${formatCurrency(preview.transactedTotalValue, language)}) وإعادة احتساب تكلفة المخزون آلياً.`
                          : `I confirm as (${currentUser?.fullName}) the recording of an official reversal voucher for value (${formatCurrency(preview.transactedTotalValue, language)}) and location MAC recalculation.`}
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition"
          >
            {isAr ? 'إغلاق / تراجع' : 'Close / Dismiss'}
          </button>

          {preview && !isCancelled && (
            <div className="flex items-center gap-2">
              {isDraft ? (
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition flex items-center gap-2 shadow-md shadow-amber-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>{isAr ? 'تأكيد حذف المسودة' : 'Confirm Delete Draft'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAction}
                  disabled={
                    isSubmitting ||
                    !preview.canExecute ||
                    !reason.trim() ||
                    (requiresTwoStep && !stepConfirmed)
                  }
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-2 shadow-md shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )}
                  <span>
                    {isAr ? 'تأكيد الإلغاء وعكس القيد المخزني' : 'Confirm Reversal & Recalculate'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
