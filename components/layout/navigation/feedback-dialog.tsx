'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

interface FeedbackDialogProps {
  collapsed: boolean;
  label: string;
  icon: LucideIcon;
}

export function FeedbackDialog({ collapsed, label, icon: Icon }: FeedbackDialogProps) {
  const t = useTranslations('components.feedback');
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    // TODO: Connect feedback submission to mailing service
    setOpen(false);
    setMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'w-full flex items-center justify-start gap-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 px-3',
            collapsed ? 'gap-2' : ''
          )}
        >
          <Icon className="h-4 w-4"/>
          <span
            className={cn(
              'min-w-0 overflow-hidden whitespace-nowrap transition-[opacity,transform,max-width] duration-300 ease-in-out',
              collapsed ? 'max-w-0 opacity-0 -translate-x-1' : 'max-w-[200px] opacity-100 translate-x-0'
            )}
            style={{ transitionDelay: collapsed ? '0ms' : '120ms' }}
          >
            {label}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-lg"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          setTimeout(() => {
            textareaRef.current?.focus();
          }, 0);
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('subtitle')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground" htmlFor="feedback-message">
              {t('prompt')}
            </label>
            <textarea
              ref={textareaRef}
              id="feedback-message"
              name="feedback"
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
              className="min-h-[140px] w-full rounded-md border bg-background p-3 text-sm text-foreground shadow-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              placeholder={t('placeholder')}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t('hint')}
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={!message.trim()}>
              {t('send')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
