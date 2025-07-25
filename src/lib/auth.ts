// src/lib/auth.ts
import { cookies } from 'next/headers';
import { cache } from 'react';
import prisma from './prisma'; // Asegúrate de que esta importación sea correcta

// Añade esta directiva en la primera línea del archivo
// Esto le dice a Next.js que este archivo contiene código de servidor
'use server';

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
  // Ya que este archivo está marcado con 'use server',
  // Next.js sabe que `cookies()` es una operación del servidor.
  const sessionCookieValue = cookies().get('session')?.value;

  if (!sessionCookieValue) {
    return null;
  }

  try {
    // Aquí es donde validarías tu sesión y obtendrías el usuario
    // Por ejemplo, decodificando el JWT o consultando tu DB
    // Esto es un placeholder; necesitas tu lógica de validación de sesión real
    const user = await prisma.user.findUnique({
      where: { id: sessionCookieValue }, // Asumiendo que el valor de la cookie es el ID del usuario
      select: {
        id: true,
        name: true,
        email: true,
        image: true, // Si tienes un campo de imagen de perfil
        role: true,
        // ... otros campos que necesites para la sesión
      }
    });

    // Asegúrate de que el 'User' retornado coincida con la interfaz 'User'
    return user as User; // Castear para asegurar el tipo
  } catch (error) {
    console.error("Error al obtener el usuario actual:", error);
    return null;
  }
});

// Puedes tener otras funciones de autenticación aquí
// ...