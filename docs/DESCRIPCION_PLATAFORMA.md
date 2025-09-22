# Descripción Detallada de la Plataforma NexusAlpri

Este documento proporciona una visión integral y detallada de la arquitectura, funcionalidades y lógicas de negocio de NexusAlpri, una plataforma de e-learning corporativa.

---

## 1. Visión General y Arquitectura

NexusAlpri es una solución de formación interna para empresas, construida sobre un stack tecnológico moderno que incluye **Next.js (con App Router)**, **TypeScript**, **Prisma ORM** para la base de datos y **Tailwind CSS** con componentes de **ShadCN** para la interfaz.

La arquitectura se divide en tres capas principales:

1.  **Capa Pública (`/src/app/(public)` y `/src/app/(auth)`):**
    *   Páginas accesibles para cualquier visitante, como la página de inicio (`landing`), "Acerca de nosotros", y los formularios de inicio de sesión y registro.
    *   No requiere autenticación.

2.  **Capa de Aplicación Protegida (`/src/app/(app)`):**
    *   El núcleo de la plataforma, accesible solo para usuarios autenticados.
    *   Un `middleware` se encarga de verificar la sesión del usuario y redirigir al login si no está autenticado.
    *   Contiene todas las funcionalidades principales como el panel de control, cursos, recursos, etc.

3.  **Capa de API (`/src/app/api`):**
    *   El backend de la aplicación. Define todos los endpoints que gestionan la lógica de negocio, como la interacción con la base de datos, la gestión de sesiones y el procesamiento de datos.

---

## 2. Roles de Usuario

La plataforma se estructura en torno a tres roles con distintos niveles de permisos:

*   **Estudiante (`STUDENT`):** El rol base. Puede inscribirse y consumir cursos, ver recursos y participar en la plataforma.
*   **Instructor (`INSTRUCTOR`):** Puede hacer todo lo que hace un estudiante, y además puede crear, gestionar y publicar sus propios cursos, así como hacer seguimiento a los estudiantes inscritos en ellos.
*   **Administrador (`ADMINISTRATOR`):** Tiene control total. Puede gestionar todos los usuarios, todos los cursos (independientemente de quién los creó), y configurar los ajustes globales de la plataforma.

---

## 3. Descripción Detallada de Módulos y Secciones

### 3.1. Autenticación y Perfil de Usuario

*   **Inicio de Sesión y Registro:** Formularios seguros para acceder o crear una cuenta. El registro público y las políticas de dominio de correo se pueden configurar desde el panel de administrador.
*   **Autenticación de Dos Factores (2FA):** Los usuarios pueden activar una capa extra de seguridad usando una aplicación de autenticación (como Google Authenticator). Los administradores pueden forzar la activación de 2FA para otros administradores.
*   **Gestión de Perfil (`/profile`):** Cada usuario puede editar su nombre y cambiar su foto de perfil. También pueden gestionar su contraseña y el estado de su 2FA.
*   **Gamificación en Perfil:** El perfil muestra el **nivel y los puntos de experiencia (XP)** del usuario, así como los **logros** que ha desbloqueado, incentivando la participación.

### 3.2. Panel Principal (`/dashboard`)

Es la primera página que ve un usuario al iniciar sesión. Su contenido es dinámico y se adapta al rol del usuario:

*   **Para Estudiantes:** Muestra un resumen de sus cursos inscritos, su progreso y los últimos anuncios de la plataforma.
*   **Para Instructores:** Presenta estadísticas de los cursos que imparte, como el número de cursos creados, y accesos directos para gestionarlos.
*   **Para Administradores:** Ofrece una vista global con métricas clave como el número total de usuarios, cursos, actividad reciente y registros de seguridad importantes.

### 3.3. Gestión de Cursos (`/manage-courses` y `/courses`)

*   **Catálogo de Cursos (`/courses`):** Página pública (para usuarios logueados) donde se listan todos los cursos en estado `PUBLISHED`. Los usuarios pueden explorar e inscribirse desde aquí.
*   **Mis Cursos (`/my-courses`):** Una vista filtrada que muestra solo los cursos en los que el usuario está actualmente inscrito, mostrando su progreso en cada uno.
*   **Gestión de Cursos (`/manage-courses`):**
    *   **Creación:** Instructores y Admins pueden crear nuevos cursos, definiendo título, descripción y categoría.
    *   **Edición de Contenido (`/manage-courses/[id]/edit`):** Esta es la sección más compleja. Permite:
        *   **Estructurar en Módulos y Lecciones:** El contenido se organiza jerárquicamente.
        *   **Editor Drag & Drop:** Se puede reordenar módulos y lecciones fácilmente arrastrándolos.
        *   **Contenido de Lección:** Cada lección puede contener múltiples bloques de contenido: texto enriquecido, videos de YouTube, enlaces externos, archivos descargables (PDF, imágenes) y **Quizzes interactivos**.
        *   **Subida de Imágenes:** Se puede subir una imagen de portada para el curso.
