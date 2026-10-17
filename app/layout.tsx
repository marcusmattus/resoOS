import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'ResOS - Resonate Origin System',
  description: 'Biofield electromagnetic scanner, neural link bio chart, biometric resonance therapy, and real-time visual feedback loops.',
  openGraph: {
    title: 'ResOS - Resonate Origin System',
    description: 'Biofield electromagnetic scanner, neural link bio chart, biometric resonance therapy, and real-time visual feedback loops.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResOS - Resonate Origin System',
    description: 'Biofield electromagnetic scanner, neural link bio chart, biometric resonance therapy, and real-time visual feedback loops.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
