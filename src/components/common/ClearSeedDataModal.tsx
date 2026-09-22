import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ClearSeedDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ClearSeedDataModal: React.FC<ClearSeedDataModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { language, clearSeedDataAndStartScratch } = useApp();
  const isAr = language === 'ar';
  const [confirmText, setConfirmText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClear = () => {
    clearSeedDataAndStartScratch();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setConfirmText('');
      if (onSuccess) onSuccess();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {isAr ? 'مسح البيانات التجريبية والبدء من الصفر' : 'Clear Seed Data & Start From Scratch'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'تجهيز النظام لإدخال بيانات مصنعك الحقيقية' : 'Prepare the system for your real factory data'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              {isAr ? 'تم مسح البيانات بنجاح!' : 'Data Cleared Successfully!'}
            </h4>
            <p className="text-xs text-slate-500">
              {isAr ? 'النظام الآن نظيف وجاهز للبدء من الصفر' : 'System is now clean and ready from scratch'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{isAr ? 'ما الذي سيتم مسحه بالضبط؟' : 'What will be cleared?'}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed">
                <li>
                  {isAr
                    ? 'كافة المواد الخام والمنتجات التامة ومعادلات التصنيع (BOM) التجريبية'
                    : 'All sample raw materials, finished products, and BOM formulas'}
                </li>
                <li>
                  {isAr
                    ? 'فواتير أذون الاستلام ومصروفات الإنزال الجمركي'
                    : 'All inventory receipts and landed cost allocations'}
                </li>
                <li>
                  {isAr
                    ? 'أوامر الإنتاج، أذون صرف الخامات، أذون استلام الإنتاج، واعتمادات الجودة'
                    : 'All work orders, material issues, production receipts, and quality checks'}
                </li>
                <li>
                  {isAr
                    ? 'التحويلات المخزنية، تسليمات العملاء، وتسويات التكاليف وحركات الأستاذ'
                    : 'Stock transfers, customer deliveries, cost adjustments, and ledger entries'}
                </li>
              </ul>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                <Sparkles className="w-3.5 h-3.5" />
                {isAr ? 'ما الذي سيتم الحفاظ عليه؟' : 'What is preserved?'}
              </span>
              <p className="text-slate-600">
                {isAr
                  ? 'المستودعات ومواقع الإنتاج، وحدات القياس (UOM)، العملات النقدية وأسعار الصرف، والمستخدمين وحسابات الدخول.'
                  : 'Warehouses, locations, units of measure, currencies and exchange rates, and user accounts.'}
              </p>
            </div>

            <div className="space-y-1 pt-1">
              <label className="block font-semibold text-slate-700">
                {isAr
                  ? 'لتأكيد المسح، اكتب كلمة "ابدأ" أو "DELETE" أدناه:'
                  : 'To confirm, type "DELETE" below:'}
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={isAr ? 'ابدأ أو DELETE' : 'DELETE'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={confirmText.trim().toLowerCase() !== 'delete' && confirmText.trim() !== 'ابدأ'}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'تأكيد المسح والبدء من الصفر' : 'Confirm Clear & Start Scratch'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
