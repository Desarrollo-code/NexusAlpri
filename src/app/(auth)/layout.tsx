
import React from 'react';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This wrapper forces the dark theme for auth pages without creating a new <html> or <body> tag.
  return <div className="dark">{children}</div>;
}
