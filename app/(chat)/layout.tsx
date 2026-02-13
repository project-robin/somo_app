'use client';

import { ReactNode } from 'react';

export default function ChatLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="h-screen w-full">
      {children}
    </div>
  );
}
