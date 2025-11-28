'use server';

import { auth } from '@/lib/auth';
import {
  contactSubmissionSchema,
  createContactSubmission,
  notifySupportOfSubmission,
} from '@/lib/contact-submissions';
import { headers } from 'next/headers';
import { extractLocaleFromRequest } from '@/lib/utils/locale';
import { z } from 'zod';

const submitSchema = contactSubmissionSchema.omit({ userId: true });
export type SubmitContactSubmissionInput = z.infer<typeof submitSchema>;

type ReadonlyHeaderLike = {
  get(name: string): string | null | undefined;
};

function collectRequestMetadata(h: ReadonlyHeaderLike): Record<string, unknown> {
  return {
    referer: h.get('referer'),
    userAgent: h.get('user-agent'),
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('cf-connecting-ip'),
    host: h.get('host'),
  };
}

export async function submitContactSubmission(payload: SubmitContactSubmissionInput) {
  const parsed = submitSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      ok: false as const,
      error: 'INVALID_INPUT',
      details: z.treeifyError(parsed.error),
    };
  }

  const h = await headers();
  const locale = extractLocaleFromRequest({
    headers: h,
    url: h.get('referer') ?? undefined,
  });
  const session = await auth.api.getSession({ headers: h }).catch(() => null);

  const submission = await createContactSubmission({
    ...parsed.data,
    name: parsed.data.name ?? session?.user?.name,
    email: parsed.data.email ?? session?.user?.email,
    userId: session?.user?.id,
    metadata: {
      ...(parsed.data.metadata ?? {}),
      ...collectRequestMetadata(h),
    },
  });

  let emailSent = true;

  try {
    await notifySupportOfSubmission(submission, locale);
  } catch (error) {
    emailSent = false;
    console.error('[contact-submissions] Failed to send email notification', error);
  }

  return {
    ok: true as const,
    id: submission.id,
    emailSent,
  };
}
