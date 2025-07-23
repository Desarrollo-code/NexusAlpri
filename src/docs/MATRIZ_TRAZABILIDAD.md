# Matriz de Trazabilidad y Flujo Funcional - NexusAlpri

Este documento describe la "hoja de ruta" o el mapa funcional de la plataforma NexusAlpri. A diferencia de una tabla tradicional, desglosa cada funcionalidad clave en un flujo narrativo, desde la acción del usuario en la interfaz hasta la interacción final con la base de datos, para que sea completamente entendible.

---

## 1. Módulo de Autenticación y Perfil (Todos los Roles)

---

### **RF-AUTH-01: Inicio de Sesión de Usuario**

- **Caso de Uso:** Un usuario registrado quiere acceder a la plataforma.
- **Flujo Detallado:**
  1.  **UI - Ruta `/sign-in`**: El usuario ingresa su `email` y `password` en el formulario de inicio de sesión.
  2.  **UI - Acción del Usuario**: Al hacer clic en "Ingresar", la interfaz empaqueta las credenciales para enviarlas al servidor.
  3.  **API - Conexión**: La aplicación envía las credenciales de forma segura al servidor para su verificación.
  4.  **Backend - Lógica**:
      - El servidor recibe las credenciales.
      - Busca en la base de datos un `User` que coincida con el `email`.
      - Si el usuario existe, compara la `password` proporcionada con el hash almacenado usando `bcrypt`.
      - Si las credenciales son válidas, verifica si el usuario tiene la Autenticación de Dos Factores (`2FA`) activada.
      - Si 2FA está activo, responde a la interfaz indicando que se necesita un segundo paso de verificación. De lo contrario, crea una sesión segura para el usuario.
  5.  **BD - Modelos Involucrados**: `User` (lectura), `SecurityLog` (escritura para registrar el evento de inicio de sesión).
  6.  **UI - Respuesta**:
      - Si se requiere 2FA, se muestra en pantalla el campo para ingresar el código de 6 dígitos.
      - Si no, el sistema recibe la confirmación de que la sesión es válida, guarda la sesión en el navegador y redirige al usuario al `/dashboard`.

---

### **RF-AUTH-02: Gestión de Perfil y Contraseña**

- **Caso de Uso:** Un usuario desea actualizar su nombre, avatar o cambiar su contraseña.
- **Flujo Detallado:**
  1.  **UI - Ruta `/profile`**: El usuario accede a su página de perfil donde ve su información actual.
  2.  **UI - Acción del Usuario**:
      - **Para el nombre/avatar**: Modifica el campo de nombre o sube una nueva imagen y hace clic en "Guardar Información".
      - **Para la contraseña**: Abre una ventana para ingresar su contraseña actual y la nueva.
  3.  **API - Conexión**: La interfaz envía la información actualizada al servidor para que sea procesada.
  4.  **Backend - Lógica**:
      - **Nombre/avatar**: El servidor verifica que el usuario que hace la petición es el dueño del perfil (o un administrador) y actualiza los campos correspondientes.
      - **Contraseña**: El servidor valida que la contraseña actual sea correcta, comprueba que la nueva contraseña cumple con las políticas de seguridad y, si todo es correcto, la guarda de forma segura.
  5.  **BD - Modelos Involucrados**: `User` (actualización), `SecurityLog` (escritura del evento de cambio de contraseña).

---

## 2. Módulo de Gestión de Cursos (Roles: `ADMINISTRATOR`, `INSTRUCTOR`)

---

### **RF-COURSE-01: Creación de un Nuevo Curso**

