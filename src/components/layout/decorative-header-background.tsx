// src/components/layout/decorative-header-background.tsx
'use client';
import { cn } from "@/lib/utils";

export const DecorativeHeaderBackground = () => {
    return (
        <div className="absolute inset-0 -z-10 overflow-hidden bg-background">
            <div className="absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/30 to-accent/30 blur-3xl animate-aurora-1" />
            <div className="absolute left-[calc(50%-200px)] top-10 h-[200px] w-[500px] rounded-full bg-gradient-to-tr from-accent/20 to-secondary/20 blur-3xl animate-aurora-2" />
            <div className="absolute left-[calc(50%+100px)] top-20 h-[250px] w-[400px] rounded-full bg-gradient-to-tr from-secondary/20 to-primary/20 blur-3xl animate-aurora-3" />
        </div>
    );
};
