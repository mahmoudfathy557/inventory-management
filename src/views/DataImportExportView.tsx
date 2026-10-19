import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  ShieldAlert,
  Database,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  EntityKey,
  ENTITY_DEFINITIONS,
  generateTemplate,
  exportEntityData
} from '../services/dataImportExportService';
import { DataImportExportModal } from '../components/common/DataImportExportModal';

export const DataImportExportView: React.FC = () => {
  const { language, currentUser, rawMaterials, products, warehouses, productionOrders, receipts } = useApp();
  const isAr = language === 'ar';
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const [activeModalEntity, setActiveModalEntity] = useState<EntityKey | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<'templates' | 'import'>('templates');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'master' | 'operations'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const allEntityKeys = Object.keys(ENTITY_DEFINITIONS) as EntityKey[];

  const filteredEntities = allEntityKeys.filter(key => {
    const def = ENTITY_DEFINITIONS[key];
    const matchCat = filterCategory === 'ALL' || def.category === filterCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchQuery =
      !query ||
      def.labelAr.toLowerCase().includes(query) ||
      def.labelEn.toLowerCase().includes(query) ||
      def.descriptionAr.toLowerCase().includes(query) ||
      key.toLowerCase().includes(query);
    return matchCat && matchQuery;
  });

  const handleOpenModal = (entityKey: EntityKey, tab: 'templates' | 'import' = 'templates') => {
    setActiveModalEntity(entityKey);
    setModalInitialTab(tab);
  };

  const handleQuickDownloadTemplate = (entityKey: EntityKey, format: 'xlsx' | 'csv') => {
    const { blob, filename } = generateTemplate(entityKey, format, {
      withSampleData: true,
      language
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner & Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{isAr ? 'بوابة إدارة البيانات المجمعة (خاص بالأدمن فقط)' : 'Bulk Data Management Portal (Admin Only)'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
              {isAr ? 'مركز استيراد وتصدير بيانات النظام وقوالب Excel' : 'System Data Import, Export & Excel Templates'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isAr
                ? 'تحميل قوالب Excel و CSV الرسمية لكافة جداول البيانات الأساسية والعمليات المخزنية، ورفع ملفاتك المحلية مباشرة إلى قاعدة البيانات مع التحقق الصارم من السكيما.'
                : 'Download official templates for all system tables, import local spreadsheets without schema conflicts, and export live records.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => handleOpenModal('rawMaterials', 'import')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition"
            >
              <Upload className="w-4 h-4" />
              <span>{isAr ? 'استيراد ملف جديد الآن' : 'Import New Spreadsheet'}</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800 text-2xs sm:text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{isAr ? '18 جدول سكيما متكامل' : '18 Verified Schemas'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{isAr ? 'دعم كامل للنصوص العربية UTF-8' : 'Full Arabic UTF-8'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{isAr ? 'فحص تلقائي لتكرار الأكواد' : 'Duplicate Key Protection'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{isAr ? 'دعم الإضافة والتحديث (Upsert)' : 'Safe Upsert Support'}</span>
          </div>
        </div>
      </div>

      {/* Non-Admin Security Warning */}
      {!isAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">{isAr ? 'تنبيه الصلاحيات: ' : 'Permission Notice: '}</span>
            {isAr
              ? 'أنت تتصفح بصفتك مستخدم عادي. يمكنك تحميل القوالب وتصدير البيانات، ولكن استيراد وتعديل قاعدة البيانات مقتصر على مدير النظام.'
              : 'You are viewing as a standard user. Template downloads are allowed, but database importing is restricted to Administrators.'}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث في أسماء الجداول والقوالب...' : 'Search templates & tables...'}
            className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">{isAr ? 'التصنيف:' : 'Category:'}</span>
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setFilterCategory('ALL')}
              className={`px-3 py-1 rounded-md transition ${
                filterCategory === 'ALL'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setFilterCategory('master')}
              className={`px-3 py-1 rounded-md transition ${
                filterCategory === 'master'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'البيانات الأساسية (Master Data)' : 'Master Data'}
            </button>
            <button
              onClick={() => setFilterCategory('operations')}
              className={`px-3 py-1 rounded-md transition ${
                filterCategory === 'operations'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'العمليات المخزنية والإنتاج' : 'Operations'}
            </button>
          </div>
        </div>
      </div>

      {/* Directory of Tables Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntities.map(key => {
          const def = ENTITY_DEFINITIONS[key];

          return (
            <div
              key={key}
              className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {isAr ? def.labelAr : def.labelEn}
                      </h3>
                      <span className="text-2xs text-slate-400 font-mono">
                        {key}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${
                      def.category === 'master'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {def.category === 'master'
                      ? isAr ? 'بيانات أساسية' : 'Master'
                      : isAr ? 'عمليات وحركات' : 'Operations'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {isAr ? def.descriptionAr : def.descriptionEn}
                </p>

                {/* Columns Preview Chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {def.columns.slice(0, 4).map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-2xs font-medium"
                    >
                      {isAr ? c.labelAr.replace('*', '') : c.labelEn.replace('*', '')}
                    </span>
                  ))}
                  {def.columns.length > 4 && (
                    <span className="px-1.5 py-0.5 text-2xs text-slate-400">
                      +{def.columns.length - 4} {isAr ? 'حقول أخرى' : 'more'}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleQuickDownloadTemplate(key, 'xlsx')}
                  className="flex-1 py-2 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-2xs font-bold flex items-center justify-center gap-1 transition"
                  title={isAr ? 'تحميل قالب Excel جاهز' : 'Download Excel Template'}
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'قالب Excel' : 'Excel Template'}</span>
                </button>

                <button
                  onClick={() => handleQuickDownloadTemplate(key, 'csv')}
                  className="py-2 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-2xs font-bold flex items-center justify-center gap-1 transition"
                  title={isAr ? 'تحميل قالب CSV' : 'Download CSV Template'}
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isAr ? 'قالب CSV' : 'CSV'}</span>
                </button>

                <button
                  onClick={() => handleOpenModal(key, 'import')}
                  className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-2xs font-bold flex items-center justify-center gap-1 transition shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isAr ? 'استيراد' : 'Import'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reusable Data Import / Export Modal */}
      {activeModalEntity && (
        <DataImportExportModal
          isOpen={!!activeModalEntity}
          onClose={() => setActiveModalEntity(null)}
          defaultEntity={activeModalEntity}
          initialTab={modalInitialTab}
        />
      )}
    </div>
  );
};
