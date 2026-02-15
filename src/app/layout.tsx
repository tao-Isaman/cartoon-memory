import type { Metadata } from 'next';
import { Kanit, Itim, Leckerli_One } from 'next/font/google';
import ClientProviders from '@/components/ClientProviders';
import './globals.css';

const kanit = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-kanit',
  display: 'swap',
});

const itim = Itim({
  subsets: ['thai', 'latin'],
  weight: ['400'],
  variable: '--font-itim',
  display: 'swap',
});

const leckerli = Leckerli_One({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-leckerli',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cartoon Gen - เปลี่ยนรูปเป็นการ์ตูน',
  description: 'เปลี่ยนรูปภาพของคุณเป็นการ์ตูนสุดน่ารักด้วย AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${kanit.variable} ${itim.variable} ${leckerli.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
