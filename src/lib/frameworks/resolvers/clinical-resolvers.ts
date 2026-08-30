import { ResolverContext, ResolverFn } from "./types";

/**
 * Resolvers that extract data for clinical trials and studies (MD-22)
 */
export const clinicalResolvers: Record<string, ResolverFn> = {
  sites: (ctx) => [
    {
      sn: 1,
      siteNameAddress: ctx.coi?.registeredAddress || "N/A",
      ethicsCommitteeDetails: "[Ethics Committee Details]",
      principalInvestigatorName: "[Principal Investigator]"
    }
  ]
};
