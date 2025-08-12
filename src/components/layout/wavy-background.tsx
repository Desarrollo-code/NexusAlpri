// src/components/layout/wavy-background.tsx
'use client';
import { cn } from '@/lib/utils';

export const WavyBackground = () => {
  return (
    <div className={cn(
        "absolute inset-0 z-0 overflow-hidden",
        "bg-background"
    )}>
        <svg
            className="absolute bottom-0 left-0 w-full h-auto text-primary/10"
            width="100%"
            viewBox="0 0 1440 320"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
        >
            <path
                fill="currentColor"
                fillOpacity="1"
                d="M0,224L80,213.3C160,203,320,181,480,186.7C640,192,800,224,960,218.7C1120,213,1280,171,1360,149.3L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
            ></path>
        </svg>
        <svg
            className="absolute bottom-0 left-0 w-full h-auto text-accent/10"
            style={{ transform: 'translateY(20px) scaleX(-1)'}}
            width="100%"
            viewBox="0 0 1440 320"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
        >
            <path
                fill="currentColor"
                fillOpacity="1"
                d="M0,160L60,181.3C120,203,240,245,360,256C480,267,600,245,720,208C840,171,960,117,1080,117.3C1200,117,1320,171,1380,197.3L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
            ></path>
        </svg>
    </div>
  );
};
