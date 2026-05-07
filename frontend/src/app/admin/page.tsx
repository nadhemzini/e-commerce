'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Users, ShoppingBag, TrendingUp, Plus, Edit, Trash2, X } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { PageLoader } from '@/components/ui/Skeleton';
import { formatPrice, timeAgo } from '@/lib/utils';
import api from '@/lib/axios';

const STATUS_OPTIONS = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED'];

const EMPTY_FORM = { name: '', description: '', price: '', compareAtPrice: '', stock: '', categoryId: '', images: '', isFeatured: false };

export default function AdminPage() {
  const { user, isAuthenticated } = useAuthStore();
  const toast = useToastStore();
  const router = useRouter();
  const [tab, setTab] = useState<'overview'|'products'|'orders'|'users'>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ orders: 0, products: 0, users: 0, revenue: 0 });
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (user?.role !== 'ADMIN') { router.push('/account'); return; }
    fetchAll();
  }, [isAuthenticated, user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, oRes, uRes, cRes] = await Promise.all([
        api.get('/api/products?limit=50'),
        api.get('/api/orders/admin/all'),
        api.get('/api/users'),
        api.get('/api/categories'),
      ]);
      const prods = pRes.data.data.products;
      const ords = oRes.data.data;
      const usrs = uRes.data.data;
      setProducts(prods);
      setOrders(ords);
      setUsers(usrs);
      setCategories(cRes.data.data || []);
      setStats({
        products: prods.length,
        orders: ords.length,
        users: usrs.length,
        revenue: ords.filter((o: any) => o.status !== 'CANCELLED').reduce((s: number, o: any) => s + o.total, 0),
      });
    } catch {}
    finally { setLoading(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      toast.success('Produit supprimé');
      fetchAll();
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  const handleOrderStatus = async (id: string, status: string) => {
    try {
      await api.put(`/api/orders/admin/${id}/status`, { status });
      toast.success('Statut mis à jour');
      fetchAll();
    } catch { toast.error('Erreur mise à jour'); }
  };

  const handleToggleUser = async (id: string) => {
    try {
      await api.put(`/api/users/${id}/status`);
      toast.success('Statut utilisateur mis à jour');
      fetchAll();
    } catch { toast.error('Erreur'); }
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (p: any) => {
    setEditingId(p.id);
    setForm({
      name: p.name || '',
      description: p.description || '',
      price: p.price?.toString() || '',
      compareAtPrice: p.compareAtPrice?.toString() || '',
      stock: p.stock?.toString() || '',
      categoryId: p.categoryId || p.category?.id || '',
      images: (p.images || []).join(', '),
      isFeatured: p.isFeatured || false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const imagesArr = form.images.split(',').map(s => s.trim()).filter(Boolean);
      const payload: any = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        categoryId: form.categoryId,
        images: imagesArr,
        isFeatured: form.isFeatured,
      };
      if (form.compareAtPrice) payload.compareAtPrice = parseFloat(form.compareAtPrice);

      if (editingId) {
        await api.put(`/api/products/${editingId}`, payload);
        toast.success('Produit mis à jour !');
      } else {
        await api.post('/api/products', payload);
        toast.success('Produit créé !');
      }
      setShowModal(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;

  const KPI = [
    { label: 'Chiffre d\'affaires', value: formatPrice(stats.revenue), icon: <TrendingUp className="w-6 h-6" />, color: 'from-violet-500 to-indigo-600' },
    { label: 'Commandes', value: stats.orders.toString(), icon: <ShoppingBag className="w-6 h-6" />, color: 'from-blue-500 to-cyan-600' },
    { label: 'Clients', value: stats.users.toString(), icon: <Users className="w-6 h-6" />, color: 'from-emerald-500 to-teal-600' },
    { label: 'Produits', value: stats.products.toString(), icon: <Package className="w-6 h-6" />, color: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard Admin</h1>
          <p className="text-sm text-[var(--text-secondary)]">Bienvenue, {user?.firstName || 'Admin'} 👋</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {KPI.map((k) => (
          <div key={k.label} className={`rounded-2xl bg-gradient-to-br ${k.color} p-5 text-white`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-xl">{k.icon}</div>
            </div>
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-sm opacity-80 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] gap-1 mb-6">
        {(['overview','products','orders','users'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px capitalize transition-all
              ${tab === t ? 'border-accent text-accent' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            {t === 'overview' ? 'Vue d\'ensemble' : t === 'products' ? 'Produits' : t === 'orders' ? 'Commandes' : 'Utilisateurs'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Dernières commandes</h3>
            <div className="space-y-3">
              {orders.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">#{o.id.slice(0,8).toUpperCase()}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{o.user?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[var(--text-primary)]">{formatPrice(o.total)}</p>
                    <span className="badge badge-muted text-xs">{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Produits populaires</h3>
            <div className="space-y-3">
              {products.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <p className="font-medium text-[var(--text-primary)] truncate flex-1">{p.name}</p>
                  <div className="text-right ml-4">
                    <p className="font-bold">{formatPrice(p.price)}</p>
                    <p className="text-xs text-[var(--text-secondary)]">Stock: {p.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products */}
      {tab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-[var(--text-secondary)]">{products.length} produits</p>
            <button onClick={openAddModal} className="btn-primary text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
                  <tr>{['Produit','Catégorie','Prix','Stock','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--bg-surface)] transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)] max-w-[200px] truncate">{p.name}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{p.category?.name}</td>
                      <td className="px-4 py-3 font-bold">{formatPrice(p.price)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${p.stock > 0 ? 'badge-success' : 'badge-error'}`}>{p.stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEditModal(p)} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] text-accent" aria-label="Éditer">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-error" aria-label="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Orders */}
      {tab === 'orders' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
                <tr>{['Commande','Client','Total','Date','Statut'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[var(--bg-surface)] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">#{o.id.slice(0,8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{o.user?.email}</td>
                    <td className="px-4 py-3 font-bold">{formatPrice(o.total)}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">{timeAgo(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <select value={o.status} onChange={(e) => handleOrderStatus(o.id, e.target.value)}
                        className="input py-1 text-xs w-auto">
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
                <tr>{['Utilisateur','Rôle','Inscrit','Statut','Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--bg-surface)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)]">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{u.email}</p>
                    </td>
                    <td className="px-4 py-3"><span className={`badge ${u.role === 'ADMIN' ? 'badge-accent' : 'badge-muted'}`}>{u.role}</span></td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">{timeAgo(u.createdAt)}</td>
                    <td className="px-4 py-3"><span className={`badge ${u.isActive ? 'badge-success' : 'badge-error'}`}>{u.isActive ? 'Actif' : 'Inactif'}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleUser(u.id)}
                        className={`btn text-xs py-1 px-3 ${u.isActive ? 'btn-danger' : 'btn-secondary'}`}>
                        {u.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Product Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-primary)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {editingId ? 'Modifier le produit' : 'Ajouter un produit'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nom *</label>
                <input className="input w-full" required value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})} placeholder="Nom du produit" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description *</label>
                <textarea className="input w-full" rows={3} required value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})} placeholder="Description du produit" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Prix (€) *</label>
                  <input className="input w-full" type="number" step="0.01" min="0" required value={form.price}
                    onChange={e => setForm({...form, price: e.target.value})} placeholder="29.99" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Ancien prix (€)</label>
                  <input className="input w-full" type="number" step="0.01" min="0" value={form.compareAtPrice}
                    onChange={e => setForm({...form, compareAtPrice: e.target.value})} placeholder="39.99" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Stock *</label>
                  <input className="input w-full" type="number" min="0" required value={form.stock}
                    onChange={e => setForm({...form, stock: e.target.value})} placeholder="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Catégorie *</label>
                  <select className="input w-full" required value={form.categoryId}
                    onChange={e => setForm({...form, categoryId: e.target.value})}>
                    <option value="">Sélectionner...</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Images (URLs séparées par des virgules)</label>
                <input className="input w-full" value={form.images}
                  onChange={e => setForm({...form, images: e.target.value})}
                  placeholder="https://picsum.photos/600/600, https://..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isFeatured" checked={form.isFeatured}
                  onChange={e => setForm({...form, isFeatured: e.target.checked})}
                  className="w-4 h-4 rounded border-[var(--border)]" />
                <label htmlFor="isFeatured" className="text-sm text-[var(--text-primary)]">Produit vedette (affiché en page d&apos;accueil)</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={submitting}
                  className="btn-primary flex-1 disabled:opacity-50">
                  {submitting ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer le produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
