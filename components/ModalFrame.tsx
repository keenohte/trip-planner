'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Minimize2 } from 'lucide-react';

export function ModalFrame({ children, onClose, labelledBy, className = '' }: { children: React.ReactNode; onClose: () => void; labelledBy?: string; className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeStartY = useRef<number | null>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKeyDown); if (scrollTimer.current) clearTimeout(scrollTimer.current); };
  }, [onClose]);

  if (!mounted) return null;
  const onScroll = () => {
    setScrolling(true);
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => setScrolling(false), 700);
  };
  const onTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    if (!window.matchMedia('(max-width: 650px)').matches || event.currentTarget.scrollTop !== 0) return;
    const nestedScroller = (event.target as Element).closest('.idea-form-scroll');
    if (nestedScroller instanceof HTMLElement && nestedScroller.scrollTop !== 0) return;
    swipeStartY.current = event.touches[0]?.clientY ?? null;
  };
  const onTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    const startY = swipeStartY.current;
    swipeStartY.current = null;
    if (startY === null) return;
    const endY = event.changedTouches[0]?.clientY ?? startY;
    if (endY - startY > window.innerHeight * 0.08) onClose();
  };
  return createPortal(<div className="idea-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><div className={`idea-modal-shell${scrolling ? ' is-scrolling' : ''}`}><button className="idea-modal-close" type="button" onClick={onClose} aria-label="Close modal"><Minimize2 size={15} strokeWidth={1.8} aria-hidden="true" /></button><section className={`idea-modal ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={labelledBy} onScroll={onScroll} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={() => { swipeStartY.current = null; }}>{children}</section><span className="modal-scroll-indicator" aria-hidden="true" /></div></div>, document.body);
}
