'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModalFormLayout } from '@/components/ModalFormLayout';
import { Field, Input, Select, Textarea } from '@/components/ui/FormControls';
import type { WishlistItem } from '@/lib/wishlist';
import { wishlistKinds, wishlistPriorities } from '@/lib/wishlist-types';
import { createWishlistItem, updateWishlistItem, type WishlistFormState } from './actions';

const initial: WishlistFormState = { error: null };
const label = (value: string) => value.replace('_', ' ').replace(/^./, (letter) => letter.toUpperCase());

export function WishlistForm({ item, presentation = 'page', onCancel, onSaved }: { item?: WishlistItem; presentation?: 'page' | 'modal'; onCancel?: () => void; onSaved?: () => void }) {
  const [state, action, pending] = useActionState(item ? updateWishlistItem : createWishlistItem, initial);
  const router = useRouter();
  useEffect(() => { if (state.saved) { router.refresh(); onSaved?.(); } }, [onSaved, router, state.saved]);
  const fields = <>
    {item && <input type="hidden" name="itemId" value={item.id} />}
    <Field htmlFor="wishlist-title" label="Title" required><Input id="wishlist-title" name="title" required maxLength={160} defaultValue={item?.title ?? ''} placeholder="Matcha KitKats" /></Field>
    <div className="form-columns"><Field htmlFor="wishlist-kind" label="Kind"><Select id="wishlist-kind" name="kind" defaultValue={item?.kind ?? ''}><option value="">Not specified</option>{wishlistKinds.map((kind) => <option value={kind} key={kind}>{label(kind)}</option>)}</Select></Field><Field htmlFor="wishlist-priority" label="Priority"><Select id="wishlist-priority" name="priority" defaultValue={item?.priority ?? ''}><option value="">Not specified</option>{wishlistPriorities.map((priority) => <option value={priority} key={priority}>{label(priority)}</option>)}</Select></Field></div>
    <div className="form-columns"><Field htmlFor="wishlist-country" label="Country"><Input id="wishlist-country" name="country" defaultValue={item?.country ?? ''} placeholder="Japan" /></Field><Field htmlFor="wishlist-area" label="City or area"><Input id="wishlist-area" name="cityArea" defaultValue={item?.cityArea ?? ''} placeholder="Tokyo" /></Field></div>
    <Field htmlFor="wishlist-notes" label="Notes"><Textarea id="wishlist-notes" name="notes" rows={5} defaultValue={item?.notes ?? ''} placeholder="Sizes, shops, or anything else to remember…" /></Field>
  </>;
  if (presentation === 'modal') return <ModalFormLayout action={action} error={state.error} pending={pending} onCancel={() => onCancel?.()}>{fields}</ModalFormLayout>;
  return <form className="idea-form compact-form" action={action}>{fields}{state.error && <p className="auth-error" role="alert">{state.error}</p>}<div className="form-actions"><a className="secondary-link" href="/wishlist">Cancel</a><button className="primary-button" disabled={pending} type="submit">{pending ? 'Saving…' : 'Save'}</button></div></form>;
}
