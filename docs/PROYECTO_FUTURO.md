# Propuestas y Hoja de Ruta Futura para NexusAlpri

Este documento detalla, analiza y prioriza las nuevas funcionalidades propuestas para la plataforma NexusAlpri. Cada propuesta incluye una descripción, una estimación de su complejidad técnica, una lista de tareas a realizar y una sugerencia sobre su orden de implementación.

---

## Análisis de Propuestas

A continuación, se desglosa cada una de las funcionalidades solicitadas.

### 1. Alertas y Eventos Periódicos
*   **Propuesta:** Crear eventos que se repitan automáticamente (ej. "Reunión de equipo" todos los lunes a las 7 AM) y alertas interactivas como "Pausas Activas" diarias, donde el usuario pueda confirmar su participación.
*   **Complejidad:** **Media.**
*   **Tareas a Realizar:**
    *   **Backend:** Modificar el modelo `CalendarEvent` en `schema.prisma` para añadir campos de recurrencia (`recurrenceType`, `recurrenceEndDate`).
    *   **Backend:** Crear un nuevo modelo `EventParticipation` para registrar la asistencia del usuario.
    *   **Backend:** Actualizar la API de eventos (`/api/events`) para guardar las reglas de recurrencia.
    *   **Backend:** Crear una nueva API (`/api/events/[id]/participate`) para que los usuarios confirmen su asistencia.
    *   **Frontend:** Modificar la interfaz del editor de eventos para incluir controles de selección de frecuencia (Diaria, Semanal, etc.).
    *   **Frontend:** Implementar la lógica en el calendario para calcular y mostrar las ocurrencias de los eventos recurrentes.
*   **Prioridad Sugerida:** **1 (Alta).** Es una extensión natural de la funcionalidad de calendario existente y aporta un valor de planificación muy alto.

### 2. Cursos con Prerrequisitos (Escalables)
*   **Propuesta:** Impedir que un usuario pueda inscribirse o realizar un curso (ej. "Nivel 2") si no ha completado previamente otro curso requerido (ej. "Nivel 1").
*   **Complejidad:** **Media.**
*   **Tareas a Realizar:**
    *   **Backend:** Modificar el modelo `Course` en `schema.prisma` para añadir una relación de prerrequisitos (ej. `prerequisiteCourseId`).
    *   **Backend:** Actualizar la lógica de la API de inscripción (`/api/enrollments`) para verificar si el usuario ha completado el curso prerrequisito.
    *   **Frontend:** En la página de edición de cursos, añadir una opción para seleccionar el curso prerrequisito.
    *   **Frontend:** En el catálogo y en la página del curso, mostrar claramente cuál es el prerrequisito y deshabilitar la inscripción si no se cumple.
*   **Prioridad Sugerida:** **2 (Alta).** Es fundamental para crear rutas de aprendizaje estructuradas y asegurar una progresión lógica del conocimiento.

### 3. Cursos Opcionales vs. Obligatorios y Asignación a Usuarios Específicos
*   **Propuesta:** Marcar cursos como "obligatorios" y poder asignarlos no solo a roles, sino también a usuarios individuales.
*   **Complejidad:** **Media.**
*   **Tareas a Realizar:**
    *   **Backend:** Añadir un campo `isMandatory` (booleano) al modelo `Course`.
    *   **Backend:** Crear una nueva tabla de relación (`_MandatoryCourseToUser`) para vincular cursos obligatorios con usuarios específicos.
    *   **Backend:** Crear una nueva API para gestionar estas asignaciones.
    *   **Frontend:** En la gestión de cursos, añadir un interruptor para marcar un curso como "Obligatorio".
    *   **Frontend:** Crear una nueva interfaz para buscar y asignar cursos obligatorios a usuarios individuales.
    *   **Frontend:** En el dashboard del estudiante, mostrar una sección destacada para "Cursos Obligatorios Pendientes".
