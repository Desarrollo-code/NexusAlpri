
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

### 2.3. Lógica de Progreso del Estudiante

El seguimiento del progreso es un sistema automático y robusto diseñado para reflejar la interacción real del usuario.

1.  **Interacciones en el Frontend:** La página de detalle del curso (`/courses/[courseId]`) detecta diferentes tipos de interacción sin necesidad de que el usuario haga clic en un botón:
    *   **Lecciones de Texto/PDF:** Se registra una interacción de "vista" cuando el usuario accede a la lección.
    *   **Lecciones de Video/Archivo:** Se registra una interacción de "vista" al seleccionar la lección.
    *   **Quices:** El componente `QuizViewer` gestiona el envío del quiz y su puntuación.

2.  **Registro de Interacciones (API):** Cada una de estas interacciones desencadena una llamada a la API (`POST /api/progress/[userId]/[courseId]/...`) de forma asíncrona. Esta API no calcula el progreso final, simplemente almacena la interacción en la base de datos.

3.  **Almacenamiento en Base de Datos:**
    *   El modelo `CourseProgress` tiene un campo `completedLessonIds` de tipo `Json`.
    *   Este campo almacena un array de objetos, donde cada objeto representa una lección completada y contiene: `lessonId`, `type` ('view' o 'quiz') y `score` (si es un quiz).

4.  **Consolidación y Cálculo Final:**
    *   La UI activa el botón "Calcular Mi Puntuación Final" solo cuando todas las lecciones del curso tienen un registro de interacción.
    *   Al hacer clic, se llama a la API `POST /api/progress/[userId]/[courseId]/consolidate`.
    *   Esta ruta de API ejecuta la lógica de negocio en `src/lib/progress.ts`, que:
        *   Lee todos los registros de interacción del campo `Json`.
        *   Calcula una **puntuación final ponderada**. Las lecciones de 'view' aportan un valor fijo (ej. 100 puntos), mientras que las de 'quiz' aportan un valor basado en la nota (`score`).
        *   Guarda este porcentaje final en el campo `progressPercentage` del modelo `CourseProgress`.
    *   La UI recibe este porcentaje final y lo muestra en el indicador circular de progreso.

## 3. Base de Datos

### 3.1. Esquema (Prisma)

El esquema se define en `prisma/schema.prisma`. Los modelos principales son:
*   `User`: Almacena usuarios, roles y credenciales.
*   `Course`, `Module`, `Lesson`: Estructura jerárquica de los cursos.
*   `Quiz`, `Question`, `AnswerOption`: Componentes para las evaluaciones.
*   **`CourseProgress`**: Guarda el progreso de un usuario en un curso. El campo `completedLessonIds` es de tipo `Json` y almacena un array de objetos detallando cada interacción (tipo y nota si aplica). El campo `progressPercentage` guarda la nota final consolidada. Este modelo tiene una relación directa con `Enrollment`.
*   `Resource`: Para la biblioteca de recursos (archivos y carpetas). Su campo `pin` almacena el hash del PIN de seguridad.
*   `Announcement`, `CalendarEvent`, `Notification`: Para comunicación y eventos.
*   `PlatformSettings`: Almacena la configuración global de la plataforma.
*   **`SecurityLog`**: Registra eventos importantes de seguridad, como inicios de sesión (exitosos y fallidos), cambios de contraseña y cambios de rol.
*   **`LessonTemplate`, `TemplateBlock`**: Almacenan las estructuras de las lecciones reutilizables.

### 3.2. Migraciones con Prisma

Cada vez que modificas el archivo `schema.prisma`, la estructura de tu base de datos debe ser actualizada para reflejar esos cambios. Este proceso se gestiona con **Prisma Migrate**.

Para crear y aplicar una nueva migración, ejecuta el siguiente comando en tu terminal:

```bash
npm run prisma:migrate -- --name "un_nombre_descriptivo_para_la_migracion"
```
**Ejemplo Práctico:**

Supongamos que quieres añadir un campo `phoneNumber` a la tabla `User`.

1.  **Modifica el esquema** en `prisma/schema.prisma`:
    ```prisma
    model User {
      // ... otros campos
      phoneNumber String?
    }
    ```
2.  **Ejecuta el comando** en la terminal:
    ```bash
    npm run prisma:migrate -- --name "add_phone_number_to_user"
    ```
    **Importante:** No olvides el `--` después de `prisma:migrate`. Es necesario para pasar el argumento `--name` al script subyacente de Prisma.

**¿Qué hace este comando?**
1.  **Compara:** Analiza tu `schema.prisma` y lo compara con el estado actual de la base de datos.
2.  **Genera un Archivo SQL:** Crea un nuevo archivo de migración dentro de la carpeta `prisma/migrations/`. Este archivo contiene las instrucciones SQL necesarias para actualizar la base de datos (ej. `CREATE TABLE`, `ALTER TABLE ... ADD COLUMN ...`, etc.). Darle un nombre descriptivo es una excelente práctica.
3.  **Aplica la Migración:** Ejecuta el archivo SQL contra la base de datos, actualizando su estructura.

## 4. Documentación de API Endpoints

Las rutas de la API se encuentran en `src/app/api/`. Algunos endpoints clave son:
*   `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`: Manejan todo el ciclo de vida de la autenticación.
*   `/api/users`: CRUD para la gestión de usuarios (solo Admins).
*   `/api/courses`: CRUD para cursos.
*   `/api/enrollments`: Para inscribir usuarios y ver inscripciones.
*   `/api/progress`: Para obtener y actualizar el progreso de los cursos.
*   `/api/resources`: CRUD para la biblioteca de recursos.
*   `/api/settings`: Para obtener y guardar la configuración de la plataforma.

La autenticación se realiza a través de un token JWT en una cookie de sesión. El `middleware.ts` protege las rutas.

## 5. Configuración del Entorno de Desarrollo

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

## 6. Estándares de Codificación

*   **TypeScript:** Utilizar tipado estricto siempre que sea posible.
*   **Componentes:** Favorecer el uso de componentes de ShadCN (`@/components/ui`) y crear componentes reutilizables en `@/components/`.
*   **Estilos:** Utilizar clases de Tailwind CSS. Evitar CSS en línea o archivos CSS separados.
*   **Formularios:** Utilizar `react-hook-form` para la gestión de formularios complejos.
*   **Código Asíncrono:** Utilizar `async/await` para operaciones asíncronas.
*   **Comentarios:** Añadir comentarios JSDoc a funciones complejas y a las props de los componentes para clarificar su propósito.

