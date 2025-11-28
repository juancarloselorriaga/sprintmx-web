import { db } from '@/db';
import { contactSubmissions } from '@/db/schema';
import { getSupportRecipients, sendEmail } from '@/lib/email';
import { renderContactSubmissionEmailHTML, renderContactSubmissionEmailText } from '@/lib/email/templates/contact-submission-email';
import { routing, type AppLocale } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export const contactSubmissionSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  email: z.email().trim().max(255).optional(),
  message: z.string().trim().min(1).max(5000),
  origin: z.string().trim().min(1).max(100).default('unknown'),
  userId: z.uuid().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;
export type ContactSubmissionRecord = typeof contactSubmissions.$inferSelect;

function normalizeMetadata(metadata?: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return Object.fromEntries(
      Object.entries(metadata as Record<string, unknown>).filter(
        ([, value]) => value !== undefined,
      ),
    );
  }

  return {};
}

function stringifyMetadata(metadata: Record<string, unknown>): string {
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return '';
  }
}

export async function createContactSubmission(input: ContactSubmissionInput) {
  const parsed = contactSubmissionSchema.parse(input);
  const [submission] = await db
    .insert(contactSubmissions)
    .values({
      name: parsed.name,
      email: parsed.email,
      message: parsed.message,
      origin: parsed.origin,
      userId: parsed.userId ?? null,
      metadata: normalizeMetadata(parsed.metadata),
    })
    .returning();

  return submission;
}

export async function notifySupportOfSubmission(
  submission: ContactSubmissionRecord,
  locale: AppLocale = routing.defaultLocale,
): Promise<{ sent: boolean; reason?: string }> {
  const recipients = getSupportRecipients();

  if (recipients.length === 0) {
    console.warn('BREVO_SUPPORT_RECIPIENTS is not set; skipping support email dispatch.');
    return { sent: false, reason: 'missing_recipients' };
  }

  const t = await getTranslations({ locale, namespace: 'emails.contactSubmission' });
  const metadata = normalizeMetadata(submission.metadata);
  const metadataText = stringifyMetadata(metadata);
  const createdAt =
    submission.createdAt instanceof Date
      ? submission.createdAt.toISOString()
      : new Date().toISOString();

  const subject = t('subject', { origin: submission.origin });
  const labels = {
    origin: t('labels.origin'),
    name: t('labels.name'),
    email: t('labels.email'),
    userId: t('labels.userId'),
    createdAt: t('labels.createdAt'),
    message: t('labels.message'),
    metadata: t('labels.metadata'),
  };

  const htmlContent = renderContactSubmissionEmailHTML({
    locale,
    title: t('title'),
    intro: t('intro'),
    labels,
    origin: submission.origin,
    name: submission.name || t('fallbacks.unknown'),
    email: submission.email || t('fallbacks.unknown'),
    userId: submission.userId || t('fallbacks.anonymous'),
    createdAt,
    message: submission.message,
    metadataText: metadataText || t('fallbacks.none'),
    footer: t('footer', { year: new Date().getFullYear() }),
  });

  const textContent = renderContactSubmissionEmailText({
    intro: t('intro'),
    labels,
    origin: submission.origin,
    name: submission.name || t('fallbacks.unknown'),
    email: submission.email || t('fallbacks.unknown'),
    userId: submission.userId || t('fallbacks.anonymous'),
    createdAt,
    message: submission.message,
    metadataText: metadataText || t('fallbacks.none'),
    footer: t('footer', { year: new Date().getFullYear() }),
  });

  await sendEmail({
    to: recipients,
    subject,
    htmlContent,
    textContent,
  });

  return { sent: true };
}
