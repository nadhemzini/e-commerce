'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShoppingCart, Search, User, Menu, X, Package } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import { CartDrawer } from '@/components/cart/CartDrawer';

const navLinks = [
  { href: '/search', label: 'Catalogue' },
  { href: '/search?category=electronics', label: 'Électronique' },
  { href: '/search?category=clothing', label: 'Mode' },
  { href: '/search?category=home-kitchen', label: 'Maison' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center
                              group-hover:scale-110 transition-transform duration-150">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-[var(--text-primary)]">
                Shop<span className="text-accent dark:text-accent-dark">Vault</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg text-[var(--text-secondary)]
                             hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]
                             transition-all duration-150"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <Link
                href="/search"
                className="btn-ghost p-2 rounded-xl"
                aria-label="Rechercher"
              >
                <Search className="w-5 h-5" />
              </Link>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Auth */}
              <Link
                href={isAuthenticated ? '/account' : '/auth/login'}
                className="btn-ghost p-2 rounded-xl"
                aria-label={isAuthenticated ? 'Mon compte' : 'Connexion'}
              >
                {isMounted && user?.role === 'ADMIN' ? (
                  <span className="relative">
                    <User className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full" />
                  </span>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </Link>

              {/* Cart */}
              <button
                id="cart-btn"
                onClick={toggleCart}
                className="btn-ghost p-2 rounded-xl relative"
                aria-label={`Panier (${isMounted ? totalItems : 0} articles)`}
              >
                <ShoppingCart className="w-5 h-5" />
                {isMounted && totalItems > 0 && (
                  <span
                    className={cn(
                      'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1',
                      'bg-accent dark:bg-accent-dark text-white rounded-full',
                      'flex items-center justify-center text-[10px] font-bold',
                      'animate-fade-in'
                    )}
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>

              {/* Mobile menu */}
              <button
                className="md:hidden btn-ghost p-2 rounded-xl"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg-surface)] animate-slide-down">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium rounded-xl text-[var(--text-secondary)]
                             hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]
                             transition-all duration-150"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-[var(--border)]">
                <Link
                  href={user?.role === 'ADMIN' ? '/admin' : '/account'}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium rounded-xl text-[var(--text-secondary)]
                             hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]
                             flex items-center gap-2 transition-all duration-150"
                >
                  <User className="w-4 h-4" />
                  {isAuthenticated
                    ? user?.role === 'ADMIN'
                      ? 'Dashboard Admin'
                      : 'Mon Compte'
                    : 'Connexion'}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <CartDrawer />
    </>
  );
}
