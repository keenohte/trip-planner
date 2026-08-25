'use client';

import { ModalFrame } from '@/components/ModalFrame';
import { IdeaForm } from '@/app/ideas/IdeaForm';

export function NewIdeaModal({ timezone, onClose }: { timezone: string; onClose: () => void }) {
  return <ModalFrame className="is-editing" onClose={onClose}><IdeaForm timezone={timezone} presentation="modal" onCancel={onClose} onSaved={onClose} /></ModalFrame>;
}
