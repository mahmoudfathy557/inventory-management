import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  Wifi,
  WifiOff,
  Laptop
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useApp } from '../../context/AppContext';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = ''
}) => {
  const { language } = useApp();
  const isAr = language === 'ar';
  const { isInstallable, isInstalled, isIOS, isOnline, install } = usePWAInstall();

  const [showGuideModal, setShowGuideModal] = useState(false);

  // Close guide modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showGuideModal) {
        setShowGuideModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGuideModal]);

  // If already running in standalone PWA mode, display a subtle "App Installed" or offline/online status indicator
  if (isInstalled) {
    if (variant === 'sidebar') {
      return (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'تطبيق مثبت (PWA)' : 'Installed App'}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-300">
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
            <span>{isOnline ? (isAr ? 'متصل' : 'Online') : (isAr ? 'أوفلاين' : 'Offline')}</span>
          </div>
        </div>
      );
    }
    return null;
  }

  const handleTriggerInstall = () => {
    setShowGuideModal(true);
  };

  return (
    <>
      {/* Header Button Variant */}
      {variant === 'header' && (
        <button
          id="btn-header-install-pwa"
          onClick={handleTriggerInstall}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-xs hover:shadow-md transition cursor-pointer shrink-0 ${className}`}
          title={isAr ? 'تثبيت وتحميل التطبيق على جهازك' : 'Download & Install PWA App'}
          aria-label="Install App"
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span className="hidden md:inline">
            {isAr ? 'تحميل كـ تطبيق' : 'Install App'}
          </span>
          <span className="md:hidden">
            {isAr ? 'تثبيت' : 'Install'}
          </span>
        </button>
      )}

      {/* Sidebar Card / Banner Variant */}
      {variant === 'sidebar' && (
        <div className={`p-3 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-white space-y-2 shadow-md ${className}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
              <Smartphone className="w-4 h-4" />
              <span>{isAr ? 'تطبيق سطح المكتب والجوال' : 'PWA Desktop & Mobile'}</span>
            </div>
            <span className="px-1.5 py-0.2 bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded text-[9px] font-mono font-bold">
              Standalone
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {isAr
              ? 'ثبّت نظام ريمكس للإنتاج كـ تطبيق حقيقي للعمل بدون إنترنت وسرعة فائقة.'
              : 'Install Remix ERP as a standalone app with offline caching and quick launch.'}
          </p>
          <button
            id="btn-sidebar-install-pwa"
            onClick={handleTriggerInstall}
            className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تثبيت التطبيق الآن' : 'Install Application'}</span>
          </button>
        </div>
      )}

      {/* Banner Variant */}
      {variant === 'banner' && (
        <div className={`p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 text-white border border-blue-700/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg ${className}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/30 border border-blue-400/30 text-sky-300">
              <Download className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-sm">
                {isAr ? 'قم بتثبيت التطبيق على جهازك (PWA)' : 'Install Standalone Application'}
              </h4>
              <p className="text-xs text-slate-300">
                {isAr
                  ? 'تشغيل سريع بنقرة واحدة من شاشة الهاتف أو سطح المكتب دون الحاجة للمتصفح'
                  : 'Fast 1-click launch from mobile home screen or desktop without browser bars'}
              </p>
            </div>
          </div>
          <button
            onClick={handleTriggerInstall}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shadow-md transition"
          >
            <Download className="w-4 h-4" />
            <span>{isAr ? 'تثبيت التطبيق' : 'Install Now'}</span>
          </button>
        </div>
      )}

      {/* Guided Installation Instructions Modal (rendered in body portal) */}
      {showGuideModal &&
        createPortal(
          <div
            id="modal-pwa-install-guide"
            className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowGuideModal(false);
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl sm:max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-150 my-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pwa-guide-title"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 id="pwa-guide-title" className="font-bold text-base">
                      {isAr ? 'تثبيت التطبيق على جهازك (PWA)' : 'Install Application as Standalone App'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isAr
                        ? 'يعمل التطبيق بدون اتصال بالإنترنت مع دعم كامل للمزامنة'
                        : 'Enjoy lightning-fast offline access and native desktop/mobile experience'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-close-pwa-modal"
                  onClick={() => setShowGuideModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Guide Body */}
              <div className="p-5 sm:p-6 space-y-4 text-xs">
                {/* One-Click Direct Installation Banner inside Modal Overlay if Browser supports prompt */}
                {isInstallable && (
                  <div className="p-4 bg-gradient-to-r from-sky-900/90 via-slate-900 to-blue-950 border border-sky-500/40 rounded-2xl text-white space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-sky-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
                        <span>{isAr ? 'جهازك يدعم التثبيت المباشر بنقرة واحدة!' : 'One-Click Direct Installation Ready'}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold border border-sky-400/30">
                        PWA Supported
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {isAr
                        ? 'انقر على الزر أدناه لتثبيت نظام ريمكس ERP فوراً كـ تطبيق حقيقي على سطح المكتب أو الشاشة الرئيسية بدعم أوفلاين كامل.'
                        : 'Click below to install Remix ERP directly as a standalone desktop/mobile app with offline caching.'}
                    </p>
                    <button
                      type="button"
                      id="btn-modal-install-pwa-now"
                      onClick={async () => {
                        await install();
                        setShowGuideModal(false);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                    >
                      <Download className="w-4 h-4 animate-bounce" />
                      <span>{isAr ? 'تثبيت التطبيق على الجهاز الآن' : 'Install Standalone App Now'}</span>
                    </button>
                  </div>
                )}
              {isIOS ? (
                /* iOS Safari Instructions */
                <div className="space-y-4">
                  <p className="text-slate-700 leading-relaxed text-sm">
                    {isAr
                      ? 'لتثبيت تطبيق Remix ERP على أجهزة iPhone و iPad من متصفح Safari، اتبع الخطوات البسيطة التالية:'
                      : 'To install Remix ERP on your iPhone or iPad using Safari, follow these simple steps:'}
                  </p>

                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                        1
                      </span>
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <span>{isAr ? 'اضغط على زر المشاركة (Share)' : 'Tap the Share Button'}</span>
                          <Share className="w-4 h-4 text-blue-600 inline" />
                        </div>
                        <p className="text-slate-600 text-xs">
                          {isAr
                            ? 'الموجود في الشريط السفلي لمتصفح Safari أسفل الشاشة.'
                            : 'Located in the bottom navigation bar of Safari.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-3 border-t border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                        2
                      </span>
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <span>{isAr ? 'اختر "إضافة إلى الشاشة الرئيسية"' : 'Select "Add to Home Screen"'}</span>
                          <PlusSquare className="w-4 h-4 text-emerald-600 inline" />
                        </div>
                        <p className="text-slate-600 text-xs">
                          {isAr
                            ? 'مرر للأسفل في قائمة الخيارات واضغط على خيار (Add to Home Screen).'
                            : 'Scroll down the share sheet and select "Add to Home Screen".'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-3 border-t border-slate-200">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                        3
                      </span>
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-slate-900">
                          {isAr ? 'اضغط على "إضافة" (Add) في الزاوية العلوية' : 'Tap "Add" in the top-right corner'}
                        </div>
                        <p className="text-slate-600 text-xs">
                          {isAr
                            ? 'سيظهر أيقونة التطبيق مباشرة على شاشة هاتفك الرئيسية، ويمكنك فتحه كنافذة مستقلة بدون متصفح.'
                            : 'The app icon will now appear on your home screen for quick 1-tap offline launch.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Desktop / Android Fallback Instructions */
                <div className="space-y-4">
                  <p className="text-slate-700 leading-relaxed text-sm">
                    {isAr
                      ? 'يمكنك تثبيت تطبيق Remix ERP مباشرة على الكمبيوتر (Windows / Mac / ChromeOS) أو هاتف Android كـ تطبيق مكتبي/موبايل مستقل:'
                      : 'You can install Remix ERP directly on your PC (Windows, macOS, ChromeOS) or Android phone as a native application:'}
                  </p>

                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-sky-100 text-sky-700 shrink-0">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-sm text-slate-900 block">
                          {isAr ? 'الخيار 1: من شريط العنوان في المتصفح:' : 'Option 1: From the Browser Address Bar:'}
                        </span>
                        <p className="text-slate-600 text-xs leading-relaxed">
                          {isAr
                            ? 'اضغط على أيقونة التثبيت (🖥️ أو ⬇️) الموجودة في الجانب الأيمن لشريط عنوان المتصفح.'
                            : 'Click the Install icon (computer or down arrow) in your browser address bar.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-3 border-t border-slate-200">
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-sm text-slate-900 block">
                          {isAr ? 'الخيار 2: من قائمة المتصفح (⋮):' : 'Option 2: From Browser Menu (⋮):'}
                        </span>
                        <p className="text-slate-600 text-xs leading-relaxed">
                          {isAr
                            ? 'افتح قائمة المتصفح (النقاط الثلاث) واضغط على "تثبيت تطبيق Remix ERP".'
                            : 'Open the browser menu (top-right three dots) and select "Install Remix ERP".'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 flex items-center justify-between border-t border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'جاهز للاستخدام الأوفلاين السريع' : 'Offline Ready & Auto-Sync'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
                >
                  {isAr ? 'حسناً، فهمت' : 'Got it, Thanks!'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
