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
    <html lang="th" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="h-full overflow-hidden bg-bg text-foreground font-sans antialiased">
        <div id="root" className="h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
