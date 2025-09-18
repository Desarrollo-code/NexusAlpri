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

## 3. Base de Datos y Migraciones: La Guía Definitiva

### 3.1. Configuración de Conexión (Local y Producción)

Para que Prisma funcione correctamente tanto en tu entorno de desarrollo local como en producción (Vercel), es fundamental usar dos variables de entorno diferentes para la base de datos.

1.  **Obtener las Cadenas de Conexión en Supabase:**
    *   Ve a tu proyecto en Supabase: **Project Settings > Database**.
    *   **Para `DATABASE_URL`:** Copia la URL de la tarjeta **"Transaction pooler"** (usa el puerto **6543**). Esta es para el uso general de la aplicación.
    *   **Para `DIRECT_URL`:** Copia la URL de la tarjeta **"Direct connection"** (usa el puerto **5432**). Esta es **exclusivamente** para que Prisma pueda ejecutar migraciones.

2.  **Configurar tu Archivo `.env` Local:**
    *   Abre (o crea) el archivo `.env` en la raíz de tu proyecto.
    *   Añade **ambas** variables:
    ```dotenv
    # Para el funcionamiento normal de la aplicación (consultas, etc.)
    DATABASE_URL="postgresql://postgres:[TU_CONTRASEÑA]@db.xxxxxxxx.supabase.co:6543/postgres"

    # ¡IMPORTANTE! Exclusivamente para migraciones (`prisma migrate`)
    DIRECT_URL="postgresql://postgres:[TU_CONTRASEÑA]@db.xxxxxxxx.supabase.co:5432/postgres"
    ```

3.  **Configurar `schema.prisma`:**
    *   Asegúrate de que tu archivo `prisma/schema.prisma` haga referencia a ambas variables.
    ```prisma
    // prisma/schema.prisma
    datasource db {
      provider  = "postgresql"
      url       = env("DATABASE_URL")
      directUrl = env("DIRECT_URL") // Prisma usará esto para las migraciones
    }
    ```

### 3.2. ¿Se Pierden los Datos al Migrar?

**No.** El comando `prisma migrate dev` está diseñado para ser seguro en desarrollo. Cuando lo ejecutas, **no borra los datos existentes**. Lo que hace es:
1.  Genera un archivo de migración SQL con los cambios (ej. `CREATE TABLE`, `ALTER TABLE`).
2.  Aplica ese archivo a tu base de datos.

Como los cambios que hemos hecho son **aditivos** (añadir nuevas tablas y campos), tus datos en las tablas `User`, `Course`, etc., permanecerán intactos. `prisma migrate dev` solo te advertiría y pediría permiso para reiniciar la base de datos si detectara que la base de datos real ha sido modificada manualmente y ya no coincide con el historial de migraciones, lo cual no es nuestro caso.

### 3.3. Comandos Esenciales de Prisma

*   **Para Desarrollo (`npm run prisma:migrate`):**
    *   **Uso:** Cuando cambias tu `schema.prisma` (añades un modelo, cambias un campo, etc.).
    *   **Acción:** Crea un nuevo archivo de migración y lo aplica a la base de datos. **Es seguro para tus datos.**
    ```bash
    npm run prisma:migrate
    ```

*   **Para Producción (`npm run prisma:deploy`):**
    *   **Uso:** Este comando se usa típicamente en los scripts de despliegue (como en el `build` de `package.json`).
    *   **Acción:** Aplica todas las migraciones pendientes que aún no se han ejecutado en la base de datos de producción. **Es el comando seguro para producción y no intentará reiniciar la base de datos.**
    ```bash
    npm run prisma:deploy
    ```

*   **Para Datos de Prueba (`npm run prisma:seed`):**
    *   **Uso:** Para poblar tu base de datos con los datos iniciales definidos en `prisma/seed.ts`.
    *   **Acción:** Ejecuta el script de seeding.
    ```bash
    npm run prisma:seed
    ```

## 4. Configuración para Despliegue (Vercel)

En Vercel, necesitas configurar ambas variables de entorno para que el script `build` funcione correctamente.

1.  Ve a tu proyecto en Vercel: **Settings > Environment Variables**.
2.  Añade las siguientes variables:
    *   `DATABASE_URL`: Usa la URL del **"Transaction pooler"** (puerto 6543).
    *   `DIRECT_URL`: Usa la URL de la **"Direct connection"** (puerto 5432).
    *   `JWT_SECRET`: Genera una nueva cadena secreta y segura.
    *   `RESEND_API_KEY` (opcional): Tu clave de API de Resend.

3.  Guarda y haz un "Redeploy". El script de `build` (`prisma db push && next build`) se encargará de sincronizar la base de datos antes de construir la aplicación.
