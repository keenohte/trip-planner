import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import './mobile.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-app',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Trip Hub', template: '%s · Trip Hub' },
  description: 'A private shared space for planning a trip together.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/trip-hub-icon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#f7f7f9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dmSans.variable}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Trip Hub" />
      </head>
      <body>
        <ServiceWorkerRegistration />
        <main className="app-viewport"><Suspense>{children}</Suspense></main>
      </body>
    </html>
  );
}
