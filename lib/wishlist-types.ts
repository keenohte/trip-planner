export const wishlistKinds = ['buy', 'eat_drink', 'do', 'find', 'souvenir'] as const;
export const wishlistPriorities = ['high', 'medium', 'low'] as const;
export type WishlistKind = (typeof wishlistKinds)[number];
export type WishlistPriority = (typeof wishlistPriorities)[number];
