'use client';

import { createAdminUser, createStaffUser } from '@/app/actions/admin-users';
import type {
  AdminUserRow,
  ListInternalUsersResult,
} from '@/app/actions/admin-users-list';
import { AdminUsersTable } from '@/components/admin/users/users-table';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth/client';
import { cn } from '@/lib/utils';
import { Shield, ShieldCheck, UserPlus2 } from 'lucide-react';
import { FormEvent, useMemo, useState, useTransition } from 'react';

type SerializedAdminUserRow = Omit<AdminUserRow, 'createdAt'> & { createdAt: string };
type ListError = Extract<ListInternalUsersResult, { ok: false }>['error'] | null;

type AdminUsersClientProps = {
  initialUsers: SerializedAdminUserRow[];
  initialError: ListError;
};

type Banner =
  | { type: 'error'; message: string }
  | { type: 'success'; message: string };

function deserializeUsers(users: SerializedAdminUserRow[]): AdminUserRow[] {
  return users.map((user) => ({
    ...user,
    createdAt: new Date(user.createdAt),
  }));
}

function listErrorToMessage(error: ListError) {
  if (!error) return null;
  switch (error) {
    case 'UNAUTHENTICATED':
      return 'Your session expired. Please sign in again.';
    case 'FORBIDDEN':
      return 'You are not allowed to view internal users.';
    default:
      return 'Could not load internal users right now. Please try again.';
  }
}

function extractValidationMessages(details: unknown): string[] {
  const messages: string[] = [];

  const walk = (value: unknown) => {
    if (!value) return;
    if (typeof value === 'string') {
      messages.push(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (typeof value === 'object') {
      Object.values(value as Record<string, unknown>).forEach(walk);
    }
  };

  walk(details);
  return Array.from(new Set(messages));
}

function CreateInternalUserForm({
  onUserCreated,
  onBanner,
}: {
  onUserCreated: (user: AdminUserRow) => void;
  onBanner: (banner: Banner | null) => void;
}) {
  const [role, setRole] = useState<'internal.admin' | 'internal.staff'>('internal.admin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const roleSummary =
    role === 'internal.admin'
      ? 'Full admin access, including user management.'
      : 'Staff-level access without user management.';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onBanner(null);
    setValidationMessages([]);

    startTransition(async () => {
      const action = role === 'internal.admin' ? createAdminUser : createStaffUser;
      const result = await action({ email, name, password });

      if (!result.ok) {
        if (result.error === 'UNAUTHENTICATED') {
          onBanner({ type: 'error', message: 'Session expired. Refresh and sign in again.' });
          return;
        }

        if (result.error === 'FORBIDDEN') {
          onBanner({ type: 'error', message: 'You are not allowed to create internal users.' });
          return;
        }

        if (result.error === 'INVALID_INPUT') {
          const messages = extractValidationMessages(result.details);
          setValidationMessages(messages);
          onBanner({
            type: 'error',
            message: messages[0] ?? 'Please fix the highlighted fields.',
          });
          return;
        }

        onBanner({ type: 'error', message: 'Something went wrong while creating the user.' });
        return;
      }

      const newUser: AdminUserRow = {
        userId: result.userId,
        email: result.email,
        name: result.name,
        canonicalRoles: result.canonicalRoles,
        permissions: result.permissions,
        createdAt: new Date(),
        isInternal: true,
      };

      onUserCreated(newUser);
      onBanner({
        type: 'success',
        message: `${result.email} created with roles: ${result.canonicalRoles.join(', ')}`,
      });
      setName('');
      setEmail('');
      setPassword('');
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
        <Shield className="size-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-semibold">Create internal account</p>
          <p className="text-xs text-muted-foreground">
            Admins manage users; staff have limited admin access.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={role === 'internal.admin' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setRole('internal.admin')}
        >
          <ShieldCheck className="size-4" />
          Admin
        </Button>
        <Button
          type="button"
          variant={role === 'internal.staff' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setRole('internal.staff')}
        >
          <Shield className="size-4" />
          Staff
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{roleSummary}</p>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/80" htmlFor="name">
          Full name
        </label>
        <input
          id="name"
          name="name"
          required
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none ring-0 transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
          placeholder="Jane Admin"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/80" htmlFor="email">
          Work email
        </label>
        <input
          id="email"
          name="email"
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none ring-0 transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
          placeholder="user@example.com"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/80" htmlFor="password">
          Temporary password
        </label>
        <input
          id="password"
          name="password"
          required
          type="password"
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none ring-0 transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
          placeholder="••••••••"
        />
        <p className="text-xs text-muted-foreground">
          Minimum 8 characters. Ask the user to reset after first sign-in.
        </p>
      </div>

      {validationMessages.length > 0 ? (
        <ul className="space-y-1 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {validationMessages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}

      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? <span className="animate-pulse">Creating...</span> : <UserPlus2 className="size-4" />}
        <span>{role === 'internal.admin' ? 'Create admin' : 'Create staff'}</span>
      </Button>
    </form>
  );
}

export function AdminUsersClient({ initialUsers, initialError }: AdminUsersClientProps) {
  const { data } = useSession();
  const [users, setUsers] = useState<AdminUserRow[]>(() => deserializeUsers(initialUsers));
  const [banner, setBanner] = useState<Banner | null>(() => {
    const message = listErrorToMessage(initialError);
    return message ? { type: 'error', message } : null;
  });

  const sortedUsers = useMemo(
    () =>
      [...users].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [users]
  );

  const handleUserCreated = (user: AdminUserRow) => {
    setUsers((prev) => [user, ...prev.filter((existing) => existing.userId !== user.userId)]);
  };

  const adminEmail = data?.user?.email;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-primary/80 font-semibold">Admin</p>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold leading-tight">Internal users</h1>
          <p className="text-muted-foreground">
            Create administrators or staff accounts and review their permissions.
          </p>
        </div>
        {adminEmail ? (
          <p className="text-xs text-muted-foreground">
            Signed in as {adminEmail}
          </p>
        ) : null}
      </div>

      {banner ? (
        <div
          className={cn(
            'rounded-md border p-3 text-sm',
            banner.type === 'error'
              ? 'border-destructive/50 bg-destructive/10 text-destructive'
              : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700'
          )}
        >
          {banner.message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <CreateInternalUserForm onUserCreated={handleUserCreated} onBanner={setBanner} />
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <AdminUsersTable users={sortedUsers} />
        </div>
      </div>
    </div>
  );
}
