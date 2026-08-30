import { ResolverContext, ResolverFn } from "./types";

/**
 * Resolvers that provide smart defaults and common derivations
 */
export const defaultResolvers: Record<string, ResolverFn> = {
  applicationPlace: (ctx) => {
    if (ctx.coi?.registeredAddress) {
       const parts = ctx.coi.registeredAddress.split(',');
       if (parts.length > 0) {
           // Heuristic to get city: often the 2nd or 3rd to last item, or just take the first if it's short
           // Let's just return a generic empty string if we can't confidently extract a city
           return "";
       }
    }
    return "";
  },
  applicationDate: () => {
    const today = new Date();
    return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  }
};
