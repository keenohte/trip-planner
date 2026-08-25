'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export function ModalFormLayout({ action, children, error, pending, onCancel, className = '', saveLabel = 'Save' }: {
  action: (payload: FormData) => void;
  children: ReactNode;
  error?: string | null;
  pending: boolean;
  onCancel: () => void;
  className?: string;
  saveLabel?: string;
}) {
  const [scrolling, setScrolling] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const onScroll = () => {
    setScrolling(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setScrolling(false), 700);
  };
  return <form className={`idea-form modal-idea-form ${className}`.trim()} action={action}>
    <div className={`idea-form-scroll${scrolling ? ' is-scrolling' : ''}`} onScroll={onScroll}>
      <input type="hidden" name="presentation" value="modal" />
      {children}
      {error && <p className="auth-error" role="alert">{error}</p>}
    </div>
    <span className={`modal-scroll-indicator${scrolling ? ' visible' : ''}`} aria-hidden="true" />
    <div className="form-actions"><button className="secondary-button" type="button" onClick={onCancel}>Cancel</button><button className="primary-button" disabled={pending} type="submit">{pending ? 'Saving…' : saveLabel}</button></div>
  </form>;
}
