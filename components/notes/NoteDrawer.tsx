'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createNote, updateNote, type NoteFormState } from '@/app/notes/actions';
import { MobileDrawer } from '@/components/calendar/MobileDrawer';

export type NoteItem = { id: string; title: string; body: string | null; pinned: boolean; updatedAt: string };
export type PreviewNoteInput = { note: NoteItem | null; title: string; body: string };
const initialState: NoteFormState = { error: null };

export function NoteDrawer({ note, preview = false, onPreviewSave, onClose }: {
  note: NoteItem | null;
  preview?: boolean;
  onPreviewSave?: (input: PreviewNoteInput) => void;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(note ? updateNote : createNote, initialState);
  const [title, setTitle] = useState(note?.title ?? '');
  const [body, setBody] = useState(note?.body ?? '');
  const [active, setActive] = useState<'title' | 'body' | null>(note ? null : 'title');
  const router = useRouter();
  const dirty = !note || title !== note.title || body !== (note.body ?? '');

  useEffect(() => { if (state.saved) { router.refresh(); onClose(); } }, [onClose, router, state.saved]);

  return <MobileDrawer labelledBy="note-drawer-title" onClose={onClose} className="new-sheet--note">
    <form className="new-note-drawer" data-drawer-scroll action={action} onSubmit={(event) => {
      if (!preview) return;
      event.preventDefault();
      if (!title.trim()) return;
      onPreviewSave?.({ note, title: title.trim(), body: body.trim() });
      onClose();
    }}>
      <input name="presentation" type="hidden" value="modal" />
      {note && <input name="noteId" type="hidden" value={note.id} />}
      {active === 'title' || !note ? <input id="note-drawer-title" className="new-note-drawer__title-input" aria-label="Note title" name="title" required maxLength={160} placeholder="Note title" value={title} autoFocus onFocus={(event) => note && event.currentTarget.select()} onChange={(event) => setTitle(event.target.value)} onBlur={() => note && setActive(null)} /> : <><input name="title" type="hidden" value={title} /><button id="note-drawer-title" className="new-note-drawer__title" type="button" onClick={() => setActive('title')}>{title}</button></>}
      {active === 'body' || !note ? <textarea className="new-note-drawer__body-input" aria-label="Note" name="body" placeholder="Write a note…" value={body} autoFocus={active === 'body'} onChange={(event) => setBody(event.target.value)} onBlur={() => note && setActive(null)} /> : <><input name="body" type="hidden" value={body} /><button className={`new-note-drawer__body${body ? '' : ' is-empty'}`} type="button" onClick={() => setActive('body')}>{body || 'Add note text'}</button></>}
      {state.error && <p className="new-form__error" role="alert">{state.error}</p>}
      {dirty && <button className="new-note-drawer__save" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>}
    </form>
  </MobileDrawer>;
}
