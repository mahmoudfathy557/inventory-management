import React from 'react';
import { companyBranding } from '../../config/branding';

export interface CompanyLogoProps {
  className?: string;
  style?: React.CSSProperties;
  showText?: boolean;
  variant?: 'full' | 'emblem' | 'horizontal';
  light?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  maxWidth?: number | string;
  maxHeight?: number | string;
  alt?: string;
}

/**
 * Centralized Official Company Logo Component
 * Single Source of Truth for Arab Co. For Plastic (الشركة العربية للدائن)
 *
 * Strict Display Rules:
 * - Real <img> element using the official asset: /assets/company-logo.jpg
 * - object-fit: contain; object-position: center;
 * - Preserves exact original proportions and aspect ratio (1:1)
 * - Renders original white background and colors exactly as uploaded
 * - No cropping, distortion, filters, or AI regeneration
 */
export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  className = '',
  style = {},
  showText = false,
  variant = 'horizontal',
  light = false,
  size = 'custom',
  maxWidth,
  maxHeight,
  alt = companyBranding.logoAlt
}) => {
  // Preset responsive maximum bounding sizes (while strictly preserving 1:1 aspect ratio)
  const sizeClasses: Record<string, string> = {
    xs: 'h-8 w-auto max-h-8 max-w-full',
    sm: 'h-10 w-auto max-h-10 max-w-full',
    md: 'h-14 w-auto max-h-14 max-w-full',
    lg: 'h-20 w-auto max-h-20 max-w-full',
    xl: 'h-28 w-auto max-h-28 max-w-full',
    custom: ''
  };

  const imageStyle: React.CSSProperties = {
    objectFit: 'contain',
    objectPosition: 'center',
    aspectRatio: '1 / 1',
    maxWidth: maxWidth || undefined,
    maxHeight: maxHeight || undefined,
    ...style
  };

  const imgElement = (
    <img
      src={companyBranding.logo}
      alt={alt}
      loading="eager"
      decoding="sync"
      className={`shrink-0 block ${size !== 'custom' ? sizeClasses[size] : ''} ${className}`}
      style={imageStyle}
      referrerPolicy="no-referrer"
    />
  );

  // If used in variant="full" or just the raw logo
  if (variant === 'full' || (!showText && variant !== 'horizontal')) {
    return (
      <div className={`inline-flex flex-col items-center justify-center ${light ? 'bg-white p-2 rounded-2xl shadow-sm border border-slate-200' : ''}`}>
        {imgElement}
      </div>
    );
  }

  // Pure emblem / logo without companion text
  if (!showText) {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${light ? 'bg-white p-1 rounded-xl shadow-xs border border-white/30' : ''}`}>
        {imgElement}
      </div>
    );
  }

  // Horizontal presentation: Official Image Logo + Authentic Brand Typography
  return (
    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
      <div className={`shrink-0 inline-flex items-center justify-center ${light ? 'bg-white p-1 rounded-xl shadow-xs border border-white/20' : ''}`}>
        {imgElement}
      </div>

      <div className="flex flex-col text-right rtl:text-right ltr:text-left min-w-0">
        <span
          className={`font-extrabold text-sm sm:text-base leading-tight truncate tracking-tight ${
            light ? 'text-white' : 'text-[#10285a]'
          }`}
          style={{ fontFamily: "'Aref Ruqaa', 'Cairo', serif" }}
        >
          {companyBranding.arabicName}
        </span>
        <span
          className={`text-[10px] sm:text-[11px] font-semibold tracking-wide leading-none truncate mt-0.5 ${
            light ? 'text-slate-300' : 'text-[#10285a]/80'
          }`}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {companyBranding.companyName}
        </span>
      </div>
    </div>
  );
};
