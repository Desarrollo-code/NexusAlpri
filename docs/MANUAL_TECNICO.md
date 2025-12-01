# Manual Técnico de NexusAlpri

## 1. Introducción

Este documento proporciona una visión técnica de la arquitectura, base de datos y configuración del proyecto NexusAlpri. Está dirigido a desarrolladores y personal técnico que necesiten entender, mantener o extender la aplicación.

**Stack Tecnológico Principal:**
*   **Framework:** Next.js 15+ (con App Router y Server Components)
*   **Lenguaje:** TypeScript
*   **Base de Datos:** PostgreSQL (gestionada con Prisma ORM en Supabase)
*   **Almacenamiento de Archivos:** Supabase Storage (S3 compatible).
*   **Estilos:** Tailwind CSS y ShadCN UI.
*   **Autenticación:** JWT almacenado en cookies http-only, con soporte para 2FA.
*   **Tiempo Real:** Supabase Realtime para notificaciones y funcionalidades en vivo.

---

## 2. Arquitectura del Sistema

NexusAlpri está construido sobre una arquitectura de **servidor monolítico con renderizado en el servidor (SSR) y componentes de servidor (RSC)**, aprovechando al máximo las características de Next.js App Router.

*   **Componentes del Servidor (RSC):** La mayoría de los componentes se renderizan en el servidor, permitiendo un acceso directo y seguro a la base de datos (a través de Prisma).
*   **Componentes de Cliente (`'use client'`):** Solo los componentes que requieren interactividad (hooks, event listeners) se marcan explícitamente.
*   **API Routes (`/src/app/api`):** La lógica de negocio que modifica datos (CUD) se expone a través de API Routes, sirviendo como un backend claro para el cliente.

### Diagrama de Arquitectura Simplificado
```
[ Cliente (Navegador) ]
        |
        |--- Petición HTTP ---> [ Servidor Next.js (Vercel) ]
        |                             |
        |<-- HTML/JS/CSS -----|       |
        |                             |
        |--- (API Calls) ----> [ API Routes ] --(Escribe/Lee)--> [ Prisma ORM ]
        |                             |                             |
        |                             +-----(Acceso Directo)-----> [ Server Components ]
        |                                                           |
        |<----(WebSockets)----> [ Supabase Realtime ] <----(DB)---- [ Supabase (PostgreSQL) ]
                                      ^
                                      |-----(DB Triggers)-----------+
```
---

## 3. Diagrama de Clases (Modelos de Prisma Principales)

*   `User`: Representa a un usuario.
    *   **Campos clave:** `id`, `name`, `email`, `password`, `role`, `isActive`, `xp`, `theme`, `processId`, `customPermissions`.
    *   **Relaciones:** Tiene `Course` (como instructor), `Enrollment`, `CourseProgress`, `Announcement`, `UserNote`, `FormResponse`, `CourseComment`, etc.

*   `Course`: Representa un curso.
    *   **Campos clave:** `id`, `title`, `status`, `instructorId`, `isMandatory`, `prerequisiteId`, `certificateTemplateId`.
    *   **Relaciones:** Pertenece a un `User` (instructor). Tiene muchos `Module`, `Enrollment`, `CourseComment`. Tiene un `prerequisite` (auto-relación).

*   `Lesson`: Una lección dentro de un módulo.
    *   **Relaciones:** Tiene muchos `ContentBlock` y `UserNote`.

*   `ContentBlock`: Bloque de contenido (texto, video, quiz).
    *   **Relaciones:** Puede tener un `Quiz`.

*   `EnterpriseResource`: Representa un archivo, enlace, carpeta o lista de reproducción.
    *   **Campos clave:** `id`, `title`, `type` (FOLDER, DOCUMENT, VIDEO_PLAYLIST, etc.), `isPublic`, `pin`.
    *   **Relaciones:** Puede tener un `parentId` (para carpetas), y puede tener un `Quiz` asociado.

*   `CalendarEvent`: Un evento en el calendario.
    *   **Campos clave:** `id`, `title`, `start`, `end`, `recurrence`, `isInteractive`.

