'use client';

import { useState } from 'react';
import { IdeaModal } from '@/components/IdeaModal';
import { PersistedIdeaCard } from '@/components/PersistedIdeaCard';
import type { Idea } from '@/lib/ideas';

export function IdeaPreviewCard({ idea, timezone }: { idea: Idea; timezone: string }) {
  const [open, setOpen] = useState(false);
  return <><PersistedIdeaCard idea={idea} onOpen={() => setOpen(true)} />{open && <IdeaModal idea={idea} timezone={timezone} onClose={() => setOpen(false)} />}</>;
}
