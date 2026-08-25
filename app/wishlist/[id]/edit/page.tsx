import { notFound } from 'next/navigation';
import { WishlistForm } from '../../WishlistForm';
import { deleteWishlistItem } from '../../actions';
import { getCurrentTrip } from '@/lib/trips';
import { getWishlistItem } from '@/lib/wishlist';

type Props = { params: Promise<{ id: string }> };
export default async function EditWishlistItemPage({ params }: Props) {
  const [{ id }, trip] = await Promise.all([params, getCurrentTrip()]);
  if (!trip) notFound();
  const item = await getWishlistItem(trip.id, id);
  if (!item) notFound();
  return <><section className="hero compact-hero"><div className="eyebrow">Wishlist details</div><h2>Edit {item.title}</h2><p>Keep this easy to scan while you are out exploring.</p></section><WishlistForm item={item} /><form className="delete-form" action={deleteWishlistItem}><input type="hidden" name="itemId" value={item.id} /><button className="danger-button" type="submit">Delete item</button></form></>;
}
