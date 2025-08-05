
'use client';

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { ChevronsRight, Menu, ChevronDown, type LucideProps, Shield } from "lucide-react"
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { NavItem } from "@/types";
import { getNavItemsForRole } from "@/lib/nav-items";
import { useAuth } from "@/contexts/auth-context";
import { GradientIcon } from "./gradient-icon";

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

type SidebarContextValue = {
  state: "expanded" | "collapsed"
  isMobile: boolean
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  toggleSidebar: () => void
  activeItem: string;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

const SidebarProvider = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, style, children, ...props }, ref) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)
    const pathname = usePathname();
    const [activeItem, setActiveItem] = React.useState(pathname);
    const [isOpen, setIsOpen] = React.useState(true);

    React.useEffect(() => {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
        ?.split('=')[1];
      if (cookieValue !== undefined) {
        setIsOpen(cookieValue === 'true');
      } else {
        setIsOpen(true);
      }
    }, []);

    const toggleSidebar = React.useCallback(() => {
      if (isMobile) {
        setOpenMobile(current => !current);
      } else {
        const newState = !isOpen;
        setIsOpen(newState);
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${newState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      }
    }, [isMobile, isOpen]);

    React.useEffect(() => {
      if (pathname) setActiveItem(pathname);
    }, [pathname]);

    const state = isOpen ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContextValue>(
      () => ({ state, isMobile, openMobile, setOpenMobile, toggleSidebar, activeItem }),
      [state, isMobile, openMobile, toggleSidebar, activeItem]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div style={{ ...style } as React.CSSProperties} className={className} ref={ref} {...props}>
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()
    if (isMobile) {
      return (
        <>
          {openMobile && <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setOpenMobile(false)} />}
          <aside ref={ref} className={cn("fixed left-0 top-0 h-full z-50 bg-gradient-to-b from-sidebar-gradient-from to-sidebar-gradient-to border-r border-sidebar-border transition-transform duration-300 flex flex-col", openMobile ? 'translate-x-0' : '-translate-x-full', 'w-72', className)} {...props}>
            {children}
          </aside>
        </>
      )
    }

    return (
      <aside ref={ref} className={cn("group/sidebar-wrapper fixed inset-y-0 left-0 z-40 flex h-screen flex-col text-sidebar-foreground transition-[width] duration-300 ease-in-out bg-gradient-to-b from-sidebar-gradient-from to-sidebar-gradient-to border-r border-sidebar-border", state === 'expanded' ? "w-72" : "w-20", className)} data-state={state} {...props}>
        <div className="flex h-full flex-col overflow-hidden">
          {children}
        </div>
      </aside>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<React.ElementRef<typeof Button>, React.ComponentProps<typeof Button>>(
  ({ className, onClick, ...props }, ref) => {
    const { toggleSidebar } = useSidebar()
    return (
      <Button ref={ref} variant="ghost" size="icon" className={cn("h-9 w-9", className)} onClick={(e) => { onClick?.(e); toggleSidebar(); }} {...props}>
        <Menu />
        <span className="sr-only">Alternar Barra Lateral</span>
      </Button>
    )
  }
)
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex shrink-0 items-center justify-between h-16 px-4 border-b border-sidebar-border", className)} {...props} />
  )
)
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col p-4 mt-auto border-t border-sidebar-border", className)} {...props} />
  )
)
SidebarFooter.displayName = "SidebarFooter"

const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    const { user } = useAuth();
    const navItems = React.useMemo(() => getNavItemsForRole(user?.role || 'STUDENT'), [user?.role]);
    return (
      <div ref={ref} className={cn("flex min-h-0 flex-1 flex-col overflow-auto px-4 py-2 space-y-1", className)} {...props}>
        <SidebarMenu>
          {navItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <SidebarMenuItem item={item} />
              {(item.id === 'calendar' || (item.id === 'admin' && item.children && item.children.length > 0)) && <SidebarMenuSeparator />}
            </React.Fragment>
          ))}
        </SidebarMenu>
      </div>
    )
  }
)
SidebarContent.displayName = "SidebarContent"

