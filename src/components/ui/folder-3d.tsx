
import { cn } from "@/lib/utils";
import React from 'react';

export const Folder3D = () => {
  return (
    <div className={cn(
        "relative group flex flex-col items-center justify-center w-full h-full",
        "[perspective:1500px]"
    )}>
        <div className="file relative w-full h-full cursor-pointer origin-bottom z-10 transition-transform duration-500 group-hover:[transform:translateZ(30px)]">
            <div className={cn(
                "w-full h-full origin-top rounded-2xl rounded-tl-none transition-all ease-in-out duration-300 relative",
                "bg-primary",
                "group-hover:shadow-[0_20px_40px_rgba(0,0,0,.2)]",
                "after:absolute after:content-[''] after:bottom-[99%] after:left-0 after:w-1/3 after:h-4 after:bg-primary after:rounded-t-2xl",
                "before:absolute before:content-[''] before:-top-[15px] before:left-[32.5%] before:w-4 before:h-4 before:bg-primary before:[clip-path:polygon(0_35%,0%_100%,50%_100%);]"
            )} />
            <div className={cn(
                "absolute inset-1 rounded-2xl transition-all ease-in-out duration-300 origin-bottom select-none",
                "bg-card",
                "group-hover:[transform:rotateX(-20deg)]"
            )} />
            <div className={cn(
                "absolute inset-1 rounded-2xl transition-all ease-in-out duration-300 origin-bottom",
                "bg-muted/80",
                "group-hover:[transform:rotateX(-30deg)]"
            )} />
            <div className={cn(
                "absolute inset-1 rounded-2xl transition-all ease-in-out duration-300 origin-bottom",
                "bg-muted/60",
                "group-hover:[transform:rotateX(-38deg)]"
            )} />
            <div className={cn(
                "absolute bottom-0 w-full h-[98%] rounded-2xl rounded-tr-none transition-all ease-in-out duration-300 origin-bottom flex items-end",
                "bg-gradient-to-t from-primary/80 to-primary",
                "group-hover:shadow-[inset_0_20px_40px_hsl(var(--primary-darker)),_inset_0_-20px_40px_hsl(var(--primary-lighter))]",
                "group-hover:[transform:rotateX(-46deg)_translateY(1px)]",
                "after:absolute after:content-[''] after:bottom-[99%] after:right-0 after:w-2/3 after:h-[16px] after:bg-primary after:rounded-t-2xl",
                "before:absolute before:content-[''] before:-top-[10px] before:right-[65.5%] before:size-3 before:bg-primary before:[clip-path:polygon(100%_14%,50%_100%,100%_100%);]"
            )} />
        </div>
    </div>
  );
}
