
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

---

## 2. Arquitectura del Sistema

NexusAlpri está construido sobre una arquitectura de **servidor monolítico con renderizado en el servidor (SSR) y componentes de servidor (RSC)**, aprovechando al máximo las características de Next.js App Router.

*   **Componentes del Servidor (RSC):** La mayoría de los componentes de la aplicación se renderizan en el servidor por defecto. Esto permite un acceso directo y seguro a la base de datos (a través de Prisma) sin necesidad de exponer una API para cada consulta de datos, mejorando la seguridad y el rendimiento.
*   **Componentes de Cliente:** Solo los componentes que requieren interactividad (hooks como `useState`, `useEffect`, etc.) se marcan con la directiva `'use client'`.
*   **API Routes:** La lógica de negocio que necesita ser llamada desde el cliente (ej. envíos de formularios, acciones que modifican datos) se expone a través de API Routes en la carpeta `/src/app/api`.

### Diagrama de Arquitectura Simplificado

```
[ Cliente (Navegador) ]
        |
        |--- Petición HTTP ---> [ Servidor Next.js (Vercel) ]
                                      |
      +-------------------------------------------------------------+
      |                                                             |
[ Middleware ] --(Verifica Sesión)--> [ Rutas (App Router) ]          |
      |                                       |                     |
      |                                       |                     |
(Redirige si no auth)                [ Server Components ] --(Lee datos)--> [ Prisma ORM ]
      |                                       |                     |
      |                                [ Client Components ]          |
      |                                       |                     |
      +------------(Llama a API)-----> [ API Routes ] --(Escribe datos)--> [ Prisma ORM ]
                                              |                           |
                                              |                           |
                                              +----(Interactúa con)--> [ Supabase (PostgreSQL + Storage) ]
```

---

## 3. Diagrama de Clases (Modelos de Prisma)

A continuación se describen las entidades principales del sistema, basadas en el `schema.prisma`.

*   `User`: Representa a un usuario.
    *   **Campos clave:** `id`, `name`, `email`, `password`, `role` (ADMINISTRATOR, INSTRUCTOR, STUDENT), `isActive`.
    *   **Relaciones:** Tiene muchos `Course` (como instructor), `Enrollment`, `CourseProgress`, `Announcement`, `UserNote`, `FormResponse`, etc.

*   `Course`: Representa un curso.
    *   **Campos clave:** `id`, `title`, `description`, `status` (DRAFT, PUBLISHED, ARCHIVED), `instructorId`.
    *   **Relaciones:** Pertenece a un `User` (instructor). Tiene muchos `Module`, `Enrollment`.

*   `Module`: Un módulo dentro de un curso.
    *   **Campos clave:** `id`, `title`, `order`, `courseId`.
    *   **Relaciones:** Pertenece a un `Course`. Tiene muchas `Lesson`.

*   `Lesson`: Una lección dentro de un módulo.
    *   **Campos clave:** `id`, `title`, `order`, `moduleId`.
    *   **Relaciones:** Pertenece a una `Module`. Tiene muchos `ContentBlock`.

*   `ContentBlock`: Un bloque de contenido dentro de una lección (texto, video, quiz, etc.).
    *   **Campos clave:** `id`, `type` (TEXT, VIDEO, QUIZ), `content`, `order`.
    *   **Relaciones:** Pertenece a una `Lesson`. Puede tener un `Quiz`.

*   `Enrollment`: Vincula a un `User` con un `Course`.
    *   **Campos clave:** `id`, `userId`, `courseId`, `enrolledAt`.

*   `CourseProgress`: Registra el avance de un `User` en un `Course`.
    *   **Campos clave:** `id`, `progressPercentage`, `completedAt`.

*   `EnterpriseResource`: Representa un archivo o carpeta en la Biblioteca de Recursos.
    *   **Campos clave:** `id`, `title`, `type` (FOLDER, DOCUMENT, etc.), `isPublic`, `pin`.

