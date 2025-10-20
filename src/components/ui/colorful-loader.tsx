// src/components/ui/colorful-loader.tsx
'use client';

import * as React from 'react';

export const ColorfulLoader = () => {
  return (
    <div
      className="loader"
      style={{
        position: 'relative',
        width: '75px',
        height: '100px',
        backgroundRepeat: 'no-repeat',
        backgroundImage: `
          linear-gradient(hsl(var(--chart-1)) 50px, transparent 0),
          linear-gradient(hsl(var(--chart-2)) 50px, transparent 0),
          linear-gradient(hsl(var(--chart-3)) 50px, transparent 0),
          linear-gradient(hsl(var(--chart-4)) 50px, transparent 0),
          linear-gradient(hsl(var(--chart-5)) 50px, transparent 0)
        `,
        backgroundSize: '8px 100%',
        backgroundPosition: '0px 90px, 15px 78px, 30px 66px, 45px 58px, 60px 50px',
        animation: 'pillerPushUp 4s linear infinite',
      }}
    >
      <style jsx>{`
        .loader::after {
          content: '';
          position: absolute;
          bottom: 10px;
          left: 0;
          width: 10px;
          height: 10px;
          background: hsl(var(--accent));
          border-radius: 50%;
          animation: ballStepUp 4s linear infinite;
        }
      `}</style>
    </div>
  );
};
