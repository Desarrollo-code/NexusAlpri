# Matriz de Trazabilidad de Requisitos - NexusAlpri

Este documento detalla la relación entre los requisitos funcionales, los roles de usuario y las áreas clave de la aplicación, explicando qué puede hacer cada rol, dónde lo hace y qué tipo de información se ve afectada.

---

## 1. Rol: Administrador (`ADMINISTRATOR`)

El administrador tiene control total sobre la plataforma.

| ID | Módulo/Funcionalidad | Descripción del Requisito | Ubicación en la App | Datos Involucrados |
| :-- | :--- | :--- | :--- | :--- |
| **A-01** | **Gestión de Usuarios** | Visualizar, buscar y paginar todos los usuarios de la plataforma. | `/users` | Información de todos los usuarios. |
| **A-02** | | Crear un nuevo usuario con nombre, email, contraseña y rol. | `/users` | Creación de un nuevo registro de usuario. |
| **A-03** | | Editar la información de un usuario existente (nombre, email). | `/users` | Actualización de la información de un usuario. |
| **A-04** | | Cambiar el rol de un usuario. | `/users` | Rol del usuario, Registro de seguridad. |
| **A-05** | | Eliminar un usuario de la plataforma (excepto a sí mismo). | `/users` | Eliminación de datos del usuario, sus inscripciones y su progreso. |
| **A-06** | **Gestión de Cursos** | Crear un nuevo curso (borrador inicial). | `/manage-courses` | Creación de un nuevo registro de curso. |
| **A-07** | | Editar toda la información de cualquier curso (título, imagen, etc.). | `/manage-courses/[id]/edit` | Actualización de la información de un curso. |
| **A-08** | | Añadir, editar, reordenar y eliminar módulos, lecciones y contenido en cualquier curso. | `/manage-courses/[id]/edit` | Estructura completa del curso (módulos, lecciones, quices, preguntas). |
| **A-09** | | Publicar, archivar o cambiar a borrador el estado de cualquier curso. | `/manage-courses` | Estado de un curso. |
| **A-10** | | Eliminar cualquier curso de la plataforma. | `/manage-courses` | Eliminación completa de un curso y su contenido. |
| **A-11** | **Analíticas** | Ver un dashboard con estadísticas clave de la plataforma. | `/analytics` | Datos de usuarios, cursos, inscripciones y registros de seguridad. |
| **A-12** | **Auditoría** | Revisar un registro de eventos de seguridad importantes. | `/security-audit` | Registros de eventos de seguridad. |
| **A-13** | **Configuración** | Ver y modificar la configuración general de la plataforma. | `/settings` | Ajustes de la plataforma (nombre, políticas, etc.). |
| **A-14** | | Añadir o eliminar categorías de recursos para toda la plataforma. | `/settings` | Lista de categorías de la plataforma, Cursos, Recursos. |
| **A-15** | **Contenido Global** | Crear, editar y eliminar anuncios, eventos del calendario y recursos en la biblioteca. | `/announcements`, `/calendar`, `/resources` | Anuncios, Eventos, Recursos de la biblioteca. |
| **A-16** | **Inscripciones** | Ver el progreso y los inscritos de cualquier curso. | `/enrollments` | Inscripciones y progreso de los estudiantes. |

---

## 2. Rol: Instructor (`INSTRUCTOR`)

El instructor gestiona sus propios cursos y estudiantes.

