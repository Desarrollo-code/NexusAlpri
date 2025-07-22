// src/components/ui/download-button.tsx
'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DownloadButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
}

export const DownloadButton = React.forwardRef<HTMLButtonElement, DownloadButtonProps>(
  ({ className, text = "Download", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
            "group relative w-[150px] h-10 cursor-pointer flex items-center border border-primary/80 bg-primary/90 rounded-md overflow-hidden",
            className
        )}
        type="button"
        {...props}
      >
        <span className="button__text absolute left-0 w-full text-center text-primary-foreground font-semibold transform-gpu transition-transform duration-300 group-hover:translate-x-[-150%]">
          {text}
        </span>
        <span className="button__icon absolute w-full h-full flex items-center justify-center bg-primary transform-gpu translate-x-[-100%] transition-transform duration-300 group-hover:translate-x-0">
          <Download className="w-5 h-5 text-primary-foreground" />
        </span>
      </button>
    );
  }
);

DownloadButton.displayName = 'DownloadButton';

    
