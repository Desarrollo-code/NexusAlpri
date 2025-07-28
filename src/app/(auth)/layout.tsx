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
        <aside className="auth-illustration-column">
          <header className="auth-illustration-header">
            <Image
              src="/uploads/images/logo-nexusalpri.png"
              alt="NexusAlpri Icon"
              width={40}
              height={40}
              priority
              className="logo-icon"
              data-ai-hint="logo"
            />
            <span>NexusAlpri SSO</span>
          </header>
          <Image
            src="/uploads/images/auth-illustration.svg"
            alt="NexusAlpri Learning Mascot"
            width={320}
            height={320}
            priority
            className="auth-main-illustration"
            data-ai-hint="learning mascot"
          />
        </aside>
        
        {/* Columna Derecha - Formulario */}
        <main className="auth-form-column">
          <div className="auth-card">
            {children}
          </div>
          <a href="https://alprigrama.com" target="_blank" rel="noopener noreferrer" className="auth-footer-link">
            Powered by 
            <Image
              src="/uploads/images/watermark-alprigrama.png"
              alt="Alprigrama S.A.S."
              width={20}
              height={20}
              className="auth-footer-logo"
              data-ai-hint="company logo"
            />
             Alprigrama
          </a>
        </main>
      </div>
    </div>
  );
}