| ID | Módulo/Funcionalidad | Descripción del Requisito | Ubicación en la App | Datos Involucrados |
| :-- | :--- | :--- | :--- | :--- |
| **I-01** | **Dashboard** | Ver un panel con resúmenes de los cursos que imparte. | `/dashboard` | Cursos creados por el instructor. |
| **I-02** | **Gestión de Cursos** | Crear un nuevo curso, que se le asigna automáticamente. | `/manage-courses` | Creación de un nuevo registro de curso. |
| **I-03** | | Ver y gestionar únicamente los cursos que ha creado. | `/manage-courses` | Cursos creados por el instructor. |
| **I-04** | | Editar la información de sus propios cursos. | `/manage-courses/[id]/edit` | Actualización de la información de sus cursos. |
| **I-05** | | Añadir, editar, reordenar y eliminar contenido en sus propios cursos. | `/manage-courses/[id]/edit` | Estructura de sus cursos (módulos, lecciones, contenido). |
| **I-06** | | Publicar, archivar o cambiar a borrador el estado de sus propios cursos. | `/manage-courses` | Estado de sus cursos. |
| **I-07** | | Eliminar sus propios cursos. | `/manage-courses` | Eliminación de sus cursos. |
| **I-08** | **Seguimiento** | Ver la lista de estudiantes inscritos en sus cursos y su progreso. | `/enrollments` | Inscripciones y progreso de los estudiantes en sus cursos. |
| **I-09** | **Contenido Global** | Crear anuncios para diferentes audiencias. | `/announcements` | Anuncios y notificaciones para usuarios. |
| **I-10** | | Crear eventos en el calendario para diferentes audiencias. | `/calendar` | Eventos del calendario. |
| **I-11** | | Subir, editar y eliminar los recursos que ha subido a la biblioteca. | `/resources` | Recursos de la biblioteca. |
| **I-12** | **Perfil** | Editar su propio perfil y gestionar su contraseña y 2FA. | `/profile` | Información de su propia cuenta, Registro de seguridad. |
| **I-13** | **Exploración** | Ver y opcionalmente inscribirse en cursos de otros instructores. | `/courses` | Cursos de otros instructores, Inscripciones. |

---

## 3. Rol: Estudiante (`STUDENT`)

El estudiante consume el contenido formativo de la plataforma.

| ID | Módulo/Funcionalidad | Descripción del Requisito | Ubicación en la App | Datos Involucrados |
| :-- | :--- | :--- | :--- | :--- |
| **S-01** | **Dashboard** | Ver un panel con resúmenes de sus cursos inscritos y anuncios. | `/dashboard` | Sus inscripciones, su progreso, anuncios relevantes. |
| **S-02** | **Catálogo de Cursos** | Explorar todos los cursos publicados en la plataforma. | `/courses` | Lista de cursos públicos, su estado de inscripción. |
| **S-03** | | Inscribirse a un curso público. | `/courses` | Creación de un registro de inscripción. |
| **S-04** | | Cancelar la inscripción a un curso. | `/my-courses` | Eliminación de su inscripción y progreso. |
| **S-05** | **Mis Cursos** | Ver la lista de cursos en los que está inscrito. | `/my-courses` | Sus inscripciones y progreso. |
| **S-06** | **Consumo de Curso** | Navegar y ver el contenido de las lecciones (texto, video, archivos). | `/courses/[courseId]` | Contenido de la lección, Registro de interacción. |
| **S-07** | | Realizar y enviar quizzes dentro de una lección. | `/courses/[courseId]` | Preguntas del quiz, Registro de la nota obtenida. |
| **S-08** | **Progreso** | Ver su progreso en un curso y solicitar el cálculo de la puntuación final. | `/courses/[courseId]` | Su progreso, Consolidación de la nota final. |
| **S-09** | **Biblioteca** | Acceder y descargar recursos de la biblioteca. | `/resources` | Lista de recursos disponibles. |
| **S-10** | | Ingresar un PIN para acceder a recursos protegidos. | `/resources` | Verificación del PIN de un recurso. |
| **S-11** | **Comunicación** | Ver anuncios y eventos del calendario dirigidos a su rol o a todos. | `/announcements`, `/calendar` | Anuncios y eventos relevantes. |
| **S-12** | **Perfil** | Editar su propio perfil y gestionar su contraseña y 2FA. | `/profile` | Información de su propia cuenta, Registro de seguridad. |
| **S-13** | **Notificaciones** | Ver y gestionar sus notificaciones personales. | `/notifications` (Popover y página) | Sus notificaciones personales. |
| **S-14** | **Autenticación** | Iniciar sesión y registrarse (si está habilitado). | `/sign-in`, `/sign-up` | Su cuenta de usuario, Registro de seguridad. |
| **S-15** | | Cerrar sesión de forma segura. | (Botón en Layout) | Cierre de su sesión actual. |
