export const bookingTypes = ['flight', 'hotel', 'train', 'transit', 'restaurant', 'experience', 'event', 'ticket', 'other'] as const;
export type BookingType = (typeof bookingTypes)[number];
