# Ruta de Desarrollo y Fases del Proyecto NexusAlpri

Este documento describe el ciclo de vida y la ruta de desarrollo seguida para crear la plataforma NexusAlpri, desde la concepción inicial hasta la implementación de sus características clave.

---

### Fase 1: Concepción y Planificación Estratégica

**Objetivo:** Establecer las bases del proyecto, definir el alcance y validar la idea central.

*   **Definición del Problema:**
    *   Se identificó la necesidad de una plataforma de e-learning corporativa que fuera robusta, segura y fácil de usar para empresas, con un enfoque en la gestión de roles y contenido.

*   **Identificación de Roles de Usuario:**
    *   Se definieron los tres perfiles clave:
        *   **Administrador:** Control total.
        *   **Instructor:** Creación y gestión de contenido.
        *   **Estudiante:** Consumo de cursos.

*   **Producto Mínimo Viable (MVP):**
    *   Se listaron las características esenciales: gestión de usuarios, creación de cursos, biblioteca de recursos y sistema de progreso.

---

### Fase 2: Documentación como Pilar del Desarrollo

**Objetivo:** Crear una guía maestra "document-driven" para alinear el desarrollo con los objetivos de negocio antes de escribir código.

*   **Manual Técnico:** Se definió el **stack tecnológico** (Next.js, Supabase, Prisma) y la arquitectura.
*   **Manuales de Usuario y Admin:** Se redactaron guías detalladas para cada rol.
*   **Matriz de Trazabilidad:** Se creó una tabla para conectar cada requisito funcional con un rol y un resultado esperado.

---

### Fase 3: Arquitectura y Desarrollo del Núcleo

**Objetivo:** Construir el esqueleto funcional de la aplicación.

*   **Inicialización:** Se creó el proyecto Next.js con App Router y TypeScript.
*   **Backend y Modelado:** Se implementó el `schema.prisma` y se desarrollaron los endpoints API para las **operaciones CRUD** básicas (usuarios, cursos, autenticación).
*   **Interfaz Base:** Se construyó el layout principal, incluyendo la barra lateral y las páginas de gestión.

---

### Fase 4: Transformación y Diferenciación

**Objetivo:** Evolucionar de un MVP a una plataforma rica en funcionalidades de alto valor.

*   **Gamificación Avanzada:**
    *   **Certificados:** Sistema completo con plantillas personalizables y generación de PDF.
    *   **Motivación:** Mensajes emergentes para hitos y "Pausas Activas" interactivas para ganar XP.
*   **Gestión de Contenido Mejorada:**
    *   **Progresión Lineal:** El estudiante debe completar una lección para desbloquear la siguiente.
    *   **Quizzes en Recursos:** Se añadió la capacidad de adjuntar evaluaciones a cualquier archivo de la biblioteca.
*   **Interactividad y Colaboración:**
    *   **Quizz-IT:** Modo de juego de quizzes en tiempo real.
    *   **Comentarios y Chat:** Se habilitó una sección de discusión en los cursos y un sistema de mensajería directa 1-a-1.

---

### Fase 5: Consolidación y Madurez de la Plataforma

**Objetivo:** Refinar la experiencia del usuario y añadir capas de profundidad a las funcionalidades existentes.

*   **Panel Principal Renovado:** Vistas únicas y personalizadas para cada rol.
*   **Perfil de Usuario Potenciado:** Centro de mando personal para gestionar información, seguridad, logros y temas.
*   **Control Central:** Página de "Usuarios" rediseñada para gestionar colaboradores y estructura organizacional con asignación por arrastrar y soltar.
*   **Personalización Visual:** Introducción de una paleta de temas de color.
*   **Hoja de Ruta Interactiva:** Creación de una página para visualizar la evolución del proyecto.
