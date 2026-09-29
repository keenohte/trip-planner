'use client';

import { useEffect, useState, type ReactNode } from 'react';

export function MediaImage({
  src,
  alt = '',
  fallback,
  loading = 'lazy',
}: {
  src: string | null;
  alt?: string;
  fallback: ReactNode;
  loading?: 'eager' | 'lazy';
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) return fallback;

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
