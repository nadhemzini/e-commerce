'use client';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { formatPrice, placeholderImage } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } = useCartStore();
  const total = totalPrice();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={closeCart}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-label="Panier"
        aria-modal
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-sm flex flex-col',
          'bg-[var(--bg-base)] border-l border-[var(--border)] shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-accent dark:text-accent-dark" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Mon Panier{' '}
              <span className="text-[var(--text-secondary)] font-normal">
                ({items.length})
              </span>
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="btn-ghost p-1.5 rounded-lg"
            aria-label="Fermer le panier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag className="w-16 h-16 text-[var(--border)]" />
              <p className="text-[var(--text-secondary)] font-medium">Votre panier est vide</p>
              <button onClick={closeCart} className="btn-primary">
                Continuer mes achats
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 py-3 border-b border-[var(--border)] last:border-0"
              >
                {/* Image */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[var(--bg-muted)] shrink-0">
                  <Image
                    src={item.image || placeholderImage(10)}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {item.name}
                  </p>
                  {item.variant?.options && (
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {Object.values(item.variant.options).join(', ')}
                    </p>
                  )}
                  <p className="text-sm font-bold text-accent dark:text-accent-dark mt-1">
                    {formatPrice(item.price * item.quantity)}
                  </p>

                  {/* Quantity */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                      className="w-7 h-7 rounded-lg border border-[var(--border)] flex items-center justify-center
                                 hover:bg-[var(--bg-muted)] transition-colors"
                      aria-label="Diminuer la quantité"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                      className="w-7 h-7 rounded-lg border border-[var(--border)] flex items-center justify-center
                                 hover:bg-[var(--bg-muted)] transition-colors"
                      aria-label="Augmenter la quantité"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="text-[var(--text-secondary)] hover:text-error dark:hover:text-error-dark
                             transition-colors p-1 h-fit"
                  aria-label="Supprimer cet article"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between text-[var(--text-secondary)] text-sm">
              <span>Sous-total</span>
              <span className="font-semibold text-[var(--text-primary)]">{formatPrice(total)}</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Livraison calculée au moment du paiement
            </p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-primary w-full justify-center gap-2"
              id="checkout-btn"
            >
              Passer la commande
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/cart"
              onClick={closeCart}
              className="btn-outline w-full justify-center text-sm"
            >
              Voir le panier
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
