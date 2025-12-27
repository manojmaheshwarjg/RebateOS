'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { LocalStorageProvider } from '@/components/local-storage-provider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <title>RebateOS</title>
        <meta name="description" content="The future of rebate management." />
      </head>
      <body className="font-body antialiased">
        <LocalStorageProvider>
          {children}
        </LocalStorageProvider>
        <Toaster />
      </body>
    </html>
  );
}
