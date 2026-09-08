import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useId } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
}

export function Input({ label, error, id, className, required, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <input
        id={inputId}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={clsx(
          'rounded-md border px-3 py-2 text-sm outline-none transition-colors',
          'focus:border-primary focus:ring-1 focus:ring-primary',
          error ? 'border-danger' : 'border-border',
          className,
        )}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string | null;
}

export function Textarea({ label, error, id, className, required, ...rest }: TextareaProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <textarea
        id={inputId}
        required={required}
        aria-invalid={!!error}
        className={clsx(
          'rounded-md border px-3 py-2 text-sm outline-none transition-colors',
          'focus:border-primary focus:ring-1 focus:ring-primary',
          error ? 'border-danger' : 'border-border',
          className,
        )}
        {...rest}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  disabled?: boolean;
}

export function Select({ label, value, onChange, options, placeholder, required, error, disabled }: SelectProps) {
  const autoId = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={autoId} className="text-sm font-medium text-ink">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <select
        id={autoId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className={clsx(
          'rounded-md border bg-white px-3 py-2 text-sm outline-none transition-colors',
          'focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-secondary',
          error ? 'border-danger' : 'border-border',
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
