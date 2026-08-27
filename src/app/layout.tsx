import type { Metadata, Viewport } from 'next';
import { Prompt } from 'next/font/google';
import '../index.css';

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
  variable: '--font-prompt',
});

export const metadata: Metadata = {
  title: 'QSMS Rework Management',
  description: 'Quality and Scrap Management System Rework Application',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={prompt.variable}>
      <body className={`${prompt.className} min-h-screen bg-bg text-foreground font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
