'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Zap, Shield, Truck, Star } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { SearchBar } from '@/components/ui/SearchBar';
import api from '@/lib/axios';
import { placeholderImage } from '@/lib/utils';

const categories = [
  { name: 'Électronique', slug: 'electronics', icon: '⚡', color: 'from-violet-500 to-indigo-600', seed: 20 },
  { name: 'Mode', slug: 'clothing', icon: '👗', color: 'from-pink-500 to-rose-600', seed: 30 },
  { name: 'Livres', slug: 'books', icon: '📚', color: 'from-amber-500 to-orange-600', seed: 40 },
  { name: 'Maison', slug: 'home-kitchen', icon: '🏠', color: 'from-emerald-500 to-teal-600', seed: 50 },
  { name: 'Sport', slug: 'sports', icon: '🏋️', color: 'from-blue-500 to-cyan-600', seed: 60 },
];

const perks = [
  { icon: <Truck className="w-6 h-6" />, title: 'Livraison rapide', desc: 'Expédié sous 24h ouvrées' },
  { icon: <Shield className="w-6 h-6" />, title: 'Paiement sécurisé', desc: 'Crypté SSL + Stripe' },
  { icon: <Star className="w-6 h-6" />, title: 'Qualité garantie', desc: 'Satisfaction ou remboursé' },
  { icon: <Zap className="w-6 h-6" />, title: 'Support 7j/7', desc: 'Réponse en moins de 4h' },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [newest, setNewest] = useState<any[]>([]);
  const [bestsellers, setBestsellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [featuredRes, newestRes, bestsellersRes] = await Promise.all([
          api.get('/api/products?limit=8&sort=rating'),
          api.get('/api/products?limit=4&sort=newest'),
          api.get('/api/products?limit=4&sort=popular'),
        ]);
        setFeatured(featuredRes.data.data.products);
        setNewest(newestRes.data.data.products);
        setBestsellers(bestsellersRes.data.data.products);
      } catch {
        // Use placeholder data if API not available
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0F0F0F] via-[#1A1A2E] to-[#0F0F0F] text-white">
        {/* Background blobs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(245,166,35,0.18)' }} />
        <div className="absolute -bottom-20 right-10 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(232,148,26,0.12)' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="badge mb-6 text-sm px-3 py-1" style={{ background: 'rgba(245,166,35,0.18)', border: '1px solid rgba(245,166,35,0.35)', color: '#F5A623' }}>
              ✨ Nouvelle collection 2026
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Découvrez vos{' '}
              <span className="bg-gradient-to-r from-[#F5A623] via-[#E8941A] to-[#F5C842] bg-clip-text text-transparent">
                produits préférés
              </span>{' '}
              à prix imbattables
            </h1>
            <p className="text-lg text-slate-300 mb-8 max-w-xl leading-relaxed">
              Des milliers de produits soigneusement sélectionnés, livrés rapidement chez vous.
              Qualité premium, prix accessibles.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link href="/search" className="btn-primary text-base px-6 py-3 gap-2">
                Explorer le catalogue <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/search?sort=popular" className="btn bg-white/10 border border-white/20 hover:bg-white/20 text-white text-base px-6 py-3">
                Meilleures ventes
              </Link>
            </div>

            {/* Hero Search */}
            <div className="max-w-lg">
              <SearchBar className="w-full" />
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-white/10 bg-white/5">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap justify-center gap-x-12 gap-y-2">
            {[
              { label: 'Produits', value: '50 000+' },
              { label: 'Clients satisfaits', value: '250 000+' },
              { label: 'Note moyenne', value: '4.8 ★' },
              { label: 'Livraisons/jour', value: '5 000+' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">Catégories</h2>
          <Link href="/search" className="text-sm text-accent dark:text-accent-dark font-medium hover:underline flex items-center gap-1">
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/search?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl aspect-square"
            >
              <Image
                src={placeholderImage(cat.seed, 300, 300)}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-70 group-hover:opacity-80 transition-opacity`} />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-3">
                <span className="text-3xl mb-1">{cat.icon}</span>
                <span className="text-sm font-bold text-center leading-tight">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ─────────────────────────────────────────────── */}
      <section className="bg-[var(--bg-surface)] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">Produits Vedettes</h2>
              <p className="text-[var(--text-secondary)] text-sm mt-1">Sélectionnés par notre équipe</p>
            </div>
            <Link href="/search?sort=rating" className="text-sm text-accent dark:text-accent-dark font-medium hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* ── NOUVEAUTÉS + BESTSELLERS ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Nouveautés */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">🆕 Nouveautés</h2>
              <Link href="/search?sort=newest" className="text-sm text-accent dark:text-accent-dark hover:underline">
                Voir tout
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : newest.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
          {/* Bestsellers */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">🔥 Meilleures Ventes</h2>
              <Link href="/search?sort=popular" className="text-sm text-accent dark:text-accent-dark hover:underline">
                Voir tout
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : bestsellers.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── PERKS BANNER ──────────────────────────────────────────────────── */}
      <section className="bg-[var(--bg-surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {perks.map((perk) => (
              <div key={perk.title} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#0F0F0F]" style={{ background: 'linear-gradient(135deg, #F5A623 0%, #E8941A 100%)' }}>
                  {perk.icon}
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)] text-sm">{perk.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
