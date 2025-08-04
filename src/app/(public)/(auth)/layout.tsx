import React from 'react';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex-1 flex items-center justify-center py-12 md:py-24">
      <div className="w-full max-w-md mx-auto p-4 md:p-0">
          {children}
      </div>
    </div>
  );
}
