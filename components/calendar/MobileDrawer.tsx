'use client';

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const TRANSITION_MS = 360;

export function MobileDrawer({ children, labelledBy, onClose, className = '' }: { children: ReactNode; labelledBy: string; onClose: () => void; className?: string }) {
  const startY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const closeTimer = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragY, setDragY] = useState(0);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { setMounted(true); }, []);

  const dismiss = () => {
    if (closeTimer.current !== null) return;
    setDragging(false);
    setDragY(0);
    setOpen(false);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      onCloseRef.current();
    }, TRANSITION_MS);
  };

  useEffect(() => {
    if (!mounted) return;

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setOpen(true));
    });
    const scrollY = window.scrollY;
    const root = document.documentElement;
    const body = document.body;
    const app = document.querySelector<HTMLElement>('.app-viewport');
    const previous = {
      rootOverflow: root.style.overflow,
      rootBackground: root.style.backgroundColor,
      bodyOverflow: body.style.overflow,
      bodyBackground: body.style.backgroundColor,
      appPosition: app?.style.position ?? '',
      appTop: app?.style.top ?? '',
      appRight: app?.style.right ?? '',
      appLeft: app?.style.left ?? '',
      inert: app?.inert ?? false,
    };

    root.classList.add('has-open-drawer');
    body.classList.add('has-open-drawer');
    root.style.overflow = 'hidden';
    root.style.backgroundColor = '#ffffff';
    body.style.overflow = 'hidden';
    body.style.backgroundColor = '#ffffff';
    if (app) {
      app.style.position = 'fixed';
      app.style.top = `-${scrollY}px`;
      app.style.right = '0';
      app.style.left = '0';
      app.inert = true;
    }

    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { dismiss(); return; }
      if (event.key !== 'Tab' || !sheetRef.current) return;
      const focusable = [...sheetRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) { event.preventDefault(); sheetRef.current.focus(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };

    let lastTouchY: number | null = null;
    const touchStart = (event: globalThis.TouchEvent) => { lastTouchY = event.touches[0]?.clientY ?? null; };
    const touchMove = (event: globalThis.TouchEvent) => {
      const currentY = event.touches[0]?.clientY;
      if (currentY === undefined || lastTouchY === null) return;
      const target = event.target instanceof Element ? event.target : null;
      const scrollArea = target?.closest<HTMLElement>('[data-drawer-scroll]');
      const delta = currentY - lastTouchY;
      lastTouchY = currentY;
      if (!scrollArea || !sheetRef.current?.contains(scrollArea)) { event.preventDefault(); return; }
      const atTop = scrollArea.scrollTop <= 0;
      const atBottom = scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 1;
      if (scrollArea.scrollHeight <= scrollArea.clientHeight || (atTop && delta > 0) || (atBottom && delta < 0)) event.preventDefault();
    };
    const touchEnd = () => { lastTouchY = null; };

    document.addEventListener('keydown', keydown);
    document.addEventListener('touchstart', touchStart, { capture: true, passive: true });
    document.addEventListener('touchmove', touchMove, { capture: true, passive: false });
    document.addEventListener('touchend', touchEnd, { capture: true, passive: true });
    document.addEventListener('touchcancel', touchEnd, { capture: true, passive: true });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('touchstart', touchStart, true);
      document.removeEventListener('touchmove', touchMove, true);
      document.removeEventListener('touchend', touchEnd, true);
      document.removeEventListener('touchcancel', touchEnd, true);
      root.classList.remove('has-open-drawer');
      body.classList.remove('has-open-drawer');
      root.style.overflow = previous.rootOverflow;
      root.style.backgroundColor = previous.rootBackground;
      body.style.overflow = previous.bodyOverflow;
      body.style.backgroundColor = previous.bodyBackground;
      if (app) {
        app.style.position = previous.appPosition;
        app.style.top = previous.appTop;
        app.style.right = previous.appRight;
        app.style.left = previous.appLeft;
        app.inert = previous.inert;
      }
      window.scrollTo(0, scrollY);
    };
  }, [mounted]);

  const finishDrag = () => {
    setDragging(false);
    if (dragY > 88) dismiss();
    else setDragY(0);
    startY.current = null;
  };

  if (!mounted) return null;

  const sheetStyle = { '--drawer-drag-y': `${dragY}px` } as CSSProperties;

  return createPortal(
    <div className="new-sheet-layer" role="presentation">
      <section
        ref={sheetRef}
        className={`new-sheet ${className}${dragging ? ' is-dragging' : ''}`}
        data-open={open ? 'true' : 'false'}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        style={sheetStyle}
      >
        <div
          className="new-sheet__drag-zone"
          onPointerDown={(event) => { startY.current = event.clientY; setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); }}
          onPointerMove={(event) => { if (startY.current !== null) setDragY(Math.max(0, event.clientY - startY.current)); }}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          <div className="new-sheet__handle" aria-hidden="true" />
        </div>
        <button className="new-sheet__close" type="button" aria-label="Close drawer" onClick={dismiss}><X size={20} strokeWidth={2.2} /></button>
        {children}
      </section>
    </div>,
    document.body,
  );
}
