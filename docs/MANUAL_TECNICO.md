
# Manual Técnico de NexusAlpri

## 1. Introducción

Este documento proporciona una visión técnica de la arquitectura, base de datos y configuración del proyecto NexusAlpri. Está dirigido a desarrolladores y personal técnico que necesiten entender, mantener o extender la aplicación.

**Stack Tecnológico Principal:**
*   **Framework:** Next.js 15+ (con App Router y Server Components)
*   **Lenguaje:** TypeScript
*   **Base de Datos:** MySQL (gestionada con Prisma ORM)
*   **Estilos:** Tailwind CSS
*   **Componentes UI:** ShadCN
*   **Autenticación:** JWT almacenado en cookies http-only

## 2. Arquitectura del Sistema

### 2.1. Estructura de Carpetas

*   `src/app/(app)/`: Contiene las rutas y páginas protegidas de la aplicación (Dashboard, Cursos, etc.).
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
4.  La lógica de la API utiliza el cliente de **Prisma** (`@/lib/prisma`) para interactuar con la base de datos MySQL.
5.  Los datos se devuelven como JSON al componente o al cliente.

## 3. Base de Datos

### 3.1. Esquema (Prisma)

El esquema se define en `prisma/schema.prisma`. Los modelos principales son:
*   `User`: Almacena usuarios, roles y credenciales.
*   `Course`, `Module`, `Lesson`: Estructura jerárquica de los cursos.
*   `Quiz`, `Question`, `AnswerOption`: Componentes para las evaluaciones.
*   `Enrollment`: Relaciona a un `User` con un `Course`.
*   `CourseProgress`: Guarda el progreso de un usuario en un curso.
*   `Resource`: Para la biblioteca de recursos (archivos y carpetas).
*   `Announcement`, `CalendarEvent`, `Notification`: Para comunicación y eventos.
*   `PlatformSettings`: Almacena la configuración global de la plataforma.

### 3.2. Migraciones

Las migraciones se gestionan con Prisma Migrate. Para crear una nueva migración después de modificar `schema.prisma`:
```bash
npm run prisma:migrate -- --name <nombre_descriptivo_de_la_migracion>
```
Esto aplicará los cambios a la base de datos y creará un nuevo archivo de migración SQL.

## 4. Documentación de API Endpoints

Las rutas de la API se encuentran en `src/app/api/`. Algunos endpoints clave son:
*   `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`: Manejan todo el ciclo de vida de la autenticación.
*   `/api/users`: CRUD para la gestión de usuarios (solo Admins).
*   `/api/courses`: CRUD para cursos.
*   `/api/enrollments`: Para inscribir usuarios y ver inscripciones.
*   `/api/progress`: Para obtener y actualizar el progreso de los cursos.
*   `/api/resources`: CRUD para la biblioteca de recursos.
*   `/api/settings`: Para obtener y guardar la configuración de la plataforma.

La autenticación se realiza a través de un token JWT en una cookie de sesión. El `middleware.ts` protege las rutas.

## 5. Configuración del Entorno de Desarrollo

1.  **Requisitos:** Node.js, npm, y una base de datos MySQL en ejecución.
2.  **Instalación:**
    ```bash
    npm install
    ```
3.  **Variables de Entorno:**
    Crea un archivo `.env` en la raíz del proyecto y define las siguientes variables:
    ```env
    DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
    JWT_SECRET="genera-una-cadena-aleatoria-muy-segura-aqui"
    ```
4.  **Aplicar Migraciones:**
    ```bash
    npm run prisma:migrate
    ```
5.  **Ejecutar el Proyecto:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:9002`.

## 6. Estándares de Codificación

*   **TypeScript:** Utilizar tipado estricto siempre que sea posible.
*   **Componentes:** Favorecer el uso de componentes de ShadCN (`@/components/ui`) y crear componentes reutilizables en `@/components/`.
*   **Estilos:** Utilizar clases de Tailwind CSS. Evitar CSS en línea o archivos CSS separados.
*   **Formularios:** Utilizar `react-hook-form` para la gestión de formularios complejos.
*   **Código Asíncrono:** Utilizar `async/await` para operaciones asíncronas.
*   **Comentarios:** Añadir comentarios JSDoc a funciones complejas y a las props de los componentes para clarificar su propósito.

