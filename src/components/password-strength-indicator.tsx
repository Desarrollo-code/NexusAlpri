// src/components/password-strength-indicator.tsx
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';

interface PasswordChecklist {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    specialChar: boolean;
}

export const PasswordStrengthIndicator = ({ password, isVisible }: { password?: string; isVisible: boolean }) => {
    const { settings } = useAuth();

    const checklist: PasswordChecklist = useMemo(() => {
        const pass = password || '';
        return {
            minLength: pass.length >= (settings?.passwordMinLength || 8),
            uppercase: settings?.passwordRequireUppercase ? /[A-Z]/.test(pass) : true,
            lowercase: settings?.passwordRequireLowercase ? /[a-z]/.test(pass) : true,
            number: settings?.passwordRequireNumber ? /\d/.test(pass) : true,
            specialChar: settings?.passwordRequireSpecialChar ? /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass) : true,
        };
    }, [password, settings]);

    const strength = useMemo(() => {
        return Object.values(checklist).filter(Boolean).length;
    }, [checklist]);
    
    const totalChecks = useMemo(() => {
        let count = 1; // minLength is always checked
        if (settings?.passwordRequireUppercase) count++;
        if (settings?.passwordRequireLowercase) count++;
        if (settings?.passwordRequireNumber) count++;
        if (settings?.passwordRequireSpecialChar) count++;
        return count;
    }, [settings]);

    const strengthPercentage = (strength / totalChecks) * 100;
    
    const getStrengthColor = () => {
        if (strengthPercentage < 50) return 'bg-destructive';
        if (strengthPercentage < 100) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStrengthText = () => {
        if (strengthPercentage < 50) return 'Débil';
        if (strengthPercentage < 100) return 'Buena';
        return 'Fuerte';
    };
    
    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
        >
            <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all duration-300", getStrengthColor())}
                        style={{ width: `${strengthPercentage}%` }}
                    />
                </div>
                <span className="text-xs font-semibold">{getStrengthText()}</span>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <p className={cn("flex items-center", checklist.minLength && "text-green-500")}>
                    {checklist.minLength ? <Check size={14} className="mr-1" /> : <AlertCircle size={14} className="mr-1" />}
                    Mínimo {settings?.passwordMinLength || 8} caracteres
                </p>
                {settings?.passwordRequireUppercase && (
                     <p className={cn("flex items-center", checklist.uppercase && "text-green-500")}>
                        {checklist.uppercase ? <Check size={14} className="mr-1" /> : <AlertCircle size={14} className="mr-1" />}
                        Una mayúscula
                    </p>
                )}
                {settings?.passwordRequireLowercase && (
                    <p className={cn("flex items-center", checklist.lowercase && "text-green-500")}>
                         {checklist.lowercase ? <Check size={14} className="mr-1" /> : <AlertCircle size={14} className="mr-1" />}
                        Una minúscula
                    </p>
                )}
                {settings?.passwordRequireNumber && (
                    <p className={cn("flex items-center", checklist.number && "text-green-500")}>
                        {checklist.number ? <Check size={14} className="mr-1" /> : <AlertCircle size={14} className="mr-1" />}
                        Un número
                    </p>
                )}
                 {settings?.passwordRequireSpecialChar && (
                    <p className={cn("flex items-center", checklist.specialChar && "text-green-500")}>
                         {checklist.specialChar ? <Check size={14} className="mr-1" /> : <AlertCircle size={14} className="mr-1" />}
                        Un caracter especial
                    </p>
                )}
            </div>
        </motion.div>
    );
};
