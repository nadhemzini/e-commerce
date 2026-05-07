'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ShoppingCart, Heart, Star, ChevronLeft, ChevronRight, Truck, Shield, RotateCcw } from 'lucide-react';
import { StarRating } from '@/components/ui/StarRating';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductDetailSkeleton } from '@/components/ui/Skeleton';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import api from '@/lib/axios';
import { timeAgo, placeholderImage } from '@/lib/utils';

const TABS = ['Description', 'Caractéristiques', 'Livraison'];

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const { isAuthenticated } = useAuthStore();
  const toast = useToastStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pRes, rRes] = await Promise.all([
          api.get(`/api/products/${id}`),
          api.get(`/api/products/${id}/related`),
        ]);
        setProduct(pRes.data.data);
        setRelated(rRes.data.data);
      } catch { toast.error('Produit introuvable'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return (
    <div className="text-center py-32 text-[var(--text-secondary)]">
      <p className="text-4xl mb-4">😕</p>
      <p className="text-lg font-medium">Produit introuvable</p>
    </div>
  );

  const images = product.images?.length ? product.images : [placeholderImage(parseInt(id.slice(-4), 16) % 100)];
  const price = selectedVariant?.price ?? product.price;
  const inStock = (selectedVariant?.stock ?? product.stock) > 0;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      price,
      image: images[0],
      quantity,
      variant: selectedVariant ? { options: selectedVariant.options } : undefined,
    });
    toast.success(`Ajouté au panier !`);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Connectez-vous pour laisser un avis'); return; }
    setSubmitting(true);
    try {
      await api.post(`/api/reviews/product/${id}`, { rating: reviewRating, comment: reviewText });
      toast.success('Avis publié !');
      setReviewText('');
      const { data } = await api.get(`/api/products/${id}`);
      setProduct(data.data);
    } catch { toast.error('Erreur lors de la publication'); }
    finally { setSubmitting(false); }
  };

  // Group variant options by key
  const variantOptionKeys: string[] = product.variants?.length
    ? Array.from(new Set(product.variants.flatMap((v: any) => Object.keys(v.options)))) as string[]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
        {/* ── Image Gallery ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--bg-muted)] group">
            <Image src={images[activeImg]} alt={product.name} fill
              className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="50vw" />
            {images.length > 1 && (
              <>
                <button onClick={() => setActiveImg((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-md hover:scale-110 transition-transform">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setActiveImg((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-md hover:scale-110 transition-transform">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img: string, i: number) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info ───────────────────────────────────────────────── */}
        <div className="space-y-5">
          <div>
            <p className="text-sm text-accent dark:text-accent-dark font-medium mb-1">
              {product.category?.name}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight">
              {product.name}
            </h1>
          </div>

          {product.reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={product.averageRating} size="md" />
              <span className="text-sm text-[var(--text-secondary)]">
                {product.averageRating.toFixed(1)} ({product.reviewCount} avis)
              </span>
            </div>
          )}

          <PriceDisplay price={price} compareAtPrice={product.compareAtPrice} size="xl" />

          {/* Variants */}
          {variantOptionKeys.map((key) => {
            const uniqueValues = Array.from(new Set(product.variants.map((v: any) => v.options[key]))) as string[];
            return (
              <div key={key}>
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-2 capitalize">{key}</p>
                <div className="flex flex-wrap gap-2">
                  {uniqueValues.map((val) => {
                    const variant = product.variants.find((v: any) => v.options[key] === val);
                    const isSelected = selectedVariant?.options[key] === val;
                    return (
                      <button key={val} onClick={() => setSelectedVariant(variant)}
                        disabled={variant?.stock === 0}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all
                          ${isSelected ? 'border-accent bg-accent/10 text-accent' : 'border-[var(--border)] hover:border-accent'}
                          disabled:opacity-40 disabled:cursor-not-allowed`}>
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Quantity + CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center border border-[var(--border)] rounded-xl overflow-hidden">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-3 hover:bg-[var(--bg-muted)] transition-colors font-bold text-lg">−</button>
              <span className="px-4 py-3 font-semibold text-[var(--text-primary)] min-w-[3rem] text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-3 hover:bg-[var(--bg-muted)] transition-colors font-bold text-lg">+</button>
            </div>
            <button onClick={handleAddToCart} disabled={!inStock}
              id="add-to-cart-main"
              className="btn-primary flex-1 text-base py-3 gap-2 disabled:opacity-50">
              <ShoppingCart className="w-5 h-5" />
              {inStock ? 'Ajouter au panier' : 'Rupture de stock'}
            </button>
          </div>

          {/* Perks */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: <Truck className="w-4 h-4" />, text: 'Livraison 24h' },
              { icon: <Shield className="w-4 h-4" />, text: 'Paiement sécurisé' },
              { icon: <RotateCcw className="w-4 h-4" />, text: 'Retour 30 jours' },
            ].map((p) => (
              <div key={p.text} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[var(--bg-surface)] text-center">
                <span className="text-accent dark:text-accent-dark">{p.icon}</span>
                <span className="text-xs text-[var(--text-secondary)] font-medium">{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="mt-14">
        <div className="flex border-b border-[var(--border)] gap-1 mb-6">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px
                ${activeTab === i ? 'border-accent text-accent dark:text-accent-dark' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="text-[var(--text-secondary)] leading-relaxed max-w-3xl">
          {activeTab === 0 && <p>{product.description}</p>}
          {activeTab === 1 && (
            <ul className="space-y-2">
              {[['Référence', product.id.slice(0, 8).toUpperCase()], ['Catégorie', product.category?.name || 'N/A'],
                ['Stock', `${product.stock} unités`], ['Note', `${product.averageRating.toFixed(1)}/5`]].map(([k, v]) => (
                <li key={k} className="flex gap-4 py-2 border-b border-[var(--border)] last:border-0">
                  <span className="font-medium text-[var(--text-primary)] w-32 shrink-0">{k}</span>
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          )}
          {activeTab === 2 && (
            <div className="space-y-3">
              <p>📦 <strong>Standard</strong> — 3-5 jours ouvrés · 4,99 €</p>
              <p>🚀 <strong>Express</strong> — 1-2 jours ouvrés · 9,99 €</p>
              <p>⚡ <strong>Overnight</strong> — Le lendemain avant 10h · 19,99 €</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Reviews ───────────────────────────────────────────────────────── */}
      <div className="mt-14 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
            Avis clients ({product.reviewCount})
          </h2>
          {product.reviews?.length === 0 ? (
            <p className="text-[var(--text-secondary)]">Aucun avis pour le moment.</p>
          ) : (
            <div className="space-y-5">
              {product.reviews?.map((review: any) => (
                <div key={review.id} className="card p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[var(--text-primary)] text-sm">
                      {review.user.firstName || 'Anonyme'} {review.user.lastName?.[0]}.
                    </p>
                    <span className="text-xs text-[var(--text-secondary)]">{timeAgo(review.createdAt)}</span>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                  {review.comment && <p className="text-sm text-[var(--text-secondary)]">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review form */}
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Laisser un avis</h3>
          <form onSubmit={handleReviewSubmit} className="card p-5 space-y-4">
            <div>
              <label className="label">Note</label>
              <StarRating rating={reviewRating} interactive onChange={setReviewRating} size="lg" />
            </div>
            <div>
              <label className="label" htmlFor="review-comment">Commentaire</label>
              <textarea id="review-comment" value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                rows={4} className="input resize-none" placeholder="Partagez votre expérience..." />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Publication...' : 'Publier mon avis'}
            </button>
            {!isAuthenticated && (
              <p className="text-xs text-[var(--text-secondary)] text-center">
                Vous devez être connecté pour laisser un avis.
              </p>
            )}
          </form>
        </div>
      </div>

      {/* ── Related Products ──────────────────────────────────────────────── */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Produits similaires</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
