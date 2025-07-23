import React from 'react';
import Image from 'next/image';
import './auth.css';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="auth-scope">
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center">
              <Image
                src="/uploads/images/logo-nexusalpri.png"
                alt="NexusAlpri Logo"
                width={150}
                height={122}
                priority
                data-ai-hint="logo education"
                className="mb-6 drop-shadow-[0_5px_15px_rgba(255,215,0,0.2)]"
              />
              {children}
          </div>
        </div>
        <div className="fixed bottom-4 right-4 z-0 pointer-events-none">
          <Image
            src="/uploads/images/watermark-alprigrama.png"
            alt="Alprigrama S.A.S. Watermark"
            width={60}
            height={60}
            className="watermark-img"
            data-ai-hint="company logo"
          />
        </div>
      </div>
    </div>
  );
}
