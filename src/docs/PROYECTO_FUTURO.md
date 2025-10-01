# Propuestas y Hoja de Ruta Futura para NexusAlpri

Este documento detalla, analiza y prioriza las nuevas funcionalidades propuestas para la plataforma NexusAlpri. Cada propuesta incluye una descripción, una estimación de su complejidad técnica, una lista de tareas a realizar y una sugerencia sobre su orden de implementación.

---

## Análisis de Propuestas

A continuación, se desglosa cada una de las funcionalidades solicitadas.

### 1. Alertas y Eventos Periódicos
*   **Propuesta:** Crear eventos que se repitan automáticamente (ej. "Reunión de equipo" todos los lunes a las 7 AM) y alertas interactivas como "Pausas Activas" diarias, donde el usuario pueda confirmar su participación.
*   **Complejidad:** **Media.**
*   **Tareas a Realizar:**
    *   **Modelo de Datos:** Añadir campos `recurrence` (tipo `RecurrenceType`) y `recurrenceEndDate` al modelo `CalendarEvent` en `schema.prisma`.
    *   **Backend:** Actualizar la API de eventos (`/api/events`) para que, al crear/editar, se guarde la regla de recurrencia. La lógica de expansión de eventos (mostrar todas las ocurrencias en un rango) se debe implementar en el servidor.
    *   **Frontend:** Modificar el modal de edición de eventos en la página `/calendar` para incluir controles que permitan al usuario seleccionar una frecuencia (diaria, semanal, mensual) y una fecha de fin para la repetición.
    *   **Alertas Interactivas:** Esto requeriría un nuevo sistema. Habría que diseñar un nuevo tipo de notificación o ventana emergente y un endpoint en la API para registrar la confirmación del usuario.
*   **Prioridad Sugerida:** **1 (Alta).** Es una extensión natural de la funcionalidad de calendario existente y aporta un valor de planificación muy alto.

### 2. Cursos con Prerrequisitos (Escalables)
*   **Propuesta:** Impedir que un usuario pueda inscribirse o realizar un curso (ej. "Nivel 2") si no ha completado previamente otro curso requerido (ej. "Nivel 1").
*   **Complejidad:** **Media.**
*   **Tareas a Realizar:**
    *   **Modelo de Datos:** Añadir una relación de autReferencia en el modelo `Course` para `prerequisiteId`.
    *   **Backend:** Modificar la lógica de inscripción en `/api/enrollments` para verificar si el `userId` ha completado el `prerequisiteId` del curso al que intenta inscribirse.
    *   **Frontend:** En la página de edición de cursos, añadir un selector para elegir un curso como prerrequisito. En la página del catálogo (`/courses`), deshabilitar el botón de inscripción y mostrar un mensaje si no se cumple el requisito.
*   **Prioridad Sugerida:** **2 (Alta).** Es fundamental para crear rutas de aprendizaje estructuradas y asegurar una progresión lógica del conocimiento.

### 3. Cursos Opcionales vs. Obligatorios y Asignación a Usuarios Específicos
*   **Propuesta:** Marcar cursos como "obligatorios" y poder asignarlos no solo a roles, sino también a usuarios individuales.
*   **Complejidad:** **Media.**
*   **Tareas a Realizar:**
    *   **Modelo de Datos:** Añadir un campo booleano `isMandatory` al modelo `Course` y crear una nueva tabla de relación `CourseAssignment` para vincular cursos con usuarios específicos.
    *   **Backend:** Crear nuevos endpoints en la API para gestionar estas asignaciones (`/api/courses/assignments`).
    *   **Frontend:** En el panel de gestión, crear una nueva interfaz para que un admin pueda seleccionar un curso y una lista de usuarios. Modificar el dashboard del estudiante para que muestre una sección destacada "Cursos Obligatorios Pendientes".
*   **Prioridad Sugerida:** **3 (Alta).** Aumenta drásticamente la capacidad de la plataforma para gestionar planes de formación personalizados y de cumplimiento normativo.

### 4. Certificados de Participación
*   **Propuesta:** Generar automáticamente un certificado (ej. en PDF) cuando un usuario completa un curso.
*   **Complejidad:** **Alta.**
*   **Tareas a Realizar:**
    *   **Diseño de Plantillas:** Crear una nueva sección en el panel de administrador para subir una imagen de fondo y posicionar campos (nombre de usuario, nombre del curso, fecha).
    *   **Backend:** Integrar una librería de generación de PDFs (como `pdf-lib` o `Puppeteer`) en el servidor. Crear un nuevo endpoint (`/api/courses/[id]/certificate`) que genere el PDF bajo demanda.
    *   **Frontend:** Al completar un curso, mostrar un nuevo botón "Descargar Certificado". Añadir una nueva sección en el perfil del usuario para ver todos sus certificados.
*   **Prioridad Sugerida:** **4 (Media).** Aporta un gran valor de gamificación y reconocimiento, pero la generación de PDFs en el servidor es técnicamente exigente.

### 5. Documentos: Auditoría de Cambios y Ciclo de Vida
*   **Propuesta:** Poder crear y editar documentos directamente en la plataforma (no solo subirlos) y llevar un registro de quién y cuándo hizo cambios. Añadir analíticas sobre la vigencia de los documentos.
*   **Complejidad:** **Alta.**
*   **Tareas a Realizar:**
    *   **Frontend:** Integrar un editor de texto enriquecido avanzado (como `Tiptap` o una versión más completa de `Quill`) en la sección de "Biblioteca de Recursos".
    *   **Backend:** Modificar el modelo `EnterpriseResource` para guardar el contenido como texto/HTML. Crear una tabla `ResourceVersion` para guardar un historial de cambios.
    *   **Analíticas de Vigencia:** Añadir un campo `expiresAt` al modelo `EnterpriseResource`. Crear un "Cron Job" (tarea programada) que verifique diariamente los documentos próximos a expirar y envíe notificaciones.
