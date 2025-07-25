// src/lib/auth.ts

'use server'; // Asegúrate de que esta línea sigue siendo la primera absoluta
import { cookies } from 'next/headers';
import { cache } from 'react';
import prisma from './prisma';
import jwt from 'jsonwebtoken'; // Necesitarás instalar jsonwebtoken si no lo tienes: npm install jsonwebtoken

// Define tu interfaz User si no está ya en otro lugar o aquí
interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: 'ADMINISTRATOR' | 'INSTRUCTOR' | 'STUDENT'; // Ajusta los roles según tu esquema
  // Otros campos de usuario relevantes para la sesión
}

/*
 * Fetches the current user based on the session cookie.
 * This function is cached to prevent multiple lookups in a single request.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const sessionCookieValue = cookies().get('session')?.value;

  if (!sessionCookieValue) {
    return null;
  }

  try {
    // En un entorno de producción, aquí decodificarías el JWT y obtendrías el ID del usuario
    // Por ahora, asumimos que sessionCookieValue es directamente el ID del usuario (o un JWT válido)
    // Si es un JWT, necesitarías algo como:
    const decoded = jwt.verify(sessionCookieValue, process.env.JWT_SECRET as string) as { userId: string };
    const userId = decoded.userId;


    const user = await prisma.user.findUnique({
      where: { id: userId }, // Usar el userId del JWT decodificado
      select: {
        id: true,
        name: true,
        email: true,
        // image: true, // Asegúrate de que este campo exista en tu schema.prisma o coméntalo
        role: true,
      }
    });

    return user as User;
  } catch (error) {
    console.error("Error al obtener el usuario actual:", error);
    return null;
  }
});

/**
 * Crea una sesión de usuario y la establece como una cookie HTTP-only.
 * @param userId El ID del usuario para el que se crea la sesión.
 * @param userRole El rol del usuario para incluir en la sesión.
 */
export async function createSession(userId: string, userRole: User['role']) {
  // Idealmente, aquí generarías un JWT o un token seguro
  const payload = { userId, role: userRole, expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) }; // Expira en 7 días
  const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '7d' }); // Firma el token

  cookies().set('session', token, {
    httpOnly: true, // No accesible por JavaScript en el navegador
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: '/', // Accesible en toda la aplicación
  });
}

/**
 * Elimina la sesión del usuario.
 */
export async function deleteSession() {
  cookies().delete('session');
}