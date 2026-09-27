import React, { useState, useRef } from 'react';
import {
  Building2,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileImage,
  ShieldCheck,
  ShieldAlert,
  Info,
  ExternalLink,
  Save,
  Eye,
  Check,
  Printer,
  ChevronRight,
  Layers,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../components/common/ConfirmDialog';
import { UserRole } from '../types';
import { CompanyLogo } from '../components/common/CompanyLogo';

export const CompanySettingsView: React.FC = () => {
  const {
    language,
    currentUser,
    branding,
    uploadCompanyLogo,
    removeCompanyLogo,
    updateCompanyBranding
  } = useApp();
  const confirm = useConfirm();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'branding' | 'profile' | 'preview'>('branding');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    companyName: branding.companyName,
    arabicName: branding.arabicName,
    alternativeArabicName: branding.alternativeArabicName || '',
    sectorAr: branding.sectorAr,
    sectorEn: branding.sectorEn,
    addressAr: branding.addressAr,
    addressEn: branding.addressEn,
    cr: branding.cr,
    taxId: branding.taxId,
    currencyAr: branding.currencyAr,
    phone: branding.phone || '',
    email: branding.email || '',
    website: branding.website || ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security check: Only Admin or users with manage permissions can modify branding/logo
  const canManageBranding =
    currentUser?.role === UserRole.ADMIN ||
    currentUser?.role === UserRole.MANAGEMENT_USER;

  const activeLogoUrl = branding.logoUrl || branding.logo;
  const hasActiveLogo = Boolean(activeLogoUrl && activeLogoUrl.trim() !== '');

  // Handle file selection from input or drag-and-drop
  const handleProcessFile = async (file: File) => {
    if (!canManageBranding) {
      setUploadError(
        isAr
          ? 'ليس لديك صلاحية لتعديل أو استبدال شعار الشركة. هذه العملية مقتصرة على مديري النظام.'
          : 'Access denied: Only system administrators can upload or replace company logo.'
      );
      return;
    }

    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);

    try {
      const result = await uploadCompanyLogo(file);
      if (result.success) {
        setUploadSuccess(
          isAr
            ? `تم رفع وحفظ شعار الشركة بنجاح (${file.name}). الشعار معتمد ومفعل في كافة الشاشات والتقارير.`
            : `Company logo uploaded successfully (${file.name}). Active throughout the application.`
        );
        setTimeout(() => setUploadSuccess(null), 6000);
      } else {
        setUploadError(result.error || (isAr ? 'فشل في رفع الشعار.' : 'Failed to upload logo.'));
      }
    } catch (err: any) {
      setUploadError(err?.message || (isAr ? 'حدث خطأ أثناء معالجة الملف.' : 'An error occurred.'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (canManageBranding) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!canManageBranding) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleRemoveLogo = async () => {
    if (!canManageBranding) return;

    const confirmed = await confirm({
      title: isAr ? 'تأكيد إزالة شعار الشركة الرسمي' : 'Confirm Logo Removal',
      message: isAr
        ? 'هل أنت متأكد من رغبتك في إزالة شعار الشركة؟ لن يتم توليد أي شعار بديل مزيف وستظهر المستندات والتقارير بمساحة الشعار فارغة حتى يتم رفع شعار جديد.'
        : 'Are you sure you want to remove the company logo? Reports and documents will display without a logo and no fake substitute will be generated.',
      confirmLabel: isAr ? 'نعم، إزالة الشعار' : 'Yes, Remove Logo',
      cancelLabel: isAr ? 'إلغاء' : 'Cancel',
      variant: 'danger'
    });

    if (confirmed) {
      setUploadError(null);
      setUploadSuccess(null);
      const res = await removeCompanyLogo();
      if (res.success) {
        setUploadSuccess(
          isAr
            ? 'تمت إزالة الشعار بنجاح. النظام الآن بدون شعار رسمي.'
            : 'Company logo removed successfully.'
        );
        setTimeout(() => setUploadSuccess(null), 5000);
      } else {
        setUploadError(res.error || (isAr ? 'فشل في إزالة الشعار.' : 'Failed to remove logo.'));
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageBranding) return;
    setIsSavingProfile(true);
    try {
      await updateCompanyBranding(profileForm);
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 4000);
    } catch (err: any) {
      setUploadError(err?.message || (isAr ? 'فشل في حفظ البيانات.' : 'Save failed.'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Breadcrumb */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
              <span>{isAr ? 'الإعدادات والتهيئة' : 'Settings'}</span>
              <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
              <span>{isAr ? 'ملف المنشأة' : 'Company Profile'}</span>
              <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
              <span className="text-blue-600 font-bold">{isAr ? 'الهوية والشعار الرسمي' : 'Branding & Logo'}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {isAr ? 'إعدادات وهوية الشركة الرسمية' : 'Company Settings & Branding'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {isAr
                    ? 'إدارة شعار المنشأة الرسمي المعتمد وبيانات الترويسة لكافة المستندات والتقارير'
                    : 'Manage official corporate logo and letterhead details for all reports and documents'}
                </p>
              </div>
            </div>
          </div>

          {/* RBAC Authorization Badge */}
          <div className="flex items-center gap-2">
            {canManageBranding ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
                <ShieldCheck className="w-4 h-4" />
                <span>{isAr ? 'صلاحيات إدارة الهوية: مفعلة' : 'Admin Management: Active'}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold shadow-2xs">
                <ShieldAlert className="w-4 h-4" />
                <span>{isAr ? 'وضع الاستعراض فقط (عرض)' : 'View-Only Access'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 mt-6 -mb-4 overflow-x-auto text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`pb-3 px-3 font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'branding'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileImage className="w-4 h-4" />
            <span>{isAr ? 'شعار الشركة والهوية (Branding)' : 'Company Logo & Branding'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-3 font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{isAr ? 'بيانات المنشأة والسجل التجاري' : 'Company Profile & Registration'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`pb-3 px-3 font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'preview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>{isAr ? 'معاينة الترويسة في المستندات' : 'Letterhead Preview'}</span>
          </button>
        </div>
      </div>

      {/* Alerts & Messages */}
      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div className="text-xs font-semibold leading-relaxed">
            <span className="font-bold block mb-0.5">{isAr ? 'تنبيه:' : 'Error:'}</span>
            {uploadError}
          </div>
        </div>
      )}

      {uploadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <div className="text-xs font-semibold leading-relaxed">
            <span className="font-bold block mb-0.5">{isAr ? 'نجاح:' : 'Success:'}</span>
            {uploadSuccess}
          </div>
        </div>
      )}

      {/* 2. Tab Content: Branding & Logo */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          {/* Permission restriction note for non-admins */}
          {!canManageBranding && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800">
              <Info className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold block">
                  {isAr ? 'تنبيه الصلاحيات (Separation of Duties)' : 'Permission Notice'}
                </span>
                <p className="leading-relaxed">
                  {isAr
                    ? 'أنت في وضع استعراض الشعار والمعلومات الرسمية. تعديل أو استبدال أو إزالة الشعار يتطلب حساب مدير النظام (System Admin) أو صلاحيات إدارة التهيئة.'
                    : 'You have read-only access. Uploading, replacing, or removing company logo requires Administrator privileges.'}
                </p>
              </div>
            </div>
          )}

          {/* Main Logo Management Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {isAr ? 'شعار الشركة الرسمي (Company Logo)' : 'Official Company Logo'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? 'الأصل الرقمي المعتمد لشعار الشركة العربية للبلاستيك — مصدر الحقيقة الوحيد لكافة أجزاء التطبيق'
                    : 'The immutable official corporate logo asset used across the entire application'}
                </p>
              </div>

              {hasActiveLogo ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <Check className="w-3.5 h-3.5" />
                  <span>{isAr ? 'شعار معتمد ومفعل' : 'Active Official Logo'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  <span>{isAr ? 'لم يتم ضبط شعار' : 'No Logo Configured'}</span>
                </span>
              )}
            </div>

            <div className="p-4 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left/Main Column: Logo Display Box & Dropzone */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      {isAr ? 'معاينة الشعار الحالي (Current Logo Preview)' : 'Current Logo Preview'}
                    </label>

                    {/* Preview Box: Real <img> with strict proportional scaling (object-fit: contain) */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative min-h-[260px] sm:min-h-[320px] rounded-2xl border-2 flex flex-col items-center justify-center p-6 transition-all ${
                        isDragging
                          ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                          : hasActiveLogo
                          ? 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                          : 'border-dashed border-slate-300 bg-slate-50'
                      }`}
                      style={{
                        backgroundImage:
                          'radial-gradient(#cbd5e1 1px, transparent 1px), radial-gradient(#cbd5e1 1px, #f8fafc 1px)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 10px 10px'
                      }}
                    >
                      {hasActiveLogo ? (
                        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 max-w-full flex items-center justify-center">
                          <img
                            src={activeLogoUrl}
                            alt={branding.logoAlt}
                            className="max-h-56 max-w-full w-auto h-auto object-contain block"
                            style={{
                              objectFit: 'contain',
                              objectPosition: 'center',
                              maxWidth: '100%',
                              maxHeight: '220px'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="text-center p-6 space-y-3">
                          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-2xs">
                            <FileImage className="w-8 h-8" />
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-sm text-slate-700 block">
                              {isAr ? 'لم يتم رفع شعار رسمي للمنشأة حتى الآن' : 'No Official Logo Uploaded'}
                            </span>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                              {isAr
                                ? 'اضغط على زر رفع الشعار أدناه لاختيار ملف الشعار الرسمي. لن يتم توليد أي شعار تلقائي أو مزيف.'
                                : 'Click Upload Logo below to upload the company brand asset. No placeholder art will be auto-generated.'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Drag overlay notice */}
                      {isDragging && (
                        <div className="absolute inset-0 bg-blue-600/90 rounded-2xl flex flex-col items-center justify-center text-white p-6 space-y-2 animate-in fade-in">
                          <Upload className="w-10 h-10 animate-bounce" />
                          <span className="font-bold text-sm">
                            {isAr ? 'أفلت ملف الشعار هنا للرفع الفوري' : 'Drop logo file here to upload'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons: [Upload] [Replace] [Remove] */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
                      className="hidden"
                      id="company-logo-file-input"
                    />

                    {!hasActiveLogo ? (
                      <button
                        type="button"
                        id="btn-upload-logo"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!canManageBranding || isUploading}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{isUploading ? (isAr ? 'جارِ الرفع والتحقق...' : 'Uploading...') : (isAr ? 'رفع شعار الشركة' : 'Upload Logo')}</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          id="btn-replace-logo"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={!canManageBranding || isUploading}
                          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <RefreshCw className={`w-4 h-4 ${isUploading ? 'animate-spin' : ''}`} />
                          <span>{isUploading ? (isAr ? 'جارِ الاستبدال...' : 'Replacing...') : (isAr ? 'استبدال الشعار' : 'Replace Logo')}</span>
                        </button>

                        <button
                          type="button"
                          id="btn-remove-logo"
                          onClick={handleRemoveLogo}
                          disabled={!canManageBranding || isUploading}
                          className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs sm:text-sm flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{isAr ? 'إزالة الشعار' : 'Remove Logo'}</span>
                        </button>
                      </>
                    )}

                    {hasActiveLogo && (
                      <a
                        href={activeLogoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
                        title={isAr ? 'عرض الملف الأصلي بالحجم الكامل' : 'Open original file'}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isAr ? 'فتح الملف الأصلي' : 'View Raw File'}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Right Column: Asset Specifications & Rules */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>{isAr ? 'المواصفات الفنية المعتمدة' : 'Technical Asset Specifications'}</span>
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-start justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500 font-medium">{isAr ? 'الصيغ المدعومة:' : 'Supported Formats:'}</span>
                        <span className="font-bold text-slate-800 font-mono">JPG, JPEG, PNG, WEBP, SVG</span>
                      </div>

                      <div className="flex items-start justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500 font-medium">{isAr ? 'الحد الأقصى للحجم:' : 'Max File Size:'}</span>
                        <span className="font-bold text-slate-800 font-mono">5.0 MB</span>
                      </div>

                      <div className="flex items-start justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500 font-medium">{isAr ? 'طريقة العرض القياسية:' : 'Render Mode:'}</span>
                        <span className="font-bold text-slate-800 font-mono">object-fit: contain</span>
                      </div>

                      <div className="flex items-start justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500 font-medium">{isAr ? 'مسار الأصل الرقمي:' : 'Permanent Storage URL:'}</span>
                        <span className="font-mono text-[11px] text-blue-700 truncate max-w-[180px]" title={activeLogoUrl}>
                          {hasActiveLogo ? activeLogoUrl : (isAr ? 'غير محدد' : 'None')}
                        </span>
                      </div>

                      <div className="flex items-start justify-between">
                        <span className="text-slate-500 font-medium">{isAr ? 'حالة التخزين:' : 'Persistence:'}</span>
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                          <Check className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تخزين دائم (Database & Storage)' : 'Persistent'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Strict Logo Integrity Rules */}
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 space-y-2">
                    <span className="font-bold flex items-center gap-1.5 text-blue-800">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span>{isAr ? 'ضوابط حماية الهوية الصارمة:' : 'Brand Integrity Governance:'}</span>
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed">
                      <li>{isAr ? 'يتم استخدام الملف المرفوع كما هو دون أي اقتصاص أو تغيير للنسبة.' : 'Image is rendered as-is with original aspect ratio.'}</li>
                      <li>{isAr ? 'لا يتم توليد أي شعار بالذكاء الاصطناعي أو تحويله إلى كود CSS.' : 'Never auto-generated by AI or converted to CSS.'}</li>
                      <li>{isAr ? 'يتم توريث نفس الشعار المرفوع آلياً إلى كافة التقارير وسندات الطباعة وملفات PDF.' : 'Automatically inherited by all reports, receipts, and PDFs.'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tab Content: Company Profile Details */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isAr ? 'بيانات المنشأة والسجل التجاري' : 'Company Profile & Registration'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'هذه البيانات تظهر في ترويسة التقارير الرسمية وسندات القبض والصرف وأوامر التشغيل'
                  : 'Official details displayed in letterheads, vouchers, and audit reports'}
              </p>
            </div>

            {profileSaveSuccess && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>{isAr ? 'تم حفظ البيانات بنجاح' : 'Saved successfully'}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-xs sm:text-sm">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                {isAr ? 'اسم الشركة باللغة العربية' : 'Company Name (Arabic)'}
              </label>
              <input
                type="text"
                value={profileForm.arabicName}
                onChange={(e) => setProfileForm({ ...profileForm, arabicName: e.target.value })}
                disabled={!canManageBranding}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                {isAr ? 'اسم الشركة باللغة الإنجليزية' : 'Company Name (English)'}
              </label>
              <input
                type="text"
                value={profileForm.companyName}
                onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                disabled={!canManageBranding}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                {isAr ? 'القطاع / الإدارة التابعة (عربي)' : 'Department / Sector (Arabic)'}
              </label>
              <input
                type="text"
                value={profileForm.sectorAr}
                onChange={(e) => setProfileForm({ ...profileForm, sectorAr: e.target.value })}
                disabled={!canManageBranding}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                {isAr ? 'القطاع / الإدارة التابعة (إنجليزي)' : 'Department / Sector (English)'}
              </label>
              <input
                type="text"
                value={profileForm.sectorEn}
                onChange={(e) => setProfileForm({ ...profileForm, sectorEn: e.target.value })}
                disabled={!canManageBranding}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                {isAr ? 'رقم السجل التجاري (CR)' : 'Commercial Registration (CR)'}
              </label>
              <input
                type="text"
                value={profileForm.cr}
                onChange={(e) => setProfileForm({ ...profileForm, cr: e.target.value })}
                disabled={!canManageBranding}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono disabled:bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                {isAr ? 'رقم البطاقة الضريبية (Tax ID)' : 'Tax ID'}
              </label>
              <input
                type="text"
                value={profileForm.taxId}
                onChange={(e) => setProfileForm({ ...profileForm, taxId: e.target.value })}
                disabled={!canManageBranding}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono disabled:bg-slate-50"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="font-bold text-slate-700 block">
                {isAr ? 'العنوان الصناعي الرسمي (عربي)' : 'Factory Address (Arabic)'}
              </label>
              <input
                type="text"
                value={profileForm.addressAr}
                onChange={(e) => setProfileForm({ ...profileForm, addressAr: e.target.value })}
                disabled={!canManageBranding}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                {isAr ? 'البريد الإلكتروني الرسمي' : 'Official Email'}
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                disabled={!canManageBranding}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">
                {isAr ? 'الموقع الإلكتروني' : 'Website'}
              </label>
              <input
                type="text"
                value={profileForm.website}
                onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                disabled={!canManageBranding}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-50"
              />
            </div>
          </div>

          {canManageBranding && (
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                id="btn-save-company-profile"
                disabled={isSavingProfile}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? (isAr ? 'جارِ الحفظ...' : 'Saving...') : (isAr ? 'حفظ تعديلات المنشأة' : 'Save Changes')}</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* 4. Tab Content: Live Document & Report Letterhead Preview */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isAr ? 'معاينة الترويسة الموحدة في التقارير والطباعة' : 'Unified Document Letterhead Preview'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'هذا النموذج يوضح كيف يظهر الشعار الرسمي المرفوع بدقة في كافة المستندات وسندات الاستلام وتقارير التدقيق'
                  : 'Demonstrates exact rendering of the uploaded logo in printable forms and audit reports'}
              </p>
            </div>

            {/* Simulated Report Header */}
            <div className="border-2 border-slate-900 p-6 rounded-xl bg-white shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-slate-300 pb-4">
                <div className="flex items-start gap-4">
                  <CompanyLogo size="lg" className="shrink-0" />
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-950 tracking-tight">
                      {isAr ? branding.arabicName : branding.companyName}
                    </h3>
                    <p className="text-xs text-slate-700 font-bold">
                      {isAr ? branding.sectorAr : branding.sectorEn}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {isAr ? branding.addressAr : branding.addressEn}
                    </p>
                  </div>
                </div>

                <div className="text-left font-mono text-[11px] space-y-1 shrink-0">
                  <div className="font-bold text-xs text-slate-900 bg-slate-100 border border-slate-400 px-2.5 py-0.5 rounded inline-block">
                    {isAr ? 'وثيقة رسمية معتمدة' : 'Official Document'}
                  </div>
                  <div className="text-slate-600">
                    <span className="font-semibold">{isAr ? 'رقم المستند:' : 'Doc Ref:'} </span>
                    <span className="font-bold text-slate-900">DOC-2026-94812</span>
                  </div>
                  <div className="text-slate-600">
                    <span className="font-semibold">{isAr ? 'التاريخ:' : 'Date:'} </span>
                    <span>{new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
                  </div>
                </div>
              </div>

              {/* Sample Document Body */}
              <div className="py-4 text-center bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-base font-extrabold text-slate-900">
                  {isAr ? 'سند استلام مخزني معتمد / إذن إضافة' : 'Goods Receipt Voucher'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'يتم توريث الشعار المرفوع أعلاه في كافة مخرجات PDF والطباعة المباشرة'
                    : 'The official logo is automatically rendered across all printouts and PDF exports'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
