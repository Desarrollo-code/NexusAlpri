# Documento de Requisitos de Software (DRS) - NexusAlpri

## 1. Introducción

### 1.1. Visión del Producto
NexusAlpri es una plataforma de e-learning corporativa integral, diseñada para que las microempresas y organizaciones gestionen de manera centralizada su ciclo completo de formación interna. El objetivo es proporcionar una herramienta intuitiva, segura y potente que permita la creación de contenido, la gestión de cursos, la inscripción de usuarios y el seguimiento detallado del progreso, fomentando una cultura de aprendizaje continuo.

### 1.2. Alcance del Proyecto
Este documento cubre los requisitos para la plataforma NexusAlpri. El sistema gestionará tres roles de usuario (Estudiante, Instructor, Administrador) con funcionalidades específicas para cada uno. El alcance incluye:
*   Gestión de usuarios y autenticación (incluyendo 2FA).
*   Creación y gestión completa de cursos, módulos y lecciones con contenido multimedia.
*   Sistema de inscripción y seguimiento del progreso del estudiante.
*   Biblioteca de recursos centralizada con control de acceso.
*   Módulos de comunicación (anuncios y calendario).
*   Sistema de gamificación (puntos y logros).
*   Panel de administración para la configuración global de la plataforma.

Funcionalidades como la integración con sistemas de RRHH externos o la venta de cursos a terceros están fuera del alcance actual.

### 1.3. Partes Interesadas
*   **Usuarios Finales:** Estudiantes, Instructores, Administradores.
*   **Propietarios del Producto:** Responsables de la visión y estrategia de la plataforma.
*   **Equipo de Desarrollo:** Encargados de diseñar, construir y mantener el software.

---

## 2. Requisitos Funcionales

### 2.1. Autenticación y Perfil (RF-AUTH)
*   **RF-AUTH-01:** El sistema deberá permitir a los usuarios registrarse creando una cuenta con nombre, email y contraseña, sujeto a la configuración de registro público.
*   **RF-AUTH-02:** El sistema deberá permitir a los usuarios iniciar sesión con su email y contraseña.
*   **RF-AUTH-03:** El sistema deberá implementar un mecanismo de Autenticación de Dos Factores (2FA) que los usuarios pueden activar opcionalmente.
*   **RF-AUTH-04:** El sistema deberá permitir a un usuario ver y editar su propio nombre y foto de perfil.
*   **RF-AUTH-05:** El sistema deberá permitir a un usuario cambiar su propia contraseña, requiriendo la contraseña actual.
*   **RF-AUTH-06:** El sistema deberá permitir cerrar la sesión de forma segura.

### 2.2. Gestión de Cursos (RF-CUR)
*   **RF-CUR-01:** El sistema deberá permitir a los Instructores y Administradores crear un nuevo curso definiendo un título, descripción y categoría.
*   **RF-CUR-02:** El sistema deberá permitir estructurar un curso en módulos y lecciones.
*   **RF-CUR-03:** El sistema deberá permitir reordenar módulos y lecciones mediante una interfaz de "arrastrar y soltar" (Drag & Drop).
*   **RF-CUR-04:** El sistema deberá permitir añadir a cada lección bloques de contenido de tipo: texto enriquecido, video de YouTube, enlace externo, archivo descargable (PDF, imagen, etc.) y quiz.
*   **RF-CUR-05:** El sistema deberá permitir a los creadores de cursos cambiar el estado de un curso entre `BORRADOR`, `PUBLICADO` y `ARCHIVADO`.
*   **RF-CUR-06:** El sistema deberá mostrar a los estudiantes únicamente los cursos en estado `PUBLICADO` en el catálogo.
*   **RF-CUR-07:** El sistema deberá permitir a los estudiantes inscribirse y cancelar la inscripción de los cursos publicados.

### 2.3. Progreso del Estudiante (RF-PROG)
*   **RF-PROG-01:** El sistema deberá marcar una lección como completada automáticamente cuando el usuario interactúa con ella (ej. la selecciona o finaliza un video).
*   **RF-PROG-02:** El sistema deberá guardar la puntuación obtenida por un estudiante al enviar un quiz.
*   **RF-PROG-03:** El sistema deberá calcular una puntuación final ponderada para un curso solo después de que el estudiante haya interactuado con todas las lecciones y lo solicite explícitamente.

### 2.4. Administración (RF-ADMIN)
*   **RF-ADMIN-01:** El sistema deberá permitir a los Administradores visualizar una lista de todos los usuarios.
*   **RF-ADMIN-02:** El sistema deberá permitir a los Administradores crear, editar y eliminar usuarios.
*   **RF-ADMIN-03:** El sistema deberá permitir a los Administradores cambiar el rol de cualquier usuario.
*   **RF-ADMIN-04:** El sistema deberá permitir a los Administradores activar e inactivar cuentas de usuario.
*   **RF-ADMIN-05:** El sistema deberá proporcionar a los Administradores un panel para configurar ajustes globales, incluyendo:
    *   Nombre de la plataforma y logos.
    *   Habilitar/deshabilitar el registro público.
    *   Políticas de complejidad de contraseñas.
    *   Configuración de cierre de sesión por inactividad.

