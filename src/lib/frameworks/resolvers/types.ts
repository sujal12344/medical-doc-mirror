export interface ResolverContext {
  coi?: any;
  company?: any;
  products: any[];
  techDocs: any[]; // PMFs, DMFs
  doc: any; // The main form document
  userId: string;
}

export type ResolverFn = (ctx: ResolverContext) => string | any[];
