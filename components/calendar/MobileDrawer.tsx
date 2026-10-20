'use client';

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function MobileDrawer({ children, labelledBy, onClose, className = '' }: { children: ReactNode; labelledBy: string; onClose: () => void; className?: string }) {
  const startY = useRef<number | null>(null);
  const viewportBaseline = useRef<number | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const [mounted, setMounted] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [viewport, setViewport] = useState<{ height: number; top: number; bottom: number; layoutHeight: number; keyboard: boolean } | null>(null);

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
    document.querySelectorAll('meta[data-drawer-theme]').forEach((node) => node.remove());
    const drawerTheme = document.createElement('meta');
    drawerTheme.name = 'theme-color';
    drawerTheme.content = '#a1a1a3';
    drawerTheme.dataset.drawerTheme = 'true';
    document.head.appendChild(drawerTheme);
    const previous = {
      rootOverflow: root.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow,
      rootBackground: root.style.backgroundColor,
      bodyBackground: body.style.backgroundColor,
      inert: app?.inert ?? false,
    };
    const updateViewport = () => {
      const visual = window.visualViewport;
      if (!visual) { setViewport(null); return; }
      // On iOS, this effect can run after an auto-focused field has already
      // shortened both innerHeight and the visual viewport. screen.height is
      // the stable installed-app viewport and keeps the drawer anchored to the
      // real top and bottom edges while the keyboard is present.
      const standalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
      const installedAppHeight = standalone && window.innerWidth <= 480 ? window.screen.height : 0;
      viewportBaseline.current = Math.max(
        viewportBaseline.current ?? 0,
        window.innerHeight,
        document.documentElement.clientHeight,
        installedAppHeight,
        visual.height + visual.offsetTop,
      );
      const editing = document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement || document.activeElement instanceof HTMLSelectElement;
      const keyboard = editing && visual.height < viewportBaseline.current - 100;
      const layoutHeight = viewportBaseline.current;
      const bottom = keyboard ? Math.max(0, layoutHeight - visual.offsetTop - visual.height) : 0;
      root.classList.toggle('has-drawer-keyboard', keyboard);
      // With black-translucent standalone mode, this is also the color behind
      // the iOS status area. It must stay dimmed even while typing.
      root.style.backgroundColor = '#a1a1a3';
      body.style.backgroundColor = '#a1a1a3';
      setViewport({ height: visual.height, top: visual.offsetTop, bottom, layoutHeight, keyboard });
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
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);
    document.addEventListener('focusin', updateViewport);
    document.addEventListener('focusout', updateViewport);

    let lastTouchY: number | null = null;
    const touchStart = (event: globalThis.TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? null;
    };
    const touchMove = (event: globalThis.TouchEvent) => {
      const currentY = event.touches[0]?.clientY;
      if (currentY === undefined || lastTouchY === null) return;
      const target = event.target instanceof Element ? event.target : null;
      const scrollArea = target?.closest<HTMLElement>('[data-drawer-scroll]');
      const delta = currentY - lastTouchY;
      lastTouchY = currentY;
      if (!scrollArea || !sheetRef.current?.contains(scrollArea)) {
        event.preventDefault();
        return;
      }
      const atTop = scrollArea.scrollTop <= 0;
      const atBottom = scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 1;
      if (scrollArea.scrollHeight <= scrollArea.clientHeight || (atTop && delta > 0) || (atBottom && delta < 0)) event.preventDefault();
    };
    const touchEnd = () => { lastTouchY = null; };
    document.addEventListener('touchstart', touchStart, { capture: true, passive: true });
    document.addEventListener('touchmove', touchMove, { capture: true, passive: false });
    document.addEventListener('touchend', touchEnd, { capture: true, passive: true });
    document.addEventListener('touchcancel', touchEnd, { capture: true, passive: true });
    updateViewport();
    return () => {
      document.removeEventListener('keydown', close);
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
      document.removeEventListener('focusin', updateViewport);
      document.removeEventListener('focusout', updateViewport);
      document.removeEventListener('touchstart', touchStart, true);
      document.removeEventListener('touchmove', touchMove, true);
      document.removeEventListener('touchend', touchEnd, true);
      document.removeEventListener('touchcancel', touchEnd, true);
      root.classList.remove('has-open-drawer');
      root.classList.remove('has-drawer-keyboard');
      body.classList.remove('has-open-drawer');
      root.style.overflow = previous.rootOverflow;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.width = previous.bodyWidth;
      body.style.overflow = previous.bodyOverflow;
      root.style.backgroundColor = previous.rootBackground;
      body.style.backgroundColor = previous.bodyBackground;
      if (app) app.inert = previous.inert;
      document.querySelectorAll('meta[data-drawer-theme]').forEach((node) => node.remove());
      viewportBaseline.current = null;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const finishDrag = () => {
    if (dragY > 88) onClose();
    else setDragY(0);
    startY.current = null;
  };

  const layerStyle = viewport ? ({
    '--visual-viewport-height': `${viewport.height}px`,
    '--visual-viewport-top': `${viewport.top}px`,
    '--keyboard-inset': `${viewport.bottom}px`,
    '--layout-viewport-height': `${viewport.layoutHeight}px`,
  } as CSSProperties) : undefined;

  if (!mounted) return null;

  return createPortal(<div
    ref={layerRef}
    className={`new-sheet-layer${viewport?.keyboard ? ' is-keyboard-open' : ''}`}
    style={layerStyle}
    role="presentation"
  >
    <button className="new-sheet-layer__backdrop" type="button" aria-label="Close drawer" onClick={() => onCloseRef.current()} />
    <div className="new-sheet-layer__keyboard-fill" aria-hidden="true" />
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
