# Matriz de Trazabilidad y Flujo Funcional - NexusAlpri

Este documento describe la "hoja de ruta" o el mapa funcional de la plataforma NexusAlpri. A diferencia de una tabla tradicional, desglosa cada funcionalidad clave en un flujo narrativo, desde la acción del usuario en la interfaz hasta la interacción final con la base de datos, para que sea completamente entendible.

---

## 1. Módulo de Autenticación y Perfil (Todos los Roles)

---

### **RF-AUTH-01: Inicio de Sesión de Usuario**

- **Caso de Uso:** Un usuario registrado quiere acceder a la plataforma.
- **Flujo Detallado:**
  1.  **UI - Ruta `/sign-in`**: El usuario ingresa su `email` y `password` en el formulario de inicio de sesión.
  2.  **UI - Acción del Usuario**: Al hacer clic en "Ingresar", el frontend (componente `SignInPage`) empaqueta las credenciales.
  3.  **API - Conexión**: Se realiza una petición `POST` al endpoint `/api/auth/login`.
  4.  **Backend - Lógica**:
      - El servidor recibe las credenciales.
      - Busca en la base de datos un `User` que coincida con el `email`.
      - Si el usuario existe, compara la `password` proporcionada con el hash almacenado usando `bcrypt`.
      - Si las credenciales son válidas, verifica si el usuario tiene `isTwoFactorEnabled`.
      - Si 2FA está activo, responde con `twoFactorRequired: true`. De lo contrario, crea una sesión JWT.
  5.  **BD - Modelos Involucrados**: `User` (lectura), `SecurityLog` (escritura para registrar el evento).
  6.  **UI - Respuesta**:
      - Si se requiere 2FA, se muestra el formulario para el token.
      - Si no, el `AuthContext` recibe los datos del usuario, la sesión se guarda en una cookie y el `middleware` redirige al `/dashboard`.

---

### **RF-AUTH-02: Gestión de Perfil y Contraseña**

- **Caso de Uso:** Un usuario desea actualizar su nombre, avatar o cambiar su contraseña.
- **Flujo Detallado:**
  1.  **UI - Ruta `/profile`**: El usuario accede a su página de perfil donde ve su información actual.
  2.  **UI - Acción del Usuario**:
      - **Para el nombre/avatar**: Modifica el campo de nombre o sube una nueva imagen y hace clic en "Guardar Información".
      - **Para la contraseña**: Hace clic en "Cambiar Contraseña", abre un modal e ingresa su contraseña actual y la nueva.
  3.  **API - Conexión**:
      - **Nombre/avatar**: Se envía una petición `PUT` a `/api/users/[id]`.
      - **Contraseña**: Se envía una petición `POST` a `/api/users/[id]/change-password`.
  4.  **Backend - Lógica**:
      - **Nombre/avatar**: El servidor verifica que el usuario que hace la petición es el dueño del perfil o un administrador y actualiza los campos correspondientes.
      - **Contraseña**: El servidor valida la contraseña actual, comprueba que la nueva contraseña cumple las políticas de seguridad y, si todo es correcto, la hashea y la guarda.
  5.  **BD - Modelos Involucrados**: `User` (actualización), `SecurityLog` (escritura).

---

## 2. Módulo de Gestión de Cursos (Roles: `ADMINISTRATOR`, `INSTRUCTOR`)

---

### **RF-COURSE-01: Creación de un Nuevo Curso**

- **Caso de Uso:** Un instructor o administrador necesita crear la estructura inicial de un curso.
- **Flujo Detallado:**
  1.  **UI - Ruta `/manage-courses`**: El usuario hace clic en el botón "Crear Nuevo Curso", lo que abre un modal.
  2.  **UI - Acción del Usuario**: Completa el formulario inicial con título, descripción y categoría y hace clic en "Crear y Continuar".
  3.  **API - Conexión**: Se realiza una petición `POST` al endpoint `/api/courses`.
  4.  **Backend - Lógica**:
      - El servidor valida que los campos requeridos (título, descripción) estén presentes.
      - Crea un nuevo registro en la tabla `Course`, asignando el `instructorId` del usuario en sesión y estableciendo el `status` en `DRAFT` (borrador).
  5.  **BD - Modelos Involucrados**: `Course` (escritura).
  6.  **UI - Respuesta**: El frontend recibe el ID del nuevo curso y redirige automáticamente al usuario a la página de edición (`/manage-courses/[newCourseId]/edit`) para que pueda añadir contenido.

---

### **RF-COURSE-02: Edición de Contenido de un Curso (Módulos y Lecciones)**

