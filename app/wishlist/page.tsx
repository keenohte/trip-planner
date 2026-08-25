import Link from 'next/link';
import { TableRealtimeRefresh } from '@/components/TableRealtimeRefresh';
import { NewWishlistTrigger } from '@/components/CreateRecordTriggers';
import { WishlistToggle } from '@/components/WishlistToggle';
import { getCurrentTrip } from '@/lib/trips';
import { getWishlistItems } from '@/lib/wishlist';

const label = (value: string) => value.replace('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
export default async function WishlistPage() {
  const trip = await getCurrentTrip();
  const items = trip ? await getWishlistItems(trip.id) : [];
  return <>{trip && <TableRealtimeRefresh tripId={trip.id} table="wishlist_items" />}<div className="simple-page-toolbar"><div><h2>Wishlist</h2><p>Things to try, find, or bring home.</p></div><NewWishlistTrigger className="primary-link">+ Add item</NewWishlistTrigger></div>{items.length > 0 ? <div className="wishlist-list">{items.map((item) => <article className={`wishlist-row${item.done ? ' done' : ''}`} key={item.id}><WishlistToggle id={item.id} tripId={item.tripId} done={item.done} title={item.title} /><Link href={`/wishlist/${item.id}/edit`}><strong>{item.title}</strong><small>{[item.kind && label(item.kind), item.cityArea || item.country, item.priority && `${label(item.priority)} priority`].filter(Boolean).join(' · ') || 'No details added'}</small></Link></article>)}</div> : <section className="empty-state"><h3>Wishlist is empty</h3><p>Food to try, gifts to find, and things to bring home all fit here.</p><NewWishlistTrigger className="primary-link">Add your first item</NewWishlistTrigger></section>}</>;
}
