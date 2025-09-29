# Propuestas y Hoja de Ruta Futura para NexusAlpri

Este documento detalla, analiza y prioriza las nuevas funcionalidades propuestas para la plataforma NexusAlpri. Cada propuesta incluye una descripción, una estimación de su complejidad técnica y una sugerencia sobre su orden de implementación.

---

## Análisis de Propuestas

A continuación, se desglosa cada una de las funcionalidades solicitadas.

### 1. Alertas y Eventos Periódicos
*   **Propuesta:** Crear eventos que se repitan automáticamente (ej. "Reunión de equipo" todos los lunes a las 7 AM) y alertas interactivas como "Pausas Activas" diarias, donde el usuario pueda confirmar su participación.
*   **Complejidad:** **Media.**
*   **Análisis Técnico:** Requiere modificar el modelo `CalendarEvent` para añadir reglas de recurrencia (ej. `recurrenceType`, `recurrenceEndDate`). La lógica del backend deberá "expandir" estos eventos para mostrarlos en el calendario en las fechas correctas. La parte interactiva (confirmar asistencia a pausa activa) necesitaría un nuevo modelo en la base de datos (`EventParticipation`) y una API para registrar la interacción.
*   **Prioridad Sugerida:** **1 (Alta).** Es una extensión natural de la funcionalidad de calendario existente y aporta un valor de planificación muy alto.

### 2. Cursos con Prerrequisitos (Escalables)
*   **Propuesta:** Impedir que un usuario pueda inscribirse o realizar un curso (ej. "Nivel 2") si no ha completado previamente otro curso requerido (ej. "Nivel 1").
*   **Complejidad:** **Media.**
*   **Análisis Técnico:** Se necesita añadir una relación en el modelo `Course` para definir prerrequisitos (ej. `prerequisiteCourseId`). La lógica de la API de inscripción (`/api/enrollments`) deberá ser modificada para verificar si el usuario ha completado el curso requerido antes de permitir la nueva inscripción. La interfaz de usuario también debe mostrar claramente esta dependencia.
*   **Prioridad Sugerida:** **2 (Alta).** Es fundamental para crear rutas de aprendizaje estructuradas y asegurar una progresión lógica del conocimiento.

### 3. Cursos Opcionales vs. Obligatorios y Asignación a Usuarios Específicos
*   **Propuesta:** Marcar cursos como "obligatorios" y poder asignarlos no solo a roles, sino también a usuarios individuales.
*   **Complejidad:** **Media.**
*   **Análisis Técnico:** Implica añadir un campo `isMandatory` al modelo `Course` y crear una nueva tabla de relación (`_MandatoryCourseToUser`) para vincular cursos obligatorios con usuarios específicos. Se necesitarían nuevas secciones en la interfaz de administración para gestionar estas asignaciones y notificaciones para los usuarios.
*   **Prioridad Sugerida:** **3 (Alta).** Aumenta drásticamente la capacidad de la plataforma para gestionar planes de formación personalizados y de cumplimiento normativo.

### 4. Certificados de Participación
*   **Propuesta:** Generar automáticamente un certificado (ej. en PDF) cuando un usuario completa un curso.
*   **Complejidad:** **Alta.**
*   **Análisis Técnico:** Esta es una funcionalidad compleja. Requeriría una librería en el backend (como `pdf-lib` o `puppeteer`) para generar PDFs a partir de una plantilla HTML/CSS. Se necesitaría una nueva API para disparar la generación y descarga del certificado. La plantilla del certificado debería ser personalizable desde el panel de administración.
*   **Prioridad Sugerida:** **4 (Media).** Aporta un gran valor de gamificación y reconocimiento, pero depende de que el sistema de progreso y finalización de cursos esté 100% pulido.

