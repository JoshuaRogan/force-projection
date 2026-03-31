import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Force Projection: Joint Command',
  description: 'A strategic board game of military force projection and resource management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
