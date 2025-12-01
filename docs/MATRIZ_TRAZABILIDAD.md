# Matriz de Trazabilidad de Requisitos - NexusAlpri

Este documento detalla la relación entre los requisitos funcionales, los roles de usuario y las áreas clave de la aplicación.

---

## 1. Rol: Administrador (`ADMINISTRATOR`)

| ID | Módulo/Funcionalidad | Descripción del Requisito | Ubicación en la App | Resultado Esperado |
| :-- | :--- | :--- | :--- | :--- |
| **A-01** | **Gestión de Usuarios** | Visualizar, buscar, filtrar y paginar todos los usuarios. | `/users` | La tabla/cuadrícula muestra la lista de usuarios. La búsqueda y filtros funcionan. |
| **A-02** | | Crear un nuevo usuario con rol, proceso y permisos granulares. | `/users` (Modal) | El nuevo usuario aparece en la lista y puede iniciar sesión. |
| **A-03** | | Editar la información de un usuario (nombre, email, rol, proceso, permisos). | `/users` (Modal) | Los cambios se reflejan inmediatamente. |
| **A-04** | | Inactivar o activar un usuario (excepto a sí mismo). | `/users` (Menú de Acciones) | El estado del usuario cambia y el acceso se bloquea/desbloquea. |
| **A-05** | **Gestión de Procesos** | Crear, editar, reordenar y eliminar procesos y subprocesos. | `/users` (Barra Lateral) | La estructura organizacional se actualiza. |
| **A-06** | | Asignar usuarios a procesos mediante arrastrar y soltar o en lote. | `/users` | El proceso asignado al usuario se actualiza. |
| **A-07** | **Gestión de Cursos** | Crear, editar, publicar, archivar y eliminar cualquier curso. | `/manage-courses`, `/manage-courses/[id]/edit` | El ciclo de vida del curso se gestiona correctamente. |
| **A-08** | | Definir prerrequisitos, fechas de vigencia y si un curso es obligatorio. | `/manage-courses/[id]/edit` | Las reglas del curso se aplican en el catálogo y las inscripciones. |
| **A-09** | | Asignar cursos obligatorios a usuarios específicos. | `/manage-courses` (Menú de Acciones) | Los usuarios seleccionados son notificados y el curso aparece en su dashboard. |
| **A-10** | **Gamificación** | Crear y gestionar plantillas para certificados de finalización. | `/admin/certificates` | Las plantillas están disponibles para ser asignadas a los cursos. |
| **A-11** | | Crear y gestionar mensajes de motivación para hitos específicos. | `/admin/motivations` | Los mensajes emergentes se muestran a los usuarios cuando alcanzan el hito. |
| **A-12** | **Analíticas y Auditoría** | Ver un dashboard con estadísticas clave y rankings de la plataforma. | `/analytics` | Se muestran gráficos y métricas actualizadas sobre el uso de la plataforma. |
| **A-13** | | Revisar un registro detallado de eventos de seguridad. | `/security-audit` | La tabla muestra una lista cronológica de los eventos de seguridad. |
| **A-14** | **Configuración** | Personalizar la apariencia, estilos, seguridad, categorías y hoja de ruta. | `/settings` | Los cambios se aplican en toda la plataforma (ej. cambio de nombre, colores). |
| **A-15** | **Recursos** | Crear, editar y eliminar cualquier recurso, carpeta o lista de reproducción. | `/resources` | El contenido de la biblioteca se gestiona correctamente. |

---

## 2. Rol: Instructor (`INSTRUCTOR`)

| ID | Módulo/Funcionalidad | Descripción del Requisito | Ubicación en la App | Resultado Esperado |
| :-- | :--- | :--- | :--- | :--- |
| **I-01** | **Gestión de Cursos** | Crear, editar, publicar y eliminar **sus propios** cursos. | `/manage-courses` | El instructor solo puede gestionar los cursos donde es el autor. |
| **I-02** | | Añadir contenido interactivo (texto, video, quiz) a sus cursos. | `/manage-courses/[id]/edit` | El contenido de las lecciones se actualiza. |
| **I-03** | **Seguimiento** | Ver la lista de estudiantes inscritos en sus cursos y su progreso. | `/enrollments` | El instructor puede ver el avance detallado de sus estudiantes. |
| **I-04** | **Quizz-IT** | Iniciar un juego de quiz en tiempo real basado en un formulario. | `/forms` (Menú de Acciones) | Se genera un PIN para que los estudiantes se unan y compitan en vivo. |
| **I-05** | **Contenido Global** | Crear anuncios y eventos en el calendario para diferentes audiencias. | `/announcements`, `/calendar` | El instructor puede crear comunicados y eventos. |
| **I-06** | **Recursos** | Subir, editar y eliminar los recursos que ha subido. Crear listas de reproducción. | `/resources` | El instructor puede gestionar sus propios archivos y listas de videos. |
| **I-07** | **Formularios** | Crear y analizar los resultados de sus propios formularios y evaluaciones. | `/forms` | El instructor puede crear y ver las respuestas de sus formularios. |

---

## 3. Rol: Estudiante (`STUDENT`)

| ID | Módulo/Funcionalidad | Descripción del Requisito | Ubicación en la App | Resultado Esperado |
| :-- | :--- | :--- | :--- | :--- |
| **S-01** | **Dashboard** | Ver un resumen de cursos, anuncios y eventos interactivos (Pausas Activas). | `/dashboard` | El panel muestra información personalizada y relevante. |
| **S-02** | **Inscripción** | Inscribirse a un curso, respetando los prerrequisitos. | `/courses` | El curso aparece en "Mis Cursos" si se cumplen los requisitos. |
| **S-03** | **Consumo de Curso** | Navegar y ver contenido de lecciones de forma secuencial. | `/courses/[courseId]` | El estudiante solo puede avanzar a la siguiente lección si completó la anterior. |
| **S-04** | | Participar en la sección de comentarios del curso. | `/courses/[courseId]` | El estudiante puede publicar preguntas y respuestas. |
| **S-05** | **Gamificación** | Ver su nivel, XP y logros desbloqueados. | `/profile` | El perfil del usuario muestra sus estadísticas de gamificación. |
| **S-06** | | Competir en la tabla de clasificación general. | `/leaderboard` | El ranking muestra la posición del usuario basada en sus XP. |
| **S-07** | **Certificados** | Descargar y compartir un certificado PDF al completar un curso. | `/certificates/[id]/view` | Se genera un certificado con un diseño personalizado. |
| **S-08** | **Recursos** | Acceder a listas de reproducción de videos y ver el contenido de forma secuencial. | `/resources` | El visor de listas de reproducción permite una experiencia de micro-learning. |
| **S-09** | **Chat** | Iniciar conversaciones uno a uno con otros usuarios. | `/messages` | El sistema de mensajería permite la comunicación directa. |
| **S-10** | **Quizz-IT** | Unirse a un juego de quiz en tiempo real con un PIN. | `/quizz-it/join` | El estudiante participa en una competencia en vivo. |