---

## 4. Requisitos Técnicos

*   **Entorno de Ejecución:** Node.js v20.x o superior.
*   **Base de Datos:** PostgreSQL (se recomienda usar a través de Supabase).
*   **Almacenamiento de Archivos:** Servicio compatible con S3 (se recomienda Supabase Storage).
*   **Navegadores Soportados:** Últimas versiones de Chrome, Firefox, Safari y Edge.

---

## 5. Guía de Despliegue e Instalación

### 5.1. Conexión a la Base de Datos (Supabase + Prisma): La Guía Infalible

Para ejecutar `prisma migrate dev`, Prisma necesita una conexión directa a la base de datos que el gestor de conexiones (pooler) de Supabase no soporta por defecto.

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
    Asegúrate de que tu `prisma/schema.prisma` haga referencia a ambas variables.
    ```prisma
    datasource db {
      provider  = "postgresql"
      url       = env("DATABASE_URL")
      directUrl = env("DIRECT_URL")
    }
    ```

### 5.2. Almacenamiento de Archivos (Supabase Storage)

Para que la subida de archivos funcione, **debes crear manualmente los "buckets" públicos** en Supabase: `avatars`, `course_images`, `settings_images`, `lesson_files`, `resource_library`, `announcement_attachments`.

### 5.3. Comandos de Prisma

*   **Aplicar cambios de `schema.prisma` en desarrollo:**
    ```bash
    npm run prisma:migrate
    ```
*   **Aplicar las migraciones en producción (y entornos de vista previa):**
    ```bash
    npm run prisma:deploy
    ```
*   **Poblar con datos de prueba:**
    ```bash
    npm run prisma:seed
    ```

---

## 6. API y Módulos de Integración

Los endpoints de la API se definen en `src/app/api/` y siguen la convención de enrutamiento de Next.js.

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

---

## 7. Mantenimiento y Solución de Problemas

*   **Copias de Seguridad:** La responsabilidad de las copias de seguridad de la base de datos recae en la configuración de la infraestructura del servidor (en este caso, Supabase). Asegúrate de tener una política de copias de seguridad regular configurada en tu proveedor.
*   **Logs del Sistema:** Los logs de la aplicación (errores, accesos) son gestionados por el entorno de despliegue (ej. Vercel, Docker, un servidor PM2). Consulta la documentación de tu proveedor de hosting para acceder a ellos.
*   **Errores Comunes:** La mayoría de los errores en el despliegue inicial se deben a una configuración incorrecta de las variables de entorno (`DATABASE_URL`, `DIRECT_URL`) o a la falta de creación de los buckets en Supabase Storage.

---

## 8. Estructura del Proyecto

```
src/
├── app/
│   ├── (app)/              # Rutas protegidas (Dashboard, Cursos, etc.)
│   ├── (auth)/             # Rutas de autenticación (Login, Register)
│   ├── (public)/           # Rutas públicas (Landing, About)
│   ├── api/                # Endpoints de la API del backend
│   ├── globals.css         # Estilos globales y tema
│   └── layout.tsx          # Layout principal de la aplicación
├── components/
│   ├── ui/                 # Componentes base de ShadCN
│   ├── auth/               # Componentes para autenticación
│   ├── layout/             # Componentes de la estructura (Sidebar, TopBar)
│   └── ...                 # Componentes reutilizables de la app
├── contexts/
│   ├── auth-context.tsx    # Contexto para la sesión y configuración global
│   └── ...
├── lib/
│   ├── auth.ts             # Lógica de sesión (JWT, cookies)
│   ├── prisma.ts           # Instancia global del cliente de Prisma
│   └── utils.ts            # Funciones de utilidad
├── hooks/
│   └── ...                 # Hooks personalizados
└── prisma/
    ├── migrations/         # Migraciones de la base de datos
    ├── schema.prisma       # Definición del esquema de la base de datos
    └── seed.ts             # Script para poblar con datos de prueba
```
