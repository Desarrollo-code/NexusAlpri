# Plan de Pruebas Funcionales - Rol Estudiante

Este documento describe las acciones a verificar para el rol de **Estudiante**.

---

### 1. Panel Principal (`/dashboard`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **1.1. Ver el dashboard** | Al iniciar sesión, se muestra un resumen de los cursos en los que está inscrito y los anuncios recientes. |

### 2. Catálogo de Cursos (`/courses`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **2.1. Explorar cursos** | La página muestra todas las tarjetas de los cursos que están en estado "Publicado". |
| **2.2. Inscribirse a un curso** | Al hacer clic en "Inscribirse", el curso se añade a "Mis Cursos" y el botón cambia a "Continuar Curso". |

### 3. Mis Cursos (`/my-courses`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **3.1. Ver cursos inscritos** | La página muestra únicamente las tarjetas de los cursos en los que el estudiante está inscrito. |
| **3.2. Ver progreso en la tarjeta** | Cada tarjeta de curso muestra un indicador circular con el progreso actual. |
| **3.3. Cancelar inscripción** | Al cancelar una inscripción, el curso desaparece de esta lista y su progreso se elimina. |

### 4. Consumo de un Curso (`/courses/[courseId]`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **4.1. Acceder al contenido** | Al hacer clic en "Continuar Curso", se accede a la vista detallada con los módulos y lecciones. |
| **4.2. Seleccionar una lección** | Al hacer clic en una lección (video, texto, etc.), el contenido se muestra y la lección se marca como vista. |
| **4.3. Realizar un quiz** | Puede responder a las preguntas de un quiz y enviarlo. El sistema muestra la puntuación y la guarda. |
| **4.4. Calcular nota final** | Cuando todas las lecciones han sido vistas, el botón "Calcular Mi Puntuación Final" se activa. Al usarlo, se muestra la nota final en el indicador de progreso. |

### 5. Biblioteca de Recursos (`/resources`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **5.1. Navegar y ver recursos** | Puede navegar por las carpetas y previsualizar o descargar cualquier recurso público. |
| **5.2. Acceder a recurso protegido** | Si un recurso tiene PIN, se le pide que lo ingrese. Si es correcto, puede acceder al archivo. |

### 6. Anuncios y Calendario (`/announcements`, `/calendar`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **6.1. Ver anuncios** | Muestra una lista de anuncios dirigidos a él, a su rol o a toda la organización. |
| **6.2. Ver calendario** | Muestra los eventos del calendario que son relevantes para él. |

### 7. Notificaciones (Popover y `/notifications`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **7.1. Recibir notificaciones** | Recibe alertas (ej. nuevo curso publicado) que aparecen en el icono de la campana. |
| **7.2. Ver y gestionar notificaciones** | Puede ver una lista de todas sus notificaciones, marcarlas como leídas o eliminarlas. |

### 8. Perfil (`/profile`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **8.1. Editar su información** | Puede cambiar su nombre y su foto de perfil. Los cambios se guardan y se reflejan. |
| **8.2. Gestionar seguridad** | Puede cambiar su contraseña y activar o desactivar la autenticación de dos factores (2FA). |
