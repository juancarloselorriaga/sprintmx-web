'use client';

import { PhoneInput } from '@/components/ui/phone-input-lazy';
import { CountryCode } from 'libphonenumber-js';

type PhoneFieldProps = {
  label: string;
  name: string;
  value: string;
  required?: boolean;
  error?: string | null;
  disabled?: boolean;
  defaultCountry?: CountryCode;
  onChangeAction: (value: string) => void;
};

export function PhoneField({
  label,
  name,
  value,
  required,
  error,
  disabled,
  defaultCountry = 'MX',
  onChangeAction,
}: PhoneFieldProps) {
  return (
    <PhoneInput
      required={required}
      label={label}
      name={name}
      value={value}
      onChangeAction={onChangeAction}
      defaultCountry={defaultCountry}
      error={error || undefined}
      disabled={disabled}
    />
  );
}
