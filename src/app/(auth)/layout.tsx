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
                  <source src="/uploads/videos/Video_Generado_Listo_http_com_.mp4" type="video/mp4" />
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
            
          </div>
        </main>
      </div>
    </div>
  );
}
