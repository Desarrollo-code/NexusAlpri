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

### 3.1. Paso 1: Obtener la Cadena de Conexión CORRECTA

Este es el paso más importante y donde ocurren la mayoría de los errores. Prisma necesita una conexión **directa** a la base de datos para poder crear y modificar las tablas (ejecutar migraciones).

1.  Ve a tu proyecto en Supabase.
2.  En el menú lateral, ve a **Project Settings** (el icono del engranaje) y luego a **Database**.
3.  Busca la sección **Connection string**.
4.  **IMPORTANTE:** Copia la URL de la tarjeta **"Conexión directa"**, que empieza con `postgresql://` y que utiliza el puerto **5432**. **NO uses la que tiene el puerto 6543 (Agrupador de transacciones) para migraciones.**
5.  Pégala en tu archivo `.env` en la raíz del proyecto:

```env
# Ejemplo de la cadena de conexión correcta
DATABASE_URL="postgresql://postgres:[TU_CONTRASEÑA]@[ID_PROYECTO].db.supabase.co:5432/postgres"

# Otras variables necesarias
JWT_SECRET="genera-una-cadena-aleatoria-muy-segura-aqui"
RESEND_API_KEY="tu_api_key_de_resend"
```

Reemplaza `[TU_CONTRASEÑA]` con la contraseña real de tu base de datos.

### 3.2. Paso 2: Configurar tu IP Local (Error P1001 en Desarrollo)

Si al ejecutar `npm run prisma:migrate` en tu computadora local ves el error `P1001: Can't reach database server...`, es porque el firewall de Supabase está bloqueando tu conexión.

1.  **Obtén tu dirección IP pública:** Busca en Google "¿Cuál es mi IP?".
2.  **Añade tu IP a Supabase:**
    *   En Supabase, ve a **Project Settings > Database**.
    *   Busca la sección **Network Restrictions**.
    *   Haz clic en **`Add new rule`**.
    *   Dale un nombre (ej. "Oficina Casa - [Tu Nombre]") y en `CIDR Address` pega tu IP seguida de `/32`. Ejemplo: `123.123.123.123/32`.
    *   Guarda la regla.

### 3.3. Paso 3: Permitir Conexiones desde Vercel (Solución al Error 500)

Este es el paso **CRÍTICO** para que tu aplicación funcione en producción. Vercel usa servidores con IPs dinámicas, por lo que debes permitir que cualquier servidor se conecte. La seguridad la manejará tu `DATABASE_URL`, que es un secreto.

1.  **Añade una regla para Vercel:**
    *   En la misma sección de **Network Restrictions** en Supabase, haz clic de nuevo en **`Add new rule`**.
    *   Dale un nombre claro, como `Vercel (Permitir Todas)`.
    *   En el campo `CIDR Address`, escribe exactamente: `0.0.0.0/0`.
    *   Guarda la regla.

¡Y listo! Con esto, tanto tu máquina local como los servidores de Vercel tendrán permiso para conectarse a la base de datos.

### 3.4. Paso 4: Ejecutar los Comandos de Prisma

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

**Nota sobre Producción:** El script de `build` en `package.json` ya ejecuta `npm run prisma:deploy` automáticamente. No necesitas hacerlo manualmente en Vercel.

## 4. Configuración para Producción (Vercel)

El archivo `.env` es local y **no debe subirse a Git**. Para que la aplicación funcione en producción, debes configurar las variables de entorno directamente en Vercel.

1.  Ve al panel de tu proyecto en Vercel.
2.  Navega a **Settings > Environment Variables**.
3.  Añade las siguientes variables:

    *   **`DATABASE_URL`**:
        *   **Valor:** Pega aquí la **misma** cadena de conexión directa de Supabase (la del puerto 5432) que usas en tu archivo `.env` local.
        *   **Importancia:** Crítica. Sin esto, la aplicación no podrá conectarse a la base de datos y fallará.

    *   **`JWT_SECRET`**:
        *   **Valor:** Genera una cadena de texto larga, segura y aleatoria. Puedes usar un generador de contraseñas en línea para crear una de 64 caracteres.
        *   **Importancia:** Crítica. Es el secreto para la seguridad de las sesiones de usuario. **No uses la misma que en desarrollo.**

    *   **`RESEND_API_KEY`**:
        *   **Valor:** Si usas Resend para enviar correos, pega aquí tu clave de API.
        *   **Importancia:** Opcional. La aplicación funcionará sin ella, pero no podrá enviar correos transaccionales.

4.  **Guarda los cambios.** Vercel automáticamente redesplegará tu proyecto con las nuevas variables de entorno, y la conexión a la base de datos debería funcionar correctamente.

> **Nota de Depuración:** Si después de configurar las variables en Vercel sigues viendo un error 500, las rutas de autenticación (`/api/auth/login` y `/api/auth/register`) han sido mejoradas para detectar si las variables de entorno no están configuradas correctamente. Si el problema persiste, el error devuelto por la API debería ser "Error de configuración del servidor: Faltan variables de entorno críticas", confirmando que el problema reside en la configuración de Vercel.

## 5. Estándares de Codificación

*   **TypeScript:** Utilizar tipado estricto siempre que sea posible.
*   **Componentes:** Favorecer el uso de componentes de ShadCN (`@/components/ui`) y crear componentes reutilizables en `@/components/`.
*   **Estilos:** Utilizar clases de Tailwind CSS. Evitar CSS en línea o archivos CSS separados.
*   **Formularios:** Utilizar `react-hook-form` para la gestión de formularios complejos.
*   **Código Asíncrono:** Utilizar `async/await` para operaciones asíncronas.
*   **Comentarios:** Añadir comentarios JSDoc a funciones complejas y a las props de los componentes para clarificar su propósito.