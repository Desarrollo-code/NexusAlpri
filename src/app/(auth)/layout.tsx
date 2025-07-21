import React from 'react';
import './auth.css';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="auth-body">
      <div className="floating-elements"></div>
      {children}
    </div>
  );
}
