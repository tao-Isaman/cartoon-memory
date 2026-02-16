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

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cartoon-gen.app';

export const metadata: Metadata = {
  title: {
    default: 'Cartoon Gen - สร้างรูปการ์ตูน AI | วาดรูปการ์ตูนออนไลน์',
    template: '%s | Cartoon Gen',
  },
  description:
    'สร้างรูปการ์ตูนจากรูปถ่ายด้วย AI ฟรี วาดรูปการ์ตูนออนไลน์ เปลี่ยนรูปเป็นการ์ตูนสุดน่ารัก แปลงรูปเป็นการ์ตูน อัพโหลดรูปแล้วได้การ์ตูนทันที หลายสไตล์ให้เลือก ไม่มีลายน้ำ',
  keywords: [
    'สร้างรูปการ์ตูน',
    'วาดรูปการ์ตูน',
    'เปลี่ยนรูปเป็นการ์ตูน',
    'แปลงรูปเป็นการ์ตูน',
    'AI สร้างการ์ตูน',
    'วาดการ์ตูน AI',
    'รูปการ์ตูน AI',
    'เปลี่ยนรูปถ่ายเป็นการ์ตูน',
    'แอพวาดรูปการ์ตูน',
    'ทำรูปการ์ตูนออนไลน์',
    'cartoon generator',
    'AI cartoon',
    'photo to cartoon',
  ],
  authors: [{ name: 'Cartoon Gen' }],
  creator: 'Cartoon Gen',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: siteUrl,
    siteName: 'Cartoon Gen',
    title: 'Cartoon Gen - สร้างรูปการ์ตูน AI | วาดรูปการ์ตูนออนไลน์',
    description:
      'สร้างรูปการ์ตูนจากรูปถ่ายด้วย AI ฟรี วาดรูปการ์ตูนออนไลน์ เปลี่ยนรูปเป็นการ์ตูนสุดน่ารัก หลายสไตล์ให้เลือก ไม่มีลายน้ำ',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Cartoon Gen - สร้างรูปการ์ตูน AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cartoon Gen - สร้างรูปการ์ตูน AI | วาดรูปการ์ตูนออนไลน์',
    description:
      'สร้างรูปการ์ตูนจากรูปถ่ายด้วย AI ฟรี วาดรูปการ์ตูนออนไลน์ เปลี่ยนรูปเป็นการ์ตูนสุดน่ารัก',
    images: ['/twitter-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'your-google-site-verification-code',
  },
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
