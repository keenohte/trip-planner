import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Trip Hub',
    short_name: 'Trip Hub',
    description: 'A private shared space for planning a trip together.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f0e8',
    theme_color: '#f4f0e8',
    icons: [{ src: '/trip-hub-icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
