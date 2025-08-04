
'use client';

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { ChevronsRight, Menu } from "lucide-react"
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
import type { NavItem, UserRole } from "@/types";
import { getNavItemsForRole } from "@/lib/nav-items";
import { useAuth } from "@/contexts/auth-context";

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
  activeItem: string;
  setActiveItem: (path: string) => void;
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(
  (
    {
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)
    const pathname = usePathname();
    const [activeItem, setActiveItem] = React.useState(pathname);
    const [_open, _setOpen] = React.useState(true);

    React.useEffect(() => {
        // Set initial state from cookie only on the client
        const cookie = document.cookie.split('; ').find(row => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`));
        _setOpen(cookie ? cookie.split('=')[1] === 'true' : true);
    }, []);

    const setOpen = React.useCallback(
      (value: boolean) => {
        _setOpen(value);
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      []
    );

    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((current) => !current)
        : setOpen(!_open);
    }, [isMobile, _open, setOpen, setOpenMobile]);
    
    // Set active item on path change
    React.useEffect(() => {
        if(pathname) setActiveItem(pathname);
    }, [pathname]);

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    const state = _open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open: _open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
        activeItem,
        setActiveItem,
      }),
      [state, _open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar, activeItem]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                ...style,
              } as React.CSSProperties
            }
            className={className}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(
  (
    {
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (isMobile) {
      return (
        <>
          {openMobile && (
            <div 
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setOpenMobile(false)}
            />
          )}
          <aside
            ref={ref}
            className={cn(
              "fixed left-0 top-0 h-full z-50 bg-sidebar border-r border-sidebar-border transition-transform duration-300 flex flex-col",
              openMobile ? 'translate-x-0' : '-translate-x-full',
              'w-72',
              className
            )}
            {...props}
          >
            {children}
          </aside>
        </>
      )
    }

    return (
      <aside
        ref={ref}
        className={cn(
          "group/sidebar-wrapper fixed inset-y-0 left-0 z-40 flex h-screen flex-col text-sidebar-foreground transition-[width] duration-300 ease-in-out bg-sidebar border-r border-sidebar-border",
          state === 'expanded' ? "w-72" : "w-20",
          className
        )}
        data-state={state}
        {...props}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {children}
        </div>
      </aside>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("h-9 w-9", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <Menu />
      <span className="sr-only">Alternar Barra Lateral</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex shrink-0 items-center justify-between h-16 px-4 border-b border-sidebar-border", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col p-4 mt-auto border-t border-sidebar-border", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { user } = useAuth();
  const navItems = React.useMemo(() => getNavItemsForRole(user?.role || 'STUDENT'), [user?.role]);

  return (
    <div
      ref={ref}
      className={cn("flex min-h-0 flex-1 flex-col overflow-auto px-4 py-2 space-y-2", className)}
      {...props}
    >
       <SidebarMenu>
          {navItems.map((item) => (
             <SidebarMenuItem key={item.id} item={item} />
           ))}
      </SidebarMenu>
    </div>
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  { item: NavItem } & React.ComponentProps<"li">
>(({ className, item, ...props }, ref) => {
  const { activeItem } = useSidebar();
  const hasChildren = item.children && item.children.length > 0;
  
  if (hasChildren) {
    return (
      <li ref={ref} className={cn("group/menu-item relative", className)} {...props}>
        <SidebarMenuButton 
            isActive={item.path ? activeItem.startsWith(item.path) : false} 
            tooltip={{ children: item.label }}
        >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="sidebar-text flex-1 text-left font-medium">{item.label}</span>
            <ChevronsRight className="sidebar-text h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
        </SidebarMenuButton>
        {/* You would need a collapsible component here to show/hide children */}
      </li>
    )
  }

  return (
    <li ref={ref} className={cn("group/menu-item relative", className)} {...props}>
        <SidebarMenuButton asChild tooltip={{ children: item.label }}>
            <Link href={item.path || '#'}>
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="sidebar-text flex-1 text-left font-medium">{item.label}</span>
            </Link>
        </SidebarMenuButton>
    </li>
  )
})
SidebarMenuItem.displayName = "SidebarMenuItem"


const SidebarMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("my-2 h-px bg-sidebar-border/20", className)} {...props} />
));
SidebarMenuSeparator.displayName = "SidebarMenuSeparator";

const sidebarMenuButtonVariants = cva(
  "flex w-full items-center gap-3 overflow-hidden rounded-lg p-3 text-left text-sm outline-none ring-sidebar-ring transition-all duration-200 focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        ghost: "hover:bg-gray-700 hover:text-white",
      },
      size: {
        default: "h-11 text-base",
        sm: "h-9 text-sm",
        lg: "h-12 text-base",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "sm",
    },
  }
)

type SidebarMenuButtonProps = React.ComponentProps<"button"> & {
  asChild?: boolean
  tooltip?: React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>


const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(
  (
    {
      asChild = false,
      variant,
      size,
      className,
      children,
      tooltip,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state, activeItem, setActiveItem, setOpenMobile } = useSidebar();
    const href = asChild && (children as React.ReactElement)?.props.href;
    
    // Determine if the item is active
    const isActive = href === '/' ? activeItem === href : activeItem.startsWith(href);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (href) {
            setActiveItem(href);
            if (isMobile) setOpenMobile(false);
        }
        if (props.onClick) props.onClick(event);
    }

    const button = (
      <Comp
        ref={ref}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), isActive && 'bg-sidebar-accent text-sidebar-accent-foreground shadow-lg', className)}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Comp>
    )

    if (!tooltip || isMobile || state === 'expanded') {
      return button
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed"}
          {...tooltip}
        >
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
