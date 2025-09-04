
# Plan de Pruebas Funcionales - Rol Instructor

Este documento describe las acciones a verificar para el rol de **Instructor**.

**Credenciales de Prueba:**
*   **Email:** `instructor@nexus.com`
*   **Contraseña:** `nexuspro`

---

### 1. Panel Principal (`/dashboard`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **1.1. Ver el dashboard** | Al iniciar sesión, el panel debe mostrar un resumen de los cursos que has creado (1 curso) y el "Anuncio de Bienvenida". |

### 2. Gestión de Cursos (`/manage-courses`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **2.1. Ver solo sus cursos** | La lista debe mostrar únicamente el "Curso de Marketing Digital". No debe ver el "Curso de Bienvenida" (creado por el admin). |
| **2.2. Editar su curso** | Entra a editar el "Curso de Marketing Digital". Añade una nueva lección al primer módulo. El cambio debe guardarse correctamente. |
| **2.3. Crear un curso nuevo** | Crea un nuevo curso. Debe aparecer en la lista y tú debes figurar como el instructor. |
| **2.4. Publicar/Archivar sus cursos** | Cambia el estado del "Curso de Marketing Digital" a "Archivado". Verifica que el estado cambia. Luego, vuelve a ponerlo como "Publicado". |

### 3. Seguimiento de Inscritos (`/enrollments`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **3.1. Seleccionar su curso** | El menú desplegable solo debe mostrar los cursos que tú impartes. Selecciona "Curso de Marketing Digital". |
| **3.2. Ver inscritos y progreso** | La tabla debe cargar la lista con Laura Gómez (25% de progreso) y Carlos Santana (0%). Los gráficos de resumen deben mostrar los datos correctos. |

### 4. Contenido Global (`/resources`, `/announcements`, `/calendar`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **4.1. Gestionar sus recursos** | Sube un nuevo archivo a la biblioteca. Deberías poder editarlo y eliminarlo. Intenta editar el "Manual de Bienvenida" (subido por el admin), no deberías poder. |
| **4.2. Crear Anuncios/Eventos** | Crea un nuevo anuncio dirigido solo a "Estudiantes". Crea un nuevo evento en el calendario para el próximo mes. |

### 5. Perfil (`/profile`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **5.1. Editar su información** | Cambia tu nombre y foto de perfil. Los cambios deben reflejarse correctamente. |
