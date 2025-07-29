import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import './auth.css';
import { usePathname } from 'next/navigation'; // Hook para obtener la ruta actual

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Nota: Este es un Server Component, pero podemos usar hooks que no dependen de estado de cliente, o pasarlos desde un client component.
  // Para simplicidad, se asume que un componente cliente superior podría pasar el pathname o se usa un truco para obtenerlo si es necesario.
  // Sin embargo, para este layout, vamos a estructurarlo para que funcione en el servidor y delegue la lógica dinámica a los componentes hijos.

  return (
    <div className="auth-scope">
      <div className="auth-container">
        
        {/* Columna Izquierda - Ilustración */}
        <aside className="auth-illustration-column">
          <div className="illustration-wrapper">
             <Image
              src="/uploads/images/auth-illustration.png"
              alt="NexusAlpri Learning Illustration"
              fill
              priority
              className="auth-main-illustration"
              data-ai-hint="learning illustration"
            />
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
             <footer className="auth-card-footer">
              <a href="https://alprigramasas.com" target="_blank" rel="noopener noreferrer" className="auth-footer-link">
                <div className="auth-footer-top-line">
                  <span>Desarrollado por</span>
                  <Image
                    src="/uploads/images/watermark-alprigrama.png"
                    alt="Alprigrama S.A.S."
                    width={24}
                    height={24}
                    className="auth-footer-logo"
                    data-ai-hint="company logo"
                  />
                </div>
                <span className="auth-footer-company-name">ALL PRINT GRAPHIC & MARKETING SAS - ALPRIGRAMA S.A.S</span>
              </a>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
