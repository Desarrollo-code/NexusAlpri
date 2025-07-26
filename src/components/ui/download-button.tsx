// src/components/ui/download-button.tsx
'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface DownloadButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
}

export const DownloadButton = React.forwardRef<HTMLButtonElement, DownloadButtonProps>(
  ({ className, text = "Download", ...props }, ref) => {
    return (
      <Button ref={ref} className={cn(className)} {...props}>
          <Download className="mr-2 h-4 w-4" />
          {text}
      </Button>
    );
  }
);

DownloadButton.displayName = 'DownloadButton';
