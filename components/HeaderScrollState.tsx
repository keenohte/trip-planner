'use client';

import { useEffect } from 'react';

export function HeaderScrollState() {
  useEffect(() => {
    const header = document.querySelector('.app-header');
    if (!header) return;
    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return null;
}
