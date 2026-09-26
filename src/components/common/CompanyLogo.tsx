import React from 'react';

interface CompanyLogoProps {
  className?: string;
  showText?: boolean;
  light?: boolean;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ className = 'w-10 h-10', showText = false, light = false }) => {
  return (
    <div className="flex items-center gap-2.5">
      {/* High-Fidelity SVG rendering of the AP Logo with White Helix */}
      <svg
        viewBox="0 0 512 512"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background rounded rectangle or circle */}
        <rect width="512" height="512" rx="112" fill={light ? "transparent" : "#ffffff"} />
        
        {/* Stylized AP Monogram */}
        {/* Letter A */}
        <path
          d="M100 400 L210 120 L290 120 L400 400 L320 400 L295 315 L185 315 L160 400 Z"
          fill="#1b355e"
        />
        {/* A's bar counter */}
        <path d="M200 255 L280 255 L240 155 Z" fill={light ? "#0f172a" : "#ffffff"} />
        
        {/* Letter P */}
        <path
          d="M260 120 L400 120 C470 120, 470 270, 400 270 L260 270 Z M260 270 L260 400 L180 400 L180 120 Z"
          fill="#1b355e"
        />
        {/* P's inner counter */}
        <path d="M260 170 L380 170 C410 170, 410 220, 380 220 L260 220 Z" fill={light ? "#0f172a" : "#ffffff"} />

        {/* Double Helix wrapping in the center (representing DNA / Plastics polymer strand) */}
        {/* Helix Strand A */}
        <path
          d="M210 100 C270 180, 190 280, 270 350 C310 380, 270 430, 250 450"
          stroke="#ffffff"
          strokeWidth="20"
          strokeLinecap="round"
        />
        {/* Helix Strand B */}
        <path
          d="M270 100 C210 180, 270 280, 190 350 C170 380, 190 430, 210 450"
          stroke="#ffffff"
          strokeWidth="20"
          strokeLinecap="round"
        />
        
        {/* Helix bonds/bridges (connecting blue/cyan rungs) */}
        <line x1="222" y1="160" x2="258" y2="160" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" />
        <line x1="250" y1="220" x2="210" y2="220" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" />
        <line x1="210" y1="280" x2="250" y2="280" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" />
        <line x1="250" y1="340" x2="210" y2="340" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" />
      </svg>
      {showText && (
        <div className="flex flex-col text-right rtl:text-right ltr:text-left min-w-0">
          <span className={`font-extrabold text-xs sm:text-sm ${light ? 'text-white' : 'text-slate-900'} leading-tight truncate`}>
            الشركة العربية للدائن
          </span>
          <span className={`text-[10px] sm:text-[11px] font-semibold ${light ? 'text-slate-400' : 'text-slate-500'} font-sans tracking-wide leading-none truncate mt-0.5`}>
            Arab Co. For Plastic
          </span>
        </div>
      )}
    </div>
  );
};
