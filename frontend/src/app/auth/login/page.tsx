'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { Spinner } from '@/components/ui/Skeleton';

const schema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const toast = useToastStore();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Connexion réussie !');
      router.push('/account');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Email ou mot de passe incorrect');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Connexion</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm">Bienvenue ! Connectez-vous à votre compte.</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label" htmlFor="email">Adresse e-mail</label>
              <input id="email" type="email" autoComplete="email" placeholder="vous@exemple.com"
                className={`input ${errors.email ? 'border-error' : ''}`}
                {...register('email')} />
              {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0" htmlFor="password">Mot de passe</label>
                <Link href="/auth/forgot-password" className="text-xs text-accent hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <input id="password" type="password" autoComplete="current-password" placeholder="••••••••"
                className={`input ${errors.password ? 'border-error' : ''}`}
                {...register('password')} />
              {errors.password && <p className="text-xs text-error mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 gap-2">
              {isLoading ? <><Spinner size="sm" /> Connexion...</> : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[var(--border)] text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Pas encore de compte ?{' '}
              <Link href="/auth/register" className="text-accent dark:text-accent-dark font-medium hover:underline">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--text-secondary)] mt-4">
          Demo : <code className="bg-[var(--bg-muted)] px-1 rounded">user@example.com</code> / <code className="bg-[var(--bg-muted)] px-1 rounded">Password123!</code>
        </p>
      </div>
    </div>
  );
}
