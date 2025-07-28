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
            <div className="auth-logo-container">
              <Image
                src="/uploads/images/logo-nexusalpri.png"
                alt="NexusAlpri Logo"
                width={120}
                height={97.5}
                priority
                data-ai-hint="logo education"
                className="drop-shadow-sm"
              />
            </div>
            <Image
              src="/uploads/images/auth-illustration.svg"
              alt="E-learning Illustration"
              width={500}
              height={500}
              priority
              className="auth-main-illustration"
              data-ai-hint="online learning collaboration"
            />
            <h1 className="auth-illustration-title">Bienvenido a NexusAlpri</h1>
            <p className="auth-illustration-subtitle">Tu plataforma para el crecimiento y el aprendizaje continuo.</p>
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
