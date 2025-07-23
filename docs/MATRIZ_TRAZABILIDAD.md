
# Matriz de Trazabilidad de Requisitos - NexusAlpri

Este documento detalla la relación entre los requisitos funcionales, los roles de usuario, los componentes de la interfaz de usuario (UI), los endpoints de la API y los modelos de la base de datos (BD).

---

## 1. Rol: Administrador (`ADMINISTRATOR`)

El administrador tiene control total sobre la plataforma.

| ID | Módulo/Funcionalidad | Descripción del Requisito | Ruta(s) UI | Endpoints API Involucrados | Modelos BD Principales |
| :-- | :--- | :--- | :--- | :--- | :--- |
| **A-01** | **Gestión de Usuarios** | Visualizar, buscar y paginar todos los usuarios de la plataforma. | `/users` | `GET /api/users` | `User` |
| **A-02** | | Crear un nuevo usuario con nombre, email, contraseña y rol. | `/users` | `POST /api/users` | `User` |
| **A-03** | | Editar la información de un usuario existente (nombre, email). | `/users` | `PUT /api/users/[id]` | `User` |
| **A-04** | | Cambiar el rol de un usuario. | `/users` | `PUT /api/users/[id]` | `User`, `SecurityLog` |
| **A-05** | | Eliminar un usuario de la plataforma (excepto a sí mismo). | `/users` | `DELETE /api/users/[id]` | `User`, `Enrollment`, `CourseProgress` |
| **A-06** | **Gestión de Cursos** | Crear un nuevo curso (borrador inicial). | `/manage-courses` | `POST /api/courses` | `Course` |
| **A-07** | | Editar toda la información de cualquier curso (título, imagen, etc.). | `/manage-courses/[id]/edit` | `PUT /api/courses/[id]` | `Course` |
| **A-08** | | Añadir, editar, reordenar y eliminar módulos, lecciones y bloques de contenido en cualquier curso. | `/manage-courses/[id]/edit` | `PUT /api/courses/[id]` | `Course`, `Module`, `Lesson`, `ContentBlock`, `Quiz`, `Question`, `AnswerOption` |
| **A-09** | | Publicar, archivar o cambiar a borrador el estado de cualquier curso. | `/manage-courses` | `PATCH /api/courses/[id]/status` | `Course` |
| **A-10** | | Eliminar cualquier curso de la plataforma. | `/manage-courses` | `DELETE /api/courses/[id]` | `Course` |
| **A-11** | **Analíticas** | Ver un dashboard con estadísticas clave de la plataforma (usuarios, cursos, inscripciones, etc.). | `/analytics` | `GET /api/dashboard/admin-stats` | `User`, `Course`, `Enrollment`, `SecurityLog` |
| **A-12** | **Auditoría** | Revisar un registro de eventos de seguridad importantes (logins, cambios de contraseña, etc.). | `/security-audit` | `GET /api/security/logs` | `SecurityLog` |
| **A-13** | **Configuración** | Ver y modificar la configuración general de la plataforma. | `/settings` | `GET /api/settings`, `POST /api/settings` | `PlatformSettings` |
| **A-14** | | Añadir o eliminar categorías de recursos para toda la plataforma. | `/settings` | `POST /api/settings`, `GET /api/settings/category-check/[categoryName]` | `PlatformSettings`, `Course`, `Resource` |
| **A-15** | **Contenido Global** | Crear, editar y eliminar anuncios, eventos del calendario y recursos en la biblioteca sin restricciones. | `/announcements`, `/calendar`, `/resources` | `POST/PUT/DELETE` en `/api/announcements`, `/api/events`, `/api/resources` | `Announcement`, `CalendarEvent`, `Resource` |
| **A-16** | **Inscripciones** | Ver el progreso y los inscritos de cualquier curso. | `/enrollments` | `GET /api/enrollments/course/[courseId]` | `Enrollment`, `CourseProgress` |

---

## 2. Rol: Instructor (`INSTRUCTOR`)

El instructor gestiona sus propios cursos y estudiantes.

