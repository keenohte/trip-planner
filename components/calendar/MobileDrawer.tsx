'use client';

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';

export function MobileDrawer({ children, labelledBy, onClose, className = '' }: { children: ReactNode; labelledBy: string; onClose: () => void; className?: string }) {
  const startY = useRef<number | null>(null);
  const viewportBaseline = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [viewport, setViewport] = useState<{ height: number; top: number; keyboard: boolean } | null>(null);

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    const scrollY = window.scrollY;
    const body = document.body;
    const previous = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow };
    const updateViewport = () => {
      const visual = window.visualViewport;
      if (!visual) { setViewport(null); return; }
      viewportBaseline.current = Math.max(viewportBaseline.current ?? visual.height, visual.height);
      setViewport({ height: visual.height, top: visual.offsetTop, keyboard: visual.height < viewportBaseline.current - 100 });
    };
    document.addEventListener('keydown', close);
    body.classList.add('has-open-drawer');
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);
    updateViewport();
    return () => {
      document.removeEventListener('keydown', close);
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
      body.classList.remove('has-open-drawer');
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      viewportBaseline.current = null;
      window.scrollTo(0, scrollY);
    };
  }, [onClose]);

  const finishDrag = () => {
    if (dragY > 88) onClose();
    else setDragY(0);
    startY.current = null;
  };

  const layerStyle = viewport ? ({ height: `${viewport.height}px`, top: `${viewport.top}px`, bottom: 'auto' } satisfies CSSProperties) : undefined;

  return <div className={`new-sheet-layer${viewport?.keyboard ? ' is-keyboard-open' : ''}`} style={layerStyle} role="presentation" onPointerDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className={`new-sheet ${className}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy} style={{ transform: `translateY(${dragY}px)` }}>
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
  </div>;
}
