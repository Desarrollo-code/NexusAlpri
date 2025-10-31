import * as React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps extends React.SVGProps<SVGSVGElement> {
  value: number;
  strokeWidth?: number;
  size?: number;
  showValue?: boolean;
  valueTextClass?: string;
  children?: React.ReactNode;
}

const CircularProgress = React.forwardRef<SVGSVGElement, CircularProgressProps>(
  ({ value, strokeWidth = 10, size = 120, showValue = true, valueTextClass = "text-2xl font-bold", children, className, ...props }, ref) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    // Clamp the value between 0 and 100
    const clampedValue = Math.min(100, Math.max(0, value));
    const offset = circumference - (clampedValue / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          ref={ref}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={cn('-rotate-90', className)}
          {...props}
        >
          <circle
            className="text-muted/30"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className="text-primary"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-baseline justify-center gap-1">
              {children}
              {showValue && (
                <span className={cn('text-foreground', valueTextClass)}>
                  {`${Math.round(clampedValue)}%`}
                </span>
              )}
            </div>
        </div>
      </div>
    );
  }
);
CircularProgress.displayName = 'CircularProgress';

export { CircularProgress };
