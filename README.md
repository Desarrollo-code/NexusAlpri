# NexusAlpri - Plataforma E-learning Corporativa

NexusAlpri es una solución de e-learning moderna y completa, diseñada específicamente para las necesidades de formación interna de microempresas y organizaciones. Construida con un stack tecnológico de vanguardia (Next.js, TypeScript, Prisma, Tailwind CSS), ofrece una experiencia de usuario fluida, segura y altamente personalizable.

## ¿Qué es NexusAlpri?

Es una plataforma integral que permite a las empresas gestionar todo su ciclo de formación: desde la creación de contenido y la gestión de cursos, hasta la inscripción de usuarios y el seguimiento de su progreso. Está diseñada para ser intuitiva tanto para los estudiantes como para los instructores y administradores.

## Características Principales

La plataforma se organiza en torno a tres roles de usuario clave (Estudiante, Instructor y Administrador), cada uno con un conjunto de herramientas adaptadas a sus necesidades.

### Para Todos los Usuarios:

*   **Panel Principal (Dashboard):** Una vista personalizada con estadísticas relevantes, anuncios recientes y accesos rápidos.
*   **Catálogo de Cursos:** Explora e inscríbete en los cursos publicados por la empresa.
*   **Biblioteca de Recursos:** Accede a un repositorio centralizado de documentos, guías y políticas importantes, con la opción de proteger archivos sensibles con un PIN.
*   **Anuncios y Calendario:** Mantente informado sobre las novedades, eventos y fechas clave de la organización.
*   **Perfil de Usuario:** Gestiona tu información personal, cambia tu contraseña y configura la autenticación de dos factores (2FA) para mayor seguridad.

### Para Instructores y Administradores:

*   **Gestión de Cursos Completa:** Crea, edita y publica cursos. Organiza el contenido en módulos y lecciones, que pueden incluir videos, texto, archivos descargables y quizzes interactivos.
*   **Editor de Contenido Drag & Drop:** Reordena módulos y lecciones fácilmente arrastrando y soltando.
*   **Gestión de Inscritos:** Supervisa el progreso de los estudiantes en los cursos que impartes.

### Funcionalidades Exclusivas para Administradores:

*   **Gestión de Usuarios:** Añade, edita, elimina y cambia los roles de todos los usuarios de la plataforma.
*   **Configuración del Sistema:** Personaliza el comportamiento de la plataforma, incluyendo:
    *   Nombre de la aplicación.
    *   Habilitar/deshabilitar el registro público de usuarios.
    *   Definir políticas de complejidad para las contraseñas.
    *   Configurar el cierre de sesión automático por inactividad.
    *   Gestionar las categorías de recursos disponibles.
*   **Estadísticas Avanzadas:** Visualiza métricas clave sobre el uso de la plataforma, como la distribución de usuarios por rol y el estado de los cursos.

## Stack Tecnológico

*   **Framework:** Next.js (con App Router)
*   **Lenguaje:** TypeScript
*   **Estilos:** Tailwind CSS y ShadCN UI
*   **Base de Datos:** MySQL con Prisma ORM
*   **Autenticación:** JWT en cookies http-only con soporte para 2FA
