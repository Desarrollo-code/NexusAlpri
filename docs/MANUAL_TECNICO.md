
# Manual Técnico de NexusAlpri

## 1. Introducción

Este documento proporciona una visión técnica de la arquitectura, base de datos y configuración del proyecto NexusAlpri. Está dirigido a desarrolladores y personal técnico que necesiten entender, mantener o extender la aplicación.

**Stack Tecnológico Principal:**
*   **Framework:** Next.js 15+ (con App Router y Server Components)
*   **Lenguaje:** TypeScript
*   **Base de Datos y Backend:** **Supabase** (que proporciona una base de datos PostgreSQL, autenticación y almacenamiento). La interacción con la base de datos se gestiona a través del esquema definido en `prisma/schema.prisma`.
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

Esta sección es la guía definitiva para gestionar tu base de datos con Prisma y Supabase.

### 3.1. Paso 1: Obtener la Cadena de Conexión CORRECTA

Este es el paso más importante y donde ocurren la mayoría de los errores. Prisma necesita una conexión **directa** a la base de datos para poder crear y modificar las tablas (ejecutar migraciones).

1.  Ve a tu proyecto en Supabase.
2.  En el menú lateral, ve a **Project Settings** (el icono del engranaje) y luego a **Database**.
3.  Busca la sección **Connection string**.
4.  **IMPORTANTE:** Copia la URL que empieza con `postgresql://` y que utiliza el puerto **5432**. **NO uses la que tiene el puerto 6543 (Transaction pooler) para migraciones.**
5.  Pégala en tu archivo `.env` en la raíz del proyecto:

```env
# Ejemplo de la cadena de conexión correcta
DATABASE_URL="postgresql://postgres:[TU_CONTRASEÑA]@[ID_PROYECTO].db.supabase.co:5432/postgres"

# Otras variables necesarias
JWT_SECRET="genera-una-cadena-aleatoria-muy-segura-aqui"
RESEND_API_KEY="tu_api_key_de_resend"
```

Reemplaza `[TU_CONTRASEÑA]` con la contraseña real de tu base de datos.

### 3.2. Paso 2: Entender los Comandos de Prisma

*   **`npm run prisma:migrate` (Para Desarrollo):**
    *   **¿Qué hace?** Compara tu `schema.prisma` con el estado anterior y genera un nuevo archivo de migración SQL en la carpeta `prisma/migrations`. Luego, aplica esa migración a la base de datos.
    *   **¿Cuándo usarlo?** **Siempre** durante el desarrollo en tu máquina local cada vez que cambias el `schema.prisma`. Esto crea un historial de cambios que es esencial para mantener la base de datos consistente.

*   **`npm run prisma:deploy` (`prisma db push`) (Para Producción/Vercel):**
    *   **¿Qué hace?** Compara tu `schema.prisma` directamente con la base de datos y la modifica para que coincidan. **No crea archivos de migración.**
    *   **¿Cuándo usarlo?** Este comando es ideal para entornos de producción o de prueba (como Vercel) donde no necesitas un historial, solo quieres que la base de datos refleje el esquema actual. **No necesitas ejecutarlo manualmente**, ya que está incluido en el script de `build`.

### 3.3. Guía Definitiva: Escenarios Comunes

#### Escenario 1: Primera Configuración (Base de Datos Nueva)

Si estás configurando el proyecto desde cero con una base de datos vacía en Supabase:

1.  **Configura tu `.env`:** Asegúrate de que `DATABASE_URL` esté correctamente configurada como se explicó en el Paso 1 (usando el puerto **5432**).
2.  **Sincroniza el Esquema:** Ejecuta el comando de "deploy" para crear todas las tablas y estructuras en tu base de datos por primera vez.
    ```bash
    npm run prisma:deploy
    ```
3.  **Puebla con Datos Iniciales:** Ejecuta el comando "seed" para llenar la base de datos con el usuario administrador y datos de prueba.
    ```bash
    npm run prisma:seed
    ```

¡Y listo! Tu base de datos está configurada, poblada y lista para usar.

#### Escenario 2: Desarrollo Continuo (Aplicar Nuevos Cambios)

Si ya tienes una base de datos funcionando y has hecho cambios en tu archivo `prisma/schema.prisma` (ej. añadir una nueva tabla o campo):

1.  **Modifica `prisma/schema.prisma`:** Haz los cambios que necesites en el esquema.
2.  **Crea y Aplica la Migración:** Ejecuta el comando de desarrollo. Esto generará el archivo de migración y lo aplicará a tu base de datos.
    ```bash
    npm run prisma:migrate
    ```
    Prisma te pedirá que le des un nombre descriptivo a la migración (ej: `add_course_tags`).

### 3.4. ¿Y en Producción (Vercel)?

**No necesitas hacer nada manualmente.** El script de `build` en tu `package.json` ya está configurado para ejecutar `prisma db push` automáticamente cada vez que Vercel despliega tu aplicación. Esto asegura que tu base de datos de producción siempre estará sincronizada con la última versión de tu `schema.prisma`.

```json
"scripts": {
  "build": "prisma db push && prisma generate && next build"
}
```

## 4. Estándares de Codificación

*   **TypeScript:** Utilizar tipado estricto siempre que sea posible.
*   **Componentes:** Favorecer el uso de componentes de ShadCN (`@/components/ui`) y crear componentes reutilizables en `@/components/`.
*   **Estilos:** Utilizar clases de Tailwind CSS. Evitar CSS en línea o archivos CSS separados.
*   **Formularios:** Utilizar `react-hook-form` para la gestión de formularios complejos.
*   **Código Asíncrono:** Utilizar `async/await` para operaciones asíncronas.
*   **Comentarios:** Añadir comentarios JSDoc a funciones complejas y a las props de los componentes para clarificar su propósito.
