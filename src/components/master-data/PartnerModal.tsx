import React, { useState, useEffect } from 'react';
import { X, Users, Save, Copy } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, Supplier } from '../../types';
import { generateNextSequentialCode, generateDuplicateName } from '../../utils/codeGenerator';

interface PartnerModalProps {
  isOpen: boolean;
  type: 'CUSTOMER' | 'SUPPLIER';
  partner?: Customer | Supplier | null;
  isDuplicate?: boolean;
  onClose: () => void;
}

export const PartnerModal: React.FC<PartnerModalProps> = ({
  isOpen,
  type,
  partner,
  isDuplicate = false,
  onClose
}) => {
  const { language, customers, suppliers, saveCustomer, saveSupplier } = useApp();
  const isAr = language === 'ar';
  const isCustomer = type === 'CUSTOMER';

  const [formData, setFormData] = useState<any>({
    code: '',
    nameAr: '',
    nameEn: '',
    taxNumber: '',
    phone: '',
    email: '',
    address: '',
    paymentTerms: 'صافي 30 يوم',
    creditLimit: 250000,
    active: true,
    odooPartnerId: undefined
  });

  useEffect(() => {
    if (partner) {
      if (isDuplicate) {
        const existingCodes = (isCustomer ? customers : suppliers).map(p => p.code);
        setFormData({
          ...partner,
          id: `${isCustomer ? 'cust' : 'supp'}-${Date.now()}`,
          code: generateNextSequentialCode(partner.code, existingCodes),
          nameAr: generateDuplicateName(partner.nameAr, true),
          nameEn: generateDuplicateName(partner.nameEn || '', false),
          odooPartnerId: undefined // Reset external link for duplicate
        });
      } else {
        setFormData(partner);
      }
    } else {
      setFormData({
        id: `${isCustomer ? 'cust' : 'supp'}-${Date.now()}`,
        code: `${isCustomer ? 'CUST' : 'SUPP'}-${Math.floor(100 + Math.random() * 900)}`,
        nameAr: '',
        nameEn: '',
        taxNumber: '',
        phone: '',
        email: '',
        address: '',
        paymentTerms: 'صافي 30 يوم',
        creditLimit: isCustomer ? 250000 : 0,
        active: true,
        odooPartnerId: undefined
      });
    }
  }, [partner, isOpen, isDuplicate, isCustomer, customers, suppliers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.nameAr) return;

    if (isCustomer) {
      const cust: Customer = {
        id: (isDuplicate ? null : partner?.id) || formData.id || `cust-${Date.now()}`,
        code: formData.code.trim(),
        nameAr: formData.nameAr.trim(),
        nameEn: formData.nameEn?.trim() || formData.nameAr.trim(),
        taxNumber: formData.taxNumber?.trim() || '',
        phone: formData.phone?.trim() || '',
        email: formData.email?.trim() || '',
        address: formData.address?.trim() || '',
        defaultCurrency: formData.defaultCurrency || 'EGP',
        paymentTerms: formData.paymentTerms || 'صافي 30 يوم',
        active: formData.active ?? true,
        notes: formData.notes?.trim() || '',
        odooPartnerId: formData.odooPartnerId ? Number(formData.odooPartnerId) : undefined
      };
      saveCustomer(cust);
    } else {
      const supp: Supplier = {
        id: (isDuplicate ? null : partner?.id) || formData.id || `supp-${Date.now()}`,
        code: formData.code.trim(),
        nameAr: formData.nameAr.trim(),
        nameEn: formData.nameEn?.trim() || formData.nameAr.trim(),
        taxNumber: formData.taxNumber?.trim() || '',
        phone: formData.phone?.trim() || '',
        email: formData.email?.trim() || '',
        address: formData.address?.trim() || '',
        defaultCurrency: formData.defaultCurrency || 'EGP',
        paymentTerms: formData.paymentTerms || 'صافي 30 يوم',
        active: formData.active ?? true,
        notes: formData.notes?.trim() || ''
      };
      saveSupplier(supp);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDuplicate
                ? 'bg-amber-50 text-amber-600'
                : 'bg-teal-50 text-teal-600'
            }`}>
              {isDuplicate ? <Copy className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {isDuplicate
                    ? isAr
                      ? (isCustomer ? 'نسخ وتكرار بيانات العميل' : 'نسخ وتكرار بيانات المورد')
                      : (isCustomer ? 'Duplicate Customer' : 'Duplicate Supplier')
                    : partner
                    ? isAr ? (isCustomer ? 'تعديل بيانات العميل' : 'تعديل بيانات المورد') : (isCustomer ? 'Edit Customer' : 'Edit Supplier')
                    : isAr ? (isCustomer ? 'إضافة عميل جديد' : 'إضافة مورد جديد') : (isCustomer ? 'Add New Customer' : 'Add New Supplier')}
                </h3>
                {isDuplicate && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {isAr ? 'نسخ سريع' : 'Quick Duplicate'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {isDuplicate
                  ? isAr ? 'تم نسخ جميع البيانات والشروط التجارية وتوليد كود تسلسلي جديد. يمكنك تعديل الاسم والحفظ مباشرة.' : 'Cloned partner with next sequential code. Edit name/contact and save.'
                  : isAr ? 'البيانات التجارية والضريبية ومزامنة Odoo Partner ID' : 'Commercial, tax, and Odoo res.partner mapping'}
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'كود الشريك *' : 'Partner Code *'}
              </label>
              <input
                type="text"
                required
                value={formData.code || ''}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder={isCustomer ? 'CUST-001' : 'SUPP-001'}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'معرف Odoo (res.partner ID)' : 'Odoo Partner ID'}
              </label>
              <input
                type="number"
                value={formData.odooPartnerId ?? ''}
                onChange={e => setFormData({ ...formData, odooPartnerId: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="مثال: 45"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'الاسم بالعربية *' : 'Arabic Name *'}
              </label>
              <input
                type="text"
                required
                value={formData.nameAr || ''}
                onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder={isCustomer ? 'شركة المقاولون للمشروعات' : 'سابق للبتروكيماويات'}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'الاسم بالإنجليزية' : 'English Name'}
              </label>
              <input
                type="text"
                value={formData.nameEn || ''}
                onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="e.g. Arab Contractors Co."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'الرقم الضريبي / السجل' : 'Tax / VAT Number'}
              </label>
              <input
                type="text"
                value={formData.taxNumber || ''}
                onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
                placeholder="100-245-890"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'شروط السداد' : 'Payment Terms'}
              </label>
              <input
                type="text"
                value={formData.paymentTerms || ''}
                onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                placeholder="صافي 30 يوم"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'رقم الهاتف' : 'Phone'}
              </label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+20 100 123 4567"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {isAr ? 'البريد الإلكتروني' : 'Email'}
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@company.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {isCustomer && (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {isAr ? 'الحد الائتماني (جنيه مصري)' : 'Credit Limit (EGP)'}
                </label>
                <input
                  type="number"
                  value={formData.creditLimit || 0}
                  onChange={e => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'العنوان / موقع التسليم' : 'Address'}
            </label>
            <textarea
              rows={2}
              value={formData.address || ''}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="المنطقة الصناعية - العاشر من رمضان..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="partner-active"
              checked={formData.active ?? true}
              onChange={e => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="partner-active" className="text-slate-700 font-medium">
              {isAr ? 'حساب نشط ومتاح في الفواتير والمعاملات' : 'Active account available for orders and invoices'}
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer ${
                isDuplicate
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {isDuplicate ? <Copy className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>
                {isDuplicate
                  ? isAr ? (isCustomer ? 'إضافة وتكويد العميل المنسوخ' : 'إضافة وتكويد المورد المنسوخ') : 'Add Cloned Partner'
                  : isAr ? (isCustomer ? 'حفظ العميل' : 'حفظ المورد') : 'Save Partner'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
