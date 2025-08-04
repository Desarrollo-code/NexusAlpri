
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
        <div className="auth-branding-content">
            <h1 className="auth-headline">
              Aprende. Fórmate. Domina.
            </h1>
            <p className="auth-subheadline">
              La plataforma donde tu potencial cobra vida.
            </p>
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