*   **Prioridad Sugerida:** **3 (Alta).** Aumenta drásticamente la capacidad de la plataforma para gestionar planes de formación personalizados y de cumplimiento normativo.

### 4. Certificados de Participación
*   **Propuesta:** Generar automáticamente un certificado (ej. en PDF) cuando un usuario completa un curso.
*   **Complejidad:** **Alta.**
*   **Tareas a Realizar:**
    *   **Backend:** Integrar una librería de generación de PDFs (como `pdf-lib` o `puppeteer`).
    *   **Backend:** Crear una nueva API (`/api/courses/[id]/certificate`) que genere el certificado con los datos del usuario y el curso.
    *   **Frontend:** En la página de edición de cursos, añadir una sección para diseñar o subir una plantilla de certificado.
    *   **Frontend:** En la vista del curso, una vez completado, mostrar un botón para "Descargar Certificado".
    *   **Frontend:** En el perfil del usuario, mostrar una sección con los certificados obtenidos.
*   **Prioridad Sugerida:** **4 (Media).** Aporta un gran valor de gamificación y reconocimiento, pero depende de que el sistema de progreso esté 100% pulido.

### 5. Documentos: Auditoría de Cambios y Ciclo de Vida
*   **Propuesta:** Poder crear y editar documentos directamente en la plataforma (no solo subirlos) y llevar un registro de quién y cuándo hizo cambios. Añadir analíticas sobre la vigencia de los documentos.
*   **Complejidad:** **Alta.**
*   **Tareas a Realizar:**
    *   **Backend:** Integrar un campo de tipo `JSON` en el modelo `EnterpriseResource` para guardar el contenido del editor de texto.
    *   **Backend:** Crear un nuevo modelo `DocumentVersion` para guardar un historial de cambios.
    *   **Backend:** Modificar la API de recursos para que guarde una nueva versión en cada actualización.
    *   **Frontend:** Integrar un editor de texto enriquecido avanzado en la sección de recursos.
    *   **Frontend:** Crear una vista de "Historial de Cambios" para cada documento.
    *   **Frontend:** En el dashboard de analíticas, añadir una sección que alerte sobre documentos próximos a su fecha de expiración.
*   **Prioridad Sugerida:** **5 (Media).** Es una funcionalidad muy potente para la gestión documental, pero técnicamente exigente.

### 6. Ranking de Competencia en Cursos
*   **Propuesta:** Generar un ranking de usuarios dentro de un curso específico, basado en su rendimiento (puntuaciones de quizzes, velocidad de completado, etc.).
*   **Complejidad:** **Media.**
*   **Tareas a Realizar:**
    *   **Backend:** Crear una nueva API (`/api/courses/[id]/ranking`) que calcule y ordene a los usuarios según una fórmula de puntuación definida (puntuación de quizzes, tiempo, etc.).
    *   **Frontend:** En la vista del curso, añadir una nueva pestaña o sección para mostrar la tabla de clasificación (ranking).
    *   **Frontend:** Diseñar una interfaz visual atractiva para el ranking (ej. podio para los 3 primeros).
*   **Prioridad Sugerida:** **6 (Media).** Es una excelente mejora de gamificación que puede implementarse una vez que el sistema de quizzes y progreso sea robusto.

### 7. Formularios Periódicos
*   **Propuesta:** Programar que un formulario (ej. encuesta de satisfacción) se envíe o se active automáticamente en una fecha periódica (ej. el día 30 de cada mes).
*   **Complejidad:** **Alta.**
*   **Tareas a Realizar:**
    *   **Backend:** Configurar un sistema de trabajos programados (Cron Job) en el servidor (ej. usando Vercel Cron Jobs).
    *   **Backend:** Crear un script que se ejecute diariamente, verifique qué formularios deben replicarse y cree nuevas "instancias" de esos formularios.
    *   **Backend:** Modificar el modelo `Form` para añadir reglas de recurrencia.
    *   **Frontend:** En la configuración del formulario, añadir opciones para definir la periodicidad.
