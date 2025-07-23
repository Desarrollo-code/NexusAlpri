# Matriz de Trazabilidad y Plan de Pruebas - NexusAlpri

Este documento sirve como una matriz de trazabilidad de requisitos y, al mismo tiempo, como una plantilla para el plan de pruebas funcionales de la plataforma. Cada fila representa una acción específica que un usuario puede realizar, detallando el resultado esperado para su correcta validación.

---

## 1. Rol: Administrador (`ADMINISTRATOR`)

| Módulo/Funcionalidad | Acción a Realizar | Verificación Esperada | Resultado | Observaciones |
| :--- | :--- | :--- | :--- | :--- |
| **Gestión de Usuarios** | Visualizar la lista de todos los usuarios. | La tabla en `/users` se carga y muestra una lista paginada de todos los usuarios registrados con su nombre, email, rol y fecha de registro. | [PENDIENTE] | |
| | Buscar un usuario por nombre o email. | Al escribir en la barra de búsqueda, la lista de usuarios se filtra en tiempo real para mostrar solo las coincidencias. | [PENDIENTE] | |
| | Crear un nuevo usuario. | Al completar el formulario y guardar, el nuevo usuario aparece en la lista y puede iniciar sesión con las credenciales creadas. Se registra el evento en la auditoría de seguridad. | [PENDIENTE] | |
| | Editar el nombre de un usuario. | Al editar un usuario y guardar los cambios, el nuevo nombre se refleja inmediatamente en la lista de usuarios. | [PENDIENTE] | |
| | Cambiar el rol de un usuario. | Al cambiar el rol desde el modal de edición o el menú rápido, el nuevo rol se muestra en la lista y se registra el cambio en la auditoría de seguridad. | [PENDIENTE] | |
| | Eliminar un usuario. | Al confirmar la eliminación, el usuario desaparece de la lista y ya no puede iniciar sesión. No se puede eliminar a sí mismo. | [PENDIENTE] | |
| **Gestión de Cursos** | Crear un nuevo curso. | Al llenar el formulario inicial, se redirige a la página de edición completa (`/manage-courses/[id]/edit`) y el curso aparece en la lista como "Borrador". | [PENDIENTE] | |
| | Editar la información de un curso. | Cualquier cambio en el título, descripción, categoría o imagen de un curso se guarda y persiste al recargar la página de edición. | [PENDIENTE] | |
| | Reordenar módulos y lecciones. | Al arrastrar y soltar un módulo o una lección en el editor, su nueva posición se guarda correctamente y se mantiene al volver a entrar. | [PENDIENTE] | |
| | Publicar un curso. | Al cambiar el estado a "Publicado", el curso se vuelve visible en el `/courses` para los estudiantes y se envía una notificación. | [PENDIENTE] | |
| | Archivar un curso. | Al cambiar el estado a "Archivado", el curso se oculta del catálogo principal pero se conservan los datos de inscripción y progreso. | [PENDIENTE] | |
| | Eliminar un curso. | Al confirmar la eliminación, el curso desaparece de la lista de gestión y de la base de datos, junto con todo su contenido y los datos de progreso asociados. | [PENDIENTE] | |
| | Guardar una lección como plantilla. | Al guardar una lección como plantilla desde el editor, esta se vuelve disponible en el modal "Usar Plantilla" para futuros usos en otros cursos. | [PENDIENTE] | |
| | Crear lección desde plantilla. | Al seleccionar una plantilla, se añade una nueva lección al módulo con la estructura y contenido predefinidos por la plantilla. | [PENDIENTE] | |
| **Analíticas** | Ver el dashboard de analíticas. | La página `/analytics` carga y muestra gráficos y métricas sobre usuarios, cursos e inscripciones sin errores. | [PENDIENTE] | |
| **Auditoría** | Revisar los registros de seguridad. | La página `/security-audit` muestra una tabla cronológica de eventos como inicios de sesión, cambios de rol y cambios de contraseña. | [PENDIENTE] | |
| **Configuración** | Cambiar el nombre de la plataforma. | Al guardar un nuevo nombre en `/settings`, el cambio se refleja en el layout principal de la aplicación. | [PENDIENTE] | |
| | Habilitar/deshabilitar el registro público. | Al cambiar el switch y guardar, la página `/sign-up` se vuelve accesible o muestra un mensaje de "Registro deshabilitado". | [PENDIENTE] | |
| | Gestionar categorías de recursos. | Al añadir una nueva categoría en `/settings`, esta aparece como una opción seleccionable al crear cursos o recursos. Al eliminarla, desaparece de dichas opciones. | [PENDIENTE] | |
| **Contenido Global** | Crear un anuncio para todos. | Al crear un anuncio para "Todos", este es visible en el dashboard y en la página `/announcements` para todos los roles. | [PENDIENTE] | |
| | Crear un evento en el calendario. | El evento creado en `/calendar` aparece en el calendario de la audiencia seleccionada (todos, un rol específico o usuarios concretos). | [PENDIENTE] | |
| | Subir un recurso a la biblioteca. | El archivo subido en `/resources` aparece en la carpeta correspondiente y es accesible para todos los usuarios. | [PENDIENTE] | |
| | Proteger un recurso con PIN. | Al asignar un PIN a un recurso, el sistema pide dicho PIN a los usuarios antes de permitirles la descarga o visualización. | [PENDIENTE] | |
| **Inscripciones** | Ver inscritos de cualquier curso. | La página `/enrollments` permite seleccionar cualquier curso de la plataforma y muestra la lista de estudiantes inscritos con su progreso. | [PENDIENTE] | |

