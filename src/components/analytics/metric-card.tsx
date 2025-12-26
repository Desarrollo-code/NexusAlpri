// src/components/analytics/metric-card.tsx
'use client';
import { Card } from "@/components/ui/card"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";

export const MetricCard = ({
    title,
    value,
    icon: Icon,
    description,
    suffix = '',
    index = 0,
    onClick,
    gradient
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    description?: string;
    suffix?: string;
    index?: number;
    onClick?: () => void;
    gradient?: string;
}) => {
    const animatedValue = useAnimatedCounter(value, 0, 1000);

    // Modern predefined gradients if none is provided
    const gradients = [
        "from-blue-600/20 to-indigo-600/20 shadow-blue-500/10",
        "from-emerald-600/20 to-teal-600/20 shadow-emerald-500/10",
        "from-violet-600/20 to-purple-600/20 shadow-violet-500/10",
        "from-amber-600/20 to-orange-600/20 shadow-amber-500/10",
        "from-rose-600/20 to-pink-600/20 shadow-rose-500/10",
        "from-cyan-600/20 to-sky-600/20 shadow-cyan-500/10",
        "from-fuchsia-600/20 to-purple-600/20 shadow-fuchsia-500/10",
        "from-slate-600/20 to-slate-800/20 shadow-slate-500/10"
    ];

    const borderColors = [
        "border-blue-500/30",
        "border-emerald-500/30",
        "border-violet-500/30",
        "border-amber-500/30",
        "border-rose-500/30",
        "border-cyan-500/30",
        "border-fuchsia-500/30",
        "border-slate-500/30"
    ];

    const iconColors = [
        "text-blue-500",
        "text-emerald-500",
        "text-violet-500",
        "text-amber-500",
        "text-rose-500",
        "text-cyan-500",
        "text-fuchsia-500",
        "text-slate-500"
    ];

    const selectedGradient = gradients[index % gradients.length];
    const selectedBorder = borderColors[index % borderColors.length];
    const selectedIconColor = iconColors[index % iconColors.length];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="h-full"
        >
            <Card
                onClick={onClick}
                className={cn(
                    "relative overflow-hidden h-full flex flex-col justify-between p-5 transition-all duration-300",
                    "bg-white/40 dark:bg-black/40 backdrop-blur-xl",
                    "border border-white/20 dark:border-white/10",
                    "hover:shadow-2xl hover:bg-white/60 dark:hover:bg-black/60",
                    "group cursor-default",
                    onClick && "cursor-pointer",
                    selectedBorder
                )}
            >
                {/* Background Glow */}
                <div className={cn(
                    "absolute -right-10 -top-10 w-32 h-32 blur-3xl opacity-20 rounded-full bg-gradient-to-br",
                    selectedGradient
                )} />

                <div className="flex justify-between items-start z-10">
                    <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                            {title}
                        </p>
                    </div>
                    {Icon && (
                        <div className={cn(
                            "p-2 rounded-lg bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/20 dark:border-white/5 shadow-sm transition-transform group-hover:scale-110",
                            selectedIconColor
                        )}>
                            <Icon className="h-5 w-5" />
                        </div>
                    )}
                </div>

                <div className="mt-4 z-10">
                    <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                            {animatedValue}{suffix}
                        </p>
                    </div>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-1 font-medium italic">
                            {description}
                        </p>
                    )}
                </div>

                {/* Bottom decorative bar */}
                <div className={cn(
                    "absolute bottom-0 left-0 h-1 transition-all duration-300 group-hover:w-full w-2",
                    "bg-gradient-to-r",
                    selectedGradient.split(' ')[0],
                    selectedGradient.split(' ')[1]
                )} />
            </Card>
        </motion.div>
    );
};
