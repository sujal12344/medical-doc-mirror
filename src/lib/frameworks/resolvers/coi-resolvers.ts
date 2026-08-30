import { ResolverContext, ResolverFn } from "./types";

/**
 * Resolvers that extract data primarily from the Company's Certificate of Incorporation (COI)
 */
export const coiResolvers: Record<string, ResolverFn> = {
  applicantConstitution: (ctx) => ctx.coi?.businessType || '',
  applicantName: (ctx) => ctx.coi?.applicantName || ctx.coi?.name || '',
  bodyConstitution: (ctx) => ctx.coi?.bodyConstitution || ctx.coi?.businessType || '',
  registeredOfficeAddress: (ctx) => ctx.coi?.registeredAddress || '',
  sponsorAddress: (ctx) => ctx.coi?.registeredAddress || '',
  correspondenceAddress: (ctx) => ctx.coi?.registeredAddress || '',
  incorporationDate: (ctx) => ctx.coi?.incorporationDate || '',
  incorporationNumber: (ctx) => ctx.coi?.cinNumber || '',
  
  // Signatories
  authorisedSignatoryName: (ctx) => ctx.coi?.signatories?.[0]?.name || '',
  authorisedSignatoryDesignation: (ctx) => ctx.coi?.signatories?.[0]?.designation || '',
  designatedPersonName: (ctx) => ctx.coi?.signatories?.[0]?.name || '[Authorized Signatory Name]',
  designatedPersonDesignation: (ctx) => ctx.coi?.signatories?.[0]?.designation || '[Designation]',
};
