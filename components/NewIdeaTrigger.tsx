'use client';

import { useState } from 'react';
import { NewIdeaModal } from '@/components/NewIdeaModal';

export function NewIdeaTrigger({ timezone, className, children }: { timezone: string; className: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <><button className={className} type="button" onClick={() => setOpen(true)}>{children}</button>{open && <NewIdeaModal timezone={timezone} onClose={() => setOpen(false)} />}</>;
}
