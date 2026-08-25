'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModalFormLayout } from '@/components/ModalFormLayout';
import type { Note } from '@/lib/notes';
import { createNote, updateNote, type NoteFormState } from './actions';

const initial: NoteFormState = { error: null };

export function NoteForm({ note, presentation = 'page', onCancel, onSaved }: { note?: Note; presentation?: 'page' | 'modal'; onCancel?: () => void; onSaved?: () => void }) {
  const [state, action, pending] = useActionState(note ? updateNote : createNote, initial);
  const router = useRouter();
  useEffect(() => { if (state.saved) { router.refresh(); onSaved?.(); } }, [onSaved, router, state.saved]);
  const fields = <>
    {note && <input type="hidden" name="noteId" value={note.id} />}
    <div className="form-field"><label htmlFor="note-title">Title <span aria-hidden="true">*</span></label><input id="note-title" name="title" required maxLength={160} defaultValue={note?.title ?? ''} placeholder="Transit tips" /></div>
    <div className="form-field"><label htmlFor="note-body">Note</label><textarea id="note-body" name="body" rows={12} defaultValue={note?.body ?? ''} placeholder="Write anything both travelers may need…" /></div>
  </>;
  if (presentation === 'modal') return <ModalFormLayout action={action} error={state.error} pending={pending} onCancel={() => onCancel?.()}>{fields}</ModalFormLayout>;
  return <form className="idea-form compact-form" action={action}>{fields}{state.error && <p className="auth-error" role="alert">{state.error}</p>}<div className="form-actions"><a className="secondary-link" href={note ? `/notes/${note.id}` : '/notes'}>Cancel</a><button className="primary-button" disabled={pending} type="submit">{pending ? 'Saving…' : 'Save'}</button></div></form>;
}
