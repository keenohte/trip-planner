'use client';

import { useRouter } from 'next/navigation';
import { IdeaModal } from '@/components/IdeaModal';
import type { Idea } from '@/lib/ideas';

export function StandaloneIdeaModal({ idea, timezone }: { idea: Idea; timezone: string }) {
  const router = useRouter();
  return <IdeaModal idea={idea} timezone={timezone} onClose={() => router.push('/ideas')} />;
}
