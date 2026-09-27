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
  logoAlt: string;
  sectorAr: string;
  sectorEn: string;
  addressAr: string;
  addressEn: string;
  cr: string;
  taxId: string;
  currency: string;
  currencyAr: string;
}

export const companyBranding: CompanyBranding = {
  companyName: "Arab Co. For Plastic",
  arabicName: "الشركة العربية للدائن",
  alternativeArabicName: "الشركة العربية للبلاستيك",
  logo: "/assets/company-logo.jpg",
  logoAlt: "الشركة العربية للدائن - Arab Co. For Plastic",
  sectorAr: "قطاع الشؤون المالية وحسابات التكاليف — الإدارة العامة للرقابة والتدقيق المخزني",
  sectorEn: "Financial Affairs & Cost Accounting Sector — General Audit & Inventory Control",
  addressAr: "المنطقة الصناعية الثالثة، مدينة السادس من أكتوبر | س.ت: 89412 | ب.ض: 239-482-109",
  addressEn: "3rd Industrial Zone, 6th of October City, Egypt | CR: 89412 | Tax ID: 239-482-109",
  cr: "89412",
  taxId: "239-482-109",
  currency: "EGP",
  currencyAr: "جنيه مصري",
};
