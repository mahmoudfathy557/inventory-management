import React from 'react';

export interface CompanyLogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'full' | 'emblem' | 'horizontal';
  light?: boolean;
}

/**
 * Official Logo Component for Arab Co. For Plastic (الشركة العربية للدائن)
 * Faithfully matches the exact corporate emblem:
 * - Solid Navy Blue (#112a5d) AP Monogram
 * - Sinuous 3D Intertwined White (#ffffff) Double-Helix Polymer Strand
 * - Clean English Typography: "Arab Co. For Plastic"
 * - Authentic Arabic Calligraphy: "الشركة العربية للدائن"
 */
export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  className = 'w-10 h-10',
  showText = false,
  variant = 'horizontal',
  light = false
}) => {
  // 1. Full Square Brand Logo (Monogram + English + Arabic as in original image)
  if (variant === 'full') {
    return (
      <div className={`inline-flex flex-col items-center justify-center ${light ? 'bg-white p-2 rounded-2xl shadow-sm border border-slate-200' : ''}`}>
        <img
          src="/company-logo.svg"
          alt="الشركة العربية للدائن - Arab Co. For Plastic"
          className={`${className} object-contain`}
        />
      </div>
    );
  }

  // 2. Emblem Only (AP Monogram with Double-Helix)
  if (variant === 'emblem' || !showText) {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${light ? 'bg-white p-1 rounded-xl shadow-xs border border-white/30' : ''}`}>
        <img
          src="/company-logo-emblem.svg"
          alt="الشركة العربية للدائن"
          className={`${className} object-contain`}
        />
      </div>
    );
  }

  // 3. Horizontal Format (Emblem + Authentic Bilingual Brand Typography)
  return (
    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
      <div className={`shrink-0 inline-flex items-center justify-center ${light ? 'bg-white p-1.5 rounded-xl shadow-xs border border-white/20' : ''}`}>
        <img
          src="/company-logo-emblem.svg"
          alt="الشركة العربية للدائن"
          className={`${className} object-contain`}
        />
      </div>

      <div className="flex flex-col text-right rtl:text-right ltr:text-left min-w-0">
        <span
          className={`font-extrabold text-sm sm:text-base leading-tight truncate tracking-tight ${
            light ? 'text-white' : 'text-[#112a5d]'
          }`}
          style={{ fontFamily: "'Aref Ruqaa', 'Cairo', serif" }}
        >
          الشركة العربية للدائن
        </span>
        <span
          className={`text-[10px] sm:text-[11px] font-semibold tracking-wide leading-none truncate mt-0.5 ${
            light ? 'text-slate-300' : 'text-[#112a5d]/80'
          }`}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Arab Co. For Plastic
        </span>
      </div>
    </div>
  );
};
