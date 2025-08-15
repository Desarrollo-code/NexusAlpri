# Manual de Administración de NexusAlpri

## 1. Introducción

Este manual está destinado a los usuarios con el rol de **Administrador**. Proporciona una guía completa para gestionar la plataforma, los usuarios, el contenido y la configuración del sistema.

## 2. Gestión de Usuarios

**Ruta:** `/users`

Desde esta sección, puedes realizar las siguientes acciones:
*   **Visualizar Usuarios:** Ver una lista de todos los usuarios registrados, con su nombre, email, rol y fecha de registro.
*   **Buscar y Filtrar:** Utiliza la barra de búsqueda para encontrar usuarios específicos.
*   **Añadir un Nuevo Usuario:**
    1.  Haz clic en "Añadir Nuevo Usuario".
    2.  Completa el nombre, email, rol y una contraseña inicial.
    3.  El usuario será creado y podrá iniciar sesión con esas credenciales.
*   **Editar un Usuario:**
    1.  Haz clic en el menú de acciones (tres puntos) de un usuario y selecciona "Editar".
    2.  Puedes modificar el nombre, email y rol del usuario.
*   **Eliminar un Usuario:**
    1.  Selecciona "Eliminar" en el menú de acciones.
    2.  Confirma la acción. Esto eliminará permanentemente al usuario y todos sus datos asociados (progreso, inscripciones, etc.).
    *Nota: No puedes eliminar tu propia cuenta de administrador.*
*   **Cambiar Rol:**
    1.  Selecciona "Cambiar Rol" en el menú de acciones para asignar rápidamente un nuevo rol sin entrar en la pantalla de edición completa.

## 3. Gestión de Cursos

**Ruta:** `/manage-courses`

Esta sección es el centro de control para todo el contenido formativo.
*   **Crear un Curso:**
    1.  Haz clic en "Crear Nuevo Curso".
    2.  Ingresa un título, descripción y categoría inicial.
    3.  Serás redirigido a la página de edición completa.
*   **Editar un Curso:**
    *   Haz clic en "Editar Contenido" en cualquier curso de la lista.
    *   En la página de edición, puedes modificar la información general, subir una imagen, y lo más importante: **añadir módulos y lecciones**.
    *   Puedes reordenar módulos y lecciones arrastrándolos.
*   **Gestionar Estado del Curso:**
    *   **Borrador (Draft):** El curso no es visible para los estudiantes. Es el estado por defecto.
    *   **Publicado (Published):** El curso es visible en el catálogo y los estudiantes pueden inscribirse.
    *   **Archivado (Archived):** El curso se oculta del catálogo principal pero conserva los datos de los usuarios inscritos.

## 4. Gestión de Contenido Global

### 4.1. Anuncios

**Ruta:** `/announcements`
*   Crea anuncios para toda la plataforma o para roles específicos (Estudiantes, Instructores, etc.).
*   Edita o elimina anuncios existentes.

### 4.2. Calendario

**Ruta:** `/calendar`
*   Crea eventos, talleres o recordatorios para la organización.
*   Define la audiencia del evento (todos, un rol específico o usuarios seleccionados).
*   Asigna colores para una mejor diferenciación visual.

### 4.3. Biblioteca de Recursos

**Ruta:** `/resources`

Aquí puedes gestionar todos los archivos y materiales compartidos de la organización.

*   **Subir Archivos:**
    1.  Haz clic en "Subir Recurso".
    2.  Puedes subir diferentes tipos de contenido: **documentos (PDF, Word), imágenes (JPG, PNG), videos (MP4), o añadir enlaces externos**.
    3.  Completa el título, la descripción y la categoría del recurso.
*   **Crear Carpetas:** Organiza los recursos en carpetas para una mejor navegación.
*   **Control de Acceso y Seguridad:** Al crear o editar un recurso, puedes configurar:
    *   **Visibilidad:**
        *   **Público:** El recurso es visible para todos los usuarios de la plataforma.
        *   **Privado:** El recurso solo es visible para ti y para los usuarios específicos con los que lo compartas.
    *   **Compartir con Usuarios:** Si un recurso es privado, puedes buscar y seleccionar usuarios individuales para concederles acceso.
    *   **Protección con PIN:** Puedes añadir un PIN de 4 a 8 dígitos a cualquier recurso (sea público o privado) como una capa extra de seguridad. Deberás comunicar este PIN a los usuarios que necesiten acceder.
*   **Gestionar Recursos Existentes:** Puedes editar los detalles, cambiar los permisos de acceso o eliminar cualquier recurso de la biblioteca.

## 5. Configuración del Sistema

**Ruta:** `/settings`

Esta sección te permite personalizar el comportamiento de toda la plataforma.
*   **Apariencia:** Cambia el nombre de la plataforma, los logos, colores y fuentes.
*   **Seguridad y Acceso:**
    *   **Registro Público:** Habilita o deshabilita la capacidad de que nuevos usuarios se registren por sí mismos.
    *   **Política de Contraseñas:** Define la complejidad requerida para las contraseñas de los usuarios.
    *   **Cierre por Inactividad:** Configura si los usuarios deben ser desconectados después de un tiempo de inactividad.
    *   **Requerir 2FA para Admins:** Fuerza a todos los administradores a usar Autenticación de Dos Factores.
*   **Categorías de Recursos:** Gestiona la lista de categorías disponibles al crear cursos o subir recursos a la biblioteca.

## 6. Mantenimiento y Monitoreo

*   **Copias de Seguridad:** La responsabilidad de las copias de seguridad de la base de datos recae en la configuración de la infraestructura del servidor de la base de datos (MySQL). Asegúrate de tener una política de copias de seguridad regular.
*   **Logs del Sistema:** Los logs de la aplicación (errores, accesos) son gestionados por el entorno de despliegue (ej. Vercel, Docker, un servidor PM2). Consulta la documentación de tu proveedor de hosting para acceder a ellos.