| ID | Módulo/Funcionalidad | Descripción del Requisito | Ruta(s) UI | Endpoints API Involucrados | Modelos BD Principales |
| :-- | :--- | :--- | :--- | :--- | :--- |
| **I-01** | **Dashboard** | Ver un panel con resúmenes de los cursos que imparte. | `/dashboard` | `GET /api/courses?manageView=true...` | `Course` |
| **I-02** | **Gestión de Cursos** | Crear un nuevo curso, que se le asigna automáticamente. | `/manage-courses` | `POST /api/courses` | `Course` |
| **I-03** | | Ver y gestionar únicamente los cursos que ha creado. | `/manage-courses` | `GET /api/courses?manageView=true...` | `Course` |
| **I-04** | | Editar la información de sus propios cursos. | `/manage-courses/[id]/edit` | `PUT /api/courses/[id]` | `Course` |
| **I-05** | | Añadir, editar, reordenar y eliminar contenido (módulos, lecciones) en sus propios cursos. | `/manage-courses/[id]/edit` | `PUT /api/courses/[id]` | `Module`, `Lesson`, `ContentBlock`, `Quiz` |
| **I-06** | | Publicar, archivar o cambiar a borrador el estado de sus propios cursos. | `/manage-courses` | `PATCH /api/courses/[id]/status` | `Course` |
| **I-07** | | Eliminar sus propios cursos. | `/manage-courses` | `DELETE /api/courses/[id]` | `Course` |
| **I-08** | **Seguimiento** | Ver la lista de estudiantes inscritos en sus cursos y su progreso. | `/enrollments` | `GET /api/enrollments/course/[courseId]`, `GET /api/progress/[userId]/[courseId]` | `Enrollment`, `CourseProgress`, `LessonCompletionRecord` |
| **I-09** | **Contenido Global** | Crear anuncios para diferentes audiencias (incluyendo todos los usuarios). | `/announcements` | `POST /api/announcements` | `Announcement`, `Notification` |
| **I-10** | | Crear eventos en el calendario para diferentes audiencias. | `/calendar` | `POST /api/events` | `CalendarEvent` |
| **I-11** | | Subir, editar y eliminar los recursos que ha subido a la biblioteca. | `/resources` | `POST/PUT/DELETE` en `/api/resources` | `Resource` |
| **I-12** | **Perfil** | Editar su propio perfil (nombre, avatar) y gestionar su contraseña y 2FA. | `/profile` | `PUT /api/users/[id]`, `POST /api/users/[id]/change-password`, `POST /api/auth/2fa` | `User`, `SecurityLog` |
| **I-13** | **Exploración** | Ver y opcionalmente inscribirse en cursos de otros instructores. | `/courses` | `GET /api/courses`, `POST /api/enrollments` | `Course`, `Enrollment` |

---

## 3. Rol: Estudiante (`STUDENT`)

El estudiante consume el contenido formativo de la plataforma.

| ID | Módulo/Funcionalidad | Descripción del Requisito | Ruta(s) UI | Endpoints API Involucrados | Modelos BD Principales |
| :-- | :--- | :--- | :--- | :--- | :--- |
| **S-01** | **Dashboard** | Ver un panel con resúmenes de sus cursos inscritos y anuncios. | `/dashboard` | `GET /api/enrollment/[userId]`, `GET /api/announcements` | `Enrollment`, `CourseProgress`, `Announcement` |
| **S-02** | **Catálogo de Cursos** | Explorar todos los cursos publicados en la plataforma. | `/courses` | `GET /api/courses`, `GET /api/enrollment/[userId]` | `Course`, `Enrollment` |
| **S-03** | | Inscribirse a un curso público. | `/courses` | `POST /api/enrollments` (con `enroll: true`) | `Enrollment` |
| **S-04** | | Cancelar la inscripción a un curso. | `/my-courses` | `POST /api/enrollments` (con `enroll: false`) | `Enrollment`, `CourseProgress` |
| **S-05** | **Mis Cursos** | Ver la lista de cursos en los que está inscrito. | `/my-courses` | `GET /api/enrollment/[userId]` | `Enrollment`, `CourseProgress` |
| **S-06** | **Consumo de Curso** | Navegar y ver el contenido de las lecciones (texto, video, archivos) de un curso inscrito. | `/courses/[courseId]` | `GET /api/courses/[courseId]`, `POST /api/progress/[userId]/[courseId]/lesson` | `Lesson`, `ContentBlock`, `LessonCompletionRecord` |
| **S-07** | | Realizar y enviar quizzes dentro de una lección. | `/courses/[courseId]` | `POST /api/progress/[userId]/[courseId]/quiz` | `Quiz`, `Question`, `AnswerOption`, `LessonCompletionRecord` |
| **S-08** | **Progreso** | Ver su progreso en un curso y solicitar el cálculo de la puntuación final. | `/courses/[courseId]` | `GET /api/progress/[userId]/[courseId]`, `POST /api/progress/[userId]/[courseId]/consolidate` | `CourseProgress`, `LessonCompletionRecord` |
| **S-09** | **Biblioteca** | Acceder y descargar recursos de la biblioteca. | `/resources` | `GET /api/resources`, `GET /api/resources/[id]` | `Resource` |
| **S-10** | | Ingresar un PIN para acceder a recursos protegidos. | `/resources` | `POST /api/resources/[id]/verify-pin` | `Resource` |
| **S-11** | **Comunicación** | Ver anuncios y eventos del calendario dirigidos a su rol o a todos. | `/announcements`, `/calendar` | `GET /api/announcements`, `GET /api/events` | `Announcement`, `CalendarEvent` |
| **S-12** | **Perfil** | Editar su propio perfil (nombre, avatar) y gestionar su contraseña y 2FA. | `/profile` | `PUT /api/users/[id]`, `POST /api/users/[id]/change-password`, `POST /api/auth/2fa` | `User`, `SecurityLog` |
| **S-13** | **Notificaciones** | Ver y gestionar sus notificaciones personales. | `/notifications` (Popover y página) | `GET/PATCH/DELETE` en `/api/notifications` | `Notification` |
| **S-14** | **Autenticación** | Iniciar sesión y registrarse (si está habilitado). | `/sign-in`, `/sign-up` | `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/2fa-login` | `User`, `SecurityLog` |
| **S-15** | | Cerrar sesión de forma segura. | (Botón en Layout) | `POST /api/auth/logout` | (Manejo de cookie de sesión) |
