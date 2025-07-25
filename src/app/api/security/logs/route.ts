// src/app/api/security/logs/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Define que esta ruta siempre debe ser dinámica y no se debe cachear.
// Esto es crucial para manejar el acceso a 'cookies()' y asegurar datos frescos.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Maneja las solicitudes GET para obtener los registros de seguridad.
 * Esta ruta está restringida solo para usuarios con el rol 'ADMINISTRATOR'.
 *
 * @param {NextRequest} req - El objeto de solicitud de Next.js.
 * @returns {Promise<NextResponse>} Una respuesta JSON con los registros de seguridad o un mensaje de error.
 */
export async function GET(req: NextRequest) {
    const session = await getCurrentUser();

    // Comprueba si el usuario está autenticado y tiene el rol de ADMINISTRATOR.
    // Si no cumple, devuelve un error 403 (Prohibido).
    if (!session || session.role !== 'ADMINISTRATOR') {
<<<<<<< HEAD
        console.log(`Intento de acceso no autorizado a /api/security/logs. Usuario: ${session?.name || 'N/A'}, Rol: ${session?.role || 'N/A'}`);
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
=======
        // Registra una advertencia en la consola del servidor para intentos de acceso no autorizados.
        console.warn(`Intento de acceso no autorizado a /api/security/logs. Usuario: ${session?.email || 'N/A'}, Rol: ${session?.role || 'N/A'}`);
        return NextResponse.json({ message: 'Acceso no autorizado. Se requieren permisos de administrador.' }, { status: 403 });
>>>>>>> 213a36c0747a30247f2a5200ddc2c201d82c4a0c
    }

    try {
        // Obtiene los últimos 100 registros de seguridad de la base de datos,
        // ordenados por fecha de creación descendente, e incluye la información del usuario asociado.
        const logs = await prisma.securityLog.findMany({
            orderBy: {
                createdAt: 'desc', // Ordena los logs del más reciente al más antiguo
            },
            take: 100, // Limita el número de registros para un mejor rendimiento
            include: {
                user: { // Incluye la información básica del usuario que generó el log
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
        });

        // Devuelve los registros de seguridad en formato JSON.
        return NextResponse.json({ logs });
    } catch (error) {
        // Captura y registra cualquier error que ocurra durante la consulta a la base de datos.
        console.error('[SECURITY_LOGS_GET_ERROR]', error);
        // Devuelve una respuesta de error 500 (Error Interno del Servidor).
        return NextResponse.json({ message: 'Error al obtener los registros de seguridad' }, { status: 500 });
    }
}