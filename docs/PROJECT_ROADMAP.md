
# Ruta de Desarrollo y Fases del Proyecto NexusAlpri

Este documento describe el ciclo de vida y la ruta de desarrollo seguida para crear la plataforma NexusAlpri, desde la concepción inicial hasta la implementación de sus características clave.

---

### Fase 1: Concepción y Planificación Estratégica

1.  **Definición del Problema:** Se identificó la necesidad de una plataforma de e-learning corporativa que fuera robusta, segura y fácil de usar para empresas, con un enfoque en la gestión de roles y contenido.
2.  **Identificación de Roles de Usuario:** Se definieron los tres perfiles de usuario principales que dictarían la arquitectura de la aplicación:
    *   **Administrador:** Control total sobre la plataforma.
    *   **Instructor:** Creación y gestión de contenido formativo.
    *   **Estudiante:** Consumo de cursos y seguimiento del progreso.
3.  **Listado de Características Clave (MVP):** Se elaboró una lista de las funcionalidades esenciales para cada rol, como la gestión de usuarios, la creación de cursos con contenido multimedia, la biblioteca de recursos, el sistema de progreso automático y la configuración de la plataforma.

---

### Fase 2: Documentación como Pilar del Desarrollo

Antes de escribir una sola línea de código, se crearon los documentos fundamentales que servirían como guía durante todo el proceso. Este enfoque "document-driven" aseguró que el desarrollo estuviera siempre alineado con los objetivos.

1.  **Manual Técnico (`MANUAL_TECNICO.md`):** Se definió el stack tecnológico (Next.js, Supabase, Tailwind), la arquitectura de carpetas, el flujo de datos y el esquema de la base de datos (`schema.prisma`).
2.  **Manual de Usuario (`MANUAL_USUARIO.md`):** Se redactó una guía detallada desde la perspectiva del estudiante, explicando cómo interactuar con la plataforma.
3.  **Manual de Administración (`MANUAL_ADMINISTRACION.md`):** Se documentaron todos los procesos que un administrador realizaría, desde la gestión de usuarios hasta la configuración del sistema.
4.  **Matriz de Trazabilidad (`MATRIZ_TRAZABILIDAD.md`):** Se creó una tabla exhaustiva que conectaba cada requisito funcional con un rol de usuario y un resultado esperado. Este documento se convirtió en el plan de pruebas funcionales.

---

### Fase 3: Arquitectura y Configuración del Proyecto

1.  **Inicialización del Proyecto:** Se creó un nuevo proyecto Next.js utilizando el App Router y TypeScript.
2.  **Configuración de Estilos:** Se instaló y configuró Tailwind CSS y ShadCN UI, estableciendo la base para el sistema de diseño.
3.  **Modelado de la Base de Datos:** Se escribió el `schema.prisma` basado en los requisitos definidos en los manuales, incluyendo todas las tablas (User, Course, Module, Lesson, Resource, etc.) y sus relaciones, para ser usado con Supabase.
4.  **Configuración de Despliegue:** Se configuró Vercel para conectarse a Supabase y se ajustó el script de `build` para sincronizar automáticamente el esquema de la base de datos en cada despliegue.
5.  **Estructura de Carpetas:** Se organizó el proyecto siguiendo la arquitectura definida en el manual técnico, separando las rutas públicas, las de autenticación y las protegidas de la aplicación.

---

### Fase 4: Desarrollo del Backend y Lógica de Negocio

Esta fase se centró en construir el "cerebro" de la aplicación a través de los API Endpoints.

1.  **Autenticación y Sesiones:** Se implementó la lógica de autenticación con JWT en cookies (`/api/auth/...`). Se creó el `middleware.ts` para proteger las rutas.
2.  **CRUD de Entidades:** Se desarrollaron los endpoints para las operaciones básicas (Crear, Leer, Actualizar, Eliminar) de las entidades principales:
    *   `/api/users`: Gestión de usuarios.
    *   `/api/courses`: Gestión de cursos y su contenido.
    *   `/api/resources`: Gestión de la biblioteca de recursos.
    *   `/api/enrollments`: Gestión de inscripciones.
3.  **Lógicas de Negocio Clave:** Se implementaron las lógicas más complejas definidas en el manual técnico:
    *   Sistema de progreso automático (`/api/progress/...`).
    *   Sistema de notificaciones (`/api/notifications/...`).
    *   Sistema de eventos del calendario con audiencias (`/api/events/...`).

---

### Fase 5: Desarrollo de la Interfaz de Usuario (UI/UX)

Con el backend funcional, el enfoque se trasladó a la experiencia del usuario.

1.  **Layout Principal:** Se construyó el layout principal de la aplicación (`/src/app/(app)/layout.tsx`), incluyendo la barra lateral de navegación y la barra superior.
2.  **Contextos Globales:** Se crearon los contextos de React para gestionar el estado global, como `AuthContext` y `TitleContext`.
3.  **Construcción de Páginas:** Se desarrollaron las páginas para cada una de las funcionalidades, conectándolas con los endpoints de la API correspondientes:
    *   Páginas de autenticación (`/sign-in`, `/sign-up`).
    *   Dashboard dinámico según el rol.
    *   Páginas de gestión (usuarios, cursos, etc.).
    *   Páginas de consumo (detalle del curso, biblioteca, etc.).
4.  **Componentes Reutilizables:** Se crearon componentes especializados como `CourseCard`, `AnnouncementCard` y `QuizViewer` para encapsular la lógica y mantener un código limpio.
5.  **Estilización y Tema:** Se aplicaron los estilos visuales utilizando Tailwind CSS y se configuró el sistema de temas (claro/oscuro) en `globals.css`.

---

### Fase 6: Refinamiento, Pruebas y Despliegue

1.  **Pruebas Funcionales:** Se utilizó la `MATRIZ_TRAZABILIDAD.md` como una lista de verificación para probar cada una de las funcionalidades desde la perspectiva de cada rol.
2.  **Iteración y Feedback:** Se realizaron ajustes finos a la interfaz y a la experiencia de usuario basados en la usabilidad y la coherencia visual (ej. mejora de colores en gráficos, ajuste de la tarjeta de perfil).
3.  **Optimización:** Se revisó el código para mejorar el rendimiento, especialmente en la carga de datos y las interacciones del usuario.
4.  **Preparación para Despliegue:** Se configuró el proyecto para un entorno de producción, asegurando que las variables de entorno y los scripts de construcción fueran correctos.
