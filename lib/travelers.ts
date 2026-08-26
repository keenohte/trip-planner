export type Traveler = 'male' | 'female';

export function travelerForRole(role: 'owner' | 'member' | undefined): Traveler {
  return role === 'member' ? 'female' : 'male';
}
