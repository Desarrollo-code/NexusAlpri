import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import './auth.css';
import { cn } from '@/lib/utils';
import { ArrowDown } from 'lucide-react';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="auth-scope auth-split-layout">
      {/* Columna Izquierda - Branding */}
      <div className="auth-branding-panel">
        <header className="auth-branding-header">
           <Link href="/" className="auth-logo-link">
              <span className="auth-logo-text-light">NexusAlpri</span>
              <Image
                  src="/uploads/images/logo-nexusalpri.png"
                  alt="NexusAlpri Letter Logo"
                  width={32}
                  height={32}
                  className="auth-logo"
                  data-ai-hint="logo letter"
              />
          </Link>
        </header>
        <div className="auth-branding-content">
            <h1 className="auth-headline">
              Conectando Talento. Creando Futuro.
            </h1>
            <p className="auth-subheadline">
              El epicentro de tu ecosistema de aprendizaje. Organiza, comparte y potencia el conocimiento con herramientas intuitivas y una experiencia de usuario sin igual.
            </p>
            <ArrowDown className="auth-down-arrow" />
        </div>
      </div>

      {/* Columna Derecha - Formulario */}
      <main className="auth-form-panel">
        <div className="auth-form-panel-content">
          {children}
        </div>
      </main>
    </div>
  );
}
