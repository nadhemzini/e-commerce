'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { debounce, formatPrice, placeholderImage } from '@/lib/utils';
import api from '@/lib/axios';

interface Suggestion {
  id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
}

interface SearchBarProps {
  className?: string;
  onSearch?: (q: string) => void;
  defaultValue?: string;
}

export function SearchBar({ className, onSearch, defaultValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced autocomplete fetch (300ms)
  const fetchSuggestions = debounce(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await api.get(`/api/products/search/autocomplete?q=${encodeURIComponent(q)}`);
      setSuggestions(data.data || []);
      setIsOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  useEffect(() => {
    fetchSuggestions(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    if (onSearch) {
      onSearch(query.trim());
    } else {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    onSearch?.('');
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} role="search">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            id="search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            placeholder="Rechercher des produits..."
            className="input pl-10 pr-10"
            aria-label="Rechercher"
            aria-autocomplete="list"
            aria-controls={isOpen ? 'search-suggestions' : undefined}
            autoComplete="off"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-[var(--text-secondary)]" />}
            {query && !isLoading && (
              <button type="button" onClick={handleClear} aria-label="Effacer">
                <X className="w-4 h-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 z-50
                     bg-[var(--bg-base)] border border-[var(--border)] rounded-xl shadow-lg
                     overflow-hidden animate-slide-down"
        >
          {suggestions.map((s) => (
            <li key={s.id} role="option" aria-selected={false}>
              <Link
                href={`/product/${s.id}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-muted)]
                           transition-colors duration-100 group"
              >
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[var(--bg-muted)] shrink-0">
                  <Image
                    src={s.images?.[0] || placeholderImage(5)}
                    alt={s.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate
                               group-hover:text-accent transition-colors">
                    {s.name}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">{formatPrice(s.price)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
