'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

export function Field({ htmlFor, label, required = false, hint, span, children }: {
  htmlFor: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  /* Column span inside .form-grid. A named variant rather than a
     className prop, so callers cannot restyle a Field arbitrarily. */
  span?: 2 | 3;
  children: ReactNode;
}) {
  return (
    <div className={span ? `field form-grid__${span}` : 'field'}>
      <label className="field__label" htmlFor={htmlFor}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      {children}
      {hint && <small className="field__hint">{hint}</small>}
    </div>
  );
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'style'> & {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ leadingIcon, trailingIcon, ...props }, ref) {
  /* The element tree must NOT change shape when an icon prop toggles.
     Returning a bare <input> in one branch and a wrapped one in the other
     made React remount the input when the lookup spinner appeared —
     destroying the value the person had just pasted. The shell is always
     rendered; only its children are conditional. */
  const control = [
    'field-control',
    leadingIcon && 'field-control--leading',
    trailingIcon && 'field-control--trailing',
  ].filter(Boolean).join(' ');
  return (
    <span className="field-control-shell">
      {leadingIcon ? <span className="field-control-shell__leading" aria-hidden="true">{leadingIcon}</span> : null}
      <input className={control} ref={ref} {...props} />
      {trailingIcon ? <span className="field-control-shell__trailing" aria-hidden="true">{trailingIcon}</span> : null}
    </span>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'style'>>(function Textarea(props, ref) {
  return <textarea className="field-control field-control--textarea" ref={ref} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'style'>>(function Select(props, ref) {
  return <select className="field-control field-control--select" ref={ref} {...props} />;
});

export function SearchInput(props: Omit<InputProps, 'type' | 'leadingIcon'>) {
  return <Input type="search" leadingIcon={<Search size={16} strokeWidth={1.8} />} {...props} />;
}

export function ImageInput({ id, name, fileId, defaultValue, placeholder, accept, onFileChange }: {
  id: string;
  name: string;
  fileId: string;
  defaultValue?: string;
  placeholder?: string;
  accept: string;
  onFileChange?: (fileName: string) => void;
}) {
  return (
    <div className="field-upload">
      <input className="field-upload__url" id={id} name={name} type="url" defaultValue={defaultValue} placeholder={placeholder} />
      <label className="btn btn--secondary btn--sm field-upload__button" htmlFor={fileId}>Upload file</label>
      <input className="field-upload__file" id={fileId} name="photo" type="file" accept={accept} onChange={(event) => onFileChange?.(event.target.files?.[0]?.name ?? '')} />
    </div>
  );
}
