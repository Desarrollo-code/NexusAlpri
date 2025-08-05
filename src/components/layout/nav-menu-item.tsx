// src/components/layout/nav-menu-item.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "./sidebar-menu-button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";
import React from "react";
import type { NavItem } from "@/types"; // Importa el tipo NavItem desde tu archivo de tipos

interface NavMenuItemProps {
  item: NavItem;
  sidebarState: 'expanded' | 'collapsed';
}

export function NavMenuItem({ item, sidebarState }: NavMenuItemProps) {
  const pathname = usePathname();
  const isActive = !!item.path && pathname === item.path;
  const hasSubItems = item.children && item.children.length > 0;

  // Renderiza un ítem de navegación simple
  if (!hasSubItems) {
    return (
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <SidebarMenuButton 
              asChild 
              isActive={isActive} 
              isChild={false} 
              className={cn(
                "justify-start",
                sidebarState === 'collapsed' && "justify-center"
              )}
            >
              <Link href={item.path}>
                <item.icon size="24" />
                <span className={cn(
                  "font-medium whitespace-nowrap",
                  sidebarState === 'collapsed' && "hidden"
                )}>
                  {item.label}
                </span>
              </Link>
            </SidebarMenuButton>
          </TooltipTrigger>
          {sidebarState === 'collapsed' && (
            <TooltipContent side="right" sideOffset={12}>
              {item.label}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Renderiza un ítem de navegación con sub-ítems (Acordeón)
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={item.id} className="border-b-0">
        <AccordionTrigger
          className={cn(
            "group/trigger h-12 py-0 hover:no-underline rounded-md px-4 text-sidebar-foreground hover:bg-sidebar-hover transition-colors",
            "justify-start",
            sidebarState === 'collapsed' && "justify-center"
          )}
        >
          <div className="flex items-center gap-2">
            <item.icon size="24" />
            <span className={cn(
              "font-medium whitespace-nowrap",
              sidebarState === 'collapsed' && "hidden"
            )}>
              {item.label}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200",
              sidebarState === 'collapsed' && "hidden"
            )}
          />
        </AccordionTrigger>
        <AccordionContent className="pb-1">
          {item.children.map((subItem) => (
            <SidebarMenuButton 
              key={subItem.id} 
              asChild 
              isActive={pathname === subItem.path} 
              isChild={true} 
              className={cn(
                "justify-start",
                sidebarState === 'collapsed' && "justify-center"
              )}
            >
              <Link href={subItem.path}>
                <subItem.icon size="20" />
                <span className={cn(
                  "font-medium whitespace-nowrap",
                  sidebarState === 'collapsed' && "hidden"
                )}>
                  {subItem.label}
                </span>
              </Link>
            </SidebarMenuButton>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}