---

## 3. Requisitos No Funcionales

### 3.1. Rendimiento
*   **RNF-PERF-01:** El tiempo de carga inicial de cualquier página de la aplicación no debe superar los 3 segundos en una conexión de banda ancha estándar.
*   **RNF-PERF-02:** Las respuestas de la API para operaciones comunes (ej. obtener lista de cursos) deben completarse en menos de 500 ms.

### 3.2. Seguridad
*   **RNF-SEC-01:** Todas las contraseñas de usuario deben almacenarse en la base de datos utilizando un algoritmo de hash fuerte (ej. bcrypt).
*   **RNF-SEC-02:** La sesión del usuario se gestionará mediante JSON Web Tokens (JWT) almacenados en cookies `http-only` para mitigar ataques XSS.
*   **RNF-SEC-03:** El acceso a las rutas protegidas y a los endpoints de la API debe ser validado por un middleware que verifique la sesión activa del usuario y su rol.
*   **RNF-SEC-04:** El sistema debe contar con un registro de auditoría (`SecurityLog`) que registre eventos críticos como inicios de sesión (exitosos y fallidos), cambios de rol y cambios de contraseña.

### 3.3. Usabilidad
*   **RNF-USA-01:** La interfaz de usuario debe ser completamente responsiva y funcional en los principales navegadores web (Chrome, Firefox, Safari, Edge) y en dispositivos móviles.
*   **RNF-USA-02:** El flujo para una tarea crítica, como la inscripción a un curso, no debe requerir más de 3 clics desde el catálogo.
*   **RNF-USA-03:** La plataforma debe ser accesible, cumpliendo con las pautas de WCAG 2.1 Nivel AA.

### 3.4. Escalabilidad
*   **RNF-ESC-01:** La arquitectura debe ser capaz de soportar un crecimiento de hasta 1,000 usuarios concurrentes sin una degradación significativa del rendimiento.

### 3.5. Mantenibilidad
*   **RNF-MANT-01:** El código fuente debe seguir una guía de estilo consistente (ej. Prettier) y estar organizado en una estructura modular y lógica (como se detalla en el Manual Técnico).

---

## 4. Casos de Uso Principales

### 4.1. Caso de Uso: Inscribirse a un Curso
*   **Actor:** Estudiante.
*   **Precondición:** El estudiante ha iniciado sesión en la plataforma.
*   **Flujo de Eventos:**
    1.  El estudiante navega al "Catálogo de Cursos".
    2.  El estudiante busca o selecciona un curso de su interés.
    3.  El estudiante hace clic en el botón "Inscribirse".
*   **Postcondiciones:**
    1.  Se crea un registro de inscripción (`Enrollment`) que vincula al estudiante con el curso.
    2.  Se crea un registro de progreso (`CourseProgress`) para el estudiante en ese curso.
    3.  El curso ahora aparece en la sección "Mis Cursos" del estudiante.
    4.  El botón en el catálogo cambia a "Continuar Curso" o similar.

### 4.2. Caso de Uso: Crear un Nuevo Usuario (Admin)
*   **Actor:** Administrador.
*   **Precondición:** El administrador ha iniciado sesión en la plataforma.
*   **Flujo de Eventos:**
    1.  El administrador navega a la sección "Gestión de Usuarios".
    2.  El administrador hace clic en "Añadir Nuevo Usuario".
    3.  El administrador completa el formulario con el nombre, email, contraseña inicial y rol del nuevo usuario.
    4.  El administrador guarda el formulario.
*   **Postcondiciones:**
    1.  Se crea un nuevo registro de `User` en la base de datos con la información proporcionada.
    2.  El nuevo usuario aparece en la lista de usuarios.
    3.  El nuevo usuario puede iniciar sesión con las credenciales creadas.

---

## 5. Dependencias y Restricciones

### 5.1. Dependencias Externas
*   **Base de Datos:** El sistema depende de una instancia de PostgreSQL, preferiblemente gestionada a través de **Supabase**.
*   **Almacenamiento de Archivos:** El sistema requiere un servicio de almacenamiento compatible con S3, como **Supabase Storage**.
*   **Entorno de Despliegue:** La aplicación está optimizada para su despliegue en **Vercel**.
*   **Envío de Correos:** Las notificaciones por correo electrónico dependen de la API de **Resend**.

### 5.2. Restricciones
*   **Stack Tecnológico:** El proyecto debe desarrollarse utilizando el stack definido: Next.js (App Router), TypeScript, Prisma, Tailwind CSS y ShadCN. No se deben introducir otros frameworks o librerías que alteren fundamentalmente esta arquitectura sin una justificación formal.

---
Este documento servirá como una guía estricta para el desarrollo y la validación de NexusAlpri.