*   **Prioridad Sugerida:** **5 (Media).** Es una funcionalidad muy potente para la gestión documental, pero el sistema de versionado es complejo.

### 6. Ranking de Competencia en Cursos
*   **Propuesta:** Generar un ranking de usuarios dentro de un curso específico, basado en su rendimiento (puntuaciones de quizzes, velocidad de completado, etc.).
*   **Complejidad:** **Media.**
*   **Tareas a Realizar:**
    *   **Backend:** Desarrollar la lógica en un nuevo endpoint (`/api/courses/[id]/ranking`) para calcular y ordenar las puntuaciones de los usuarios.
    *   **Frontend:** Añadir una nueva pestaña llamada "Ranking" o "Clasificación" dentro de la vista de un curso, con una tabla de clasificación visual (ej. con podio).
*   **Prioridad Sugerida:** **6 (Baja-Media).** Es una excelente mejora de gamificación que puede implementarse una vez que el sistema de quizzes y progreso sea robusto.

### 7. Formularios Periódicos
*   **Propuesta:** Programar que un formulario (ej. encuesta de satisfacción) se envíe o se active automáticamente en una fecha periódica (ej. el día 30 de cada mes).
*   **Complejidad:** **Alta.**
*   **Tareas a Realizar:**
    *   **Backend:** Configurar un sistema de "trabajos programados" (Cron Jobs) en el servidor. Esto requiere configuración a nivel de infraestructura y una lógica para clonar y asignar los formularios en las fechas programadas.
    *   **Frontend:** Añadir nuevas opciones en la configuración de un formulario para permitir al creador establecer una frecuencia de repetición (mensual, trimestral, etc.).
*   **Prioridad Sugerida:** **7 (Baja).** Es una automatización útil pero muy específica, adecuada para una fase de madurez de la plataforma.

### 8. Mensajes de Motivación (Ventanas Emergentes)
*   **Propuesta:** Mostrar mensajes emergentes de felicitación o ánimo en momentos clave (ej. al completar un curso, al subir de nivel).
*   **Complejidad:** **Baja.**
*   **Tareas a Realizar:**
    *   **Frontend:** Identificar los puntos clave en el flujo del usuario (ej. al presionar "Calcular Puntuación Final" o cuando el `user.level` cambia) y llamar a la función `toast()` ya existente con mensajes y estilos apropiados.
*   **Prioridad Sugerida:** **8 (¡Empecemos por aquí!).** Es un "quick win" (victoria rápida) que mejora significativamente la experiencia del usuario con un esfuerzo de desarrollo relativamente bajo.

### 9. Evaluaciones de Cursos Externos
*   **Propuesta:** Permitir crear y asignar evaluaciones que no estén ligadas a un curso de la plataforma, para validar conocimientos adquiridos por fuera.
*   **Complejidad:** **Baja-Media.**
*   **Tareas a Realizar:**
    *   **Backend/Frontend:** Modificar el sistema de Formularios (`/forms`) para que la asociación con un curso/lección sea opcional. Crear una nueva sección o pestaña en la página `/forms` para listar estos "formularios independientes".
*   **Prioridad Sugerida:** **9 (Baja).** Extiende una funcionalidad ya existente para un nuevo y útil caso de uso con un esfuerzo moderado.

### 10. Chats y Videollamadas en Vivo
*   **Propuesta:** Añadir chats (públicos y privados) y la capacidad de realizar cursos en vivo con grabación de pantalla y videollamadas.
*   **Complejidad:** **Muy Alta.**
*   **Tareas a Realizar:**
    *   **Integración de Servicios Externos:** Investigar, contratar e integrar servicios especializados de terceros para la gestión de video en tiempo real (ej. Mux, Twilio Video) y de WebSockets para los chats (ej. Pusher, Ably).
    *   **Diseño Completo:** Diseñar y construir desde cero una nueva interfaz de chat y una nueva interfaz de "aula virtual" para las transmisiones en vivo.
    *   **Backend:** Desarrollar toda la lógica de autenticación y gestión de salas.
*   **Prioridad Sugerida:** **10 (Largo Plazo).** Es una funcionalidad de enorme envergadura, a considerar una vez que el resto de la plataforma esté completamente maduro y probado.

---

## Hoja de Ruta Sugerida

Basado en el análisis anterior, este sería un posible orden de implementación para maximizar el valor en cada fase:

1.  **Fase 1 (Funcionalidades Fundamentales de Formación):**
    *   **Eventos Periódicos.**
    *   Cursos con Prerrequisitos.
    *   Asignación de Cursos Opcionales/Obligatorios.

2.  **Fase 2 (Mejora de la Experiencia y Reconocimiento):**
    *   **Mensajes de Motivación.** (Quick Win)
    *   Certificados de Participación.
    *   Ranking de Competencia por Curso.

3.  **Fase 3 (Gestión de Contenido y Evaluaciones Avanzadas):**
    *   Gestión Avanzada de Documentos.
    *   Evaluaciones para Cursos Externos.
    *   Formularios Periódicos.

4.  **Fase 4 (Largo Plazo - Funcionalidades en Tiempo Real):**
    *   Sistema de Chats y Videollamadas.
    *   Cursos en Vivo.