### 5. Documentos: Auditoría de Cambios y Ciclo de Vida
*   **Propuesta:** Poder crear y editar documentos directamente en la plataforma (no solo subirlos) y llevar un registro de quién y cuándo hizo cambios. Añadir analíticas sobre la vigencia de los documentos.
*   **Complejidad:** **Alta.**
*   **Análisis Técnico:** "Crear y editar" implica integrar un editor de texto enriquecido muy avanzado (casi un mini Google Docs) y almacenar el contenido de forma estructurada. La "huella de modificación" requiere una tabla de auditoría (`DocumentVersion`) que guarde snapshots de cada cambio. Las analíticas de vigencia se basarían en la fecha de expiración que ya hemos añadido.
*   **Prioridad Sugerida:** **5 (Media).** Es una funcionalidad muy potente para la gestión documental, pero técnicamente exigente.

### 6. Ranking de Competencia en Cursos
*   **Propuesta:** Generar un ranking de usuarios dentro de un curso específico, basado en su rendimiento (puntuaciones de quizzes, velocidad de completado, etc.).
*   **Complejidad:** **Media.**
*   **Análisis Técnico:** Se basa en los datos de progreso y quizzes que ya recolectamos. Requeriría una nueva API (`/api/courses/[id]/ranking`) que calcule y ordene a los usuarios según una fórmula de puntuación definida. Se necesitaría una nueva vista en la interfaz para mostrar este ranking.
*   **Prioridad Sugerida:** **6 (Media).** Es una excelente mejora de gamificación que puede implementarse una vez que el sistema de quizzes y progreso sea robusto.

### 7. Formularios Periódicos
*   **Propuesta:** Programar que un formulario (ej. encuesta de satisfacción) se envíe o se active automáticamente en una fecha periódica (ej. el día 30 de cada mes).
*   **Complejidad:** **Alta.**
*   **Análisis Técnico:** Similar a los eventos periódicos, pero más complejo. Se necesitaría un sistema de "trabajos programados" (Cron Job) en el servidor que se ejecute diariamente, verifique qué formularios deben replicarse o asignarse, y cree nuevas "instancias" de esos formularios para los usuarios correspondientes, enviando notificaciones.
*   **Prioridad Sugerida:** **7 (Baja).** Es una automatización útil pero muy específica.

### 8. Mensajes de Motivación (Ventanas Emergentes)
*   **Propuesta:** Mostrar mensajes emergentes de felicitación o ánimo en momentos clave (ej. al completar un curso, al subir de nivel).
*   **Complejidad:** **Baja.**
*   **Análisis Técnico:** Se puede implementar en el frontend. Usando el `AuthContext` y el sistema de `Toast`, podemos disparar estos mensajes cuando se detecte un cambio relevante (ej. después de una llamada exitosa a la API para completar un curso). No requiere cambios significativos en el backend.
*   **Prioridad Sugerida:** **8 (Baja).** Es un "quick win" que mejora la experiencia del usuario con un esfuerzo relativamente bajo.

### 9. Evaluaciones de Cursos Externos
*   **Propuesta:** Permitir crear y asignar evaluaciones que no estén ligadas a un curso de la plataforma, para validar conocimientos adquiridos por fuera.
*   **Complejidad:** **Baja-Media.**
*   **Análisis Técnico:** El sistema de "Formularios" que ya existe es la base perfecta. Solo necesitaríamos desacoplar un formulario de la necesidad de pertenecer a una lección. Se podría añadir un tipo de "Formulario Independiente" que se pueda compartir y cuyos resultados se vean de forma centralizada.
*   **Prioridad Sugerida:** **9 (Baja).** Extiende una funcionalidad ya existente para un nuevo caso de uso.

### 10. Chats y Videollamadas en Vivo
*   **Propuesta:** Añadir chats (públicos y privados) y la capacidad de realizar cursos en vivo con grabación de pantalla y videollamadas.
*   **Complejidad:** **Muy Alta.**
*   **Análisis Técnico:** Esta es, con diferencia, la propuesta más compleja. Requiere tecnología de tiempo real (WebSockets) para los chats y una integración con servicios de terceros como WebRTC (para video) o plataformas como Mux/Twilio. Implica un rediseño masivo de la arquitectura para soportar comunicación en tiempo real, almacenamiento de grabaciones y gestión de "salas" virtuales.
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
```