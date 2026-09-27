/**
 * Official Corporate Branding Configuration
 * Arab Co. For Plastic (الشركة العربية للدائن / الشركة العربية للبلاستيك)
 *
 * Single Source of Truth for Enterprise Identity, Logo Assets, and Document Letterhead.
 */

export interface CompanyBranding {
  companyName: string;
  arabicName: string;
  alternativeArabicName: string;
  logo: string;
  logoUrl?: string;
  logoAlt: string;
  sectorAr: string;
  sectorEn: string;
  addressAr: string;
  addressEn: string;
  cr: string;
  taxId: string;
  currency: string;
  currencyAr: string;
  phone?: string;
  email?: string;
  website?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_BRANDING: CompanyBranding = {
  companyName: "Arab Co. For Plastic",
  arabicName: "الشركة العربية للدائن",
  alternativeArabicName: "الشركة العربية للبلاستيك",
  logo: "/assets/company-logo.jpg",
  logoUrl: "/assets/company-logo.jpg",
  logoAlt: "الشركة العربية للبلاستيك - Arab Co. For Plastic",
  sectorAr: "قطاع الشؤون المالية وحسابات التكاليف — الإدارة العامة للرقابة والتدقيق المخزني",
  sectorEn: "Financial Affairs & Cost Accounting Sector — General Audit & Inventory Control",
  addressAr: "المنطقة الصناعية الثالثة، مدينة السادس من أكتوبر | س.ت: 89412 | ب.ض: 239-482-109",
  addressEn: "3rd Industrial Zone, 6th of October City, Egypt | CR: 89412 | Tax ID: 239-482-109",
  cr: "89412",
  taxId: "239-482-109",
  currency: "EGP",
  currencyAr: "جنيه مصري",
  phone: "+20 2 38340000",
  email: "info@arabplastic.com",
  website: "www.arabplastic.com",
};

// Initialize from local cache if user previously uploaded or modified branding
function loadInitialBranding(): CompanyBranding {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('mfg_inv_odoo_v2_company_branding');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_BRANDING,
          ...parsed,
          // Ensure logo and logoUrl stay synchronized
          logo: parsed.logoUrl !== undefined ? parsed.logoUrl : parsed.logo || DEFAULT_BRANDING.logo,
          logoUrl: parsed.logoUrl !== undefined ? parsed.logoUrl : parsed.logo || DEFAULT_BRANDING.logoUrl,
        };
      }
    } catch (e) {
      console.warn('Could not read cached branding:', e);
    }
  }
  return { ...DEFAULT_BRANDING };
}

export let companyBranding: CompanyBranding = loadInitialBranding();

type BrandingListener = (branding: CompanyBranding) => void;
const brandingListeners: Set<BrandingListener> = new Set();

export function getCompanyBranding(): CompanyBranding {
  return companyBranding;
}

export function setCompanyBranding(updated: Partial<CompanyBranding>): CompanyBranding {
  const merged: CompanyBranding = {
    ...companyBranding,
    ...updated,
  };

  // Synchronize logo and logoUrl
  if (updated.logoUrl !== undefined) {
    merged.logo = updated.logoUrl;
    merged.logoUrl = updated.logoUrl;
  } else if (updated.logo !== undefined) {
    merged.logoUrl = updated.logo;
  }

  companyBranding = merged;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mfg_inv_odoo_v2_company_branding', JSON.stringify(merged));
    } catch (e) {
      console.warn('Could not cache branding to localStorage:', e);
    }
  }

  // Notify active subscribers
  brandingListeners.forEach((listener) => {
    try {
      listener(merged);
    } catch (e) {
      console.error('Error in branding listener:', e);
    }
  });

  return merged;
}

export function subscribeBranding(listener: BrandingListener): () => void {
  brandingListeners.add(listener);
  return () => {
    brandingListeners.delete(listener);
  };
}
