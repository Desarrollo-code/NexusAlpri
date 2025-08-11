// src/components/layout/animated-background.tsx
import { cn } from "@/lib/utils";

export const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none opacity-50">
      <svg
        width="100%"
        height="100%"
        className="absolute inset-0"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          className="animated-line"
          d="M-200,300 C-100,100 100,500 200,300 S 400,100 500,300 S 700,500 800,300 S 1000,100 1100,300 S 1300,500 1400,300 S 1600,100 1700,300 S 1900,500 2000,300 S 2200,100 2300,300"
          stroke="hsl(var(--primary) / 0.2)"
          fill="none"
          strokeWidth="2"
        />
        <path
          className="animated-line"
          style={{ animationDelay: '-15s' }}
          d="M-200,600 C-100,400 100,800 200,600 S 400,400 500,600 S 700,800 800,600 S 1000,400 1100,600 S 1300,800 1400,600 S 1600,400 1700,600 S 1900,800 2000,600 S 2200,400 2300,600"
          stroke="hsl(var(--accent) / 0.2)"
          fill="none"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};
