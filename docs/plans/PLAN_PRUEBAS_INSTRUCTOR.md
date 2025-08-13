# Plan de Pruebas Funcionales - Rol Instructor

Este documento describe las acciones a verificar para el rol de **Instructor**.

---

### 1. Panel Principal (`/dashboard`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **1.1. Ver el dashboard** | Al iniciar sesión, se muestra un resumen de los cursos que ha creado y los anuncios recientes. |

### 2. Gestión de Cursos (`/manage-courses`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **2.1. Crear un curso nuevo** | Al hacer clic en "Crear", completar el formulario y guardar, se redirige a la página de edición. Él figura como el instructor. |
| **2.2. Ver solo sus cursos** | La lista muestra únicamente los cursos creados por él. No puede ver los de otros instructores. |
| **2.3. Editar sus cursos** | Puede entrar al modo de edición de sus cursos para añadir y organizar módulos y lecciones. |
| **2.4. Publicar/Archivar sus cursos** | Puede cambiar el estado de sus cursos para que sean visibles (Publicado) u ocultos (Archivado/Borrador). |
| **2.5. Eliminar sus cursos** | Puede eliminar permanentemente los cursos que ha creado. |

### 3. Seguimiento de Inscritos (`/enrollments`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **3.1. Seleccionar su curso** | El menú desplegable solo muestra los cursos que él imparte. |
| **3.2. Ver inscritos y progreso** | Al seleccionar uno de sus cursos, se carga una lista de los estudiantes inscritos con su progreso. |

### 4. Contenido Global (`/resources`, `/announcements`, `/calendar`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **4.1. Gestionar sus recursos** | Puede subir archivos a la biblioteca. Solo puede editar o eliminar los archivos que él ha subido. |
| **4.2. Crear Anuncios/Eventos** | Puede crear anuncios y eventos en el calendario para diferentes audiencias (ej. todos, solo estudiantes). |

### 5. Perfil (`/profile`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **5.1. Editar su información** | Puede cambiar su nombre y su foto de perfil. |
| **5.2. Gestionar seguridad** | Puede cambiar su contraseña y gestionar la autenticación de dos factores (2FA). |
