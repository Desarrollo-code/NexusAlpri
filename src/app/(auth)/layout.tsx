import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import './auth.css';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <div className="auth-scope">
      <div className="auth-container">
        
        {/* Columna Izquierda - Ilustración */}
        <aside className="auth-illustration-column">
          <div className="illustration-wrapper">
             <video
                autoPlay
                loop
                muted
                playsInline
                className="auth-main-illustration"
                poster="/uploads/images/auth-illustration-v2.png" // Fallback image
                data-ai-hint="background video"
              >
                  <source src="/uploads/videos/auth-background-video.mp4" type="video/mp4" />
                  Tu navegador no soporta el tag de video.
              </video>
          </div>
        </aside>
        
        {/* Columna Derecha - Formulario */}
        <main className="auth-form-column">
          <div className="auth-card">
             <header className="auth-logo-header">
                <Link href="/" className="auth-logo-link">
                    <Image
                        src="/uploads/images/logo-nexusalpri.png"
                        alt="NexusAlpri Logo"
                        width={180}
                        height={40}
                        className="auth-logo"
                        data-ai-hint="logo"
                    />
                </Link>
            </header>
            <div className="auth-form-content">
              {children}
            </div>
            <div className="auth-page-footer">
                <div className="auth-form-switch-link">
                    <span className="auth-text-secondary">
                        ¿Ya tienes una cuenta?{' '}
                        <Link href="/sign-in" className="auth-link">
                            Inicia sesión
                        </Link>
                    </span>
                </div>
                <div className="auth-card-footer">
                  <a href="https://alprigramasas.com" target="_blank" rel="noopener noreferrer" className="auth-footer-link">
                    <div className="auth-footer-top-line">
                      <span>Desarrollado por</span>
                      <Image
                        src="/uploads/images/watermark-alprigrama.png"
                        alt="Alprigrama S.A.S."
                        width={28}
                        height={28}
                        className="auth-footer-logo"
                        data-ai-hint="company logo"
                      />
                    </div>
                    <span className="auth-footer-company-name">ALL PRINT GRAPHIC & MARKETING SAS - ALPRIGRAMA S.A.S</span>
                  </a>
              </div>
            </div>
          </div>
        </main>
      </div>
      <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
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
  );
}
