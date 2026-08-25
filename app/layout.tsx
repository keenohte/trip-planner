import type { Metadata, Viewport } from 'next';
import '@daypicker/react/style.css';
import './globals.css';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: { default: 'Trip Hub', template: '%s · Trip Hub' },
  description: 'A private shared space for planning a trip together.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/trip-hub-icon.svg' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f3f0e7' };

export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><main className="shell"><Nav/>{children}</main></body></html>}
