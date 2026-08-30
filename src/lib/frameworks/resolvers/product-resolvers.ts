import { ResolverContext, ResolverFn } from "./types";

/**
 * Resolvers that extract data from selected Products and their Technical Docs (DMF)
 */
export const productResolvers: Record<string, ResolverFn> = {
  deviceGenericName: (ctx) => Array.from(new Set(ctx.products.map(p => p.genericName || p.name).filter(Boolean))).join(', '),
  deviceModelOrType: (ctx) => Array.from(new Set(ctx.products.map(p => p.modelNo).filter(Boolean))).join(', '),
  deviceClass: (ctx) => Array.from(new Set(ctx.products.map(p => p.deviceClass).filter(Boolean))).join(', '),
  intendedUse: (ctx) => Array.from(new Set(ctx.products.map(p => p.intendedUse).filter(Boolean))).join(', '),
  deviceScopeSummary: (ctx) => Array.from(new Set(ctx.products.map(p => p.intendedUse || p.name).filter(Boolean))).join('; '),

  // --- Dynamic Loops ---
  devices: (ctx) => ctx.products.map((p, i) => ({
    sn: i + 1,
    genericName: p.genericName || p.name || 'N/A',
    intendedUse: p.intendedUse || 'N/A',
    deviceClass: p.deviceClass || 'N/A',
    modelNo: p.modelNo || 'N/A',
  })),
  annexureProducts: (ctx) => ctx.products.map((p, i) => ({
    sn: i + 1,
    genericName: p.name || "N/A",
    modelNo: p.modelNo || "N/A",
    intendedUse: p.intendedUse || "N/A",
    deviceClass: p.deviceClass || "N/A",
    material: p.material || "N/A",
    dimension: p.dimension || "N/A",
    shelfLife: p.shelfLife || "N/A",
    sterile: p.sterile ? "Sterile" : "Non-sterile",
    brandName: p.brandName || "N/A"
  }))
};
