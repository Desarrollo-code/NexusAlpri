import React from 'react';
import './auth.css';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This wrapper forces the dark theme for auth pages without creating a new <html> or <body> tag.
  return <div className="dark auth-bg">{children}</div>;
}
