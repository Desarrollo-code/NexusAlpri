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

### 3.1. Paso 1: Configurar el archivo `.env` para Desarrollo Local

Para hacer cambios en la estructura de la base de datos (modificar `schema.prisma`), **siempre** debes usar la conexión directa a la base de datos en tu entorno local.

1.  **Obtener la Cadena de Conexión Directa:**
    *   Ve a tu proyecto en Supabase: **Project Settings > Database**.
    *   Copia la URL de la tarjeta que dice **"Direct connection"**. Empieza con `postgresql://` y usa el puerto **5432**.
2.  **Configurar tu Archivo `.env`:**
    *   Abre el archivo `.env` en la raíz de tu proyecto.
    *   Asegúrate de que la variable `DATABASE_URL` contenga la cadena de conexión **DIRECTA (puerto 5432)** que acabas de copiar.

    ```dotenv
    # Ejemplo en .env
    DATABASE_URL="postgresql://postgres:[TU_CONTRASEÑA]@db.xxxxxxxx.supabase.co:5432/postgres"
    ```

### 3.2. Paso 2: Permitir tu IP Local (Solución al Error P1001)

Si al ejecutar `npm run prisma:migrate` en tu computadora local ves el error `P1001: Can't reach database server...`, es porque el firewall de Supabase está bloqueando tu conexión.

1.  **Obtén tu dirección IP pública:** Busca en Google "¿Cuál es mi IP?".
2.  **Añade tu IP a Supabase:**
    *   En Supabase, ve a **Project Settings > Database**.
    *   Busca la sección **Network Restrictions**.
    *   Haz clic en **`Add new rule`**.
    *   Dale un nombre (ej. "Oficina Casa - [Tu Nombre]") y en `CIDR Address` pega tu IP seguida de `/32`. Ejemplo: `123.123.123.123/32`.
    *   Guarda la regla.

### 3.3. Paso 3: Ejecutar los Comandos de Prisma

*   **En tu computadora (desarrollo):** Para aplicar cambios que hayas hecho en `schema.prisma`.
    ```bash
    npm run prisma:migrate
    ```
*   **En tu computadora (primera vez o si la BD está vacía):** Para crear las tablas por primera vez sin generar archivos de migración.
    ```bash
    npm run prisma:deploy
    ```
*   **Para poblar la base de datos con datos de prueba:**
    ```bash
    npm run prisma:seed
    ```

**Nota sobre `schema.prisma`:** No es necesario que pongas la `DATABASE_URL` directamente en el `schema.prisma`. Es mejor que solo contenga `env("DATABASE_URL")` para que tome la variable del archivo `.env`.

## 4. Configuración para Producción (Vercel)

Para que la aplicación funcione en producción, debes configurar las variables de entorno directamente en el panel de Vercel.

1.  Ve al panel de tu proyecto en Vercel.
2.  Navega a **Settings > Environment Variables**.
3.  Añade las siguientes variables, una por una:

    *   **`DATABASE_URL`**:
        *   **Nombre:** `DATABASE_URL`
        *   **Valor:** Aquí viene la diferencia clave. Ve a Supabase, a la misma sección de **Connection string**, y copia la URL de la tarjeta que dice **"Transaction pooler"** (la que usa el puerto **6543**). ¡Pega esa aquí!
        *   **Importancia:** Crítica. Sin esto, la aplicación no podrá conectarse a la base de datos.

    *   **`JWT_SECRET`**:
        *   **Nombre:** `JWT_SECRET`
        *   **Valor:** Genera una cadena de texto larga, segura y aleatoria. **No uses la misma que en desarrollo.**
        *   **Importancia:** Crítica. Es el secreto para la seguridad de las sesiones de usuario.

    *   **`RESEND_API_KEY`**:
        *   **Nombre:** `RESEND_API_KEY`
        *   **Valor:** Si usas Resend para enviar correos, pega aquí tu clave de API.
        *   **Importancia:** Opcional.

4.  **Guardar y Redesplegar:** Guarda las variables y haz un "Redeploy" desde el panel de Vercel para que los cambios surtan efecto.
