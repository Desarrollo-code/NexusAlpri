
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type CursorCardsContainerProps = {
  children: React.ReactNode;
  className?: string;
};

const CursorCardsContainer = React.forwardRef<
  HTMLDivElement,
  CursorCardsContainerProps
>(({ children, className }, ref) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const containerNode = containerRef.current;
    if (!containerNode) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerNode.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      containerNode.style.setProperty("--cursor-x", `${x}px`);
      containerNode.style.setProperty("--cursor-y", `${y}px`);
    };

    containerNode.addEventListener("mousemove", handleMouseMove);

    return () => {
      containerNode.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full",
        "[--cursor-x:50%] [--cursor-y:50%]",
        className
      )}
    >
      {children}
    </div>
  );
});
CursorCardsContainer.displayName = "CursorCardsContainer";

type CursorCardProps = {
  children: React.ReactNode;
  className?: string;
  borderColor?: string;
  primaryHue?: string;
  secondaryHue?: string;
};

const CursorCard = React.forwardRef<HTMLDivElement, CursorCardProps>(
  (
    {
      children,
      className,
      borderColor,
      primaryHue = "333", // Default: pinkish
      secondaryHue = "33", // Default: orangish
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        style={
          {
            "--border-color": borderColor,
            "--primary-hue": primaryHue,
            "--secondary-hue": secondaryHue,
            background: `
              radial-gradient(
                350px circle at var(--cursor-x) var(--cursor-y),
                hsl(var(--primary-hue), 90%, 50%, 0.15),
                transparent 40%
              )
            `,
          } as React.CSSProperties
        }
        className={cn(
          "relative w-full h-full p-[1px] rounded-xl transition-all duration-300 ease-in-out",
          className
        )}
      >
        <div
          className="w-full h-full rounded-[inherit]"
          style={
            {
              background: `
                radial-gradient(
                  450px circle at var(--cursor-x) var(--cursor-y),
                  hsl(var(--secondary-hue), 70%, 50%, 0.08),
                  transparent 40%
                )
              `,
            } as React.CSSProperties
          }
        >
          {children}
        </div>

        {/* Border */}
        <div
          className="absolute inset-0 w-full h-full rounded-[inherit] border border-[var(--border-color)] opacity-10"
          style={
            {
              "mask-image": `
                radial-gradient(
                  250px 150px at var(--cursor-x) var(--cursor-y),
                  black,
                  transparent
                )
              `,
              "-webkit-mask-image": `
                radial-gradient(
                  250px 150px at var(--cursor-x) var(--cursor-y),
                  black,
                  transparent
                )
              `,
            } as React.CSSProperties
          }
        />
      </div>
    );
  }
);
CursorCard.displayName = "CursorCard";

export { CursorCardsContainer, CursorCard };

