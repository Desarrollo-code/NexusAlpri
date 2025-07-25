// src/lib/auth.ts
import { cookies } from 'next/headers'; // Importación correcta para acceder a las cookies en Server Components y API Routes
import jwt from 'jsonwebtoken'; // Para firmar y verificar JSON Web Tokens
import { jwtVerify } from 'jose'; // Una librería más moderna y segura para la verificación de JWT
import { User } from '@prisma/client'; // Importa el tipo User directamente de tu esquema Prisma

// Asegúrate de que tu clave secreta JWT esté configurada en tus variables de entorno (ej. en un archivo .env).
// Es crucial que esta clave sea larga, aleatoria y se mantenga en secreto para la seguridad de tus tokens.
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * @interface JWTPayload
 * Define la estructura de los datos que se codificarán dentro del token JWT.
 * Estos datos representarán la información esencial del usuario en la sesión.
 */
interface JWTPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null; // El campo 'avatar' es opcional y puede ser nulo
  // Puedes añadir otros campos aquí que necesites directamente en el JWT
}

/**
 * Obtiene la información del usuario actual a partir de la cookie de sesión.
 * Esta función es fundamental para la autenticación y autorización en rutas protegidas.
 *
 * @returns {Promise<User | null>} El objeto de usuario si la sesión es válida, de lo contrario, `null`.
 */
export async function getCurrentUser(): Promise<User | null> {
  // Accede a las cookies de la solicitud de forma explícita.
  // Next.js detectará esta llamada como una API dinámica, asegurando que la ruta se renderice dinámicamente.
  const requestCookies = cookies();
  const sessionCookieValue = requestCookies.get('session')?.value;

  // Si no hay una cookie de sesión, no hay usuario autenticado.
  if (!sessionCookieValue) {
    return null;
  }

  try {
    // Verifica el token JWT usando la clave secreta configurada.
    const { payload } = await jwtVerify(sessionCookieValue, secret);

    // Mapea los datos del payload del JWT a la estructura de tu modelo `User` de Prisma.
    // Es importante asegurarse de que todos los campos requeridos por tu esquema `User` estén presentes.
    // Para los campos que no están en el JWT (ej. `createdAt`, `updatedAt`, `password`),
    // se asignan valores predeterminados o `null` si son opcionales en tu esquema Prisma.
    // Si necesitas los datos completos y actualizados del usuario,
    // es recomendable hacer una consulta a la base de datos aquí usando `payload.id`.
    const user: User = {
      id: payload.id as string,
      name: payload.name as string | null,
      email: payload.email as string,
      // Asegúrate de que el 'role' coincida con tu enumeración de roles en Prisma.
      role: payload.role as any,
      avatar: (payload as JWTPayload).avatar || null, // Usa el campo 'avatar' del payload si existe
      image: (payload as JWTPayload).avatar || null, // A menudo 'image' se usa para avatares
      isTwoFactorEnabled: false, // Asume un valor predeterminado o consulta la DB
      twoFactorSecret: null, // Asume null o consulta la DB
      emailVerified: null, // Asume null o consulta la DB
      registeredDate: new Date(), // Asume una nueva fecha o consulta la DB
      createdAt: new Date(), // Asume una nueva fecha o consulta la DB
      updatedAt: new Date(), // Asume una nueva fecha o consulta la DB
      password: '', // ¡Importante! Nunca guardes la contraseña en el JWT. Asume una cadena vacía o similar.
      // Añade aquí cualquier otro campo que tu modelo `User` de Prisma requiera y no esté en el JWT.
    };
    return user;
  } catch (error) {
    // Registra el error si la verificación del token falla (ej. token expirado o inválido).
    console.error('Error al verificar el token de sesión:', error);
    return null;
  }
}

/**
 * Crea una nueva sesión de usuario generando un JWT y estableciéndolo como una cookie HTTP-only.
 *
 * @param {string} userId - El ID único del usuario para la sesión.
 * @param {string | null} name - El nombre del usuario.
 * @param {string} email - El correo electrónico del usuario.
 * @param {string} role - El rol del usuario (ej. 'ADMIN', 'USER').
 * @param {string | null} [avatar=null] - La URL del avatar del usuario (opcional).
 */
export async function createSession(userId: string, name: string | null, email: string, role: string, avatar: string | null = null) {
  const payload: JWTPayload = { id: userId, name: name || 'Usuario', email, role, avatar };

  // Firma el token JWT con el payload y la clave secreta.
  const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '7d' }); // El token expira en 7 días

  // Accede a las cookies de la respuesta para establecer la cookie de sesión.
  const responseCookies = cookies();
  responseCookies.set('session', token, {
    httpOnly: true, // Hace que la cookie no sea accesible por JavaScript en el navegador (mayor seguridad XSS)
    secure: process.env.NODE_ENV === 'production', // Solo envía la cookie sobre HTTPS en producción
    maxAge: 60 * 60 * 24 * 7, // Duración de la cookie: 7 días (en segundos)
    path: '/', // La cookie estará disponible para todas las rutas de la aplicación
    sameSite: 'lax', // Protección CSRF (Cross-Site Request Forgery)
  });
}

/**
 * Elimina la sesión del usuario actual borrando la cookie de sesión.
 * Esto se utiliza típicamente durante el proceso de cierre de sesión.
 */
export async function deleteSession() {
  // Accede a las cookies de la solicitud para eliminar la cookie de sesión.
  const requestCookies = cookies();
  requestCookies.delete('session');
}