# Plan de Pruebas Funcionales - Rol Estudiante

Este documento describe las acciones a verificar para el rol de **Estudiante**.

**Credenciales de Prueba:**
*   **Usuario 1 (con progreso):**
    *   **Email:** `laura.gomez@nexus.com`
    *   **Contraseña:** `nexuspro`
*   **Usuario 2 (sin progreso):**
    *   **Email:** `carlos.santana@nexus.com`
    *   **Contraseña:** `nexuspro`

---

### 1. Panel Principal (`/dashboard`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **1.1. Ver el dashboard (Laura)** | Inicia sesión como Laura. El dashboard debe mostrar que está inscrita en 1 curso y debe ver el "Anuncio de Bienvenida". |

### 2. Catálogo de Cursos (`/courses`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **2.1. Explorar cursos (Carlos)** | Inicia sesión como Carlos. Debe ver el "Curso de Bienvenida". No debe ver el "Curso de Marketing Digital" porque ya está inscrito. |
| **2.2. Inscribirse a un curso (Carlos)** | Inscríbete al "Curso de Bienvenida". El curso debe desaparecer de esta página y aparecer en "Mis Cursos". |

### 3. Mis Cursos (`/my-courses`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **3.1. Ver cursos inscritos (Laura)** | Como Laura, la página debe mostrar la tarjeta del "Curso de Marketing Digital" con un progreso del 25%. |
| **3.2. Cancelar inscripción (Carlos)** | Como Carlos, ve a "Mis Cursos" y cancela la inscripción del "Curso de Marketing Digital". El curso debe desaparecer de esta lista. |

### 4. Consumo de un Curso (`/courses/[courseId]`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **4.1. Acceder al contenido (Laura)** | Como Laura, entra al "Curso de Marketing Digital". La primera lección de "Introducción" debe estar marcada como completada. |
| **4.2. Completar una lección (Laura)** | Haz clic en la lección "Video: ¿Qué es el SEO?". El sistema debe marcarla automáticamente como completada y el progreso del curso debe aumentar. |
| **4.3. Realizar un quiz (Laura)** | Ve a la lección del quiz y respóndelo. Al enviarlo, el sistema debe mostrarte tu puntuación y marcar la lección como completada. |
| **4.4. Tomar apuntes (Laura)** | En cualquier lección, abre el panel de "Mis Apuntes" y escribe algo. Cierra y vuelve a abrir para verificar que se guardó. Luego, ve a la página `/my-notes` para ver tu apunte allí. |

### 5. Biblioteca de Recursos (`/resources`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **5.1. Navegar y ver recursos** | Ve a la biblioteca. Deberías poder entrar a la carpeta "Documentos de RRHH" y ver el archivo "Guía de Beneficios". |
| **5.2. Acceder a recurso protegido** | Haz clic en "Guía de Beneficios". El sistema te pedirá un PIN. Ingresa `1234`. Deberías poder previsualizar o descargar el archivo. |

### 6. Perfil (`/profile`)

| Acción a Realizar | Verificación Esperada |
| :--- | :--- |
| **6.1. Ver progreso y logros** | Como Laura, ve a tu perfil. Deberías ver tus puntos de experiencia (XP) y el logro "Primer Paso" por tu primera inscripción. |
| **6.2. Editar información** | Cambia tu nombre. El cambio debe reflejarse en la tarjeta de perfil y en la barra superior. |