import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    icon: LucideIcon | React.ElementType;
    label: string;
    value: string | number;
    subtitle?: string;
    trend?: string;
    color?: "blue" | "green" | "purple" | "orange" | "indigo" | "default";
    className?: string;
}

export function StatsCard({
    icon: Icon,
    label,
    value,
    subtitle,
    trend,
    color = "default",
    className
}: StatsCardProps) {
    // Map legacy color prop to theme-aware classes if needed, 
    // or just use a standard theme-aware styling for all.
    // The user requested: "deben adaptarse al tema".
    // So we typically use primary/secondary variants or specific semantic colors.

    // We can keep the "color" prop for subtle variations (e.g. different icons),
    // but the background should probably be consistent or use CSS variables.

    const colorStyles = {
        default: "bg-primary/10 text-primary",
        blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        green: "bg-green-500/10 text-green-600 dark:text-green-400",
        purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
        orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
        indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    };

    return (
        <Card className={cn("overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300", className)}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{label}</p>
                        <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">{subtitle}</p>
                        )}
                    </div>
                    <div className={cn("p-3 rounded-xl shrink-0", colorStyles[color])}>
                        <Icon className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                </div>
                {trend && (
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground">{trend}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