- **Caso de Uso:** Un instructor o administrador necesita crear la estructura inicial de un curso.
- **Flujo Detallado:**
  1.  **UI - Ruta `/manage-courses`**: El usuario hace clic en "Crear Nuevo Curso", lo que abre una ventana emergente.
  2.  **UI - Acción del Usuario**: Completa el formulario inicial con título, descripción y categoría, y hace clic en "Crear y Continuar".
  3.  **API - Conexión**: La interfaz envía los datos del nuevo curso al servidor.
  4.  **Backend - Lógica**:
      - El servidor valida que los campos requeridos estén presentes.
      - Crea un nuevo registro en la base de datos para el curso, asociándolo al instructor que lo creó y dejándolo en estado "Borrador" (`DRAFT`).
  5.  **BD - Modelos Involucrados**: `Course` (escritura).
  6.  **UI - Respuesta**: La interfaz recibe la confirmación y el ID del nuevo curso, y redirige automáticamente al usuario a la página de edición (`/manage-courses/[newCourseId]/edit`) para que pueda empezar a añadir contenido.

---

### **RF-COURSE-02: Edición de Contenido de un Curso (Módulos y Lecciones)**

- **Caso de Uso:** Un instructor o administrador necesita añadir, editar, reordenar o eliminar el contenido de un curso.
- **Flujo Detallado:**
  1.  **UI - Ruta `/manage-courses/[courseId]/edit`**: La página solicita y muestra toda la estructura del curso (módulos, lecciones, etc.).
  2.  **UI - Acción del Usuario**:
      - **Añadir:** Usa los botones "Añadir Módulo" o "Añadir Lección".
      - **Reordenar:** Arrastra y suelta un módulo o lección a una nueva posición.
      - **Editar:** Modifica el título o el contenido de cualquier elemento directamente.
      - **Eliminar:** Usa el icono de la papelera para marcar un elemento para ser eliminado.
  3.  **API - Conexión**: Al hacer clic en "Guardar Cambios", la interfaz empaqueta **toda la estructura del curso actualizada** y la envía al servidor en una sola operación.
  4.  **Backend - Lógica (Transaccional)**:
      - El servidor recibe la estructura completa del curso.
      - Para garantizar que no haya errores, **inicia una transacción de base de datos**.
      - **Compara** los elementos recibidos con los que ya existen en la base de datos para identificar qué es nuevo, qué se modificó y qué se eliminó.
      - Procede a **borrar, actualizar y crear** los elementos (módulos, lecciones, quizzes, etc.) según corresponda.
      - Si todo el proceso se completa sin errores, confirma los cambios (`commit`). Si algo falla, revierte todo para no dejar datos inconsistentes (`rollback`).
  5.  **BD - Modelos Involucrados**: `Course`, `Module`, `Lesson`, `ContentBlock`, `Quiz`, `Question`, `AnswerOption` (lectura, escritura, actualización, eliminación).

---

## 3. Módulo de Consumo de Cursos (Rol: `STUDENT`)

---

### **RF-STUDENT-01: Inscripción a un Curso**

- **Caso de Uso:** Un estudiante desea inscribirse en un curso del catálogo.
- **Flujo Detallado:**
  1.  **UI - Ruta `/courses`**: El estudiante explora el catálogo de cursos.
  2.  **UI - Acción del Usuario**: Hace clic en el botón "Inscribirse".
  3.  **API - Conexión**: La aplicación informa al servidor que el usuario actual desea inscribirse en el curso seleccionado.
  4.  **Backend - Lógica**:
      - El servidor verifica que el usuario está autenticado.
      - Crea un nuevo registro que vincula al estudiante con el curso.
  5.  **BD - Modelos Involucrados**: `Enrollment` (escritura).
  6.  **UI - Respuesta**: El botón de la tarjeta cambia a "Continuar Curso" y el curso aparece ahora en la sección `/my-courses` del estudiante.

### **RF-STUDENT-02: Seguimiento Automático del Progreso**

