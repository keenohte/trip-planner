'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

export function Field({ htmlFor, label, required = false, hint, children }: {
  htmlFor: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={htmlFor}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      {children}
      {hint && <small className="field__hint">{hint}</small>}
    </div>
  );
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'style'> & {
  leadingIcon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ leadingIcon, ...props }, ref) {
  if (!leadingIcon) return <input className="field-control" ref={ref} {...props} />;
  return (
    <span className="field-control-shell">
      <span className="field-control-shell__leading" aria-hidden="true">{leadingIcon}</span>
      <input className="field-control field-control--leading" ref={ref} {...props} />
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
      <label className="field-upload__button" htmlFor={fileId}>Upload file</label>
      <input className="field-upload__file" id={fileId} name="photo" type="file" accept={accept} onChange={(event) => onFileChange?.(event.target.files?.[0]?.name ?? '')} />
    </div>
  );
}
