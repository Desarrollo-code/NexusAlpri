# Manual de Arquitectura y Diseño - NexusAlpri

## 1. Visión General de la Arquitectura

### 1.1. Estilo Arquitectónico
NexusAlpri está construido como una **aplicación web monolítica con renderizado en el servidor (SSR)**, utilizando el **App Router de Next.js**. Esta arquitectura, aunque monolítica en su despliegue, sigue principios modulares en su código para facilitar el mantenimiento.

### 1.2. Rationale de la Elección
La elección de esta arquitectura se basa en tres pilares:

1.  **Rendimiento:** El uso de **React Server Components (RSC)** por defecto permite que la mayor parte de la lógica de renderizado y obtención de datos se ejecute en el servidor. Esto reduce drásticamente la cantidad de JavaScript enviado al cliente, resultando en tiempos de carga inicial más rápidos y una mejor experiencia de usuario.
2.  **Seguridad:** Al ejecutar la lógica de acceso a datos en el servidor, las credenciales de la base de datos y la lógica de negocio sensible nunca se exponen al cliente. Las interacciones con la base de datos se realizan de forma segura a través de **Prisma ORM** directamente desde los componentes del servidor o las API Routes.
3.  **Experiencia del Desarrollador (DX):** Next.js App Router proporciona un modelo mental unificado para el frontend y el backend, con un sistema de enrutamiento basado en carpetas que es intuitivo y escalable. TypeScript añade una capa de seguridad y autocompletado que agiliza el desarrollo y reduce errores.

### 1.3. Decisiones de Diseño Clave
*   **"Server-First":** La mayoría de los componentes son Server Components. Solo los componentes que requieren interactividad del usuario (hooks, event listeners) se marcan explícitamente con la directiva `'use client'`.
*   **Separación de Lógica de Negocio:** La lógica que modifica datos (CUD de CRUD) se encapsula en **API Routes** (`/src/app/api`), proporcionando un límite claro entre el frontend y las operaciones de escritura.
*   **Gestión de Estado Global:** Para estados que necesitan ser compartidos en el lado del cliente (como la información de la sesión del usuario), se utiliza el **Patrón Proveedor (Provider Pattern)** de React a través de `Contexts`.

---

## 2. Patrones de Diseño Utilizados

*   **Provider Pattern (Patrón Proveedor):**
    *   **Uso:** Se utiliza para gestionar el estado global de la sesión del usuario (`AuthContext`) y el título de la página (`TitleContext`).
    *   **Por qué:** Permite que los componentes de cliente accedan a datos compartidos (como el usuario autenticado) sin necesidad de pasarlos como props a través de múltiples niveles (evitando el "prop drilling").

*   **Custom Hooks (Hooks Personalizados):**
    *   **Uso:** Se crean hooks como `useIsMobile`, `useIdleTimeout` y `useDebounce` para encapsular y reutilizar lógica compleja y con estado.
    *   **Por qué:** Mejora la legibilidad del código, fomenta la reutilización y separa las preocupaciones.

*   **Server Components & Client Components:**
    *   **Uso:** Es el patrón de diseño fundamental impuesto por Next.js App Router. Los componentes que obtienen datos se mantienen como Server Components, mientras que los que manejan la interacción del usuario son Client Components.
    *   **Por qué:** Optimiza el rendimiento al minimizar el JavaScript del lado del cliente.

---

## 3. Diagramas de Diseño (UML)

### 3.1. Diagrama de Componentes de Alto Nivel

```
+---------------------+      +------------------------------+      +-------------------------+
|  Cliente (Navegador)  |<---->|   Servidor Next.js (Vercel)  |<---->|   Supabase (Backend)    |
+---------------------+      |                              |      +-------------------------+
                             | +--------------------------+ |      | +---------------------+ |
                             | | Middleware (auth)        | |      | |    PostgreSQL DB    | |
                             | +--------------------------+ |      | +---------------------+ |
                             | | App Router               | |      |                         |
                             | |  - Server Components     | |      | +---------------------+ |
                             | |  - Client Components     | |      | |   Supabase Storage  | |
                             | +--------------------------+ |      | +---------------------+ |
                             | | API Routes               | |      |                         |
                             | +--------------------------+ |      | +---------------------+ |
                             | | Prisma ORM               | |      | |   Supabase Auth     | |
                             | +--------------------------+ |      | +---------------------+ |
                             +------------------------------+      +-------------------------+
```

### 3.2. Diagrama de Secuencia: Inicio de Sesión de Usuario