*   **Estados de Curso:**
    *   `DRAFT` (Borrador): El curso no es visible para nadie más que su creador y los administradores.
    *   `PUBLISHED` (Publicado): Visible en el catálogo para inscripción.
    *   `ARCHIVED` (Archivado): Oculto del catálogo, pero se conservan los datos de los inscritos.

### 3.4. Lógica de Progreso del Estudiante

El sistema de progreso está diseñado para ser automático y reflejar la interacción real:

1.  **Interacción Pasiva:** Una lección se marca como completada cuando el estudiante la selecciona en el menú. Si contiene un video, se marca como completada cuando el video finaliza.
2.  **Interacción Activa (Quizzes):** El sistema guarda la puntuación obtenida en un quiz al ser enviado.
3.  **Cálculo Final:** Una vez que el estudiante ha interactuado con **todas** las lecciones del curso, se habilita un botón para **"Calcular Puntuación Final"**. Al presionarlo, el sistema calcula un promedio ponderado de todas las interacciones y guarda una nota final en el perfil del estudiante.

### 3.5. Contenido Global

*   **Biblioteca de Recursos (`/resources`):** Un repositorio centralizado para documentos de la empresa.
    *   **Organización:** Se pueden crear carpetas para organizar los archivos.
    *   **Tipos de Archivo:** Soporta la subida de documentos, videos, imágenes o la adición de enlaces externos.
    *   **Control de Acceso:** Un recurso puede ser **Público** (visible para todos) o **Privado**. Si es privado, se puede compartir con usuarios específicos.
    *   **Seguridad con PIN:** Se puede añadir una capa extra de seguridad a cualquier recurso protegiéndolo con un PIN numérico.
*   **Anuncios (`/announcements`):** Los administradores e instructores pueden crear anuncios. Estos pueden ser dirigidos a toda la plataforma o a roles específicos (ej. "Solo para Estudiantes").
*   **Calendario (`/calendar`):** Permite crear eventos, definir su fecha, hora, y una audiencia (todos, un rol específico, o una lista de asistentes seleccionados). El calendario de cada usuario solo muestra los eventos que le conciernen.
*   **Mis Apuntes (`/my-notes`):** Una sección donde los estudiantes pueden ver todas las notas que han tomado dentro de las lecciones, organizadas por curso y módulo en un formato de "tablero de corcho".

### 3.6. Formularios y Evaluaciones (`/forms`)

Este es un sistema robusto para crear encuestas o exámenes personalizados.

*   **Creación y Edición:** Un instructor o admin puede crear un formulario y añadirle preguntas de distintos tipos (texto corto, párrafo, opción única, opción múltiple).
*   **Modo Evaluación (Quiz):** Se puede activar un "modo quiz" que permite asignar puntos a las respuestas de opción única. Al enviar el formulario, el sistema califica automáticamente y guarda la puntuación.
*   **Compartición y Resultados:** Los formularios pueden ser compartidos con usuarios específicos o publicados para acceso general. La sección de resultados muestra métricas agregadas y gráficos de distribución de respuestas para cada pregunta.

### 3.7. Administración de la Plataforma (Solo Administradores)

*   **Gestión de Usuarios (`/users`):**
    *   Ver, buscar y filtrar a todos los usuarios.
    *   Crear nuevos usuarios manualmente.
    *   Editar la información de cualquier usuario, incluyendo su rol.
    *   **Activar o Inactivar usuarios:** Un usuario inactivo no puede iniciar sesión.
*   **Analíticas (`/analytics`):** Un panel de control visual con métricas clave sobre la plataforma, como la distribución de usuarios por rol, los cursos más populares, la tasa de finalización promedio y tendencias de registro.
*   **Auditoría de Seguridad (`/security-audit`):** Un registro detallado de todos los eventos de seguridad importantes: inicios de sesión (exitosos y fallidos), cambios de contraseña, cambios de rol, etc., incluyendo la dirección IP y el dispositivo del usuario.
*   **Configuración del Sistema (`/settings`):**
    *   **Apariencia:** Cambiar el nombre de la plataforma, subir logos, marca de agua e imágenes para las páginas públicas, y personalizar la paleta de colores y las fuentes de la aplicación.
    *   **Seguridad:** Habilitar/deshabilitar el registro público, configurar la complejidad de las contraseñas, gestionar el cierre de sesión por inactividad y forzar 2FA para admins.
    *   **Categorías:** Administrar la lista de categorías que se usan en los cursos y en la biblioteca de recursos.

Este documento resume el estado actual y completo de la plataforma NexusAlpri.