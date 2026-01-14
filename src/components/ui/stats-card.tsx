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
    color = "default", // Now defaults to a theme-aware style
    className
}: StatsCardProps) {
    const colorStyles = {
        // "default" variant now uses the primary theme color dynamically
        default: "bg-primary/10 text-primary border-primary/20",
        blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900",
        green: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900",
        purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900",
        orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900",
        indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900",
    };

    // If a color is passed that isn't in the map, fallback to default or handle it? 
    // Typescript ensures keys match, but just in case of dynamic usage:
    const activeColorStyle = colorStyles[color] || colorStyles.default;

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
                    <div className={cn("p-3 rounded-xl shrink-0 border", activeColorStyle)}>
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
