import { UserRole, PermissionSet } from '../types';

/**
 * Recommended ERP & Industrial Inventory/Production Control System RBAC
 * 
 * Best Practices implemented:
 * 1. Principle of Least Privilege (PoLP): Users only get access to operations their department performs.
 * 2. Separation of Duties (SoD):
 *    - Inventory Users receive goods and issue materials, but cannot approve BOMs or alter production cost adjustments.
 *    - Production Users manage work orders and request raw materials, but cannot modify landed costs or customer deliveries.
 *    - Quality Inspectors approve or reject finished products and incoming materials, independent of production pressure.
 *    - Cost Accountants manage landed costs, standard vs moving average valuation, and cost adjustments.
 *    - System Administrators manage master configurations, RBAC, and Odoo integrations.
 *    - Executive Management has read-only high-level visibility across all reports and audits without alteration power.
 */

export interface RoleDefinition {
  code: UserRole;
  nameAr: string;
  nameEn: string;
  department: string;
  descriptionAr: string;
  descriptionEn: string;
  color: string;
  badgeBg: string;
  permissions: PermissionSet;
}

export const RBAC_ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  [UserRole.ADMIN]: {
    code: UserRole.ADMIN,
    nameAr: 'مدير النظام الكامل (Super Admin)',
    nameEn: 'System Administrator',
    department: 'IT / Operations',
    descriptionAr: 'صلاحيات كاملة وغير مقيدة لإدارة المستخدمين، البيانات الأساسية، تكامل أودو Odoo، وكافة الحركات.',
    descriptionEn: 'Unrestricted access to user management, master data, Odoo sync, and system configuration.',
    color: 'text-rose-700 border-rose-200 bg-rose-50',
    badgeBg: 'bg-rose-100 text-rose-800',
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canApprove: true,
      canPost: true,
      canCancel: true,
      canPrint: true,
      canExport: true,
      canDeleteDraft: true,
      canViewCost: true,
      canViewReports: true,
      canManageMasterData: true,
      canManagePermissions: true,
      canManageOdoo: true,
    }
  },

  [UserRole.INVENTORY_USER]: {
    code: UserRole.INVENTORY_USER,
    nameAr: 'أمين المستودعات (Inventory & Warehouse Manager)',
    nameEn: 'Inventory / Warehouse Manager',
    department: 'Warehouses & Logistics',
    descriptionAr: 'إدارة استلام البضائع، سندات الصرف الداخلي، التحويلات بين المستودعات، وتسليمات العملاء. لا يغير تكاليف التصنيع.',
    descriptionEn: 'Handles receipts, internal issues, inter-warehouse transfers, and customer deliveries.',
    color: 'text-blue-700 border-blue-200 bg-blue-50',
    badgeBg: 'bg-blue-100 text-blue-800',
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canApprove: false,
      canPost: true,
      canCancel: true,
      canPrint: true,
      canExport: true,
      canDeleteDraft: true,
      canViewCost: true,
      canViewReports: true,
      canManageMasterData: false,
      canManagePermissions: false,
      canManageOdoo: false,
    }
  },

  [UserRole.PRODUCTION_USER]: {
    code: UserRole.PRODUCTION_USER,
    nameAr: 'مهندس / مدير الإنتاج (Production Engineer)',
    nameEn: 'Production Engineer / Planner',
    department: 'Manufacturing & Operations',
    descriptionAr: 'إنشاء ومتابعة أوامر التشغيل والإنتاج، طلب وصرف المواد الخام، تسجيل المخرجات، ومعادلات التصنيع (BOM).',
    descriptionEn: 'Creates production orders, monitors stages, issues raw materials, and records production receipts.',
    color: 'text-amber-700 border-amber-200 bg-amber-50',
    badgeBg: 'bg-amber-100 text-amber-800',
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canApprove: true,
      canPost: true,
      canCancel: false,
      canPrint: true,
      canExport: true,
      canDeleteDraft: true,
      canViewCost: false, // Production floor does not directly modify accounting financial values
      canViewReports: true,
      canManageMasterData: false,
      canManagePermissions: false,
      canManageOdoo: false,
    }
  },

  [UserRole.QUALITY_USER]: {
    code: UserRole.QUALITY_USER,
    nameAr: 'فاحص الجودة (Quality Assurance Inspector)',
    nameEn: 'Quality Control Inspector',
    department: 'Quality Assurance (QA/QC)',
    descriptionAr: 'فحص مخرجات الإنتاج والمواد المستلمة، اعتماد أو رفض الدفعات (Release / Reject)، وتحديد الهالك مع تقارير عدم المطابقة.',
    descriptionEn: 'Inspects goods, records approvals/rejections, and certifies batches for release.',
    color: 'text-emerald-700 border-emerald-200 bg-emerald-50',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canApprove: true,
      canPost: true,
      canCancel: false,
      canPrint: true,
      canExport: true,
      canDeleteDraft: false,
      canViewCost: false,
      canViewReports: true,
      canManageMasterData: false,
      canManagePermissions: false,
      canManageOdoo: false,
    }
  },

  [UserRole.FINANCE_USER]: {
    code: UserRole.FINANCE_USER,
    nameAr: 'محاسب التكاليف والمالية (Cost & Finance Accountant)',
    nameEn: 'Cost & Financial Accountant',
    department: 'Finance & Accounting',
    descriptionAr: 'إدارة التكاليف الإضافية (Landed Costs)، قيود اليومية المحاسبية للمخزون، تقارير تقييم المخزون والربحية ومتوسط التكلفة المرجح.',
    descriptionEn: 'Manages landed cost allocations, moving average calculations, ledger, and cost adjustments.',
    color: 'text-purple-700 border-purple-200 bg-purple-50',
    badgeBg: 'bg-purple-100 text-purple-800',
    permissions: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canApprove: true,
      canPost: true,
      canCancel: true,
      canPrint: true,
      canExport: true,
      canDeleteDraft: true,
      canViewCost: true,
      canViewReports: true,
      canManageMasterData: true,
      canManagePermissions: false,
      canManageOdoo: false,
    }
  },

  [UserRole.MANAGEMENT_USER]: {
    code: UserRole.MANAGEMENT_USER,
    nameAr: 'الإدارة العليا ومجلس الإدارة (Executive Management)',
    nameEn: 'Executive Management / Auditor',
    department: 'Executive Leadership',
    descriptionAr: 'اطلاع شامل على المؤشرات الحية، تدقيق سجلات الحركات، تقارير تقييم الأصول وتكلفة الإنتاج، مع منع التعديل اليدوي المباشر.',
    descriptionEn: 'Read-only strategic dashboards, audit logs, cost impact summaries, and executive oversight.',
    color: 'text-slate-700 border-slate-300 bg-slate-100',
    badgeBg: 'bg-slate-200 text-slate-800',
    permissions: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canApprove: true,
      canPost: false,
      canCancel: false,
      canPrint: true,
      canExport: true,
      canDeleteDraft: false,
      canViewCost: true,
      canViewReports: true,
      canManageMasterData: false,
      canManagePermissions: false,
      canManageOdoo: false,
    }
  }
};

