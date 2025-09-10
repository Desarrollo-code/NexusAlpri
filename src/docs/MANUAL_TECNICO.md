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

### 3.1. Paso 1: Configurar la Conexión para Migraciones (¡Solución a TODOS los errores!)

Para ejecutar el comando `prisma migrate dev`, Prisma necesita una conexión especial con la base de datos que el gestor de conexiones (pooler) de Supabase no soporta por defecto. Esto causa los errores `P3014`, `P1017` y `P1002`.

**La solución es usar DOS variables de entorno diferentes:** una para la aplicación en general y otra específica para las migraciones.

1.  **Obtener las Dos Cadenas de Conexión:**
    *   Ve a tu proyecto en Supabase: **Project Settings > Database**.
    *   **Para `DATABASE_URL`:** Copia la URL de la tarjeta **"Transaction pooler"** (usa el puerto **6543**).
    *   **Para `DIRECT_URL`:** Copia la URL de la tarjeta **"Direct connection"** (usa el puerto **5432**).

2.  **Configurar tu Archivo `.env` Local:**
    *   Abre el archivo `.env` en la raíz de tu proyecto.
    *   Añade **ambas** variables:

    ```dotenv
    # Para el funcionamiento normal de la aplicación (consultas, etc.)
    DATABASE_URL="postgresql://postgres:[TU_CONTRASEÑA]@db.xxxxxxxx.supabase.co:6543/postgres"

    # ¡IMPORTANTE! Exclusivamente para migraciones (`prisma migrate`)
    DIRECT_URL="postgresql://postgres:[TU_CONTRASEÑA]@db.xxxxxxxx.supabase.co:5432/postgres"
    ```

3.  **Configurar `schema.prisma`:**
    *   Asegúrate de que tu archivo `prisma/schema.prisma` haga referencia a ambas variables. El campo `directUrl` es utilizado por `prisma migrate`, mientras que `url` es para el resto de operaciones.

    ```prisma
    // prisma/schema.prisma
    datasource db {
      provider  = "postgresql"
      url       = env("DATABASE_URL")
      directUrl = env("DIRECT_URL")
    }
    ```

### 3.2. Paso 2: Permitir tu IP Local

Si al ejecutar `npm run prisma:migrate` ves un error de conexión, es probable que necesites añadir tu IP a la lista de redes permitidas en Supabase.

1.  **Obtén tu IP pública:** Busca en Google "¿Cuál es mi IP?".
2.  **Añade tu IP a Supabase:** Ve a **Project Settings > Database > Network Restrictions** y añade una nueva regla con tu IP seguida de `/32` (ej. `123.123.123.123/32`).

### 3.3. Paso 3: Ejecutar los Comandos de Prisma

*   **Para aplicar cambios de `schema.prisma`:**
    ```bash
    npm run prisma:migrate
    ```
*   **Para aplicar solo el estado actual (sin crear archivo de migración):**
    ```bash
    npm run prisma:deploy
    ```
*   **Para poblar con datos de prueba:**
    ```bash
    npm run prisma:seed
    ```

## 4. Configuración para Producción (Vercel)

En Vercel, solo necesitas la variable `DATABASE_URL` del pooler.

1.  Ve a tu proyecto en Vercel: **Settings > Environment Variables**.
2.  Añade las siguientes variables:

    *   `DATABASE_URL`: Usa la URL del **"Transaction pooler"** (puerto 6543).
    *   `JWT_SECRET`: Genera una nueva cadena secreta y segura.
    *   `RESEND_API_KEY` (opcional): Tu clave de API de Resend.

3.  Guarda y haz un "Redeploy".
