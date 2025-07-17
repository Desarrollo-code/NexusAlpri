
import React from 'react';
import './auth.css';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This wrapper forces the dark theme for auth pages without creating a new <html> or <body> tag.
  // It also ensures the specific auth.css is loaded only for these routes.
  return <div className="dark">{children}</div>;
}
