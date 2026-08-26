'use client';

import { useState } from 'react';
import { NewIdeaModal } from '@/components/NewIdeaModal';
import { Button } from '@/components/ui/Button';

/* `className` is a TRANSITIONAL escape hatch for the two call sites still
   on legacy styling (the mobile tab bar and the home create-card). Both
   need a bespoke shape, not a button. Delete the prop — and this comment —
   once Nav and Home are migrated; new call sites must omit it and get the
   real Button. */
export function NewIdeaTrigger({
  timezone,
  children,
  className,
}: {
  timezone: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {className ? (
        <button className={className} type="button" onClick={() => setOpen(true)}>
          {children}
        </button>
      ) : (
        <Button variant="primary" onClick={() => setOpen(true)}>
          {children}
        </Button>
      )}
      {open && <NewIdeaModal timezone={timezone} onClose={() => setOpen(false)} />}
    </>
  );
}