- **Caso de Uso:** El sistema debe registrar el avance del estudiante de forma automática.
- **Flujo Detallado:**
  1.  **UI - Ruta `/courses/[courseId]`**: El estudiante navega por las lecciones del curso.
  2.  **UI - Acción del Usuario (Automática)**:
      - **Vista de Lección**: Al hacer clic en una lección (texto, video, etc.), la interfaz lo detecta.
      - **Envío de Quiz**: Al enviar un quiz, la interfaz captura la nota obtenida.
  3.  **API - Conexión**:
      - **Vista**: La interfaz informa silenciosamente al servidor que se ha visualizado una lección.
      - **Quiz**: La interfaz envía la nota del quiz al servidor para que quede registrada.
  4.  **Backend - Lógica (`/lib/progress.ts`)**:
      - El servidor recibe la notificación de la interacción.
      - **Importante:** No calcula el porcentaje final en este momento. Simplemente, guarda un registro de que esa lección fue completada (ya sea por vista o por quiz), creando un historial de interacciones.
  5.  **BD - Modelos Involucrados**: `CourseProgress` (se crea si no existe), `LessonCompletionRecord` (escritura/actualización).
  6.  **UI - Respuesta**: La lección se marca visualmente como completada en la barra lateral del curso.

### **RF-STUDENT-03: Consolidación de la Puntuación Final**

- **Caso de Uso:** El estudiante ha interactuado con todas las lecciones y quiere obtener su nota final.
- **Flujo Detallado:**
  1.  **UI - Ruta `/courses/[courseId]`**: La interfaz comprueba si ya se ha interactuado con todas las lecciones del curso. Si es así, habilita el botón "Calcular Mi Puntuación Final".
  2.  **UI - Acción del Usuario**: El estudiante hace clic en el botón para obtener su nota.
  3.  **API - Conexión**: La interfaz solicita al servidor que calcule la nota final para ese curso y usuario.
  4.  **Backend - Lógica (`/lib/progress.ts`)**:
      - El servidor ejecuta una lógica especial de consolidación.
      - **Lee todo el historial de interacciones** de ese usuario para el curso.
      - **Calcula una nota ponderada**: las vistas de lección valen 100 puntos, mientras que los quices valen su nota (`score`). Se suman los puntos obtenidos y se dividen por el total de puntos posibles.
      - **Guarda el resultado final** (ej. 95%) en el registro de progreso del usuario.
  5.  **BD - Modelos Involucrados**: `LessonCompletionRecord` (lectura), `CourseProgress` (actualización).
  6.  **UI - Respuesta**: La interfaz recibe el porcentaje final y lo muestra en el indicador circular de progreso, completando el ciclo de evaluación del curso.

---

## 4. Módulo de Gestión de Usuarios (Rol: `ADMINISTRATOR`)

---

### **RF-ADMIN-01: Creación de un Nuevo Usuario**
- **Caso de Uso**: Un administrador necesita añadir un nuevo usuario a la plataforma.
- **Flujo Detallado:**
  1. **UI - Ruta `/users`**: El administrador hace clic en "Añadir Nuevo Usuario".
  2. **UI - Acción del Usuario**: Completa el formulario con nombre, email, rol y una contraseña inicial.
  3. **API - Conexión**: La interfaz envía los datos del nuevo usuario al servidor.
  4. **Backend - Lógica**:
     - El servidor valida los datos.
     - Verifica que el email no exista previamente.
     - Hashea la contraseña.
     - Crea un nuevo registro en la base de datos.
  5. **BD - Modelos Involucrados**: `User` (escritura).
  6. **UI - Respuesta**: La lista de usuarios se actualiza mostrando al nuevo miembro.

### **RF-ADMIN-02: Cambio de Rol de un Usuario**
- **Caso de Uso**: Un administrador necesita cambiar los permisos de un usuario.
- **Flujo Detallado:**
  1. **UI - Ruta `/users`**: El administrador busca al usuario y selecciona "Cambiar Rol" en el menú de acciones.
  2. **UI - Acción del Usuario**: Elige el nuevo rol desde un selector.
  3. **API - Conexión**: Se informa al servidor sobre el cambio de rol para el usuario específico.
  4. **Backend - Lógica**:
     - El servidor actualiza el campo `role` del usuario.
     - Registra la acción en el log de seguridad para auditoría.
  5. **BD - Modelos Involucrados**: `User` (actualización), `SecurityLog` (escritura).
  6. **UI - Respuesta**: El rol del usuario se actualiza visualmente en la tabla.