*   `SecurityLog`: Registro de auditoría de seguridad.
*   `Achievement` / `UserAchievement`: Sistema de logros y gamificación.
*   `MotivationalMessage`: Mensajes emergentes para hitos.
*   `CertificateTemplate`: Plantillas para certificados PDF.
*   `Process`: Estructura jerárquica de procesos de la empresa.

---

## 4. Guía de Despliegue e Instalación

### 5.1. Conexión a la Base de Datos (Supabase + Prisma)
Es crucial usar dos variables de entorno para la base de datos:
*   `DATABASE_URL`: La URL con el **connection pooler** (puerto 6543) para el funcionamiento normal de la aplicación.
*   `DIRECT_URL`: La URL de **conexión directa** (puerto 5432) para las migraciones de Prisma (`prisma migrate`).

Ambas deben estar referenciadas en `prisma/schema.prisma` en el `datasource db`.

### 5.2. Almacenamiento de Archivos (Supabase Storage)
La subida de archivos depende de "buckets" públicos creados manualmente en Supabase Storage. La lista de buckets requeridos ha crecido e incluye: `avatars`, `course_images`, `settings_images`, `lesson_files`, `resource_library`, `announcement_attachments`, `comment_attachments`, `event_images`, `form_images`.

### 5.3. Tareas Programadas (Cron Jobs)
El sistema utiliza "Cron Jobs" (configurados en `vercel.json`) para tareas de mantenimiento:
*   `/api/cron/cleanup`: Limpia datos obsoletos como cursos archivados y notificaciones antiguas.
*   `/api/cron/check-expirations`: Notifica a los autores sobre recursos que están por expirar.
*   `/api/cron/notify-interactive-events`: Envía notificaciones para eventos interactivos del día.
Estos endpoints están protegidos por una variable de entorno `CRON_SECRET`.

---

## 6. API y Módulos de Integración

Los endpoints de la API en `/src/app/api/` gestionan toda la lógica de negocio. Se han añadido o expandido varios endpoints clave:

*   `/api/roadmap/...`: CRUD para la gestión de la hoja de ruta del proyecto.
*   `/api/processes/...`: CRUD y endpoints de asignación para la estructura organizacional.
*   `/api/certificates/...`: CRUD para las plantillas de certificados.
*   `/api/motivations/...`: CRUD para los mensajes de motivación.
*   `/api/courses/[id]/comments`: Gestión de comentarios por curso.
*   `/api/events/participate`: Endpoint para registrar la participación en eventos interactivos.
*   `/api/quizz-it/...`: Endpoints para gestionar el juego de quizzes en tiempo real.
*   `/api/upload/...`: Se han creado endpoints específicos para subir archivos a diferentes buckets (ej. `form-image`, `event-image`).

---

## 7. Estructura del Proyecto

La estructura del proyecto ha evolucionado para incluir nuevas funcionalidades y mantener la organización.

```
src/
├── app/
│   ├── (app)/              # Rutas protegidas
│   │   ├── admin/          # Rutas exclusivas de administrador
│   │   ├── ...
│   │   └── layout.tsx      # Layout principal de la app (con Sidebar)
│   ├── (public)/           # Páginas públicas
│   │   └── layout.tsx      # Layout público
│   ├── api/
│   │   ├── cron/           # Endpoints para tareas programadas
│   │   ├── quizz-it/       # Endpoints para el juego en tiempo real
│   │   └── ...             # Resto de la API
│   ├── certificates/[id]/view/ # Ruta pública para visualizar certificados
│   └── layout.tsx          # Layout raíz de la aplicación
├── components/
│   ├── analytics/
│   ├── announcements/
│   ├── calendar/
│   ├── certificates/
│   ├── dashboard/
│   ├── forms/
│   ├── gamification/
│   ├── layout/
│   ├── motivations/
│   ├── profile/
│   ├── quizz-it/
│   ├── resources/
│   ├── roadmap/
│   ├── security/
│   └── users/
├── contexts/
│   ├── auth-context.tsx
│   ├── title-context.tsx
│   └── tour-context.tsx
├── lib/
│   ├── auth-utils.ts       # Funciones de ayuda para permisos
│   ├── calendar-utils.ts   # Lógica de expansión de eventos recurrentes
│   ├── gamification.ts     # Lógica central de XP, logros y niveles
│   └── ...