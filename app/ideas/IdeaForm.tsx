'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DateTimePicker } from '@/components/DateTimePicker';
import { ModalFormLayout } from '@/components/ModalFormLayout';
import { Field, ImageInput, Input, Select, Textarea } from '@/components/ui/FormControls';
import { categoryMeta, ideaCategories } from '@/lib/categories';
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
    <Field htmlFor="title" label="Title" required><Input id="title" name="title" required maxLength={160} defaultValue={idea?.title} placeholder="Fushimi Inari Taisha" /></Field>
    <details className="optional-details" open={modal || Boolean(idea)}><summary>{idea ? 'Idea details' : 'Add details, links, schedule, or photo'}</summary><div className="optional-fields">
      <div className="form-columns form-columns-three"><Field htmlFor="country" label="Country"><Input id="country" name="country" defaultValue={idea?.country ?? ''} placeholder="Japan" /></Field><Field htmlFor="city" label="City"><Input id="city" name="city" defaultValue={idea?.city ?? ''} placeholder="Kyoto" /></Field><Field htmlFor="neighborhood" label="Neighborhood"><Input id="neighborhood" name="neighborhood" defaultValue={idea?.neighborhood ?? ''} placeholder="Fushimi" /></Field></div>
      <div className="form-columns"><Field htmlFor="category" label="Category" required><Select id="category" name="category" defaultValue={idea?.category ?? 'sight'}>{ideaCategories.map((value) => <option value={value} key={value}>{categoryMeta[value].label}</option>)}</Select></Field><Field htmlFor="tags" label="Tags" hint="Separate with commas."><Input id="tags" name="tags" defaultValue={idea?.tags.join(', ') ?? ''} placeholder="sushi, counter seating" /></Field></div>
      <div className="form-columns form-columns-three"><Field htmlFor="mapsUrl" label="Google Maps"><Input id="mapsUrl" name="mapsUrl" type="url" defaultValue={idea?.mapsUrl ?? ''} placeholder="https://maps.google.com/…" /></Field><Field htmlFor="websiteUrl" label="Website"><Input id="websiteUrl" name="websiteUrl" type="url" defaultValue={idea?.websiteUrl ?? ''} placeholder="https://…" /></Field><Field htmlFor="socialUrl" label="Social"><Input id="socialUrl" name="socialUrl" type="url" defaultValue={idea?.socialUrl ?? ''} placeholder="https://…" /></Field></div>
      <div className="form-columns date-time-fields"><Field htmlFor="scheduledAt" label="Start date"><DateTimePicker id="scheduledAt" name="scheduledAt" initialValue={formatDateTimeInput(idea?.scheduledAt ?? null, timezone)} /></Field><Field htmlFor="scheduledEndAt" label="End date"><DateTimePicker id="scheduledEndAt" name="scheduledEndAt" initialValue={formatDateTimeInput(idea?.scheduledEndAt ?? null, timezone)} /></Field></div>
      <small className="timezone-field-note">Times use {timezone}.</small>
      <Field htmlFor="imageUrl" label="Image" hint={fileName ? `${fileName} will be uploaded when you save.` : undefined}><ImageInput id="imageUrl" name="imageUrl" fileId="photo" defaultValue={idea?.externalImageUrl ?? ''} placeholder={fileName || (idea?.coverPath ? 'Current uploaded image' : 'Image link…')} accept="image/jpeg,image/png,image/webp,image/gif" onFileChange={setFileName} /></Field>
      <Field htmlFor="notes" label="Notes"><Textarea id="notes" name="notes" rows={5} defaultValue={idea?.notes ?? ''} placeholder="What makes this worth considering?" /></Field>
    </div></details>
  </>;

  if (modal) return <ModalFormLayout action={formAction} error={state.error} pending={isPending} onCancel={() => onCancel?.()} title={idea ? 'Edit idea' : 'Add idea'}>{fields}</ModalFormLayout>;
  return <form className="idea-form" action={formAction}>{fields}{state.error && <p className="auth-error" role="alert">{state.error}</p>}<div className="form-actions"><a className="secondary-link" href={idea ? `/ideas/${idea.id}` : '/ideas'}>Cancel</a><button className="primary-button" disabled={isPending} type="submit">{isPending ? 'Saving…' : 'Save'}</button></div></form>;
}
