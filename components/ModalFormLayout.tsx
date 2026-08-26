'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/* Every form modal in the app renders through here, so the title lives
   here too rather than in five separate components. It sits outside the
   scroll area, so it stays put while the fields scroll — matching the
   pinned action row at the bottom. */
export const MODAL_FORM_TITLE_ID = 'modal-form-title';

export function ModalFormLayout({ action, children, error, pending, onCancel, title, className = '', saveLabel = 'Save' }: {
  action: (payload: FormData) => void;
  children: ReactNode;
  error?: string | null;
  pending: boolean;
  onCancel: () => void;
  title: string;
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
    <header className="modal-form__header">
      <h2 className="modal-form__title" id={MODAL_FORM_TITLE_ID}>{title}</h2>
    </header>
    <div className={`idea-form-scroll${scrolling ? ' is-scrolling' : ''}`} onScroll={onScroll}>
      <input type="hidden" name="presentation" value="modal" />
      {children}
      {error && <p className="auth-error" role="alert">{error}</p>}
    </div>
    <span className={`modal-scroll-indicator${scrolling ? ' visible' : ''}`} aria-hidden="true" />
    <div className="form-actions"><button className="secondary-button" type="button" onClick={onCancel}>Cancel</button><button className="primary-button" disabled={pending} type="submit">{pending ? 'Saving…' : saveLabel}</button></div>
  </form>;
}
