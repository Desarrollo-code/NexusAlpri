import React from 'react';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-8">
        <Image
          src="/uploads/images/logo-nexusalpri.png"
          alt="NexusAlpri Logo"
          width={140}
          height={114}
          priority
          data-ai-hint="logo education"
        />
      </div>
      
      {children}
      
      <div className="fixed bottom-4 right-4 z-0 pointer-events-none">
        <Image
          src="/uploads/images/watermark-alprigrama.png"
          alt="Alprigrama S.A.S. Watermark"
          width={70}
          height={70}
          className="watermark-img"
          data-ai-hint="company logo"
        />
      </div>
    </div>
  );
}
