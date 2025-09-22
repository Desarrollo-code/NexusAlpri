# Manual Técnico de NexusAlpri

## 1. Introducción

Este documento proporciona una visión técnica de la arquitectura, base de datos y configuración del proyecto NexusAlpri. Está dirigido a desarrolladores y personal técnico que necesiten entender, mantener o extender la aplicación.

**Stack Tecnológico Principal:**
*   **Framework:** Next.js 15+ (con App Router y Server Components)
*   **Lenguaje:** TypeScript
*   **Base de Datos:** PostgreSQL (gestionada con Prisma ORM en Supabase)
*   **Almacenamiento:** Supabase Storage.
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

## 3. Endpoints de API Clave

*   `/api/auth/...`: Endpoints para registro (`register`), inicio de sesión (`login`), cierre de sesión (`logout`) y gestión de 2FA.
*   `/api/courses/...`: CRUD completo para cursos, módulos, lecciones y bloques de contenido.
*   `/api/enrollments/...`: Gestión de inscripciones y cancelaciones.
*   `/api/progress/...`: Endpoints para registrar y calcular el progreso de los estudiantes.
*   `/api/announcements/...`: CRUD para anuncios y endpoints para registrar lecturas (`/read`) y reacciones (`/react`).
*   `/api/resources/...`: CRUD para la biblioteca de recursos, incluyendo la gestión de carpetas y la verificación de PIN.
*   `/api/forms/...`: CRUD completo para formularios, incluyendo la gestión de campos y el envío de respuestas.
*   `/api/users/...`: CRUD para usuarios (creación, edición, cambio de estado y rol).
*   `/api/settings/...`: Endpoint para obtener y actualizar la configuración global de la plataforma.
*   `/api/security/...`: Endpoints para obtener los logs (`/logs`) y estadísticas (`/stats`) de seguridad.

## 4. Base de Datos y Migraciones

### 4.1. Configuración de Conexión

Para ejecutar `prisma migrate dev` o `prisma db push`, Prisma necesita una conexión directa a la base de datos que el gestor de conexiones (pooler) de Supabase no soporta.

**La solución es usar DOS variables de entorno diferentes:**

1.  **Obtener las Cadenas de Conexión:**
    *   Ve a tu proyecto en Supabase: **Project Settings > Database**.
    *   **`DATABASE_URL`:** Copia la URL de la tarjeta **"Connection string"** que usa el puerto **6543** (Transaction Mode).
    *   **`DIRECT_URL`:** Copia la URL de la tarjeta **"Direct connection"** que usa el puerto **5432**.

2.  **Configurar `.env`:**
    ```dotenv
    # Para el funcionamiento normal de la aplicación (consultas, etc.)
    DATABASE_URL="postgresql://postgres:[TU_CONTRASEÑA]@db.xxxxxxxx.supabase.co:6543/postgres?pgbouncer=true"

    # ¡IMPORTANTE! Exclusivamente para migraciones y seeding (`prisma migrate`, `prisma db seed`)
    DIRECT_URL="postgresql://postgres:[TU_CONTRASEÑA]@db.xxxxxxxx.supabase.co:5432/postgres"
    ```

3.  **Configurar `schema.prisma`:**
    ```prisma
    datasource db {
      provider  = "postgresql"
      url       = env("DATABASE_URL")
      directUrl = env("DIRECT_URL")
    }
    ```

### 4.2. Comandos de Prisma

*   **Aplicar cambios de `schema.prisma` en desarrollo:**
    ```bash
    npm run prisma:migrate
    ```
*   **Aplicar las migraciones en producción:**
    ```bash
    npm run prisma:deploy
    ```
*   **Poblar con datos de prueba:**
    ```bash
    npm run prisma:seed
    ```

## 5. Almacenamiento de Archivos (Supabase Storage)

Para que la subida de archivos funcione, **debes crear manualmente los "buckets" públicos** en Supabase: `avatars`, `course_images`, `settings_images`, `lesson_files`, `resource_library`, `announcement_attachments`.

## 6. Configuración para Producción (Vercel)

1.  Ve a tu proyecto en Vercel: **Settings > Environment Variables**.
2.  Añade `DATABASE_URL` (con el puerto 6543) y `DIRECT_URL` (con el puerto 5432), además del resto de secretos (`JWT_SECRET`, etc.).
3.  El script de `build` (`prisma migrate deploy && ...`) se encargará de sincronizar la base de datos correctamente.
