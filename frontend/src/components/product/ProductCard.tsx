'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { StarRating } from '@/components/ui/StarRating';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { useCartStore } from '@/store/useCartStore';
import { useToastStore } from '@/store/useToastStore';
import { placeholderImage, truncate } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  averageRating: number;
  reviewCount: number;
  stock: number;
  category?: { name: string };
}

interface ProductCardProps {
  product: Product;
  onWishlist?: (id: string) => void;
}

export function ProductCard({ product, onWishlist }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const toast = useToastStore();

  const image = product.images?.[0] || placeholderImage(parseInt(product.id.slice(-4), 16) % 100);
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image,
      quantity: 1,
    });
    toast.success(`"${truncate(product.name, 30)}" ajouté au panier`);
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className="group card-hover block overflow-hidden focus-visible:ring-2 focus-visible:ring-accent"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[var(--bg-muted)]">
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="badge badge-success text-xs">
              -{Math.round((1 - product.price / product.compareAtPrice) * 100)}%
            </span>
          )}
          {isOutOfStock && (
            <span className="badge badge-error text-xs">Rupture</span>
          )}
        </div>

        {/* Wishlist button */}
        {onWishlist && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onWishlist(product.id);
            }}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80
                       text-[var(--text-secondary)] hover:text-error dark:hover:text-error-dark
                       opacity-0 group-hover:opacity-100 transition-all duration-150"
            aria-label="Ajouter à la wishlist"
          >
            <Heart className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {product.category && (
          <p className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wide">
            {product.category.name}
          </p>
        )}
        <h3 className="text-sm font-semibold text-[var(--text-primary)] leading-snug
                       group-hover:text-accent dark:group-hover:text-accent-dark
                       transition-colors duration-150 line-clamp-2">
          {product.name}
        </h3>

        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating rating={product.averageRating} size="sm" />
            <span className="text-xs text-[var(--text-secondary)]">({product.reviewCount})</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} size="sm" showBadge={false} />

          <button
            id={`add-to-cart-${product.id}`}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="p-2 rounded-xl bg-accent hover:bg-accent-hover text-white
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-150 hover:scale-105 active:scale-95"
            aria-label={`Ajouter ${product.name} au panier`}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
