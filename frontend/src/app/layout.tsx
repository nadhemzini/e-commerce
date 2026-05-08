import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { ToastContainer } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: {
    default: 'market — Premium E-Commerce',
    template: '%s | market',
  },
  description:
    'Discover curated products with the best deals. Shop electronics, clothing, books, home goods, and more.',
  keywords: ['e-commerce', 'shopping', 'online store', 'deals'],
  openGraph: {
    type: 'website',
    siteName: 'market',
    title: 'market — Premium E-Commerce',
    description: 'Discover curated products with the best deals.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
        <ThemeProvider>
          <Navbar />
          <main className="page-enter">{children}</main>
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}