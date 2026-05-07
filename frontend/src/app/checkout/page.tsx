'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import { useCartStore } from '@/store/useCartStore';
import { useToastStore } from '@/store/useToastStore';
import { getStripe } from '@/lib/stripe';
import { formatPrice } from '@/lib/utils';
import api from '@/lib/axios';
import { Spinner } from '@/components/ui/Skeleton';

const STEPS = [
  { id: 1, label: 'Livraison' },
  { id: 2, label: 'Méthode' },
  { id: 3, label: 'Paiement' },
];

const shippingSchema = z.object({
  firstName: z.string().min(1, 'Requis'),
  lastName: z.string().min(1, 'Requis'),
  line1: z.string().min(1, 'Requis'),
  line2: z.string().optional(),
  city: z.string().min(1, 'Requis'),
  postalCode: z.string().min(4, 'Code postal invalide'),
  country: z.string().length(2, 'Code pays 2 lettres (ex: FR)'),
});

type ShippingData = z.infer<typeof shippingSchema>;

const SHIPPING_METHODS = [
  { id: 'standard', label: 'Standard', desc: '3–5 jours ouvrés', price: 4.99 },
  { id: 'express', label: 'Express', desc: '1–2 jours ouvrés', price: 9.99 },
  { id: 'overnight', label: 'Overnight', desc: 'Lendemain avant 10h', price: 19.99 },
];

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState<ShippingData | null>(null);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);

  const { items, totalPrice, clearCart } = useCartStore();
  const toast = useToastStore();
  const total = totalPrice();
  const shippingCost = SHIPPING_METHODS.find(m => m.id === shippingMethod)?.price ?? 4.99;

  const form = useForm<ShippingData>({ resolver: zodResolver(shippingSchema) });

  const handleShippingSubmit = (data: ShippingData) => {
    setShipping(data);
    setStep(2);
  };

  const handleMethodSubmit = async () => {
    if (!shipping) return;
    setLoading(true);
    try {
      const { data } = await api.post('/api/orders', {
        shippingAddress: shipping,
        shippingMethod,
      });
      setClientSecret(data.data.clientSecret);
      setOrderId(data.data.order.id);
      setStep(3);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erreur lors de la commande');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    toast.success('Paiement réussi ! Merci pour votre commande 🎉');
  };

  if (items.length === 0 && step < 3) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-2xl mb-4">🛒</p>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Panier vide</h1>
        <p className="text-[var(--text-secondary)] mt-2">Ajoutez des produits avant de commander.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-8">Tunnel de commande</h1>
      <div className="max-w-md mx-auto mb-10">
        <ProgressStepper steps={STEPS} currentStep={step} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main form */}
        <div className="lg:col-span-2">
          {/* Step 1 - Shipping address */}
          {step === 1 && (
            <form onSubmit={form.handleSubmit(handleShippingSubmit)} className="card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Adresse de livraison</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'firstName', label: 'Prénom', colSpan: 1 },
                  { name: 'lastName', label: 'Nom', colSpan: 1 },
                  { name: 'line1', label: 'Adresse', colSpan: 2 },
                  { name: 'line2', label: 'Complément (optionnel)', colSpan: 2 },
                  { name: 'city', label: 'Ville', colSpan: 1 },
                  { name: 'postalCode', label: 'Code postal', colSpan: 1 },
                  { name: 'country', label: 'Pays (ex: FR)', colSpan: 2 },
                ].map((field) => (
                  <div key={field.name} className={field.colSpan === 2 ? 'col-span-2' : ''}>
                    <label className="label" htmlFor={field.name}>{field.label}</label>
                    <input
                      id={field.name}
                      autoComplete="on"
                      className={`input ${form.formState.errors[field.name as keyof ShippingData] ? 'border-error' : ''}`}
                      {...form.register(field.name as keyof ShippingData)}
                    />
                    {form.formState.errors[field.name as keyof ShippingData] && (
                      <p className="text-xs text-error mt-1">
                        {form.formState.errors[field.name as keyof ShippingData]?.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <button type="submit" className="btn-primary w-full py-3 mt-2">
                Continuer vers la livraison
              </button>
              <p className="text-xs text-center text-[var(--text-secondary)]">
                Vous pouvez commander sans compte (guest checkout)
              </p>
            </form>
          )}

          {/* Step 2 - Shipping method */}
          {step === 2 && (
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Méthode de livraison</h2>
              <div className="space-y-3">
                {SHIPPING_METHODS.map((method) => (
                  <label key={method.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${shippingMethod === method.id ? 'border-accent bg-indigo-50 dark:bg-indigo-900/20' : 'border-[var(--border)] hover:border-accent/50'}`}>
                    <input type="radio" name="shipping" value={method.id} checked={shippingMethod === method.id}
                      onChange={() => setShippingMethod(method.id)} className="accent-accent" />
                    <div className="flex-1">
                      <p className="font-medium text-[var(--text-primary)]">{method.label}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{method.desc}</p>
                    </div>
                    <span className="font-bold text-[var(--text-primary)]">{formatPrice(method.price)}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)} className="btn-outline flex-1 py-3">Retour</button>
                <button onClick={handleMethodSubmit} disabled={loading} className="btn-primary flex-1 py-3 gap-2">
                  {loading ? <><Spinner size="sm" /> Création...</> : 'Continuer vers le paiement'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 - Payment */}
          {step === 3 && clientSecret && (
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Paiement sécurisé</h2>
              <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                🔒 Paiement chiffré SSL — Propulsé par Stripe
              </p>
              <Elements stripe={getStripe()} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <PaymentForm orderId={orderId} onSuccess={handlePaymentSuccess} />
              </Elements>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="card p-5 h-fit space-y-4">
          <h3 className="font-semibold text-[var(--text-primary)]">Récapitulatif</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded bg-[var(--bg-muted)] flex items-center justify-center text-xs font-bold shrink-0">
                  {item.quantity}
                </span>
                <span className="flex-1 text-[var(--text-secondary)] truncate">{item.name}</span>
                <span className="font-medium text-[var(--text-primary)]">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--border)] pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Sous-total</span><span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Livraison ({SHIPPING_METHODS.find(m => m.id === shippingMethod)?.label})</span>
              <span>{formatPrice(shippingCost)}</span>
            </div>
            <div className="flex justify-between font-bold text-[var(--text-primary)] text-base pt-1">
              <span>Total</span><span>{formatPrice(total + shippingCost)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentForm({ orderId, onSuccess }: { orderId: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/account?order=${orderId}` },
      redirect: 'if_required',
    });
    if (stripeError) {
      setError(stripeError.message || 'Paiement échoué');
      setLoading(false);
    } else {
      onSuccess();
      router.push(`/account?order=${orderId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      {error && <p className="text-sm text-error">{error}</p>}
      <button type="submit" disabled={!stripe || loading} className="btn-primary w-full py-3 gap-2">
        {loading ? <><Spinner size="sm" /> Traitement...</> : 'Confirmer le paiement'}
      </button>
    </form>
  );
}