*   **Prioridad Sugerida:** **7 (Baja).** Es una automatización útil pero muy específica.

### 8. Mensajes de Motivación (Ventanas Emergentes)
*   **Propuesta:** Mostrar mensajes emergentes de felicitación o ánimo en momentos clave (ej. al completar un curso, al subir de nivel).
*   **Complejidad:** **Baja.**
*   **Tareas a Realizar:**
    *   **Frontend:** Usar el sistema de `Toast` existente para mostrar los mensajes.
    *   **Frontend:** Disparar los `toasts` en los callbacks de las llamadas a la API correspondientes (ej. después de que la API de `consolidate` devuelva una finalización exitosa).
    *   **Frontend:** Diseñar diferentes estilos de `toast` para felicitaciones, ánimo, etc.
*   **Prioridad Sugerida:** **8 (Baja).** Es un "quick win" que mejora la experiencia del usuario con un esfuerzo relativamente bajo.

### 9. Evaluaciones de Cursos Externos
*   **Propuesta:** Permitir crear y asignar evaluaciones que no estén ligadas a un curso de la plataforma, para validar conocimientos adquiridos por fuera.
*   **Complejidad:** **Baja-Media.**
*   **Tareas a Realizar:**
    *   **Backend:** Modificar el modelo `Form` para permitir que un formulario no esté asociado a una lección (hacer `lessonId` opcional).
    *   **Backend:** Ajustar la API de formularios para manejar la creación de "formularios independientes".
    *   **Frontend:** Modificar la interfaz de creación de formularios para permitir crear uno sin asociarlo a un curso.
    *   **Frontend:** En la sección `/forms`, mostrar una nueva categoría o pestaña para estos formularios independientes.
*   **Prioridad Sugerida:** **9 (Baja).** Extiende una funcionalidad ya existente para un nuevo caso de uso.

### 10. Chats y Videollamadas en Vivo
*   **Propuesta:** Añadir chats (públicos y privados) y la capacidad de realizar cursos en vivo con grabación de pantalla y videollamadas.
*   **Complejidad:** **Muy Alta.**
*   **Tareas a Realizar:**
    *   **Backend:** Integrar una tecnología de tiempo real como WebSockets (ej. usando `socket.io` o servicios de terceros).
    *   **Backend:** Integrar un servicio externo de videollamadas como WebRTC, Mux o Twilio.
    *   **Backend:** Crear nuevos modelos de base de datos para `ChatRoom`, `ChatMessage` y `LiveSession`.
    *   **Backend:** Desarrollar un conjunto completo de APIs para gestionar salas, mensajes, grabaciones y participantes.
    *   **Frontend:** Construir la interfaz de chat (mensajes, lista de usuarios, subida de archivos).
    *   **Frontend:** Construir la interfaz de videollamada y gestión de la sesión en vivo.
*   **Prioridad Sugerida:** **10 (Largo Plazo).** Es una funcionalidad de enorme envergadura, a considerar una vez que el resto de la plataforma esté completamente maduro.

---

## Hoja de Ruta Sugerida

Basado en el análisis anterior, este sería un posible orden de implementación para maximizar el valor en cada fase:

1.  **Fase 1 (Fundacional):**
    *   Eventos Periódicos.
    *   Cursos con Prerrequisitos.
    *   Asignación de Cursos Opcionales/Obligatorios a usuarios.

2.  **Fase 2 (Gamificación y Reconocimiento):**
    *   Certificados de Participación.
    *   Ranking de Competencia por Curso.
    *   Mensajes de Motivación.

3.  **Fase 3 (Gestión de Contenido Avanzada):**
    *   Auditoría de Cambios en Documentos.
    *   Evaluaciones para Cursos Externos.
    *   Formularios Periódicos.

4.  **Fase 4 (Largo Plazo - Tiempo Real):**
    *   Sistema de Chats.
    *   Cursos en Vivo y Videollamadas.