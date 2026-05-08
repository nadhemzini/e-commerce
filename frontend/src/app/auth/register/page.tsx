'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { Spinner } from '@/components/ui/Skeleton';

const schema = z.object({
  firstName: z.string().min(1, 'Requis').max(50),
  lastName: z.string().min(1, 'Requis').max(50),
  email: z.string().email('E-mail invalide'),
  password: z.string().min(8, 'Min. 8 caractères').regex(/[A-Z]/, 'Une majuscule').regex(/[0-9]/, 'Un chiffre'),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuthStore();
  const toast = useToastStore();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data);
      toast.success('Compte créé avec succès !');
      router.push('/account');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erreur lors de la création');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Créer un compte</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm">Rejoignez market dès aujourd'hui.</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'firstName', label: 'Prénom', placeholder: 'Jean', autocomplete: 'given-name' },
                { name: 'lastName', label: 'Nom', placeholder: 'Dupont', autocomplete: 'family-name' },
              ].map((f) => (
                <div key={f.name}>
                  <label className="label" htmlFor={f.name}>{f.label}</label>
                  <input id={f.name} autoComplete={f.autocomplete} placeholder={f.placeholder}
                    className={`input ${errors[f.name as keyof FormData] ? 'border-error' : ''}`}
                    {...register(f.name as keyof FormData)} />
                  {errors[f.name as keyof FormData] && (
                    <p className="text-xs text-error mt-1">{errors[f.name as keyof FormData]?.message}</p>
                  )}
                </div>
              ))}
            </div>
            <div>
              <label className="label" htmlFor="reg-email">Adresse e-mail</label>
              <input id="reg-email" type="email" autoComplete="email" placeholder="vous@exemple.com"
                className={`input ${errors.email ? 'border-error' : ''}`} {...register('email')} />
              {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="reg-password">Mot de passe</label>
              <input id="reg-password" type="password" autoComplete="new-password" placeholder="Min. 8 caractères"
                className={`input ${errors.password ? 'border-error' : ''}`} {...register('password')} />
              {errors.password && <p className="text-xs text-error mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 gap-2 mt-2">
              {isLoading ? <><Spinner size="sm" /> Création...</> : 'Créer mon compte'}
            </button>
          </form>
          <div className="mt-5 pt-5 border-t border-[var(--border)] text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Déjà un compte ?{' '}
              <Link href="/auth/login" className="text-accent font-medium hover:underline">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
