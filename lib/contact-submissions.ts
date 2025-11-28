import { db } from '@/db';
import { contactSubmissions } from '@/db/schema';
import { getSupportRecipients, sendEmail } from '@/lib/email';
import { renderContactSubmissionEmailHTML, renderContactSubmissionEmailText } from '@/lib/email/templates/contact-submission-email';
import { routing, type AppLocale } from '@/i18n/routing';
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
  userLocale: AppLocale = routing.defaultLocale,
): Promise<{ sent: boolean; reason?: string }> {
  const recipients = getSupportRecipients();

  if (recipients.length === 0) {
    console.warn('BREVO_SUPPORT_RECIPIENTS is not set; skipping support email dispatch.');
    return { sent: false, reason: 'missing_recipients' };
  }

  const supportLocale = routing.defaultLocale;
  const metadata = normalizeMetadata(submission.metadata);
  const { preferredLocale, ...restMetadata } = metadata as {
    preferredLocale?: unknown;
  } & Record<string, unknown>;
  const preferredLocaleValue =
    typeof preferredLocale === 'string' ? preferredLocale : userLocale;
  const metadataText = stringifyMetadata(restMetadata);
  const createdAt =
    submission.createdAt instanceof Date
      ? submission.createdAt.toISOString()
      : new Date().toISOString();

  const subject = `[${submission.origin}] Nuevo mensaje de contacto`;
  const labels = {
    origin: 'Origen',
    name: 'Nombre',
    email: 'Email',
    preferredLocale: 'Idioma preferido',
    userId: 'ID de usuario',
    createdAt: 'Creado',
    message: 'Mensaje',
    metadata: 'Metadata',
  };

  const htmlContent = renderContactSubmissionEmailHTML({
    locale: supportLocale,
    title: 'Nueva solicitud de contacto',
    intro: 'Alguien envió un mensaje desde el sitio. Estos son los detalles:',
    labels,
    origin: submission.origin,
    name: submission.name || 'Desconocido',
    email: submission.email || 'Desconocido',
    preferredLocale: preferredLocaleValue,
    userId: submission.userId || 'Anónimo',
    createdAt,
    message: submission.message,
    metadataText: metadataText || 'N/A',
    footer: `© ${new Date().getFullYear()} RungoMX. Todos los derechos reservados.`,
  });

  const textContent = renderContactSubmissionEmailText({
    intro: 'Alguien envió un mensaje desde el sitio. Estos son los detalles:',
    labels,
    origin: submission.origin,
    name: submission.name || 'Desconocido',
    email: submission.email || 'Desconocido',
    preferredLocale: preferredLocaleValue,
    userId: submission.userId || 'Anónimo',
    createdAt,
    message: submission.message,
    metadataText: metadataText || 'N/A',
    footer: `© ${new Date().getFullYear()} RungoMX. Todos los derechos reservados.`,
  });

  await sendEmail({
    to: recipients,
    subject,
    htmlContent,
    textContent,
  });

  return { sent: true };
}
