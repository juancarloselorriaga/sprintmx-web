'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { signIn, signUp } from '@/lib/auth/client';
import { routing } from '@/i18n/routing';
import { Loader2, Lock, Mail, UserRoundPlus } from 'lucide-react';
import { FormEvent, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

type SignUpFormProps = {
  callbackPath?: string;
};

export function SignUpForm({ callbackPath }: SignUpFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isAppPathname = (value: string): value is keyof typeof routing.pathnames =>
    Object.prototype.hasOwnProperty.call(routing.pathnames, value);
  const targetPath: keyof typeof routing.pathnames =
    callbackPath && isAppPathname(callbackPath) ? callbackPath : '/dashboard';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError(t('missingFields'));
      return;
    }

    startTransition(async () => {
      try {
        const { error: signUpError } = await signUp.email({
          name,
          email,
          password,
          callbackURL: targetPath,
        });

        if (signUpError) {
          setError(signUpError.message ?? t('genericError'));
          return;
        }

        router.refresh();
        router.push(targetPath);
      } catch {
        setError(t('genericError'));
      }
    });
  };

  const handleGoogleSignUp = () => {
    setError(null);
    startTransition(async () => {
      try {
        const { error: signInError } = await signIn.social({
          provider: 'google',
          callbackURL: targetPath,
        });

        if (signInError) {
          setError(signInError.message ?? t('genericError'));
          return;
        }

        router.refresh();
        router.push(targetPath);
      } catch {
        setError(t('genericError'));
      }
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground/80" htmlFor="name">
          <UserRoundPlus className="size-4 text-muted-foreground"/>
          {t('name')}
        </label>
        <input
          id="name"
          name="name"
          required
          type="text"
          autoComplete="name"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none ring-0 transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
          placeholder={t('namePlaceholder')}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground/80" htmlFor="email">
          <Mail className="size-4 text-muted-foreground"/>
          {t('email')}
        </label>
        <input
          id="email"
          name="email"
          required
          type="email"
          autoComplete="email"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none ring-0 transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground/80" htmlFor="password">
          <Lock className="size-4 text-muted-foreground"/>
          {t('password')}
        </label>
        <input
          id="password"
          name="password"
          required
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none ring-0 transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {t('passwordRequirements')}
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? <Loader2 className="size-4 animate-spin"/> : <UserRoundPlus className="size-4"/>}
        <span>{t('createAccount')}</span>
      </Button>

      <Button
        className="w-full"
        disabled={isPending}
        type="button"
        variant="outline"
        onClick={handleGoogleSignUp}
      >
        <span className="font-medium">G</span>
        <span>{t('continueWithGoogle')}</span>
      </Button>
    </form>
  );
}
