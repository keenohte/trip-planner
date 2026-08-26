'use client';

import { ModalFrame } from '@/components/ModalFrame';
import { MODAL_FORM_TITLE_ID } from '@/components/ModalFormLayout';
import { IdeaForm } from '@/app/ideas/IdeaForm';

export function NewIdeaModal({ timezone, onClose }: { timezone: string; onClose: () => void }) {
  return <ModalFrame className="is-editing" onClose={onClose} labelledBy={MODAL_FORM_TITLE_ID}><IdeaForm timezone={timezone} presentation="modal" onCancel={onClose} onSaved={onClose} /></ModalFrame>;
}
