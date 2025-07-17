
import type { SecurityLogEvent } from '@/types';
import { ShieldCheck, ShieldX, KeyRound, UserCog, ShieldAlert } from 'lucide-react';
import React from 'react';

export const getEventDetails = (event: SecurityLogEvent, details?: string | null) => {
    switch (event) {
        case 'SUCCESSFUL_LOGIN': return { label: 'Inicio Sesión Exitoso', icon: React.createElement(ShieldCheck, { className: "h-4 w-4 text-green-500" }), variant: 'secondary' as const };
        case 'FAILED_LOGIN_ATTEMPT': return { label: 'Intento Fallido', icon: React.createElement(ShieldX, { className: "h-4 w-4 text-destructive" }), variant: 'destructive' as const };
        case 'PASSWORD_CHANGE_SUCCESS': return { label: 'Cambio de Contraseña', icon: React.createElement(KeyRound, { className: "h-4 w-4 text-primary" }), variant: 'default' as const };
        case 'TWO_FACTOR_ENABLED': return { label: '2FA Activado', icon: React.createElement(ShieldCheck, { className: "h-4 w-4 text-green-500" }), variant: 'default' as const };
        case 'TWO_FACTOR_DISABLED': return { label: '2FA Desactivado', icon: React.createElement(ShieldAlert, { className: "h-4 w-4 text-orange-500" }), variant: 'destructive' as const };
        case 'USER_ROLE_CHANGED': return { label: 'Cambio de Rol', icon: React.createElement(UserCog, { className: "h-4 w-4 text-purple-500" }), variant: 'default' as const };
        default: return { label: 'Evento Desconocido', icon: React.createElement(ShieldAlert, { className: "h-4 w-4" }), variant: 'outline' as const };
    }
};

export const getInitials = (name?: string | null) => name?.split(' ').map(n => n[0]).join('') || '??';
