// src/lib/auth.ts
import { cookies } from 'next/headers'; // Importación correcta para acceder a las cookies en Server Components y API Routes
import jwt from 'jsonwebtoken'; // Para firmar y verificar JSON Web Tokens
import { jwtVerify } from 'jose'; // Una librería más moderna y segura para la verificación de JWT
import { User } from '@prisma/client'; // Importa el tipo User directamente de tu esquema Prisma

// Asegúrate de que tu clave secreta JWT esté configurada en tus variables de entorno (ej. en un archivo .env).
// Es crucial que esta clave sea larga, aleatoria y se mantenga en secreto para la seguridad de tus tokens.
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

<<<<<<< HEAD
const secret = process.env.JWT_SECRET;
if (!secret) {
  console.warn('JWT_SECRET is not set in environment variables. Using a default, insecure secret.');
}
const key = new TextEncoder().encode(secret || 'default-insecure-secret-for-dev');


// --- TOKEN ENCRYPTION/DECRYPTION ---

async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

async function decrypt(input: string): Promise<any> {
=======
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

>>>>>>> 213a36c0747a30247f2a5200ddc2c201d82c4a0c
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
<<<<<<< HEAD
=======
    // Registra el error si la verificación del token falla (ej. token expirado o inválido).
    console.error('Error al verificar el token de sesión:', error);
>>>>>>> 213a36c0747a30247f2a5200ddc2c201d82c4a0c
    return null;
  }
}

<<<<<<< HEAD

// --- SESSION MANAGEMENT ---

/**
 * Creates a session by setting a secure, httpOnly cookie.
 * This function should only be called from API routes (Node.js runtime).
 */
export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await encrypt({ userId, expires: expires.toISOString() });

  // Access cookies via the response object to set the cookie.
  cookies().set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    path: '/',
=======
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
>>>>>>> 213a36c0747a30247f2a5200ddc2c201d82c4a0c
  });
}

/**
<<<<<<< HEAD
 * Deletes the session cookie.
 * This function should only be called from API routes (Node.js runtime).
 */
export async function deleteSession() {
  cookies().set('session', '', { expires: new Date(0), path: '/' });
}


// --- USER/SESSION RETRIEVAL ---

/**
 * Retrieves the session from the request object.
 * This is the ONLY function that should be used in middleware.
 * It is lightweight and safe for the Edge runtime as it does NOT access the database.
 */
export async function getSession(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) return null;

  const decrypted = await decrypt(sessionCookie);
  if (!decrypted || new Date(decrypted.expires) < new Date()) {
      return null;
  }
  
  // Return only the essential parts needed for middleware checks.
  return { userId: decrypted.userId };
}


/**
 * Fetches the full user object from the database based on the current session.
 * This is the primary function to use in server-side components and API routes.
 * It uses `next/headers.cookies()` and is intended for the Node.js runtime.
 * It is wrapped in `cache` to prevent multiple DB queries for the same user in a single request.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const requestCookies = cookies();
  const sessionCookieValue = requestCookies.get('session')?.value;

  if (!sessionCookieValue) {
    return null;
  }

  const sessionData = await decrypt(sessionCookieValue);
  if (!sessionData?.userId) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: sessionData.userId },
    });

    if (!user) return null;

    const { password, twoFactorSecret, ...safeUser } = user;
    return safeUser as User;

  } catch (error) {
    console.error("Error fetching user for session:", error);
    return null;
  }
});
=======
 * Elimina la sesión del usuario actual borrando la cookie de sesión.
 * Esto se utiliza típicamente durante el proceso de cierre de sesión.
 */
export async function deleteSession() {
  // Accede a las cookies de la solicitud para eliminar la cookie de sesión.
  const requestCookies = cookies();
  requestCookies.delete('session');
}
>>>>>>> 213a36c0747a30247f2a5200ddc2c201d82c4a0c