---

## 5. Módulo de Contenido Global (Todos los Roles con permisos)

---

### **RF-GLOBAL-01: Gestión de Recursos en la Biblioteca**
- **Caso de Uso**: Un instructor o administrador necesita subir un archivo importante (PDF, imagen, etc.) a la biblioteca.
- **Flujo Detallado:**
  1. **UI - Ruta `/resources`**: El usuario navega a la biblioteca y hace clic en "Subir Nuevo Recurso".
  2. **UI - Acción del Usuario**:
     - Sube el archivo a través del área de carga.
     - Completa el título, descripción y categoría.
     - Opcionalmente, define un PIN de seguridad.
  3. **API - Conexión**:
     - **Primero**: El archivo se envía a un endpoint de subida (`/api/upload/resource-file`) que lo guarda en el servidor y devuelve una URL.
     - **Segundo**: La información del recurso (título, URL del archivo, etc.) se envía al servidor para ser guardada.
  4. **Backend - Lógica**:
     - El servidor recibe la información del recurso.
     - Si se proporcionó un PIN, lo hashea de forma segura con `bcrypt`.
     - Crea un nuevo registro en la base de datos con todos los detalles.
  5. **BD - Modelos Involucrados**: `Resource` (escritura).
  6. **UI - Respuesta**: La biblioteca se actualiza mostrando el nuevo recurso.

### **RF-GLOBAL-02: Acceso a un Recurso Protegido**
- **Caso de Uso**: Un estudiante necesita acceder a un recurso que está protegido con PIN.
- **Flujo Detallado:**
  1. **UI - Ruta `/resources`**: El estudiante hace clic en el recurso protegido.
  2. **UI - Acción del Usuario**: Se le presenta una ventana para que ingrese el PIN de 4 dígitos.
  3. **API - Conexión**: La interfaz envía el PIN ingresado para su verificación.
  4. **Backend - Lógica**:
     - El servidor recupera el hash del PIN almacenado para ese recurso.
     - Compara el PIN ingresado con el hash usando `bcrypt`.
  5. **BD - Modelos Involucrados**: `Resource` (lectura).
  6. **UI - Respuesta**:
     - **Si el PIN es correcto**: La interfaz recibe la URL del archivo y permite al usuario visualizarlo o descargarlo.
     - **Si es incorrecto**: Se muestra un mensaje de error.

---

## 6. Módulo de Configuración de la Plataforma (Rol: `ADMINISTRATOR`)

---

### **RF-CONFIG-01: Modificación de Ajustes Generales**
- **Caso de Uso**: Un administrador quiere cambiar el nombre de la plataforma o la política de registro público.
- **Flujo Detallado:**
  1. **UI - Ruta `/settings`**: La página carga y muestra los ajustes actuales de la plataforma.
  2. **UI - Acción del Usuario**: El administrador cambia el valor de uno o más campos (ej. cambia el `platformName` o desactiva `allowPublicRegistration`) y hace clic en "Guardar Configuración".
  3. **API - Conexión**: La interfaz envía **todo el objeto de configuración actualizado** al servidor.
  4. **Backend - Lógica**:
     - El servidor recibe el objeto de configuración.
     - Realiza validaciones, como por ejemplo, si se está eliminando una categoría, verifica que no esté en uso por ningún curso o recurso.
     - Actualiza el único registro existente en la tabla de configuración con los nuevos valores.
  5. **BD - Modelos Involucrados**: `PlatformSettings` (actualización).
  6. **UI - Respuesta**: La interfaz recibe la configuración actualizada y la refleja, mientras que el `AuthContext` global de la aplicación se actualiza para que los cambios (como el nombre de la plataforma) se propaguen a toda la aplicación sin necesidad de recargar la página.
