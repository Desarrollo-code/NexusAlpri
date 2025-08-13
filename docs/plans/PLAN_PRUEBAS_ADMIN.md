# Plan de Pruebas Funcionales - Rol Administrador

Este documento describe las acciones a verificar para el rol de **Administrador**.

---

### 1. Gestión de Usuarios (`/users`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **1.1. Ver la lista de usuarios** | La página carga y muestra una tabla con todos los usuarios. La paginación funciona si hay más de 10 usuarios. |
| **1.2. Buscar un usuario** | Al escribir en la barra de búsqueda, la lista se filtra para mostrar solo los usuarios que coinciden. |
| **1.3. Añadir un nuevo usuario** | Al hacer clic en "Añadir", completar el formulario y guardar, el nuevo usuario aparece en la lista. |
| **1.4. Editar un usuario** | Al seleccionar "Editar" en el menú de un usuario, se puede cambiar su nombre y rol, y los cambios se guardan. |
| **1.5. Eliminar un usuario** | Al seleccionar "Eliminar" y confirmar, el usuario desaparece de la lista. No se puede eliminar a sí mismo. |
| **1.6. Cambiar rol rápidamente** | Al usar la opción "Cambiar Rol", el rol del usuario se actualiza en la lista sin tener que editar el perfil completo. |

### 2. Gestión de Cursos (`/manage-courses`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **2.1. Crear un curso nuevo** | Al hacer clic en "Crear", completar el formulario y guardar, se redirige a la página de edición del curso. |
| **2.2. Ver todos los cursos** | La lista muestra todos los cursos de la plataforma, sin importar quién los creó (Publicados, Borradores, Archivados). |
| **2.3. Editar cualquier curso** | Se puede entrar al modo de edición de cualquier curso y modificar su título, descripción, imagen, etc. |
| **2.4. Añadir/reordenar contenido** | Dentro de la edición de un curso, se pueden añadir módulos y lecciones, y reordenarlos arrastrando y soltando. |
| **2.5. Cambiar estado de un curso** | Se puede cambiar el estado de cualquier curso a Publicado, Archivado o Borrador. |
| **2.6. Eliminar un curso** | Al seleccionar "Eliminar" en un curso y confirmar, este desaparece por completo. |

### 3. Seguimiento de Inscritos (`/enrollments`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **3.1. Seleccionar cualquier curso** | El menú desplegable muestra todos los cursos de la plataforma para seleccionar. |
| **3.2. Ver inscritos y progreso** | Al seleccionar un curso, se carga una lista de todos los estudiantes inscritos con su porcentaje de progreso. |

### 4. Analíticas (`/analytics`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **4.1. Ver dashboard de analíticas** | La página carga gráficos y tarjetas con métricas sobre usuarios, cursos y actividad general sin errores. |

### 5. Auditoría de Seguridad (`/security-audit`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **5.1. Revisar los registros** | La página carga una tabla con los últimos eventos de seguridad, como inicios de sesión y cambios de rol. |

### 6. Configuración del Sistema (`/settings`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **6.1. Cambiar nombre de la app** | Al cambiar el nombre y guardar, el nuevo nombre aparece en la barra lateral y superior. |
| **6.2. Habilitar/deshabilitar registro** | Al cambiar el switch y guardar, la página `/sign-up` se activa o desactiva para nuevos visitantes. |
| **6.3. Gestionar categorías** | Se pueden añadir o eliminar categorías de la lista, y estos cambios se reflejan en los formularios de creación de cursos/recursos. |

### 7. Contenido Global (`/resources`, `/announcements`, `/calendar`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **7.1. Gestionar Biblioteca** | Puede crear carpetas, subir archivos, editar sus detalles y eliminar cualquier recurso. |
| **7.2. Proteger un recurso con PIN** | Puede asignar un PIN a un archivo, y el sistema lo solicitará para acceder a él. |
| **7.3. Gestionar Anuncios** | Puede crear, editar y eliminar cualquier anuncio de la plataforma. |
| **7.4. Gestionar Calendario** | Puede crear, editar y eliminar cualquier evento del calendario, para cualquier audiencia. |
