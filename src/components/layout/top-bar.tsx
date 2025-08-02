
'use client';

import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import type { UserRole } from '@/types'; 
import { Bell, ChevronDown, Menu, User as UserIcon, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { getNavItemsForRole } from '@/lib/nav-items';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export function TopBar() {
  const { user } = useAuth();
  const { setIsMobileOpen, activeItem } = useSidebar();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const navItems = useMemo(() => getNavItemsForRole(user?.role || 'STUDENT'), [user?.role]);

  const getPageTitle = () => {
    const allNavItems = navItems.flatMap(item => (item.children ? [item, ...item.children] : [item]));
    const currentItem = allNavItems.find(item => item.path === activeItem);
    return currentItem?.label || 'Panel Principal';
  };

  return (
    <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{getPageTitle()}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Bienvenido de vuelta, {user?.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Bell className="h-6 w-6" />
            {/* Aquí puedes añadir la lógica para mostrar el número de notificaciones */}
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <p className="font-medium text-gray-900 dark:text-white">Nuevo curso disponible</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">React Avanzado ya está listo</p>
                  <p className="text-xs text-gray-400 mt-1">Hace 2 minutos</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Usuario */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
             <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {user?.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
            </Avatar>
            <ChevronDown className="h-4 w-4" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-2">
                <Link href="/profile" className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <UserIcon className="h-4 w-4" />
                  <span>Mi Perfil</span>
                </Link>
                <Link href="/settings" className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Settings className="h-4 w-4" />
                  <span>Configuración</span>
                </Link>
                <hr className="my-2 border-gray-200 dark:border-gray-600" />
                <button className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 rounded-lg">
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
