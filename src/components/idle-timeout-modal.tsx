// src/components/idle-timeout-modal.tsx
'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Clock, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

interface IdleTimeoutModalProps {
    open: boolean;
    countdown: number;
    onStayConnected: () => void;
    onLogout: () => void;
}

export function IdleTimeoutModal({
    open,
    countdown,
    onStayConnected,
    onLogout,
}: IdleTimeoutModalProps) {
    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center justify-center mb-4">
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, -10, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            className="p-4 rounded-full bg-warning/20"
                        >
                            <Clock className="h-12 w-12 text-warning" />
                        </motion.div>
                    </div>
                    <AlertDialogTitle className="text-center text-xl">
                        Tu sesión expirará pronto por inactividad
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center space-y-4">
                        <p>
                            Has estado inactivo durante un tiempo. Por seguridad, tu sesión se cerrará automáticamente.
                        </p>
                        <div className="flex flex-col items-center gap-2">
                            <motion.div
                                key={countdown}
                                initial={{ scale: 1.2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-5xl font-bold text-primary"
                            >
                                {countdown}
                            </motion.div>
                            <p className="text-sm text-muted-foreground">
                                {countdown === 1 ? 'segundo restante' : 'segundos restantes'}
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={onLogout}
                        className="w-full sm:w-auto"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesión
                    </Button>
                    <AlertDialogAction
                        onClick={onStayConnected}
                        className="w-full sm:w-auto"
                    >
                        Seguir Conectado
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
