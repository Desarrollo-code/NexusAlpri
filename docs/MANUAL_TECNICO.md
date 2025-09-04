# Manual Técnico de NexusAlpri

## 1. Introducción

Este documento proporciona una visión técnica de la arquitectura, base de datos y configuración del proyecto NexusAlpri. Está dirigido a desarrolladores y personal técnico que necesiten entender, mantener o extender la aplicación.

**Stack Tecnológico Principal:**
*   **Framework:** Next.js 15+ (con App Router y Server Components)
*   **Lenguaje:** TypeScript
*   **Base de Datos:** MySQL (gestionada con Prisma ORM)
*   **Estilos:** Tailwind CSS
*   **Componentes UI:** ShadCN
*   **Autenticación:** JWT almacenado en cookies http-only

## 2. Arquitectura del Sistema

### 2.1. Estructura de Carpetas

*   `src/app/(app)/`: Contiene las rutas y páginas protegidas de la aplicación (Dashboard, Cursos, etc.).
*   `src/app/(public)/`: Contiene las páginas públicas de la aplicación (landing, about, etc.).
*   `src/app/(auth)/`: Contiene las páginas públicas de autenticación (sign-in, sign-up).
*   `src/app/api/`: Define todos los endpoints de la API del backend. Sigue la estructura de enrutamiento de Next.js.
*   `src/components/`: Componentes de React reutilizables.
    *   `src/components/ui/`: Componentes base de ShadCN.
*   `src/lib/`: Funciones y utilidades compartidas.
    *   `auth.ts`: Lógica de sesión (JWT, cookies).
    *   `prisma.ts`: Instancia global del cliente de Prisma.
*   `src/contexts/`: Contextos de React (ej. `AuthContext` para la sesión del usuario).
*   `prisma/`:
    *   `schema.prisma`: Define el esquema de la base de datos.
    *   `migrations/`: Contiene las migraciones de la base de datos.

### 2.2. Flujo de Datos

1.  El cliente (navegador) solicita una página.
2.  Un Server Component en Next.js puede obtener datos directamente o llamar a una API Route.
3.  Las API Routes (`src/app/api/...`) manejan la lógica de negocio.
4.  La lógica de la API utiliza el cliente de **Prisma** (`@/lib/prisma`) para interactuar con la base de datos MySQL.
5.  Los datos se devuelven como JSON al componente o al cliente.

## 3. Lógicas de Negocio Clave

### 3.1. Lógica de Progreso del Estudiante

El seguimiento del progreso es un sistema automático y robusto diseñado para reflejar la interacción real del usuario.

1.  **Registro de Interacciones (Frontend):** La página de detalle del curso (`/courses/[courseId]`) detecta diferentes tipos de interacción sin necesidad de que el usuario haga clic en un botón:
    *   **Lecciones Pasivas (Texto/Video/Archivo):** Se marca como completada automáticamente cuando el usuario **selecciona la lección** en la barra lateral. Esto dispara una llamada a `POST /api/progress/[userId]/[courseId]/lesson`.
    *   **Lecciones Activas (Quices):** El componente `QuizViewer` gestiona el envío del quiz y su puntuación. Al finalizar, llama a `POST /api/progress/[userId]/[courseId]/quiz` con la nota obtenida.

2.  **Almacenamiento de Datos (Backend):**
    *   Cada una de estas interacciones se guarda como un registro individual en la tabla `LessonCompletionRecord`. Esta tabla almacena el ID de la lección, el tipo de interacción ('view' o 'quiz') y la puntuación si aplica.
    *   Estos registros están vinculados a un `CourseProgress`, que agrupa todas las interacciones de un usuario para un curso específico.

3.  **Consolidación y Cálculo Final:**
    *   La UI activa el botón **"Calcular Mi Puntuación Final"** solo cuando el sistema verifica que existen registros en `LessonCompletionRecord` para **todas** las lecciones del curso.
    *   Al hacer clic, se llama a la API `POST /api/progress/[userId]/[courseId]/consolidate`.
    *   Esta ruta ejecuta la lógica de negocio principal (`src/lib/progress.ts`), que:
        *   Lee todos los `LessonCompletionRecord` asociados a ese progreso.
        *   Calcula una **puntuación final ponderada**. Las lecciones de 'view' aportan 100 puntos, mientras que las de 'quiz' aportan su nota (`score`). Se promedia el total.
        *   Guarda este porcentaje final en el campo `progressPercentage` del modelo `CourseProgress`.
    *   La UI recibe este porcentaje final y lo muestra en el indicador circular de progreso.

