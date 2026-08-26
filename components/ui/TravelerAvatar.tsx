import Image from 'next/image';
import type { Traveler } from '@/lib/travelers';

const travelerPhotos: Record<Traveler, string> = {
  male: '/avatars/male.jpg',
  female: '/avatars/female.jpg',
};

export function TravelerAvatar({ traveler, size = 'vote' }: { traveler: Traveler; size?: 'vote' | 'profile' }) {
  return (
    <span className={`traveler-avatar traveler-avatar--${traveler} traveler-avatar--${size}`} aria-hidden="true">
      <Image src={travelerPhotos[traveler]} alt="" fill sizes={size === 'profile' ? '44px' : '26px'} />
    </span>
  );
}
