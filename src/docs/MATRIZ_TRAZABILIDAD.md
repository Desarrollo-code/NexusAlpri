# Matriz de Trazabilidad de Requisitos - NexusAlpri

Este documento detalla la relación entre los requisitos funcionales, los roles de usuario y las áreas clave de la aplicación, explicando qué puede hacer cada rol, dónde lo hace, qué tipo de información se ve afectada y cuál es el resultado esperado.

---

## 1. Rol: Administrador (`ADMINISTRATOR`)

El administrador tiene control total sobre la plataforma.

| ID | Módulo/Funcionalidad | Descripción del Requisito | Ubicación en la App | Datos Involucrados | Resultado Esperado |
| :-- | :--- | :--- | :--- | :--- | :--- |
| **A-01** | **Gestión de Usuarios** | Visualizar, buscar y paginar todos los usuarios de la plataforma. | `/users` | Información de todos los usuarios. | La tabla muestra la lista de usuarios. La búsqueda filtra los resultados correctamente. |
| **A-02** | | Crear un nuevo usuario con nombre, email, contraseña y rol. | `/users` (Modal) | Creación de un nuevo registro de usuario. | El nuevo usuario aparece en la lista. El usuario puede iniciar sesión con las credenciales proporcionadas. |
| **A-03** | | Editar la información de un usuario existente (nombre, email). | `/users` (Modal) | Actualización de la información de un usuario. | Los cambios se reflejan inmediatamente en la lista de usuarios. |
| **A-04** | | Cambiar el rol de un usuario. | `/users` (Modal) | Rol del usuario, Registro de seguridad. | El nuevo rol del usuario se muestra en la lista. Se genera un log de seguridad. |
| **A-05** | | Eliminar un usuario de la plataforma (excepto a sí mismo). | `/users` | Eliminación de datos del usuario, inscripciones y progreso. | El usuario desaparece de la lista. El usuario ya no puede iniciar sesión. |
| **A-06** | **Gestión de Cursos** | Crear un nuevo curso (borrador inicial). | `/manage-courses` (Modal) | Creación de un nuevo registro de curso. | Se redirige a la página de edición del nuevo curso. El curso aparece en la lista como "Borrador". |
| **A-07** | | Editar toda la información de cualquier curso (título, imagen, etc.). | `/manage-courses/[id]/edit` | Actualización de la información de un curso. | Los cambios se guardan y persisten al recargar la página. |
| **A-08** | | Añadir, editar, reordenar y eliminar contenido en cualquier curso. | `/manage-courses/[id]/edit` | Estructura completa del curso (módulos, lecciones, etc.). | La estructura del curso se actualiza visualmente y se guarda correctamente. |
| **A-09** | | Publicar, archivar o cambiar a borrador el estado de un curso. | `/manage-courses` | Estado de un curso. | El estado del curso cambia visualmente (ej. la insignia) y se notifica a los usuarios si se publica. |
| **A-10** | | Eliminar cualquier curso de la plataforma. | `/manage-courses` | Eliminación completa de un curso y su contenido. | El curso desaparece de la lista. Todos los datos asociados se eliminan. |
| **A-11** | **Analíticas** | Ver un dashboard con estadísticas clave de la plataforma. | `/analytics` | Datos de usuarios, cursos, inscripciones, etc. | Se muestran gráficos y métricas actualizadas sobre el uso de la plataforma. |
| **A-12** | **Auditoría** | Revisar un registro de eventos de seguridad importantes. | `/security-audit` | Registros de eventos de seguridad. | La tabla muestra una lista cronológica de los eventos de seguridad con sus detalles. |
| **A-13** | **Configuración** | Ver y modificar la configuración general de la plataforma. | `/settings` | Ajustes de la plataforma (nombre, políticas, etc.). | Los cambios se guardan y se aplican en toda la plataforma (ej. cambio de nombre). |
| **A-14** | **Contenido Global** | Crear, editar y eliminar anuncios, eventos del calendario y recursos. | `/announcements`, `/calendar`, `/resources` | Anuncios, Eventos, Recursos de la biblioteca. | Las acciones (crear, editar, eliminar) se reflejan inmediatamente en las respectivas secciones. |
| **A-15** | **Inscripciones** | Ver el progreso y los inscritos de cualquier curso. | `/enrollments` | Inscripciones y progreso de los estudiantes. | Al seleccionar un curso, se muestra la lista de estudiantes inscritos y su progreso. |

---

## 2. Rol: Instructor (`INSTRUCTOR`)

El instructor gestiona sus propios cursos y estudiantes.