### 3.2. Lógica de Formularios y Evaluaciones

El sistema de formularios es una herramienta versátil para crear encuestas o evaluaciones con puntuación.

1.  **Creación y Configuración (Instructores/Admins):**
    *   Desde la página `/forms`, un usuario autorizado puede crear un nuevo formulario.
    *   En el editor de formularios (`/forms/[formId]/edit`), se pueden añadir campos de distintos tipos (texto, párrafo, opción única, opción múltiple).
    *   Se puede habilitar el modo **"Evaluación" (Quiz)**. Si está activo, permite asignar puntos a las opciones de respuesta (actualmente solo para campos de opción única), que se usarán para calcular una puntuación final.

2.  **Envío y Compartición:**
    *   **Envío de Respuestas (Estudiantes):** Los estudiantes acceden al formulario a través de su URL directa (`/forms/[formId]/view`) si está publicado, o si ha sido compartido con ellos.
    *   **Lógica de Compartición:** Un instructor o administrador puede compartir un formulario con usuarios específicos usando el endpoint `PUT /api/forms/[id]`, que actualiza la relación `sharedWith` en el modelo `Form`.
    *   Al enviar sus respuestas (`POST /api/forms/[id]/submit`), el sistema crea un registro `FormResponse`.
    *   Si el formulario es una evaluación, el backend calcula automáticamente la puntuación total basándose en los puntos asignados a las opciones correctas y la almacena en el `FormResponse`.

3.  **Análisis de Resultados (Instructores/Admins):**
    *   La página de resultados (`/forms/[formId]/results`) obtiene los datos consolidados.
    *   Muestra métricas clave como el número total de respuestas y la puntuación promedio (si es una evaluación).
    *   Para cada pregunta, genera un resumen visual:
        *   Para preguntas de opción múltiple o única, muestra gráficos de barras con la distribución de respuestas.
        *   Para preguntas de texto, muestra una lista de las respuestas recibidas.

### 3.3. Lógica de Notificaciones

El sistema de notificaciones es proactivo y está automatizado para mantener a los usuarios informados.

1.  **Creación Automática:** Las notificaciones se generan por eventos del sistema, no manualmente.
    *   **Nuevo Anuncio:** Al publicarse un anuncio (`POST /api/announcements`), se crean notificaciones para todos los usuarios de la audiencia objetivo (ej. "Todos los Estudiantes").
    *   **Curso Publicado:** Al cambiar el estado de un curso a `PUBLISHED` (`PATCH /api/courses/[id]/status`), se generan notificaciones para todos los usuarios de la plataforma.

2.  **Personalización y Gestión:**
    *   Cada notificación está vinculada a un `userId`, creando una bandeja de entrada personal.
    *   Desde `/notifications`, un usuario puede ver todas sus notificaciones, marcarlas como leídas (individualmente o en masa) o eliminarlas. Estas acciones se gestionan en `GET`, `PATCH` y `DELETE` de `/api/notifications`.

### 3.4. Lógica de Eventos del Calendario

El calendario está diseñado para ser flexible y mostrar solo la información relevante para cada usuario.

1.  **Creación y Audiencia (Roles `ADMINISTRATOR` e `INSTRUCTOR`):**
    *   Al crear un evento (`POST /api/events`), se define una audiencia:
        *   `ALL`: Visible para todos.
        *   `ADMINISTRATOR`, `INSTRUCTOR`, `STUDENT`: Visible solo para usuarios con ese rol.
        *   `SPECIFIC`: Visible solo para los usuarios seleccionados en la lista de `attendees`.

2.  **Visualización Inteligente (Todos los roles):**
    *   Cuando un usuario carga el calendario (`GET /api/events`), la API no devuelve todos los eventos.
    *   Realiza una consulta a la base de datos que filtra los eventos donde el usuario actual cumpla una de las siguientes condiciones:
        1.  El tipo de audiencia es `ALL`.
        2.  El tipo de audiencia coincide con el `role` del usuario.
        3.  El `id` del usuario está presente en la lista de `attendees` del evento.
    *   Esto asegura que el calendario de cada usuario esté limpio y sea relevante para él.

