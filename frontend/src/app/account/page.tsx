'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Package, Heart, MapPin, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { PageLoader } from '@/components/ui/Skeleton';
import { formatPrice, timeAgo } from '@/lib/utils';
import api from '@/lib/axios';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'badge-muted', CONFIRMED: 'badge-accent', PROCESSING: 'badge-accent',
  SHIPPED: 'badge-success', DELIVERED: 'badge-success', CANCELLED: 'badge-error', REFUNDED: 'badge-error',
};

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const toast = useToastStore();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [tab, setTab] = useState<'orders' | 'wishlist' | 'profile'>('orders');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    const fetchData = async () => {
      try {
        const [oRes, wRes] = await Promise.all([
          api.get('/api/orders'),
          api.get('/api/wishlist'),
        ]);
        setOrders(oRes.data.data);
        setWishlist(wRes.data.data?.items || []);
      } catch {}
      finally { setLoading(false); }
    };
    fetchData();
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    toast.info('Déconnexion réussie');
    router.push('/');
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl">
            {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Mon Compte'}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">{user?.email}</p>
          </div>
        </div>
        {user?.role === 'ADMIN' && (
          <Link href="/admin" className="btn-outline text-sm flex items-center gap-2">
            Dashboard Admin <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] gap-1 mb-8">
        {([
          { key: 'orders', label: 'Commandes', icon: <Package className="w-4 h-4" /> },
          { key: 'wishlist', label: 'Wishlist', icon: <Heart className="w-4 h-4" /> },
          { key: 'profile', label: 'Profil', icon: <User className="w-4 h-4" /> },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-all
              ${tab === t.key ? 'border-accent text-accent' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16 text-[var(--text-secondary)]">
              <Package className="w-16 h-16 mx-auto text-[var(--border)] mb-4" />
              <p className="font-medium">Aucune commande</p>
              <Link href="/search" className="btn-primary mt-4 inline-flex">Commencer mes achats</Link>
            </div>
          ) : orders.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-[var(--text-primary)] text-sm">
                    Commande #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">{timeAgo(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${STATUS_COLORS[order.status] || 'badge-muted'}`}>{order.status}</span>
                  <p className="font-bold text-[var(--text-primary)]">{formatPrice(order.total)}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {order.items?.slice(0, 3).map((item: any) => (
                  <span key={item.id} className="text-xs bg-[var(--bg-muted)] text-[var(--text-secondary)] px-2 py-1 rounded-lg">
                    {item.product?.name || 'Produit'} × {item.quantity}
                  </span>
                ))}
                {order.items?.length > 3 && (
                  <span className="text-xs text-[var(--text-secondary)]">+{order.items.length - 3} autres</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wishlist Tab */}
      {tab === 'wishlist' && (
        <div>
          {wishlist.length === 0 ? (
            <div className="text-center py-16 text-[var(--text-secondary)]">
              <Heart className="w-16 h-16 mx-auto text-[var(--border)] mb-4" />
              <p className="font-medium">Wishlist vide</p>
              <Link href="/search" className="btn-primary mt-4 inline-flex">Découvrir des produits</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {wishlist.map((item: any) => (
                <Link key={item.id} href={`/product/${item.productId}`}
                  className="card-hover p-4 text-center space-y-2">
                  <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-2">{item.product?.name}</p>
                  <p className="text-sm font-bold text-accent">{formatPrice(item.product?.price)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="max-w-md space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-[var(--text-primary)]">Informations personnelles</h2>
            {[
              { label: 'Prénom', value: user?.firstName || '—' },
              { label: 'Nom', value: user?.lastName || '—' },
              { label: 'E-mail', value: user?.email || '—' },
              { label: 'Rôle', value: user?.role || '—' },
            ].map((field) => (
              <div key={field.label} className="flex justify-between text-sm py-2 border-b border-[var(--border)] last:border-0">
                <span className="text-[var(--text-secondary)]">{field.label}</span>
                <span className="font-medium text-[var(--text-primary)]">{field.value}</span>
              </div>
            ))}
          </div>
          <button onClick={handleLogout}
            className="btn-danger w-full py-3 flex items-center justify-center gap-2" id="logout-btn">
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}
