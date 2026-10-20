import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Trip Hub',
    short_name: 'Trip Hub',
    description: 'A private shared space for planning a trip together.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f7f9',
    theme_color: '#f7f7f9',
    icons: [{ src: '/trip-hub-icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
