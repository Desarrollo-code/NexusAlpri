import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import './auth.css';
import { cn } from '@/lib/utils';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div className="auth-scope">
      {/* Video de fondo */}
      <div className="auth-video-background">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="auth-main-illustration"
          poster="/uploads/images/auth-illustration-v2.png"
          data-ai-hint="background video"
        >
            <source src="/uploads/videos/Video_Generado_Listo_http_com_.mp4" type="video/mp4" />
            Tu navegador no soporta el tag de video.
        </video>
      </div>
      
      {/* Contenedor del formulario centrado */}
      <main className="auth-form-container">
        <div className="auth-card">
           <header className="auth-logo-header">
              <Link href="/" className="auth-logo-link">
                  <span className="auth-logo-text">NexusAlpri</span>
                  <Image
                      src="/uploads/images/logo-letter.png"
                      alt="NexusAlpri Letter Logo"
                      width={40}
                      height={40}
                      className="auth-logo"
                      data-ai-hint="logo letter"
                  />
              </Link>
          </header>
          <div className="auth-form-content">
            {children}
          </div>
          
          <footer className="auth-card-footer">
              <a href="https://alprigramasas.com" target="_blank" rel="noopener noreferrer" className="auth-footer-link">
                  <div className="auth-footer-top-line">
                       <span className="text-xs">Desarrollado por</span>
                       <Image
                          src="/uploads/images/watermark-alprigrama.png"
                          alt="Alprigrama Logo"
                          width={100}
                          height={28}
                          className="auth-footer-logo"
                          data-ai-hint="company logo"
                      />
                  </div>
                  <span className="auth-footer-company-name">Alprigrama S.A.S.</span>
              </a>
          </footer>
        </div>
      </main>
    </div>
  );
}