## 4. Base de Datos

### 4.1. Esquema (Prisma)

El esquema se define en `prisma/schema.prisma`. Los modelos principales son:
*   `User`: Almacena usuarios, roles y credenciales.
*   `Course`, `Module`, `Lesson`: Estructura jerárquica de los cursos.
*   `Quiz`, `Question`, `AnswerOption`: Componentes para las evaluaciones.
*   **`CourseProgress`**: Guarda el progreso de un usuario en un curso. El campo `completedLessonIds` fue reemplazado por una relación al nuevo modelo `LessonCompletionRecord`. El campo `progressPercentage` guarda la nota final consolidada.
*   **`LessonCompletionRecord`**: Nuevo modelo que almacena cada interacción con una lección (vista, quiz completado, etc.).
*   `Resource`: Para la biblioteca de recursos (archivos y carpetas). Su campo `pin` almacena el hash del PIN de seguridad.
*   `Announcement`, `CalendarEvent`, `Notification`: Para comunicación y eventos.
*   `PlatformSettings`: Almacena la configuración global de la plataforma.
*   **`SecurityLog`**: Registra eventos importantes de seguridad, como inicios de sesión (exitosos y fallidos), cambios de contraseña y cambios de rol.
*   **`LessonTemplate`, `TemplateBlock`**: Almacenan las estructuras de las lecciones reutilizables.
*   **`Form`, `FormField`, `FormResponse`**: Modelos para el sistema de formularios y evaluaciones.

### 4.2. Migraciones y Sincronización con Prisma

Para entornos de desarrollo, se utiliza `prisma migrate` para generar y aplicar migraciones SQL. Para despliegues en producción o entornos sin estado, `prisma db push` es la herramienta recomendada para sincronizar el esquema directamente con la base de datos.

**Para crear una nueva migración en desarrollo:**
```bash
npm run prisma:migrate -- --name "un_nombre_descriptivo_para_la_migracion"
```
Esto crea un archivo SQL en la carpeta `prisma/migrations/`.

**Para sincronizar la base de datos en producción (ej. Vercel):**
El script `build` en `package.json` ejecuta `prisma db push` para asegurar que el esquema de la base de datos coincida con el `schema.prisma` actual.

## 5. Documentación de API Endpoints

Las rutas de la API se encuentran en `src/app/api/`. Algunos endpoints clave son:
*   `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`: Manejan todo el ciclo de vida de la autenticación.
*   `/api/users`: CRUD para la gestión de usuarios (solo Admins).
*   `/api/courses`: CRUD para cursos.
*   `/api/enrollments`: Para inscribir usuarios y ver inscripciones.
*   `/api/progress`: Para obtener y actualizar el progreso de los cursos.
*   `/api/resources`: CRUD para la biblioteca de recursos.
*   `/api/settings`: Para obtener y guardar la configuración de la plataforma.

La autenticación se realiza a través de un token JWT en una cookie http-only. El `middleware.ts` protege las rutas.

## 6. Configuración del Entorno de Desarrollo

1.  **Requisitos:** Node.js, npm, y una base de datos MySQL en ejecución.
2.  **Instalación:**
    ```bash
    npm install
    ```
3.  **Variables de Entorno:**
    Crea un archivo `.env` en la raíz del proyecto y define las siguientes variables:
    ```env
    DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
    JWT_SECRET="genera-una-cadena-aleatoria-muy-segura-aqui"
    RESEND_API_KEY="tu_api_key_de_resend"
    ```
4.  **Aplicar Migraciones:**
    ```bash
    npm run prisma:migrate
    ```
5.  **Ejecutar el Proyecto:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:9002`.

## 7. Estándares de Codificación

*   **TypeScript:** Utilizar tipado estricto siempre que sea posible.
*   **Componentes:** Favorecer el uso de componentes de ShadCN (`@/components/ui`) y crear componentes reutilizables en `@/components/`.
*   **Estilos:** Utilizar clases de Tailwind CSS. Evitar CSS en línea o archivos CSS separados.
*   **Formularios:** Utilizar `react-hook-form` para la gestión de formularios complejos.
*   **Código Asíncrono:** Utilizar `async/await` para operaciones asíncronas.
*   **Comentarios:** Añadir comentarios JSDoc a funciones complejas y a las props de los componentes para clarificar su propósito.