---

## 2. Rol: Instructor (`INSTRUCTOR`)

| Módulo/Funcionalidad | Acción a Realizar | Verificación Esperada | Resultado | Observaciones |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | Visualizar el panel principal. | El dashboard muestra resúmenes y accesos directos a los cursos creados por el instructor. | [PENDIENTE] | |
| **Gestión de Cursos** | Crear un nuevo curso. | Se crea un nuevo curso en estado "Borrador" y el instructor es asignado automáticamente como el creador. | [PENDIENTE] | |
| | Ver la lista de cursos a gestionar. | La lista en `/manage-courses` muestra únicamente los cursos creados por el instructor. No puede ver los de otros instructores (a menos que también sea admin). | [PENDIENTE] | |
| | Editar el contenido de su propio curso. | El instructor puede añadir, editar y reordenar módulos y lecciones solo en los cursos que él ha creado. | [PENDIENTE] | |
| | Publicar su propio curso. | El instructor puede cambiar el estado de sus cursos a "Publicado", haciéndolos visibles en el catálogo general. | [PENDIENTE] | |
| **Seguimiento** | Ver la lista de inscritos. | En `/enrollments`, el instructor solo puede seleccionar y ver los estudiantes inscritos en los cursos que él imparte. | [PENDIENTE] | |
| **Contenido Global** | Crear un anuncio. | El instructor puede crear anuncios para diferentes audiencias (ej. solo sus estudiantes, todos los estudiantes, etc.). | [PENDIENTE] | |
| | Subir un recurso a la biblioteca. | El instructor puede subir archivos a la biblioteca y estos se marcan como subidos por él. Puede editar y eliminar solo sus propios recursos. | [PENDIENTE] | |
| **Perfil** | Editar su propio perfil. | El instructor puede cambiar su nombre, avatar y contraseña desde `/profile`. | [PENDIENTE] | |

---

## 3. Rol: Estudiante (`STUDENT`)

| Módulo/Funcionalidad | Acción a Realizar | Verificación Esperada | Resultado | Observaciones |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | Visualizar el panel principal. | El dashboard muestra un resumen de los cursos en los que el estudiante está inscrito y los anuncios recientes. | [PENDIENTE] | |
| **Catálogo de Cursos** | Explorar el catálogo de cursos. | La página `/courses` muestra todas las tarjetas de los cursos con estado "Publicado". | [PENDIENTE] | |
| **Inscripción** | Inscribirse a un curso. | Al hacer clic en "Inscribirse", el curso se añade a la sección "Mis Cursos" y el botón cambia a "Continuar Curso". | [PENDIENTE] | |
| | Cancelar la inscripción. | Desde la página de "Mis Cursos", el estudiante puede cancelar su inscripción. El curso desaparece de su lista y se borra su progreso. | [PENDIENTE] | |
| **Consumo de Curso** | Ver el contenido de una lección. | Al hacer clic en una lección (video, texto, etc.), el contenido se muestra correctamente y la lección se marca como vista automáticamente para el progreso. | [PENDIENTE] | |
| | Realizar un quiz. | El estudiante puede responder a las preguntas de un quiz y enviarlo. El sistema muestra la puntuación y la guarda. | [PENDIENTE] | |
| **Progreso** | Solicitar el cálculo de la nota final. | Cuando el estudiante ha interactuado con todas las lecciones, el botón "Calcular Mi Puntuación Final" se activa. Al pulsarlo, se muestra la nota final en el indicador circular. | [PENDIENTE] | |
| **Biblioteca** | Acceder a un recurso público. | El estudiante puede navegar por las carpetas y descargar o visualizar cualquier recurso que no esté protegido. | [PENDIENTE] | |
| | Acceder a un recurso protegido. | Al intentar acceder a un recurso con PIN, se muestra un modal pidiendo el código. Si es correcto, se concede el acceso. Si es incorrecto, se muestra un error. | [PENDIENTE] | |
| **Perfil** | Editar su perfil y seguridad. | El estudiante puede cambiar su nombre, avatar, contraseña y gestionar la autenticación de dos factores (2FA) desde `/profile`. | [PENDIENTE] | |
| **Autenticación** | Iniciar y cerrar sesión. | El usuario puede iniciar sesión con sus credenciales y cerrarla de forma segura, siendo redirigido a la página de login. | [PENDIENTE] | |
| | Registrarse (si está habilitado). | Si el registro público está activo, el usuario puede crear una cuenta nueva y acceder al dashboard. | [PENDIENTE] | |
| **Notificaciones** | Ver notificaciones. | El estudiante recibe notificaciones (ej. nuevo curso publicado, nuevo anuncio) y puede verlas en el popover de la barra superior o en la página `/notifications`. | [PENDIENTE] | |
| **Calendario** | Ver el calendario de eventos. | El estudiante puede ver en `/calendar` los eventos dirigidos a él, a su rol o a toda la organización. | [PENDIENTE] | |
| **Anuncios** | Ver anuncios relevantes. | En `/announcements`, el estudiante ve una lista de los anuncios dirigidos a él, a su rol o a todos los usuarios. | [PENDIENTE] | |
