'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPinIcon } from 'lucide-react';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PublicLocationValue } from '@/types/location';

const LocationPickerDialog = dynamic(
  () =>
    import('./location-picker-dialog').then(
      (mod) => mod.LocationPickerDialog
    ),
  {
    ssr: false,
    loading: () => null,
  }
);

type LocationFieldProps = {
  label: string;
  displayValue: string;
  required?: boolean;
  error?: string | null;
  disabled?: boolean;
  hint?: string;
  location: PublicLocationValue | null;
  country?: string;
  language?: string;
  onDisplayChangeAction: (value: string) => void;
  onLocationChangeAction: (location: PublicLocationValue) => void;
};

export function LocationField({
  label,
  displayValue,
  required,
  error,
  disabled,
  hint,
  location,
  country,
  language,
  onDisplayChangeAction,
  onLocationChangeAction,
}: LocationFieldProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-2">
      <FormField label={label} required={required} error={error}>
        <div className="flex gap-2">
          <input
            className={cn(
              'min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none ring-0 transition',
              'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30',
              error && 'border-destructive focus-visible:border-destructive'
            )}
            value={displayValue}
            onChange={(event) => onDisplayChangeAction(event.target.value)}
            maxLength={255}
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setIsDialogOpen(true)}
            disabled={disabled}
          >
            <MapPinIcon className="mr-1 h-4 w-4" />
            Map
          </Button>
        </div>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </FormField>

      {isDialogOpen ? (
        <LocationPickerDialog
          initialLocation={location}
          onLocationSelectAction={onLocationChangeAction}
          onCloseAction={() => setIsDialogOpen(false)}
          country={country}
          language={language}
        />
      ) : null}
    </div>
  );
}
