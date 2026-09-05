import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | AI EDS Developer',
    default: 'AI EDS Developer',
  },
  description:
    'Autonomous AI engineering platform for AEM Edge Delivery Services — from design to production-ready EDS, autonomously.',
  keywords: ['AEM', 'Edge Delivery Services', 'AI', 'autonomous', 'EDS'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