const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex w-full min-w-0 flex-col gap-1", className)} {...props} />
  )
)
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<HTMLLIElement, { item: NavItem } & React.ComponentProps<"li">>(
  ({ className, item, ...props }, ref) => {
    const { state, activeItem } = useSidebar();
    const hasChildren = item.children && item.children.length > 0;
    
    const isActive = hasChildren 
        ? item.children.some(child => child.path && activeItem.startsWith(child.path)) 
        : (item.path ? (item.path === '/' ? activeItem === '/' : activeItem.startsWith(item.path)) : false);

    if (hasChildren) {
      return (
        <li ref={ref} className={cn("group/menu-item relative space-y-1 pt-2", className)} {...props}>
          {state === 'expanded' ? (
             <h4 className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-sidebar-foreground/70">
                 <GradientIcon icon={item.icon || Shield} isActive={isActive} color={item.color} />
                 {item.label}
             </h4>
          ) : (
             <div className="my-2 h-px bg-white/10" />
          )}
            <ul className={cn("space-y-1", state === 'expanded' && "ml-4 pl-3 border-l border-white/10")}>
                {item.children.map(child => (
                    <SidebarMenuItem key={child.id} item={child} />
                ))}
            </ul>
        </li>
      )
    }

    return (
      <li ref={ref} className={cn("group/menu-item relative", className)} {...props}>
        <SidebarMenuButton asChild tooltip={{ children: item.label }}>
          <Link href={item.path || '#'}>
            <GradientIcon icon={item.icon} isActive={isActive} />
            <span className={cn("sidebar-text flex-1 text-left font-medium transition-all duration-300", state === 'collapsed' && 'hidden')}>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </li>
    )
  }
)
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarMenuSeparator = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    const { state } = useSidebar();
    if (state === 'collapsed') return null;
    return <div ref={ref} className={cn("my-2 h-px bg-white/10", className)} {...props} />;
  }
)
SidebarMenuSeparator.displayName = "SidebarMenuSeparator"

const sidebarMenuButtonVariants = cva(
  "flex w-full items-center gap-3 overflow-hidden rounded-lg p-3 text-left text-sm outline-none ring-sidebar-ring transition-all duration-200 focus-visible:ring-2 active:bg-sidebar-active-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: { 
      variant: { 
          default: "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", 
          ghost: "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" 
      },
      size: { default: "h-11 text-base", sm: "h-9 text-sm", lg: "h-12 text-base" },
      isActive: { true: "bg-sidebar-accent text-sidebar-accent-foreground", false: "" }
    },
    defaultVariants: { variant: "ghost", size: "sm", isActive: false },
  }
)

type SidebarMenuButtonProps = React.ComponentProps<"button"> & {
  asChild?: boolean
  tooltip?: React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ asChild = false, variant, size, isActive, className, children, tooltip, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state, activeItem, setOpenMobile } = useSidebar();
    const href = asChild && (children as React.ReactElement)?.props.href;
    const finalIsActive = isActive ?? (href ? (href === '/' ? activeItem === '/' : activeItem.startsWith(href)) : false);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (href && isMobile) setOpenMobile(false);
      if (props.onClick) props.onClick(event);
    }

    const button = (
      <Comp ref={ref} data-active={finalIsActive} className={cn(sidebarMenuButtonVariants({ variant, size, isActive: finalIsActive }), state === 'collapsed' && 'justify-center', 'justify-start', className)} onClick={handleClick} {...props}>
        {children}
      </Comp>
    )

    if (!tooltip || isMobile || state === 'expanded') return button;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" align="center" hidden={state !== "collapsed"} {...tooltip}>
          {tooltip.children}
        </TooltipContent>
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSeparator,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
}

    