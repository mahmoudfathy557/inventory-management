import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Save, User as UserIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';

interface UserModalProps {
  isOpen: boolean;
  user?: User | null;
  onClose: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, user, onClose }) => {
  const { language, saveUser } = useApp();
  const isAr = language === 'ar';

  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    fullName: '',
    email: '',
    role: UserRole.INVENTORY_USER,
    active: true
  });

  useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
      setFormData({
        id: `user-${Date.now()}`,
        username: '',
        fullName: '',
        email: '',
        role: UserRole.INVENTORY_USER,
        active: true
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.fullName) return;

    const finalUser: User = {
      id: user?.id || formData.id || `user-${Date.now()}`,
      username: formData.username.trim().toLowerCase(),
      fullName: formData.fullName.trim(),
      email: formData.email?.trim() || `${formData.username.trim()}@factory.com`,
      role: formData.role || UserRole.INVENTORY_USER,
      active: formData.active ?? true,
      permissionOverrides: user?.permissionOverrides
    };

    saveUser(finalUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {user
                  ? isAr ? 'تعديل بيانات وصلاحيات المستخدم' : 'Edit User & Role'
                  : isAr ? 'إضافة مستخدم جديد للنظام' : 'Add New System User'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'تحديد الدور الوظيفي ونطاق الصلاحيات' : 'Assign functional role and permissions'}
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
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'اسم المستخدم للدخول (Username) *' : 'Username *'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.username || ''}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. tarek.prod"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'الاسم الكامل الثلاثي *' : 'Full Name *'}
            </label>
            <input
              type="text"
              required
              value={formData.fullName || ''}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="مثال: م. طارق رضوان"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@factory.com"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {isAr ? 'الدور الوظيفي والصلاحيات *' : 'Role & Scope *'}
            </label>
            <select
              value={formData.role || UserRole.INVENTORY_USER}
              onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value={UserRole.ADMIN}>
                {isAr ? 'مدير النظام (Admin - كامل الصلاحيات)' : 'System Admin (Full Access)'}
              </option>
              <option value={UserRole.INVENTORY_USER}>
                {isAr ? 'أمين المستودع (مسؤول المخزون والاستلام والتحويلات)' : 'Inventory Keeper (Receipts & Transfers)'}
              </option>
              <option value={UserRole.PRODUCTION_USER}>
                {isAr ? 'مدير الإنتاج (أوامر التشغيل وصرف الخامات)' : 'Production Supervisor (Work Orders & Issues)'}
              </option>
              <option value={UserRole.QUALITY_USER}>
                {isAr ? 'مراقب الجودة (فحص واعتماد الدفعات)' : 'Quality Inspector (Approvals & Inspections)'}
              </option>
              <option value={UserRole.FINANCE_USER}>
                {isAr ? 'المحاسب المالي (حسابات التكاليف والمصاريف الإضافية)' : 'Financial Cost Accountant'}
              </option>
              <option value={UserRole.MANAGEMENT_USER}>
                {isAr ? 'الإدارة العليا (تقارير ورؤى استراتيجية)' : 'Executive Management (Reports & Dashboards)'}
              </option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="user-active"
              checked={formData.active ?? true}
              onChange={e => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="user-active" className="text-slate-700 font-medium">
              {isAr ? 'حساب مفعّل ومسموح له بتسجيل الدخول وتنفيذ الحركات' : 'Active user account permitted to sign in'}
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
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isAr ? 'حفظ المستخدم' : 'Save User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
