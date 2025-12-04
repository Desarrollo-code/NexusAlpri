# Ruta de Desarrollo y Fases del Proyecto NexusAlpri

Este documento describe el ciclo de vida y la ruta de desarrollo seguida para crear la plataforma NexusAlpri, desde la concepción inicial hasta la implementación de sus características clave.

---

### **FASE 1: Concepción y Planificación Estratégica**

*   **Objetivo:** Establecer las bases del proyecto, definir el alcance y validar la idea central.
*   **Hito 1: Definición del Problema**
    *   Se identificó la necesidad de una plataforma de e-learning corporativa que fuera robusta, segura y fácil de usar.
*   **Hito 2: Identificación de Roles de Usuario**
    *   Se definieron los tres perfiles clave: **Administrador**, **Instructor** y **Estudiante**.
*   **Hito 3: Producto Mínimo Viable (MVP)**
    *   Se listaron las características esenciales: gestión de usuarios, creación de cursos, biblioteca de recursos y sistema de progreso.

---

### **FASE 2: Documentación como Pilar del Desarrollo**

*   **Objetivo:** Crear una guía maestra "document-driven" para alinear el desarrollo con los objetivos de negocio antes de escribir código.
*   **Hito 1: Creación de Manuales**
    *   **Manual Técnico:** Se definió el stack tecnológico (**Next.js**, **Supabase**, **Prisma**) y la arquitectura.
    *   **Manuales de Usuario y Admin:** Se redactaron guías detalladas para cada rol.
*   **Hito 2: Matriz de Trazabilidad**
    *   Se creó una tabla para conectar cada requisito funcional con un rol y un resultado esperado.

---

### **FASE 3: Arquitectura y Desarrollo del Núcleo**

*   **Objetivo:** Construir el esqueleto funcional de la aplicación.
*   **Hito 1: Inicialización y Backend**
    *   Se creó el proyecto **Next.js** con App Router y **TypeScript**.
    *   Se implementó el `schema.prisma` y se desarrollaron los endpoints API para las **operaciones CRUD** básicas (usuarios, cursos, autenticación).
*   **Hito 2: Interfaz Base**
    *   Se construyó el layout principal, incluyendo la barra lateral y las páginas de gestión iniciales.

---

### **FASE 4: Transformación y Diferenciación**

*   **Objetivo:** Evolucionar de un **MVP** a una plataforma rica en funcionalidades de alto valor.
*   **Hito 1: Gamificación Avanzada**
    *   **Certificados:** Sistema completo con plantillas personalizables y generación de PDF.
    *   **Motivación:** Mensajes emergentes para hitos y "Pausas Activas" interactivas.
*   **Hito 2: Gestión de Contenido Mejorada**
    *   **Progresión Lineal** en cursos.
    *   **Quizzes** adjuntos a recursos de la biblioteca.
*   **Hito 3: Interactividad y Colaboración**
    *   **Quizz-IT:** Modo de juego de quizzes en tiempo real.
    *   **Comentarios y Chat:** Se habilitó una sección de discusión en los cursos y mensajería directa.

---

### **FASE 5: Consolidación y Madurez de la Plataforma**

*   **Objetivo:** Refinar la experiencia del usuario y añadir capas de profundidad a las funcionalidades existentes.
*   **Hito 1: Renovación de Paneles**
    *   **Panel Principal Renovado:** Vistas únicas y personalizadas para cada rol.
    *   **Perfil de Usuario Potenciado:** Centro de mando personal para gestionar información, seguridad, logros y temas.
*   **Hito 2: Control Central y Personalización**
    *   **Control Central:** Página de "Usuarios" rediseñada para gestionar colaboradores y estructura organizacional.
    *   **Personalización Visual:** Introducción de una paleta de temas de color.
*   **Hito 3: Hoja de Ruta Interactiva**
    *   Creación de una página para visualizar la evolución del proyecto de forma interactiva.
