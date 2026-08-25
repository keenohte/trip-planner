import { BookingForm } from '../BookingForm';
import { getCurrentTrip } from '@/lib/trips';

export default async function NewBookingPage() {
  const trip = await getCurrentTrip();
  return <><section className="hero compact-hero"><div className="eyebrow">Operational details</div><h2>Add a Booking</h2><p>Save the information you will need quickly while traveling.</p></section><BookingForm tripTimezone={trip?.timezone ?? 'UTC'} /></>;
}
