'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, Grid2X2, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { SearchBar } from '@/components/ui/SearchBar';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Nouveautés' },
  { value: 'popular', label: 'Popularité' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'rating', label: 'Meilleures notes' },
];

const CATEGORIES = [
  { value: '', label: 'Toutes' },
  { value: 'electronics', label: 'Électronique' },
  { value: 'clothing', label: 'Mode' },
  { value: 'books', label: 'Livres' },
  { value: 'home-kitchen', label: 'Maison & Cuisine' },
  { value: 'sports', label: 'Sport' },
];

import { Suspense } from 'react';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1 });
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    inStock: false,
    sort: searchParams.get('sort') || 'newest',
    page: 1,
  });

  const updateFilter = (key: string, value: unknown) =>
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filters.q) p.set('q', filters.q);
      if (filters.category) p.set('category', filters.category);
      if (filters.minPrice) p.set('minPrice', filters.minPrice);
      if (filters.maxPrice) p.set('maxPrice', filters.maxPrice);
      if (filters.rating) p.set('rating', filters.rating);
      if (filters.inStock) p.set('inStock', 'true');
      p.set('sort', filters.sort);
      p.set('page', filters.page.toString());
      p.set('limit', '12');
      const { data } = await api.get(`/api/products?${p.toString()}`);
      setProducts(data.data.products);
      setPagination(data.data.pagination);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
          {filters.q ? `Résultats pour "${filters.q}"` : 'Catalogue'}
          {pagination.total > 0 && (
            <span className="text-base font-normal text-[var(--text-secondary)] ml-2">
              ({pagination.total} produits)
            </span>
          )}
        </h1>
        <SearchBar className="max-w-lg" defaultValue={filters.q}
          onSearch={(q) => updateFilter('q', q)} />
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block shrink-0 w-60 space-y-6">
          <FilterPanel filters={filters} updateFilter={updateFilter} />
        </aside>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <div className="relative z-10 w-72 h-full bg-[var(--bg-base)] p-6 overflow-y-auto shadow-xl animate-slide-down">
              <FilterPanel filters={filters} updateFilter={updateFilter} />
            </div>
          </div>
        )}

        {/* Products */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <button className="lg:hidden btn-outline text-sm flex items-center gap-2"
              onClick={() => setSidebarOpen(true)}>
              <SlidersHorizontal className="w-4 h-4" /> Filtres
            </button>
            <div className="flex items-center gap-3 ml-auto">
              <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}
                className="input py-2 text-sm w-auto" aria-label="Trier par">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="flex border border-[var(--border)] rounded-xl overflow-hidden">
                <button onClick={() => setViewMode('grid')}
                  className={cn('p-2', viewMode === 'grid' ? 'bg-accent text-white' : 'btn-ghost')}>
                  <Grid2X2 className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')}
                  className={cn('p-2', viewMode === 'list' ? 'bg-accent text-white' : 'btn-ghost')}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-medium text-[var(--text-primary)]">Aucun produit trouvé</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Essayez de modifier vos filtres</p>
            </div>
          ) : (
            <div className={cn('grid gap-5',
              viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1')}>
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button onClick={() => updateFilter('page', filters.page - 1)}
                disabled={filters.page <= 1} className="btn-outline p-2">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => updateFilter('page', p)}
                  className={cn('w-9 h-9 rounded-xl text-sm font-medium',
                    p === filters.page ? 'bg-accent text-white' : 'btn-outline')}>
                  {p}
                </button>
              ))}
              <button onClick={() => updateFilter('page', filters.page + 1)}
                disabled={filters.page >= pagination.totalPages} className="btn-outline p-2">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPanel({ filters, updateFilter }: { filters: Record<string, unknown>; updateFilter: (k: string, v: unknown) => void; }) {
  return (
    <>
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Catégorie</h3>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <button key={cat.value} onClick={() => updateFilter('category', cat.value)}
              className={cn('w-full text-left px-3 py-2 rounded-lg text-sm transition-all',
                filters.category === cat.value
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-accent font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]')}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Prix (€)</h3>
        <div className="flex gap-2 items-center">
          <input type="number" placeholder="Min" value={filters.minPrice as string}
            onChange={(e) => updateFilter('minPrice', e.target.value)} className="input py-2 text-sm" min={0} />
          <span className="text-[var(--text-secondary)]">—</span>
          <input type="number" placeholder="Max" value={filters.maxPrice as string}
            onChange={(e) => updateFilter('maxPrice', e.target.value)} className="input py-2 text-sm" min={0} />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Note minimale</h3>
        <div className="space-y-1">
          {[5, 4, 3].map((r) => (
            <button key={r} onClick={() => updateFilter('rating', filters.rating === r.toString() ? '' : r.toString())}
              className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                filters.rating === r.toString() ? 'bg-indigo-50 dark:bg-indigo-900/20 text-accent' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]')}>
              {'★'.repeat(r)}{'☆'.repeat(5 - r)} <span className="text-xs">& +</span>
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input type="checkbox" checked={filters.inStock as boolean}
            onChange={(e) => updateFilter('inStock', e.target.checked)} className="sr-only peer" />
          <div className="w-10 h-6 bg-[var(--bg-muted)] rounded-full peer-checked:bg-accent transition-colors" />
          <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
        </div>
        <span className="text-sm font-medium text-[var(--text-primary)]">En stock uniquement</span>
      </label>
    </>
  );
}

import { Loader2 } from 'lucide-react';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>}>
      <SearchPageContent />
    </Suspense>
  );
}
