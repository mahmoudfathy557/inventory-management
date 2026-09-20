import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Factory,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Truck,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTo: (tab: any) => void;
}

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({ isOpen, onClose, onNavigateTo }) => {
  const { language, resetToSampleMVP } = useApp();
  const isAr = language === 'ar';

  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      stepNum: 1,
      titleAr: 'استلام المواد الخام (Purchase Receipt)',
      titleEn: 'Receive 1,000 KG Raw Material',
      badgeAr: 'المرحلة 1: التوريد',
      badgeEn: 'Stage 1: Inbound',
      descAr: 'استلام 1,000 كجم من مادة بولي إيثيلين HDPE بتكلفة 100,000 ج.م من المورد سابك.',
      descEn: 'Receive 1,000 KG HDPE Raw Material from SABIC with total purchase cost of 100,000 EGP.',
      mathAr: 'متوسط التكلفة الأولي = 100,000 ÷ 1,000 = 100.00 ج.م / كجم',
      mathEn: 'Initial Moving Average Cost = 100,000 / 1,000 = 100.00 EGP/KG',
      status: 'مكتمل ومسجل في دفتر الأستاذ',
      targetTab: 'receipts'
    },
    {
      stepNum: 2,
      titleAr: 'إضافة تكلفة الإنزال (Landed Cost)',
      titleEn: 'Add Landed Cost (+10,000 EGP)',
      badgeAr: 'المرحلة 2: التكاليف الإضافية',
      badgeEn: 'Stage 2: Landed Cost',
      descAr: 'إضافة مصاريف جمركية ونقل مبرد بقيمة 10,000 ج.م. تزيد القيمة دون زيادة الكمية.',
      descEn: 'Add 10,000 EGP customs duties and freight charges directly allocated to receipt without increasing physical quantity.',
      mathAr: 'القيمة الجديدة = 110,000 ج.م | الكمية = 1,000 كجم | متوسط التكلفة الجديد = 110.00 ج.م / كجم',
      mathEn: 'New Value = 110,000 EGP | Quantity = 1,000 KG | New Moving Avg = 110.00 EGP/KG',
      status: 'تحديث متوسط التكلفة تلقائياً',
      targetTab: 'landed-cost'
    },
    {
      stepNum: 3,
      titleAr: 'التحويل لمستودع الإنتاج (Stock Transfer)',
      titleEn: 'Transfer 1,000 KG to Production/WIP',
      badgeAr: 'المرحلة 3: التحويل الداخلي',
      badgeEn: 'Stage 3: WIP Transfer',
      descAr: 'تحويل 1,000 كجم من مستودع الخام إلى مستودع التشغيل WIP (مرحلة الإنتاج 1). التحويل لا يغير إجمالي قيمة مخزون الشركة.',
      descEn: 'Move 1,000 KG from Raw Materials to Production WIP Stage 1. Company total inventory valuation remains unchanged.',
      mathAr: 'الرصيد في صالة الإنتاج = 1,000 كجم بقيمة 110,000 ج.م (تكلفة الوحدة 110 ج.م)',
      mathEn: 'WIP Balance = 1,000 KG @ 110,000 EGP (110.00 EGP/KG)',
      status: 'حركة تحويل داخلي مطابقة',
      targetTab: 'transfers'
    },
    {
      stepNum: 4,
      titleAr: 'أمر الإنتاج وصرف الخامات (Production & Issue)',
      titleEn: 'Production Order & Material Consumption',
      badgeAr: 'المرحلة 4: التصنيع',
      badgeEn: 'Stage 4: Manufacturing',
      descAr: 'إنشاء أمر الإنتاج PO-2026-0001 لإنتاج 900 كجم أنابيب، واستهلاك الـ 1,000 كجم خام بالكامل.',
      descEn: 'Create Production Order for 900 KG Pipes and issue 1,000 KG raw materials at moving average cost.',
      mathAr: 'إجمالي تكلفة الخامات المستهلكة الفعلية = 1,000 × 110 = 110,000 ج.م',
      mathEn: 'Total Actual Consumed Material Cost = 1,000 × 110 = 110,000 EGP',
      status: 'صرف الخامات للأمر بالكامل',
      targetTab: 'production'
    },
    {
      stepNum: 5,
      titleAr: 'استلام الإنتاج وقاعدة الهالك (Cost Absorption Rule)',
      titleEn: 'Receipt from Production & Scrap Rule',
      badgeAr: 'المرحلة 5: توزيع التكلفة',
      badgeEn: 'Stage 5: Cost Allocation',
      descAr: 'نتيجة التشغيل: 900 كجم منتج تام + 100 كجم هالك (سكراب). يستوعب المنتج التام كامل تكلفة الخامات وقيمة الهالك = 0 ج.م.',
      descEn: 'Finished Product = 900 KG, Scrap = 100 KG. Finished goods absorb 100% of material cost; Scrap is valued at 0 EGP.',
      mathAr: 'تكلفة المنتج التام = 110,000 ج.م ÷ 900 = 122.222 ج.م / كجم | قيمة السكراب = 0 ج.م',
      mathEn: 'Finished Goods Unit Cost = 110,000 / 900 = 122.222 EGP/KG | Scrap Value = 0 EGP',
      status: 'استيعاب تكلفة المواد بالكامل',
      targetTab: 'production'
    },
    {
      stepNum: 6,
      titleAr: 'اعتماد الجودة والإفراج للمخزن (Quality Approval)',
      titleEn: 'Quality Inspection & Warehouse Release',
      badgeAr: 'المرحلة 6: الرقابة الصناعية',
      badgeEn: 'Stage 6: Quality Control',
      descAr: 'فحص عينات الضغط والشد من قبل مدير الجودة واعتماد استلام الـ 900 كجم في مستودع المنتجات التامة.',
      descEn: 'Quality Manager performs dimensional and pressure tests, approving 900 KG into Finished Goods Warehouse.',
      mathAr: 'رصيد المنتجات التامة الجديد = 900 كجم بمتوسط تكلفة 122.222 ج.م / كجم',
      mathEn: 'Finished Goods Stock = 900 KG @ 122.222 EGP/KG',
      status: 'اعتماد رسمي موثق بالتاريخ والسبب',
      targetTab: 'quality'
    },
    {
      stepNum: 7,
      titleAr: 'صرف وتسليم بضاعة للعميل (Customer Delivery)',
      titleEn: 'Customer Issue & Cost of Goods Sold (COGS)',
      badgeAr: 'المرحلة 7: التوزيع والمبيعات',
      badgeEn: 'Stage 7: Sales & Delivery',
      descAr: 'صرف 400 كجم لشركة أوراسكوم. تخرج البضاعة بمتوسط التكلفة المتحرك للمنتج التام (122.222 ج.م/كجم).',
      descEn: 'Issue 400 KG to Orascom Construction using the current moving average cost (122.222 EGP/KG).',
      mathAr: 'تكلفة المبيعات (COGS) = 400 × 122.222 = 48,888.80 ج.م | الرصيد المتبقي = 500 كجم',
      mathEn: 'COGS = 400 × 122.222 = 48,888.80 EGP | Remaining Stock = 500 KG',
      status: 'تمت المزامنة مع Odoo Partner & Delivery',
      targetTab: 'deliveries'
    },
    {
      stepNum: 8,
      titleAr: 'فحص وتدقيق كرت الصنف (Inventory Audit Report)',
      titleEn: 'Complete Traceability & Audit Trail',
      badgeAr: 'المرحلة 8: التدقيق والمطابقة',
      badgeEn: 'Stage 8: Audit & Ledger',
      descAr: 'يعرض تقرير فحص المخزون السلسلة الزمنية الكاملة من الشراء والإنزال والتحويل والاستهلاك والجودة والبيع.',
      descEn: 'The Inventory Audit Report reconciles every single quantity and value movement across the lifecycle.',
      mathAr: 'مطابقة تامة بين دفتر الأستاذ والمخازن الفعلية بدون أي فروقات أو شطب يدوي',
      mathEn: '100% Reconciliation between Inventory Ledger and physical balances without destructive edits.',
      status: 'سجل تدقيق غير قابل للحذف (Cancel/Reverse فقط)',
      targetTab: 'reports'
    }
  ];

  if (!isOpen) return null;

  const current = steps[activeStep];

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isAr ? 'سيناريو دورة العمل المعيارية (Section 47 End-to-End Walkthrough)' : 'Standard MVP End-to-End Business Flow'}
              </h2>
              <p className="text-xs text-blue-200">
                {isAr ? 'استعراض المراحل الثمانية لقواعد متوسط التكلفة والإنتاج والجودة' : 'Interactive 8-stage verification of costing, production & quality'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Tracker */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[500px] gap-2">
            {steps.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`flex flex-col items-center group cursor-pointer transition ${
                  activeStep === idx ? 'scale-105' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    activeStep === idx
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm'
                      : idx < activeStep
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {idx < activeStep ? <CheckCircle2 className="w-4 h-4" /> : s.stepNum}
                </div>
                <span className="text-[10px] font-medium text-slate-600 mt-1 max-w-[60px] truncate text-center">
                  {isAr ? s.badgeAr.split(':')[0] : `Stage ${s.stepNum}`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {isAr ? current.badgeAr : current.badgeEn}
            </span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {current.status}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {isAr ? current.titleAr : current.titleEn}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {isAr ? current.descAr : current.descEn}
            </p>
          </div>

          {/* Mathematical Proof Box */}
          <div className="p-4 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs border border-slate-800 space-y-1 shadow-inner">
            <div className="text-[11px] text-slate-400 font-sans font-semibold">
              {isAr ? '📐 معادلة متوسط التكلفة وحسابات النظام في هذه الخطوة:' : '📐 System Cost Engine Calculation:'}
            </div>
            <div className="text-sm font-bold text-white pt-1">
              {isAr ? current.mathAr : current.mathEn}
            </div>
          </div>

          {/* Action to Jump to Screen */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <button
              onClick={() => {
                onClose();
                onNavigateTo(current.targetTab);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              <span>{isAr ? 'الانتقال إلى شاشة هذه العملية' : 'View this Screen'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                disabled={activeStep === 0}
                onClick={() => setActiveStep(prev => prev - 1)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className={`w-4 h-4 ${isAr ? '' : 'rotate-180'}`} />
                <span>{isAr ? 'السابق' : 'Previous'}</span>
              </button>

              {activeStep < steps.length - 1 ? (
                <button
                  onClick={() => setActiveStep(prev => prev + 1)}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                >
                  <span>{isAr ? 'التالي' : 'Next'}</span>
                  <ChevronLeft className={`w-4 h-4 ${isAr ? '' : 'rotate-180'}`} />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'إتمام الجولة' : 'Finish Tour'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
