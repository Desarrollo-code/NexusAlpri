
import React from 'react';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This wrapper forces the dark theme for auth pages without creating a new <html> or <body> tag,
  // which was the source of the hydration error. It isolates the auth pages' styling.
  return <div className="dark">{children}</div>;
}
