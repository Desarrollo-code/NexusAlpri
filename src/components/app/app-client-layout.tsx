'use client'

import { type ReactNode } from 'react'
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import MainNav from '@/components/app/main-nav'
import SidebarNav from '@/components/app/sidebar-nav'
import { Toaster } from "@/components/ui/toaster"
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '../ui/button'
import { PanelLeft } from 'lucide-react'

export function AppClientLayout({ children, role }: { children: ReactNode, role: string }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-body">
        <Sidebar className="hidden border-r bg-sidebar md:flex md:flex-col">
          <SidebarNav role={role} />
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs bg-sidebar p-0">
                <SidebarNav role={role} />
              </SheetContent>
            </Sheet>
            <MainNav role={role} />
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}