| ID | Módulo/Funcionalidad | Descripción del Requisito | Ubicación en la App | Datos Involucrados | Resultado Esperado |
| :-- | :--- | :--- | :--- | :--- | :--- |
| **I-01** | **Dashboard** | Ver un panel con resúmenes de los cursos que imparte. | `/dashboard` | Cursos creados por el instructor. | Se muestra un resumen y accesos directos a los cursos del instructor. |
| **I-02** | **Gestión de Cursos** | Crear un nuevo curso, que se le asigna automáticamente. | `/manage-courses` (Modal) | Creación de un nuevo registro de curso. | Se redirige a la página de edición del nuevo curso. El instructor se asigna como creador. |
| **I-03** | | Ver y gestionar únicamente los cursos que ha creado. | `/manage-courses` | Cursos creados por el instructor. | La lista solo muestra los cursos donde el usuario es el instructor. |
| **I-04** | | Editar la información y contenido de sus propios cursos. | `/manage-courses/[id]/edit` | Actualización y estructura de sus cursos. | El instructor puede modificar sus cursos, pero no los de otros. |
| **I-05** | | Publicar, archivar o cambiar a borrador el estado de sus cursos. | `/manage-courses` | Estado de sus cursos. | El instructor puede cambiar el estado de sus propios cursos. |
| **I-06** | **Seguimiento** | Ver la lista de estudiantes inscritos en sus cursos y su progreso. | `/enrollments` | Inscripciones y progreso de los estudiantes en sus cursos. | El instructor puede seleccionar sus cursos y ver quién está inscrito y su avance. |
| **I-07** | **Contenido Global** | Crear anuncios y eventos en el calendario para diferentes audiencias. | `/announcements`, `/calendar` | Anuncios, Eventos del calendario. | El instructor puede crear comunicados y eventos visibles para otros usuarios. |
| **I-08** | | Subir, editar y eliminar los recursos que ha subido a la biblioteca. | `/resources` | Recursos de la biblioteca. | El instructor puede gestionar los archivos que él mismo ha subido. |
| **I-09** | **Perfil** | Editar su propio perfil y gestionar su contraseña y 2FA. | `/profile` | Información de su propia cuenta. | El usuario puede actualizar su nombre, avatar y seguridad personal. |

---

## 3. Rol: Estudiante (`STUDENT`)

El estudiante consume el contenido formativo de la plataforma.

| ID | Módulo/Funcionalidad | Descripción del Requisito | Ubicación en la App | Datos Involucrados | Resultado Esperado |
| :-- | :--- | :--- | :--- | :--- | :--- |
| **S-01** | **Dashboard** | Ver un panel con resúmenes de sus cursos inscritos y anuncios. | `/dashboard` | Sus inscripciones, su progreso, anuncios. | El panel muestra tarjetas con los cursos en los que está inscrito y los últimos anuncios. |
| **S-02** | **Catálogo de Cursos** | Explorar todos los cursos publicados en la plataforma. | `/courses` | Lista de cursos públicos. | El estudiante ve todas las ofertas formativas publicadas, excepto sus propios cursos si es también instructor. |
| **S-03** | | Inscribirse a un curso público. | `/courses` | Creación de un registro de inscripción. | El botón "Inscribirse" cambia a "Continuar Curso" y el curso aparece en "Mis Cursos". |
| **S-04** | | Cancelar la inscripción a un curso. | `/my-courses` | Eliminación de su inscripción y progreso. | El curso desaparece de "Mis Cursos" y vuelve a estar disponible en el Catálogo. |
| **S-05** | **Consumo de Curso** | Navegar y ver el contenido de las lecciones (texto, video, etc.). | `/courses/[courseId]` | Contenido de la lección, Registro de interacción. | El contenido de la lección se muestra en el área principal. La lección se marca como vista. |
| **S-06** | | Realizar y enviar quizzes dentro de una lección. | `/courses/[courseId]` | Preguntas del quiz, Registro de la nota. | Después de responder, el sistema muestra el resultado y guarda la puntuación. |
| **S-07** | **Progreso** | Solicitar el cálculo de la puntuación final del curso. | `/courses/[courseId]` | Consolidación de la nota final. | Tras ver todas las lecciones, el botón se activa. Al pulsarlo, se muestra la nota final en el indicador circular. |
| **S-08** | **Biblioteca** | Acceder y descargar recursos de la biblioteca. | `/resources` | Lista de recursos disponibles. | El estudiante puede navegar por las carpetas y ver o descargar los archivos. |
| **S-09** | | Ingresar un PIN para acceder a recursos protegidos. | `/resources` | Verificación del PIN de un recurso. | Si el PIN es correcto, se concede el acceso al archivo; si no, se muestra un error. |
| **S-10** | **Perfil** | Editar su propio perfil y gestionar su contraseña y 2FA. | `/profile` | Información de su propia cuenta. | El estudiante puede actualizar su nombre, avatar y configuraciones de seguridad. |
| **S-11** | **Autenticación** | Iniciar sesión y registrarse (si está habilitado). | `/sign-in`, `/sign-up` | Su cuenta de usuario, Registro de seguridad. | El usuario puede acceder a la plataforma o crear una cuenta nueva. |
| **S-12** | | Cerrar sesión de forma segura. | (Botón en Layout) | Cierre de su sesión actual. | El usuario es desconectado y redirigido a la página de inicio de sesión. |
| **S-13** | **Notificaciones** | Ver y gestionar sus notificaciones personales. | `/notifications` (Popover y página) | Sus notificaciones personales. | El estudiante puede ver una lista de sus notificaciones, marcarlas como leídas o eliminarlas. |
| **S-14** | **Calendario** | Ver los eventos del calendario que le conciernen. | `/calendar` | Eventos del calendario. | El estudiante puede ver un calendario con los eventos dirigidos a él, a su rol o a todos. |
| **S-15** | **Anuncios** | Ver los anuncios relevantes para él. | `/announcements` | Anuncios de la plataforma. | El estudiante ve los anuncios dirigidos a él, a su rol o a todos los usuarios. |
| **S-16** | **Mis Cursos** | Ver una lista dedicada de los cursos en los que está inscrito. | `/my-courses` | Sus inscripciones, su progreso. | La página muestra solo los cursos en los que está inscrito, con su progreso visible. |
    