
import React from 'react';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-md flex-col items-center">
        <Image
          src="/uploads/images/logo-nexusalpri.png"
          alt="NexusAlpri Logo"
          width={150}
          height={122}
          priority
          data-ai-hint="logo education"
          className="mb-8"
        />
        {children}
      </div>
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
