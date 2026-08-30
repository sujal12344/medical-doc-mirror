import { ResolverContext, ResolverFn } from "./types";

const extractPlaceFromAddress = (address: string): string => {
  if (!address) return '';
  const parts = address.split(',').map(p => p.trim());
  const withoutPin = parts.filter(p => !/^\d{5,6}$/.test(p) && p.toLowerCase() !== 'india');
  if (withoutPin.length > 0) {
    return withoutPin[withoutPin.length - 1]; // E.g. 'Bihar' or 'Mumbai'
  }
  return '';
};

const extractPinCode = (address: string): string => {
  if (!address) return '';
  const match = address.match(/\b\d{6}\b/);
  return match ? match[0] : '';
};

const extractState = (address: string): string => {
  if (!address) return '';
  const parts = address.split(',').map(p => p.trim());
  // Usually state is the second to last part before country/pin, or we can just rely on the place extractor
  // For standard Indian address ending in 'Bihar, India, 824203'
  const withoutPin = parts.filter(p => !/^\d{5,6}$/.test(p) && p.toLowerCase() !== 'india');
  if (withoutPin.length > 0) {
    return withoutPin[withoutPin.length - 1]; 
  }
  return '';
};

const formatDate = (date: any) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch (e) {
    return String(date);
  }
};

/**
 * Resolvers that extract data primarily from the Company's Certificate of Incorporation (COI)
 * and generic Company settings.
 */
export const coiResolvers: Record<string, ResolverFn> = {
  applicantConstitution: (ctx) => ctx.coi?.bodyConstitution || ctx.company?.businessGenesis?.secB?.entityType || ctx.coi?.businessType || '',
  applicantName: (ctx) => ctx.company?.companyName || ctx.coi?.applicantName || ctx.coi?.name || '',
  bodyConstitution: (ctx) => ctx.coi?.bodyConstitution || ctx.company?.businessGenesis?.secB?.entityType || ctx.coi?.businessType || '',
  registeredOfficeAddress: (ctx) => ctx.coi?.registeredOfficeAddress || ctx.coi?.registeredAddress || ctx.company?.businessGenesis?.secB?.registeredOfficeAddress || '',
  sponsorAddress: (ctx) => ctx.coi?.registeredOfficeAddress || ctx.coi?.registeredAddress || ctx.company?.businessGenesis?.secB?.registeredOfficeAddress || '',
  correspondenceAddress: (ctx) => ctx.coi?.registeredOfficeAddress || ctx.coi?.registeredAddress || ctx.company?.businessGenesis?.secB?.registeredOfficeAddress || '',
  incorporationDate: (ctx) => ctx.coi?.incorporationDate || formatDate(ctx.company?.businessGenesis?.secB?.incorporationDate) || '',
  incorporationNumber: (ctx) => ctx.coi?.cinNumber || ctx.company?.businessGenesis?.secB?.cin || '',
  
  // Generic Company Details
  companyEmail: (ctx) => ctx.company?.companyEmail || '',
  companyContactNumber: (ctx) => ctx.company?.companyNumber || '',
  applicationPlace: (ctx) => extractPlaceFromAddress(ctx.coi?.registeredOfficeAddress || ctx.coi?.registeredAddress || ctx.company?.businessGenesis?.secB?.registeredOfficeAddress),
  pinCode: (ctx) => extractPinCode(ctx.coi?.registeredOfficeAddress || ctx.coi?.registeredAddress || ctx.company?.businessGenesis?.secB?.registeredOfficeAddress),
  state: (ctx) => extractState(ctx.coi?.registeredOfficeAddress || ctx.coi?.registeredAddress || ctx.company?.businessGenesis?.secB?.registeredOfficeAddress),
  panNumber: (ctx) => ctx.company?.businessGenesis?.secB?.pan || '',
  tanNumber: (ctx) => ctx.company?.businessGenesis?.secB?.tan || '',
  cinNumber: (ctx) => ctx.coi?.cinNumber || ctx.company?.businessGenesis?.secB?.cin || '',
  
  // Signatories
  authorisedSignatoryName: (ctx) => ctx.coi?.signatories?.[0]?.name || ctx.company?.businessGenesis?.secC?.signatories?.[0]?.name || '',
  authorisedSignatoryDesignation: (ctx) => ctx.coi?.signatories?.[0]?.designation || ctx.company?.businessGenesis?.secC?.signatories?.[0]?.designation || '',
  designatedPersonName: (ctx) => ctx.coi?.signatories?.[0]?.name || ctx.company?.businessGenesis?.secC?.signatories?.[0]?.name || '[Authorized Signatory Name]',
  designatedPersonDesignation: (ctx) => ctx.coi?.signatories?.[0]?.designation || ctx.company?.businessGenesis?.secC?.signatories?.[0]?.designation || '[Designation]',
};
