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
3.  **Modelado de la Base de Datos:** Se escribió el `schema.prisma` basado en los requisitos definidos en los manuales, incluyendo todas las tablas (User, Course, Module, Lesson, Resource, etc.) y sus relaciones.
4.  **Configuración de Despliegue:** Se configuró Vercel para conectarse a Supabase y se ajustó el script de `build` para sincronizar automáticamente el esquema de la base de datos.
5.  **Estructura de Carpetas:** Se organizó el proyecto siguiendo la arquitectura definida, separando las rutas públicas, las de autenticación y las protegidas de la aplicación.

---

### Fase 4: Desarrollo del Backend y Lógica de Negocio

Esta fase se centró en construir el "cerebro" de la aplicación a través de los API Endpoints.

1.  **Autenticación y Sesiones:** Se implementó la lógica de autenticación con JWT en cookies (`/api/auth/...`) y el `middleware` para proteger las rutas.
2.  **CRUD de Entidades:** Se desarrollaron los endpoints para las operaciones básicas (Crear, Leer, Actualizar, Eliminar) de las entidades principales: Cursos, Usuarios, Recursos, etc.
3.  **Lógicas de Negocio Clave:** Se implementaron las lógicas más complejas, como el sistema de progreso automático, las notificaciones y la gestión de permisos.

---

### Fase 5: Desarrollo de la Interfaz de Usuario (UI/UX)

Con el backend funcional, el enfoque se trasladó a la experiencia del usuario.

1.  **Layout Principal:** Se construyó el layout principal de la aplicación (`/src/app/(app)/layout.tsx`), incluyendo la barra lateral de navegación y la barra superior.
2.  **Construcción de Páginas:** Se desarrollaron las páginas para cada una de las funcionalidades, conectándolas con los endpoints de la API.
3.  **Componentes Reutilizables:** Se crearon componentes especializados como `CourseCard`, `AnnouncementCard` y `QuizViewer`.
4.  **Estilización y Tema:** Se aplicaron los estilos visuales utilizando Tailwind CSS y se configuró el sistema de temas.

---

### Fase 6: Evolución y Funcionalidades Avanzadas

Una vez establecida la base sólida, el proyecto entró en una fase de mejora continua y adición de características de alto valor.

1.  **Gamificación Avanzada:**
    *   **Certificados Personalizables:** Se implementó un gestor de plantillas para que los administradores pudieran diseñar y personalizar los certificados de finalización de curso.
    *   **Mensajes de Motivación:** Se creó un sistema para configurar mensajes emergentes (toasts) que felicitan al usuario al alcanzar hitos específicos, como completar un curso o subir de nivel.
2.  **Interactividad en Tiempo Real:**
    *   **Quizz-IT:** Se desarrolló un modo de juego en tiempo real que permite a los instructores lanzar un quiz y a los participantes unirse con un PIN para competir en vivo.
3.  **Mejoras en la Gestión y Experiencia de Usuario:**
    *   **Módulo de Continuidad (Roadmap):** Se creó una página dedicada a mostrar la hoja de ruta y la evolución del proyecto, haciendo transparente el proceso de desarrollo.
    *   **Preferencias de Privacidad:** Se añadió la opción para que los usuarios puedan ocultar su perfil de la tabla de clasificación pública.
    *   **Renovación de Temas:** Se refinó la paleta de colores, reemplazando los temas iniciales por una selección curada de temas pastel para una estética más profesional y cohesiva.
4.  **Refinamiento y Pruebas Continuas:**
    *   Se realizaron ajustes finos a la interfaz basados en la usabilidad.
    *   Se optimizó el código para mejorar el rendimiento, especialmente en la carga de datos y las interacciones del usuario.
    *   Se preparó el proyecto para despliegues continuos, asegurando la estabilidad en cada actualización.
