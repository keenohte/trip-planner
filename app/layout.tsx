import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@daypicker/react/style.css';
import './globals.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/legacy.css';
import './styles/components/avatar.css';
import './styles/components/button.css';
import './styles/components/card.css';
import './styles/components/chip.css';
import './styles/components/grid.css';
import './styles/components/header.css';
import './styles/components/modal.css';
import './styles/components/form.css';
import './styles/components/tabs.css';
import './styles/components/toolbar.css';
import './styles/components/schedule.css';
import './styles/components/vote.css';
import { Nav } from '@/components/Nav';

/* Previously the stylesheet asked for "Inter" by name without ever
   loading it, so every visitor got a fallback system font. next/font
   self-hosts the file and exposes it as --font-inter, which
   app/styles/tokens.css consumes. */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Trip Hub', template: '%s · Trip Hub' },
  description: 'A private shared space for planning a trip together.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/trip-hub-icon.svg' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#F3F4F6' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <main className="shell">
          <Nav />
          {children}
        </main>
      </body>
    </html>
  );
}