- **Caso de Uso:** Un instructor o administrador necesita añadir, editar, reordenar o eliminar el contenido de un curso existente.
- **Flujo Detallado:**
  1.  **UI - Ruta `/manage-courses/[courseId]/edit`**: La página carga toda la estructura del curso (módulos, lecciones, bloques) desde la API. El estado del curso se gestiona con `react-hook-form`.
  2.  **UI - Acción del Usuario**:
      - **Añadir:** Hace clic en "Añadir Módulo" o "Añadir Lección".
      - **Reordenar:** Arrastra y suelta (`DragDropContext`) un módulo o lección a una nueva posición.
      - **Editar:** Modifica el título de un módulo/lección directamente en el `input` o edita un bloque de contenido (texto, video, quiz).
      - **Eliminar:** Marca un elemento para ser eliminado.
  3.  **API - Conexión**: Al hacer clic en el botón principal "Guardar Cambios", se empaqueta **toda la estructura del curso** en un objeto JSON y se envía en una única petición `PUT` a `/api/courses/[courseId]`.
  4.  **Backend - Lógica (Transaccional)**:
      - El servidor recibe el objeto completo del curso.
      - **Inicia una transacción de base de datos** para asegurar la integridad de los datos.
      - **Compara IDs:** Compara los IDs de los módulos y lecciones recibidos con los existentes en la BD para identificar elementos nuevos, modificados y eliminados (marcados con `_toBeDeleted`).
      - **Elimina:** Borra los módulos/lecciones/bloques que ya no existen en el objeto recibido.
      - **Actualiza/Crea (Upsert):** Recorre la estructura anidada y actualiza los elementos existentes con su nuevo contenido y `order`, y crea los nuevos elementos que no tienen un ID de base de datos.
      - Si todo es exitoso, la transacción se completa (`commit`). Si algo falla, se revierte (`rollback`).
  5.  **BD - Modelos Involucrados**: `Course`, `Module`, `Lesson`, `ContentBlock`, `Quiz`, `Question`, `AnswerOption` (lectura, escritura, actualización, eliminación).

---

## 3. Módulo de Consumo de Cursos (Rol: `STUDENT`)

---

### **RF-STUDENT-01: Inscripción a un Curso**

- **Caso de Uso:** Un estudiante desea inscribirse en un curso del catálogo.
- **Flujo Detallado:**
  1.  **UI - Ruta `/courses`**: El estudiante explora el catálogo de cursos.
  2.  **UI - Acción del Usuario**: Hace clic en el botón "Inscribirse" en la tarjeta de un curso.
  3.  **API - Conexión**: Se realiza una petición `POST` a `/api/enrollments` con `{ "courseId": "...", "enroll": true }`.
  4.  **Backend - Lógica**:
      - El servidor verifica que el usuario está autenticado.
      - Crea un nuevo registro en la tabla `Enrollment` que vincula el `userId` del estudiante con el `courseId`.
  5.  **BD - Modelos Involucrados**: `Enrollment` (escritura).
  6.  **UI - Respuesta**: El botón de la tarjeta cambia a "Continuar Curso" y el curso aparece ahora en la sección `/my-courses`.

### **RF-STUDENT-02: Seguimiento Automático del Progreso**

- **Caso de Uso:** El sistema debe registrar el avance del estudiante de forma automática mientras consume el contenido.
- **Flujo Detallado:**
  1.  **UI - Ruta `/courses/[courseId]`**: El estudiante navega por el contenido del curso.
  2.  **UI - Acción del Usuario (Automática)**:
      - **Vista de Lección**: Cuando el estudiante hace clic en una lección de texto/video, el frontend **automáticamente** activa una función.
      - **Envío de Quiz**: Cuando el estudiante completa y envía un quiz, el componente `QuizViewer` activa otra función.
  3.  **API - Conexión**:
      - **Vista**: Se envía una petición `POST` silenciosa a `/api/progress/[userId]/[courseId]/lesson`.
      - **Quiz**: Se envía una petición `POST` a `/api/progress/[userId]/[courseId]/quiz` con la nota (`score`).
  4.  **Backend - Lógica (`/lib/progress.ts`)**:
      - La API recibe la interacción.
      - **No calcula el porcentaje final aún**. Simplemente, crea o actualiza un registro en la tabla `LessonCompletionRecord`, asociándolo al progreso del curso del usuario. Esto crea un historial de todas las interacciones.
  5.  **BD - Modelos Involucrados**: `CourseProgress` (creación si no existe), `LessonCompletionRecord` (escritura/actualización).
  6.  **UI - Respuesta**: La lección se marca visualmente como completada en la barra lateral.

### **RF-STUDENT-03: Consolidación de la Puntuación Final**

- **Caso de Uso:** El estudiante ha interactuado con todas las lecciones y quiere obtener su nota final del curso.
- **Flujo Detallado:**
  1.  **UI - Ruta `/courses/[courseId]`**: El frontend detecta que todas las lecciones tienen un registro en `LessonCompletionRecord` y habilita el botón "Calcular Mi Puntuación Final".
  2.  **UI - Acción del Usuario**: El estudiante hace clic en dicho botón.
  3.  **API - Conexión**: Se envía una petición `POST` a `/api/progress/[userId]/[courseId]/consolidate`.
  4.  **Backend - Lógica (`/lib/progress.ts`)**:
      - El servidor ejecuta la función `consolidateCourseProgress`.
      - **Lee todos** los `LessonCompletionRecord` de ese usuario para ese curso.
      - **Calcula una nota ponderada**: las vistas de lección valen 100 puntos, los quices valen su `score`. Suma los puntos obtenidos y los divide por el total de puntos posibles (N lecciones * 100).
      - **Actualiza el registro `CourseProgress`**, guardando el resultado en el campo `progressPercentage`.
  5.  **BD - Modelos Involucrados**: `LessonCompletionRecord` (lectura), `CourseProgress` (actualización).
  6.  **UI - Respuesta**: El frontend recibe el `progressPercentage` final y actualiza el indicador circular de progreso para mostrar la nota consolidada.
