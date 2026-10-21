'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
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
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const dirty = !note || title !== note.title || body !== (note.body ?? '');

  useEffect(() => { if (state.saved) { router.refresh(); onClose(); } }, [onClose, router, state.saved]);
  useEffect(() => {
    if (note) return;
    const timer = window.setTimeout(() => titleRef.current?.focus(), 380);
    return () => window.clearTimeout(timer);
  }, [note]);
  return <MobileDrawer labelledBy="note-drawer-title" onClose={onClose} className="new-sheet--note">
    <form className="new-note-drawer" action={action} onSubmit={(event) => {
      if (!preview) return;
      event.preventDefault();
      if (!title.trim()) return;
      onPreviewSave?.({ note, title: title.trim(), body: body.trim() });
      onClose();
    }}>
      <input name="presentation" type="hidden" value="modal" />
      {note && <input name="noteId" type="hidden" value={note.id} />}
      <div className="new-note-drawer__content" data-drawer-scroll>
        <div className="new-note-drawer__field new-note-drawer__field--title" data-value={title || ' '}>
          <textarea
            ref={titleRef}
            id="note-drawer-title"
            className="new-note-drawer__title-input"
            aria-label="Note title"
            name="title"
            required
            maxLength={160}
            rows={1}
            placeholder="Note title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); bodyRef.current?.focus(); } }}
          />
        </div>
        <div className="new-note-drawer__field new-note-drawer__field--body" data-value={body || ' '}>
          <textarea
            ref={bodyRef}
            className={`new-note-drawer__body-input${body ? '' : ' is-empty'}`}
            aria-label="Note"
            name="body"
            rows={1}
            placeholder="Write a note…"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </div>
        {state.error && <p className="new-form__error" role="alert">{state.error}</p>}
      </div>
      {dirty && <button className="new-note-drawer__save" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>}
    </form>
  </MobileDrawer>;
}
