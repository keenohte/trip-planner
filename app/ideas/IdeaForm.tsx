'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DateTimePicker } from '@/components/DateTimePicker';
import { ModalFormLayout } from '@/components/ModalFormLayout';
import { formatDateTimeInput } from '@/lib/datetime';
import type { Idea } from '@/lib/ideas';
import { createIdea, updateIdea, type IdeaFormState } from './actions';

const initialState: IdeaFormState = { error: null };

export function IdeaForm({ idea, timezone, presentation = 'page', onCancel, onSaved }: { idea?: Idea; timezone: string; presentation?: 'page' | 'modal'; onCancel?: () => void; onSaved?: () => void }) {
  const [state, formAction, isPending] = useActionState(idea ? updateIdea : createIdea, initialState);
  const [fileName, setFileName] = useState('');
  const router = useRouter();
  const modal = presentation === 'modal';
  useEffect(() => { if (state.saved) { router.refresh(); onSaved?.(); } }, [onSaved, router, state.saved]);

  const fields = <>
    {idea && <input type="hidden" name="ideaId" value={idea.id} />}
    <div className="form-field"><label htmlFor="title">Title <span aria-hidden="true">*</span></label><input id="title" name="title" required maxLength={160} defaultValue={idea?.title} placeholder="Fushimi Inari Taisha" /></div>
    <details className="optional-details" open={modal || Boolean(idea)}><summary>{idea ? 'Idea details' : 'Add details, links, schedule, or photo'}</summary><div className="optional-fields">
      <div className="form-columns form-columns-three"><div className="form-field"><label htmlFor="country">Country</label><input id="country" name="country" defaultValue={idea?.country ?? ''} placeholder="Japan" /></div><div className="form-field"><label htmlFor="city">City</label><input id="city" name="city" defaultValue={idea?.city ?? ''} placeholder="Kyoto" /></div><div className="form-field"><label htmlFor="neighborhood">Neighborhood</label><input id="neighborhood" name="neighborhood" defaultValue={idea?.neighborhood ?? ''} placeholder="Fushimi" /></div></div>
      <div className="form-field"><label htmlFor="types">Type</label><input id="types" name="types" defaultValue={idea?.types.join(', ') ?? ''} placeholder="Sight, Outdoors" /><small>Separate multiple types with commas.</small></div>
      <div className="form-columns form-columns-three"><div className="form-field"><label htmlFor="mapsUrl">Google Maps</label><input id="mapsUrl" name="mapsUrl" type="url" defaultValue={idea?.mapsUrl ?? ''} placeholder="https://maps.google.com/…" /></div><div className="form-field"><label htmlFor="websiteUrl">Website</label><input id="websiteUrl" name="websiteUrl" type="url" defaultValue={idea?.websiteUrl ?? ''} placeholder="https://…" /></div><div className="form-field"><label htmlFor="socialUrl">Social</label><input id="socialUrl" name="socialUrl" type="url" defaultValue={idea?.socialUrl ?? ''} placeholder="https://…" /></div></div>
      <div className="form-columns date-time-fields"><div className="form-field"><label htmlFor="scheduledAt">Start date</label><DateTimePicker id="scheduledAt" name="scheduledAt" initialValue={formatDateTimeInput(idea?.scheduledAt ?? null, timezone)} /></div><div className="form-field"><label htmlFor="scheduledEndAt">End date</label><DateTimePicker id="scheduledEndAt" name="scheduledEndAt" initialValue={formatDateTimeInput(idea?.scheduledEndAt ?? null, timezone)} /></div></div>
      <small className="timezone-field-note">Times use {timezone}.</small>
      <div className="form-field"><label htmlFor="imageUrl">Image</label><div className="image-upload-control"><input id="imageUrl" name="imageUrl" type="url" defaultValue={idea?.externalImageUrl ?? ''} placeholder={fileName || (idea?.coverPath ? 'Current uploaded image' : 'Image link…')} /><label className="image-upload-button" htmlFor="photo">Upload file</label><input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')} /></div>{fileName && <small>{fileName} will be uploaded when you save.</small>}</div>
      <div className="form-field"><label htmlFor="notes">Notes</label><textarea id="notes" name="notes" rows={5} defaultValue={idea?.notes ?? ''} placeholder="What makes this worth considering?" /></div>
    </div></details>
  </>;

  if (modal) return <ModalFormLayout action={formAction} error={state.error} pending={isPending} onCancel={() => onCancel?.()}>{fields}</ModalFormLayout>;
  return <form className="idea-form" action={formAction}>{fields}{state.error && <p className="auth-error" role="alert">{state.error}</p>}<div className="form-actions"><a className="secondary-link" href={idea ? `/ideas/${idea.id}` : '/ideas'}>Cancel</a><button className="primary-button" disabled={isPending} type="submit">{isPending ? 'Saving…' : 'Save'}</button></div></form>;
}
