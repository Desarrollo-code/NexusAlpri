// src/lib/security-log-utils.ts
import type { SecurityLogEvent, UserRole, NavItem } from '@/types';
import type { VariantProps } from "class-variance-authority";
import type { BadgeProps } from '@/components/ui/badge';
import type { LucideIcon } from 'lucide-react';
import { getNavItemsForRole } from '@/lib/nav-items';
import { User } from '@/types';


type BadgeVariant = BadgeProps['variant'];

export const getRoleInSpanish = (role: UserRole) => {
    switch (role) {
      case 'ADMINISTRATOR': return 'Administrador';
      case 'INSTRUCTOR': return 'Instructor';
      case 'STUDENT': return 'Estudiante';
      default: return role;
    }
};

export const getRoleBadgeVariant = (role: UserRole): BadgeVariant => {
    switch(role) {
      case 'ADMINISTRATOR': return 'destructive';
      case 'INSTRUCTOR': return 'default';
      case 'STUDENT': return 'secondary';
      default: return 'outline';
    }
};

interface EventDetails {
    label: string;
    iconName: keyof typeof import('lucide-react');
    variant: BadgeVariant;
    details: string;
}

export const getEventDetails = (event: SecurityLogEvent, details?: string | null): EventDetails => {
    switch (event) {
        case 'SUCCESSFUL_LOGIN':
             return { label: 'Inicio Exitoso', iconName: 'ShieldCheck', variant: 'secondary', details: 'Acceso concedido a la cuenta.' };
        case 'FAILED_LOGIN_ATTEMPT':
            return { label: 'Intento Fallido', iconName: 'ShieldX', variant: 'destructive', details: 'Credenciales incorrectas o usuario no encontrado.' };
        case 'PASSWORD_CHANGE_SUCCESS':
             return { label: 'Cambio Contraseña', iconName: 'KeyRound', variant: 'default', details: 'La contraseña del usuario fue actualizada.' };
        case 'TWO_FACTOR_ENABLED':
            return { label: '2FA Activado', iconName: 'ShieldCheck', variant: 'default', details: 'El usuario activó la autenticación de dos factores.' };
        case 'TWO_FACTOR_DISABLED':
            return { label: '2FA Desactivado', iconName: 'ShieldAlert', variant: 'destructive', details: 'El usuario desactivó la autenticación de dos factores.' };
         case 'USER_ROLE_CHANGED':
            return { label: 'Cambio de Rol', iconName: 'UserCog', variant: 'default', details: details || 'El rol del usuario ha sido modificado.' };
        case 'COURSE_CREATED':
            return { label: 'Curso Creado', iconName: 'BookMarked', variant: 'default', details: details || 'Se ha creado un nuevo curso.' };
        case 'COURSE_UPDATED':
            return { label: 'Curso Actualizado', iconName: 'BookMarked', variant: 'secondary', details: details || 'Se ha modificado un curso.' };
        case 'COURSE_DELETED':
            return { label: 'Curso Eliminado', iconName: 'BookMarked', variant: 'destructive', details: details || 'Se ha eliminado un curso.' };
        case 'USER_SUSPENDED':
            return { label: 'Usuario Suspendido', iconName: 'UserX', variant: 'destructive', details: details || 'La cuenta de un usuario ha sido inactivada.' };
        default:
            return { label: event.replace(/_/g, ' ').toLowerCase(), iconName: 'ShieldAlert', variant: 'outline', details: details || 'Evento de seguridad general.' };
    }
};

/**
 * Parses a user agent string to extract a simplified browser and OS name.
 * @param userAgent The full user agent string.
 * @returns An object containing the browser and OS name.
 */
export const parseUserAgent = (userAgent: string | null | undefined): { browser: string; os: string } => {
    if (!userAgent) return { browser: 'Desconocido', os: 'Desconocido' };
    
    let browser = 'Desconocido';
    let os = 'Desconocido';

    // OS detection
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Macintosh') || userAgent.includes('Mac OS')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    // Browser detection (order matters)
    if (userAgent.includes('Edg/')) browser = 'Edge';
    else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) browser = 'Chrome';
    else if (userAgent.includes('Firefox/')) browser = 'Firefox';
    else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) browser = 'Safari';

    return { browser, os };
};

/**
 * Calculates the accessible navigation items for a user based on their role and custom permissions.
 * @param user The user object, which includes role and customPermissions array.
 * @returns An array of NavItem objects the user can access.
 */
export const getUserNavItems = (user: User): NavItem[] => {
    const roleItems = getNavItemsForRole(user.role);
    const customPermissions = new Set(user.customPermissions || []);

    if (customPermissions.size === 0) {
        return roleItems;
    }

    const hasAccess = (item: NavItem): boolean => {
        // If an item has a path, check if it's in the custom permissions
        if (item.path) {
            return customPermissions.has(item.path);
        }
        // If an item is a section header, it should be visible if any of its children are visible
        if (item.children) {
            return item.children.some(hasAccess);
        }
        return false;
    };
    
    // Create a new structure with only the items the user has custom access to
    const customNavItems = getNavItemsForRole('ADMINISTRATOR') // Start with all possible items
        .map(item => {
            if (item.children) {
                const accessibleChildren = item.children.filter(child => child.path && customPermissions.has(child.path));
                if (accessibleChildren.length > 0) {
                    return { ...item, children: accessibleChildren };
                }
                return null;
            }
            if (item.path && customPermissions.has(item.path)) {
                return item;
            }
            return null;
        })
        .filter((item): item is NavItem => item !== null);

    // Merge role-based items with custom items, avoiding duplicates
    const finalItemsMap = new Map<string, NavItem>();

    const addItemsToMap = (items: NavItem[]) => {
        items.forEach(item => {
            if (item.children) {
                let existingItem = finalItemsMap.get(item.id);
                if (!existingItem) {
                    existingItem = { ...item, children: [] };
                    finalItemsMap.set(item.id, existingItem);
                }
                item.children.forEach(child => {
                     if (!existingItem.children!.some(c => c.id === child.id)) {
                        existingItem.children!.push(child);
                    }
                });
            } else if (!finalItemsMap.has(item.id)) {
                finalItemsMap.set(item.id, item);
            }
        });
    };

    addItemsToMap(roleItems);
    addItemsToMap(customNavItems);

    return Array.from(finalItemsMap.values());
};

