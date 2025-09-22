# Plan de Pruebas Funcionales - Rol Administrador

Este documento describe las acciones a verificar para el rol de **Administrador**.

**Credenciales de Prueba:**
*   **Email:** `admin@nexus.com`
*   **Contraseña:** `nexuspro`

---

### 1. Gestión de Usuarios (`/users`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **1.1. Ver la lista de usuarios** | La página carga y muestra una tabla con todos los usuarios creados (Admin, Instructor, 2 Estudiantes). |
| **1.2. Buscar un usuario** | Al escribir `Laura` en la búsqueda, la lista se filtra para mostrar solo a "Laura Gómez". |
| **1.3. Añadir un nuevo usuario** | Haz clic en "Añadir", completa el formulario y guarda. El nuevo usuario debe aparecer en la lista. |
| **1.4. Editar un usuario** | Edita el nombre de "Carlos Santana". El cambio debe reflejarse inmediatamente. |
| **1.5. Inactivar un usuario** | Haz clic en "Inactivar" en el menú de "Laura Gómez". Su estado debe cambiar a "Inactivo". Intenta iniciar sesión con sus credenciales (debería fallar). Luego, actívala de nuevo. |
| **1.6. Cambiar rol rápidamente** | Cambia el rol de "Carlos Santana" a "Instructor". El cambio debe reflejarse en la tabla. |

### 2. Gestión de Cursos (`/manage-courses`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **2.1. Crear un curso nuevo** | Crea un curso. Debe aparecer en la lista de "Borradores". |
| **2.2. Ver todos los cursos** | La lista debe mostrar todos los cursos de la plataforma, incluyendo los creados por el Instructor de prueba. |
| **2.3. Editar cualquier curso** | Entra a editar el "Curso de Marketing Digital" (creado por el instructor) y modifica su descripción. El cambio debe guardarse. |
| **2.4. Publicar/Archivar un curso** | Cambia el estado del "Curso de Bienvenida" a "Archivado". Luego, cámbialo de nuevo a "Publicado". |

### 3. Seguimiento de Inscritos (`/enrollments`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **3.1. Seleccionar un curso** | En el desplegable, selecciona "Curso de Marketing Digital". |
| **3.2. Ver inscritos y progreso** | La tabla debe mostrar a los dos estudiantes inscritos. "Laura Gómez" debe tener un progreso del 25%, mientras que "Carlos Santana" debe tener 0%. |
| **3.3. Ver detalles de progreso** | Haz clic en "Ver Detalles" para Laura Gómez. Deberías ver qué lección específica ha completado. |

### 4. Analíticas (`/analytics`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **4.1. Ver dashboard de analíticas** | La página debe cargar gráficos con los datos de prueba: 4 usuarios, 2 cursos, 2 inscripciones, etc. |

### 5. Auditoría de Seguridad (`/security-audit`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **5.1. Revisar los registros** | La página debe mostrar los registros de seguridad iniciales creados por el seed. Cierra sesión y vuelve a iniciarla para ver un nuevo evento de "Inicio Exitoso". |

### 6. Contenido Global (`/resources`, `/announcements`, `/calendar`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **6.1. Ver contenido de prueba** | Verifica que el "Anuncio de Bienvenida" aparece en `/announcements`, el evento "Reunión Trimestral" en `/calendar`, y la carpeta/archivo en `/resources`. |
| **6.2. Editar contenido** | Edita el anuncio existente o el evento del calendario. Los cambios deben persistir. |
| **6.3. Interactuar con anuncio** | Reacciona al "Anuncio de Bienvenida". Haz clic en el contador de vistas y reacciones para confirmar que tu usuario aparece en la lista. |
