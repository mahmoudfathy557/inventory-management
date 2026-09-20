import React from 'react';
import { Shield, Check, X, Users, Lock, Server, Database } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RBAC_ROLE_DEFINITIONS } from '../../utils/rbac';
import { UserRole } from '../../types';

interface RBACMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RBACMatrixModal: React.FC<RBACMatrixModalProps> = ({ isOpen, onClose }) => {
  const { language, currentUser } = useApp();
  const isAr = language === 'ar';

  if (!isOpen) return null;

  const permissionsList = [
    { key: 'canView', labelAr: 'الاطلاع العام (View)', labelEn: 'General View' },
    { key: 'canCreate', labelAr: 'إنشاء المستندات (Create)', labelEn: 'Create Records' },
    { key: 'canEdit', labelAr: 'تعديل المسودات (Edit)', labelEn: 'Edit Drafts' },
    { key: 'canApprove', labelAr: 'الاعتماد / الفحص (Approve/Quality)', labelEn: 'Approve / Inspect' },
    { key: 'canPost', labelAr: 'الترحيل المالي والمخزني (Post)', labelEn: 'Post to Stock' },
    { key: 'canCancel', labelAr: 'إلغاء العمليات (Cancel)', labelEn: 'Cancel Transactions' },
    { key: 'canViewCost', labelAr: 'رؤية التكاليف المالية (View Cost)', labelEn: 'View Financial Costs' },
    { key: 'canViewReports', labelAr: 'تقارير التدقيق والمخزون (Reports)', labelEn: 'View Audits & Reports' },
    { key: 'canManageMasterData', labelAr: 'البيانات الأساسية (Master Data)', labelEn: 'Master Data Setup' },
    { key: 'canManagePermissions', labelAr: 'إدارة المستخدمين والصلاحيات', labelEn: 'Manage Users & RBAC' },
    { key: 'canManageOdoo', labelAr: 'مزامنة أودو (Odoo Sync)', labelEn: 'Manage Odoo Sync' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 border border-blue-400/30">
              <Shield className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isAr ? 'مصفوفة الصلاحيات وفصل المسؤوليات (RBAC & Separation of Duties)' : 'RBAC Matrix & Separation of Duties'}
              </h3>
              <p className="text-xs text-slate-300">
                {isAr
                  ? 'مبنية وفق المعايير القياسية لأنظمة تخطيط الموارد وإدارة التصنيع والمستودعات (ERP / WMS)'
                  : 'Based on industrial ERP & Manufacturing standard separation of duties'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Roles Cards */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(RBAC_ROLE_DEFINITIONS).map((def) => {
              const isCurrent = currentUser?.role === def.code;
              return (
                <div
                  key={def.code}
                  className={`p-4 rounded-xl border transition ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${def.color}`}>
                      {isAr ? def.nameAr : def.nameEn}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                        {isAr ? 'دورك الحالي' : 'Active'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mb-2 font-mono text-[11px]">
                    {def.department}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isAr ? def.descriptionAr : def.descriptionEn}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Matrix Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left rtl:text-right border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="p-3 ps-4">{isAr ? 'الصلاحية / الوظيفة' : 'Capability / Action'}</th>
                  <th className="p-3 text-center text-rose-700">{isAr ? 'المدير العام' : 'Admin'}</th>
                  <th className="p-3 text-center text-blue-700">{isAr ? 'المستودعات' : 'Inventory'}</th>
                  <th className="p-3 text-center text-amber-700">{isAr ? 'الإنتاج' : 'Production'}</th>
                  <th className="p-3 text-center text-emerald-700">{isAr ? 'الجودة' : 'Quality'}</th>
                  <th className="p-3 text-center text-purple-700">{isAr ? 'التكاليف' : 'Finance'}</th>
                  <th className="p-3 text-center text-slate-700">{isAr ? 'الإدارة' : 'Executive'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {permissionsList.map((p) => (
                  <tr key={p.key} className="hover:bg-slate-50 transition">
                    <td className="p-2.5 ps-4 font-medium text-slate-800">
                      {isAr ? p.labelAr : p.labelEn}
                    </td>
                    {[
                      UserRole.ADMIN,
                      UserRole.INVENTORY_USER,
                      UserRole.PRODUCTION_USER,
                      UserRole.QUALITY_USER,
                      UserRole.FINANCE_USER,
                      UserRole.MANAGEMENT_USER
                    ].map((roleKey) => {
                      const hasPerm = (RBAC_ROLE_DEFINITIONS[roleKey].permissions as any)[p.key];
                      return (
                        <td key={roleKey} className="p-2.5 text-center">
                          {hasPerm ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-300">
                              <X className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
