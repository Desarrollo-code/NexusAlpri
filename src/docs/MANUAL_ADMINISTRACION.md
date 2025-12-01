# Manual de Administración de NexusAlpri

## 1. Introducción

Este manual está destinado a los usuarios con el rol de **Administrador**. Proporciona una guía completa para gestionar la plataforma, los usuarios, el contenido y la configuración del sistema.

## 2. Gestión de Usuarios y Procesos (`/users`)

Desde esta sección (ahora llamada "Control Central"), puedes realizar las siguientes acciones:
*   **Visualizar Usuarios:** Ver una lista o cuadrícula de todos los usuarios registrados, con su nombre, email, rol y estado.
*   **Buscar y Filtrar:** Utiliza la barra de búsqueda y los filtros avanzados para encontrar usuarios específicos por rol, estado o proceso.
*   **Añadir un Nuevo Usuario:**
    1.  Haz clic en "Añadir Colaborador".
    2.  Completa el nombre, email, rol, proceso y una contraseña inicial.
    3.  Define permisos de acceso granulares para el usuario si es necesario.
*   **Editar un Usuario:**
    1.  Haz clic en el menú de acciones (tres puntos) de un usuario y selecciona "Editar".
    2.  Puedes modificar el nombre, email, rol, proceso y permisos.
*   **Inactivar/Activar un Usuario:**
    1.  Selecciona "Inactivar" (o "Activar") en el menú de acciones. Un usuario inactivo **no podrá iniciar sesión**.
    *Nota: No puedes inactivar tu propia cuenta.*
*   **Gestión de Procesos:**
    *   Crea, edita y elimina los procesos y subprocesos de tu organización.
    *   Asigna usuarios a procesos arrastrándolos desde la lista de usuarios y soltándolos sobre un proceso en la estructura de árbol.

## 3. Gestión de Cursos (`/manage-courses`)

Esta sección es el centro de control para todo el contenido formativo.
*   **Crear un Curso:**
    1.  Haz clic en "Crear Nuevo Curso".
    2.  Ingresa un título, descripción, categoría y si es un curso obligatorio o tiene prerrequisitos.
    3.  Serás redirigido a la página de edición completa.
*   **Editar un Curso:**
    *   En la página de edición, puedes modificar la información general, subir una imagen, y lo más importante: **añadir módulos y lecciones**.
    *   Puedes reordenar módulos y lecciones arrastrándolos.
*   **Asignar Cursos Obligatorios:** Si un curso está marcado como obligatorio, puedes usar la opción "Asignar Curso" para inscribir forzosamente a usuarios específicos.
*   **Gestionar Estado del Curso:**
    *   **Borrador (Draft):** El curso no es visible para los estudiantes.
    *   **Publicado (Published):** El curso es visible en el catálogo y los estudiantes pueden inscribirse.
    *   **Archivado (Archived):** El curso se oculta del catálogo principal pero conserva los datos de los usuarios inscritos.

## 4. Gestión de Contenido Global

### 4.1. Anuncios (`/announcements`)
*   Crea anuncios con tarjetas de color, contenido enriquecido y archivos adjuntos.
*   Fija anuncios importantes en la parte superior del feed.
*   Supervisa quién ha leído el anuncio y cómo han reaccionado.

### 4.2. Calendario (`/calendar`)
*   Crea eventos, talleres o recordatorios.
*   **Eventos Recurrentes:** Programa eventos para que se repitan (diariamente, semanalmente, etc.).
*   **Eventos Interactivos:** Crea "Pausas Activas" que aparecen como alertas para los usuarios, permitiéndoles confirmar su participación para ganar XP.

### 4.3. Biblioteca de Recursos (`/resources`)
*   **Subir Archivos:** Sube documentos, videos, imágenes, o añade enlaces.
*   **Crear Listas de Reproducción:** Agrupa videos de YouTube o subidos por ti en una lista ordenada para crear un micro-curso.
*   **Documentos Editables:** Crea y edita documentos directamente en la plataforma, con un historial de versiones para rastrear cambios.
*   **Control de Acceso y Seguridad:** Protege recursos con un PIN, hazlos privados, o compártelos con usuarios o colaboradores específicos.

### 4.4. Formularios y Evaluaciones (`/forms`)
*   Crea encuestas o evaluaciones con diferentes tipos de preguntas.
*   Activa el "Modo Quiz" para calificar automáticamente las respuestas.
*   Personaliza la apariencia con imágenes y colores.
*   Analiza los resultados con gráficos y tablas detalladas.

## 5. Gamificación y Reconocimiento

### 5.1. Mensajes de Motivación (`/admin/motivations`)
*   Crea ventanas emergentes con texto, imágenes o videos que se disparan en momentos clave (ej. al completar un curso, al subir de nivel).

### 5.2. Certificados (`/admin/certificates`)
*   **Diseñar Plantillas:** Crea y personaliza las plantillas para los certificados de finalización.
*   **Asignar a Cursos:** Vincula una plantilla de certificado a un curso en la página de edición del mismo para que se genere automáticamente al finalizar.

## 6. Configuración del Sistema (`/settings`)

Esta sección te permite personalizar el comportamiento de toda la plataforma.
*   **Apariencia y Estilo:** Cambia el nombre de la plataforma, los logos, la paleta de colores, las fuentes y todas las imágenes decorativas.
*   **Seguridad y Acceso:**
    *   Configura el registro público, la política de contraseñas y el cierre por inactividad.
    *   Fuerza 2FA para administradores.
*   **Categorías y Hoja de Ruta:**
    *   Gestiona la lista de categorías usadas en cursos y recursos.
    *   Define las fases y la visibilidad de la página de la hoja de ruta del proyecto.

## 7. Mantenimiento y Monitoreo

*   **Auditoría de Seguridad (`/security-audit`):** Revisa un registro detallado de todos los eventos de seguridad, con gráficos y métricas sobre la salud de la plataforma.
*   **Analíticas (`/analytics`):** Obtén una visión global del rendimiento de la plataforma, incluyendo rankings de cursos y usuarios, y tendencias de actividad.
*   **Salud del Sistema:** El panel principal del administrador incluye un widget que monitorea el estado en tiempo real de la API y la base de datos.
