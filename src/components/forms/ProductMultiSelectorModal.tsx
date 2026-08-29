"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, X, Check, Search, AlertCircle } from "lucide-react";

type ProductShort = { _id: string; name: string; deviceType: string; hasDMF?: boolean; hasPMF?: boolean; };

interface ProductMultiSelectorModalProps {
  formTitle: string;
  onClose: () => void;
  onContinue: (payload: { productIds: string[] }) => void;
  generating: boolean;
  isMultiSelect?: boolean;
  requiresPmf?: boolean;
  requiresDmf?: boolean;
}

export function ProductMultiSelectorModal({ 
  formTitle, onClose, onContinue, generating, isMultiSelect = true, requiresPmf, requiresDmf 
}: ProductMultiSelectorModalProps) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductShort[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        if (data.products) setProducts(data.products);
        setLoadingProducts(false);
      })
      .catch(() => setLoadingProducts(false));
  }, []);

  const handleToggle = (id: string) => {
    if (isMultiSelect) {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    } else {
      setSelectedIds([id]);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-border/50 flex items-center justify-between bg-surface/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold">Select Products</h2>
            <p className="text-sm text-muted mt-1">Select the devices you want to include in {formTitle}.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface2 rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {loadingProducts ? (
            <div className="flex items-center justify-center py-12 text-muted">
               <svg className="animate-spin h-6 w-6 text-[var(--accent)] mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               <span className="font-medium">Loading your products...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--accent)]">
                <Box className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold mb-2">No Products Found</h3>
              <p className="text-sm text-muted mb-6">You need to create a product first before generating {formTitle}.</p>
              <button onClick={() => router.push('/dashboard/products')} className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-[var(--accent)]/30">
                Create Product
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-surface2 border border-border rounded-xl focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all text-sm" 
                />
              </div>
              
              {filteredProducts.map(p => {
                const isMissingPmf = requiresPmf && !p.hasPMF;
                const isMissingDmf = requiresDmf && !p.hasDMF;
                const isDisabled = isMissingPmf || isMissingDmf;
                
                const isSelected = !isDisabled && selectedIds.includes(p._id);
                
                return (
                  <button
                    key={p._id}
                    onClick={() => !isDisabled && handleToggle(p._id)}
                    disabled={isDisabled}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group 
                      ${isDisabled ? 'opacity-60 bg-surface/30 border-border cursor-not-allowed' : 
                        isSelected ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-md shadow-[var(--accent)]/5' : 
                        'border-border hover:border-muted-foreground/30 bg-surface'
                      }`}
                  >
                    <div>
                      <h4 className={`font-bold ${isSelected ? 'text-[var(--accent)]' : isDisabled ? 'text-muted-foreground' : 'text-foreground'}`}>{p.name}</h4>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-xs text-muted uppercase tracking-wider font-semibold">Type: {p.deviceType === 'ivd' ? 'IVD' : 'Medical Device'}</p>
                        
                        {isDisabled && (
                          <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3" />
                            Missing {isMissingPmf && isMissingDmf ? 'PMF & DMF' : isMissingPmf ? 'PMF' : 'DMF'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors 
                      ${isDisabled ? 'border-border bg-surface2' : 
                        isSelected ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 
                        'border-border group-hover:border-muted-foreground/40'
                      }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-border/50 bg-surface/50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors rounded-xl">
            Cancel
          </button>
          <button 
            onClick={() => onContinue({ productIds: selectedIds })}
            disabled={selectedIds.length === 0 || generating}
            className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-muted disabled:text-muted-foreground text-white font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-[var(--accent)]/30 disabled:shadow-none flex items-center gap-2"
          >
            {generating ? 'Generating...' : `Generate Application (${selectedIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
