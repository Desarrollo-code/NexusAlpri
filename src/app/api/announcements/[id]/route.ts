# Manual Técnico de NexusAlpri

## 1. Introducción

Este documento proporciona una visión técnica de la arquitectura, base de datos y configuración del proyecto NexusAlpri. Está dirigido a desarrolladores y personal técnico que necesiten entender, mantener o extender la aplicación.

**Stack Tecnológico Principal:**
*   **Framework:** Next.js 15+ (con App Router y Server Components)
*   **Lenguaje:** TypeScript
*   **Base de Datos:** PostgreSQL (gestionada con Prisma ORM en Supabase)
*   **Estilos:** Tailwind CSS
*   **Componentes UI:** ShadCN
*   **Autenticación:** JWT almacenado en cookies http-only

## 2. Arquitectura del Sistema

### 2.1. Estructura de Carpetas

*   `src/app/(app)/`: Contiene las rutas y páginas protegidas de la aplicación (Dashboard, Cursos, etc.).
*   `src/app/(public)/`: Contiene las páginas públicas de la aplicación (landing, about, etc.).
*   `src/app/(auth)/`: Contiene las páginas públicas de autenticación (sign-in, sign-up).
*   `src/app/api/`: Define todos los endpoints de la API del backend. Sigue la estructura de enrutamiento de Next.js.
*   `src/components/`: Componentes de React reutilizables.
    *   `src/components/ui/`: Componentes base de ShadCN.
*   `src/lib/`: Funciones y utilidades compartidas.
    *   `auth.ts`: Lógica de sesión (JWT, cookies).
    *   `prisma.ts`: Instancia global del cliente de Prisma.
*   `src/contexts/`: Contextos de React (ej. `AuthContext` para la sesión del usuario).
*   `prisma/`:
    *   `schema.prisma`: Define el esquema de la base de datos.
    *   `migrations/`: Contiene las migraciones de la base de datos.

### 2.2. Flujo de Datos

1.  El cliente (navegador) solicita una página.
2.  Un Server Component en Next.js puede obtener datos directamente o llamar a una API Route.
3.  Las API Routes (`src/app/api/...`) manejan la lógica de negocio.
4.  La lógica de la API utiliza el cliente de **Prisma** (`@/lib/prisma`) para interactuar con la base de datos PostgreSQL.
5.  Los datos se devuelven como JSON al componente o al cliente.

## 3. Base de Datos y Migraciones: La Guía Infalible

### 3.1. Para Desarrollo Local (Tu Computadora)

Para hacer cambios en la estructura de la base de datos (modificar el `schema.prisma`), **siempre** debes usar la conexión directa a la base de datos.

1.  **Obtener la Cadena de Conexión Directa:**
    *   Ve a tu proyecto en Supabase: **Project Settings > Database**.
    *   Copia la URL de la tarjeta que dice **"Direct connection"**. Empieza con `postgresql://` y usa el puerto **5432**.
2.  **Configurar tu Archivo `.env`:**
    *   Pega esa cadena en la variable `DATABASE_URL` de tu archivo `.env`.
3.  **Ejecutar Migraciones:**
    *   En tu terminal, ejecuta: `npm run prisma:migrate`.

### 3.2. Para Producción (Vercel)

El entorno de producción de Vercel funciona de manera diferente. Para evitar errores de conexión (`Error 500`), debes usar el agrupador de conexiones de Supabase.

1.  **Obtener la Cadena del Pooler:**
    *   Ve a tu proyecto en Supabase: **Project Settings > Database**.
    *   Busca la sección **Connection string**.
    *   **IMPORTANTE:** Copia la URL de la tarjeta que dice **"Transaction pooler"** o **"Session pooler"**. Esta cadena usa el puerto **6543**.
2.  **Configurar las Variables de Entorno en Vercel:**
    *   Ve a tu proyecto en Vercel: **Settings > Environment Variables**.
    *   Añade o actualiza la variable `DATABASE_URL` y pega la cadena de conexión del **pooler (puerto 6543)**.
    *   Asegúrate de que también estén configuradas las variables `JWT_SECRET` y `RESEND_API_KEY`.
    *   Verifica que las variables estén activas para el entorno de **"Production"**.
3.  **Redesplegar:**
    *   Haz un nuevo `git push` o usa la opción "Redeploy" en el panel de Vercel para aplicar los cambios.

Esta estrategia asegura que las migraciones se puedan hacer localmente con los permisos correctos, y que la aplicación en producción use la conexión optimizada y permitida por Supabase para entornos serverless.

## 4. Estándares de Codificación

*   **TypeScript:** Utilizar tipado estricto siempre que sea posible.
*   **Componentes:** Favorecer el uso de componentes de ShadCN (`@/components/ui`) y crear componentes reutilizables en `@/components/`.
*   **Estilos:** Utilizar clases de Tailwind CSS. Evitar CSS en línea o archivos CSS separados.
*   **Formularios:** Utilizar `react-hook-form` para la gestión de formularios complejos.
*   **Código Asíncrono:** Utilizar `async/await` para operaciones asíncronas.
*   **Comentarios:** Añadir comentarios JSDoc a funciones complejas y a las props de los componentes para clarificar su propósito.