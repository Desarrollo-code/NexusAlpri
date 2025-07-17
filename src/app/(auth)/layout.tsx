
import React from 'react';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout is a simple passthrough.
  // The root layout handles the <html> and <body> tags.
  // The auth pages themselves will have the specific dark background styling.
  return <>{children}</>;
}
