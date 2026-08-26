'use client';

import { ModalFrame } from '@/components/ModalFrame';
import { MODAL_FORM_TITLE_ID } from '@/components/ModalFormLayout';

export function CreateFormModal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <ModalFrame className="is-editing" onClose={onClose} labelledBy={MODAL_FORM_TITLE_ID}>{children}</ModalFrame>;
}
