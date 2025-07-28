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
      <div className="auth-container">
        {/* Columna Izquierda - Ilustración (visible en pantallas grandes) */}
        <div className="auth-illustration-column">
          <div className="auth-illustration-content">
            <Image
              src="/uploads/images/auth-illustration.svg"
              alt="NexusAlpri Illustration"
              width={500}
              height={500}
              priority
              className="auth-main-illustration"
              data-ai-hint="online learning collaboration"
            />
          </div>
        </div>
        
        {/* Columna Derecha - Formulario */}
        <div className="auth-form-column">
          {children}
          <div className="auth-watermark">
            <Image
              src="/uploads/images/watermark-alprigrama.png"
              alt="Alprigrama S.A.S. Watermark"
              width={60}
              height={60}
              priority
              className="watermark-img"
              data-ai-hint="company logo"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