```
[Usuario]       [Cliente]          [API Route: /api/auth/login]       [Prisma]            [Base de Datos]
   |                |                       |                           |                       |
   |-- Ingresa      |                       |                           |                       |
   |  Credenciales->|                       |                           |                       |
   |                |-- POST /api/auth/login |                           |                       |
   |                |  (email, password) -->|                       |                           |
   |                |                       |-- findUnique(email) ----> |                       |
   |                |                       |                           |-- SELECT * FROM User  |
   |                |                       |                           |    WHERE email=... -> |
   |                |                       |                           |                       |
   |                |                       |<-- Devuelve Usuario      -|                       |
   |                |                       |--(Compara Contraseña)     |                       |
   |                |                       |-- (Si es válido)          |                       |
   |                |                       |   createSession(userId)   |                       |
   |                |                       |-- (Set-Cookie header)     |                       |
   |                |<-- 200 OK (User Data) |                           |                       |
   |                |                       |                           |                       |
[Redirección a /dashboard]<-|                       |                           |                       |
   |                |                       |                           |                       |
```

### 3.3. Diagrama de Despliegue

```
+------------------------------------------------+
|  Servidores de Vercel (Edge Network)           |
|                                                |
|  +-----------------------------------------+   |
|  |   Entorno de Ejecución de Next.js       |   |
|  |                                         |   |
|  |   [ NexusAlpri - Aplicación Monolítica ]|   |
|  |        (Código del Proyecto)            |   |
|  +-----------------------------------------+   |
|                      | (Conexión TCP/IP)         |
+----------------------|-------------------------+
                       |
                       v
+------------------------------------------------+
|  Plataforma Supabase (Cloud)                   |
|                                                |
|  +------------------+   +------------------+   |
|  |  PostgreSQL      |   |  Storage (S3)    |   |
|  |  (Base de Datos) |   |  (Archivos)      |   |
|  +------------------+   +------------------+   |
|                                                |
+------------------------------------------------+
```

---

## 4. Diseño de la Base de Datos

El sistema utiliza una base de datos **PostgreSQL**, gestionada a través del ORM **Prisma**. El esquema completo y la fuente de verdad se encuentra en `prisma/schema.prisma`.

### Modelo de Entidad-Relación (Simplificado)

*   `User` (1) ---< (N) `Course` (como instructor)
*   `User` (1) ---< (N) `Enrollment`
*   `Course` (1) ---< (N) `Enrollment`
*   `Course` (1) ---< (N) `Module`
*   `Module` (1) ---< (N) `Lesson`
*   `Lesson` (1) ---< (N) `ContentBlock`
*   `ContentBlock` (1) --- (0..1) `Quiz`
*   `User` (1) ---< (N) `Announcement` (como autor)
*   `User` (1) ---< (N) `EnterpriseResource` (como uploader)
*   `EnterpriseResource` (1) ---< (N) `EnterpriseResource` (relación padre-hijo para carpetas)

Las relaciones clave son de uno a muchos (un instructor tiene muchos cursos, un curso tiene muchos módulos) y de muchos a muchos a través de una tabla de unión (`Enrollment` para usuarios y cursos).

---

## 5. Consideraciones de Seguridad

*   **Autenticación:** Se utiliza un sistema de **JSON Web Tokens (JWT)**. Tras un inicio de sesión exitoso, se genera un token firmado que se almacena en una **cookie `http-only`**. Esto previene que el token sea accedido por scripts del lado del cliente, mitigando ataques XSS.
*   **Autorización:** La autorización se gestiona a dos niveles:
    1.  **Middleware (`src/middleware.ts`):** Protege rutas enteras, redirigiendo a los usuarios no autenticados que intentan acceder a áreas protegidas.
    2.  **Verificación a nivel de API Route/Server Component:** Dentro de la lógica de negocio, se verifica el rol del usuario (`session.role`) antes de permitir operaciones críticas (ej. solo un 'ADMINISTRATOR' puede eliminar a otro usuario).
*   **Protección de Contraseñas:** Las contraseñas nunca se almacenan en texto plano. Se utiliza la librería `bcrypt` para generar un hash de la contraseña con un "salt" antes de guardarla en la base de datos.
*   **Autenticación de Dos Factores (2FA):** El sistema soporta 2FA basada en tiempo (TOTP), utilizando librerías como `otplib`. El secreto se guarda en la base de datos y se utiliza para verificar el código proporcionado por el usuario.
*   **Prevención de CSRF:** Next.js tiene protecciones incorporadas. El uso de cookies `SameSite=Lax` por defecto añade una capa de protección.
*   **Validación de Datos:** Se utiliza **Zod** en varias partes (especialmente en los formularios de `react-hook-form`) para validar los datos de entrada tanto en el cliente como en el servidor, previniendo datos malformados o maliciosos.
