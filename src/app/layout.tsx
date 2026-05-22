import type { Metadata, Viewport } from 'next';
import '../index.css';

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
    <html lang="th">
      <body className="min-h-screen bg-bg text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
