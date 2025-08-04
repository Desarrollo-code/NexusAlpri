
import React from 'react';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div className="w-full max-w-md mx-auto p-4 md:p-6">
          {children}
      </div>
  );
}
