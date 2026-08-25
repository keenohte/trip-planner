'use client';

import { useRef, type ReactNode } from 'react';
import { useCloseDetailsOnOutside } from '@/lib/use-close-details';

export function DismissibleDetails({ className, summary, summaryLabel, children }: { className?: string; summary: ReactNode; summaryLabel: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useCloseDetailsOnOutside(ref);
  return <details className={className} ref={ref}><summary aria-label={summaryLabel}>{summary}</summary>{children}</details>;
}
