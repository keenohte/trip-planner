'use client';

import { type CSSProperties, type ReactNode, type TouchEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function MobileDrawer({ children, labelledBy, onClose, className = '' }: { children: ReactNode; labelledBy: string; onClose: () => void; className?: string }) {
  const startY = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const viewportBaseline = useRef<number | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const [mounted, setMounted] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [viewport, setViewport] = useState<{ height: number; top: number; bottom: number; keyboard: boolean } | null>(null);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    setMounted(true);
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab' || !sheetRef.current) return;
      const focusable = [...sheetRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) { event.preventDefault(); sheetRef.current.focus(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const scrollY = window.scrollY;
    const root = document.documentElement;
    const body = document.body;
    const app = document.querySelector<HTMLElement>('.app-viewport');
    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previous = {
      rootOverflow: root.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow,
      inert: app?.inert ?? false,
      theme: theme?.content,
    };
    const updateViewport = () => {
      const visual = window.visualViewport;
      if (!visual) { setViewport(null); return; }
      viewportBaseline.current = Math.max(viewportBaseline.current ?? visual.height, visual.height);
      const editing = document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement || document.activeElement instanceof HTMLSelectElement;
      const keyboard = editing && visual.height < viewportBaseline.current - 100;
      const bottom = keyboard ? Math.max(0, viewportBaseline.current - visual.offsetTop - visual.height) : 0;
      setViewport({ height: visual.height, top: visual.offsetTop, bottom, keyboard });
    };
    document.addEventListener('keydown', close);
    root.classList.add('has-open-drawer');
    body.classList.add('has-open-drawer');
    root.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    if (app) app.inert = true;
    if (theme) theme.content = '#a1a1a3';
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);
    document.addEventListener('focusin', updateViewport);
    document.addEventListener('focusout', updateViewport);
    updateViewport();
    return () => {
      document.removeEventListener('keydown', close);
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
      document.removeEventListener('focusin', updateViewport);
      document.removeEventListener('focusout', updateViewport);
      root.classList.remove('has-open-drawer');
      body.classList.remove('has-open-drawer');
      root.style.overflow = previous.rootOverflow;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.width = previous.bodyWidth;
      body.style.overflow = previous.bodyOverflow;
      if (app) app.inert = previous.inert;
      if (theme && previous.theme) theme.content = previous.theme;
      viewportBaseline.current = null;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const finishDrag = () => {
    if (dragY > 88) onClose();
    else setDragY(0);
    startY.current = null;
  };

  const containTouchScroll = (event: TouchEvent<HTMLDivElement>) => {
    const currentY = event.touches[0]?.clientY;
    if (currentY === undefined || touchStartY.current === null) return;
    const target = event.target instanceof Element ? event.target : null;
    const scrollArea = target?.closest<HTMLElement>('[data-drawer-scroll]');
    if (!scrollArea) { event.preventDefault(); return; }
    const delta = currentY - touchStartY.current;
    const atTop = scrollArea.scrollTop <= 0;
    const atBottom = scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 1;
    if (scrollArea.scrollHeight <= scrollArea.clientHeight || (atTop && delta > 0) || (atBottom && delta < 0)) event.preventDefault();
  };

  const layerStyle = viewport ? ({
    '--visual-viewport-height': `${viewport.height}px`,
    '--visual-viewport-top': `${viewport.top}px`,
    '--keyboard-inset': `${viewport.bottom}px`,
  } as CSSProperties) : undefined;

  if (!mounted) return null;

  return createPortal(<div
    ref={layerRef}
    className={`new-sheet-layer${viewport?.keyboard ? ' is-keyboard-open' : ''}`}
    style={layerStyle}
    role="presentation"
    onPointerDown={(event) => event.target === event.currentTarget && onCloseRef.current()}
    onTouchStart={(event) => { touchStartY.current = event.touches[0]?.clientY ?? null; }}
    onTouchMove={containTouchScroll}
    onTouchEnd={() => { touchStartY.current = null; }}
    onTouchCancel={() => { touchStartY.current = null; }}
  >
    <section ref={sheetRef} className={`new-sheet ${className}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1} style={{ transform: `translateY(${dragY}px)` }}>
      <div
        className="new-sheet__drag-zone"
        onPointerDown={(event) => { startY.current = event.clientY; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={(event) => { if (startY.current !== null) setDragY(Math.max(0, event.clientY - startY.current)); }}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <div className="new-sheet__handle" aria-hidden="true" />
      </div>
      {children}
    </section>
  </div>, document.body);
}
