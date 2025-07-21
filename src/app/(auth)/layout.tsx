import React from 'react';
import Image from 'next/image';
import './auth.css';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="dark auth-bg">
      <div className="relative z-10">{children}</div>
      <div className="fixed bottom-4 right-4 z-0 pointer-events-none">
        <Image
          src="/uploads/images/watermark-alprigrama.png"
          alt="Alprigrama S.A.S. Watermark"
          width={70}
          height={70}
          className="opacity-40"
          data-ai-hint="company logo"
        />
      </div>
    </div>
  );
}
