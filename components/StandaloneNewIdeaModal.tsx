'use client';

import { useRouter } from 'next/navigation';
import { NewIdeaModal } from '@/components/NewIdeaModal';

export function StandaloneNewIdeaModal({ timezone }: { timezone: string }) {
  const router = useRouter();
  return <NewIdeaModal timezone={timezone} onClose={() => router.push('/ideas')} />;
}
