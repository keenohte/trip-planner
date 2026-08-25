'use client';

import { ModalFrame } from '@/components/ModalFrame';

export function CreateFormModal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <ModalFrame className="is-editing" onClose={onClose}>{children}</ModalFrame>;
}
