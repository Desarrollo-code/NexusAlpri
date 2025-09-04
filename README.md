
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

*   **Gestión de Cursos Completa:** Crea, edita y publica cursos. Define títulos, descripciones y categorías para una fácil organización.
*   **Contenido Multimedia Interactivo:** Organiza el curso en módulos y lecciones. Cada lección puede contener **videos de YouTube, texto enriquecido, enlaces externos, archivos descargables (PDF, imágenes, etc.) y quizzes interactivos** para evaluar el conocimiento.
*   **Imagen de Portada Perfecta:** Al crear un curso, sube una imagen y utiliza la **herramienta integrada para recortar y adaptar la imagen**, asegurando que la portada se vea profesional y atractiva en el catálogo.
*   **Editor de Contenido Drag & Drop:** Reordena fácilmente módulos y lecciones simplemente arrastrándolos y soltándolos, permitiendo una estructuración rápida e intuitiva del material de estudio.
*   **Gestión de Inscritos:** Supervisa el progreso de los estudiantes en los cursos que impartes y visualiza quiénes están inscritos.

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
