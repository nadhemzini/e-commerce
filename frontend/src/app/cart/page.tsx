'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { formatPrice, placeholderImage } from '@/lib/utils';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCartStore();
  const total = totalPrice();
  const shipping = total > 50 ? 0 : 4.99;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingBag className="w-20 h-20 mx-auto text-[var(--border)] mb-6" />
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Votre panier est vide</h1>
        <p className="text-[var(--text-secondary)] mb-8">Découvrez nos produits et commencez à faire vos emplettes.</p>
        <Link href="/search" className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2">
          Voir le catalogue <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Mon Panier <span className="text-[var(--text-secondary)] font-normal text-lg">({items.length})</span>
        </h1>
        <button onClick={clearCart} className="text-sm text-error hover:underline">Vider</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="card p-5 flex gap-4">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[var(--bg-muted)] shrink-0">
                <Image src={item.image || placeholderImage(10)} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/product/${item.productId}`}
                    className="font-semibold text-[var(--text-primary)] hover:text-accent transition-colors line-clamp-2 text-sm">
                    {item.name}
                  </Link>
                  <button onClick={() => removeItem(item.productId, item.variantId)}
                    className="text-[var(--text-secondary)] hover:text-error p-1 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-[var(--border)] rounded-xl overflow-hidden">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                      className="px-3 py-2 hover:bg-[var(--bg-muted)] transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-4 py-2 text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                      className="px-3 py-2 hover:bg-[var(--bg-muted)] transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <PriceDisplay price={item.price * item.quantity} size="md" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card p-6 space-y-4 h-fit">
          <h2 className="font-bold text-lg text-[var(--text-primary)]">Résumé</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Sous-total</span>
              <span className="font-medium text-[var(--text-primary)]">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Livraison</span>
              <span className={shipping === 0 ? 'text-success font-medium' : 'font-medium text-[var(--text-primary)]'}>
                {shipping === 0 ? 'Gratuite' : formatPrice(shipping)}
              </span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-muted)] p-2 rounded-lg">
                🎁 Plus que {formatPrice(50 - total)} pour la livraison gratuite
              </p>
            )}
            <div className="border-t border-[var(--border)] pt-3 flex justify-between font-bold text-[var(--text-primary)]">
              <span>Total</span><span>{formatPrice(total + shipping)}</span>
            </div>
          </div>
          <Link href="/checkout" id="go-checkout-btn"
            className="btn-primary w-full justify-center text-base py-3 gap-2">
            Commander <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/search" className="btn-outline w-full justify-center text-sm">
            Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  );
}