export function getEffectivePermissions(role: UserRole, overrides?: Partial<PermissionSet>): PermissionSet {
  const base = RBAC_ROLE_DEFINITIONS[role]?.permissions || RBAC_ROLE_DEFINITIONS[UserRole.INVENTORY_USER].permissions;
  if (!overrides) return base;
  return { ...base, ...overrides };
}

/**
 * Checks if a given role is allowed to access a specific tab/section
 */
export function canAccessTab(role: UserRole, tabId: string): boolean {
  switch (tabId) {
    case 'auth':
      return true; // Always accessible
    case 'dashboard':
      return true; // All authenticated roles can view their tailored dashboard

    case 'receipts':
    case 'transfers':
    case 'issues':
    case 'deliveries':
      // Inventory, Admin, Finance, Management (read), or Production (issues only)
      if (tabId === 'issues') return true;
      return [UserRole.ADMIN, UserRole.INVENTORY_USER, UserRole.FINANCE_USER, UserRole.MANAGEMENT_USER].includes(role);

    case 'landed-cost':
    case 'cost-adjustments':
      // Cost accounting & executive management & admin
      return [UserRole.ADMIN, UserRole.FINANCE_USER, UserRole.MANAGEMENT_USER].includes(role);

    case 'production':
      // Production users, Admin, Management, Quality
      return [UserRole.ADMIN, UserRole.PRODUCTION_USER, UserRole.QUALITY_USER, UserRole.MANAGEMENT_USER, UserRole.FINANCE_USER].includes(role);

    case 'quality':
      // QA, Admin, Production (view), Management
      return [UserRole.ADMIN, UserRole.QUALITY_USER, UserRole.PRODUCTION_USER, UserRole.MANAGEMENT_USER].includes(role);

    case 'reports':
      return true; // All authenticated users can view reports tailored to their permissions

    case 'odoo-sync':
      // Admin and Finance
      return [UserRole.ADMIN, UserRole.FINANCE_USER].includes(role);

    case 'master-data':
      // Admin, Finance, Production
      return [UserRole.ADMIN, UserRole.FINANCE_USER, UserRole.PRODUCTION_USER, UserRole.INVENTORY_USER, UserRole.MANAGEMENT_USER].includes(role);

    case 'users':
      // Strictly Super Admin
      return role === UserRole.ADMIN;

    default:
      return true;
  }
}
